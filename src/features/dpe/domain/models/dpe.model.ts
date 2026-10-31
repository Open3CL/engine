import type {
  XsdAdministratif,
  XsdAdministratifDiagnostiqueur,
  XsdAdministratifGeolocalisation,
  XsdAdministratifInformationFormulaireConsentement,
  XsdDpe,
  XsdDpeImmeuble,
  XsdDpeImmeubleLogementVisite,
  XsdLogement,
  XsdLogementCaracteristiqueGenerale,
  XsdLogementEnveloppe,
  XsdLogementMeteo,
  XsdTAdresse
} from './dpe-xsd.generated.js';
import type { BaieVitree } from './baie-vitree.model.js';
import type { Climatisation } from './climatisation.model.js';
import type { Ets } from './ets.model.js';
import type { InstallationChauffage } from './installation-chauffage.model.js';
import type { InstallationEcs } from './installation-ecs.model.js';
import type { Mur } from './mur.model.js';
import type { PlancherBas, PlancherHaut } from './plancher.model.js';
import type { PontThermique } from './pont-thermique.model.js';
import type { Porte } from './porte.model.js';
import type { ProductionElecEnr } from './production-elec-enr.model.js';
import type { Sortie } from './sortie.model.js';
import type { Ventilation } from './ventilation.model.js';

// Types issus du XSD (générés) : voir dpe-xsd.generated.ts
export type Administratif = XsdAdministratif;
export type Diagnostiqueur = XsdAdministratifDiagnostiqueur;
export type Geolocalisation = XsdAdministratifGeolocalisation;
export type Adresse = XsdTAdresse;
/** Nom historique ; le XSD 2.7 parle de `information_formulaire_consentement`. */
export type InformationConsentementProprietaire = XsdAdministratifInformationFormulaireConsentement;
export type DpeImmeuble = XsdDpeImmeuble;
export type LogementVisite = XsdDpeImmeubleLogementVisite;
export type CaracteristiqueGenerale = XsdLogementCaracteristiqueGenerale;
export type Meteo = XsdLogementMeteo;

/**
 * Données de calcul propres à Open3CL (absentes du XSD) : séries mensuelles conservées entre les
 * étapes du moteur.
 */
export interface LogementDonneesCalcul {
  apportsInterneCh: { [key: string]: number };
  apportsInterneDepensier: { [key: string]: number };
  apportsSolaire: { [key: string]: number };
  besoinChauffageHP: { [key: string]: number };
  besoinChauffageDepensierHP: { [key: string]: number };
}

/** Enveloppe : collections typées avec les modèles enrichis (voir *.model.ts). */
export interface Enveloppe extends Omit<
  XsdLogementEnveloppe,
  | 'mur_collection'
  | 'plancher_bas_collection'
  | 'plancher_haut_collection'
  | 'baie_vitree_collection'
  | 'porte_collection'
  | 'ets_collection'
  | 'pont_thermique_collection'
> {
  mur_collection: { mur: Mur[] };
  plancher_bas_collection: { plancher_bas: PlancherBas[] };
  plancher_haut_collection: { plancher_haut: PlancherHaut[] };
  baie_vitree_collection: { baie_vitree: BaieVitree[] };
  porte_collection: { porte: Porte[] };
  /** Le XSD autorise plusieurs `ets` ; le parseur du moteur ne les met pas en tableau si un seul. */
  ets_collection: { ets: Ets | Ets[] };
  pont_thermique_collection: { pont_thermique: PontThermique[] };
}

/**
 * Logement : type XSD, avec les installations ECS/chauffage enrichies des `donnee_utilisateur`
 * propres à Open3CL, et `donnees_de_calcul` (hors XSD).
 */
export interface Logement extends Omit<
  XsdLogement,
  | 'enveloppe'
  | 'ventilation_collection'
  | 'climatisation_collection'
  | 'production_elec_enr'
  | 'sortie'
  | 'installation_ecs_collection'
  | 'installation_chauffage_collection'
> {
  enveloppe: Enveloppe;
  ventilation_collection: { ventilation: Ventilation[] };
  climatisation_collection: { climatisation: Climatisation[] };
  production_elec_enr?: ProductionElecEnr | null;
  sortie: Sortie;
  installation_ecs_collection: { installation_ecs: InstallationEcs[] };
  installation_chauffage_collection: { installation_chauffage: InstallationChauffage[] };
  donnees_de_calcul: LogementDonneesCalcul;
}

/**
 * Le moteur traite `tertiaire` et `logement_neuf` comme un logement (le XSD les décrit
 * différemment : cf. XsdTertiaire / XsdLogementNeuf dans dpe-xsd.generated.ts).
 */
export interface Tertiaire extends Logement {}

export interface LogementNeuf extends Logement {}

/**
 * @see https://gitlab.com/observatoire-dpe/observatoire-dpe/-/blob/master/modele_donnee/DPEv2.7.xsd
 */
export interface Dpe extends Omit<
  XsdDpe,
  'logement' | 'tertiaire' | 'logement_neuf' | 'administratif'
> {
  /** Hors XSD : numéro DPE ajouté par le moteur / l'API */
  numero_dpe: string;
  /** Hors XSD : statut du DPE */
  statut: string;
  administratif: Administratif;
  logement?: Logement;
  tertiaire?: Tertiaire;
  logement_neuf?: LogementNeuf;
}

export interface DE {
  description?: string;
  reference?: string;
}

/** Types définis à l'exécution dans type-habitation.model.js. */
export type TypeHabitation = 'MAISON' | 'APPARTEMENT' | 'IMMEUBLE';
export type TypeDpe = 'MAISON' | 'APPARTEMENT' | 'APPARTEMENT_A_PARTIR_IMMEUBLE' | 'IMMEUBLE';

export type FullDpe = Dpe;
