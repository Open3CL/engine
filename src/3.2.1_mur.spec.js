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
});

/**
 * @see https://github.com/Open3CL/engine/issues/146
 * Lorsqu'un doublage est présent ET une isolation ITE ou ITI également,
 * le doublage NE doit PAS être cumulé dans le calcul de Umur0.
 * Il l'est en revanche pour une isolation ITR (intrinsèque au matériau).
 */
describe('[Issue #146] Doublage NE doit PAS être cumulé à une isolation ITE ou ITI', () => {
  /**
   * Cas de base : mur en blocs de béton creux 25cm (id 12), sans isolation.
   * umur0 brut = 2.3 => après min(2.5) = 2.3
   * Avec doublage type 4 (>15mm) sans isolation : umur0 = 1/(1/2.3 + 0.21) ≈ 1.5509
   */
  test('Doublage appliqué si isolation non présente (non isolé, type 2)', () => {
    const mur = {
      donnee_entree: {
        description: 'Mur blocs béton creux 25cm non isolé avec doublage >15mm',
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u0_id: '2',
        epaisseur_structure: 25,
        enum_type_doublage_id: '4', // doublage >15mm
        enum_type_isolation_id: '2', // non isolé
        enum_methode_saisie_u_id: '1', // non isolé
        enum_type_adjacence_id: '1',
        surface_paroi_totale: 10
      },
      donnee_intermediaire: {}
    };
    calc_mur(mur, 3, 1, 0);
    // doublage doit être appliqué : umur0 ≈ 1.5509
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(1.5509103169251517, 4);
  });

  test('Doublage NON appliqué si isolation ITI présente (type 3)', () => {
    const mur = {
      donnee_entree: {
        description: 'Mur blocs béton creux 25cm avec ITI et doublage >15mm',
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u0_id: '2',
        epaisseur_structure: 25,
        enum_type_doublage_id: '4', // doublage >15mm
        enum_type_isolation_id: '3', // ITI
        epaisseur_isolation: 4, // 4cm
        enum_methode_saisie_u_id: '3', // épaisseur isolation saisie
        enum_type_adjacence_id: '1',
        surface_paroi_totale: 10
      },
      donnee_intermediaire: {}
    };
    calc_mur(mur, 3, 1, 0);
    // doublage ignoré : umur0 = min(2.5, 2.3) = 2.3
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.3, 4);
    // umur = 1 / (1/2.3 + 0.04/0.04) = 1 / (1/2.3 + 1) ≈ 0.6970
    expect(mur.donnee_intermediaire.umur).toBeCloseTo(1 / (1 / 2.3 + 1), 4);
  });

  test('Doublage NON appliqué si isolation ITE présente (type 4)', () => {
    const mur = {
      donnee_entree: {
        description: 'Mur blocs béton creux 25cm avec ITE et doublage >15mm',
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u0_id: '2',
        epaisseur_structure: 25,
        enum_type_doublage_id: '4', // doublage >15mm
        enum_type_isolation_id: '4', // ITE
        epaisseur_isolation: 4, // 4cm
        enum_methode_saisie_u_id: '3', // épaisseur isolation saisie
        enum_type_adjacence_id: '1',
        surface_paroi_totale: 10
      },
      donnee_intermediaire: {}
    };
    calc_mur(mur, 3, 1, 0);
    // doublage ignoré : umur0 = min(2.5, 2.3) = 2.3
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.3, 4);
  });

  test('Doublage NON appliqué si isolation ITI+ITE présente (type 6)', () => {
    const mur = {
      donnee_entree: {
        description: 'Mur blocs béton creux 25cm avec ITI+ITE et doublage >15mm',
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u0_id: '2',
        epaisseur_structure: 25,
        enum_type_doublage_id: '5', // doublage connu (plâtre brique bois)
        enum_type_isolation_id: '6', // ITI+ITE
        epaisseur_isolation: 4,
        enum_methode_saisie_u_id: '3',
        enum_type_adjacence_id: '1',
        surface_paroi_totale: 10
      },
      donnee_intermediaire: {}
    };
    calc_mur(mur, 3, 1, 0);
    // doublage ignoré : umur0 = min(2.5, 2.3) = 2.3
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(2.3, 4);
  });

  test('Doublage APPLIQUÉ si isolation ITR présente (type 5) — isolation intrinsèque', () => {
    const mur = {
      donnee_entree: {
        description: 'Mur blocs béton creux 25cm avec ITR et doublage >15mm',
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u0_id: '2',
        epaisseur_structure: 25,
        enum_type_doublage_id: '4', // doublage >15mm
        enum_type_isolation_id: '5', // ITR
        epaisseur_isolation: 4,
        enum_methode_saisie_u_id: '3',
        enum_type_adjacence_id: '1',
        surface_paroi_totale: 10
      },
      donnee_intermediaire: {}
    };
    calc_mur(mur, 3, 1, 0);
    // doublage appliqué : umur0 ≈ 1.5509
    expect(mur.donnee_intermediaire.umur0).toBeCloseTo(1.5509103169251517, 4);
  });
});
