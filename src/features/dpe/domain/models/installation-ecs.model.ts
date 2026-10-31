import type {
  XsdLogementInstallationEcs,
  XsdLogementInstallationEcsDonneeEntree,
  XsdLogementInstallationEcsDonneeIntermediaire,
  XsdLogementInstallationEcsGenerateurEcs,
  XsdLogementInstallationEcsGenerateurEcsDonneeEntree,
  XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire
} from './dpe-xsd.generated.js';

export type InstallationEcsDE = XsdLogementInstallationEcsDonneeEntree;
export type InstallationEcsDI = XsdLogementInstallationEcsDonneeIntermediaire;
export type GenerateurEcsDE = XsdLogementInstallationEcsGenerateurEcsDonneeEntree;
export type GenerateurEcsDI = XsdLogementInstallationEcsGenerateurEcsDonneeIntermediaire;

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

export interface GenerateurEcs extends XsdLogementInstallationEcsGenerateurEcs {
  donnee_utilisateur?: GenerateurEcsDU;
}

export interface InstallationEcs extends Omit<
  XsdLogementInstallationEcs,
  'generateur_ecs_collection'
> {
  donnee_utilisateur?: InstallationEcsDU;
  generateur_ecs_collection: { generateur_ecs: GenerateurEcs[] };
}
