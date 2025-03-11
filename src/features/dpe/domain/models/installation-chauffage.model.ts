import { DE } from './dpe.model';

export interface InstallationChauffage {
  donnee_entree?: InstallationChauffageDE;
  donnee_intermediaire?: InstallationChauffageDI;
  emetteur_chauffage_collection?: { emetteur_chauffage: EmetteurChauffage[] };
  generateur_chauffage_collection?: { generateur_chauffage: GenerateurChauffage[] };
}

export interface InstallationChauffageDE extends DE {
  surface_chauffee: number;
  nombre_logement_echantillon?: number;
  rdim: number;
  nombre_niveau_installation_ch: number;
  enum_cfg_installation_ch_id: number;
  ratio_virtualisation?: number;
  coef_ifc?: number;
  cle_repartition_ch?: number;
  enum_type_installation_id: number;
  enum_methode_calcul_conso_id: number;
  enum_methode_saisie_fact_couv_sol_id?: number;
  tv_facteur_couverture_solaire_id?: number;
  fch_saisi?: number;
}

export interface InstallationChauffageDI {
  besoin_ch: number;
  besoin_ch_depensier: number;
  production_ch_solaire?: number;
  fch?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}

export interface EmetteurChauffage {
  donnee_entree?: EmetteurChauffageDE;
  donnee_intermediaire?: EmetteurChauffageDI;
}

export interface EmetteurChauffageDE extends DE {
  surface_chauffee: number;
  tv_rendement_emission_id: number;
  tv_rendement_distribution_ch_id: number;
  tv_rendement_regulation_id: number;
  enum_type_emission_distribution_id: number;
  tv_intermittence_id: number;
  reseau_distribution_isole?: boolean;
  enum_equipement_intermittence_id: number;
  enum_type_regulation_id: number;
  enum_periode_installation_emetteur_id?: number;
  enum_type_chauffage_id: number;
  enum_temp_distribution_ch_id: number;
  enum_lien_generateur_emetteur_id: number;
}

export interface EmetteurChauffageDI {
  i0: number;
  rendement_emission: number;
  rendement_distribution: number;
  rendement_regulation: number;
}

export interface GenerateurChauffage {
  donnee_entree?: GenerateurChauffageDE;
  donnee_intermediaire?: GenerateurChauffageDI;
}

export interface GenerateurChauffageDE extends DE {
  reference_generateur_mixte?: number;
  ref_produit_generateur_ch?: number;
  enum_type_generateur_ch_id: number;
  enum_usage_generateur_id: number;
  enum_type_energie_id: number;
  position_volume_chauffe: number;
  tv_rendement_generation_id?: number;
  tv_scop_id?: number;
  tv_temp_fonc_100_id?: number;
  tv_temp_fonc_30_id?: number;
  tv_generateur_combustion_id?: number;
  tv_reseau_chaleur_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  priorite_generateur_cascade?: number;
  presence_ventouse?: number;
  presence_regulation_combustion?: boolean;
  enum_methode_saisie_carac_sys_id: number;
  enum_lien_generateur_emetteur_id: number;
}

export interface GenerateurChauffageDI {
  scop?: number;
  pn?: number;
  qp0?: number;
  pveilleuse?: number;
  temp_fonc_30?: number;
  temp_fonc_100?: number;
  rpn?: number;
  rpint?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}
