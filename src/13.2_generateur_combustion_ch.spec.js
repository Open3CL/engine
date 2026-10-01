import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler la logique de calcul :
 * - `enums` (import par défaut) : mapping type de générateur / type d'énergie, qui
 *   sélectionne la branche de calcul du rendement et le coefficient K ;
 * - `tv` : accès aux tables temp_fonc_30 / temp_fonc_100 (lignes contrôlées) ;
 * - `requestInput` / `requestInputID` : passe-plats vers les données d'entrée ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ch: {
      89: 'chaudière gaz standard 2001-2015',
      55: 'chaudière bois bûche avant 1978',
      96: 'chaudière gaz à condensation 2001-2015',
      70: 'chaudière gaz basse température 2001-2015',
      12: 'radiateur à gaz',
      33: 'générateur à air chaud',
      99: 'type de générateur inconnu'
    },
    type_energie: {
      2: 'gaz naturel',
      4: 'bois – bûches'
    }
  }
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  get bug_for_bug_compat() {
    return state.bug;
  },
  tv: vi.fn(),
  requestInput: vi.fn((de, du, field) => de[field]),
  requestInputID: vi.fn((de, du, field) => de[`enum_${field}_id`])
}));

const { tv_temp_fonc_30_100, calc_generateur_combustion_ch } =
  await import('./13.2_generateur_combustion_ch.js');
const { tv } = await import('./utils.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
  state.bug = false;
});

/**
 * 13.2.1.1 - Températures de fonctionnement à 30 % et 100 % de charge.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.1
 */
describe('tv_temp_fonc_30_100 - températures de fonctionnement', () => {
  function emetteur(overrides = {}) {
    return {
      donnee_entree: {
        enum_temp_distribution_ch_id: '3',
        ...overrides
      },
      donnee_utilisateur: {}
    };
  }

  test('les températures forfaitaires trouvées sont recopiées dans les données intermédiaires', () => {
    tv.mockImplementation((table) =>
      table === 'temp_fonc_30'
        ? { tv_temp_fonc_30_id: '5', temp_fonc_30: '40' }
        : { tv_temp_fonc_100_id: '6', temp_fonc_100: '70' }
    );
    const di = {};
    const de = { enum_type_generateur_ch_id: '89' };
    tv_temp_fonc_30_100(di, de, {}, [emetteur()], 1975);
    expect(di.temp_fonc_30).toBe(40);
    expect(di.temp_fonc_100).toBe(70);
    expect(de.tv_temp_fonc_30_id).toBe('5');
    expect(de.tv_temp_fonc_100_id).toBe('6');
  });

  test.each([
    [1975, 'avant 1981'],
    [1990, 'entre 1981 et 2000'],
    [2010, 'après 2000']
  ])("période des émetteurs déduite de l'année de construction %s : %s", (ac, periodeAttendue) => {
    tv.mockReturnValue({ tv_temp_fonc_30_id: '1', temp_fonc_30: '40' });
    tv_temp_fonc_30_100({}, { enum_type_generateur_ch_id: '89' }, {}, [emetteur()], ac);
    expect(tv).toHaveBeenCalledWith(
      'temp_fonc_30',
      expect.objectContaining({ periode_emetteurs: periodeAttendue })
    );
  });

  test('conserve la température la plus élevée entre plusieurs émetteurs', () => {
    tv.mockImplementation((table, matcher) => {
      if (table !== 'temp_fonc_30') return null;
      // Le premier émetteur renvoie 40, le second 55
      return matcher.enum_temp_distribution_ch_id === '3'
        ? { tv_temp_fonc_30_id: 'a', temp_fonc_30: '40' }
        : { tv_temp_fonc_30_id: 'b', temp_fonc_30: '55' };
    });
    const di = {};
    tv_temp_fonc_30_100(
      di,
      { enum_type_generateur_ch_id: '89' },
      {},
      [emetteur(), emetteur({ enum_temp_distribution_ch_id: '4' })],
      1975
    );
    expect(di.temp_fonc_30).toBe(55);
  });

  test('conserve la température à 100 % la plus élevée entre plusieurs émetteurs', () => {
    tv.mockImplementation((table, matcher) => {
      if (table !== 'temp_fonc_100') return null;
      return matcher.enum_temp_distribution_ch_id === '3'
        ? { tv_temp_fonc_100_id: 'a', temp_fonc_100: '60' }
        : { tv_temp_fonc_100_id: 'b', temp_fonc_100: '75' };
    });
    const di = {};
    tv_temp_fonc_30_100(
      di,
      { enum_type_generateur_ch_id: '89' },
      {},
      [emetteur(), emetteur({ enum_temp_distribution_ch_id: '4' })],
      1975
    );
    // La comparaison `>` conserve la plus grande des deux valeurs
    expect(di.temp_fonc_100).toBe(75);
  });

  test('aucune ligne forfaitaire trouvée : erreurs signalées pour temp_fonc_30 et temp_fonc_100', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    tv.mockReturnValue(null);
    const di = {};
    tv_temp_fonc_30_100(di, { enum_type_generateur_ch_id: '89' }, {}, [emetteur()], 1975);
    expect(di.temp_fonc_30).toBeUndefined();
    expect(di.temp_fonc_100).toBeUndefined();
    expect(errSpy).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });
});

/**
 * 13.2.1.2 - Rendement de génération des chaudières (rg PCI).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.2
 */
describe('calc_generateur_combustion_ch - rendement de génération', () => {
  test('chaudière gaz standard : rendement PCI et rendement dépensier', () => {
    const di = { pn: 25000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '89',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // valeurs de référence de régression (module réel, enums réels équivalents)
    expect(di.rg).toBeCloseTo(0.8575549045559866, 9);
    expect(di.rg_dep).toBeCloseTo(0.8700736982536121, 9);
    expect(di.rendement_generation).toBeCloseTo(0.8575549045559866, 9);
  });

  test('chaudière bois : branche de calcul dédiée (QP50 / QP100)', () => {
    const di = { pn: 30000, rpn: 0.75, rpint: 0.7, qp0: 300, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '55',
      enum_type_energie_id: '4',
      type_energie: 'bois – bûches',
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.9, cdimrefDep: 0.7 });
    // valeurs de référence de régression
    expect(di.rg).toBeCloseTo(0.7040089707689774, 9);
    expect(di.rg_dep).toBeCloseTo(0.713512984577247, 9);
  });

  test('chaudière à condensation avec régulation : température de fonctionnement à 30 % utilisée', () => {
    const di = { pn: 25000, rpn: 0.95, rpint: 0.92, qp0: 150, temp_fonc_30: 35, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '96',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: true,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // valeurs de référence de régression
    expect(di.rg).toBeCloseTo(0.9275325681176758, 9);
    expect(di.rg_dep).toBeCloseTo(0.9340267431264844, 9);
  });

  test('radiateur à gaz : branche de calcul dédiée', () => {
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '12',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // valeurs de référence de régression
    expect(di.rg).toBeCloseTo(0.8842491989709215, 9);
    expect(di.rg_dep).toBeCloseTo(0.8862325713702337, 9);
  });

  test('générateur à air chaud : branche de calcul dédiée', () => {
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '33',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // valeurs de référence de régression
    expect(di.rg).toBeCloseTo(0.8655833354015402, 9);
    expect(di.rg_dep).toBeCloseTo(0.8746954076850985, 9);
  });

  test('chaudière basse température : coefficients dédiés (a = 0.1, b = 40)', () => {
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '70',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // valeurs de référence de régression
    expect(di.rg).toBeCloseTo(0.8505103134051144, 9);
    expect(di.rg_dep).toBeCloseTo(0.8649097139284332, 9);
  });

  test('type de générateur inconnu : aucun rendement calculé (avertissement)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '99',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // QPx renvoie undefined pour un type non reconnu -> rendement NaN
    expect(Number.isNaN(di.rg)).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('cdimref absent (du vide) : valeur de repli 0 -> Tch_xfinal saturé à 1', () => {
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 200, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '89',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, {});
    // Cdimref = 0 -> x/0 = Infinity -> min(1, ...) = 1 pour tous les x, nominal = dépensier
    expect(di.rg).toBeCloseTo(0.8963697027040485, 9);
    expect(di.rg_dep).toBeCloseTo(0.8963697027040485, 9);
  });

  test('bug_for_bug_compat : correction de qp0 exprimé en kW (< 1) vers des W', () => {
    state.bug = true;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const di = { pn: 20000, rpn: 0.9, rpint: 0.85, qp0: 0.2, temp_fonc_30: 40, temp_fonc_100: 70 };
    const de = {
      enum_type_generateur_ch_id: '89',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: false,
      description: 't'
    };
    calc_generateur_combustion_ch({}, di, de, { cdimref: 0.8, cdimrefDep: 0.6 });
    // qp0 < 1 -> multiplié par 1000 => 200 (passage kW -> W)
    expect(di.qp0).toBe(200);
    // valeur de référence de régression (chaudière standard, pn = 20000, qp0 corrigé à 200)
    expect(di.rg).toBeCloseTo(0.8557877790761849, 9);
    warnSpy.mockRestore();
  });

  test('la présence de régulation modifie le rendement (tf30 vs tf100)', () => {
    const base = () => ({
      pn: 25000,
      rpn: 0.95,
      rpint: 0.92,
      qp0: 150,
      temp_fonc_30: 35,
      temp_fonc_100: 70
    });
    const deCommun = {
      enum_type_generateur_ch_id: '96',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      description: 't'
    };
    const diAvec = base();
    calc_generateur_combustion_ch(
      {},
      diAvec,
      { ...deCommun, presence_regulation_combustion: true },
      {
        cdimref: 0.8,
        cdimrefDep: 0.6
      }
    );
    const diSans = base();
    calc_generateur_combustion_ch(
      {},
      diSans,
      { ...deCommun, presence_regulation_combustion: false },
      { cdimref: 0.8, cdimrefDep: 0.6 }
    );
    // Avec régulation (tf plus basse) le rendement est plus élevé
    expect(diAvec.rg).toBeGreaterThan(diSans.rg);
  });

  /**
   * Référence externe (et non régression) : autotest État CSTB `APP2-0-1`, moteur
   * Moteur_DPE.dll v2025.11.1.0 (Tribu). Chaudière gaz à condensation 2001-2015, Pn = 23 kW,
   * valeurs par défaut. Les grandeurs intermédiaires ci-dessous sont celles de la sortie Tribu
   * (Rpn, Rpint, Qp0, Tfonc30/100, Cdimref = 0.05 / TchFinal(Ch_5)).
   * Avant correctif (QP0 non converti sur PCS) : rg = 0.8597041838253313. Cf. issue #205.
   */
  test('autotest État APP2-0-1 : rg identique à Tribu (QP0 exprimé sur PCS)', () => {
    const di = {
      pn: 23000,
      rpn: 0.9236172783601759,
      rpint: 0.983617278360176,
      qp0: 230,
      pveil: 0,
      temp_fonc_30: 38,
      temp_fonc_100: 80
    };
    const de = {
      enum_type_generateur_ch_id: '96',
      enum_type_energie_id: '2',
      type_energie: 'gaz naturel',
      presence_regulation_combustion: true,
      description: 'Chaudière gaz condensation'
    };
    const cdimref = 0.05 / 0.00603495141488493;
    calc_generateur_combustion_ch({}, di, de, { cdimref, cdimrefDep: cdimref });
    // Rg Tribu (sortie APP2-0-1_Sortie.xml) : 0.8511886946001722
    expect(di.rg).toBeCloseTo(0.8511886946001722, 12);
  });

  test('les pertes à charge nulle QP0 réduisent le rendement de génération', () => {
    const di = () => ({
      pn: 23000,
      rpn: 0.92,
      rpint: 0.98,
      qp0: 230,
      pveil: 0,
      temp_fonc_30: 38,
      temp_fonc_100: 80
    });
    const de = {
      enum_type_generateur_ch_id: '96',
      enum_type_energie_id: '2',
      presence_regulation_combustion: true,
      description: 't'
    };
    const avecPertes = di();
    calc_generateur_combustion_ch(
      {},
      avecPertes,
      { ...de, type_energie: 'gaz naturel' },
      { cdimref: 8 }
    );
    const sansPertes = { ...di(), qp0: 0 };
    calc_generateur_combustion_ch(
      {},
      sansPertes,
      { ...de, type_energie: 'gaz naturel' },
      { cdimref: 8 }
    );
    // le terme 0.45 × QP0 réduit bien le rendement
    expect(avecPertes.rg).toBeLessThan(sansPertes.rg);
  });
});
