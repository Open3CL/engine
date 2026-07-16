import {
  convertExpression,
  excel_to_js_exec,
  getRange,
  getThicknessFromDescription
} from './utils.js';
import { describe, expect, test } from 'vitest';

describe('Utils unit tests', () => {
  test.each([
    [0, null],
    [0, undefined],
    [0, ''],
    [0, 'Mur en blocs de béton creux'],
    [0, "Mur en blocs de béton creux d'épaisseur xxx cm non isolé"],
    [4, "Mur en blocs de béton creux d'épaisseur 4 cm non isolé"],
    [25, "Mur en blocs de béton creux d'&apos;'épaisseur ≥ 25 cm non isolé"]
  ])('should get thickness %s from description %s', (thickness, description) => {
    expect(getThicknessFromDescription(description)).toBe(thickness);
  });

  test.each([
    ['70 < Pn <= 400', '(70 < Pn) && (Pn <= 400)'],
    ['70 < Pn', '70 < Pn'],
    ['Pn <= 400', 'Pn <= 400'],
    ['Pn == 400', 'Pn == 400'],
    ['Pn', 'Pn'],
    [null, null],
    [undefined, undefined]
  ])('should transform expression %s to %s', (expression, expected) => {
    expect(convertExpression(expression)).toBe(expected);
  });

  test.each([
    [[1, 1.2, 3.4, 5.6], 0.5, [1, 1.2]],
    [[1, 1.2, 3.4, 5.6], 1, [1, 1]],
    [[1, 1.2, 3.4, 5.6], 1.3, [1.2, 3.4]],
    [[1, 1.2, 3.4, 5.6], 6.5, [3.4, 5.6]]
  ])('should for values %s and inputNumber %s return range %s', (ranges, inputNumber, expected) => {
    expect(getRange(inputNumber, ranges)).toStrictEqual(expected);
  });

  describe('excel_to_js_exec', () => {
    // Règle : une valeur numérique est retournée telle quelle (le séparateur décimal virgule
    // est converti en point au préalable).
    test.each([
      ['12', 12],
      ['0,6', 0.6],
      [42, 42]
    ])('retourne la valeur numérique %s telle quelle', (value, expected) => {
      expect(excel_to_js_exec(value, 25000)).toBe(expected);
    });

    // Règle : `Pn` est exprimé en kW (l'argument `pn` fourni en W est divisé par 1000) et
    // `logPn` vaut son logarithme décimal.
    test('expose Pn en kW et logPn = log10(Pn)', () => {
      // Pn = 25000 / 1000 = 25 → logPn = log10(25)
      expect(excel_to_js_exec('Pn', 25000)).toBe(25);
      expect(excel_to_js_exec('logPn', 25000)).toBeCloseTo(Math.log10(25), 12);
    });

    // Règle : le pourcentage est interprété comme une fraction (`0.6%` → 0.006).
    test('interprète un pourcentage comme une fraction', () => {
      expect(excel_to_js_exec('0.6%', 25000)).toBeCloseTo(0.006, 12);
    });

    // Valeurs de référence de régression (calculées via le vrai module).
    test.each([
      // formule, pn, E, F, résultat attendu
      ['84 + 2 logPn', 25000, undefined, undefined, 86.79588001734407],
      ['Pn * (E + F * logPn) / 100', 50000, 2.5, -0.8, 0.5704119982655924],
      ['0,085*Pn*(Pn)^-0,4', 25000, undefined, undefined, 0.5863851061210162]
    ])('évalue la formule %s (pn=%s)', (formula, pn, E, F, expected) => {
      expect(excel_to_js_exec(formula, pn, E, F)).toBeCloseTo(expected, 9);
    });
  });
});
