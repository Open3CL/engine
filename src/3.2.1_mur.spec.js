import calc_mur from './3.2.1_mur.js';
import { describe, expect, test } from 'vitest';

describe('Recherche de bugs dans le calcul de déperdition des murs', () => {
  /**
   * @see : https://redfroggy.atlassian.net/browse/KAR-119
   */
  test('calcul de déperdition pour les murs de 2213E0696993Z', () => {
    const zc = 8; // H3
    const pc_id = 2; // Période de construction (1948)
    const ej = 0;
    const mur = {
      donnee_entree: {
        description:
          "Mur  2 Est - Inconnu donnant sur des circulations sans ouverture directe sur l'extérieur",
        reference: '2021_08_24_18_02_58_7233440008111783',
        tv_coef_reduction_deperdition_id: 78,
        surface_aiu: 22,
        surface_aue: 15,
        enum_cfg_isolation_lnc_id: '2',
        enum_type_adjacence_id: '14', // Circulation sans ouverture directe sur l'extérieur
        enum_orientation_id: '3', // Est
        surface_paroi_totale: 10.5,
        surface_paroi_opaque: 10.5,
        tv_umur0_id: 1,
        enum_materiaux_structure_mur_id: '1', // Inconnu
        enum_methode_saisie_u0_id: '2', // déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire
        paroi_ancienne: 0,
        enum_type_doublage_id: '2', // absence de doublage
        enum_type_isolation_id: '1', // inconnu
        enum_periode_isolation_id: '2', // 1948-1974
        tv_umur_id: 6, //
        enum_methode_saisie_u_id: '8' // année de construction saisie (table forfaitaire)
      },
      donnee_intermediaire: {
        b: 0.35,
        umur: 2.5,
        umur0: 2.5
      }
    };
    calc_mur(mur, zc, pc_id, ej);

    expect(mur.donnee_intermediaire.b).toBe(0.35);
    expect(mur.donnee_intermediaire.umur).toBe(2.5);
    expect(mur.donnee_intermediaire.umur0).toBe(2.5);
  });

  /**
   * Test for GitHub issue #138: umur0 lookup should return table values, not calculated values
   * Mur en ossature bois avec isolant en remplissage should use proper thickness ranges
   * @see : https://github.com/Open3CL/engine/issues/138
   */
  test('mur en ossature bois avec isolant - épaisseur non exacte doit retourner la valeur table', () => {
    const zc = 8; // H3
    const pc_id = 1; // avant 1948
    const ej = 0;

    // Test avec material 26 (ossature bois isolant <2001) et épaisseur 16cm
    // La table a des valeurs à 15cm et 20cm, donc 16cm doit utiliser la valeur de 15cm
    const mur = {
      donnee_entree: {
        description: "Mur en ossature bois avec remplissage isolant avant 2001 d'épaisseur 16 cm",
        reference: 'test_issue_138',
        enum_type_adjacence_id: '1', // extérieur
        enum_orientation_id: '1', // Nord
        surface_paroi_totale: 10,
        surface_paroi_opaque: 10,
        enum_materiaux_structure_mur_id: '26', // Murs en ossature bois avec isolant en remplissage <2001
        epaisseur_structure: 16,
        enum_methode_saisie_u0_id: '2', // déterminé selon le matériau et épaisseur
        enum_type_doublage_id: '2', // absence de doublage
        enum_type_isolation_id: '2', // non isolé
        enum_methode_saisie_u_id: '1' // non isolé
      }
    };
    calc_mur(mur, zc, pc_id, ej);

    // umur0 should be 0.45 (value for material 26 at 15cm), not a calculated value
    // The bug was returning values from wrong materials due to incorrect tv() matching
    expect(mur.donnee_intermediaire.umur0).toBe(0.45);
    expect(mur.donnee_intermediaire.umur).toBe(0.45);
  });

  /**
   * Test for various non-exact thickness values to ensure correct table lookup
   */
  test.each([
    { material: '26', thickness: 11, expectedUmur0: 0.65 }, // between 10 and 15, use 10
    { material: '26', thickness: 16, expectedUmur0: 0.45 }, // between 15 and 20, use 15
    { material: '26', thickness: 22, expectedUmur0: 0.34 }, // between 20 and 25, use 20
    { material: '24', thickness: 16, expectedUmur0: 0.41 }, // between 15 and 20, use 15
    { material: '24', thickness: 46, expectedUmur0: 0.13 } // >= 45, use 45
  ])(
    'mur material $material avec épaisseur $thickness doit retourner umur0=$expectedUmur0',
    ({ material, thickness, expectedUmur0 }) => {
      const zc = 8;
      const pc_id = 1;
      const ej = 0;

      const mur = {
        donnee_entree: {
          description: 'Test mur',
          reference: 'test_thickness_ranges',
          enum_type_adjacence_id: '1',
          enum_orientation_id: '1',
          surface_paroi_totale: 10,
          surface_paroi_opaque: 10,
          enum_materiaux_structure_mur_id: material,
          epaisseur_structure: thickness,
          enum_methode_saisie_u0_id: '2',
          enum_type_doublage_id: '2',
          enum_type_isolation_id: '2',
          enum_methode_saisie_u_id: '1'
        }
      };
      calc_mur(mur, zc, pc_id, ej);

      expect(mur.donnee_intermediaire.umur0).toBe(expectedUmur0);
    }
  );
});
