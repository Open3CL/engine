import { beforeEach, describe, expect, test, vi } from 'vitest';
import corpus from '../../../../../../test/corpus-sano.json';
import { expect_or, getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { PerteEcsRecupService } from './perte-ecs-recup.service.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { mois_liste } from '../../../../../utils.js';
import { EcsTvStore } from '../../../../dpe/infrastructure/ecs/ecsTv.store.js';
import { GenerateurEcsService } from '../../ecs/generateur-ecs.service.js';
import { InstallationEcsService } from '../../ecs/installation-ecs.service.js';

/** @type {PerteEcsRecupService} **/
let service;

/** @type {FrTvStore} **/
let tvStore;

/** @type {InstallationEcsService} **/
let installationEcsService;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul des pertes de distribution et stockage récupérées', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new PerteEcsRecupService(tvStore);
    installationEcsService = new InstallationEcsService(new GenerateurEcsService(new EcsTvStore()));
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test.each([
    {
      label: 'Installation ECS en mode conventionnel',
      depensier: false,
      expected: 0.192
    },
    {
      label: 'Installation ECS en mode dépensier',
      depensier: true,
      expected: 0.725
    }
  ])('Calcul des pertes de distribution récupérées pour $label', ({ depensier, expected }) => {
    vi.spyOn(tvStore, 'getData').mockReturnValue(depensier ? 1.5 : 0.8);

    /** @type {Contexte} */
    const ctx = {
      altitude: { value: '400-800m' },
      zoneClimatique: { value: 'h1a' },
      inertie: { ilpa: 1 }
    };

    /** @type {Logement} */
    const logement = {
      installation_ecs_collection: {
        installation_ecs: [
          {
            donnee_utilisateur: {
              QdwIndVc: { conventionnel: 100, depensier: 200 },
              QdwColVc: { conventionnel: 50, depensier: 120 }
            }
          },
          {
            donnee_utilisateur: {
              QdwIndVc: { conventionnel: 150, depensier: 280 },
              QdwColVc: { conventionnel: 65, depensier: 135 }
            }
          }
        ]
      }
    };

    expect(service.pertesDistributionEcsRecup(ctx, logement, depensier)).toBeCloseTo(expected, 3);
    for (const mois of mois_liste) {
      expect(tvStore.getData).toHaveBeenCalledWith(
        depensier ? 'nref21' : 'nref19',
        '400-800m',
        'h1a',
        mois,
        1
      );
    }
  });

  test.each([
    {
      label: 'Installation ECS en mode conventionnel',
      depensier: false,
      expected: 63.209
    },
    {
      label: 'Installation ECS en mode dépensier',
      depensier: true,
      expected: 118.516
    }
  ])('Calcul des pertes de stockage récupérées pour $label', ({ depensier, expected }) => {
    vi.spyOn(tvStore, 'getData').mockReturnValue(depensier ? 1.5 : 0.8);

    /** @type {Contexte} */
    const ctx = {
      altitude: { value: '400-800m' },
      zoneClimatique: { value: 'h1a' },
      inertie: { ilpa: 1 }
    };

    /** @type {Logement} */
    const logement = {
      installation_ecs_collection: {
        installation_ecs: [
          { donnee_utilisateur: { QgwRecuperable: 120012 } },
          { donnee_utilisateur: { QgwRecuperable: 150 } }
        ]
      }
    };

    expect(service.pertesStockageEcsRecup(ctx, logement, depensier)).toBeCloseTo(expected, 3);
    for (const mois of mois_liste) {
      expect(tvStore.getData).toHaveBeenCalledWith(
        depensier ? 'nref21' : 'nref19',
        '400-800m',
        'h1a',
        mois,
        1
      );
    }
  });

  describe("Test d'intégration des installations ECS", () => {
    test.each(corpus)(
      'vérification des pertes de distribution ecs recup des installations ECS pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        installationEcsService.execute(ctx, dpeRequest.logement, {
          besoin_ecs: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs,
          besoin_ecs_depensier: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs_depensier
        });

        const pertesStockage = service.execute(ctx, dpeRequest.logement);

        expect_or(
          () =>
            expect(pertesStockage.pertes_distribution_ecs_recup).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup
            ),
          () =>
            expect(pertesStockage.pertes_distribution_ecs_recup * 1000).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup
            )
        );
      }
    );

    test.each(corpus)(
      'vérification des pertes de distribution ecs recup depensier des installations ECS pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        installationEcsService.execute(ctx, dpeRequest.logement, {
          besoin_ecs: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs,
          besoin_ecs_depensier: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs_depensier
        });

        const pertesStockage = service.execute(ctx, dpeRequest.logement);

        expect_or(
          () =>
            expect(pertesStockage.pertes_distribution_ecs_recup_depensier).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup_depensier
            ),
          () =>
            expect(pertesStockage.pertes_distribution_ecs_recup_depensier * 1000).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup_depensier
            )
        );
      }
    );

    test.each(corpus)(
      'vérification des pertes de stockage ecs recup des installations ECS pour dpe %s',
      (ademeId) => {
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        installationEcsService.execute(ctx, dpeRequest.logement, {
          besoin_ecs: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs,
          besoin_ecs_depensier: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs_depensier
        });

        const pertesStockage = service.execute(ctx, dpeRequest.logement);
        expect_or(
          () =>
            expect(pertesStockage.pertes_stockage_ecs_recup).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_stockage_ecs_recup
            ),
          () =>
            expect(pertesStockage.pertes_stockage_ecs_recup * 1000).toBeCloseTo(
              dpeRequest.logement.sortie.apport_et_besoin.pertes_stockage_ecs_recup
            )
        );
      }
    );
  });
});
