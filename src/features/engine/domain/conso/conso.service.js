/** @import { Logement } from '../../../dpe/domain/models/dpe.model.js' */
/** @import { Contexte } from '../models/contexte.model.js' */
import { inject } from 'dioma';
import { ConsoFroidService } from './froid/conso-froid.service.js';

export class ConsoService {
  /**
   * @type {ConsoFroidService}
   */
  #consoFroidService;

  /**
   * @param consoFroidService {ConsoFroidService}
   */
  constructor(consoFroidService = inject(ConsoFroidService)) {
    this.#consoFroidService = consoFroidService;
  }

  /**
   * Calcul des consommations
   *
   * @param ctx {Contexte}
   * @param logement {Logement}
   */
  execute(ctx, logement) {
    this.#consoFroidService.execute(ctx, logement);
  }
}
