import { describe, expect, test } from 'vitest';

describe('index.js (point d’entrée du package)', () => {
  test('est importable et expose les fonctions publiques (régression : calc_deperdition export par défaut)', async () => {
    const api = await import('./index.js');

    expect(Object.keys(api).sort()).toEqual(
      [
        'Ubv',
        'Umur',
        'Upb',
        'Uph',
        'Uporte',
        'Upt',
        'calc_deperdition',
        'calcul_3cl',
        'calcul_3cl_xml',
        'getVersion',
        'get_classe_ges_dpe',
        'get_conso_coeff_1_7_2027'
      ].sort()
    );
    for (const nom of Object.keys(api)) {
      expect(typeof api[nom]).toBe('function');
    }
  });
});
