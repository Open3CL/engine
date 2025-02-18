import { DE } from './dpe.model';

export interface Porte {
  donnee_entree?: PorteDE;
  donnee_intermediaire?: PorteDI;
}

export interface PorteDE extends DE {
  reference_paroi?: string;
  reference_lnc?: string;
  enum_cfg_isolation_lnc_id?: number; // ENUM cfg_isolation_lnc
  enum_type_adjacence_id?: number; // ENUM type_adjacence
  tv_coef_reduction_deperdition_id?: number; // TV
  surface_aiu?: number;
  surface_aue?: number;
  surface_porte?: number;
  tv_uporte_id?: number; // TV
  enum_methode_saisie_uporte_id?: number; // ENUM methode_saisie_uporte
  enum_type_porte_id?: number; // ENUM type_porte
  uporte_saisi?: number;
  nb_porte?: number;
  largeur_dormant?: number;
  presence_retour_isolation?: boolean;
  presence_joint?: boolean;
  enum_type_pose_id?: number; // ENUM type_pose
}

export interface PorteDI {
  uporte: number;
  b: number;
}
