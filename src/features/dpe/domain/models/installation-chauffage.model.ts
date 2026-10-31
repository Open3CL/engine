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
} from './dpe-xsd.generated';

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
export type GenerateurChauffageDE = XsdLogementInstallationChauffageGenerateurChauffageDonneeEntree;
export type GenerateurChauffageDI =
  XsdLogementInstallationChauffageGenerateurChauffageDonneeIntermediaire;

export enum TypeGenerateur {
  CHAUDIERE = 'CHAUDIERE',
  OTHER = 'OTHER'
}

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

export interface GenerateurChauffage extends XsdLogementInstallationChauffageGenerateurChauffage {
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
