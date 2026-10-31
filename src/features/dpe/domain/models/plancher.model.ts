// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppePlancherBas,
  XsdLogementEnveloppePlancherBasDonneeEntree,
  XsdLogementEnveloppePlancherBasDonneeIntermediaire,
  XsdLogementEnveloppePlancherHaut,
  XsdLogementEnveloppePlancherHautDonneeEntree,
  XsdLogementEnveloppePlancherHautDonneeIntermediaire
} from './dpe-xsd.generated.js';

export type PlancherBas = XsdLogementEnveloppePlancherBas;
export type PlancherBasDE = XsdLogementEnveloppePlancherBasDonneeEntree;
export type PlancherBasDI = XsdLogementEnveloppePlancherBasDonneeIntermediaire;
export type PlancherHaut = XsdLogementEnveloppePlancherHaut;
export type PlancherHautDE = XsdLogementEnveloppePlancherHautDonneeEntree;
export type PlancherHautDI = XsdLogementEnveloppePlancherHautDonneeIntermediaire;

/** @deprecated Les DE bas/haut sont désormais distincts dans le XSD. */
export type PlancherDE = PlancherBasDE | PlancherHautDE;
/** @deprecated */
export type PlancherDI = PlancherBasDI | PlancherHautDI;
