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
      99: 'type de générateur inconnu',
      127: 'chaudière gpl/propane/butane classique avant 1981',
      137: 'chaudière gpl/propane/butane à condensation 1986-2000'
    },
    type_energie: {
      2: 'gaz naturel',
      4: 'bois – bûches',
      9: 'propane',
      10: 'butane',
      13: 'gpl'
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

const {
  tv_temp_fonc_30_100,
  tempDistributionChPourTempFonc,
  calc_generateur_combustion_ch,
  periodeEmetteursDeduiteDuDpe,
  periodeEmetteurAnneeConstruction,
  PERIODES_INSTALLATION_EMETTEUR,
  K
} = await import('./13.2_generateur_combustion_ch.js');
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

  /**
   * Plancher / plafond chauffant à eau < 65 °C : la ligne « basse » est retenue même si le DPE
   * déclare « moyenne » (comportement du moteur de référence CSTB / Tribu).
   */
  test.each(['12', '14', '16', '18'])(
    'plancher/plafond chauffant BT (émission %s) déclaré « moyenne » : ligne « basse » utilisée',
    (typeEmission) => {
      tv.mockReturnValue({ tv_temp_fonc_30_id: '1', temp_fonc_30: '24.5' });
      tv_temp_fonc_30_100(
        {},
        { enum_type_generateur_ch_id: '97' },
        {},
        [emetteur({ enum_type_emission_distribution_id: typeEmission })],
        2018
      );
      expect(tv).toHaveBeenCalledWith(
        'temp_fonc_30',
        expect.objectContaining({ enum_temp_distribution_ch_id: '2' })
      );
      expect(tv).toHaveBeenCalledWith(
        'temp_fonc_100',
        expect.objectContaining({ enum_temp_distribution_ch_id: '2' })
      );
    }
  );

  test.each([
    ['radiateur (35), moyenne', '35', '3', '3'],
    ['plancher chauffant HT (13), moyenne', '13', '3', '3'],
    ['plancher chauffant BT (14), haute', '14', '4', '4'],
    ['plancher chauffant BT (14), basse', '14', '2', '2']
  ])(
    '%s : température de distribution déclarée conservée',
    (_, typeEmission, declaree, attendue) => {
      tv.mockReturnValue({ tv_temp_fonc_30_id: '1', temp_fonc_30: '40' });
      tv_temp_fonc_30_100(
        {},
        { enum_type_generateur_ch_id: '97' },
        {},
        [
          emetteur({
            enum_type_emission_distribution_id: typeEmission,
            enum_temp_distribution_ch_id: declaree
          })
        ],
        2018
      );
      expect(tv).toHaveBeenCalledWith(
        'temp_fonc_30',
        expect.objectContaining({ enum_temp_distribution_ch_id: attendue })
      );
    }
  );
});

/**
 * Issue #220 - période d'installation des émetteurs absente du DPE.
 *
 * Mode strict : « Si l'année d'installation des émetteurs est inconnue, prendre l'année de
 * construction du bâtiment. » En mode bug_for_bug_compat uniquement, la période est retrouvée à
 * partir des temp_fonc_30 / temp_fonc_100 d'origine stockées dans le DPE (règle de l'expert).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 */
describe('tv_temp_fonc_30_100 - période des émetteurs absente (issue #220)', () => {
  /**
   * Table de test (contrôlée, indépendante des tables réelles) pour une chaudière à condensation :
   * [température de distribution][période] -> [id, temp_fonc_30, temp_fonc_100].
   */
  const TABLE = {
    2: {
      'avant 1981': ['1', '32', '60'],
      'entre 1981 et 2000': ['4', '24.5', '35'],
      'après 2000': ['7', '24.5', '35']
    },
    3: {
      'avant 1981': ['2', '38', '80'],
      'entre 1981 et 2000': ['5', '35', '70'],
      'après 2000': ['8', '32', '60']
    },
    4: {
      'avant 1981': ['3', '38', '80'],
      'entre 1981 et 2000': ['6', '35', '70'],
      'après 2000': ['9', '35', '70']
    }
  };

  function tvTable(table, matcher) {
    const ligne = TABLE[matcher.enum_temp_distribution_ch_id]?.[matcher.periode_emetteurs];
    if (!ligne) return null;
    return table === 'temp_fonc_30'
      ? { tv_temp_fonc_30_id: `30-${ligne[0]}`, temp_fonc_30: ligne[1] }
      : { tv_temp_fonc_100_id: `100-${ligne[0]}`, temp_fonc_100: ligne[2] };
  }

  function emetteur(tempDistribution, periode) {
    const de = { enum_temp_distribution_ch_id: tempDistribution };
    if (periode) de.periode_installation_emetteur = periode;
    return { donnee_entree: de, donnee_utilisateur: {} };
  }

  const genCondensation = () => ({ enum_type_generateur_ch_id: '97', description: 'chaudière' });

  let warnSpy;
  beforeEach(() => {
    tv.mockImplementation(tvTable);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    return () => warnSpy.mockRestore();
  });

  test('T1 strict : période absente, construction 1900 -> « avant 1981 » (38/80), valeurs du DPE ignorées', () => {
    const di = { temp_fonc_30: 32, temp_fonc_100: 60 };
    const de = genCondensation();
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3')], 1900);
    // Valeurs DPE (32) < table (38) : la table l'emporte, aucune déduction en mode strict
    expect(di.temp_fonc_30).toBe(38);
    expect(di.temp_fonc_100).toBe(80);
    expect(de.tv_temp_fonc_30_id).toBe('30-2');
    expect(de.tv_temp_fonc_100_id).toBe('100-2');
    expect(tv).not.toHaveBeenCalledWith(
      'temp_fonc_30',
      expect.objectContaining({ periode_emetteurs: 'après 2000' })
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('T2 bug_for_bug_compat : DPE à 32/60 -> période « après 2000 » déduite, valeurs et ids issus des tables', () => {
    state.bug = true;
    const di = { temp_fonc_30: 32, temp_fonc_100: 60 };
    const de = genCondensation();
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3')], 1900);
    expect(di.temp_fonc_30).toBe(32);
    expect(di.temp_fonc_100).toBe(60);
    expect(de.tv_temp_fonc_30_id).toBe('30-8');
    expect(de.tv_temp_fonc_100_id).toBe('100-8');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "période d'installation des émetteurs déduite des données intermédiaires du DPE : après 2000"
      )
    );
  });

  test('T2 bis bug_for_bug_compat : valeurs du DPE sous forme de chaînes acceptées', () => {
    state.bug = true;
    const di = { temp_fonc_30: '32', temp_fonc_100: '60' };
    tv_temp_fonc_30_100(di, genCondensation(), {}, [emetteur('3')], 1900);
    expect(di.temp_fonc_30).toBe(32);
    expect(di.temp_fonc_100).toBe(60);
  });

  test('T3 bug_for_bug_compat : période saisie « avant 1981 » jamais écrasée (38/80 conservé)', () => {
    state.bug = true;
    const di = { temp_fonc_30: 32, temp_fonc_100: 60 };
    const de = genCondensation();
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3', 'avant 1981')], 1900);
    expect(di.temp_fonc_30).toBe(38);
    expect(di.temp_fonc_100).toBe(80);
    expect(de.tv_temp_fonc_30_id).toBe('30-2');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('T4 bug_for_bug_compat : distribution haute, construction 1990, DPE 35/70 -> 2 candidates, période de construction retenue', () => {
    state.bug = true;
    const di = { temp_fonc_30: 35, temp_fonc_100: 70 };
    const de = genCondensation();
    tv_temp_fonc_30_100(di, de, {}, [emetteur('4')], 1990);
    expect(di.temp_fonc_30).toBe(35);
    expect(di.temp_fonc_100).toBe(70);
    // « entre 1981 et 2000 » (ids 6) et non « après 2000 » (ids 9)
    expect(de.tv_temp_fonc_30_id).toBe('30-6');
    expect(de.tv_temp_fonc_100_id).toBe('100-6');
  });

  test('T5 bug_for_bug_compat : DPE 33/62 hors tables -> repli sur l’année de construction et avertissement', () => {
    state.bug = true;
    const di = { temp_fonc_30: 33, temp_fonc_100: 62 };
    const de = genCondensation();
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3')], 1990);
    // Repli strict : « entre 1981 et 2000 » -> 35/70 (> 33/62 donc retenu)
    expect(di.temp_fonc_30).toBe(35);
    expect(di.temp_fonc_100).toBe(70);
    expect(de.tv_temp_fonc_30_id).toBe('30-5');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("valeurs hors tables / donnée d'entrée incohérente")
    );
  });

  test.each([
    ['temp_fonc_100 absente', { temp_fonc_30: 32 }],
    ['temp_fonc_30 absente', { temp_fonc_100: 60 }],
    ['temp_fonc_30 non numérique', { temp_fonc_30: 'abc', temp_fonc_100: 60 }],
    ['temp_fonc_100 vide', { temp_fonc_30: 32, temp_fonc_100: '' }],
    ['temp_fonc_30 nulle', { temp_fonc_30: null, temp_fonc_100: 60 }]
  ])(
    'T6 bug_for_bug_compat : %s -> aucune déduction (règle de l’année de construction)',
    (_, di) => {
      state.bug = true;
      tv_temp_fonc_30_100(di, genCondensation(), {}, [emetteur('3')], 1900);
      expect(tv).not.toHaveBeenCalledWith(
        'temp_fonc_30',
        expect.objectContaining({ periode_emetteurs: 'après 2000' })
      );
      expect(tv).not.toHaveBeenCalledWith(
        'temp_fonc_30',
        expect.objectContaining({ periode_emetteurs: 'entre 1981 et 2000' })
      );
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );

  test('T7 bug_for_bug_compat : deux émetteurs sans période (moyenne + haute), DPE 35/70 -> même période pour tous, règle du maximum', () => {
    state.bug = true;
    const di = { temp_fonc_30: 35, temp_fonc_100: 70 };
    const de = genCondensation();
    /**
     * avant 1981 : max(38, 38) / max(80, 80) = 38/80 -> rejetée
     * entre 1981 et 2000 : max(35, 35) / max(70, 70) = 35/70 -> candidate
     * après 2000 : max(32, 35) / max(60, 70) = 35/70 -> candidate
     * Construction 1900 (« avant 1981 ») hors candidates -> la plus récente : « après 2000 ».
     */
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3'), emetteur('4')], 1900);
    expect(di.temp_fonc_30).toBe(35);
    expect(di.temp_fonc_100).toBe(70);
    // Maximum atteint par l'émetteur « haute » en « après 2000 » (ids 9)
    expect(de.tv_temp_fonc_30_id).toBe('30-9');
    expect(de.tv_temp_fonc_100_id).toBe('100-9');
  });

  test('bug_for_bug_compat : un émetteur saisi et un émetteur sans période -> seule la période absente est déduite', () => {
    state.bug = true;
    const di = { temp_fonc_30: 35, temp_fonc_100: 70 };
    const de = genCondensation();
    // Émetteur saisi « entre 1981 et 2000 » (moyenne : 35/70) + émetteur basse sans période
    tv_temp_fonc_30_100(di, de, {}, [emetteur('3', 'entre 1981 et 2000'), emetteur('2')], 1900);
    expect(di.temp_fonc_30).toBe(35);
    expect(di.temp_fonc_100).toBe(70);
    expect(tv).toHaveBeenCalledWith(
      'temp_fonc_30',
      expect.objectContaining({
        enum_temp_distribution_ch_id: '3',
        periode_emetteurs: 'entre 1981 et 2000'
      })
    );
    expect(tv).not.toHaveBeenCalledWith(
      'temp_fonc_30',
      expect.objectContaining({
        enum_temp_distribution_ch_id: '3',
        periode_emetteurs: 'après 2000'
      })
    );
  });

  test('bug_for_bug_compat : émetteur sans réseau de distribution (id 1) exclu', () => {
    state.bug = true;
    const di = { temp_fonc_30: 32, temp_fonc_100: 60 };
    tv_temp_fonc_30_100(di, genCondensation(), {}, [emetteur('1'), emetteur('3')], 1900);
    expect(di.temp_fonc_30).toBe(32);
    expect(di.temp_fonc_100).toBe(60);
  });

  test('bug_for_bug_compat : seul un émetteur sans réseau de distribution est sans période -> aucune déduction', () => {
    state.bug = true;
    const di = { temp_fonc_30: 32, temp_fonc_100: 60 };
    tv_temp_fonc_30_100(
      di,
      genCondensation(),
      {},
      [emetteur('1'), emetteur('3', 'avant 1981')],
      1900
    );
    expect(di.temp_fonc_30).toBe(38);
    expect(di.temp_fonc_100).toBe(80);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('bug_for_bug_compat : une seule des deux valeurs reproduite -> période rejetée (tolérance 0,01 °C)', () => {
    state.bug = true;
    // 32/60.02 : « après 2000 » ne reproduit que temp_fonc_30 -> aucune candidate
    const di = { temp_fonc_30: 32, temp_fonc_100: 60.02 };
    tv_temp_fonc_30_100(di, genCondensation(), {}, [emetteur('3')], 1900);
    expect(di.temp_fonc_30).toBe(38);
    expect(di.temp_fonc_100).toBe(80);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('valeurs hors tables'));
  });

  test('bug_for_bug_compat : écart inférieur à la tolérance accepté', () => {
    state.bug = true;
    const di = { temp_fonc_30: 32.005, temp_fonc_100: 59.995 };
    tv_temp_fonc_30_100(di, genCondensation(), {}, [emetteur('3')], 1900);
    expect(di.temp_fonc_30).toBe(32);
    expect(di.temp_fonc_100).toBe(60);
  });
});

describe('periodeEmetteursDeduiteDuDpe', () => {
  const de = { enum_type_generateur_ch_id: '97' };
  const em = [{ donnee_entree: { enum_temp_distribution_ch_id: '3' }, donnee_utilisateur: {} }];

  test('aucune ligne de table trouvée pour une période : période non candidate', () => {
    tv.mockReturnValue(null);
    expect(periodeEmetteursDeduiteDuDpe(32, 60, de, em, 1900)).toBeNull();
  });

  test('ligne temp_fonc_100 absente : période non candidate', () => {
    tv.mockImplementation((table) =>
      table === 'temp_fonc_30' ? { tv_temp_fonc_30_id: '1', temp_fonc_30: '32' } : null
    );
    expect(periodeEmetteursDeduiteDuDpe(32, 60, de, em, 1900)).toBeNull();
  });

  test('toutes les périodes candidates : période de construction retenue', () => {
    tv.mockImplementation((table) =>
      table === 'temp_fonc_30'
        ? { tv_temp_fonc_30_id: '1', temp_fonc_30: '32' }
        : { tv_temp_fonc_100_id: '1', temp_fonc_100: '60' }
    );
    expect(periodeEmetteursDeduiteDuDpe(32, 60, de, em, 1900)).toBe(
      PERIODES_INSTALLATION_EMETTEUR[0]
    );
    expect(periodeEmetteursDeduiteDuDpe(32, 60, de, em, 2010)).toBe('après 2000');
  });
});

describe('periodeEmetteurAnneeConstruction', () => {
  test.each([
    [1980, 'avant 1981'],
    [1981, 'entre 1981 et 2000'],
    [1999, 'entre 1981 et 2000'],
    [2000, 'après 2000']
  ])('année de construction %s : %s', (ac, periode) => {
    expect(periodeEmetteurAnneeConstruction(ac)).toBe(periode);
  });
});

describe('tempDistributionChPourTempFonc', () => {
  test('émetteur sans type d’émission : température déclarée renvoyée telle quelle', () => {
    expect(tempDistributionChPourTempFonc({ enum_temp_distribution_ch_id: '3' }, {})).toBe('3');
  });

  test('type d’émission numérique (14) : reconnu comme plancher chauffant BT', () => {
    expect(
      tempDistributionChPourTempFonc(
        { enum_temp_distribution_ch_id: 3, enum_type_emission_distribution_id: 14 },
        {}
      )
    ).toBe('2');
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

/**
 * Coefficient de conversion PCS / PCI : le propane et le butane sont des GPL (k = 1.09).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.2
 */
describe('K - coefficient PCS / PCI', () => {
  test('propane et butane : même coefficient que le gpl (1.09), distinct du gaz naturel', () => {
    expect(K.gpl).toBe(1.09);
    expect(K.propane).toBe(K.gpl);
    expect(K.butane).toBe(K.gpl);
    expect(K['gaz naturel']).toBe(1.11);
  });

  /**
   * Référence externe : autotests État CSTB `APP5-0-4` / `APP5-0-43` (Moteur_DPE.dll, Tribu).
   * Chaudières propane (valeurs par défaut) en cascade avec priorité : le générateur prioritaire
   * reçoit tout le besoin (Cdimref = 0.05 / TchFinal(Ch_5) de la sortie Tribu).
   * Avant correctif (k = 1.11) : rg = 0.9319264144042921 (APP5-0-4) et 0.7459952855462689
   * (APP5-0-43), soit −0,019 % sur Rg.
   */
  test.each([
    {
      cas: 'APP5-0-4 (condensation 1986-2000)',
      type: '137',
      di: { pn: 17538.46, rpn: 0.9330102995756797, rpint: 0.9930102995756798, qp0: 175.3846 },
      tf: [38, 80],
      tch5: 0.01481070099462132,
      rgTribu: 0.9321065689001576
    },
    {
      cas: 'APP5-0-43 (classique avant 1981)',
      type: '127',
      di: { pn: 13153.85, rpn: 0.883521827720847, rpint: 0.8652827415812706, qp0: 526.154 },
      tf: [59, 80],
      tch5: 0.019747593819765787,
      rgTribu: 0.7461323116237667
    }
  ])('autotest État $cas : rg propane identique à Tribu', ({ type, di, tf, tch5, rgTribu }) => {
    const d = { ...di, pveil: 0, temp_fonc_30: tf[0], temp_fonc_100: tf[1] };
    const de = {
      enum_type_generateur_ch_id: type,
      enum_type_energie_id: '9',
      type_energie: 'propane',
      presence_regulation_combustion: true,
      description: 't'
    };
    const cdimref = 0.05 / tch5;
    calc_generateur_combustion_ch({}, d, de, { cdimref, cdimrefDep: cdimref });
    expect(d.rg).toBeCloseTo(rgTribu, 12);
  });

  test('butane et propane donnent le même rendement que le gpl', () => {
    const run = (energieId, typeEnergie) => {
      const di = {
        pn: 20000,
        rpn: 0.93,
        rpint: 0.99,
        qp0: 200,
        pveil: 0,
        temp_fonc_30: 38,
        temp_fonc_100: 80
      };
      const de = {
        enum_type_generateur_ch_id: '137',
        enum_type_energie_id: energieId,
        type_energie: typeEnergie,
        presence_regulation_combustion: true,
        description: 't'
      };
      calc_generateur_combustion_ch({}, di, de, { cdimref: 3, cdimrefDep: 2.5 });
      return di;
    };
    const gpl = run('13', 'gpl');
    for (const [id, nom] of [
      ['9', 'propane'],
      ['10', 'butane']
    ]) {
      const di = run(id, nom);
      expect(di.rg).toBeCloseTo(gpl.rg, 12);
      expect(di.rg_dep).toBeCloseTo(gpl.rg_dep, 12);
    }
  });
});
