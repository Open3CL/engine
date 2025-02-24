import { BaieVitree } from './baie-vitree.model';
import { Climatisation } from './climatisation.model';
import { Ets } from './ets.model';
import { InstallationChauffage } from './installation-chauffage.model';
import { InstallationEcs } from './installation-ecs.model';
import { Mur } from './mur.model';
import { PlancherBas } from './plancher-bas.model';
import { PlancherHaut } from './plancher-haut.model';
import { PontThermique } from './pont-thermique.model';
import { Porte } from './porte.model';
import { ProductionElecEnr } from './production-elec-enr.model';
import { Sortie } from './sortie.model';
import { Ventilation } from './ventilation.model';

/**
 * @see https://gitlab.com/observatoire-dpe/observatoire-dpe/-/blob/master/modele_donnee/DPE_complet.xsd?ref_type=heads
 */
export interface Dpe {
  hashkey: string;
  id: string;
  version: string;
  numero_dpe: string;
  statut: string;
  administratif: Administratif;
  dpe_immeuble?: DpeImmeuble;
  logement?: Logement;
  tertiaire?: Tertiaire;
  logement_neuf?: LogementNeuf;
  descriptif_enr_collection: any; // Pas traité pour l'instant
  descriptif_simplifie_collection: any; // Pas traité pour l'instant
  fiche_technique_collection: any; // Pas traité pour l'instant
  justificatif_collection: any; // Pas traité pour l'instant
  descriptif_geste_entretien_collection: any; // Pas traité pour l'instant
  descriptif_travaux: any; // Pas traité pour l'instant
}

export interface Administratif {
  dpe_a_remplacer?: string;
  reference_interne_projet?: string;
  motif_remplacement?: string;
  dpe_immeuble_associe?: string;
  enum_version_id: string;
  date_visite_diagnostiqueur: string;
  nom_proprietaire?: string;
  siren_proprietaire?: string;
  nom_proprietaire_installation_commune?: string;
  date_etablissement_dpe: string;
  enum_modele_dpe_id: string;
  diagnostiqueur: Diagnostiqueur;
  geolocalisation: Geolocalisation;
  consentement_proprietaire?: boolean;
  information_consentement_proprietaire?: InformationConsentementProprietaire;
}

export interface Diagnostiqueur {
  usr_logiciel_id: string;
  version_logiciel: string;
  version_moteur_calcul?: string;
  nom_diagnostiqueur: string;
  prenom_diagnostiqueur: string;
  mail_diagnostiqueur: string;
  telephone_diagnostiqueur: string;
  adresse_diagnostiqueur: string;
  entreprise_diagnostiqueur: string;
  numero_certification_diagnostiqueur: string;
  organisme_certificateur: string;
}

export interface DpeImmeuble {
  logement_visite_collection: LogementVisite[];
}

export interface LogementVisite {
  description: string;
  enum_position_etage_logement_id: string;
  enum_typologie_logement_id: string;
  surface_habitable_logement: number;
}

export interface Geolocalisation {
  invar_logement?: string;
  numero_fiscal_local?: string;
  id_batiment_rnb?: string;
  rpls_log_id?: string;
  rpls_org_id?: string;
  idpar?: string;
  immatriculation_copropriete?: string;
  adresses?: {
    adresse_bien: Adresse;
    adresse_proprietaire: Adresse;
    adresse_proprietaire_installation_commune: Adresse;
  };
}

export interface Adresse {
  adresse_brut: string;
  code_postal_brut: string;
  nom_commune_brut: string;
  label_brut: string;
  label_brut_avec_complement: string;
  enum_statut_geocodage_ban_id: string;
  ban_date_appel: string;
  ban_id?: string;
  ban_id_ban_adresse?: string;
  ban_label?: string;
  ban_housenumber?: string;
  ban_street?: string;
  ban_citycode?: string;
  ban_postcode?: string;
  ban_city?: string;
  ban_type?: string;
  ban_score?: string;
  ban_x?: string;
  compl_nom_residence?: string;
  compl_ref_batiment?: string;
  compl_etage_appartement?: string;
  compl_ref_cage_escalier?: string;
  compl_ref_logement?: string;
}

export interface InformationConsentementProprietaire {
  nom_proprietaire: string;
  personne_morale: boolean;
  siren_proprietaire?: string;
  telephone?: string;
  mail?: string;
  label_adresse: string;
  label_adresse_avec_complement: string;
}

export interface CaracteristiqueGenerale {
  annee_construction?: number;
  enum_periode_construction_id: number;
  enum_methode_application_dpe_log_id: number;
  enum_calcul_echantillonnage_id?: number;
  surface_habitable_logement?: number;
  nombre_niveau_immeuble?: number;
  nombre_niveau_logement?: number;
  hsp: number;
  surface_habitable_immeuble?: number;
  surface_tertiaire_immeuble?: number;
  nombre_appartement?: number;
  appartement_non_visite: boolean;
}

export interface Meteo {
  enum_zone_climatique_id?: number;
  altitude: number;
  enum_classe_altitude_id: number;
  batiment_materiaux_anciens: boolean;
}

export interface Logement {
  caracteristique_generale: CaracteristiqueGenerale;
  meteo: Meteo;
  enveloppe: Enveloppe;
  ventilation_collection: { ventilation: Ventilation[] };
  climatisation_collection: { climatisation: Climatisation[] };
  production_elec_enr?: ProductionElecEnr;
  installation_ecs_collection: { installation_ecs: InstallationEcs[] };
  installation_chauffage_collection: { installation_chauffage: InstallationChauffage[] };
  sortie: Sortie;
}

export interface Tertiaire extends Logement {}

export interface LogementNeuf extends Logement {}

export interface Enveloppe {
  inertie: {
    inertie_plancher_bas_lourd: boolean;
    inertie_plancher_haut_lourd: boolean;
    inertie_paroi_verticale_lourd: boolean;
    enum_classe_inertie_id: number;
  };
  mur_collection: { mur: Mur[] };
  plancher_bas_collection: { plancher_bas: PlancherBas[] };
  plancher_haut_collection: { plancher_haut: PlancherHaut[] };
  baie_vitree_collection: { baie_vitree: BaieVitree[] };
  porte_collection: { porte: Porte[] };
  ets_collection: { ets: Ets };
  pont_thermique_collection: { pont_thermique: PontThermique[] };
}

export interface DE {
  description?: string;
  reference?: string;
}

enum TypeHabitation {
  MAISON = 'MAISON',
  APPARTEMENT = 'APPARTEMENT',
  IMMEUBLE = 'IMMEUBLE'
}
