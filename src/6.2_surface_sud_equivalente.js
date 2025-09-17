import enums from './enums.js';
import tvs from './tv.js';
import { mois_liste } from './utils.js';

export function calc_sse_j(bv_list, ets, ca, zc, mois) {
  const baiesAdjVeranda = bv_list.filter((bv) => bv.donnee_entree.enum_type_adjacence_id === '10');
  const baiesAdjExt = bv_list.filter((bv) => bv.donnee_entree.enum_type_adjacence_id === '1');

  if (!ets) {
    return baiesAdjExt.reduce((acc, bv) => {
      return acc + getSsd(bv, zc, mois, bv.donnee_intermediaire.sw);
    }, 0);
  }

  // Certaines vérandas sont dupliqués dans les DPE.
  if (Array.isArray(ets)) {
    ets = ets[0];
  }

  const bver = ets.donnee_intermediaire.bver;
  const T = ets.donnee_intermediaire.coef_transparence_ets;

  /**
   * Surface sud équivalente représentant les apports solaires indirects dans le logement
   */
  let baies = ets.baie_ets_collection.baie_ets;

  if (!Array.isArray(baies)) {
    baies = [baies];
  }

  /**
   * Surface sud équivalente représentant l’impact des apports solaires associés au rayonnement solaire
   * traversant directement l’espace tampon pour arriver dans la partie habitable du logement
   * Calculés pour les baies vitrées qui séparent le logement de l'espace tampon
   * @type {number}
   */
  const Ssdj =
    T *
    baiesAdjVeranda.reduce((acc, bv) => {
      /**
       * Surface sud équivalente représentant l’impact des apports solaires associés au rayonnement solaire
       * traversant directement l’espace tampon pour arriver dans la partie habitable du logement
       * Calculés pour les baies vitrées qui séparent le logement de l'espace tampon
       * @type {number}
       */
      return acc + getSsd(bv, zc, mois, bv.donnee_intermediaire.sw);
    }, 0);

  /**
   * 6.3 Traitement des espaces tampons solarisés
   * 10 - 'espace tampon solarisé (véranda,loggia fermée)'
   */
  const Sstj = baies.reduce((acc, bv) => {
    return acc + getSsd(bv, zc, mois, 0.8 * T + 0.024);
  }, 0);

  /**
   * Surface sud équivalente représentant l’impact des apports solaires associés au rayonnement
   * solaire entrant dans la partie habitable du logement après de multiples réflexions dans l’espace tampon solarisé
   * @type {number}
   */
  const ssIndj = Sstj - Ssdj;

  /**
   * Impact de l’espace tampon solarisé sur les apports solaires à travers les baies vitrées qui séparent le logement
   * de l'espace tampon
   * @type {number}
   */
  const SseVerandaj = Ssdj + ssIndj * bver;

  const sseBaiesExt = baiesAdjExt.reduce((acc, bv) => {
    return acc + getSsd(bv, zc, mois, bv.donnee_intermediaire.sw);
  }, 0);

  return sseBaiesExt + SseVerandaj;
}

/**
 * Calcul de la surface sur équivalente pour la baie vitrée bv pendant le mois $mois
 *
 * @param bv {BaieVitreeItem}
 * @param zc {string} zone climatique du logement
 * @param mois {string} mois au cours duquel calculer la surface sur équivalente de la baie vitrée
 * @param coeff {number} coefficient à appliquer à cette surface sud
 * @returns {number}
 */
function getSsd(bv, zc, mois, coeff) {
  const c1 = tvs.c1;

  const de = bv.donnee_entree;
  const di = bv.donnee_intermediaire || {};

  const orientation = enums.orientation[de.enum_orientation_id];
  const inclinaison = enums.inclinaison_vitrage[de.enum_inclinaison_vitrage_id ?? 3];
  let oi = `${orientation} ${inclinaison}`;
  if (orientation === 'horizontal' || inclinaison === 'horizontal') oi = 'horizontal';
  const c1j = c1[zc][mois][oi];

  const fe1 = di.fe1 ?? 1;
  const fe2 = di.fe2 ?? 1;

  return de.surface_totale_baie * c1j * coeff * fe1 * fe2;
}

export function calc_sse(ca, zc, bv_list, ets) {
  return mois_liste.reduce((acc, mois) => acc + calc_sse_j(bv_list, ets, ca, zc, mois), 0);
}
