import { DE } from './dpe.model';

export interface PontThermique {
  donnee_entree?: PontThermiqueDE;
  donnee_intermediaire?: PontThermiqueDI;
}

export interface PontThermiqueDE extends DE {
  reference_1?: string;
  reference_2?: string;
  tv_pont_thermique_id?: number; // TV
  pourcentage_valeur_pont_thermique: number;
  l: number;
  enum_methode_saisie_pont_thermique_id: number; // ENUM methode_saisie_pont_thermique
  enum_type_liaison_id: number; // ENUM type_liaison
  k_saisi?: number;
}

export interface PontThermiqueDI {
  k: number;
}
