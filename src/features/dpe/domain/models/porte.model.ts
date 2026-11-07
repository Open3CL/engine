// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppePorte,
  XsdLogementEnveloppePorteDonneeEntree,
  XsdLogementEnveloppePorteDonneeIntermediaire
} from './dpe-xsd.generated.js';

export type Porte = XsdLogementEnveloppePorte;
export type PorteDE = XsdLogementEnveloppePorteDonneeEntree;
export type PorteDI = XsdLogementEnveloppePorteDonneeIntermediaire;
