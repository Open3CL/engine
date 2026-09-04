import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';
import { DeperditionVentilationService } from './deperdition-ventilation.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TypeHabitation } from '../../../../dpe/domain/models/type-habitation.model.js';
import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { DeperditionEnveloppeService } from '../deperdition-enveloppe.service.js';
import { describeIntegration } from '../../../../../../test/helpers/integration-test.js';
import { logger } from '../../../../../core/util/logger/log-service.js';

/** @type {DeperditionVentilationService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {DeperditionEnveloppeService} **/
let deperditionEnveloppeService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {TvStore} **/
let tvStore;

describe('Calcul de déperdition des portes', () => {
  beforeEach(() => {
    tvStore = new TvStore();
    service = new DeperditionVentilationService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
    deperditionEnveloppeService = new DeperditionEnveloppeService();
  });

  describe('Determination de q4paConv', () => {
    /** @type {Contexte} */
    let ctx = { typeHabitation: TypeHabitation.MAISON };

    test.each([
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '1',
        surfaceIsolee: 0,
        surfaceNonIsolee: 0,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '0',
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '1',
        surfaceIsolee: 200,
        surfaceNonIsolee: 100,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '1',
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '1',
        surfaceIsolee: 200,
        surfaceNonIsolee: 300,
        surfaceMenuiserieAvecJoint: 100,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '0',
        expectedPresenceJointsMenuiserie: '1'
      },
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '1',
        surfaceIsolee: 200,
        surfaceNonIsolee: 300,
        surfaceMenuiserieAvecJoint: 100,
        surfaceMenuiserieSansJoint: 200,
        expectedIsolationSurface: '0',
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '2',
        surfaceIsolee: 200,
        surfaceNonIsolee: 100,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '1',
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        // 1948-1974 mais moins de 50% de surface isolée => isolationSurface '0'
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '2',
        surfaceIsolee: 100,
        surfaceNonIsolee: 200,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '0',
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        q4paConvSaisi: undefined,
        enumPeriodeConstructionId: '3',
        surfaceIsolee: 200,
        surfaceNonIsolee: 100,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: undefined,
        expectedPresenceJointsMenuiserie: undefined
      },
      {
        q4paConvSaisi: 12.5,
        enumPeriodeConstructionId: '1',
        surfaceIsolee: 0,
        surfaceNonIsolee: 0,
        surfaceMenuiserieAvecJoint: 0,
        surfaceMenuiserieSansJoint: 0,
        expectedIsolationSurface: '0',
        expectedPresenceJointsMenuiserie: undefined
      }
    ])(
      '$q4paConvSaisi: q4paConvSaisi, $enumPeriodeConstructionId: enumPeriodeConstructionId, $surfaceIsolee: surfaceIsolee,' +
        '$surfaceNonIsolee: surfaceNonIsolee, $surfaceMenuiserieAvecJoint: surfaceMenuiserieAvecJoint, $surfaceMenuiserieSansJoint: surfaceMenuiserieSansJoint,' +
        '$expectedIsolationSurface: expectedIsolationSurface, $expectedPresenceJointsMenuiserie: expectedPresenceJointsMenuiserie',
      ({
        q4paConvSaisi,
        enumPeriodeConstructionId,
        surfaceIsolee,
        surfaceNonIsolee,
        surfaceMenuiserieAvecJoint,
        surfaceMenuiserieSansJoint,
        expectedIsolationSurface,
        expectedPresenceJointsMenuiserie
      }) => {
        vi.spyOn(tvStore, 'getQ4paConv').mockReturnValue({ q4pa_conv: 18.8 });
        ctx.enumPeriodeConstructionId = enumPeriodeConstructionId;

        /** @type {VentilationDE} */
        const de = {
          q4pa_conv_saisi: q4paConvSaisi
        };

        const q4paConv = service.q4paConv(
          de,
          ctx,
          surfaceIsolee,
          surfaceNonIsolee,
          surfaceMenuiserieAvecJoint,
          surfaceMenuiserieSansJoint
        );

        if (q4paConvSaisi) {
          expect(tvStore.getQ4paConv).not.toHaveBeenCalled();
          expect(q4paConv).toBe(q4paConvSaisi);
        } else {
          expect(tvStore.getQ4paConv).toHaveBeenCalledWith(
            enumPeriodeConstructionId,
            TypeHabitation.MAISON,
            expectedIsolationSurface,
            expectedPresenceJointsMenuiserie
          );
          expect(q4paConv).toBe(18.8);
        }
      }
    );

    test('calcul de hvent', () => {
      expect(service.hvent(108, { qvarep_conv: 10 })).toBeCloseTo(367.2, 2);
    });
  });

  describe('Determination de hperm', () => {
    /** @type {Contexte} */
    let ctx = { typeHabitation: TypeHabitation.MAISON, surfaceHabitable: 100 };

    test.each([
      { plusieursFacadeExposee: false, expectedHperm: 15.04 },
      { plusieursFacadeExposee: true, expectedHperm: 98.97 }
    ])(
      '$plusieursFacadeExposee: plusieursFacadeExposee, $expectedHperm: expectedHperm',
      ({ plusieursFacadeExposee, expectedHperm }) => {
        ctx.hauteurSousPlafond = 10;

        /** @type {VentilationDE} */
        const de = {
          plusieurs_facade_exposee: plusieursFacadeExposee
        };

        const hperm = service.hperm(
          de,
          { smea_conv: 18, qvasouf_conv: 15.3, qvarep_conv: 13.2 },
          ctx,
          10.5,
          19.6
        );
        expect(hperm).toBeCloseTo(expectedHperm, 2);
      }
    );
  });

  describe('Determination de pventMoy', () => {
    test.each([
      {
        label: 'Ventilation par ouverture des fenêtres',
        typeVentilation: '1',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 0
      },
      {
        label: 'Ventilation naturelle par conduit',
        typeVentilation: '25',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 0
      },
      {
        label: 'Ventilation Simple flux auto SF AUTO',
        typeVentilation: '4',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 35
      },
      {
        label: 'Ventilation Simple flux auto SF AUTO',
        typeVentilation: '4',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 65
      },
      {
        label: 'Ventilation Simple flux auto SF AUTO',
        typeVentilation: '4',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 250
      },
      {
        label: 'Ventilation Simple flux auto SF AUTO',
        typeVentilation: '4',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 460
      },
      {
        label: 'Ventilation Simple flux auto SF GAZ',
        typeVentilation: '10',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 35
      },
      {
        label: 'Ventilation Simple flux auto SF GAZ',
        typeVentilation: '11',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 65
      },
      {
        label: 'Ventilation Simple flux auto SF GAZ',
        typeVentilation: '10',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 250
      },
      {
        label: 'Ventilation Simple flux auto SF GAZ',
        typeVentilation: '12',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 460
      },
      {
        label: 'Ventilation Simple flux hygro SF HYGRO',
        typeVentilation: '7',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 15
      },
      {
        label: 'Ventilation Simple flux hygro SF HYGRO',
        typeVentilation: '8',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 50
      },
      {
        label: 'Ventilation Simple flux hygro SF HYGRO',
        typeVentilation: '9',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 250
      },
      {
        label: 'Ventilation Simple flux hygro SF HYGRO',
        typeVentilation: '13',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 460
      },
      {
        label: 'Ventilation double flux hygro DF INDIVIDUELLE',
        typeVentilation: '19',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 35
      },
      {
        label: 'Ventilation double flux hygro DF INDIVIDUELLE',
        typeVentilation: '19',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 80
      },
      {
        label: 'Ventilation double flux hygro DF INDIVIDUELLE',
        typeVentilation: '19',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 600
      },
      {
        label: 'Ventilation double flux hygro DF INDIVIDUELLE',
        typeVentilation: '19',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 1100
      },
      {
        label: 'Ventilation simple flux auto HYBRIDE',
        typeVentilation: '26',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 2.92
      },
      {
        label: 'Ventilation simple flux auto HYBRIDE',
        typeVentilation: '27',
        typeHabitation: TypeHabitation.MAISON,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 5.42
      },
      {
        label: 'Ventilation simple flux auto HYBRIDE',
        typeVentilation: '28',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: true,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 41.67
      },
      {
        label: 'Ventilation simple flux auto HYBRIDE',
        typeVentilation: '29',
        typeHabitation: TypeHabitation.APPARTEMENT,
        ventilationPost2012: false,
        surfaceHabitable: 100,
        qvarepConv: 10,
        expectedPventMoy: 76.67
      }
    ])(
      '$typeVentilation: typeVentilation, $typeHabitation: typeHabitation, $ventilationPost2012: ventilationPost2012, $surfaceHabitable: surfaceHabitable, $qvarepConv: qvarepConv',
      ({
        typeVentilation,
        typeHabitation,
        ventilationPost2012,
        surfaceHabitable,
        qvarepConv,
        expectedPventMoy
      }) => {
        const pventMoy = service.pventMoy(
          typeVentilation,
          { typeHabitation, surfaceHabitable },
          ventilationPost2012,
          { qvarep_conv: qvarepConv }
        );
        expect(pventMoy).toBeCloseTo(expectedPventMoy, 2);
      }
    );
  });

  describe('execute (agrégation des déperditions et consommations de ventilation)', () => {
    /** @type {Contexte} */
    const ctx = {
      surfaceHabitable: 100,
      hauteurSousPlafond: 2.5,
      typeHabitation: TypeHabitation.MAISON,
      enumPeriodeConstructionId: '3'
    };

    test('assemble hvent, hperm et la consommation des auxiliaires', () => {
      vi.spyOn(tvStore, 'getDebitsVentilation').mockReturnValue({
        qvarep_conv: 10,
        qvasouf_conv: 5,
        smea_conv: 2
      });
      vi.spyOn(tvStore, 'getQ4paConv').mockReturnValue({ q4pa_conv: 1.7 });

      /** @type {VentilationDE} */
      const de = {
        enum_type_ventilation_id: '4',
        ventilation_post_2012: true,
        plusieurs_facade_exposee: false
      };

      const di = service.execute(ctx, de, 120, 80, 40, 10, 5);

      expect(tvStore.getDebitsVentilation).toHaveBeenCalledWith('4');
      // hvent = 0.34 * qvarep_conv * surfaceHabitable
      expect(di.hvent).toBeCloseTo(340, 5);
      // pventMoy (SF auto, maison, post 2012) = 35 => conso = 8.76 * 35
      expect(di.pvent_moy).toBe(35);
      expect(di.conso_auxiliaire_ventilation).toBeCloseTo(306.6, 5);
      // hperm : valeur de référence de régression
      expect(di.hperm).toBeCloseTo(0.10692928032279153, 9);
    });

    test('conso des auxiliaires nulle sans type de ventilation ni indicateur post 2012', () => {
      vi.spyOn(tvStore, 'getDebitsVentilation').mockReturnValue({});
      vi.spyOn(tvStore, 'getQ4paConv').mockReturnValue({ q4pa_conv: 1.7 });
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      /** @type {VentilationDE} */
      const de = { plusieurs_facade_exposee: false };

      const di = service.execute(ctx, de, 0, 0, 0, 0, 0);

      expect(errorSpy).toHaveBeenCalledOnce();
      // La consommation retournée vaut 0 (nombre), les clés conso ne sont donc pas ajoutées
      expect(di.conso_auxiliaire_ventilation).toBeUndefined();
      expect(di.pvent_moy).toBeUndefined();
    });
  });

  describeIntegration("Test d'intégration des ventilations", () => {
    test.each(corpus)('vérification des DI de la ventilation pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      const initialVentilations = [
        ...(dpeRequest.logement.ventilation_collection?.ventilation || [])
      ];

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      deperditionEnveloppeService.deperditions(ctx, dpeRequest.logement);

      const ventilations = dpeRequest.logement.ventilation_collection?.ventilation || [];

      ventilations.forEach((ventilation, index) => {
        expect(initialVentilations[index].donnee_intermediaire.hvent).toBeCloseTo(
          ventilation.donnee_intermediaire.hvent,
          2
        );
        expect(initialVentilations[index].donnee_intermediaire.hperm).toBeCloseTo(
          ventilation.donnee_intermediaire.hperm,
          2
        );
        expect(
          initialVentilations[index].donnee_intermediaire.conso_auxiliaire_ventilation
        ).toBeCloseTo(ventilation.donnee_intermediaire.conso_auxiliaire_ventilation, 2);
      });
    });
  });
});
