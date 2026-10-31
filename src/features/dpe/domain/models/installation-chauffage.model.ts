import type {
  XsdLogementInstallationChauffage,
  XsdLogementInstallationChauffageDonneeEntree,
  XsdLogementInstallationChauffageDonneeIntermediaire,
  XsdLogementInstallationChauffageEmetteurChauffage,
  XsdLogementInstallationChauffageEmetteurChauffageDonneeEntree,
  XsdLogementInstallationChauffageEmetteurChauffageDonneeIntermediaire,
  XsdLogementInstallationChauffageGenerateurChauffage,
  XsdLogementInstallationChauffageGenerateurChauffageDonneeEntree,
  XsdLogementInstallationChauffageGenerateurChauffageDonneeIntermediaire
} from './dpe-xsd.generated.js';

/** + champ Open3CL hors XSD : `ficheTechniqueComptage` (fiche technique). */
export type InstallationChauffageDE = XsdLogementInstallationChauffageDonneeEntree & {
  ficheTechniqueComptage?: any;
};
export type InstallationChauffageDI = XsdLogementInstallationChauffageDonneeIntermediaire;
export interface EmetteurChauffage extends Omit<
  XsdLogementInstallationChauffageEmetteurChauffage,
  'donnee_intermediaire'
> {
  donnee_intermediaire: EmetteurChauffageDI;
}
export type EmetteurChauffageDE = XsdLogementInstallationChauffageEmetteurChauffageDonneeEntree;
/** + champ calculé Open3CL hors XSD : `lb` (longueur de boucle). */
export type EmetteurChauffageDI =
  XsdLogementInstallationChauffageEmetteurChauffageDonneeIntermediaire & {
    lb?: number;
  };
/** Champs communs aux générateurs (chauffage et ECS) ajoutés par le moteur hors XSD, en entrée. */
export interface GenerateurDEMoteur {
  /** Année d'installation (issue de la saisie ou de la fiche technique). */
  annee_installation?: number | string;
  /** 1 si le générateur a un ventilateur (chaudières bois). */
  presenceVentilateur?: number;
  /** 1 si le générateur est à ventilateur de combustion (renseigné par le moteur, §13.2). */
  ventilateurCombustion?: number;
  ratio_virtualisation?: number | null;
  enum_type_installation_id?: string | null;
  enum_type_generateur_ecs_id?: string | null;
  enum_periode_installation_ecs_thermo_id?: string | null;
  volume_stockage?: number | null;
  /** Clé de répartition de la consommation ECS (copiée de l'installation par le moteur). */
  cle_repartition_ecs?: number | null;
  /** Clé de répartition de la consommation de chauffage (copiée de l'installation par le moteur). */
  cle_repartition_ch?: number | null;
}

/** Champs communs aux générateurs (chauffage et ECS) calculés par le moteur hors XSD. */
export interface GenerateurDIMoteur {
  /** Rendement de génération (PAC) : scop ou cop. */
  rg?: number | null;
  /** Rendement de génération du cas dépensier (PAC). */
  rg_dep?: number | null;
  scop?: number | null;
  cop?: number | null;
  /** Puissance de la veilleuse (W). */
  pveil?: number | null;
}

/** + champs calculés/renseignés par le moteur hors XSD. */
export type GenerateurChauffageDE =
  XsdLogementInstallationChauffageGenerateurChauffageDonneeEntree &
    GenerateurDEMoteur & {
      /** Nombre d'installations de chauffage de l'immeuble (rdim). */
      rdim_installation_ch?: number;
      /** true si `rdim` a été reconstitué pour un DPE à l'immeuble. */
      rdim_reconstitue?: boolean;
      /** Nombre de niveaux de l'installation (copié de l'installation par le moteur). */
      nombre_niveau_installation_ch?: number;
      /** Surface chauffée par l'installation (copiée de l'installation par le moteur). */
      surface_chauffee?: number;
    };
export type GenerateurChauffageDI =
  XsdLogementInstallationChauffageGenerateurChauffageDonneeIntermediaire & GenerateurDIMoteur;

/** Type de générateur (défini à l'exécution dans type-generateur.model.js). */
export type TypeGenerateur = 'CHAUDIERE' | 'OTHER';

/** Donnée utilisateur propre à Open3CL (absente du XSD). */
export interface GenerateurChauffageDU {
  /** Valeurs intermédiaires ajoutées dynamiquement par le moteur (ex. conso_ch_appoint_bijonction). */
  [key: string]: any;
  ratio_virtualisation?: number;
  typeGenerateur?: TypeGenerateur;
  isCombustionGenerator?: boolean;
  combustion: boolean;
  pac: boolean;
  generateur?: {
    tv_generateur_combustion_id: string;
    enum_type_generateur_ch_id: string;
    type_generateur: string;
    critere_pn: string;
    pveil: string;
    qp0_perc: string;
    rpint: string;
    rpn: string;
  };
}

export interface GenerateurChauffage extends Omit<
  XsdLogementInstallationChauffageGenerateurChauffage,
  'donnee_entree' | 'donnee_intermediaire'
> {
  donnee_entree: GenerateurChauffageDE;
  donnee_intermediaire?: GenerateurChauffageDI;
  donnee_utilisateur?: GenerateurChauffageDU;
}

export interface InstallationChauffage extends Omit<
  XsdLogementInstallationChauffage,
  'donnee_entree' | 'emetteur_chauffage_collection' | 'generateur_chauffage_collection'
> {
  donnee_entree: InstallationChauffageDE;
  donnee_utilisateur?: Record<string, any>; // hors XSD
  emetteur_chauffage_collection: { emetteur_chauffage: EmetteurChauffage[] };
  generateur_chauffage_collection: { generateur_chauffage: GenerateurChauffage[] };
}
