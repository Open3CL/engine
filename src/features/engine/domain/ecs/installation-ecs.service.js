import { GenerateurEcsService } from './generateur-ecs.service.js';
import { EcsTvStore } from '../../../../dpe/infrastructure/ecs/ecsTv.store.js';
import { mois_liste, Njj } from '../../../../../utils.js';
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
 *  — conso_auxiliaire_distribution_ecs: consommation des auxiliaires de distribution d'ECS (kWh)
 *
 * @see Méthode de calcul 3CL-DPE 2021 (octobre 2021) chapitre 15.2.3
 */
export class InstallationEcsService {
  /**
   * @type {GenerateurEcsService}
   */
  #generateurEcsService;

  /**
   * @type {EcsTvStore}
   */
  #tvStore;

  /**
   * @param generateurEcsService {GenerateurEcsService}
   * @param tvStore {EcsTvStore}
   */
  constructor(generateurEcsService = inject(GenerateurEcsService), tvStore = inject(EcsTvStore)) {
    this.#generateurEcsService = generateurEcsService;
    this.#tvStore = tvStore;
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

      /**
       * 15.2.3 Consommation des auxiliaires de distribution d'ECS
       */
      this.consoAuxiliaireDistributionEcs(ctx, installationEcs);
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

  /**
   * 15.2.3 Consommation des auxiliaires de distribution d'ECS
   *
   * SI installation individuelle : conso = 0
   * SI installation collective :
   *   CAS 1 - enum_bouclage_reseau_ecs_id = 1 (non bouclé) : conso = 0
   *   CAS 2 - enum_bouclage_reseau_ecs_id = 2 (bouclé) : calcul selon étapes 1-9
   *   CAS 3 - enum_bouclage_reseau_ecs_id = 3 (traçage) : conso = 0.14 * BECS_annuel * Sh_install / Sh_logement
   *
   * @param ctx {Contexte}
   * @param installationEcs {InstallationEcs}
   */
  consoAuxiliaireDistributionEcs(ctx, installationEcs) {
    const installationEcsDE = installationEcs.donnee_entree;
    const installationEcsDI = installationEcs.donnee_intermediaire;

    const typeInstallation = parseInt(installationEcsDE.enum_type_installation_id);

    if (typeInstallation === 1) {
      installationEcsDI.conso_auxiliaire_distribution_ecs = 0;
      return;
    }

    const enumBouclage = parseInt(installationEcsDE.enum_bouclage_reseau_ecs_id);

    if (enumBouclage === 1) {
      installationEcsDI.conso_auxiliaire_distribution_ecs = 0;
      return;
    }

    const Sh_logement = ctx.surfaceHabitable;
    const Sh_immeuble = ctx.surfaceHabitableImmeuble || Sh_logement;
    const Sh_install = installationEcsDE.surface_habitable || Sh_logement;

    if (enumBouclage === 3) {
      const BECS_annuel = installationEcsDI.besoin_ecs;
      installationEcsDI.conso_auxiliaire_distribution_ecs =
        (0.14 * BECS_annuel * Sh_install) / Sh_logement;
      return;
    }

    // CAS 2 - enum_bouclage_reseau_ecs_id = 2 (réseau bouclé)
    const Niv_inst_ecs = installationEcsDE.nombre_niveau_installation_ecs || 1;
    const nadeq = ctx.nadeq;
    const ca = ctx.altitude.value;
    const zc = ctx.zoneClimatique.value;

    // Etape 3: Lb - longueur par défaut du bouclage ECS (m)
    const Sh = (Sh_install / Sh_logement) * Sh_immeuble;
    const Lb = 4 * Math.pow(Sh / Niv_inst_ecs, 0.5) + 6 * (Niv_inst_ecs - 0.5);

    // Etape 4: DeltaPb (kPa) - perte de charge dans le bouclage
    const DeltaPb = 0.2 * Lb + 10;

    let conso = 0;

    for (const mois of mois_liste) {
      const tefsj = this.#tvStore.getTefs(ca, zc, mois);
      const njj = Njj[mois];
      const BECS_j = (1.163 * nadeq * 56 * (40 - tefsj) * njj) / 1000;

      // Etape 1: Qdwj (Wh) - pertes de distribution à l'échelle de l'immeuble
      const Qdwj = (0.24 * BECS_j * 1000 * Sh_install * Sh_immeuble) / (Sh_logement * Sh_logement);

      // Etape 2: qdwj (m³/h) - débit de distribution ECS
      const Nh_puisage_j = njj * 5;
      const qdwj = Qdwj / (5.85 * Nh_puisage_j) / 1000;

      // Etape 5: Phyd,j (W) - puissance hydraulique du bouclage
      const Phyd_j = (qdwj * DeltaPb) / 3.6;

      // Etape 6: Effcirb,j - efficacité du circulateur
      const Effcirb_j = 0.324 / Math.pow(Phyd_j, 1 / 15.3);

      // Etape 7: Pcirb,j (W) - puissance électrique du circulateur
      const Pcirb_j = Math.max(20, Phyd_j / Effcirb_j);

      // Etape 8: Qcirb,j (Wh) - consommation mensuelle du circulateur
      const Nh_mois_j = njj * 24;
      const Qcirb_j = Nh_puisage_j * Pcirb_j + (Nh_mois_j - Nh_puisage_j) * 20;

      conso += Qcirb_j;
    }

    // Etape 9: conso annuelle ramenée à l'appartement (kWh)
    installationEcsDI.conso_auxiliaire_distribution_ecs =
      (conso * Sh_logement) / Sh_immeuble / 1000;
  }
}
