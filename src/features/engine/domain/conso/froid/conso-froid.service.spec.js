import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { ConsoFroidService } from './conso-froid.service.js';

/** @type {ConsoFroidService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {FrTvStore} **/
let tvStore;

describe('Calcul des consos en froid du logement', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new ConsoFroidService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test.each([
    {
      label: 'Climatisation avec méthode de saisie 6, sans surface clim',
      enumMethodeSaisieCaracSysId: 6,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 7, sans surface clim',
      enumMethodeSaisieCaracSysId: 7,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 8, sans surface clim',
      enumMethodeSaisieCaracSysId: 8,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 6, avec surface clim',
      enumMethodeSaisieCaracSysId: 6,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 7, avec surface clim',
      enumMethodeSaisieCaracSysId: 7,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 8, avec surface clim',
      enumMethodeSaisieCaracSysId: 8,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 5, sans surface clim',
      enumMethodeSaisieCaracSysId: 5,
      eer: 90,
      expected: { conso_fr: 10, conso_fr_depensier: 15 }
    },
    {
      label: 'Climatisation avec méthode de saisie 5, avec surface clim',
      enumMethodeSaisieCaracSysId: 5,
      eer: 90,
      surfaceClim: 80,
      expected: { conso_fr: 8, conso_fr_depensier: 12 }
    }
  ])(
    'Détermination des consommations des systèmes de refroidissement pour $label',
    ({
      enumMethodeSaisieCaracSysId,
      surfaceClim = undefined,
      eer = undefined,
      eerInitial,
      expected
    }) => {
      vi.spyOn(tvStore, 'getEer').mockReturnValue(eer);

      /** @type {Contexte} */
      const contexte = {
        zoneClimatique: { id: 1 },
        surfaceHabitable: 100
      };

      /** @type {Climatisation} */
      const climatisation = {
        donnee_entree: {
          enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId,
          surface_clim: surfaceClim
        },
        donnee_intermediaire: { eer: eerInitial }
      };

      /** @type {ApportEtBesoin} */
      const apportEtBesoin = {
        besoin_fr: 1000,
        besoin_fr_depensier: 1500
      };

      const consoFroid = service.consoFroid(contexte, apportEtBesoin, climatisation);
      expect(consoFroid.conso_fr).toBeCloseTo(expected.conso_fr, 2);
      expect(consoFroid.conso_fr_depensier).toBeCloseTo(expected.conso_fr_depensier, 2);
    }
  );

  describe("Test d'intégration pour le besoin en froid", () => {
    test.each(corpus)('vérification des sorties besoin_fr et conso_fr pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const climatisations = structuredClone(
        dpeRequest.logement.climatisation_collection?.climatisation || []
      );
      service.execute(ctx, dpeRequest.logement);

      climatisations.forEach((climatisation, i) => {
        console.log('climatisation.donnee_intermediaire.besoin_fr');
        expect(climatisation.donnee_intermediaire.besoin_fr).toBeCloseTo(
          dpeRequest.logement.climatisation_collection.climatisation[i].donnee_intermediaire
            .besoin_fr,
          2
        );
        console.log(climatisation.donnee_intermediaire.conso_fr);
        expect(climatisation.donnee_intermediaire.conso_fr).toBeCloseTo(
          dpeRequest.logement.climatisation_collection.climatisation[i].donnee_intermediaire
            .conso_fr,
          2
        );
      });
    });
  });
});
