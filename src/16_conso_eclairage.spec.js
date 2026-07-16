import { describe, expect, test, vi } from 'vitest';

/**
 * Le module ne dépend que du mapping enum_zone_climatique_id -> libellé de zone.
 * On le mocke afin d'isoler le test du contenu réel de `enums`.
 */
vi.mock('./enums.js', () => ({
  default: {
    zone_climatique: {
      1: 'h1a',
      2: 'h1b',
      3: 'h1c',
      4: 'h2a',
      5: 'h2b',
      6: 'h2c',
      7: 'h2d',
      8: 'h3'
    }
  }
}));

const { default: calc_conso_eclairage } = await import('./16_conso_eclairage.js');

/**
 * 16.1 Consommation d'éclairage (Cecl)
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §16.1
 *
 * Cecl = (C * Pecl * Nh) / 1000 avec C = 0.9 (interrupteur) et Pecl = 1.4 W/m²
 * Nh = nombre d'heures de fonctionnement de l'éclairage, fonction de la zone climatique.
 */
describe("Calcul de la consommation d'éclairage (Cecl)", () => {
  // [enum_zone_climatique_id, libellé, Nh, Cecl attendu]
  test.each([
    ['1', 'h1a', 1500, (0.9 * 1.4 * 1500) / 1000],
    ['2', 'h1b', 1445, (0.9 * 1.4 * 1445) / 1000],
    ['3', 'h1c', 1476, (0.9 * 1.4 * 1476) / 1000],
    ['4', 'h2a', 1500, (0.9 * 1.4 * 1500) / 1000],
    ['5', 'h2b', 1531, (0.9 * 1.4 * 1531) / 1000],
    ['6', 'h2c', 1566, (0.9 * 1.4 * 1566) / 1000],
    ['7', 'h2d', 1566, (0.9 * 1.4 * 1566) / 1000],
    ['8', 'h3', 1506, (0.9 * 1.4 * 1506) / 1000]
  ])(
    'zone climatique %s (%s) : Nh=%d heures => Cecl attendu',
    (zc_id, _libelle, _nh, cecl_attendu) => {
      expect(calc_conso_eclairage(zc_id)).toBeCloseTo(cecl_attendu, 10);
    }
  );

  test('la consommation est identique pour deux zones ayant le même Nh (h1a et h2a)', () => {
    expect(calc_conso_eclairage('1')).toBeCloseTo(calc_conso_eclairage('4'), 10);
  });

  test("la consommation croît avec le nombre d'heures (h1b < h3 < h2c)", () => {
    expect(calc_conso_eclairage('2')).toBeLessThan(calc_conso_eclairage('8'));
    expect(calc_conso_eclairage('8')).toBeLessThan(calc_conso_eclairage('6'));
  });

  test('retourne NaN pour un identifiant de zone climatique inconnu', () => {
    // enums.zone_climatique[zc_id] est undefined => Nh[undefined] est undefined => NaN
    expect(calc_conso_eclairage('99')).toBeNaN();
  });
});
