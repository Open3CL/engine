import { DE } from './dpe.model';

export interface Ventilation {
  donnee_entree?: VentilationDE;
  donnee_intermediaire?: VentilationDI;
}

export interface VentilationDE extends DE {
  enum_type_ventilation_id: number;
  surface_ventile: number;
  plusieurs_facade_exposee: boolean;
  tv_q4pa_conv_id?: number;
  q4pa_conv_saisi?: number;
  enum_methode_saisie_q4pa_conv_id: number;
  tv_debits_ventilation_id: number;
  ventilation_post_2012: boolean;
  ref_produit_ventilation?: number;
  cle_repartition_ventilation?: number;
}

export interface VentilationDI {
  pvent_moy?: number;
  q4pa_conv: number;
  conso_auxiliaire_ventilation: number;
  hperm: number;
  hvent: number;
}

enum TypeVentilation {
  SIMPLE_FLUX_AUTO = 'SIMPLE_FLUX_AUTO',
  SIMPLE_FLUX_HYGRO = 'SIMPLE_FLUX_HYGRO',
  DOUBLE_FLUX = 'DOUBLE_FLUX'
}
