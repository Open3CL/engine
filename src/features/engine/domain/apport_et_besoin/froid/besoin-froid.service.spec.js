import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { ApportGratuitService } from '../apport_gratuit/apport-gratuit.service.js';
import { BesoinFroidService } from './besoin-froid.service.js';

/** @type {ApportGratuitService} **/
let apportGratuitService;

/** @type {BesoinFroidService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {FrTvStore} **/
let tvStore;

describe('Calcul des besoins en froid du logement', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    apportGratuitService = new ApportGratuitService();
    service = new BesoinFroidService(tvStore, apportGratuitService);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test('Besoins en froid à 0 si aucune climatisation dans le logement', () => {
    vi.spyOn(tvStore, 'getData').mockReturnValue(10);

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };
    expect(service.execute(ctx, {})).toStrictEqual({ besoin_fr: 0, besoin_fr_depensier: 0 });
    expect(service.execute(ctx, { enveloppe: {} })).toStrictEqual({
      besoin_fr: 0,
      besoin_fr_depensier: 0
    });
    expect(service.execute(ctx, { climatisation_collection: {} })).toStrictEqual({
      besoin_fr: 0,
      besoin_fr_depensier: 0
    });
    expect(service.execute(ctx, { climatisation_collection: { climatisation: [] } })).toStrictEqual(
      { besoin_fr: 0, besoin_fr_depensier: 0 }
    );

    expect(tvStore.getData).not.toHaveBeenCalled();
  });

  describe('Determination du besoin en froid pour un mois donné', () => {
    test.each([
      {
        data: 0,
        aijFr: 1,
        asjFr: 0.2,
        inertie: 4,
        depensier: false,
        expected: 0
      },
      {
        data: 0,
        aijFr: 1,
        asjFr: 0.2,
        inertie: 4,
        depensier: true,
        expected: 0
      },
      {
        data: 58,
        aijFr: 1,
        asjFr: 0.2,
        inertie: 4,
        depensier: false,
        expected: 0
      },
      {
        data: 58,
        aijFr: 1,
        asjFr: 0.2,
        inertie: 4,
        depensier: true,
        expected: 0
      },
      {
        data: 30,
        aijFr: 1000,
        asjFr: 2580,
        inertie: 4,
        depensier: false,
        expected: 6.25
      },
      {
        data: 30,
        aijFr: 1000,
        asjFr: 2580,
        inertie: 4,
        depensier: true,
        expected: 0
      },
      {
        data: 30,
        aijFr: 1500,
        asjFr: 5580,
        inertie: 4,
        depensier: true,
        expected: 12.38
      },
      {
        data: 30,
        aijFr: 10000,
        asjFr: 2000,
        inertie: 4,
        depensier: false,
        expected: 16.72
      },
      {
        data: 30,
        aijFr: 10000,
        asjFr: 2000,
        inertie: 1,
        depensier: true,
        expected: 20.25
      },
      {
        data: 30,
        aijFr: 10000,
        asjFr: 2000,
        inertie: 2,
        depensier: true,
        expected: 20.25
      },
      {
        data: 30,
        aijFr: 10000,
        asjFr: 2000,
        inertie: 3,
        depensier: true,
        expected: 19.66
      },
      {
        data: 30,
        aijFr: 10000,
        asjFr: 2000,
        inertie: 4,
        depensier: true,
        expected: 19.22
      }
    ])(
      'nref: $data, eFr: $data, tempExtMoyClim: $data, aijFr: $aijFr, asjFr: $asjFr,' +
        'inertie: $inertie, depensier: $depensier',
      ({ data, aijFr, asjFr, inertie, depensier, expected }) => {
        vi.spyOn(tvStore, 'getData').mockReturnValue(data);
        vi.spyOn(apportGratuitService, 'apportInterneMois').mockReturnValue(aijFr);
        vi.spyOn(apportGratuitService, 'apportSolaireMois').mockReturnValue(asjFr);

        /** @type {Logement} **/
        const logement = {
          enveloppe: {},
          sortie: { deperdition: { deperdition_enveloppe: 100 } }
        };

        /** @type {Contexte} */
        const ctx = {
          altitude: { value: '400-800m' },
          zoneClimatique: { value: 'h1a' },
          inertie: { id: inertie },
          surfaceHabitable: 25
        };

        const ssd = service.besoinFrMois(ctx, logement, 'Janvier', depensier);

        expect(tvStore.getData).toHaveBeenCalledWith(
          depensier ? 'nref26' : 'nref28',
          '400-800m',
          'h1a',
          'Janvier'
        );
        if (data > 0) {
          expect(tvStore.getData).toHaveBeenCalledWith(
            depensier ? 'e_fr_26' : 'e_fr_28',
            '400-800m',
            'h1a',
            'Janvier'
          );
          expect(tvStore.getData).toHaveBeenCalledWith(
            depensier ? 'textmoy_clim_26' : 'textmoy_clim_28',
            '400-800m',
            'h1a',
            'Janvier'
          );
          expect(apportGratuitService.apportInterneMois).toHaveBeenCalledWith(ctx, data);
          expect(apportGratuitService.apportSolaireMois).toHaveBeenCalledWith(
            ctx,
            {},
            'Janvier',
            data
          );
        }

        expect(ssd).toBeCloseTo(expected, 2);
      }
    );
  });

  describe("Test d'intégration pour le besoin en froid", () => {
    test.each(corpus)('vérification des sorties besoin_fr pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const ecs = service.execute(ctx, dpeRequest.logement);
      expect(ecs.besoin_fr).toBeCloseTo(dpeRequest.logement.sortie.apport_et_besoin.besoin_fr, 2);
      expect(ecs.besoin_fr_depensier).toBeCloseTo(
        dpeRequest.logement.sortie.apport_et_besoin.besoin_fr_depensier,
        2
      );
    });
  });
});
