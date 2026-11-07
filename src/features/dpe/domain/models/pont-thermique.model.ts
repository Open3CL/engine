// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppePontThermique,
  XsdLogementEnveloppePontThermiqueDonneeEntree,
  XsdLogementEnveloppePontThermiqueDonneeIntermediaire
} from './dpe-xsd.generated.js';

export type PontThermique = XsdLogementEnveloppePontThermique;
export type PontThermiqueDE = XsdLogementEnveloppePontThermiqueDonneeEntree;
export type PontThermiqueDI = XsdLogementEnveloppePontThermiqueDonneeIntermediaire;
