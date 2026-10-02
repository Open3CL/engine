import enums from './enums.js';
import tvs from './tv.js';
import { mois_liste } from './utils.js';

export function calc_sse_j(bv_list, ets, ca, zc, mois) {
  const baiesAdjVeranda = bv_list.filter((bv) => bv.donnee_entree.enum_type_adjacence_id === '10');
  const baiesAdjExt = bv_list.filter((bv) => bv.donnee_entree.enum_type_adjacence_id === '1');
  const sseBaiesExt = baiesAdjExt.reduce((acc, bv) => {
    return acc + getSsd(bv, zc, mois, bv.donnee_intermediaire.sw);
  }, 0);

  //ets peut etre un tableau vide  ou undefined selon les DPE, d'où la vérification ajoutée sur le tableau et sa longueur
  if (!ets || (Array.isArray(ets) && ets.length === 0)) {
    return sseBaiesExt;
  }

  /**
   * 6.3 Traitement des espaces tampons solarisés
   * Sse_ver n'est calculée que pour les baies vitrées qui séparent le logement de l'espace tampon
   * (adjacence 10). Sans aucune de ces baies, les apports de l'espace tampon n'entrent pas dans le logement.
   */
  if (baiesAdjVeranda.length === 0) {
    return sseBaiesExt;
  }

  /**
   * Plusieurs espaces tampons solarisés (issue #101) : T, bver, Sst et Ssd sont propres à chaque
   * véranda. Sse = Sse_ext + Σ(v) Sse_veranda_v, chaque baie adjacence 10 n'étant comptée que dans
   * la véranda sur laquelle elle donne (baie.reference_lnc = ets.reference).
   */
  const etsList = dedoublonnerEts(Array.isArray(ets) ? ets : [ets]);
  const baiesParEts = rattacherBaiesAuxEts(baiesAdjVeranda, etsList);

  return etsList.reduce(
    (acc, etsItem, idx) => acc + calc_sse_veranda_j(etsItem, baiesParEts[idx], zc, mois),
    sseBaiesExt
  );
}

/**
 * Certaines vérandas sont dupliquées dans les DPE : une même véranda (même référence, ou à défaut
 * même contenu) ne doit être comptée qu'une seule fois.
 *
 * @param etsList {EtsItem[]}
 * @returns {EtsItem[]}
 */
export function dedoublonnerEts(etsList) {
  const vues = new Set();
  return etsList.filter((etsItem) => {
    if (!etsItem) return false;
    const reference = etsItem.donnee_entree?.reference;
    const cle = reference ? `ref:${reference}` : `json:${JSON.stringify(etsItem)}`;
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}

/**
 * Rattache chaque baie vitrée adjacence 10 à l'espace tampon sur lequel elle donne
 * (baie.donnee_entree.reference_lnc = ets.donnee_entree.reference).
 *
 * Une baie sans lien exploitable (reference_lnc absente ou ne correspondant à aucune véranda) est
 * rattachée à la première véranda : c'est le comportement historique, et le seul possible quand le
 * DPE ne comporte qu'une véranda. La méthode ne permet pas de faire mieux pour une donnée manquante.
 *
 * @param baiesAdjVeranda {BaieVitreeItem[]}
 * @param etsList {EtsItem[]}
 * @returns {BaieVitreeItem[][]} baies par véranda, dans l'ordre de etsList
 */
export function rattacherBaiesAuxEts(baiesAdjVeranda, etsList) {
  const baiesParEts = etsList.map(() => []);
  // Aucune véranda exploitable : les baies adjacence 10 ne peuvent être rattachées à aucun ETS
  if (etsList.length === 0) {
    return baiesParEts;
  }
  baiesAdjVeranda.forEach((bv) => {
    const referenceLnc = bv.donnee_entree.reference_lnc;
    const idx = referenceLnc
      ? etsList.findIndex((etsItem) => etsItem.donnee_entree?.reference === referenceLnc)
      : -1;
    baiesParEts[idx === -1 ? 0 : idx].push(bv);
  });
  return baiesParEts;
}

/**
 * Surface sud équivalente apportée par une véranda sur le mois j (§6.3).
 *
 * @param ets {EtsItem}
 * @param baiesAdjVeranda {BaieVitreeItem[]} baies séparant le logement de cette véranda
 * @param zc {string}
 * @param mois {string}
 * @returns {number}
 */
function calc_sse_veranda_j(ets, baiesAdjVeranda, zc, mois) {
  // Véranda sans baie vitrée vers le logement : aucun apport solaire
  if (baiesAdjVeranda.length === 0) {
    return 0;
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

  return SseVerandaj;
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
