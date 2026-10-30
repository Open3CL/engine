// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementProductionElecEnr,
  XsdLogementProductionElecEnrDonneeEntree,
  XsdLogementProductionElecEnrDonneeIntermediaire,
  XsdLogementProductionElecEnrPanneauxPv
} from './dpe-xsd.generated';

export type ProductionElecEnr = XsdLogementProductionElecEnr;
export type ProductionElecEnrDE = XsdLogementProductionElecEnrDonneeEntree;
export type ProductionElecEnrDI = XsdLogementProductionElecEnrDonneeIntermediaire;
export type PanneauFv = XsdLogementProductionElecEnrPanneauxPv;
