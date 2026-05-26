import { GenerateurEcsService } from './generateur-ecs.service.js';
import { inject } from 'dioma';

/**
 * Calcul des besoins et pertes des installations ECS
 * Données calculées
 *  — besoin_ecs : besoin en eau chaude sanitaire en mode conventionnel proratisé pour l'installation
 *  — besoin_ecs_depensier : besoin en eau chaude sanitaire en mode dépensier proratisé pour l'installation
 *  — besoin_ecs_depensier : pertes liées au stockage de l'ECS pour chaque générateur
 *  — QdwIndVc: pertes de la distribution individuelle en volume chauffé pour le mois j (Wh)
 *  — QdwColVc: pertes de la distribution collective en volume chauffé pour le mois j (Wh)
 *  — QdwColHVc: pertes de la distribution collective hors volume chauffé pour le mois j (Wh)
 *
 * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3
 */
export class InstallationEcsService {
  /**
   * @type {GenerateurEcsService}
   */
  #generateurEcsService;

  /**
   * @param generateurEcsService {GenerateurEcsService}
   */
  constructor(generateurEcsService = inject(GenerateurEcsService)) {
    this.#generateurEcsService = generateurEcsService;
  }

  /**
   * Détermination des besoins et pertes des installations ECS
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @param besoinEcs {{besoin_ecs: number, besoin_ecs_depensier: number}}
   */
  execute(ctx, logement, besoinEcs) {
    const installationsEcs = logement.installation_ecs_collection?.installation_ecs || [];

    installationsEcs.forEach((installationEcs) => {
      /**
       * Calcul des données nécessaires au calcul pour chaque générateur (perteStockage)
       */
      this.#generateurEcsService.execute(installationEcs);

      const { besoinEcsInstallation, besoinEcsDepensierInstallation } = this.besoinEcsInstallation(
        ctx,
        installationEcs,
        besoinEcs
      );

      installationEcs.donnee_intermediaire = {
        besoin_ecs: besoinEcsInstallation,
        besoin_ecs_depensier: besoinEcsDepensierInstallation
      };

      /**
       * Calcul des pertes de stockage et génération au niveau de l'installation
       */
      this.pertesDistributionStockageEcsInstallation(
        installationEcs,
        besoinEcsInstallation * 1000,
        besoinEcsDepensierInstallation * 1000
      );
    });
  }

  /**
   * Return true si l'installation est individuelle
   * @param installationEcsDE {InstallationEcsDE}
   */
  isInstallationIndividuelle(installationEcsDE) {
    return parseInt(installationEcsDE.enum_type_installation_id) === 1;
  }

  /**
   * Return le besoin rationalisé de l'installation par rapport au besoin global du logement
   *
   * @param ctx {Contexte}
   * @param installationEcs {InstallationEcs}
   * @param besoinEcs {{besoin_ecs: number, besoin_ecs_depensier: number}} besoin ECS total du logement
   *
   * @returns {{besoinEcsInstallation: number, besoinEcsDepensierInstallation: number}}
   */
  besoinEcsInstallation(ctx, installationEcs, besoinEcs) {
    /** @type {InstallationEcsDE} */
    const installationEcsDE = installationEcs.donnee_entree;

    let besoinEcsInstallation;
    let besoinEcsDepensierInstallation;

    const ratio =
      (installationEcsDE.surface_habitable || ctx.surfaceHabitable) / ctx.surfaceHabitable;
    besoinEcsInstallation = besoinEcs.besoin_ecs * ratio;
    besoinEcsDepensierInstallation = besoinEcs.besoin_ecs_depensier * ratio;

    return { besoinEcsInstallation, besoinEcsDepensierInstallation };
  }

  /**
   * Pertes de distribution et stockage ECS au niveau de l'installation
   * 15.2.3 - Consommation des auxiliaires de distribution d’ECS
   *
   * QdwIndVc: pertes de la distribution individuelle en volume chauffé pour le mois j (Wh)
   * QdwColVc: pertes de la distribution collective en volume chauffé pour le mois j (Wh)
   * QdwColHVc: pertes de la distribution collective hors volume chauffé pour le mois j (Wh)
   *
   * 11.6.1 - Pertes de stockage des ballons d’accumulation
   * 11.6.2 - Pertes des ballons électriques
   * Qgw:  pertes brutes annuelles de stockage (Wh)
   *
   * @param installationEcs {InstallationEcs}
   * @param besoinEcsInstallation {number} // en Wh
   * @param besoinEcsDepensierInstallation {number} // en Wh
   */
  pertesDistributionStockageEcsInstallation(
    installationEcs,
    besoinEcsInstallation,
    besoinEcsDepensierInstallation
  ) {
    /** @type {InstallationEcsDE}*/
    const installationEcsDE = installationEcs.donnee_entree;
    const installationIndividuelle = this.isInstallationIndividuelle(installationEcsDE);

    installationEcs.donnee_utilisateur = {
      QdwIndVc: {
        conventionnel: 0.1 * besoinEcsInstallation,
        depensier: 0.1 * besoinEcsDepensierInstallation
      },
      QdwColVc: {
        conventionnel: installationIndividuelle ? 0 : 0.112 * besoinEcsInstallation,
        depensier: installationIndividuelle ? 0 : 0.112 * besoinEcsDepensierInstallation
      },
      QdwColHVc: {
        conventionnel: installationIndividuelle ? 0 : 0.028 * besoinEcsInstallation,
        depensier: installationIndividuelle ? 0 : 0.028 * besoinEcsDepensierInstallation
      }
    };

    // 17.2.1.1 Calcul des consommations de chauffage, de refroidissement, d’ECS et d’auxiliaires
    // Pour les installations ECS collectives, pas de récupération de stockage d'ECS
    installationEcs.donnee_utilisateur.QgwRecuperable = 0;
    if (installationIndividuelle) {
      installationEcs.donnee_utilisateur.QgwRecuperable =
        installationEcs.generateur_ecs_collection?.generateur_ecs
          .filter(
            (generateurEcs) =>
              parseInt(generateurEcs.donnee_entree.position_volume_chauffe_stockage) === 1 ||
              (generateurEcs.donnee_entree.position_volume_chauffe_stockage === undefined &&
                parseInt(generateurEcs.donnee_entree.position_volume_chauffe) === 1)
          )
          .reduce((acc, generateurEcs) => {
            return acc + generateurEcs.donnee_utilisateur.Qgw;
          }, 0);
    }
  }
}
