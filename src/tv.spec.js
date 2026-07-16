import { describe, expect, test } from 'vitest';

/**
 * `tv.js` ne contient que des données : le catalogue des tables de valeurs
 * du DPE 3CL. On vérifie ici uniquement la structure des exports (export nommé
 * `tvs` + export par défaut identique) et quelques invariants de forme, sans
 * dépendre de la valeur métier des tables.
 */
const { tvs, default: tvsDefault } = await import('./tv.js');

describe('tv - structure des exports', () => {
  test('exporte un objet non vide `tvs`', () => {
    expect(tvs).toBeTypeOf('object');
    expect(tvs).not.toBeNull();
    expect(Object.keys(tvs).length).toBeGreaterThan(0);
  });

  test("l'export par défaut est la même référence que l'export nommé", () => {
    expect(tvsDefault).toBe(tvs);
  });
});

describe('tv - forme des tables', () => {
  test('la table coef_reduction_deperdition est un tableau de lignes indexées', () => {
    const table = tvs.coef_reduction_deperdition;
    expect(Array.isArray(table)).toBe(true);
    expect(table.length).toBeGreaterThan(0);
    // chaque ligne possède son identifiant de table de valeur
    expect(table[0]).toHaveProperty('tv_coef_reduction_deperdition_id');
  });

  test('toutes les valeurs de premier niveau sont des objets (tableaux ou dictionnaires)', () => {
    for (const [nom, table] of Object.entries(tvs)) {
      expect(table, `table ${nom}`).toBeTypeOf('object');
      expect(table, `table ${nom}`).not.toBeNull();
    }
  });
});
