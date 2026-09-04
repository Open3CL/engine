import { describe, expect, test } from 'vitest';
import { TypeVentilation } from './type-ventilation.model.js';

describe('Modèle TypeVentilation', () => {
  test('expose les types de ventilation attendus', () => {
    expect(TypeVentilation).toEqual({
      SIMPLE_FLUX_AUTO: 'SIMPLE_FLUX_AUTO',
      SIMPLE_FLUX_HYGRO: 'SIMPLE_FLUX_HYGRO',
      DOUBLE_FLUX: 'DOUBLE_FLUX'
    });
  });

  test('chaque clé est auto-référencée et les valeurs sont uniques', () => {
    const valeurs = Object.values(TypeVentilation);
    Object.entries(TypeVentilation).forEach(([cle, valeur]) => expect(valeur).toBe(cle));
    expect(new Set(valeurs).size).toBe(valeurs.length);
    valeurs.forEach((valeur) => expect(valeur.length).toBeGreaterThan(0));
  });
});
