import { DeperditionService } from '../deperdition.service.js';
import { inject } from 'dioma';
import { BaieVitreeTvStore } from '../../../../dpe/infrastructure/baieVitreeTv.store.js';

/**
 * Calcul des déperditions des baies vitrées
 * Chapitre 3.3 Calcul des parois vitrées
 *
 * Méthode de calcul 3CL-DPE 2021
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class EspaceTamponService extends DeperditionService {
  /**
   * @param tvStore {BaieVitreeTvStore}
   */
  constructor(tvStore = inject(BaieVitreeTvStore)) {
    super(tvStore);
  }

  /**
   * @param ctx {Contexte}
   * @param ets {Ets}
   * @return {EtsDI}
   */
  execute(ctx, ets) {
    const bvDE = ets.donnee_entree;

    const bver = this.tvStore.getBver(
      ctx.zoneClimatique.value,
      parseInt(bvDE.enum_cfg_isolation_lnc_id)
    );

    const coef_transparence_ets = this.tvStore.getCoefTransparenceEts(
      parseInt(bvDE.tv_coef_transparence_ets_id)
    );

    /** @type {EtsDI} */
    return {
      bver,
      coef_transparence_ets
    };
  }
}
