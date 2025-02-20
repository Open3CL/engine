import { DE } from './dpe.model';

export interface PlancherBas {
  donnee_entree?: PlancherBasDE;
  donnee_intermediaire?: PlancherBasDI;
}

export interface PlancherBasDE extends DE {
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: string; // TV
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: string; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: string; // ENUM type_adjacence
  surface_paroi_opaque?: number;
  upb0_saisi?: number;
  tv_upb0_id?: string; // TV
  enum_type_plancher_bas_id?: string; // ENUM type_plancher_bas
  enum_methode_saisie_u0_id?: string; // ENUM methode_saisie_u0
  upb_saisi?: number;
  enum_type_isolation_id?: string; // ENUM type_isolation
  enum_periode_isolation_id?: string; // ENUM periode_isolation
  resistance_isolation?: number;
  epaisseur_isolation?: number;
  tv_upb_id?: string; // TV
  enum_methode_saisie_u_id?: string; // ENUM methode_saisie_u
  calcul_ue: number;
  perimetre_ue?: number;
  surface_ue?: number;
  ue?: number;
}

export interface PlancherBasDI {
  upb: number;
  upb0: number;
  upb_final: number;
  b: number;
}
