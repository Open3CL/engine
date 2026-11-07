// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppeBaieVitree,
  XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetre,
  XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeEntree,
  XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeIntermediaire,
  XsdLogementEnveloppeBaieVitreeDonneeEntree,
  XsdLogementEnveloppeBaieVitreeDonneeEntreeMasqueLointainNonHomogene,
  XsdLogementEnveloppeBaieVitreeDonneeIntermediaire
} from './dpe-xsd.generated.js';

/** + `donnee_utilisateur` Open3CL hors XSD. */
export type BaieVitree = XsdLogementEnveloppeBaieVitree & {
  donnee_utilisateur?: Record<string, any>;
};
export type BaieVitreeDE = XsdLogementEnveloppeBaieVitreeDonneeEntree;
/** + facteurs d'ensoleillement `fe1` / `fe2` (masques proches / lointains) calculés par le moteur hors XSD. */
export type BaieVitreeDI = XsdLogementEnveloppeBaieVitreeDonneeIntermediaire & {
  fe1?: number;
  fe2?: number;
};
export type BaieVitreeDoubleFenetre = XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetre;
export type BaieVitreeDoubleFenetreDE =
  XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeEntree;
export type BaieVitreeDoubleFenetreDI =
  XsdLogementEnveloppeBaieVitreeBaieVitreeDoubleFenetreDonneeIntermediaire;
export type MasqueLointainNonHomogene =
  XsdLogementEnveloppeBaieVitreeDonneeEntreeMasqueLointainNonHomogene;
