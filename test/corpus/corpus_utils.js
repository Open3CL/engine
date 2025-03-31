export const DIFF_VALUE_THRESHOLD = 5;

export const GLOBAL_REPORT = {
  nbDpe: 0,
  threshold: DIFF_VALUE_THRESHOLD,
  dpeRunFailed: [],
  total: 0,
  nbInvalidDpeVersion: 0,
  nbExcludedDpe: 0,
  nbAllChecksBelowThreshold: 0,
  checks: {},
  compatibilityMode: false
};

export const OUTPUT_CSV_HEADERS = [
  'code',
  'enum_methode_application_dpe_log_id',
  'version_dpe',
  'version_logiciel',
  'version_moteur_calcul',
  'type_generateur_ecs_1_id',
  'type_generateur_ecs_1_label',
  'type_generateur_ecs_2_id',
  'type_generateur_ecs_2_label',
  'type_generateur_ch_1_id',
  'type_generateur_ch_1_label',
  'type_generateur_ch_2_id',
  'type_generateur_ch_2_label',
  'deperdition_mur_input',
  'deperdition_mur_output',
  'deperdition_mur_diff',
  'deperdition_baie_vitree_input',
  'deperdition_baie_vitree_output',
  'deperdition_baie_vitree_diff',
  'deperdition_plancher_bas_input',
  'deperdition_plancher_bas_output',
  'deperdition_plancher_bas_diff',
  'deperdition_plancher_haut_input',
  'deperdition_plancher_haut_output',
  'deperdition_plancher_haut_diff',
  'deperdition_porte_input',
  'deperdition_porte_output',
  'deperdition_porte_diff',
  'deperdition_renouvellement_air_input',
  'deperdition_renouvellement_air_output',
  'deperdition_renouvellement_air_diff',
  'hperm_input',
  'hperm_output',
  'hperm_diff',
  'deperdition_pont_thermique_input',
  'deperdition_pont_thermique_output',
  'deperdition_pont_thermique_diff',
  'surface_sud_equivalente_input',
  'surface_sud_equivalente_output',
  'surface_sud_equivalente_diff',
  'besoin_ecs_input',
  'besoin_ecs_output',
  'besoin_ecs_diff',
  'besoin_ch_input',
  'besoin_ch_output',
  'besoin_ch_diff',
  'conso_ecs_input',
  'conso_ecs_output',
  'conso_ecs_diff',
  'conso_ch_input',
  'conso_ch_output',
  'conso_ch_diff',
  'conso_auxiliaire_distribution_ch_input',
  'conso_auxiliaire_distribution_ch_output',
  'conso_auxiliaire_distribution_ch_diff',
  'conso_auxiliaire_distribution_ecs_input',
  'conso_auxiliaire_distribution_ecs_output',
  'conso_auxiliaire_distribution_ecs_diff',
  'conso_auxiliaire_generation_ch_input',
  'conso_auxiliaire_generation_ch_output',
  'conso_auxiliaire_generation_ch_diff',
  'conso_auxiliaire_generation_ecs_input',
  'conso_auxiliaire_generation_ecs_output',
  'conso_auxiliaire_generation_ecs_diff',
  'conso_auxiliaire_ventilation_input',
  'conso_auxiliaire_ventilation_output',
  'conso_auxiliaire_ventilation_diff',
  'ep_conso_5_usages_input',
  'ep_conso_5_usages_output',
  'ep_conso_5_usages_diff',
  'ep_conso_5_usages_m2_input',
  'ep_conso_5_usages_m2_output',
  'ep_conso_5_usages_m2_diff',
  'emission_ges_5_usages_input',
  'emission_ges_5_usages_output',
  'emission_ges_5_usages_diff',
  'emission_ges_5_usages_m2_input',
  'emission_ges_5_usages_m2_output',
  'emission_ges_5_usages_m2_diff',
  'runFailed'
];

export const DPE_PROPERTIES_TO_CHECK = [
  'logement.sortie.deperdition.deperdition_mur',
  'logement.sortie.deperdition.deperdition_baie_vitree',
  'logement.sortie.deperdition.deperdition_plancher_bas',
  'logement.sortie.deperdition.deperdition_plancher_haut',
  'logement.sortie.deperdition.deperdition_porte',
  'logement.sortie.deperdition.deperdition_renouvellement_air',
  'logement.sortie.deperdition.hperm',
  'logement.sortie.deperdition.deperdition_pont_thermique',
  'logement.sortie.apport_et_besoin.surface_sud_equivalente',
  'logement.sortie.apport_et_besoin.besoin_ecs',
  'logement.sortie.apport_et_besoin.besoin_ch',
  'logement.sortie.ef_conso.conso_ecs',
  'logement.sortie.ef_conso.conso_ch',
  'logement.sortie.ef_conso.conso_auxiliaire_distribution_ch',
  'logement.sortie.ef_conso.conso_auxiliaire_distribution_ecs',
  'logement.sortie.ef_conso.conso_auxiliaire_generation_ch',
  'logement.sortie.ef_conso.conso_auxiliaire_generation_ecs',
  'logement.sortie.ef_conso.conso_auxiliaire_ventilation',
  'logement.sortie.ep_conso.ep_conso_5_usages',
  'logement.sortie.ep_conso.ep_conso_5_usages_m2',
  'logement.sortie.emission_ges.emission_ges_5_usages',
  'logement.sortie.emission_ges.emission_ges_5_usages_m2'
];

export const DPE_PROPERTIES_TO_VALIDATE = [
  'logement.sortie.ef_conso.conso_ecs',
  'logement.sortie.ef_conso.conso_ch',
  'logement.sortie.ep_conso.ep_conso_5_usages#logement.sortie.ep_conso.ep_conso_5_usages_m2',
  'logement.sortie.emission_ges.emission_ges_5_usages#logement.sortie.emission_ges.emission_ges_5_usages_m2'
];

// Disable traditional console logs
const copyLog = console.log;
const copyWarn = console.warn;
const copyDebug = console.debug;
const copyError = console.error;

export const setLoggerOff = (ignoreErrors = false) => {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  if (ignoreErrors) {
    console.error = () => {};
  }
};

export const setLoggerOn = (errorsIgnored = false) => {
  console.log = copyLog;
  console.warn = copyWarn;
  console.debug = copyDebug;
  if (errorsIgnored) {
    console.error = copyError;
  }
};
