import { describe, expect, test } from 'vitest';
import { TypeGenerateur } from './type-generateur.model.js';

describe('Modèle TypeGenerateur', () => {
  test('expose les types de générateurs attendus', () => {
    expect(TypeGenerateur).toEqual({
      COMBUSTION: 'COMBUSTION',
      PAC: 'PAC',
      OTHER: 'OTHER'
    });
  });

  test('chaque clé correspond à une valeur chaîne identique (auto-référence)', () => {
    Object.entries(TypeGenerateur).forEach(([cle, valeur]) => {
      expect(typeof valeur).toBe('string');
      expect(valeur).toBe(cle);
    });
  });

  test('les valeurs sont uniques et non vides', () => {
    const valeurs = Object.values(TypeGenerateur);
    expect(valeurs.length).toBeGreaterThan(0);
    expect(new Set(valeurs).size).toBe(valeurs.length);
    valeurs.forEach((valeur) => expect(valeur.length).toBeGreaterThan(0));
  });
});
