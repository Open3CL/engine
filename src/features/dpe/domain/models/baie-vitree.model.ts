import { DE } from './dpe.model';

export interface BaieVitree {
  donnee_entree?: BaieVitreeDE;
  donnee_intermediaire?: BaieVitreeDI;
  baie_vitree_double_fenetre?: BaieVitreeDoubleFenetre;
}

export interface BaieVitreeDE extends DE {
  reference_paroi?: string;
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: string; // TV
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: string; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: string; // ENUM type_adjacence
  surface_totale_baie?: number;
  nb_baie?: number;
  tv_ug_id?: string; // TV
  enum_type_vitrage_id?: string; // ENUM type_vitrage
  enum_inclinaison_vitrage_id?: string; // ENUM inclinaison_vitrage
  enum_type_gaz_lame_id?: string; // ENUM type_gaz_lame
  epaisseur_lame?: number;
  vitrage_vir?: boolean;
  enum_methode_saisie_perf_vitrage_id?: string; // ENUM methode_saisie_perf_vitrage
  ug_saisi?: number;
  tv_uw_id?: string;
  enum_type_materiaux_menuiserie_id?: string; // ENUM type_materiaux_menuiserie
  enum_type_baie_id?: string; // ENUM type_baie
  uw_saisi?: number;
  double_fenetre?: boolean;
  uw_1?: number;
  sw_1?: number;
  uw_2?: number;
  sw_2?: number;
  tv_deltar_id?: string;
  tv_ujn_id?: string;
  enum_type_fermeture_id?: string;
  presence_protection_solaire_hors_fermeture?: boolean;
  ujn_saisi?: number;
  presence_retour_isolation?: boolean;
  presence_joint?: boolean;
  largeur_dormant?: number;
  tv_sw_id?: string;
  sw_saisi?: number;
  enum_type_pose_id?: string; // ENUM type_pose
  enum_orientation_id?: string;
  tv_coef_masque_proche_id?: string;
  tv_coef_masque_lointain_homogene_id?: string;
  masque_lointain_non_homogene_collection: {
    masque_lointain_non_homogene: {
      tv_coef_masque_lointain_non_homogene_id?: string; // TV
    };
  }[];
}

export interface BaieVitreeDI {
  b: number;
  ug?: number;
  uw: number;
  ujn?: number;
  u_menuiserie: number;
  sw: number;
  fe1: number;
  fe2: number;
}

export interface BaieVitreeDoubleFenetre {
  donnee_entree?: BaieVitreeDoubleFenetreDE;
  donnee_intermediaire?: BaieVitreeDoubleFenetreDI;
}

export interface BaieVitreeDoubleFenetreDE {
  tv_ug_id?: string;
  enum_type_vitrage_id: string;
  enum_inclinaison_vitrage_id: string;
  enum_type_gaz_lame_id?: string;
  epaisseur_lame?: number;
  vitrage_vir?: boolean;
  enum_methode_saisie_perf_vitrage_id: string;
  ug_saisi?: number;
  tv_uw_id?: string;
  enum_type_materiaux_menuiserie_id: string;
  enum_type_baie_id: string;
  uw_saisi?: number;
  tv_sw_id?: string;
  sw_saisi?: number;
  enum_type_pose_id: string;
}

export interface BaieVitreeDoubleFenetreDI {
  ug?: number;
  uw: number;
  sw: number;
}
