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
});
