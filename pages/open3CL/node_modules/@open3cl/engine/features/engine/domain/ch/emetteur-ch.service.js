import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { inject } from 'dioma';

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
   */
  periodeInstallationEmetteur(ctx, emetteurChauffage) {
    const periodeInstallationEmetteur = parseInt(
      emetteurChauffage.donnee_entree.enum_periode_installation_emetteur_id
    );

    if (!periodeInstallationEmetteur) {
      return ctx.anneeConstruction < 1981 ? 1 : ctx.anneeConstruction < 2000 ? 2 : 3;
    }

    return periodeInstallationEmetteur;
  }

  /**
   * Calcul des températures de fonctionnement à 30% ou 100%
   *
   * @param ctx {Contexte}
   * @param generateurChauffageDE {GenerateurChauffageDE}
   * @param emetteursChauffage {EmetteurChauffage[]}
   * @return {{temp_fonc_30: number, temp_fonc_100: number}}
   */
  temperatureFonctionnement(ctx, generateurChauffageDE, emetteursChauffage) {
    let temperatureFonctionnement30;
    let temperatureFonctionnement100;

    emetteursChauffage
      .filter(
        (emetteurChauffage) =>
          parseInt(emetteurChauffage.donnee_entree.enum_temp_distribution_ch_id) !== 1
      )
      .forEach((emetteurChauffage) => {
        // Récupération de la température de distribution
        const temperatureDistribution = Number(
          emetteurChauffage.donnee_entree.enum_temp_distribution_ch_id
        );

        // Récupération de la période d'installation de distribution
        const periodeInstallationEmetteur = this.periodeInstallationEmetteur(
          ctx,
          emetteurChauffage
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
