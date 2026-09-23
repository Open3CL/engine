import { mois_liste } from '../../../../../utils.js';
import { inject } from 'dioma';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { ApportGratuitService } from '../apport_gratuit/apport-gratuit.service.js';

/**
 * Calcul du besoin en froid
 * Chapitre 10.2 Calcul du besoin mensuel de froid
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 68
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class BesoinFroidService {
  /**
   * @type {ApportGratuitService}
   */
  #apportGratuitService;

  /**
   * @type {FrTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {FrTvStore}
   * @param apportGratuitService {ApportGratuitService}
   */
  constructor(tvStore = inject(FrTvStore), apportGratuitService = inject(ApportGratuitService)) {
    this.#tvStore = tvStore;
    this.#apportGratuitService = apportGratuitService;
  }

  /**
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {{besoin_fr: number, besoin_fr_depensier: number}}
   */
  execute(ctx, logement) {
    const clim = logement.climatisation_collection?.climatisation || [];
    if (clim.length === 0) {
      return { besoin_fr: 0, besoin_fr_depensier: 0 };
    }

    return mois_liste.reduce(
      (acc, mois) => {
        acc.besoin_fr += this.besoinFrMois(ctx, logement, mois, false);
        acc.besoin_fr_depensier += this.besoinFrMois(ctx, logement, mois, true);
        return acc;
      },
      { besoin_fr: 0, besoin_fr_depensier: 0 }
    );
  }

  /**
   * Calcul du besoin en froid pour un mois donné
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param mois {string}
   * @param depensier {boolean}
   * @returns {number}
   */
  besoinFrMois(ctx, logement, mois, depensier) {
    const nref = this.#tvStore.getData(
      depensier ? 'nref26' : 'nref28',
      ctx.altitude.value,
      ctx.zoneClimatique.value,
      mois
    );
    if (nref === 0) return 0;

    const eFr = this.#tvStore.getData(
      depensier ? 'e_fr_26' : 'e_fr_28',
      ctx.altitude.value,
      ctx.zoneClimatique.value,
      mois
    );

    // Température extérieure moyenne sur le mois j pendant les périodes de climatisation (°C)
    const tempExtMoyClim = this.#tvStore.getData(
      depensier ? 'textmoy_clim_26' : 'textmoy_clim_28',
      ctx.altitude.value,
      ctx.zoneClimatique.value,
      mois
    );

    // Température de consigne en froid (°C)
    const temperatureInterieure = depensier ? 26 : 28;

    const aijFr = this.#apportGratuitService.apportInterneMois(ctx, nref);
    const asjFr = this.#apportGratuitService.apportSolaireMois(ctx, logement.enveloppe, mois, eFr);

    // Transfert thermique à travers l’enveloppe et le renouvellement d’air (W/K). Le GV prend en compte les
    // échanges de chaleur par le renouvellement d‘air. Ces échanges sont calculés sur la période de refroidissement
    // de la même façon que pour la période de chauffage
    const GV = logement.sortie?.deperdition?.deperdition_enveloppe;

    // Ratio de bilan thermique
    const Rbth = (aijFr + asjFr) / (GV * (tempExtMoyClim - temperatureInterieure) * nref);

    if (Rbth < 1 / 2) return 0;

    // Constante de temps de la zone pour le refroidissement
    const t = (this.#cin(ctx.inertie.id) * ctx.surfaceHabitable) / (3600 * GV);
    const a = 1 + t / 15;

    // Facteur d'utilisation des apports sur le mois
    let fut = Rbth === 1 ? a / (a + 1) : (1 - Rbth ** -a) / (1 - Rbth ** (-a - 1));
    return (
      (aijFr + asjFr) / 1000 - ((fut * GV) / 1000) * (temperatureInterieure - tempExtMoyClim) * nref
    );
  }

  /**
   * Capacité thermique intérieure efficace de la zone (J/K)
   * @param inertie
   * @returns {number}
   */
  #cin(inertie) {
    switch (inertie) {
      case 1:
      case 2:
        return 260000;
      case 3:
        return 165000;
      case 4:
        return 110000;
    }
  }
}
