import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * `requestInput` est mocké en simple passe-plat : il retourne la valeur portée par les données
 * d'entrée `de` pour le champ demandé. Cela isole `calc_pvent` de la logique de `utils`.
 */
vi.mock('./utils.js', () => ({
  requestInput: (de, du, field) => de[field]
}));

const { default: calc_pvent } = await import('./5_conso_ventilation.js');

/**
 * 5. Consommation des auxiliaires de ventilation
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §5, pages 41-42
 */
describe('calc_pvent - consommation des auxiliaires de ventilation', () => {
  let di;
  let du;

  beforeEach(() => {
    di = {};
    du = {};
  });

  test('ne calcule rien si le type de ventilation est indéfini', () => {
    calc_pvent(di, {}, du, 'maison');
    expect(di).toEqual({});
  });

  test('ventilation naturelle : consommation nulle', () => {
    const de = { type_ventilation: 'ventilation naturelle par conduit', ventilation_post_2012: 0 };
    calc_pvent(di, de, du, 'maison');
    expect(di.conso_auxiliaire_ventilation).toBe(0);
  });

  test('maison, VMC simple flux auto après 2012 : Pvent = 35 W', () => {
    const de = { type_ventilation: 'vmc sf auto réglable après 2012', ventilation_post_2012: 1 };
    calc_pvent(di, de, du, 'maison');
    // pvent_moy_maison['simple flux auto'][1] * coef(non hybride = 1) = 35
    expect(di.pvent_moy).toBe(35);
    expect(di.conso_auxiliaire_ventilation).toBeCloseTo(8.76 * 35, 10);
  });

  test('maison, VMC double flux avant 2013 : Pvent = 80 W', () => {
    const de = { type_ventilation: 'vmc df sans échangeur avant 2013', ventilation_post_2012: 0 };
    calc_pvent(di, de, du, 'maison');
    expect(di.pvent_moy).toBe(80);
  });

  test("maison, ventilation hybride : ratio de temps d'utilisation appliqué (14/168)", () => {
    const de = { type_ventilation: 'ventilation hybride après 2012', ventilation_post_2012: 1 };
    calc_pvent(di, de, du, 'maison');
    // hybride => type 'simple flux auto', post_2012 forcé à 0, coef = 14 / (24*7)
    const coef = 14 / (24 * 7);
    expect(di.pvent_moy).toBeCloseTo(65 * coef, 10);
  });

  test('immeuble, VMC double flux : Pvent proratisé au débit et à la surface ventilée', () => {
    di.qvarep_conv = 2;
    const de = {
      type_ventilation: 'vmc df collective avec échangeur avant 2013',
      ventilation_post_2012: 0,
      surface_ventile: 50
    };
    calc_pvent(di, de, du, 'immeuble');
    // pvent_immeuble['double flux'][0] * qvarep_conv * surface_ventile * coef(1) = 1.1 * 2 * 50
    expect(di.pvent_moy).toBeCloseTo(1.1 * 2 * 50, 10);
    expect(di.conso_auxiliaire_ventilation).toBeCloseTo(8.76 * 110, 10);
  });

  test("immeuble, ventilation hybride : ratio de temps d'utilisation immeuble (28/168)", () => {
    // Branche `th !== 'maison'` du ratio hybride (28 au lieu de 14)
    di.qvarep_conv = 2;
    const de = {
      type_ventilation: 'ventilation hybride de 2001 à 2012',
      ventilation_post_2012: 1,
      surface_ventile: 50
    };
    calc_pvent(di, de, du, 'immeuble');
    // hybride => type 'simple flux auto', post_2012 forcé à 0 => pvent_immeuble = 0.46
    const coef = 28 / (24 * 7);
    expect(di.pvent_moy).toBeCloseTo(0.46 * 2 * 50 * coef, 10);
  });
});

/**
 * Couverture exhaustive des libellés de type de ventilation (branches du switch).
 * Chaque libellé doit être routé vers le bon groupe (naturelle => conso nulle,
 * sinon simple flux auto / hygro / double flux avec une consommation positive).
 */
describe('calc_pvent - routage de tous les types de ventilation', () => {
  const naturelles = [
    'ventilation par ouverture des fenêtres',
    "ventilation par entrées d'air hautes et basses",
    'ventilation naturelle par conduit',
    "ventilation naturelle par conduit avec entrées d'air hygro",
    'puits climatique sans échangeur avant 2013',
    'puits climatique sans échangeur à partir de 2013',
    'puits climatique avec échangeur avant 2013',
    'puits climatique avec échangeur à partir de 2013'
  ];

  test.each(naturelles)('ventilation naturelle "%s" : consommation nulle', (type_ventilation) => {
    const di = {};
    calc_pvent(di, { type_ventilation, ventilation_post_2012: 0 }, {}, 'maison');
    expect(di.conso_auxiliaire_ventilation).toBe(0);
    expect(di.pvent_moy).toBeUndefined();
  });

  const hybrides = [
    'ventilation hybride avant  2001',
    'ventilation hybride de 2001 à 2012',
    'ventilation hybride après 2012',
    "ventilation hybride avec entrées d'air hygro avant  2001",
    "ventilation hybride avec entrées d'air hygro de 2001 à 2012",
    "ventilation hybride avec entrées d'air hygro après 2012"
  ];

  test.each(hybrides)(
    'ventilation hybride "%s" : simple flux auto avec ratio 14/168 (maison)',
    (type_ventilation) => {
      const di = {};
      // Même avec ventilation_post_2012 = 1, l'hybride force post_2012 = 0 (=> 65 W)
      calc_pvent(di, { type_ventilation, ventilation_post_2012: 1 }, {}, 'maison');
      expect(di.pvent_moy).toBeCloseTo(65 * (14 / (24 * 7)), 10);
    }
  );

  const simpleFluxAuto = [
    'ventilation mécanique sur conduit existant avant 2013',
    'ventilation mécanique sur conduit existant à partir de 2013',
    'vmc sf auto réglable avant 1982',
    'vmc sf auto réglable de 1982 à 2000',
    'vmc sf auto réglable de 2001 à 2012',
    'vmc sf auto réglable après 2012',
    'vmc sf gaz avant  2001',
    'vmc sf gaz de 2001 à 2012',
    'vmc sf gaz après 2012'
  ];

  test.each(simpleFluxAuto)(
    'simple flux auto "%s" : 65 W (maison, avant 2012)',
    (type_ventilation) => {
      const di = {};
      calc_pvent(di, { type_ventilation, ventilation_post_2012: 0 }, {}, 'maison');
      expect(di.pvent_moy).toBe(65);
    }
  );

  const simpleFluxHygro = [
    'vmc sf hygro b avant  2001',
    'vmc sf hygro b de 2001 à 2012',
    'vmc sf hygro b après 2012',
    'vmc sf hygro a avant 2001',
    'vmc sf hygro a de 2001 à 2012',
    'vmc sf hygro a après 2012',
    'vmc basse pression auto-réglable',
    'vmc basse pression hygro a',
    'vmc basse pression hygro b'
  ];

  test.each(simpleFluxHygro)(
    'simple flux hygro "%s" : 50 W (maison, avant 2012)',
    (type_ventilation) => {
      const di = {};
      calc_pvent(di, { type_ventilation, ventilation_post_2012: 0 }, {}, 'maison');
      expect(di.pvent_moy).toBe(50);
    }
  );

  const doubleFlux = [
    'vmc df individuelle avec échangeur avant 2013',
    'vmc df individuelle avec échangeur à partir de 2013',
    'vmc df collective avec échangeur avant 2013',
    'vmc df collective avec échangeur à partir de 2013',
    'vmc df sans échangeur avant 2013',
    'vmc df sans échangeur après 2012'
  ];

  test.each(doubleFlux)('double flux "%s" : 80 W (maison, avant 2012)', (type_ventilation) => {
    const di = {};
    calc_pvent(di, { type_ventilation, ventilation_post_2012: 0 }, {}, 'maison');
    expect(di.pvent_moy).toBe(80);
  });
});
