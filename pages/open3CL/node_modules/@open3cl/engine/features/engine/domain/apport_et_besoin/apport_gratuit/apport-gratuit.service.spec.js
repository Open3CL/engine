import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SurfaceSudEquivalenteService } from './../surface-sud-equivalente.service.js';
import { ApportGratuitService } from './apport-gratuit.service.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { mois_liste } from '../../../../../utils.js';

/** @type {FrTvStore} **/
let frTvStore;

/** @type {SurfaceSudEquivalenteService} **/
let surfaceSudEquivalenteService;

/** @type {ApportGratuitService} **/
let service;

describe('Calcul des apports gratuits au logement', () => {
  beforeEach(() => {
    frTvStore = new FrTvStore();
    surfaceSudEquivalenteService = new SurfaceSudEquivalenteService();
    service = new ApportGratuitService(frTvStore, surfaceSudEquivalenteService);
  });

  test.each([
    {
      label: 'avec climatisation',
      withClimatisation: true
    },
    {
      label: 'sans climatisation',
      withClimatisation: false
    }
  ])('Determination des apports gratuits pour un logement $label', ({ withClimatisation }) => {
    vi.spyOn(surfaceSudEquivalenteService, 'ssdMois').mockReturnValue(18.5);
    vi.spyOn(frTvStore, 'getData').mockReturnValue(10);

    /** @type {Contexte} */
    const ctx = {
      zoneClimatique: { value: 'h1a' },
      altitude: { value: '400-800m' },
      inertie: { ilpa: 1 }
    };

    /** @type { Logement } **/
    const logement = {
      enveloppe: { porte_collection: {} },
      donnees_de_calcul: { apportsSolaire: {} }
    };

    if (withClimatisation) {
      logement.climatisation_collection = { climatisation: [{}] };
    }

    expect(service.apportSolaire(ctx, logement)).toStrictEqual({
      apport_solaire_ch: 2220000,
      apport_solaire_fr: withClimatisation ? 2220000 : 0
    });
    expect(surfaceSudEquivalenteService.ssdMois).toHaveBeenCalledWith(
      ctx,
      logement.enveloppe,
      'Janvier'
    );

    for (const mois of mois_liste) {
      expect(frTvStore.getData).toHaveBeenCalledWith(
        'e',
        ctx.altitude.value,
        ctx.zoneClimatique.value,
        mois,
        ctx.inertie.ilpa
      );

      if (withClimatisation) {
        expect(frTvStore.getData).toHaveBeenCalledWith(
          'e_fr_28',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois
        );
      } else {
        expect(frTvStore.getData).not.toHaveBeenCalledWith(
          'e_fr_28',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois
        );
      }

      expect(logement.donnees_de_calcul.apportsSolaire[mois]).toBe(185000);
    }
  });

  test.each([
    {
      label: 'avec climatisation',
      withClimatisation: true
    },
    {
      label: 'sans climatisation',
      withClimatisation: false
    }
  ])('Determination des apports internes pour un logement $label', ({ withClimatisation }) => {
    vi.spyOn(frTvStore, 'getData').mockReturnValue(10);

    /** @type {Contexte} */
    const ctx = {
      zoneClimatique: { value: 'h1a' },
      altitude: { value: '400-800m' },
      inertie: { ilpa: 1 },
      surfaceHabitable: 12,
      nadeq: 1.25
    };

    /** @type { Logement } **/
    const logement = {
      enveloppe: { porte_collection: {} },
      donnees_de_calcul: { apportsInterneCh: {}, apportsInterneDepensier: {} }
    };

    if (withClimatisation) {
      logement.climatisation_collection = { climatisation: [{}] };
    }

    expect(service.apportInterne(ctx, logement)).toStrictEqual({
      apport_interne_ch: 15675.94285714286,
      apport_interne_fr: withClimatisation ? 15675.94285714286 : 0
    });

    for (const mois of mois_liste) {
      expect(frTvStore.getData).toHaveBeenCalledWith(
        'nref19',
        ctx.altitude.value,
        ctx.zoneClimatique.value,
        mois,
        ctx.inertie.ilpa
      );

      if (withClimatisation) {
        expect(frTvStore.getData).toHaveBeenCalledWith(
          'nref28',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois
        );
      } else {
        expect(frTvStore.getData).not.toHaveBeenCalledWith(
          'nref28',
          ctx.altitude.value,
          ctx.zoneClimatique.value,
          mois
        );
      }

      expect(logement.donnees_de_calcul.apportsInterneCh[mois]).toBeCloseTo(1306.33, 2);
      expect(logement.donnees_de_calcul.apportsInterneDepensier[mois]).toBeCloseTo(1306.33, 2);
    }
  });

  test('Determination des apports solaires pour un mois donné', () => {
    vi.spyOn(surfaceSudEquivalenteService, 'ssdMois').mockReturnValue(18.5);

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 } };

    /** @type { Enveloppe } **/
    const enveloppe = {
      porte_collection: {}
    };
    expect(service.apportSolaireMois(ctx, enveloppe, 'Janvier', 18)).toBe(333000);
    expect(surfaceSudEquivalenteService.ssdMois).toHaveBeenCalledWith(ctx, enveloppe, 'Janvier');
  });

  test('Determination des apports internes dans le logement pour un mois donné', () => {
    /** @type {Contexte} */
    const ctx = { surfaceHabitable: 88, nadeq: 2 };

    expect(service.apportInterneMois(ctx, 18)).toBeCloseTo(8121.39, 2);
  });
});
