import { describe, expect, test } from 'vitest';
import { TypeStockage } from './type-stockage.model.js';

describe('Modèle TypeStockage', () => {
  test('expose les types de stockage attendus', () => {
    expect(TypeStockage).toEqual({
      INSTANTANE: 'INSTANTANE',
      INTEGRE: 'INTEGRE',
      INDEPENDANT: 'INDEPENDANT'
    });
  });

  test('chaque clé est auto-référencée et les valeurs sont uniques', () => {
    const valeurs = Object.values(TypeStockage);
    Object.entries(TypeStockage).forEach(([cle, valeur]) => expect(valeur).toBe(cle));
    expect(new Set(valeurs).size).toBe(valeurs.length);
  });
});
