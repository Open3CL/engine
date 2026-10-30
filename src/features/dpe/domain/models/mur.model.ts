// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppeMur,
  XsdLogementEnveloppeMurDonneeEntree,
  XsdLogementEnveloppeMurDonneeIntermediaire
} from './dpe-xsd.generated';

export type Mur = XsdLogementEnveloppeMur;
export type MurDE = XsdLogementEnveloppeMurDonneeEntree;
export type MurDI = XsdLogementEnveloppeMurDonneeIntermediaire;
