// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementSortie,
  XsdLogementSortieApportEtBesoin,
  XsdLogementSortieConfortEte,
  XsdLogementSortieCout,
  XsdLogementSortieDeperdition,
  XsdLogementSortieEfConso,
  XsdLogementSortieEmissionGes,
  XsdLogementSortieEpConso,
  XsdLogementSortieProductionElectricite,
  XsdLogementSortieQualiteIsolation,
  XsdLogementSortieSortieParEnergie
} from './dpe-xsd.generated.js';

export interface Sortie extends Omit<XsdLogementSortie, 'ep_conso'> {
  ep_conso: EpConso;
}
export type Deperdition = XsdLogementSortieDeperdition;
export type ApportEtBesoin = XsdLogementSortieApportEtBesoin;
export type EfConso = XsdLogementSortieEfConso;
/** + champs Open3CL hors XSD : indicateurs « 2027 ». */
export type EpConso = XsdLogementSortieEpConso & {
  classe_bilan_dpe_2027?: string;
  ep_conso_5_usages_2027?: number;
  ep_conso_5_usages_2027_m2?: number;
};
export type EmissionGes = XsdLogementSortieEmissionGes;
export type Cout = XsdLogementSortieCout;
export type ProductionElectricite = XsdLogementSortieProductionElectricite;
export type SortieParEnergie = XsdLogementSortieSortieParEnergie;
export type ConfortEte = XsdLogementSortieConfortEte;
export type QualiteIsolation = XsdLogementSortieQualiteIsolation;
