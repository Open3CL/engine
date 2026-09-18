import { describe, expect, test } from 'vitest';
import { compileFormula, evaluateFormula } from './formula.js';

describe('formula', () => {
  describe('evaluateFormula', () => {
    test.each([
      [42, 42],
      ['42', 42],
      ['0.5', 0.5],
      ['12,5', 12.5]
    ])('retourne la valeur numérique telle quelle : %s → %s', (input, expected) => {
      expect(evaluateFormula(input, 24000)).toBe(expected);
    });

    test('expose Pn en kW à partir de pn en W', () => {
      expect(evaluateFormula('Pn', 24000)).toBe(24);
    });

    test('expose logPn = log10(Pn)', () => {
      expect(evaluateFormula('logPn', 100000)).toBeCloseTo(2, 10);
    });

    test('expose les coefficients E et F', () => {
      expect(evaluateFormula('E + F * logPn', 100000, 3, 1.5)).toBeCloseTo(6, 10);
    });

    test('accepte la virgule comme séparateur décimal', () => {
      expect(evaluateFormula('0,085 * Pn', 10000)).toBeCloseTo(0.85, 10);
      expect(evaluateFormula('84,5 + 2 logPn', 100000)).toBeCloseTo(88.5, 10);
    });

    test('évalue des formules représentatives des tables de valeurs', () => {
      // rendement à pleine charge d'une chaudière : 84 + 2 logPn
      expect(evaluateFormula('84 + 2 logPn', 100000)).toBeCloseTo(88, 10);
      // pertes à l'arrêt : exposant négatif signé
      expect(evaluateFormula('2.5 * (Pn)^-0.4', 32000)).toBeCloseTo(2.5 * 32 ** -0.4, 10);
      // pourcentage
      expect(evaluateFormula('0.6% * Pn', 50000)).toBeCloseTo(0.3, 10);
    });
  });

  describe('compileFormula', () => {
    const evaluate = (formula, scope = {}) => compileFormula(formula)(scope);

    test.each([
      ['2 + 3 * 4', 14],
      ['(2 + 3) * 4', 20],
      ['10 / 4', 2.5],
      ['8 - 3 - 2', 3],
      ['16 / 4 / 2', 2],
      ['2^3^2', 512],
      ['-2^2', -4],
      ['2^-1', 0.5],
      ['-(3 - 5)', 2],
      ['+3', 3],
      ['--3', 3],
      ['log10(1000)', 3],
      ['log10(10 * 10)', 2],
      ['2(3 + 1)', 8],
      ['2 log10(100)', 4],
      ['0.6%', 0.006],
      ['50 %', 0.5],
      ['0,5 + 1', 1.5],
      ['  1 +\t2\n', 3]
    ])('%s → %s', (formula, expected) => {
      expect(evaluate(formula)).toBeCloseTo(expected, 10);
    });

    test('lit les variables dans le scope', () => {
      const scope = { Pn: 20, logPn: Math.log10(20), E: 2, F: 3 };
      expect(evaluate('Pn', scope)).toBe(20);
      expect(evaluate('E F', scope)).toBe(6);
      expect(evaluate('E + F Pn', scope)).toBe(62);
      expect(evaluate('logPn', scope)).toBeCloseTo(Math.log10(20), 10);
    });

    test('met en cache la formule compilée', () => {
      const first = compileFormula('Pn * 2 + 1');
      expect(compileFormula('Pn * 2 + 1')).toBe(first);
      expect(first({ Pn: 3 })).toBe(7);
      expect(first({ Pn: 5 })).toBe(11);
    });

    test.each([
      ['2 $ 3', /caractère inattendu `\$`/],
      ['foo + 1', /variable inconnue `foo`/],
      ['sqrt(4)', /fonction inconnue `sqrt`/],
      ['(2 + 3', /`\)` attendu/],
      ['log10(2', /`\)` attendu/],
      ['2 +', /formule incomplète/],
      ['', /formule incomplète/],
      ['2 )', /fin de formule inattendue/],
      ['* 2', /jeton inattendu `\*`/]
    ])('rejette la formule invalide `%s`', (formula, message) => {
      expect(() => compileFormula(formula)).toThrow(SyntaxError);
      expect(() => compileFormula(formula)).toThrow(message);
    });
  });
});
