import { mois_liste } from '../../../../../utils.js';
import { inject } from 'dioma';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';

/**
 * Calcul du besoin en chauffage
 * Chapitre 2 - Expression du besoin de chauffage
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 7
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class BesoinChService {
  /**
   * @type {FrTvStore}
   */
  #tvStore;

  /**
   * @param tvStore {FrTvStore}
   */
  constructor(tvStore = inject(FrTvStore)) {
    this.#tvStore = tvStore;
  }

  /**
   * Besoin de chauffage hors pertes récupérées
   * 9.1.1 - Consommation de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {{besoin_ch_hp: number, besoin_ch_depensier_hp: number, fraction_apport_gratuit_ch: number, fraction_apport_gratuit_depensier_ch: number}}
   */
  execute(ctx, logement) {
    const besoinCh = mois_liste.reduce(
      (acc, mois) => {
        const dh19 = this.#tvStore.getData(
          'dh19',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois,
          ctx.inertie.ilpa
        );
        const dh21 = this.#tvStore.getData(
          'dh21',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois,
          ctx.inertie.ilpa
        );

        const besoinCh = this.besoinChHorsPertesRecuperees(ctx, logement, mois, dh19);
        acc.besoin_ch_hp += besoinCh.besoinChMoisHP;
        acc.fraction_apport_gratuit_ch += besoinCh.fractionApportGratuitMois;
        logement.donnees_de_calcul.besoinChauffageHP[mois] = besoinCh.besoinChMoisHP;

        const besoinChDepensier = this.besoinChHorsPertesRecuperees(ctx, logement, mois, dh21);
        acc.besoin_ch_depensier_hp += besoinChDepensier.besoinChMoisHP;
        acc.fraction_apport_gratuit_depensier_ch += besoinChDepensier.fractionApportGratuitMois;
        logement.donnees_de_calcul.besoinChauffageDepensierHP[mois] =
          besoinChDepensier.besoinChMoisHP;

        acc.dh19 += dh19;
        acc.dh21 += dh21;
        return acc;
      },
      {
        besoin_ch_hp: 0,
        besoin_ch_depensier_hp: 0,
        fraction_apport_gratuit_ch: 0,
        fraction_apport_gratuit_depensier_ch: 0,
        dh19: 0,
        dh21: 0
      }
    );

    besoinCh.fraction_apport_gratuit_ch /= besoinCh.dh19;
    besoinCh.fraction_apport_gratuit_depensier_ch /= besoinCh.dh21;

    delete besoinCh.dh19;
    delete besoinCh.dh19;

    return besoinCh;
  }

  /**
   * Fraction des besoins de chauffage couverts par les apports gratuits pour un mois donné
   * 6.1 Calcul de F
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param mois {string}
   * @param dh {number} - degrés-heures de chauffage sur le mois j (°Ch)
   * @returns {number}
   */
  fractionBesoinCh(ctx, logement, mois, dh) {
    // Apports internes dans le logement sur le mois
    const Ai = logement.donnees_de_calcul.apportsInterneCh[mois];
    // Apports solaires dans le logement sur le mois durant la période de chauffe
    const As = logement.donnees_de_calcul.apportsSolaire[mois];

    if (dh === 0) return 0;

    let pow;
    switch (ctx.inertie.id) {
      // Inertie très lourde ou lourde
      case 1:
      case 2:
        pow = 3.6;
        break;
      // Inertie moyenne
      case 3:
        pow = 2.9;
        break;
      // Inertie légère
      case 4:
        pow = 2.5;
        break;
    }

    const Xj = (As + Ai) / (logement.sortie.deperdition.deperdition_enveloppe * dh);
    return (Xj - Xj ** pow) / (1 - Xj ** pow);
  }

  /**
   * Besoin de chauffage hors pertes récupérées sur le mois (kWh) :
   * 9.1.1 - Consommation de chauffage
   *
   * Fraction des besoins de chauffage couverts par les apports gratuits sur le mois
   * 6.1 - Calcul de F
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param mois {string}
   * @param dh {number} - degrés-heures de chauffage sur le mois j (°Ch)
   * @returns {{besoinChMoisHP: number, fractionApportGratuitMois: number}}
   */
  besoinChHorsPertesRecuperees(ctx, logement, mois, dh) {
    // Fraction des besoins de chauffage couverts par les apports gratuits pour un mois donné
    const F = this.fractionBesoinCh(ctx, logement, mois, dh);

    // Besoin de chauffage d’un logement par kelvin sur le mois j (W/K)
    const BV = logement.sortie.deperdition.deperdition_enveloppe * (1 - F);

    return {
      besoinChMoisHP: (BV * dh) / 1000,
      fractionApportGratuitMois: F * dh
    };
  }
}
