import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';
import { DeperditionVentilationService } from './deperdition-ventilation.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TypeHabitation } from '../../../../dpe/domain/models/type-habitation.model.js';

/** @type {DeperditionVentilationService} **/
let service;

/** @type {TvStore} **/
let tvStore;

describe('Calcul de déperdition des portes', () => {
  beforeEach(() => {
    tvStore = new TvStore();
    service = new DeperditionVentilationService(tvStore);
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
});
