import { mois_liste } from '../../../../utils.js';
import { inject } from 'dioma';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/baieVitreeTv.store.js';

/**
 * Calcul e la surface sud équivalente du logement
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
    const baiesVitrees = enveloppe.baie_vitree_collection?.baie_vitree || [];
    const ets = enveloppe.ets_collection?.ets || [];

    return mois_liste.reduce((acc, mois) => acc + this.ssdMois(ctx, baiesVitrees, ets, mois), 0);
  }

  /**
   * Calcul de la surface sud du logement pour un mois donné
   *
   * @param ctx {Contexte}
   * @param baiesVitrees {BaieVitree[]}
   * @param ets {Ets}
   * @param mois {string}
   * @returns {number}
   */
  ssdMois(ctx, baiesVitrees, ets, mois) {
    let SseVerandaj = 0;

    /**
     * Si une véranda est présente, on calcul l'mpact de l’espace tampon solarisé sur les apports solaires à travers
     * les baies vitrées qui séparent le logement de l'espace tampon
     *
     * 6.3 Traitement des espaces tampons solarisés
     * 10 - 'espace tampon solarisé (véranda,loggia fermée)'
     */
    if (ets) {
      // Certaines vérandas sont dupliqués dans les DPE.
      if (Array.isArray(ets)) {
        ets = ets[0];
      }

      if (ets) {
        const bver = ets.donnee_intermediaire.bver;
        const T = ets.donnee_intermediaire.coef_transparence_ets;

        /**
         * Surface sud équivalente représentant l’impact des apports solaires associés au rayonnement solaire
         * traversant directement l’espace tampon pour arriver dans la partie habitable du logement
         * Calculés pour les baies vitrées qui séparent le logement de l'espace tampon
         * @type {number}
         */
        const Ssdj = this.getBaiesSurEspaceTampon(baiesVitrees).reduce((acc, bv) => {
          return acc + T * this.ssdBaieMois(bv, ctx.zoneClimatique.id, mois);
        }, 0);

        /**
         * Surface sud équivalente représentant les apports solaires indirects dans le logement
         */
        let baies = ets.baie_ets_collection.baie_ets;

        if (!Array.isArray(baies)) {
          baies = [baies];
        }

        /**
         * Apports totaux à travers l'espace tampon
         * @type {number}
         */
        const Sstj = baies.reduce((acc, bv) => {
          return acc + this.ssdBaieMois(bv, ctx.zoneClimatique.id, mois, 0.8 * T + 0.024);
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
         * @type {number}
         */
        SseVerandaj = Ssdj + Ssindj * bver;
      }
    }

    return baiesVitrees.reduce((acc, baieVitree) => {
      const typeAdjacence = parseInt(baieVitree.donnee_entree.enum_type_adjacence_id);

      /**
       * 6.3 Traitement des espaces tampons solarisés
       * 10 - 'espace tampon solarisé (véranda,loggia fermée)'
       */
      if (typeAdjacence === 10 && ets) {
        return acc + SseVerandaj;
      }

      // Pour les fenêtres qui ne donnent pas sur l'extérieur, pas de surface sud équivalente
      if (typeAdjacence !== 1) {
        return acc;
      }

      return acc + this.ssdBaieMois(baieVitree, ctx.zoneClimatique.id, mois);
    }, 0);
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
