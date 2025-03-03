import corpus from '../../../../../test/corpus-sano.json';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../contexte.builder.js';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/baieVitreeTv.store.js';

/** @type {SurfaceSudEquivalenteService} **/
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
    service = new SurfaceSudEquivalenteService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination de la surface sud équivalente pour une baie vitrée bv et pendant un mois donné', () => {
    test.each([
      {
        enumOrientationId: 2,
        enumInclinaisonVitrageId: 3,
        fe1: 1,
        fe2: 1,
        sw: 0.2,
        coeff: 1,
        expected: 5
      },
      {
        enumOrientationId: 2,
        enumInclinaisonVitrageId: undefined,
        fe1: 1,
        fe2: 1,
        sw: 0.2,
        coeff: 1,
        expected: 5
      },
      {
        enumOrientationId: 2,
        enumInclinaisonVitrageId: undefined,
        fe1: 1,
        fe2: 1,
        sw: 0.2,
        coeff: undefined,
        expected: 1
      },
      {
        enumOrientationId: 2,
        enumInclinaisonVitrageId: 3,
        fe1: 0.5,
        fe2: 0.5,
        sw: 0.2,
        coeff: 1,
        expected: 1.25
      },
      {
        enumOrientationId: 2,
        enumInclinaisonVitrageId: 3,
        fe1: undefined,
        fe2: undefined,
        sw: 0.2,
        coeff: 1,
        expected: 5
      }
    ])(
      'enumOrientationId: $enumOrientationId, enumInclinaisonVitrageId: $enumInclinaisonVitrageId, fe1: $fe1,' +
        'fe2: $fe2, sw: $sw, coeff: $coeff',
      ({
        enumOrientationId,
        enumInclinaisonVitrageId = undefined,
        fe1,
        fe2,
        sw,
        coeff = undefined,
        expected
      }) => {
        vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

        /** @type {BaieVitree} */
        const baieVitree = {
          donnee_entree: {
            enum_orientation_id: enumOrientationId,
            enum_inclinaison_vitrage_id: enumInclinaisonVitrageId,
            surface_totale_baie: 10
          },
          donnee_intermediaire: { fe1, fe2, sw }
        };

        const ssd = service.ssdBaieMois(baieVitree, '1', 'Janvier', coeff);

        if (enumInclinaisonVitrageId === undefined) {
          enumInclinaisonVitrageId = 3;
        }

        expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(
          enumOrientationId,
          enumInclinaisonVitrageId,
          1,
          'Janvier'
        );
        expect(ssd).toBe(expected);
      }
    );
  });

  describe('Determination de la surface sud équivalente des baies vitrées bv', () => {
    test("Aucune pour les baies vitrées qui ne donnent pas sur l'extérieur", () => {
      expect(service.execute({}, [])).toBe(0);

      const baiesVitrees = [
        {
          donnee_entree: { enum_type_adjacence_id: 18 }
        }
      ];
      expect(service.ssdMois({}, baiesVitrees, [], 'Janvier')).toBe(0);
    });

    test("Baies vitrées donnant sur l'extérieur", () => {
      vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

      /** @type {Contexte} */
      const ctx = { zoneClimatique: { id: 1 } };
      const baiesVitrees = [
        {
          donnee_entree: {
            enum_type_adjacence_id: 1,
            enum_orientation_id: 2,
            surface_totale_baie: 10
          },
          donnee_intermediaire: { sw: 1 }
        }
      ];
      expect(service.ssdMois(ctx, baiesVitrees, [], 'Janvier')).toBe(5);
      expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(2, 3, 1, 'Janvier');
    });

    test('Baies vitrées donnant sur un espace tampon solarisé', () => {
      vi.spyOn(tvStore, 'getCoefficientBaieVitree').mockReturnValue(0.5);

      /** @type {Contexte} */
      const ctx = { zoneClimatique: { id: 1 } };
      const baiesVitrees = [
        {
          donnee_entree: {
            enum_type_adjacence_id: 10,
            enum_orientation_id: 2,
            surface_totale_baie: 10
          },
          donnee_intermediaire: { sw: 1 }
        },
        {
          donnee_entree: {
            enum_type_adjacence_id: 1,
            enum_orientation_id: 2,
            surface_totale_baie: 10
          },
          donnee_intermediaire: { sw: 1 }
        }
      ];
      const ets = {
        donnee_intermediaire: { bver: 0.6, coef_transparence_ets: 0.4 },
        baie_ets_collection: {
          baie_ets: {
            donnee_entree: {
              enum_inclinaison_vitrage_id: 3,
              enum_orientation_id: 1,
              surface_totale_baie: 7
            }
          }
        }
      };
      expect(service.ssdMois(ctx, baiesVitrees, ets, 'Janvier')).toBe(6.5224);
      expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(2, 3, 1, 'Janvier');
      expect(tvStore.getCoefficientBaieVitree).toHaveBeenCalledWith(1, 3, 1, 'Janvier');
    });
  });

  describe("Test d'intégration pour surface sud équivalente", () => {
    test.each(corpus)(
      'vérification des DI de la surface sud équivalente pour dpe %s',
      (ademeId) => {
        /**
         * @type {Dpe}
         */
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        const sse = service.execute(ctx, dpeRequest.logement.enveloppe);
        expect(sse).toBeCloseTo(
          dpeRequest.logement.sortie.apport_et_besoin.surface_sud_equivalente,
          2
        );
      }
    );
  });
});
