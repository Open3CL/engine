import { describe, expect, test } from 'vitest';
import enums from './enums.js';

/**
 * `enums.js` est un gros mapping figé (identifiant -> libellé) issu du modèle
 * de données ADEME. On ne fige pas l'intégralité du contenu : on vérifie
 * uniquement des invariants structurels et la présence de quelques enums clés.
 */
describe('Table des enums (enums.js)', () => {
  test('exporte un objet non vide par défaut', () => {
    expect(enums).toBeTypeOf('object');
    expect(enums).not.toBeNull();
    expect(Object.keys(enums).length).toBeGreaterThan(0);
  });

  test('quelques enums clés sont présents et non vides', () => {
    ['version', 'modele_dpe', 'usage_fonctionnel_batiment', 'consentement_formulaire'].forEach(
      (cle) => {
        expect(enums).toHaveProperty(cle);
        expect(Object.keys(enums[cle]).length).toBeGreaterThan(0);
      }
    );
  });

  test('chaque enum est un objet dont les libellés sont des chaînes non vides', () => {
    Object.entries(enums).forEach(([nomEnum, valeurs]) => {
      expect(valeurs, `enum ${nomEnum}`).toBeTypeOf('object');
      Object.values(valeurs).forEach((libelle) => {
        expect(typeof libelle).toBe('string');
        expect(libelle.length).toBeGreaterThan(0);
      });
    });
  });

  test('les identifiants (clés) sont uniques au sein de chaque enum', () => {
    Object.entries(enums).forEach(([nomEnum, valeurs]) => {
      const cles = Object.keys(valeurs);
      expect(new Set(cles).size, `enum ${nomEnum}`).toBe(cles.length);
    });
  });

  test('contenu attendu pour l’enum modele_dpe', () => {
    expect(enums.modele_dpe['1']).toBe('dpe 3cl 2021 méthode logement');
    expect(enums.consentement_formulaire['0']).toBe('absence de consentement');
  });
});
