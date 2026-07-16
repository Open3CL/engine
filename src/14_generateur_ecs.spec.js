import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_gen_ecs` et ses fonctions de rendement :
 * - `enums` : libellés des types de générateur / installation / zone ;
 * - `utils` : `tv`, `tvColumnIDs`, `requestInput(ID)`, `Tbase` contrôlés, `bug_for_bug_compat` désactivé ;
 * - `tv_generateur_combustion` : injecte les caractéristiques (rpn, qp0, pveil) du générateur ;
 * - `scopOrCop` : injecte le SCOP pour les pompes à chaleur ;
 * - `conso_aux_gen`, `updateGenerateurCombustion`, `getFicheTechnique` : neutralisés.
 * Aucune vraie table de valeurs n'est utilisée : les tests restent stables si les données changent.
 */
vi.mock('./enums.js', () => ({
  default: {
    type_generateur_ecs: {
      60: 'ballon électrique à accumulation vertical',
      61: 'ballon électrique à accumulation vertical catégorie c ou 3 étoiles',
      gaz: 'chauffe-eau gaz',
      chaud: 'chaudière gaz condensation',
      accu: 'accumulateur gaz',
      pac: 'pac double service',
      autre: 'générateur non implémenté'
    },
    type_generateur_ch: {},
    classe_altitude: { 1: 'ca1' },
    zone_climatique: { 1: 'h1a' },
    type_installation_solaire: { 1: 'installation solaire' }
  }
}));

vi.mock('./utils.js', () => ({
  bug_for_bug_compat: false,
  getVolumeStockageFromDescription: vi.fn(),
  requestInput: vi.fn((de, du, field) => de[field]),
  requestInputID: vi.fn((de, du, field) => de[`enum_${field}_id`]),
  Tbase: { ca1: { h1: -5 } },
  tv: vi.fn(),
  tvColumnIDs: vi.fn(() => [])
}));

vi.mock('./13.2_generateur_combustion.js', () => ({
  tv_generateur_combustion: vi.fn(),
  updateGenerateurCombustion: vi.fn()
}));

vi.mock('./15_conso_aux.js', () => ({
  conso_aux_gen: vi.fn()
}));

vi.mock('./12.4_pac.js', () => ({
  scopOrCop: vi.fn()
}));

vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const {
  default: calc_gen_ecs,
  rg_chauffe_eau_gaz,
  rgrs_chaudiere,
  rg_accumulateur_gaz,
  rgrsReseauUrbain
} = await import('./14_generateur_ecs.js');
const { tvColumnIDs, requestInput, requestInputID } = await import('./utils.js');
const { tv_generateur_combustion } = await import('./13.2_generateur_combustion.js');
const { scopOrCop } = await import('./12.4_pac.js');

/**
 * 14. Générateur d'ECS : rendements et consommations
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §14
 */
describe('rendements de génération (fonctions pures)', () => {
  const di = { rpn: 0.9, qp0: 0.1, pveil: 0.02, Qgw: 1000 };

  test('rg_chauffe_eau_gaz : valeur de référence', () => {
    // valeur de référence de régression
    expect(rg_chauffe_eau_gaz(di, 100)).toBeCloseTo(0.8974283293793307, 9);
  });

  test('rgrs_chaudiere : valeur de référence (prend en compte Qgw et 0.5·pveil)', () => {
    // valeur de référence de régression
    expect(rgrs_chaudiere(di, 100)).toBeCloseTo(0.8899979361936746, 9);
  });

  test('rg_accumulateur_gaz : valeur de référence', () => {
    // valeur de référence de régression
    expect(rg_accumulateur_gaz(di, 100)).toBeCloseTo(0.8840973866670649, 9);
  });

  test('un besoin ECS plus grand rapproche le rendement du rendement à pleine charge', () => {
    expect(rg_chauffe_eau_gaz(di, 100000)).toBeGreaterThan(rg_chauffe_eau_gaz(di, 100));
  });
});

/**
 * Réseau de chaleur : rendement forfaitaire selon le caractère isolé.
 */
describe('rgrsReseauUrbain - rendement d’un réseau de chaleur', () => {
  test('type 73 (réseau isolé) : 0.9', () => {
    expect(rgrsReseauUrbain({ enum_type_generateur_ecs_id: '73' }, {})).toBe(0.9);
  });

  test('réseau marqué isolé au niveau de l’installation : 0.9', () => {
    expect(
      rgrsReseauUrbain({ enum_type_generateur_ecs_id: '72' }, { reseau_distribution_isole: 1 })
    ).toBe(0.9);
  });

  test('réseau non isolé par défaut : 0.75', () => {
    expect(
      rgrsReseauUrbain({ enum_type_generateur_ecs_id: '72' }, { reseau_distribution_isole: 0 })
    ).toBe(0.75);
  });
});

/**
 * calc_gen_ecs : sélection de la branche de rendement selon le type d'énergie / générateur.
 */
describe('calc_gen_ecs - consommation par générateur', () => {
  let ecs_di;
  let ecs_de;

  beforeEach(() => {
    vi.mocked(tvColumnIDs).mockReset().mockReturnValue([]);
    vi.mocked(requestInput)
      .mockReset()
      .mockImplementation((de, du, field) => de[field]);
    vi.mocked(requestInputID)
      .mockReset()
      .mockImplementation((de, du, field) => de[`enum_${field}_id`]);
    vi.mocked(tv_generateur_combustion).mockReset();
    vi.mocked(scopOrCop).mockReset();

    ecs_di = { besoin_ecs: 100, besoin_ecs_depensier: 150, rendement_distribution: 0.9 };
    ecs_de = { enum_type_installation_id: '1' };
  });

  /** Données d'entrée d'un générateur, avec absence de stockage par défaut (Qgw = 0). */
  function gen(deExtra) {
    return {
      donnee_entree: {
        usage_generateur: 'ecs',
        type_stockage_ecs: "abscence de stockage d'ecs (production instantanée)",
        volume_stockage: 0,
        ...deExtra
      }
    };
  }

  test('générateur électrique sans stockage (Qgw = 0) : conso = besoin / rd', () => {
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_stockage).toBeCloseTo(1, 9);
    // valeur de référence de régression : 100 / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(111.11111111111111, 9);
    expect(g.donnee_intermediaire.conso_ecs_depensier).toBeCloseTo(166.66666666666666, 9);
  });

  test('ballon électrique 3 étoiles : bonus de 8 % sur le rendement de stockage', () => {
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '61' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_stockage).toBeCloseTo(1.08, 9);
    // valeur de référence de régression : 100 / (1.08 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(102.88065843621398, 9);
  });

  test('réseau de chaleur isolé (type 73) : rendement 0.9', () => {
    const g = gen({
      type_energie: 'réseau de chauffage urbain',
      enum_type_generateur_ecs_id: '73'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'immeuble');

    expect(g.donnee_intermediaire.rendement_generation_stockage).toBe(0.9);
    // valeur de référence de régression : 100 / (0.9 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(123.45679012345678, 9);
  });

  test('pompe à chaleur : consommation pilotée par le SCOP', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) => (table === 'scop' ? ['pac'] : []));
    vi.mocked(scopOrCop).mockImplementation((di) => {
      di.scop = 3;
    });
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: 'pac' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(scopOrCop).toHaveBeenCalled();
    // valeur de référence de régression : 100 / 3 / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(37.03703703703703, 9);
  });

  test('chauffe-eau gaz (combustion) : rendement calculé par rg_chauffe_eau_gaz', () => {
    vi.mocked(tvColumnIDs).mockImplementation((table) =>
      table === 'generateur_combustion' ? ['gaz'] : []
    );
    vi.mocked(tv_generateur_combustion).mockImplementation((dpe, di) => {
      di.rpn = 0.9;
      di.qp0 = 0.1;
      di.pveil = 0.02;
      di.pveilleuse = 1;
      di.pn = 5000;
    });
    const g = gen({
      type_energie: 'gaz',
      enum_type_generateur_ecs_id: 'gaz',
      enum_methode_saisie_carac_sys_id: '1'
    });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(g.donnee_intermediaire.rendement_generation).toBeCloseTo(0.8974283293793307, 9);
    // valeur de référence de régression : 100 / (0.8974283293793307 * 0.9)
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(123.81056790123455, 9);
  });

  test('installation solaire : la couverture solaire réduit la consommation', () => {
    ecs_de.enum_type_installation_solaire_id = '1';
    ecs_de.fecs_saisi = 0.5;
    const g = gen({ type_energie: 'électricité', enum_type_generateur_ecs_id: '60' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    expect(ecs_di.fecs).toBe(0.5);
    // valeur de référence de régression : 100 * (1 - 0.5) / 0.9
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(55.55555555555556, 9);
  });

  test('type d’énergie non pris en charge : rendement neutre (Iecs = 1)', () => {
    const g = gen({ type_energie: 'bois', enum_type_generateur_ecs_id: 'autre' });
    calc_gen_ecs({}, g, ecs_di, ecs_de, 0, '1', '1', 'maison');

    // aucune branche spécifique : conso = besoin / rd
    expect(g.donnee_intermediaire.conso_ecs).toBeCloseTo(111.11111111111111, 9);
  });
});
