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
});
