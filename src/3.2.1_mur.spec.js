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
   * @see https://github.com/Open3CL/engine/issues/146
   * Le doublage NE doit PAS être cumulé à une isolation ITE ou ITI.
   */
  describe('[MURS] Doublage non cumulé à une isolation ITE/ITI (#146)', () => {
    const baseDE = {
      enum_type_adjacence_id: '1', // Paroi sur l'extérieur (b=1)
      enum_materiaux_structure_mur_id: '11', // Béton ≤20 cm
      epaisseur_structure: 20,
      enum_methode_saisie_u0_id: '2',
      paroi_ancienne: 0
    };

    test('doublage avec ITI : le doublage ne doit pas être pris en compte dans Umur0', () => {
      const zc = 3; // H2a
      const pc_id = 6;
      const ej = 0;
      // Mur béton 20 cm (umur0 ~ 2.5), avec doublage connu (type 5) ET isolation ITI (type 3)
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITI',
          enum_methode_saisie_u_id: '3', // épaisseur isolation saisie
          epaisseur_isolation: 10, // 10 cm
          enum_type_doublage_id: '5', // doublage connu (plâtre brique bois)
          enum_type_isolation_id: '3' // ITI
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // Sans doublage cumulé, umur0 = 2.5 (valeur brute du mur béton ≤20cm)
      // Avec doublage cumulé à tort : umur0 = 1 / (1/2.5 + 0.21) ≈ 1.724
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.5, 2);
    });

    test('doublage avec ITE : le doublage ne doit pas être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITE',
          enum_methode_saisie_u_id: '3',
          epaisseur_isolation: 8,
          enum_type_doublage_id: '4', // doublage indéterminé lame d'air sup 15mm
          enum_type_isolation_id: '4' // ITE
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // umur0 = 2.5 (béton ≤20cm, doublage ignoré car ITE présent)
      expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.5, 2);
    });

    test('doublage avec ITR seule : le doublage DOIT être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage et ITR',
          enum_methode_saisie_u_id: '1', // non isolé
          enum_type_doublage_id: '5', // doublage connu
          enum_type_isolation_id: '5' // ITR
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // ITR seule → le doublage est pris en compte : umur0 < 2.5
      expect(mur.donnee_intermediaire.umur0).toBeLessThan(2.5);
    });

    test('doublage sans isolation : le doublage DOIT être pris en compte dans Umur0', () => {
      const zc = 3;
      const pc_id = 6;
      const ej = 0;
      const mur = {
        donnee_entree: {
          ...baseDE,
          description: 'Mur béton avec doublage sans isolation',
          enum_methode_saisie_u_id: '1', // non isolé
          enum_type_doublage_id: '5',
          enum_type_isolation_id: '2' // non isolé
        },
        donnee_intermediaire: {}
      };
      calc_mur(mur, zc, pc_id, ej);

      // Non isolé → doublage pris en compte : umur0 < umur0_nu_brut (le doublage réduit bien la valeur)
      expect(mur.donnee_intermediaire.umur0).toBeLessThan(2.5);
    });
  });
});
