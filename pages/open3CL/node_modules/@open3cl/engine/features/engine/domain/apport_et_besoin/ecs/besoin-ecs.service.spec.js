import corpus from '../../../../../../test/corpus-sano.json';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { BesoinEcsService } from './besoin-ecs.service.js';
import { EcsTvStore } from '../../../../dpe/infrastructure/ecs/ecsTv.store.js';

/** @type {BesoinEcsService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {EcsTvStore} **/
let tvStore;

describe('Calcul du besoin en eau chaude sanitaire', () => {
  beforeEach(() => {
    tvStore = new EcsTvStore();
    service = new BesoinEcsService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test('Determination du besoin en eau chaude sanitaire pour un mois donné', () => {
    vi.spyOn(tvStore, 'getTefs').mockReturnValue(0.5);

    /** @type {Contexte} */
    const ctx = {
      altitude: {
        value: '400-800m'
      },
      zoneClimatique: {
        value: 'h1a'
      },
      nadeq: 2
    };

    expect(service.besoinEcsMois(ctx, 'Janvier', false)).toBeCloseTo(159.5, 2);
    expect(service.besoinEcsMois(ctx, 'Janvier', true)).toBeCloseTo(225.01, 2);
    expect(tvStore.getTefs).toHaveBeenCalledWith('400-800m', 'h1a', 'Janvier');
  });

  describe("Test d'intégration pour le besoin en eau chaude sanitaire", () => {
    test.each(corpus)('vérification des sorties besoin_ecs pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const ecs = service.execute(ctx);
      expect(ecs.besoin_ecs).toBeCloseTo(dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs, 2);
      expect(ecs.besoin_ecs_depensier).toBeCloseTo(
        dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs_depensier,
        2
      );
    });
  });
});
