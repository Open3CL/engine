import { DE } from './dpe.model';

export interface PlancherHaut {
  donnee_entree?: PlancherHautDE;
  donnee_intermediaire?: PlancherHautDI;
}

export interface PlancherHautDE extends DE {
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: string; // TV
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: string; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: string; // ENUM type_adjacence
  surface_paroi_opaque?: number;
  uph0_saisi?: number;
  tv_uph0_id?: string; // TV
  enum_type_plancher_haut_id?: string; // ENUM type_plancher_bas
  enum_methode_saisie_u0_id?: string; // ENUM methode_saisie_u0
  uph_saisi?: number;
  enum_type_isolation_id?: string; // ENUM type_isolation
  enum_periode_isolation_id?: string; // ENUM periode_isolation
  resistance_isolation?: number;
  epaisseur_isolation?: number;
  tv_uph_id?: string; // TV
  enum_methode_saisie_u_id?: string; // ENUM methode_saisie_u
}

export interface PlancherHautDI {
  uph: number;
  uph0: number;
  b: number;
}
