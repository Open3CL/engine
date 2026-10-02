import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { inject } from 'dioma';
import { bug_for_bug_compat } from '../../../../utils.js';
import { logger } from '../../../../core/util/logger/log-service.js';

/**
 * Périodes d'installation des émetteurs (enum_periode_installation_emetteur_id), de la plus
 * ancienne à la plus récente.
 */
export const PERIODES_INSTALLATION_EMETTEUR = [1, 2, 3];

/**
 * Tolérance (°C) pour considérer qu'une température de fonctionnement issue des tables reproduit
 * celle stockée dans le DPE.
 */
export const TOLERANCE_TEMP_FONC = 0.01;

function estNumerique(valeur) {
  return (
    valeur !== null && valeur !== undefined && valeur !== '' && Number.isFinite(Number(valeur))
  );
}

/**
 * Calcul des données des émetteurs de chauffage
 * Données calculées
 *   — temperature de distribution
 *   — période d'installation des émetteurs
 */
export class EmetteurChService {
  /**
   * @type {ChTvStore}
   */
  #chTvStore;

  /**
   * @param chTvStore {ChTvStore}
   */
  constructor(chTvStore = inject(ChTvStore)) {
    this.#chTvStore = chTvStore;
  }

  /**
   * Détermination de l'année d'installation d'un émetteur
   *
   * 13.2.1.5 Chaudières basse température et condensation
   * Si l’année d’installation des émetteurs est inconnue, prendre l’année de construction du bâtiment.
   *
   * @param ctx {Contexte}
   * @param emetteurChauffage {EmetteurChauffage}
   * @param periodeParDefaut {number|undefined} période à retenir si elle n'est pas saisie (déduite
   * des données intermédiaires du DPE en mode bug_for_bug_compat, cf. issue #220)
   */
  periodeInstallationEmetteur(ctx, emetteurChauffage, periodeParDefaut = undefined) {
    const periodeInstallationEmetteur = parseInt(
      emetteurChauffage.donnee_entree.enum_periode_installation_emetteur_id
    );

    if (!periodeInstallationEmetteur) {
      if (periodeParDefaut) {
        return periodeParDefaut;
      }
      return ctx.anneeConstruction < 1981 ? 1 : ctx.anneeConstruction < 2000 ? 2 : 3;
    }

    return periodeInstallationEmetteur;
  }

  /**
   * Émetteurs pris en compte pour les températures de fonctionnement : ceux disposant d'un réseau
   * de distribution (enum_temp_distribution_ch_id ≠ 1).
   *
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @return {EmetteurChauffage[]}
   */
  #emetteursAvecDistribution(emetteursChauffage) {
    return emetteursChauffage.filter(
      (emetteurChauffage) =>
        parseInt(emetteurChauffage.donnee_entree.enum_temp_distribution_ch_id) !== 1
    );
  }

  /**
   * Mode bug_for_bug_compat uniquement (issue #220).
   *
   * Certains logiciels calculent les températures de fonctionnement avec une période
   * d'installation des émetteurs qu'ils n'exportent pas, mais stockent temp_fonc_30 /
   * temp_fonc_100 dans les données intermédiaires du générateur. Chaque période candidate est
   * affectée à tous les émetteurs sans période saisie ; seules celles qui reproduisent les DEUX
   * valeurs du DPE (tolérance 0,01 °C) sont retenues :
   * - une seule candidate : retenue ;
   * - plusieurs : celle de l'année de construction si elle en fait partie, sinon la plus récente ;
   * - aucune : undefined (repli sur l'année de construction).
   *
   * Aucune déduction si le mode bug_for_bug_compat est désactivé, si l'une des deux températures
   * du DPE est absente ou non numérique, ou si tous les émetteurs ont une période saisie.
   *
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
   *
   * @param ctx {Contexte}
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @param temperaturesDpe {{temp_fonc_30: number, temp_fonc_100: number}|undefined} valeurs
   * d'origine des données intermédiaires du générateur dans le DPE
   * @return {number|undefined} période déduite (enum_periode_installation_emetteur_id)
   */
  periodeInstallationEmetteurDeduite(
    ctx,
    generateurChauffageDE,
    emetteursChauffage,
    temperaturesDpe
  ) {
    if (
      !bug_for_bug_compat ||
      !estNumerique(temperaturesDpe?.temp_fonc_30) ||
      !estNumerique(temperaturesDpe?.temp_fonc_100)
    ) {
      return undefined;
    }

    const emetteursSansPeriode = this.#emetteursAvecDistribution(emetteursChauffage).filter(
      (emetteurChauffage) =>
        !parseInt(emetteurChauffage.donnee_entree.enum_periode_installation_emetteur_id)
    );
    if (emetteursSansPeriode.length === 0) {
      return undefined;
    }

    const tempFonc30Dpe = Number(temperaturesDpe.temp_fonc_30);
    const tempFonc100Dpe = Number(temperaturesDpe.temp_fonc_100);

    const candidates = PERIODES_INSTALLATION_EMETTEUR.filter((periode) => {
      const { temp_fonc_30, temp_fonc_100 } = this.temperatureFonctionnement(
        ctx,
        generateurChauffageDE,
        emetteursChauffage,
        periode
      );
      return (
        estNumerique(temp_fonc_30) &&
        estNumerique(temp_fonc_100) &&
        Math.abs(temp_fonc_30 - tempFonc30Dpe) <= TOLERANCE_TEMP_FONC &&
        Math.abs(temp_fonc_100 - tempFonc100Dpe) <= TOLERANCE_TEMP_FONC
      );
    });

    if (candidates.length === 0) {
      logger.warn(
        `période d'installation des émetteurs non déductible : valeurs hors tables / donnée d'entrée incohérente (temp_fonc_30 = ${tempFonc30Dpe}, temp_fonc_100 = ${tempFonc100Dpe}). Repli sur l'année de construction.`
      );
      return undefined;
    }

    const periodeConstruction = this.periodeInstallationEmetteur(ctx, { donnee_entree: {} });
    const periode = candidates.includes(periodeConstruction)
      ? periodeConstruction
      : candidates[candidates.length - 1];

    logger.info(
      `période d'installation des émetteurs déduite des données intermédiaires du DPE : ${periode} (temp_fonc_30 = ${tempFonc30Dpe}, temp_fonc_100 = ${tempFonc100Dpe})`
    );
    return periode;
  }

  /**
   * Calcul des températures de fonctionnement à 30% ou 100%
   *
   * @param ctx {Contexte}
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @param periodeParDefaut {number|undefined} période affectée aux émetteurs sans période saisie
   * (à défaut : année de construction)
   * @return {{temp_fonc_30: number, temp_fonc_100: number}}
   */
  temperatureFonctionnement(
    ctx,
    generateurChauffageDE,
    emetteursChauffage,
    periodeParDefaut = undefined
  ) {
    let temperatureFonctionnement30;
    let temperatureFonctionnement100;

    this.#emetteursAvecDistribution(emetteursChauffage).forEach((emetteurChauffage) => {
      // Récupération de la température de distribution
      const temperatureDistribution = Number(
        emetteurChauffage.donnee_entree.enum_temp_distribution_ch_id
      );

      // Récupération de la période d'installation de distribution
      const periodeInstallationEmetteur = this.periodeInstallationEmetteur(
        ctx,
        emetteurChauffage,
        periodeParDefaut
      );

      const tempFonctionnement30 = this.#chTvStore.temperatureFonctionnement(
        '30',
        generateurChauffageDE.enum_type_generateur_ch_id,
        temperatureDistribution,
        periodeInstallationEmetteur
      );

      const tempFonctionnement100 = this.#chTvStore.temperatureFonctionnement(
        '100',
        generateurChauffageDE.enum_type_generateur_ch_id,
        temperatureDistribution,
        periodeInstallationEmetteur
      );

      if (!temperatureFonctionnement30 || tempFonctionnement30 > temperatureFonctionnement30) {
        temperatureFonctionnement30 = tempFonctionnement30;
      }
      if (!temperatureFonctionnement100 || tempFonctionnement100 > temperatureFonctionnement100) {
        temperatureFonctionnement100 = tempFonctionnement100;
      }
    });

    return {
      temp_fonc_30: temperatureFonctionnement30,
      temp_fonc_100: temperatureFonctionnement100
    };
  }
}
