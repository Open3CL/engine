import { inject } from 'dioma';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BesoinFroidService } from './froid/besoin-froid.service.js';
import { ApportGratuitService } from './apport_gratuit/apport-gratuit.service.js';
import { InstallationEcsService } from '../ecs/installation-ecs.service.js';
import { PerteEcsRecupService } from './ecs/perte-ecs-recup.service.js';
import { BesoinChService } from './ch/besoin-ch.service.js';
import { PerteChRecupService } from './ch/perte-ch-recup.service.js';
import { InstallationChService } from '../ch/installation-ch.service.js';

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
   * @type {BesoinChService}
   */
  #besoinChService;

  /**
   * @type {InstallationEcsService}
   */
  #installationEcsService;

  /**
   * @type {InstallationChService}
   */
  #installationChService;

  /**
   * @type {PerteEcsRecupService}
   */
  #perteEcsRecupService;

  /**
   * @type {BesoinFroidService}
   */
  #besoinFroidService;

  /**
   * @type {PerteChRecupService}
   */
  #perteChRecupService;

  /**
   * @type {ApportGratuitService}
   */
  #apportGratuitService;

  /**
   * @param besoinEcsService {BesoinEcsService}
   * @param besoinChService {BesoinChService}
   * @param installationEcsService {InstallationEcsService}
   * @param installationChService {InstallationChService}
   * @param perteEcsRecupService {PerteEcsRecupService}
   * @param besoinFroidService {BesoinFroidService}
   * @param surfaceSudEquivalenteService {SurfaceSudEquivalenteService}
   * @param perteChRecupService {PerteChRecupService}
   * @param apportGratuitService {ApportGratuitService}
   */
  constructor(
    besoinEcsService = inject(BesoinEcsService),
    besoinChService = inject(BesoinChService),
    installationEcsService = inject(InstallationEcsService),
    installationChService = inject(InstallationChService),
    perteEcsRecupService = inject(PerteEcsRecupService),
    besoinFroidService = inject(BesoinFroidService),
    surfaceSudEquivalenteService = inject(SurfaceSudEquivalenteService),
    perteChRecupService = inject(PerteChRecupService),
    apportGratuitService = inject(ApportGratuitService)
  ) {
    this.#besoinEcsService = besoinEcsService;
    this.#besoinChService = besoinChService;
    this.#installationEcsService = installationEcsService;
    this.#installationChService = installationChService;
    this.#perteEcsRecupService = perteEcsRecupService;
    this.#besoinFroidService = besoinFroidService;
    this.#surfaceSudEquivalenteService = surfaceSudEquivalenteService;
    this.#perteChRecupService = perteChRecupService;
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

    /**
     * Détermination des données des installations de chauffage
     */
    this.#installationChService.execute(ctx, logement);

    const apportsInternes = this.#apportGratuitService.apportInterne(ctx, logement);
    const apportsSolaires = this.#apportGratuitService.apportSolaire(ctx, logement);

    const pertesEcsRecup = this.#perteEcsRecupService.execute(ctx, logement);
    // Besoin de chauffage hors pertes récupérées
    const besoinChHP = this.#besoinChService.execute(ctx, logement);
    const pertesChauffageRecup = this.#perteChRecupService.execute(ctx, logement);

    const besoinCh = {
      besoin_ch: besoinChHP.besoin_ch_hp,
      besoin_ch_depensier: besoinChHP.besoin_ch_depensier_hp
    };
    besoinCh.besoin_ch -= pertesEcsRecup.pertes_distribution_ecs_recup;
    besoinCh.besoin_ch -= pertesEcsRecup.pertes_stockage_ecs_recup;
    besoinCh.besoin_ch -= pertesChauffageRecup.pertes_generateur_ch_recup;

    besoinCh.besoin_ch_depensier -= pertesEcsRecup.pertes_distribution_ecs_recup_depensier;
    besoinCh.besoin_ch_depensier -= pertesEcsRecup.pertes_stockage_ecs_recup_depensier;
    besoinCh.besoin_ch_depensier -= pertesChauffageRecup.pertes_generateur_ch_recup_depensier;

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
      ...apportsInternes,
      ...apportsSolaires,
      ...pertesEcsRecup,
      ...pertesChauffageRecup,
      ...besoinCh
    };
  }
}
