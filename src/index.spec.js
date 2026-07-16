import { describe, expect, test, vi } from 'vitest';

/**
 * `index.js` est un simple point d'entrée qui ré-exporte des fonctions/valeurs
 * provenant de `engine.js` et `3_deperdition.js`. On mocke ces deux modules avec
 * des identités reconnaissables afin de vérifier que chaque symbole est bien
 * ré-exporté tel quel (même référence).
 */
vi.mock('./engine.js', () => ({
  calcul_3cl: vi.fn(),
  calcul_3cl_xml: vi.fn(),
  get_classe_ges_dpe: vi.fn(),
  get_conso_coeff_1_9_2026: vi.fn(),
  getVersion: vi.fn()
}));

vi.mock('./3_deperdition.js', () => ({
  default: vi.fn(),
  Umur: vi.fn(),
  Uph: vi.fn(),
  Upb: vi.fn(),
  Uporte: vi.fn(),
  Ubv: vi.fn(),
  Upt: vi.fn()
}));

const index = await import('./index.js');
const engine = await import('./engine.js');
const deperdition = await import('./3_deperdition.js');

describe('index - ré-exports depuis engine.js', () => {
  test.each([
    'calcul_3cl',
    'calcul_3cl_xml',
    'get_classe_ges_dpe',
    'get_conso_coeff_1_9_2026',
    'getVersion'
  ])("ré-exporte %s à l'identique depuis engine.js", (nom) => {
    expect(index[nom]).toBe(engine[nom]);
    expect(typeof index[nom]).toBe('function');
  });
});

describe('index - ré-exports depuis 3_deperdition.js', () => {
  test.each(['Umur', 'Uph', 'Upb', 'Uporte', 'Ubv', 'Upt'])(
    "ré-exporte %s à l'identique depuis 3_deperdition.js",
    (nom) => {
      expect(index[nom]).toBe(deperdition[nom]);
      expect(typeof index[nom]).toBe('function');
    }
  );

  test("ne ré-exporte pas l'export par défaut de 3_deperdition.js", () => {
    // index.js n'expose que les exports nommés Umur, Uph, ...
    expect(index.default).toBeUndefined();
  });
});
