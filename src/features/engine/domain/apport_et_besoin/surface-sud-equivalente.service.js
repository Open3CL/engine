import { mois_liste } from '../../../../utils.js';
import { inject } from 'dioma';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/enveloppe/baieVitreeTv.store.js';

/**
 * Calcul de la surface sud équivalente du logement
 * Chapitre 6.2 Détermination de la surface Sud équivalente
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 45
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class SurfaceSudEquivalenteService {
  /**
   * @type {BaieVitreeTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {BaieVitreeTvStore}
   */
  constructor(tvStore = inject(BaieVitreeTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   * @return {number}
   */
  execute(ctx, enveloppe) {
    return mois_liste.reduce((acc, mois) => acc + this.ssdMois(ctx, enveloppe, mois), 0);
  }

  /**
   * Calcul de la surface sud équivalente du logement pour un mois donné
   *
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   * @param mois {string}
   * @returns {number}
   */
  ssdMois(ctx, enveloppe, mois) {
    const baiesVitrees = enveloppe.baie_vitree_collection?.baie_vitree || [];
    const zc = ctx.zoneClimatique.id;

    /**
     * Baies vitrées donnant directement sur l'extérieur
     */
    const sseBaiesExt = baiesVitrees
      .filter((bv) => parseInt(bv.donnee_entree.enum_type_adjacence_id) === 1)
      .reduce((acc, bv) => acc + this.ssdBaieMois(bv, zc, mois), 0);

    /**
     * 6.3 Traitement des espaces tampons solarisés
     * 10 - 'espace tampon solarisé (véranda,loggia fermée)'
     *
     * Plusieurs espaces tampons solarisés (issue #101) : T, bver, Sst et Ssd sont propres à chaque
     * véranda. Sse = Sse_ext + Σ(v) Sse_veranda_v, chaque baie adjacence 10 n'étant comptée que dans
     * la véranda sur laquelle elle donne (baie.reference_lnc = ets.reference).
     * Sse_ver n'est calculée que pour les baies vitrées qui séparent le logement de l'espace tampon :
     * sans aucune de ces baies, les apports de l'espace tampon n'entrent pas dans le logement.
     */
    const etsList = this.dedoublonnerEts(this.getEtsList(enveloppe));
    const baiesParEts = this.rattacherBaiesAuxEts(
      this.getBaiesSurEspaceTampon(baiesVitrees),
      etsList
    );

    return etsList.reduce(
      (acc, ets, idx) => acc + this.sseVerandaMois(ets, baiesParEts[idx], zc, mois),
      sseBaiesExt
    );
  }

  /**
   * Surface sud équivalente apportée par une véranda sur un mois donné (§6.3)
   *
   * @param ets {Ets}
   * @param baiesAdjVeranda {BaieVitree[]} baies vitrées séparant le logement de cette véranda
   * @param zc {string} zone climatique du logement
   * @param mois {string}
   * @returns {number}
   */
  sseVerandaMois(ets, baiesAdjVeranda, zc, mois) {
    // Véranda sans baie vitrée vers le logement : aucun apport solaire
    if (baiesAdjVeranda.length === 0) {
      return 0;
    }

    const bver = ets.donnee_intermediaire.bver;
    const T = ets.donnee_intermediaire.coef_transparence_ets;

    /**
     * Surface sud équivalente représentant l’impact des apports solaires associés au rayonnement solaire
     * traversant directement l’espace tampon pour arriver dans la partie habitable du logement
     * Calculés pour les baies vitrées qui séparent le logement de cet espace tampon
     * @type {number}
     */
    const Ssdj = baiesAdjVeranda.reduce((acc, bv) => acc + T * this.ssdBaieMois(bv, zc, mois), 0);

    /**
     * Baies de l'espace tampon donnant sur l'extérieur (propres à chaque véranda)
     */
    let baies = ets.baie_ets_collection?.baie_ets || [];

    if (!Array.isArray(baies)) {
      baies = [baies];
    }

    /**
     * Apports totaux à travers l'espace tampon
     * @type {number}
     */
    const Sstj = baies.reduce((acc, bv) => {
      return acc + this.ssdBaieMois(bv, zc, mois, 0.8 * T + 0.024);
    }, 0);

    /**
     * Surface sud équivalente représentant l’impact des apports solaires indirects associés au rayonnement
     * solaire entrant dans la partie habitable du logement après de multiples réflexions dans l’espace tampon solarisé
     * @type {number}
     */
    const Ssindj = Sstj - Ssdj;

    /**
     * Impact de l’espace tampon solarisé sur les apports solaires à travers les baies vitrées qui séparent le logement
     * de l'espace tampon
     */
    return Ssdj + Ssindj * bver;
  }

  /**
   * Liste des espaces tampons solarisés du logement (la collection peut contenir un objet unique,
   * un tableau, ou être absente selon les DPE)
   *
   * @param enveloppe {Enveloppe}
   * @returns {Ets[]}
   */
  getEtsList(enveloppe) {
    const ets = enveloppe.ets_collection?.ets;
    if (!ets) {
      return [];
    }
    return Array.isArray(ets) ? ets : [ets];
  }

  /**
   * Certaines vérandas sont dupliquées dans les DPE : une même véranda (même référence, ou à défaut
   * même contenu) ne doit être comptée qu'une seule fois.
   *
   * @param etsList {Ets[]}
   * @returns {Ets[]}
   */
  dedoublonnerEts(etsList) {
    const vues = new Set();
    return etsList.filter((ets) => {
      if (!ets) return false;
      const reference = ets.donnee_entree?.reference;
      const cle = reference ? `ref:${reference}` : `json:${JSON.stringify(ets)}`;
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
   * DPE ne comporte qu'une véranda.
   *
   * @param baiesAdjVeranda {BaieVitree[]}
   * @param etsList {Ets[]}
   * @returns {BaieVitree[][]} baies par véranda, dans l'ordre de etsList
   */
  rattacherBaiesAuxEts(baiesAdjVeranda, etsList) {
    const baiesParEts = etsList.map(() => []);
    // Aucune véranda exploitable : les baies adjacence 10 ne peuvent être rattachées à aucun ETS
    if (etsList.length === 0) {
      return baiesParEts;
    }
    baiesAdjVeranda.forEach((bv) => {
      const referenceLnc = bv.donnee_entree.reference_lnc;
      const idx = referenceLnc
        ? etsList.findIndex((ets) => ets.donnee_entree?.reference === referenceLnc)
        : -1;
      baiesParEts[idx === -1 ? 0 : idx].push(bv);
    });
    return baiesParEts;
  }

  /**
   * Retourne la liste des baies vitrées qui donnent sur l'espace tampon solarisé
   * @param baiesVitrees {BaieVitree[]}
   */
  getBaiesSurEspaceTampon(baiesVitrees) {
    return baiesVitrees.filter((bv) => parseInt(bv.donnee_entree.enum_type_adjacence_id) === 10);
  }

  /**
   * Calcul de la surface sud équivalente pour une baie vitrée bv et pendant un mois donné
   *
   * @param baieVitree {BaieVitree|BaieEts}
   * @param zc {string} zone climatique du logement
   * @param mois {string} mois au cours duquel calculer la surface sur équivalente de la baie vitrée
   * @param coeff {number} coefficient à appliquer à cette surface sud
   * @returns {number}
   */
  ssdBaieMois(baieVitree, zc, mois, coeff) {
    const baieVitreeDE = baieVitree.donnee_entree;
    const baieVitreeDI = baieVitree.donnee_intermediaire || {};

    const C1 = this.#tvStore.getCoefficientBaieVitree(
      parseInt(baieVitreeDE.enum_orientation_id),
      parseInt(baieVitreeDE.enum_inclinaison_vitrage_id ?? 3),
      parseInt(zc),
      mois
    );

    const fe1 = baieVitreeDI.fe1 ?? 1;
    const fe2 = baieVitreeDI.fe2 ?? 1;

    return (
      baieVitreeDE.surface_totale_baie *
      C1 *
      (coeff || baieVitree.donnee_intermediaire.sw) *
      fe1 *
      fe2
    );
  }
}
