import { describe, expect, test } from 'vitest';
import { parseJsonWithDuplicateKeys } from './parse-json-duplicate-keys.js';

describe('parseJsonWithDuplicateKeys', () => {
  test('se comporte comme JSON.parse sans clé dupliquée', () => {
    const text = JSON.stringify({
      a: 1,
      b: -2.5e3,
      c: 'texte "échappé" \\ \n é',
      d: [1, { e: null }, true, false, []],
      f: {}
    });
    expect(parseJsonWithDuplicateKeys(text)).toEqual(JSON.parse(text));
  });

  test('regroupe les valeurs des clés dupliquées dans un tableau, dans l’ordre', () => {
    const text = `{
      "baie_vitree_collection": {
        "baie_vitree": { "id": 1 },
        "baie_vitree": { "id": 2 },
        "baie_vitree": { "id": 3 }
      }
    }`;
    expect(parseJsonWithDuplicateKeys(text)).toEqual({
      baie_vitree_collection: { baie_vitree: [{ id: 1 }, { id: 2 }, { id: 3 }] }
    });
  });

  test("ne fusionne pas un tableau d'origine avec un doublon suivant", () => {
    expect(parseJsonWithDuplicateKeys('{"a": [1, 2], "a": [3]}')).toEqual({ a: [[1, 2], [3]] });
  });

  test('conserve une clé unique sous forme d’objet', () => {
    expect(parseJsonWithDuplicateKeys('{"mur": {"id": 1}}')).toEqual({ mur: { id: 1 } });
  });

  test('rejette un JSON invalide', () => {
    expect(() => parseJsonWithDuplicateKeys('{"a": 1')).toThrow(SyntaxError);
    expect(() => parseJsonWithDuplicateKeys('{"a": 1} x')).toThrow(SyntaxError);
  });
});
