import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../contexte.builder.js';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/enveloppe/baieVitreeTv.store.js';
import { ApportEtBesoinService } from './apport-et-besoin.service.js';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';

/** @type {SurfaceSudEquivalenteService} **/
let surfaceSudEquivalenteService;

/** @type {BesoinEcsService} **/
let besoinEcsService;

/** @type {ApportEtBesoinService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {BaieVitreeTvStore} **/
let tvStore;

describe('Calcul de déperdition des portes', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    surfaceSudEquivalenteService = new SurfaceSudEquivalenteService(tvStore);
    besoinEcsService = new BesoinEcsService();
    service = new ApportEtBesoinService(besoinEcsService, surfaceSudEquivalenteService);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test('Determination des apports et besoin du logement', () => {
    vi.spyOn(surfaceSudEquivalenteService, 'execute').mockReturnValue(18.5);
    vi.spyOn(besoinEcsService, 'execute').mockReturnValue({
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3
    });

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };
    /** @type { Enveloppe } **/
    const enveloppe = {
      porte_collection: {}
    };
    expect(service.execute(ctx, enveloppe)).toStrictEqual({
      surface_sud_equivalente: 18.5,
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3
    });
    expect(surfaceSudEquivalenteService.execute).toHaveBeenCalledWith(ctx, enveloppe);
    expect(besoinEcsService.execute).toHaveBeenCalledWith(ctx);
  });
});
