import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { BesoinChService } from './besoin-ch.service.js';
import { mois_liste } from '../../../../../utils.js';

/** @type {BesoinChService} **/
let service;

/** @type {FrTvStore} **/
let tvStore;

describe('Calcul des besoins en chauffage du logement', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new BesoinChService(tvStore);
  });

  test.each([
    {
      inertie: 1,
      expected: 0.24
    },
    {
      inertie: 2,
      expected: 0.24
    },
    {
      inertie: 3,
      expected: 0.23
    },
    {
      inertie: 4,
      expected: 0.22
    }
  ])(
    'Determination de la fraction des besoins de chauffage couverts par les apports gratuits pour un mois donné avec inertie = $inertie',
    ({ inertie, expected }) => {
      /** @type {Contexte} */
      const ctx = { inertie: { id: inertie } };

      /** @type { Logement } **/
      const logement = {
        donnees_de_calcul: {
          apportsInterneCh: { Janvier: 102.5 },
          apportsSolaire: { Janvier: 12.5 }
        },
        sortie: { deperdition: { deperdition_enveloppe: 25.9 } }
      };
      expect(service.fractionBesoinCh(ctx, logement, 'Janvier', 18)).toBeCloseTo(expected, 2);
    }
  );

  test('Besoin de chauffage hors pertes récupérées et fraction des apports gratuits pour un mois', () => {
    /** @type {Contexte} */
    const ctx = { inertie: { id: 1 } };

    /** @type { Logement } **/
    const logement = {
      donnees_de_calcul: {
        apportsInterneCh: { Janvier: 102.5 },
        apportsSolaire: { Janvier: 12.5 }
      },
      sortie: { deperdition: { deperdition_enveloppe: 25.9 } }
    };

    const besoinHP = service.besoinChHorsPertesRecuperees(ctx, logement, 'Janvier', 12.5);
    expect(besoinHP.besoinChMoisHP).toBeCloseTo(0.2139, 4);
    expect(besoinHP.fractionApportGratuitMois).toBeCloseTo(4.2412, 4);
  });

  test('Besoin total de chauffage hors pertes récupérées et fraction des apports gratuits', () => {
    vi.spyOn(tvStore, 'getData').mockReturnValue(10);

    /** @type {Contexte} */
    const ctx = {
      inertie: { id: 1, ilpa: 1 },
      altitude: { value: '400-800m' },
      zoneClimatique: { value: 'h3c' }
    };

    /** @type { Logement } **/
    const logement = {
      donnees_de_calcul: {
        apportsInterneCh: {
          Janvier: 102.5,
          Février: 102.5,
          Mars: 102.5,
          Avril: 102.5,
          Mai: 102.5,
          Juin: 102.5,
          Juillet: 102.5,
          Aout: 102.5,
          Septembre: 102.5,
          Octobre: 102.5,
          Novembre: 102.5,
          Décembre: 102.5
        },
        apportsSolaire: {
          Janvier: 102.5,
          Février: 102.5,
          Mars: 102.5,
          Avril: 102.5,
          Mai: 102.5,
          Juin: 102.5,
          Juillet: 102.5,
          Aout: 102.5,
          Septembre: 102.5,
          Octobre: 102.5,
          Novembre: 102.5,
          Décembre: 102.5
        },
        besoinChauffageHP: {},
        besoinChauffageDepensierHP: {}
      },
      sortie: { deperdition: { deperdition_enveloppe: 25.9 } }
    };

    const besoinTotalHP = service.execute(ctx, logement);
    expect(besoinTotalHP.besoin_ch_hp).toBeCloseTo(1.1388, 4);
    expect(besoinTotalHP.besoin_ch_depensier_hp).toBeCloseTo(1.1388, 4);
    expect(besoinTotalHP.fraction_apport_gratuit_ch).toBeCloseTo(0.6336, 4);
    expect(besoinTotalHP.fraction_apport_gratuit_depensier_ch).toBeCloseTo(0.6336, 4);

    for (const mois of mois_liste) {
      expect(tvStore.getData).toHaveBeenCalledWith(
        'dh19',
        ctx.altitude.value,
        ctx.zoneClimatique.value,
        mois,
        ctx.inertie.ilpa
      );

      expect(tvStore.getData).toHaveBeenCalledWith(
        'dh21',
        ctx.altitude.value,
        ctx.zoneClimatique.value,
        mois,
        ctx.inertie.ilpa
      );

      expect(logement.donnees_de_calcul.besoinChauffageHP[mois]).toBeCloseTo(0.0949, 4);
      expect(logement.donnees_de_calcul.besoinChauffageDepensierHP[mois]).toBeCloseTo(0.0949, 4);
    }
  });
});
