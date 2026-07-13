import { describe, expect, test } from 'vitest';
import { PRECISION } from './constants.js';

describe('Constantes du moteur', () => {
  test('PRECISION vaut 100000', () => {
    expect(PRECISION).toBe(100000);
  });

  test('PRECISION est un entier positif utilisable comme facteur d’arrondi', () => {
    expect(typeof PRECISION).toBe('number');
    expect(Number.isInteger(PRECISION)).toBe(true);
    expect(PRECISION).toBeGreaterThan(0);
  });
});
