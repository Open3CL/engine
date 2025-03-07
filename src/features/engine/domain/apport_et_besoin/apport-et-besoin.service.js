import { inject } from 'dioma';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BesoinFroidService } from './froid/besoin-froid.service.js';
import { ApportGratuitService } from './apport_gratuit/apport-gratuit.service.js';
import { InstallationEcsService } from '../ecs/installation-ecs.service.js';
import { PerteEcsRecupService } from './ecs/perte-ecs-recup.service.js';

/**
 * Calcul des déperditions de l’enveloppe GV
 * @see Méthode de calcul 3CL-DPE 2021 (cotobre 2021) chapitre 3
 */
export class ApportEtBesoinService {
  /**
   * @type {SurfaceSudEquivalenteService}
   */
  #surfaceSudEquivalenteService;

  /**
   * @type {BesoinEcsService}
   */
  #besoinEcsService;

  /**
   * @type {InstallationEcsService}
   */
  #installationEcsService;

  /**
   * @type {PerteEcsRecupService}
   */
  #perteEcsRecupService;

  /**
   * @type {BesoinFroidService}
   */
  #besoinFroidService;

  /**
   * @type {ApportGratuitService}
   */
  #apportGratuitService;

  /**
   * @param besoinEcsService {BesoinEcsService}
   * @param installationEcsService {InstallationEcsService}
   * @param perteEcsRecupService {PerteEcsRecupService}
   * @param besoinFroidService {BesoinFroidService}
   * @param surfaceSudEquivalenteService {SurfaceSudEquivalenteService}
   * @param apportGratuitService {ApportGratuitService}
   */
  constructor(
    besoinEcsService = inject(BesoinEcsService),
    installationEcsService = inject(InstallationEcsService),
    perteEcsRecupService = inject(PerteEcsRecupService),
    besoinFroidService = inject(BesoinFroidService),
    surfaceSudEquivalenteService = inject(SurfaceSudEquivalenteService),
    apportGratuitService = inject(ApportGratuitService)
  ) {
    this.#besoinEcsService = besoinEcsService;
    this.#installationEcsService = installationEcsService;
    this.#perteEcsRecupService = perteEcsRecupService;
    this.#besoinFroidService = besoinFroidService;
    this.#surfaceSudEquivalenteService = surfaceSudEquivalenteService;
    this.#apportGratuitService = apportGratuitService;
  }

  /**
   * Détermination des apports et besoins pour le bien concerné
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   * @return {ApportEtBesoin}
   */
  execute(ctx, logement) {
    const besoinEcs = this.#besoinEcsService.execute(ctx);

    /**
     * Détermination des besoins et pertes des installations ECS
     */
    this.#installationEcsService.execute(ctx, logement, besoinEcs);

    return {
      ...besoinEcs,
      ...{
        surface_sud_equivalente: this.#surfaceSudEquivalenteService.execute(
          ctx,
          logement.enveloppe
        ),
        nadeq: ctx.nadeq,
        v40_ecs_journalier: ctx.nadeq * 56,
        v40_ecs_journalier_depensier: ctx.nadeq * 79
      },
      ...this.#besoinFroidService.execute(ctx, logement),
      ...this.#apportGratuitService.apportInterne(ctx, logement),
      ...this.#apportGratuitService.apportSolaire(ctx, logement),
      ...this.#perteEcsRecupService.execute(ctx, logement)
    };
  }
}
