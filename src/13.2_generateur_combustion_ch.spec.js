import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler la logique de calcul :
 * - `enums` (import par défaut) : mapping type de générateur / type d'énergie, qui
 *   sélectionne la branche de calcul du rendement et le coefficient K ;
 * - `tv` : accès aux tables temp_fonc_30 / temp_fonc_100 (lignes contrôlées) ;
 * - `requestInput` / `requestInputID` : passe-plats vers les données d'entrée ;
 * - `bug_for_bug_compat` : désactivé pour isoler le comportement nominal.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ch: {
      89: 'chaudière gaz standard 2001-2015',
      55: 'chaudière bois bûche avant 1978',
      96: 'chaudière gaz à condensation 2001-2015'
    },
    type_energie: {
      2: 'gaz naturel',
      4: 'bois – bûches'
    }
  }
}));

vi.mock('./utils.js', () => ({
  bug_for_bug_compat: false,
  tv: vi.fn(),
  requestInput: vi.fn((de, du, field) => de[field]),
  requestInputID: vi.fn((de, du, field) => de[`enum_${field}_id`])
}));

const { tv_temp_fonc_30_100, calc_generateur_combustion_ch } = await import(
  './13.2_generateur_combustion_ch.js'
);
const { tv } = await import('./utils.js');

beforeEach(() => {
  vi.mocked(tv).mockReset();
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
    expect(di.rg).toBeCloseTo(0.8582190936918361, 9);
    expect(di.rg_dep).toBeCloseTo(0.8706053178411902, 9);
    expect(di.rendement_generation).toBeCloseTo(0.8582190936918361, 9);
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
    expect(di.rg).toBeCloseTo(0.7044775930164003, 9);
    expect(di.rg_dep).toBeCloseTo(0.7138933157828895, 9);
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
    expect(di.rg).toBeCloseTo(0.9281152399114512, 9);
    expect(di.rg_dep).toBeCloseTo(0.9344861707155592, 9);
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
});
