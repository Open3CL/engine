import { ObjectUtil } from './object-util.js';
import { describe, expect, test } from 'vitest';

const identite = (x) => x;

describe('ObjectUtil unit tests', () => {
  test("retourne la primitive telle quelle quand la racine n'est ni objet ni tableau", () => {
    // Branche terminale `: obj` : une primitive n'est pas transformée.
    expect(ObjectUtil.deepObjectTransform('brut', identite, identite)).toBe('brut');
    expect(ObjectUtil.deepObjectTransform(42, identite, identite)).toBe(42);
  });

  test('conserve une valeur nulle sans tenter de la parcourir récursivement', () => {
    // Branche `val !== null` : `null` est de type "object" mais ne doit pas
    // être exploré récursivement.
    const resultat = ObjectUtil.deepObjectTransform(
      { a: null },
      (key) => key.toUpperCase(),
      identite
    );

    expect(resultat).toEqual({ A: null });
  });

  test('should be able to deeply transform an object keys and values', () => {
    expect(
      ObjectUtil.deepObjectTransform(
        { key1: 'Value1', key2: 'Value2', nested: [{ key3: 'Value3' }] },
        (key) => {
          return key.toUpperCase();
        },
        (value) => {
          return typeof value === 'string' ? value.toLowerCase() : value;
        }
      )
    ).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
      NESTED: [
        {
          KEY3: 'value3'
        }
      ]
    });
  });
});
