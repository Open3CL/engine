// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementClimatisation,
  XsdLogementClimatisationDonneeEntree,
  XsdLogementClimatisationDonneeIntermediaire
} from './dpe-xsd.generated.js';

export interface Climatisation extends Omit<XsdLogementClimatisation, 'donnee_intermediaire'> {
  donnee_intermediaire?: ClimatisationDI;
}
export type ClimatisationDE = XsdLogementClimatisationDonneeEntree;
/** + champ calculé Open3CL hors XSD. */
export type ClimatisationDI = XsdLogementClimatisationDonneeIntermediaire & {
  besoin_fr_depensier?: number;
};
