import { inject } from 'dioma';
import { GenerateurChService } from './generateur-ch.service.js';

/**
 * Calcul des installations de chauffage
 *
 * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3
 */
export class InstallationChService {
  /**
   * @type {GenerateurChService}
   */
  #generateurChService;

  /**
   * @param generateurChService {GenerateurChService}
   */
  constructor(generateurChService = inject(GenerateurChService)) {
    this.#generateurChService = generateurChService;
  }

  /**
   * Détermination des données des installations de chauffage
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   */
  execute(ctx, logement) {
    const installationsChauffage =
      logement.installation_chauffage_collection?.installation_chauffage || [];

    installationsChauffage.forEach((installationChauffage) => {
      /**
       * Calcul des données nécessaires au calcul pour chaque générateur (qp0)
       */
      this.#generateurChService.execute(ctx, logement, installationChauffage);
    });
  }
}
