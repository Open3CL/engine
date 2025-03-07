import { mois_liste } from '../../../../../utils.js';
import { inject } from 'dioma';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';

/**
 * Calcul des pertes récupérées de distribution et de stockage d'ECS
 * Chapitre 9.1.1 Consommation de chauffage
 *
 * Données calculées
 *  — pertes_distribution_ecs_recup : pertes de distribution d'ECS récupérées(kWh)
 *  — pertes_distribution_ecs_recup_depensier : pertes de distribution d'ECS récupérées(kWh) pour le scénario dépensier
 *  — pertes_stockage_ecs_recup : pertes de stockage d'ECS récupérées(kWh)
 *
 * Methode_de_calcul_3CL_DPE_2021 - Page 57
 * Octobre 2021
 * @see consolide_anne…arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf
 */
export class PerteEcsRecupService {
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
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {{pertes_distribution_ecs_recup: number, pertes_distribution_ecs_recup_depensier: number, pertes_stockage_ecs_recup: number}}
   */
  execute(ctx, logement) {
    return {
      pertes_distribution_ecs_recup: this.pertesDistributionEcsRecup(ctx, logement, false),
      pertes_distribution_ecs_recup_depensier: this.pertesDistributionEcsRecup(ctx, logement, true),
      pertes_stockage_ecs_recup: this.pertesStockageEcsRecup(ctx, logement)
    };
  }

  /**
   * Pertes récupérées de distribution d’ECS pour le chauffage
   * 9.1.1 Consommation de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param depensier {boolean}
   * @returns {number}
   */
  pertesDistributionEcsRecup(ctx, logement, depensier) {
    const installationsEcs = logement.installation_ecs_collection?.installation_ecs || [];

    const pertesDistribution = installationsEcs.reduce((acc, installation) => {
      /** @type {InstallationEcsDU}*/
      const installationEcsDU = installation.donnee_utilisateur;

      const pertesDistributionIndividuelleVolumeChauffee = depensier
        ? installationEcsDU.QdwIndVc.depensier
        : installationEcsDU.QdwIndVc.conventionnel;
      const pertesDistributionCollectiveVolumeChauffee = depensier
        ? installationEcsDU.QdwColVc.depensier
        : installationEcsDU.QdwColVc.conventionnel;

      return (
        acc +
        pertesDistributionIndividuelleVolumeChauffee +
        pertesDistributionCollectiveVolumeChauffee
      );
    }, 0);

    return mois_liste.reduce((acc, mois) => {
      return (
        acc +
        (0.48 *
          pertesDistribution *
          this.#tvStore.getData(
            depensier ? 'nref21' : 'nref19',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          )) /
          8760
      );
    }, 0);
  }

  /**
   * Pertes récupérées du stockage d’ECS pour le chauffage
   * 9.1.1 Consommation de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @returns {number}
   */
  pertesStockageEcsRecup(ctx, logement) {
    const installationsEcs = logement.installation_ecs_collection?.installation_ecs || [];

    let pertesStockage = installationsEcs.reduce((acc, installation) => {
      /** @type {InstallationEcsDU}*/
      const installationEcsDU = installation.donnee_utilisateur;

      return acc + (0.48 * installationEcsDU.QgwRecuperable) / 8760.0;
    }, 0);

    return mois_liste.reduce((acc, mois) => {
      return (
        acc +
        pertesStockage *
          this.#tvStore.getData(
            'nref19',
            ctx.altitude.value,
            ctx.zoneClimatique.value,
            mois,
            ctx.inertie.ilpa
          )
      );
    }, 0);
  }
}
