import { calc_intermittence } from './8_intermittence.js';
import { describe, expect, test } from 'vitest';

/**
 * 8. Modélisation de l'intermittence
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §8
 *
 * i = i0 / (1 + 0.1 * (G - 1)) avec G = GV / (Sh * Hsp)
 * (fonction pure, aucune dépendance à mocker).
 */
describe("Calcul de l'intermittence (int)", () => {
  test("G > 1 : le facteur d'intermittence est réduit sous i0", () => {
    // GV=300, Sh=100, Hsp=2.5 => G = 1.2 => 0.9 / (1 + 0.1 * 0.2)
    expect(calc_intermittence(300, 100, 2.5, 0.9)).toBeCloseTo(0.8823529411764706, 12);
  });

  test("G = 1 : le facteur d'intermittence vaut exactement i0", () => {
    // GV = Sh * Hsp => G = 1 => i0 / (1 + 0) = i0
    expect(calc_intermittence(250, 100, 2.5, 0.85)).toBe(0.85);
  });

  test("le facteur d'intermittence décroît quand G (donc GV) augmente", () => {
    const faibleG = calc_intermittence(250, 100, 2.5, 0.9);
    const fortG = calc_intermittence(500, 100, 2.5, 0.9);
    expect(fortG).toBeLessThan(faibleG);
  });

  test('le résultat est proportionnel à i0 pour un même G', () => {
    const a = calc_intermittence(300, 100, 2.5, 0.9);
    const b = calc_intermittence(300, 100, 2.5, 0.45);
    expect(a).toBeCloseTo(2 * b, 12);
  });
});
