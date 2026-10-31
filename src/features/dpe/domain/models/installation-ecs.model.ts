import type {
  XsdLogementInstallationEcs,
  XsdLogementInstallationEcsDonneeEntree,
  XsdLogementInstallationEcsDonneeIntermediaire,
  XsdLogementInstallationEcsGenerateurEcs,
  XsdLogementInstallationEcsGenerateurEcsDonneeEntree,
  XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire
} from './dpe-xsd.generated.js';
import type { GenerateurDEMoteur, GenerateurDIMoteur } from './installation-chauffage.model.js';

export type InstallationEcsDE = XsdLogementInstallationEcsDonneeEntree;
/** + champs calculés par le moteur hors XSD. */
export type InstallationEcsDI = XsdLogementInstallationEcsDonneeIntermediaire & {
  /** Longueur de boucle de distribution ECS (m). */
  lb?: number;
  /** Consommation des auxiliaires de distribution ECS. */
  conso_auxiliaire_distribution_ecs?: number;
  /** true si rdim est neutralisé pour l'installation. */
  rdim_neutralise?: boolean;
};
/** + champs calculés/renseignés par le moteur hors XSD. */
export type GenerateurEcsDE = XsdLogementInstallationEcsGenerateurEcsDonneeEntree &
  GenerateurDEMoteur;
export type GenerateurEcsDI = XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire &
  GenerateurDIMoteur;

/** Donnée utilisateur propre à Open3CL (absente du XSD) : valeurs intermédiaires du moteur. */
export interface InstallationEcsDU {
  QdwIndVc: { conventionnel: number; depensier: number };
  QdwColVc: { conventionnel: number; depensier: number };
  QdwColHVc: { conventionnel: number; depensier: number };
  QgwRecuperable: number;
}

/** Donnée utilisateur propre à Open3CL (absente du XSD). */
export interface GenerateurEcsDU {
  [key: string]: any;
  Qgw?: number;
}

export interface GenerateurEcs extends Omit<
  XsdLogementInstallationEcsGenerateurEcs,
  'donnee_entree' | 'donnee_intermediaire'
> {
  donnee_entree: GenerateurEcsDE;
  donnee_intermediaire?: GenerateurEcsDI;
  donnee_utilisateur?: GenerateurEcsDU;
}

export interface InstallationEcs extends Omit<
  XsdLogementInstallationEcs,
  'generateur_ecs_collection' | 'donnee_intermediaire'
> {
  donnee_intermediaire?: InstallationEcsDI;
  donnee_utilisateur?: InstallationEcsDU;
  generateur_ecs_collection: { generateur_ecs: GenerateurEcs[] };
}
