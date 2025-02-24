import enums from '../../../../enums.js';
import { logger } from '../../../../core/util/logger/log-service.js';
import { inject } from 'dioma';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';

/**
 * Calcul des déperditions de l’enveloppe GV
 * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3
 */
export class DeperditionService {
  /**
   * @type {TvStore}
   */
  tvStore;

  /**
   * @param tvStore {TvStore}
   */
  constructor(tvStore = inject(TvStore)) {
    this.tvStore = tvStore;
  }

  /**
   * Détermination des déperditions pour l'enveloppe concernée
   * @param ctx {Contexte}
   * @param de {DE}
   * @return void
   */
  /* eslint-disable no-unused-vars */
  execute(ctx, de) {
    throw new Error('Unsupported operation');
  }

  /**
   * Détermination du coefficient de réduction des déperditions b
   * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3.1
   *
   * @param d {DeperditionData}
   * @return {number|undefined} Retourne le coefficient de réduction des déperditions b ou undefined si le calcul est impossible
   */
  b(d) {
    let uVue,
      zc,
      rAiuAue = undefined;
    let enumTypeAdjacenceId = d.enumTypeAdjacenceId;

    if (
      ['8', '9', '11', '12', '13', '14', '15', '16', '17', '18', '19', '21'].includes(
        enumTypeAdjacenceId
      )
    ) {
      if (!d.surfaceAue || d.surfaceAue === 0) {
        return 0;
      }

      /**
       * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021)
       * chapitre 3.1 Détermination du coefficient de réduction des déperditions b
       * 'Dans le cas de locaux non chauffés non accessibles (mitoyenneté, espace sans accès…), forfaitairement b = 0,95.'
       */
      if (d.enumCfgIsolationLncId === '1') {
        enumTypeAdjacenceId = undefined;
      } else {
        uVue = this.tvStore.getUVue(enumTypeAdjacenceId) || 0;
        rAiuAue = d.surfaceAiu / d.surfaceAue;
      }
    }

    /**
     * Type d'adjacence 10: 'espace tampon solarisé (véranda,loggia fermée)'
     * Prise en compte de la zone climatique
     */
    if (['10'].includes(enumTypeAdjacenceId)) {
      if (!d.zoneClimatiqueId) {
        logger.warn(
          `impossible de calculer b pour TypeAdjacenceId:${enumTypeAdjacenceId} sans zone climatique`
        );
        return;
      }
      zc = enums.zone_climatique[parseInt(d.zoneClimatiqueId)];
    }

    return this.tvStore.getB(enumTypeAdjacenceId, uVue, d.enumCfgIsolationLncId, rAiuAue, zc);
  }

  /**
   * Si Année d'isolation connue alors on prend cette donnée.
   * Sinon
   *   Si Année de construction ≤74 alors Année d’isolation = 75-77
   *   Sinon Année d’isolation = Année de construction
   *
   * @param enumPeriodeIsolationId {number}
   * @param ctx {Contexte}
   * @return {string} ID de la période d'isolation
   */
  getEnumPeriodeIsolationId(enumPeriodeIsolationId, ctx) {
    return (
      enumPeriodeIsolationId || Math.max(parseInt(ctx.enumPeriodeConstructionId), 3).toString()
    );
  }
}
