import { DE } from './dpe.model';

export interface PlancherBas {
  donnee_entree?: PlancherBasDE;
  donnee_intermediaire?: PlancherBasDI;
}

export interface PlancherHaut {
  donnee_entree?: PlancherHautDE;
  donnee_intermediaire?: PlancherHautDI;
}

export interface PlancherDE extends DE {
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: string; // TV
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: string; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: string; // ENUM type_adjacence
  surface_paroi_opaque?: number;
  enum_methode_saisie_u0_id?: string; // ENUM methode_saisie_u0

  enum_type_isolation_id?: string; // ENUM type_isolation
  enum_periode_isolation_id?: string; // ENUM periode_isolation
  resistance_isolation?: number;
  epaisseur_isolation?: number;
  enum_methode_saisie_u_id?: string; // ENUM methode_saisie_u
}

export interface PlancherDI {
  b: number;
}

export interface PlancherBasDE extends PlancherDE {
  upb0_saisi?: number;
  tv_upb0_id?: string; // TV
  enum_type_plancher_bas_id?: string; // ENUM type_plancher_bas
  upb_saisi?: number;
  tv_upb_id?: string; // TV
  calcul_ue: number;
  perimetre_ue?: number;
  surface_ue?: number;
  ue?: number;
}

export interface PlancherBasDI extends PlancherDI {
  upb: number;
  upb0: number;
  upb_final: number;
}

export interface PlancherHautDE extends PlancherDE {
  uph0_saisi?: number;
  tv_uph0_id?: string; // TV
  enum_type_plancher_haut_id?: string; // ENUM type_plancher_bas
  uph_saisi?: number;
  tv_uph_id?: string; // TV
}

export interface PlancherHautDI extends PlancherDI {
  uph: number;
  uph0: number;
}
