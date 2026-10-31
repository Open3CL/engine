// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementEnveloppeEts,
  XsdLogementEnveloppeEtsDonneeEntree,
  XsdLogementEnveloppeEtsDonneeIntermediaire
} from './dpe-xsd.generated';

export type Ets = XsdLogementEnveloppeEts;
export type EtsDE = XsdLogementEnveloppeEtsDonneeEntree;
export type EtsDI = XsdLogementEnveloppeEtsDonneeIntermediaire;
