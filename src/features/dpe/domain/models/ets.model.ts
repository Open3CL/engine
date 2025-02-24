import { BaieEts } from './baie-ets.model';
import { DE } from './dpe.model';

export interface Ets {
  donnee_entree?: EtsDE;
  donnee_intermediaire?: EtsDI;
  baie_ets_collection?: { baie_ets: BaieEts[] };
}

export interface EtsDE extends DE {
  tv_coef_reduction_deperdition_id?: number; // TV
  enum_cfg_isolation_lnc_id?: number; // ENUM cfg_isolation_lnc
  tv_coef_transparence_ets_id: number; // TV
}

export interface EtsDI {
  coef_transparence_ets: number;
  bver: number;
}
