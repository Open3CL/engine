import { DE } from './dpe.model';

export interface ProductionElecEnr {
  donnee_entree?: ProductionElecEnrDE;
  donnee_intermediaire?: ProductionElecEnrDI;
  panneaux_pv_collection?: PanneauFv[];
}

export interface ProductionElecEnrDE extends DE {
  presence_production_pv: boolean;
  enum_type_enr_id: number;
}

export interface ProductionElecEnrDI {
  taux_autoproduction?: number;
  production_pv: number;
  conso_elec_ac: number;
}

export interface PanneauFv {
  surface_totale_capteurs?: number;
  ratio_virtualisation?: number;
  nombre_module?: number;
  tv_coef_orientation_pv_id?: number;
  enum_orientation_pv_id?: number;
  enum_inclinaison_pv_id?: number;
}
