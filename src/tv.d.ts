/**
 * Fichier généré par scripts/generate_tables_types.js depuis src/tv.js — ne pas modifier.
 */

/** Ligne de la table de valeurs `coef_reduction_deperdition`. */
export interface TvCoefReductionDeperditionRow {
  tv_coef_reduction_deperdition_id: string;
  enum_type_adjacence_id: string;
  type_adjacence: string;
  b: string;
  enum_cfg_isolation_lnc_id?: string;
  cfg_isolation_lnc?: string;
  uvue?: string;
  aiu_aue_max?: string;
  aiu_aue_min?: string;
  zone_climatique?: string;
}

/** Ligne de la table de valeurs `uvue`. */
export interface TvUvueRow {
  tv_uvue_id: string;
  enum_type_adjacence_id: string;
  type_adjacence: string;
  uvue: string;
}

/** Ligne de la table de valeurs `umur0`. */
export interface TvUmur0Row {
  tv_umur0_id: string;
  enum_materiaux_structure_mur_id: string;
  materiaux_structure_mur: string;
  umur0: string;
  epaisseur_structure?: string;
}

/** Ligne de la table de valeurs `umur`. */
export interface TvUmurRow {
  tv_umur_id: string;
  enum_periode_construction_id: string;
  periode_construction: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  effet_joule: string;
  umur: string;
}

/** Ligne de la table de valeurs `upb0`. */
export interface TvUpb0Row {
  tv_upb0_id: string;
  enum_type_plancher_bas_id: string;
  type_plancher_bas: string;
  upb0: string;
}

/** Ligne de la table de valeurs `upb`. */
export interface TvUpbRow {
  tv_upb_id: string;
  enum_periode_construction_id: string;
  periode_construction: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  effet_joule: string;
  upb: string;
}

/** Ligne de la table de valeurs `ue`. */
export interface TvUeRow {
  tv_ue_id?: string;
  '2s_p': string;
  upb: string;
  type_adjacence_plancher: string;
  enum_type_adjacence_id: string;
  type_adjacence: string;
  enum_periode_construction_id: string;
  periode_construction: string;
  ue: string;
}

/** Ligne de la table de valeurs `uph0`. */
export interface TvUph0Row {
  tv_uph0_id: string;
  enum_type_plancher_haut_id: string;
  type_plancher_haut: string;
  uph0: string;
}

/** Ligne de la table de valeurs `uph`. */
export interface TvUphRow {
  tv_uph_id: string;
  enum_periode_construction_id: string;
  periode_construction: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  effet_joule: string;
  type_toiture: string;
  uph: string;
}

/** Ligne de la table de valeurs `ug`. */
export interface TvUgRow {
  tv_ug_id: string;
  enum_type_vitrage_id: string;
  type_vitrage: string;
  ug: string;
  enum_type_gaz_lame_id?: string;
  type_gaz_lame?: string;
  enum_inclinaison_vitrage_id?: string;
  inclinaison_vitrage?: string;
  vitrage_vir?: string;
  epaisseur_lame?: string;
}

/** Ligne de la table de valeurs `uw`. */
export interface TvUwRow {
  tv_uw_id: string;
  enum_type_baie_id: string;
  type_baie: string;
  enum_type_materiaux_menuiserie_id: string;
  type_materiaux_menuiserie: string;
  uw: string;
  ug?: string;
}

/** Ligne de la table de valeurs `deltar`. */
export interface TvDeltarRow {
  tv_deltar_id: string;
  enum_type_fermeture_id: string;
  type_fermeture: string;
  deltar: string;
}

/** Ligne de la table de valeurs `ujn`. */
export interface TvUjnRow {
  tv_ujn_id: string;
  deltar: string;
  uw: string;
  ujn: string;
}

/** Ligne de la table de valeurs `sw`. */
export interface TvSwRow {
  tv_sw_id: string;
  enum_type_baie_id: string;
  type_baie: string;
  enum_type_materiaux_menuiserie_id: string;
  type_materiaux_menuiserie: string;
  sw: string;
  enum_type_pose_id?: string;
  type_pose?: string;
  vitrage_vir?: string;
  enum_type_vitrage_id?: string;
  type_vitrage?: string;
}

/** Ligne de la table de valeurs `coef_masque_proche`. */
export interface TvCoefMasqueProcheRow {
  tv_coef_masque_proche_id: string;
  type_masque_proche: string;
  avancee?: string;
  enum_orientation_id?: string;
  orientation?: string;
  fe1: string;
}

/** Ligne de la table de valeurs `coef_masque_lointain_homogene`. */
export interface TvCoefMasqueLointainHomogeneRow {
  tv_coef_masque_lointain_homogene_id: string;
  enum_orientation_id: string;
  orientation: string;
  hauteur_alpha: string;
  fe2: string;
}

/** Ligne de la table de valeurs `coef_masque_lointain_non_homoge`. */
export interface TvCoefMasqueLointainNonHomogeRow {
  tv_coef_masque_lointain_non_homogene_id: string;
  secteur: string;
  enum_orientation_id: string;
  orientation: string;
  omb: string;
}

/** Ligne de la table de valeurs `coef_transparence_ets`. */
export interface TvCoefTransparenceEtsRow {
  tv_coef_transparence_ets_id: string;
  enum_type_materiaux_menuiserie_id: string;
  type_materiaux_menuiserie: string;
  coef_transparence_ets: string;
  enum_type_vitrage_id?: string;
  type_vitrage?: string;
  vitrage_vir?: string;
}

/** Ligne de la table de valeurs `pont_thermique`. */
export interface TvPontThermiqueRow {
  tv_pont_thermique_id: string;
  enum_type_liaison_id: string;
  type_liaison: string;
  isolation_mur: string;
  isolation_plancher?: string;
  k: string;
  enum_type_pose_id?: string;
  type_pose?: string;
  largeur_dormant?: string;
  presence_retour_isolation?: string;
}

/** Ligne de la table de valeurs `q4pa_conv`. */
export interface TvQ4paConvRow {
  tv_q4pa_conv_id: string;
  enum_periode_construction_id: string;
  periode_construction: string;
  enum_methode_application_dpe_log_id: string;
  type_habitation: string;
  q4pa_conv: string;
  isolation_surfaces: string;
  presence_joints_menuiserie?: string;
}

/** Ligne de la table de valeurs `uporte`. */
export interface TvUporteRow {
  tv_uporte_id: string;
  enum_type_porte_id: string;
  type_porte: string;
  uporte: string;
}

/** Ligne de la table de valeurs `seer`. */
export interface TvSeerRow {
  tv_seer_id: string;
  enum_periode_installation_fr_id: string;
  periode_installation_fr: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  seer_ou_eer: string;
  seer: string;
  eer: string;
}

/** Ligne de la table de valeurs `debits_ventilation`. */
export interface TvDebitsVentilationRow {
  tv_debits_ventilation_id: string;
  enum_type_ventilation_id: string;
  type_ventilation: string;
  qvarep_conv: string;
  qvasouf_conv: string;
  smea_conv: string;
}

/** Ligne de la table de valeurs `coef_orientation_pv`. */
export interface TvCoefOrientationPvRow {
  tv_coef_orientation_pv_id: string;
  enum_inclinaison_pv_id: string;
  inclinaison_pv: string;
  enum_orientation_pv_id: string;
  orientation_pv: string;
  coef_orientation_pv: string;
}

/** Ligne de la table de valeurs `facteur_couverture_solaire`. */
export interface TvFacteurCouvertureSolaireRow {
  tv_facteur_couverture_solaire_id: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  enum_type_installation_solaire_id: string;
  type_installation_solaire: string;
  type_batiment: string;
  usage: string;
  facteur_couverture_solaire: string;
}

/** Ligne de la table de valeurs `rendement_distribution_ecs`. */
export interface TvRendementDistributionEcsRow {
  tv_rendement_distribution_ecs_id: string;
  enum_type_installation_id: string;
  type_installation: string;
  configuration_logement?: string;
  rd: string;
  type_reseau_collectif?: string;
}

/** Ligne de la table de valeurs `generateur_combustion`. */
export interface TvGenerateurCombustionRow {
  tv_generateur_combustion_id: string;
  enum_type_generateur_ch_id?: string;
  enum_type_generateur_ecs_id?: string;
  type_generateur: string;
  pn?: string;
  rpn: string;
  rpint?: string;
  qp0_perc?: string;
  pveil?: string;
  critere_pn?: string;
}

/** Ligne de la table de valeurs `pertes_stockage`. */
export interface TvPertesStockageRow {
  tv_pertes_stockage_id: string;
  enum_type_generateur_ecs_id: string;
  type_generateur_ecs: string;
  volume_ballon: string;
  cr: string;
}

/** Ligne de la table de valeurs `scop`. */
export interface TvScopRow {
  tv_scop_id: string;
  enum_zone_climatique_id: string;
  zone_climatique: string;
  enum_type_generateur_ch_id?: string;
  type_generateur: string;
  scop_ou_cop: string;
  scop: string;
  type_emetteur?: string;
  enum_type_emission_distribution_id?: string;
  enum_type_generateur_ecs_id?: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2020`. */
export interface TvReseauChaleur2020Row {
  tv_reseau_chaleur_id: string;
  departement: string;
  hash_reseau: string;
  nom_reseau: string;
  localisation: string;
  chaud_ou_froid: string;
  contenu_co2: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2021`. */
export interface TvReseauChaleur2021Row {
  identifiant_reseau: string;
  departement: string;
  nom_reseau: string;
  localisation: string;
  contenu_co2: string;
  contenu_co2_acv: string;
  taux_enr: string;
  methode_calcul_taux: string;
  nouveau_reseau_2020_2021: string;
  correspondance_tv_reseau_chaleur_id_2020?: string;
  correspondance_hash_reseau_2020?: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2022`. */
export interface TvReseauChaleur2022Row {
  identifiant_reseau: string;
  departement: string;
  nom_reseau: string;
  localisation?: string;
  contenu_co2: string;
  contenu_co2_acv: string;
  taux_enr: string;
  methode_calcul_taux: string;
  nouveau_reseau_2021_2022: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2023`. */
export interface TvReseauChaleur2023Row {
  identifiant_reseau: string;
  departement: string;
  nom_reseau: string;
  localisation: string;
  contenu_co2: string;
  contenu_co2_acv: string;
  taux_enr: string;
  methode_calcul_taux: string;
  nouveau_reseau_2022_2023: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2024`. */
export interface TvReseauChaleur2024Row {
  identifiant_reseau: string;
  departement: string;
  nom_reseau: string;
  localisation?: string;
  contenu_co2: string;
  contenu_co2_acv: string;
  taux_enr: string;
  methode_calcul_taux: string;
  titre_v?: string;
  nouveau_reseau_2023_2024: string;
}

/** Ligne de la table de valeurs `reseau_chaleur_2025`. */
export interface TvReseauChaleur2025Row {
  identifiant_reseau: string;
  departement: string;
  nom_reseau: string;
  localisation: string;
  contenu_co2: string;
  contenu_co2_acv: string;
  taux_enr: string;
  methode_calcul_taux: string;
  titre_v: string;
  nouveau_reseau_2024_2025: string;
}

/** Ligne de la table de valeurs `rendement_generation`. */
export interface TvRendementGenerationRow {
  tv_rendement_generation_id: string;
  enum_type_generateur_ch_id: string;
  type_generateur_ch: string;
  rg: string;
}

/** Ligne de la table de valeurs `temp_fonc_100`. */
export interface TvTempFonc100Row {
  tv_temp_fonc_100_id: string;
  enum_temp_distribution_ch_id: string;
  temp_distribution_ch: string;
  periode_emetteurs: string;
  temp_fonc_100: string;
}

/** Ligne de la table de valeurs `temp_fonc_30`. */
export interface TvTempFonc30Row {
  tv_temp_fonc_30_id: string;
  enum_temp_distribution_ch_id: string;
  temp_distribution_ch: string;
  periode_emetteurs: string;
  enum_type_generateur_ch_id: string;
  type_chaudiere: string;
  temp_fonc_30: string;
}

/** Ligne de la table de valeurs `rendement_emission`. */
export interface TvRendementEmissionRow {
  tv_rendement_emission_id: string;
  enum_type_emission_distribution_id: string;
  type_emission: string;
  enum_type_generateur_ch_id: string;
  re: string;
}

/** Ligne de la table de valeurs `rendement_distribution_ch`. */
export interface TvRendementDistributionChRow {
  tv_rendement_distribution_ch_id: string;
  enum_type_emission_distribution_id: string;
  reseau_distribution: string;
  rd: string;
  reseau_distribution_isole?: string;
}

/** Ligne de la table de valeurs `rendement_regulation`. */
export interface TvRendementRegulationRow {
  tv_rendement_regulation_id: string;
  enum_type_emission_distribution_id: string;
  type_emission_regulation: string;
  type_regulation?: string;
  enum_type_generateur_ch_id: string;
  rr: string;
}

/** Ligne de la table de valeurs `intermittence`. */
export interface TvIntermittenceRow {
  tv_intermittence_id: string;
  enum_methode_application_dpe_log_id: string;
  configuration_chauffage: string;
  enum_type_installation_id: string;
  enum_type_chauffage_id: string;
  type_chauffage: string;
  enum_equipement_intermittence_id: string;
  equipement_intermittence: string;
  enum_type_regulation_id: string;
  type_regulation: string;
  enum_type_emission_distribution_id: string;
  type_emission_simple: string;
  enum_classe_inertie_id?: string;
  inertie?: string;
  i0: string;
  comptage_individuel?: string;
}

export type TvParZoneClimatique = {
  h1a: number;
  h1b: number;
  h1c: number;
  h2a: number;
  h2b: number;
  h2c: number;
  h2d: number;
  h3: number;
};

export type TvParMois = {
  Janvier: TvParZoneClimatique;
  Février: TvParZoneClimatique;
  Mars: TvParZoneClimatique;
  Avril: TvParZoneClimatique;
  Mai: TvParZoneClimatique;
  Juin: TvParZoneClimatique;
  Juillet: TvParZoneClimatique;
  Aout: TvParZoneClimatique;
  Septembre: TvParZoneClimatique;
  Octobre: TvParZoneClimatique;
  Novembre: TvParZoneClimatique;
  Décembre: TvParZoneClimatique;
};

export type TvParClasseAltitude = {
  'inférieur à 400m': TvParMois;
  '400-800m': TvParMois;
  'supérieur à 800m': TvParMois;
};

export type TvE = {
  '0': TvParClasseAltitude;
  '1': TvParClasseAltitude;
};

export type TvParClasseEtiquette = {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
};

export type TvDpeClassLimitInferieurA400m = {
  '3': TvParClasseEtiquette;
  '4': TvParClasseEtiquette;
  '5': TvParClasseEtiquette;
  '6': TvParClasseEtiquette;
  '7': TvParClasseEtiquette;
  '8': TvParClasseEtiquette;
  '9': TvParClasseEtiquette;
  '10': TvParClasseEtiquette;
  '11': TvParClasseEtiquette;
  '12': TvParClasseEtiquette;
  '13': TvParClasseEtiquette;
  '14': TvParClasseEtiquette;
  '15': TvParClasseEtiquette;
  '16': TvParClasseEtiquette;
  '17': TvParClasseEtiquette;
  '18': TvParClasseEtiquette;
  '19': TvParClasseEtiquette;
  '20': TvParClasseEtiquette;
  '21': TvParClasseEtiquette;
  '22': TvParClasseEtiquette;
  '23': TvParClasseEtiquette;
  '24': TvParClasseEtiquette;
  '25': TvParClasseEtiquette;
  '26': TvParClasseEtiquette;
  '27': TvParClasseEtiquette;
  '28': TvParClasseEtiquette;
  '29': TvParClasseEtiquette;
  '30': TvParClasseEtiquette;
  '31': TvParClasseEtiquette;
  '32': TvParClasseEtiquette;
  '33': TvParClasseEtiquette;
  '34': TvParClasseEtiquette;
  '35': TvParClasseEtiquette;
  '36': TvParClasseEtiquette;
  '37': TvParClasseEtiquette;
  '38': TvParClasseEtiquette;
  '39': TvParClasseEtiquette;
  '40': TvParClasseEtiquette;
};

export type TvParClasseEtiquette2 = {
  E: number;
  F: number;
};

export type TvDpeClassLimitSuperieurA800m = {
  '3': TvParClasseEtiquette2;
  '4': TvParClasseEtiquette2;
  '5': TvParClasseEtiquette2;
  '6': TvParClasseEtiquette2;
  '7': TvParClasseEtiquette2;
  '8': TvParClasseEtiquette2;
  '9': TvParClasseEtiquette2;
  '10': TvParClasseEtiquette2;
  '11': TvParClasseEtiquette2;
  '12': TvParClasseEtiquette2;
  '13': TvParClasseEtiquette2;
  '14': TvParClasseEtiquette2;
  '15': TvParClasseEtiquette2;
  '16': TvParClasseEtiquette2;
  '17': TvParClasseEtiquette2;
  '18': TvParClasseEtiquette2;
  '19': TvParClasseEtiquette2;
  '20': TvParClasseEtiquette2;
  '21': TvParClasseEtiquette2;
  '22': TvParClasseEtiquette2;
  '23': TvParClasseEtiquette2;
  '24': TvParClasseEtiquette2;
  '25': TvParClasseEtiquette2;
  '26': TvParClasseEtiquette2;
  '27': TvParClasseEtiquette2;
  '28': TvParClasseEtiquette2;
  '29': TvParClasseEtiquette2;
  '30': TvParClasseEtiquette2;
  '31': TvParClasseEtiquette2;
  '32': TvParClasseEtiquette2;
  '33': TvParClasseEtiquette2;
  '34': TvParClasseEtiquette2;
  '35': TvParClasseEtiquette2;
  '36': TvParClasseEtiquette2;
  '37': TvParClasseEtiquette2;
  '38': TvParClasseEtiquette2;
  '39': TvParClasseEtiquette2;
  '40': TvParClasseEtiquette2;
};

export type TvParClasseAltitude2 = {
  'inférieur à 400m': TvDpeClassLimitInferieurA400m;
  '400-800m': TvDpeClassLimitInferieurA400m;
  'supérieur à 800m': TvDpeClassLimitSuperieurA800m;
};

export type TvParOrientation = {
  'sud sup75°': number;
  'sud 25°-75°': number;
  'sud inf25°': number;
  'ouest sup75°': number;
  'ouest 25°-75°': number;
  'ouest inf25°': number;
  'nord sup75°': number;
  'nord 25°-75°': number;
  'nord inf25°': number;
  'est sup75°': number;
  'est 25°-75°': number;
  'est inf25°': number;
  horizontal: number;
};

export type TvParMois2 = {
  Janvier: TvParOrientation;
  Février: TvParOrientation;
  Mars: TvParOrientation;
  Avril: TvParOrientation;
  Mai: TvParOrientation;
  Juin: TvParOrientation;
  Juillet: TvParOrientation;
  Aout: TvParOrientation;
  Septembre: TvParOrientation;
  Octobre: TvParOrientation;
  Novembre: TvParOrientation;
  Décembre: TvParOrientation;
};

export type TvParZoneClimatique2 = {
  h1a: TvParMois2;
  h1b: TvParMois2;
  h1c: TvParMois2;
  h2a: TvParMois2;
  h2b: TvParMois2;
  h2c: TvParMois2;
  h2d: TvParMois2;
  h3: TvParMois2;
};

/** Ensemble des tables de valeurs de la méthode 3CL. */
export interface TableValeur {
  coef_reduction_deperdition: TvCoefReductionDeperditionRow[];
  uvue: TvUvueRow[];
  umur0: TvUmur0Row[];
  umur: TvUmurRow[];
  upb0: TvUpb0Row[];
  upb: TvUpbRow[];
  ue: TvUeRow[];
  uph0: TvUph0Row[];
  uph: TvUphRow[];
  ug: TvUgRow[];
  uw: TvUwRow[];
  deltar: TvDeltarRow[];
  ujn: TvUjnRow[];
  sw: TvSwRow[];
  coef_masque_proche: TvCoefMasqueProcheRow[];
  coef_masque_lointain_homogene: TvCoefMasqueLointainHomogeneRow[];
  coef_masque_lointain_non_homoge: TvCoefMasqueLointainNonHomogeRow[];
  coef_transparence_ets: TvCoefTransparenceEtsRow[];
  pont_thermique: TvPontThermiqueRow[];
  q4pa_conv: TvQ4paConvRow[];
  uporte: TvUporteRow[];
  seer: TvSeerRow[];
  debits_ventilation: TvDebitsVentilationRow[];
  coef_orientation_pv: TvCoefOrientationPvRow[];
  facteur_couverture_solaire: TvFacteurCouvertureSolaireRow[];
  rendement_distribution_ecs: TvRendementDistributionEcsRow[];
  generateur_combustion: TvGenerateurCombustionRow[];
  pertes_stockage: TvPertesStockageRow[];
  scop: TvScopRow[];
  reseau_chaleur_2020: TvReseauChaleur2020Row[];
  reseau_chaleur_2021: TvReseauChaleur2021Row[];
  reseau_chaleur_2022: TvReseauChaleur2022Row[];
  reseau_chaleur_2023: TvReseauChaleur2023Row[];
  reseau_chaleur_2024: TvReseauChaleur2024Row[];
  reseau_chaleur_2025: TvReseauChaleur2025Row[];
  rendement_generation: TvRendementGenerationRow[];
  temp_fonc_100: TvTempFonc100Row[];
  temp_fonc_30: TvTempFonc30Row[];
  rendement_emission: TvRendementEmissionRow[];
  rendement_distribution_ch: TvRendementDistributionChRow[];
  rendement_regulation: TvRendementRegulationRow[];
  intermittence: TvIntermittenceRow[];
  e: TvE;
  e_pv: TvParMois;
  e_fr_26: TvParClasseAltitude;
  e_fr_28: TvParClasseAltitude;
  dh14: TvE;
  dh19_legacy: TvE;
  dh19: TvE;
  dh21: TvE;
  dh26: TvParClasseAltitude;
  dh28: TvParClasseAltitude;
  nref19: TvE;
  nref21: TvE;
  nref26: TvParClasseAltitude;
  nref28: TvParClasseAltitude;
  tefs: TvParClasseAltitude;
  text: TvE;
  textmoy_clim_26: TvParClasseAltitude;
  textmoy_clim_28: TvParClasseAltitude;
  dpe_class_limit: TvParClasseAltitude2;
  ges_class_limit: TvParClasseAltitude2;
  c1: TvParZoneClimatique2;
}

/** Nom d'une table de valeurs. */
export type TvTableName = keyof TableValeur;

/** Nom d'une table de valeurs organisée en lignes (utilisable avec `tv()`). */
export type TvRowTableName =
  | 'coef_reduction_deperdition'
  | 'uvue'
  | 'umur0'
  | 'umur'
  | 'upb0'
  | 'upb'
  | 'ue'
  | 'uph0'
  | 'uph'
  | 'ug'
  | 'uw'
  | 'deltar'
  | 'ujn'
  | 'sw'
  | 'coef_masque_proche'
  | 'coef_masque_lointain_homogene'
  | 'coef_masque_lointain_non_homoge'
  | 'coef_transparence_ets'
  | 'pont_thermique'
  | 'q4pa_conv'
  | 'uporte'
  | 'seer'
  | 'debits_ventilation'
  | 'coef_orientation_pv'
  | 'facteur_couverture_solaire'
  | 'rendement_distribution_ecs'
  | 'generateur_combustion'
  | 'pertes_stockage'
  | 'scop'
  | 'reseau_chaleur_2020'
  | 'reseau_chaleur_2021'
  | 'reseau_chaleur_2022'
  | 'reseau_chaleur_2023'
  | 'reseau_chaleur_2024'
  | 'reseau_chaleur_2025'
  | 'rendement_generation'
  | 'temp_fonc_100'
  | 'temp_fonc_30'
  | 'rendement_emission'
  | 'rendement_distribution_ch'
  | 'rendement_regulation'
  | 'intermittence';

/** Ligne d'une table de valeurs organisée en lignes. */
export type TvRow<K extends TvRowTableName> = TableValeur[K][number];

export declare const tvs: TableValeur;
export default tvs;
