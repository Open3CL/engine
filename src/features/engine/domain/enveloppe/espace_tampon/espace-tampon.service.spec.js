import { ContexteBuilder } from '../../contexte.builder.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BaieVitreeTvStore } from '../../../../dpe/infrastructure/baieVitreeTv.store.js';
import { EspaceTamponService } from './espace-tampon.service.js';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';

/** @type {EspaceTamponService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {BaieVitreeTvStore} **/
let tvStore;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des baies vitrées', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    service = new EspaceTamponService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination des données intermédiaires', () => {
    test('Doit retourner bver et  directement', () => {
      vi.spyOn(tvStore, 'getBver').mockReturnValue(0.55);
      vi.spyOn(tvStore, 'getCoefTransparenceEts').mockReturnValue(0.62);

      /**
       * @type {Contexte}
       */
      const ctx = {
        zoneClimatique: { value: 'h1a' }
      };

      /**
       * @type {Ets}
       */
      const ets = {
        donnee_entree: {
          enum_cfg_isolation_lnc_id: '10',
          tv_coef_transparence_ets_id: '2'
        }
      };

      let etsDI = service.execute(ctx, ets);
      expect(tvStore.getBver).toHaveBeenCalledWith('h1a', 10);
      expect(tvStore.getCoefTransparenceEts).toHaveBeenCalledWith(2);
      expect(etsDI).toStrictEqual({ bver: 0.55, coef_transparence_ets: 0.62 });
    });
  });

  describe("Test d'intégration des ets", () => {
    test.each(['2273E0303205P', '2364E0984413P', '2283E0131604Y'])(
      'vérification des DI des ets pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        let ets = dpeRequest.logement.enveloppe.ets_collection?.ets || {};
        if (ets && Array.isArray(ets)) {
          ets = ets[0];
        }

        const di = service.execute(ctx, ets);
        expect(di.bver).toBeCloseTo(ets.donnee_intermediaire.bver, 2);
        expect(di.coef_transparence_ets).toBeCloseTo(
          ets.donnee_intermediaire.coef_transparence_ets,
          2
        );
      }
    );
  });
});
