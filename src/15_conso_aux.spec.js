import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées uniquement pour `conso_aux_distribution_ch` :
 * - `enums` : libellés de classe d'altitude / zone climatique ;
 * - `tvs.nref19` : nombre d'heures de fonctionnement mensuel ;
 * - `mois_liste` / `Tbase` : réduits à des valeurs contrôlées.
 * `conso_aux_gen` n'utilise aucune de ces dépendances (calcul autonome).
 */
vi.mock('./enums.js', () => ({
  default: {
    classe_altitude: { 1: 'ca1' },
    zone_climatique: { 1: 'h1a' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    nref19: { 0: { ca1: { Janvier: { h1a: 100 } } } }
  }
}));

vi.mock('./utils.js', () => ({
  mois_liste: ['Janvier'],
  Tbase: { ca1: { h1: -9 } }
}));

const { conso_aux_gen, conso_aux_distribution_ch } = await import('./15_conso_aux.js');

/**
 * 15.1 Consommation des auxiliaires de génération
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.1
 */
describe('conso_aux_gen - auxiliaires de génération', () => {
  let di;

  beforeEach(() => {
    di = { pn: 20000 };
  });

  test('chaudière gaz (chauffage) : facteurs G=20, H=1.6 appliqués', () => {
    const de = { enum_type_generateur_ch_id: '90' };
    conso_aux_gen(di, de, 'ch', 1000, 1200, 100);
    expect(di.conso_auxiliaire_generation_ch).toBeCloseTo(2.6, 10);
    expect(di.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(3.12, 10);
  });

  test('générateur hors des plages connues : consommation nulle (G=H=0)', () => {
    const de = { enum_type_generateur_ch_id: '1' };
    conso_aux_gen(di, de, 'ch', 1000, 1200, 100);
    expect(di.conso_auxiliaire_generation_ch).toBe(0);
    expect(di.conso_auxiliaire_generation_ch_depensier).toBe(0);
  });

  test("chaudière bois : facteurs appliqués seulement en présence d'un ventilateur", () => {
    const avecVentilateur = { pn: 20000 };
    conso_aux_gen(
      avecVentilateur,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 1 },
      'ch',
      1000,
      1200,
      100
    );
    expect(avecVentilateur.conso_auxiliaire_generation_ch).toBeCloseTo(14.165, 10);

    const sansVentilateur = { pn: 20000 };
    conso_aux_gen(
      sansVentilateur,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 0 },
      'ch',
      1000,
      1200,
      100
    );
    expect(sansVentilateur.conso_auxiliaire_generation_ch).toBe(0);
  });

  test('chaudière gaz avec Pn > 400 kW : puissance plafonnée à 400 kW', () => {
    const diCap = { pn: 500000 };
    conso_aux_gen(diCap, { enum_type_generateur_ch_id: '90' }, 'ch', 1000, 1200, 100);
    expect(diCap.conso_auxiliaire_generation_ch).toBeCloseTo(1.65, 10);
    expect(diCap.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(1.584, 10);
  });

  test('type ECS : aucun prorata de surface chauffée appliqué', () => {
    const de = { enum_type_generateur_ecs_id: '50' };
    conso_aux_gen(di, de, 'ecs', 800, 1000, 100);
    expect(di.conso_auxiliaire_generation_ecs).toBeCloseTo(2.08, 10);
    expect(di.conso_auxiliaire_generation_ecs_depensier).toBeCloseTo(2.6, 10);
  });

  test('générateur à air chaud avec Pn > 300 kW : puissance plafonnée à 300 kW', () => {
    // enum_type_generateur_ch_id = 50 => générateur à air chaud (H=4), G=0
    const diAir = { pn: 500000 };
    conso_aux_gen(diAir, { enum_type_generateur_ch_id: '50' }, 'ch', 1000, 1200, 100);
    // g=0, h=4, pe plafonné à 300000 => Paux = 0 + 4*300 = 1200
    // conso = (1 * (1200 * 1000 * 1)) / 300000 = 4
    expect(diAir.conso_auxiliaire_generation_ch).toBeCloseTo(4, 10);
    // depensier utilise di.pn (500000, non plafonné) : (1200 * 1200) / 500000 = 2.88
    expect(diAir.conso_auxiliaire_generation_ch_depensier).toBeCloseTo(2.88, 10);
  });

  test('chaudière bois avec ventilateur et Pn > 70 kW : puissance plafonnée à 70 kW', () => {
    // enum_type_generateur_ch_id = 60 => chaudière bois (G=73.3, H=10.5)
    const diBois = { pn: 100000 };
    conso_aux_gen(
      diBois,
      { enum_type_generateur_ch_id: '60', presenceVentilateur: 1 },
      'ch',
      1000,
      1200,
      100
    );
    // pe plafonné à 70000 => Paux = 73.3 + 10.5*70 = 808.3
    // conso = (1 * (808.3 * 1000 * 1)) / 70000
    expect(diBois.conso_auxiliaire_generation_ch).toBeCloseTo((808.3 * 1000) / 70000, 10);
  });

  test('type de générateur inconnu (ni ch ni ecs) : facteurs nuls, consommation nulle', () => {
    // Couvre la branche de repli `values[type] || []` de getFacteur
    const diInconnu = { pn: 20000 };
    conso_aux_gen(diInconnu, {}, 'autre', 1000, 1200, 100);
    expect(diInconnu.conso_auxiliaire_generation_autre).toBe(0);
    expect(diInconnu.conso_auxiliaire_generation_autre_depensier).toBe(0);
  });
});

/**
 * 15.2 Consommation des auxiliaires de distribution de chauffage
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §15.2
 */
describe('conso_aux_distribution_ch - auxiliaires de distribution', () => {
  const emCh = [
    {
      donnee_entree: {
        enum_type_emission_distribution_id: '10',
        enum_temp_distribution_ch_id: '3'
      }
    }
  ];

  test('puissance de circulateur plafonnée à 30 W pour une faible déperdition', () => {
    const di = {};
    // GV très faible => la puissance calculée reste sous le plancher de 30 W
    conso_aux_distribution_ch(emCh, {}, di, {}, 100, 1, 1, '0', 1);
    // Pcircem19 = 30 (plancher), nref19 = 100 => 30 * 100 / 1000 = 3
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(3, 10);
  });

  test('une déperdition élevée augmente la consommation au-dessus du plancher', () => {
    const di = {};
    conso_aux_distribution_ch(emCh, {}, di, {}, 100, 1, 1, '0', 100000);
    expect(di.conso_auxiliaire_distribution_ch).toBeGreaterThan(3);
  });

  test('émetteur plancher/plafond chauffant (deltaPem=15, Fcot=0,156)', () => {
    // Type 6 => première liste : deltaPem=15, Fcot=0,156, deltaDim=7,5 (temp id 3)
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(215.1781621610199, 9);
  });

  test('émetteur radiateur monotube (deltaPem=30)', () => {
    // Type 24 => deuxième liste : deltaPem=30
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '24',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(372.082418731648, 9);
  });

  test('plusieurs émetteurs : Fcot forcé à 0,802 (cas le plus défavorable)', () => {
    // Deux émetteurs de type plancher chauffant : sans le forçage, Fcot=0,156.
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      },
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '6',
          enum_temp_distribution_ch_id: '3'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression (Fcot=0,802 malgré des planchers chauffants)
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(260.5604692803713, 9);
  });

  test('température de distribution haute (id 4) : deltaDim = 15', () => {
    const em = [
      {
        donnee_entree: {
          enum_type_emission_distribution_id: '10',
          enum_temp_distribution_ch_id: '4'
        }
      }
    ];
    const di = {};
    conso_aux_distribution_ch(em, {}, di, {}, 100, 1, 1, '0', 100000);
    // valeur de référence de régression
    expect(di.conso_auxiliaire_distribution_ch).toBeCloseTo(136.51553416032854, 9);
  });
});
