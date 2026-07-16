import { describe, expect, test } from 'vitest';
import { UPB_ADDITIONAL_VALUES } from './additional-ue-values.js';

/**
 * `UPB_ADDITIONAL_VALUES` complète la table de valeurs Ue pour les
 * déperditions des planchers bas. On vérifie la cohérence structurelle des
 * entrées sans figer l'intégralité des valeurs numériques.
 */
describe('Valeurs Ue additionnelles (UPB_ADDITIONAL_VALUES)', () => {
  test('est un tableau non vide', () => {
    expect(Array.isArray(UPB_ADDITIONAL_VALUES)).toBe(true);
    expect(UPB_ADDITIONAL_VALUES.length).toBeGreaterThan(0);
  });

  test('chaque entrée possède les métadonnées d’adjacence attendues', () => {
    UPB_ADDITIONAL_VALUES.forEach((entree) => {
      expect(entree).toHaveProperty('type_adjacence_plancher');
      expect(entree).toHaveProperty('enum_type_adjacence_id');
      expect(entree).toHaveProperty('type_adjacence');
      expect(entree).toHaveProperty('enum_periode_construction_id');
      expect(entree).toHaveProperty('periode_construction');
      expect(Array.isArray(entree.values)).toBe(true);
      expect(entree.values.length).toBeGreaterThan(0);
    });
  });

  test('chaque valeur contient les clés 2s_p, upb et ue exploitables numériquement', () => {
    UPB_ADDITIONAL_VALUES.forEach((entree) => {
      entree.values.forEach((valeur) => {
        expect(valeur).toHaveProperty('2s_p');
        expect(Number.isNaN(parseFloat(valeur.upb))).toBe(false);
        expect(Number.isNaN(parseFloat(valeur.ue))).toBe(false);
      });
    });
  });
});
