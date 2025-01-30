export interface Sortie {
  deperdition: Deperdition;
  apport_et_besoin: ApportEtBesoin;
  ef_conso: EfConso;
  ep_conso: EpConso;
  emission_ges: EmissionGes;
  cout: Cout;
  production_electricite: ProductionElectricite;
  sortie_par_energie_collection: { sortie_par_energie: SortieParEnergie[] };
  confort_ete?: ConfortEte;
  qualite_isolation: QualiteIsolation;
}

export interface Deperdition {
  hvent: number;
  hperm: number;
  deperdition_renouvellement_air: number;
  deperdition_mur: number;
  deperdition_plancher_bas: number;
  deperdition_plancher_haut: number;
  deperdition_baie_vitree: number;
  deperdition_porte: number;
  deperdition_pont_thermique: number;
  deperdition_enveloppe: number;
}

export interface ApportEtBesoin {
  surface_sud_equivalente: number;
  apport_solaire_fr: number;
  apport_interne_fr: number;
  apport_solaire_ch: number;
  apport_interne_ch: number;
  fraction_apport_gratuit_ch: number;
  fraction_apport_gratuit_depensier_ch: number;
  pertes_distribution_ecs_recup: number;
  pertes_distribution_ecs_recup_depensier: number;
  pertes_stockage_ecs_recup: number;
  pertes_generateur_ch_recup: number;
  pertes_generateur_ch_recup_depensier: number;
  nadeq: number;
  v40_ecs_journalier: number;
  v40_ecs_journalier_depensier: number;
  besoin_ch: number;
  besoin_ch_depensier: number;
  besoin_ecs: number;
  besoin_ecs_depensier: number;
  besoin_fr: number;
  besoin_fr_depensier: number;
}

export interface EfConso {
  conso_ch: number;
  conso_ch_depensier: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
  conso_eclairage: number;
  conso_auxiliaire_generation_ch: number;
  conso_auxiliaire_generation_ch_depensier: number;
  conso_auxiliaire_distribution_ch: number;
  conso_auxiliaire_generation_ecs: number;
  conso_auxiliaire_generation_ecs_depensier: number;
  conso_auxiliaire_distribution_ecs: number;
  conso_auxiliaire_distribution_fr?: number;
  conso_auxiliaire_ventilation: number;
  conso_totale_auxiliaire: number;
  conso_fr: number;
  conso_fr_depensier: number;
  conso_5_usages: number;
  conso_5_usages_m2: number;
}

export interface EpConso {
  ep_conso_ch: number;
  ep_conso_ch_depensier: number;
  ep_conso_ecs: number;
  ep_conso_ecs_depensier: number;
  ep_conso_eclairage: number;
  ep_conso_auxiliaire_generation_ch: number;
  ep_conso_auxiliaire_generation_ch_depensier: number;
  ep_conso_auxiliaire_distribution_ch: number;
  ep_conso_auxiliaire_generation_ecs: number;
  ep_conso_auxiliaire_generation_ecs_depensier: number;
  ep_conso_auxiliaire_distribution_ecs: number;
  ep_conso_auxiliaire_distribution_fr?: number;
  ep_conso_auxiliaire_ventilation: number;
  ep_conso_totale_auxiliaire: number;
  ep_conso_fr: number;
  ep_conso_fr_depensier: number;
  ep_conso_5_usages: number;
  ep_conso_5_usages_m2: number;
  classe_bilan_dpe: string;
}

export interface EmissionGes {
  emission_ges_ch: number;
  emission_ges_ch_depensier: number;
  emission_ges_ecs: number;
  emission_ges_ecs_depensier: number;
  emission_ges_eclairage: number;
  emission_ges_auxiliaire_generation_ch: number;
  emission_ges_auxiliaire_generation_ch_depensier: number;
  emission_ges_auxiliaire_distribution_ch: number;
  emission_ges_auxiliaire_generation_ecs: number;
  emission_ges_auxiliaire_generation_ecs_depensier: number;
  emission_ges_auxiliaire_distribution_ecs: number;
  emission_ges_auxiliaire_distribution_fr?: number;
  emission_ges_auxiliaire_ventilation: number;
  emission_ges_totale_auxiliaire: number;
  emission_ges_fr: number;
  emission_ges_fr_depensier: number;
  emission_ges_5_usages: number;
  emission_ges_5_usages_m2: number;
  classe_emission_ges: string;
}

export interface Cout {
  cout_ch: number;
  cout_ch_depensier: number;
  cout_ecs: number;
  cout_ecs_depensier: number;
  cout_eclairage: number;
  cout_auxiliaire_generation_ch: number;
  cout_auxiliaire_generation_ch_depensier: number;
  cout_auxiliaire_distribution_ch: number;
  cout_auxiliaire_generation_ecs: number;
  cout_auxiliaire_generation_ecs_depensier: number;
  cout_auxiliaire_distribution_ecs: number;
  cout_auxiliaire_distribution_fr?: number;
  cout_auxiliaire_ventilation: number;
  cout_total_auxiliaire: number;
  cout_fr: number;
  cout_fr_depensier: number;
  cout_5_usages: number;
}

export interface ProductionElectricite {
  production_pv: number;
  conso_elec_ac: number;
  conso_elec_ac_ch: number;
  conso_elec_ac_ecs: number;
  conso_elec_ac_fr: number;
  conso_elec_ac_eclairage: number;
  conso_elec_ac_auxiliaire: number;
  conso_elec_ac_autre_usage: number;
}

export interface SortieParEnergie {
  enum_type_energie_id: number;
  conso_ch: number;
  conso_ecs: number;
  conso_5_usages: number;
  emission_ges_ch: number;
  emission_ges_ecs: number;
  emission_ges_5_usages: number;
  cout_ch: number;
  cout_ecs: number;
  cout_5_usages: number;
}

export interface ConfortEte {
  isolation_toiture?: boolean;
  protection_solaire_exterieure: boolean;
  aspect_traversant?: boolean;
  brasseur_air?: boolean;
  inertie_lourde: boolean;
  enum_indicateur_confort_ete_id: number;
}

export interface QualiteIsolation {
  ubat: number;
  qualite_isol_enveloppe: number;
  qualite_isol_mur?: number;
  qualite_isol_plancher_haut_toit_terrasse?: number;
  qualite_isol_plancher_haut_comble_perdu?: number;
  qualite_isol_plancher_haut_comble_amenage?: number;
  qualite_isol_plancher_bas?: number;
  qualite_isol_menuiserie: number;
}
