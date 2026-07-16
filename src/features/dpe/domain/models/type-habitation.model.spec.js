import { describe, expect, test } from 'vitest';
import { TypeHabitation, TypeDpe } from './type-habitation.model.js';

describe('Modèle TypeHabitation', () => {
  test("expose les types d'habitation attendus", () => {
    expect(TypeHabitation).toEqual({
      MAISON: 'MAISON',
      APPARTEMENT: 'APPARTEMENT',
      IMMEUBLE: 'IMMEUBLE'
    });
  });

  test('chaque clé est auto-référencée par sa valeur', () => {
    Object.entries(TypeHabitation).forEach(([cle, valeur]) => {
      expect(valeur).toBe(cle);
    });
  });
});

describe('Modèle TypeDpe', () => {
  test('expose les types de DPE attendus', () => {
    expect(TypeDpe).toEqual({
      MAISON: 'MAISON',
      APPARTEMENT: 'APPARTEMENT',
      APPARTEMENT_A_PARTIR_IMMEUBLE: 'APPARTEMENT_A_PARTIR_IMMEUBLE',
      IMMEUBLE: 'IMMEUBLE'
    });
  });

  test('les valeurs sont uniques et non vides', () => {
    const valeurs = Object.values(TypeDpe);
    expect(new Set(valeurs).size).toBe(valeurs.length);
    valeurs.forEach((valeur) => expect(valeur.length).toBeGreaterThan(0));
  });

  test('reprend les types communs avec TypeHabitation', () => {
    expect(TypeDpe.MAISON).toBe(TypeHabitation.MAISON);
    expect(TypeDpe.APPARTEMENT).toBe(TypeHabitation.APPARTEMENT);
    expect(TypeDpe.IMMEUBLE).toBe(TypeHabitation.IMMEUBLE);
  });
});
