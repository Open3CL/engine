import { DE } from './dpe.model';

export interface Mur {
  donnee_entree?: MurDE;
  donnee_intermediaire?: MurDI;
}

export interface MurDE extends DE {
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: number; // TV
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: number; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: number; // ENUM type_adjacence
  enum_orientation_id?: number; // ENUM orientation
  surface_paroi_totale?: number;
  umur0_saisi?: number;
  tv_umur0_id?: number; // TV
  epaisseur_structure?: number;
  enum_materiaux_structure_mur_id?: number; // ENUM materiaux_structure_mur
  enum_methode_saisie_u0_id?: number; // ENUM methode_saisie_u0
  enduit_isolant_paroi_ancienne?: boolean;
  umur_saisi?: number;
  enum_type_doublage_id?: number; // ENUM type_doublage
  enum_type_isolation_id?: number; // ENUM type_isolation
  enum_periode_isolation_id?: number; // ENUM periode_isolation
  resistance_isolation?: number;
  epaisseur_isolation?: number;
  tv_umur_id?: number; // TV
  enum_methode_saisie_u_id?: number; // ENUM methode_saisie_u
}

export interface MurDI {
  umur: number;
  umur0: number;
  b: number;
}
