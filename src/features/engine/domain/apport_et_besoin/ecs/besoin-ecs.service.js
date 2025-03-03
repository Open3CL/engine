import { mois_liste, Njj } from '../../../../../utils.js';
import { EcsTvStore } from '../../../../dpe/infrastructure/ecs/ecsTv.store.js';
import { inject } from 'dioma';

/**
 * Calcul du nombre d’adultes équivalent Nadeq
 * Chapitre 11.1 Calcul du besoin d’ECS
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 70
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class BesoinEcsService {
  /**
   * @type {EcsTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {EcsTvStore}
   */
  constructor(tvStore = inject(EcsTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * @param ctx {Contexte}
   * @return {{besoin_ecs: number, besoin_ecs_depensier: number}}
   */
  execute(ctx) {
    return mois_liste.reduce(
      (acc, mois) => {
        acc.besoin_ecs += this.besoinEcsMois(ctx, mois, false);
        acc.besoin_ecs_depensier += this.besoinEcsMois(ctx, mois, true);
        return acc;
      },
      { besoin_ecs: 0, besoin_ecs_depensier: 0 }
    );
  }

  /**
   * Calcul du besoin ecs pour un mois donné
   *
   * @param ctx {Contexte}
   * @param mois {string}
   * @param depensier {boolean}
   * @returns {number}
   */
  besoinEcsMois(ctx, mois, depensier) {
    const tefs = this.#tvStore.getTefs(ctx.altitude.value, ctx.zoneClimatique.value, mois);

    if (depensier) {
      return (1.163 * ctx.nadeq * 79 * (40 - tefs) * Njj[mois]) / 1000;
    } else {
      return (1.163 * ctx.nadeq * 56 * (40 - tefs) * Njj[mois]) / 1000;
    }
  }
}
