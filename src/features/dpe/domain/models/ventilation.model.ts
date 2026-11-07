// Alias des types générés depuis le XSD DPE (voir dpe-xsd.generated.ts). Les extensions propres
// à Open3CL se déclarent ici (hors fichier généré) pour survivre à la régénération.
import type {
  XsdLogementVentilation,
  XsdLogementVentilationDonneeEntree,
  XsdLogementVentilationDonneeIntermediaire
} from './dpe-xsd.generated.js';

export interface Ventilation extends Omit<XsdLogementVentilation, 'donnee_entree'> {
  donnee_entree: VentilationDE;
}
/** + champs Open3CL hors XSD issus des fiches techniques. */
export type VentilationDE = XsdLogementVentilationDonneeEntree & {
  ficheTechniqueFacadesExposees?: any;
  ficheTechniqueVentilationPost2012?: any;
};
export type VentilationDI = XsdLogementVentilationDonneeIntermediaire;

enum TypeVentilation {
  SIMPLE_FLUX_AUTO = 'SIMPLE_FLUX_AUTO',
  SIMPLE_FLUX_HYGRO = 'SIMPLE_FLUX_HYGRO',
  DOUBLE_FLUX = 'DOUBLE_FLUX'
}
