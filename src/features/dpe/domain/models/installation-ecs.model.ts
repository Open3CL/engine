import { DE } from './dpe.model';

export interface InstallationEcs {
  donnee_entree?: InstallationEcsDE;
  donnee_intermediaire?: InstallationEcsDI;
  generateur_ecs_collection?: { generateur_ecs: GenerateurEcs[] };
}

export interface InstallationEcsDE extends DE {
  enum_cfg_installation_ecs_id: number;
  enum_type_installation_id: number;
  enum_methode_calcul_conso_id: number;
  ratio_virtualisation?: number;
  cle_repartition_ecs?: number;
  surface_habitable: number;
  nombre_logement: number;
  rdim: number;
  nombre_niveau_installation_ecs: number;
  fecs_saisi?: number;
  tv_facteur_couverture_solaire_id?: number;
  enum_methode_saisie_fact_couv_sol_id?: number;
  enum_type_installation_solaire_id?: number;
  tv_rendement_distribution_ecs_id: number;
  enum_bouclage_reseau_ecs_id: number;
  reseau_distribution_isole: boolean;
}

export interface InstallationEcsDI {
  rendement_distribution: number;
  besoin_ecs: number;
  besoin_ecs_depensier: number;
  fecs?: number;
  production_ecs_solaire?: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
}

export interface GenerateurEcs {
  donnee_entree?: GenerateurEcsDE;
  donnee_intermediaire?: GenerateurEcsDI;
}

export interface GenerateurEcsDE extends DE {
  reference_generateur_mixte?: string;
  enum_type_generateur_ecs_id: number;
  ref_produit_generateur_ecs?: string;
  enum_usage_generateur_id: number;
  enum_type_energie_id: number;
  tv_generateur_combustion_id?: number;
  enum_methode_saisie_carac_sys_id: number;
  tv_pertes_stockage_id?: number;
  tv_scop_id?: number;
  enum_periode_installation_ecs_thermo_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  tv_reseau_chaleur_id?: number;
  enum_type_stockage_ecs_id: number;
  position_volume_chauffe: boolean;
  position_volume_chauffe_stockage?: boolean;
  volume_stockage: number;
  presence_ventouse?: boolean;
}

export interface GenerateurEcsDI {
  pn?: number;
  qp0?: number;
  pveilleuse?: number;
  rpn?: number;
  cop?: number;
  ratio_besoin_ecs: number;
  rendement_generation?: number;
  rendement_generation_stockage?: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
  rendement_stockage?: number;
}
