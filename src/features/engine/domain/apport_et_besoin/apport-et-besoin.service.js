import { inject } from 'dioma';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';

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
   * @param besoinEcsService {BesoinEcsService}
   * @param surfaceSudEquivalenteService {SurfaceSudEquivalenteService}
   */
  constructor(
    besoinEcsService = inject(BesoinEcsService),
    surfaceSudEquivalenteService = inject(SurfaceSudEquivalenteService)
  ) {
    this.#besoinEcsService = besoinEcsService;
    this.#surfaceSudEquivalenteService = surfaceSudEquivalenteService;
  }

  /**
   * Détermination des apports et besoins pour le bien concerné
   *
   * @param ctx {Contexte}
   * @param enveloppe {Enveloppe}
   * @return {ApportEtBesoin}
   */
  execute(ctx, enveloppe) {
    return {
      ...this.#besoinEcsService.execute(ctx),
      ...{
        surface_sud_equivalente: this.#surfaceSudEquivalenteService.execute(ctx, enveloppe)
      }
    };
  }
}
