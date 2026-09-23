import { beforeEach, describe, expect, test } from 'vitest';
import { GenerateurEcsService } from './generateur-ecs.service.js';
import { InstallationEcsService } from './installation-ecs.service.js';
import corpus from '../../../../../test/corpus-sano.json';
import { expect_or, getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../contexte.builder.js';

/** @type {InstallationEcsService} **/
let service;

/** @type {GenerateurEcsService} **/
let generateurEcsService;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul des besoins et des pertes des installations ECS', () => {
  beforeEach(() => {
    generateurEcsService = new GenerateurEcsService();
    service = new InstallationEcsService(generateurEcsService);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test.each([
    {
      label: "Installation ECS sans surface habitable pour l'installation",
      surfaceHabitableLogement: 40,
      besoin_ecs: 850,
      besoin_ecs_depensier: 1050,
      expected: { besoinEcsDepensierInstallation: 1050, besoinEcsInstallation: 850 }
    },
    {
      label: "Installation ECS avec surface habitable pour l'installation",
      surfaceHabitableLogement: 40,
      surfaceHabitableInstallation: 50,
      besoin_ecs: 850,
      besoin_ecs_depensier: 1050,
      expected: { besoinEcsDepensierInstallation: 1312.5, besoinEcsInstallation: 1062.5 }
    }
  ])(
    'Calcul des besoins proratisés pour $label',
    ({
      surfaceHabitableLogement,
      surfaceHabitableInstallation = undefined,
      besoin_ecs,
      besoin_ecs_depensier,
      expected
    }) => {
      /** @type {Contexte} */
      const ctx = { surfaceHabitable: surfaceHabitableLogement };

      /** @type {{besoin_ecs: number, besoin_ecs_depensier: number}} */
      const besoinEcs = { besoin_ecs, besoin_ecs_depensier };

      /** @type {InstallationEcs} */
      const installationEcs = {
        donnee_entree: { surface_habitable: surfaceHabitableInstallation }
      };

      const besoinEcsInstallation = service.besoinEcsInstallation(ctx, installationEcs, besoinEcs);

      expect(besoinEcsInstallation).toStrictEqual(expected);
    }
  );

  test.each([
    {
      label: 'Installation individuelle avec générateur hors volume chauffé',
      enumTypeInstallationId: 1,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffeStockage2: 0,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 0, depensier: 0 },
        QdwColHVc: { conventionnel: 0, depensier: 0 },
        QgwRecuperable: 0
      }
    },
    {
      label: 'Installation individuelle avec générateur hors volume chauffé',
      enumTypeInstallationId: 1,
      positionVolumeChauffeStockage2: 0,
      positionVolumeChauffe2: 0,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 0, depensier: 0 },
        QdwColHVc: { conventionnel: 0, depensier: 0 },
        QgwRecuperable: 0
      }
    },
    {
      label: 'Installation individuelle avec 1 générateur en volume chauffé',
      enumTypeInstallationId: 1,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffeStockage2: 1,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 0, depensier: 0 },
        QdwColHVc: { conventionnel: 0, depensier: 0 },
        QgwRecuperable: 120
      }
    },
    {
      label: 'Installation individuelle avec 1 générateur en volume chauffé',
      enumTypeInstallationId: 1,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffe2: 1,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 0, depensier: 0 },
        QdwColHVc: { conventionnel: 0, depensier: 0 },
        QgwRecuperable: 120
      }
    },
    {
      label: 'Installation individuelle avec 2 générateurs en volume chauffé',
      enumTypeInstallationId: 1,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffeStockage2: 1,
      positionVolumeChauffeStockage3: 1,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 0, depensier: 0 },
        QdwColHVc: { conventionnel: 0, depensier: 0 },
        QgwRecuperable: 260
      }
    },
    {
      label: 'Installation collective avec générateur hors volume chauffé',
      enumTypeInstallationId: 2,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffeStockage2: 0,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 16.8, depensier: 30.24 },
        QdwColHVc: { conventionnel: 4.2, depensier: 7.56 },
        QgwRecuperable: 0
      }
    },
    {
      label: 'Installation collective avec 1 générateur en volume chauffé',
      enumTypeInstallationId: 2,
      positionVolumeChauffeStockage1: 0,
      positionVolumeChauffeStockage2: 0,
      positionVolumeChauffeStockage3: 1,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 16.8, depensier: 30.24 },
        QdwColHVc: { conventionnel: 4.2, depensier: 7.56 },
        QgwRecuperable: 0
      }
    },
    {
      label: 'Installation collective avec 2 générateurs en volume chauffé',
      enumTypeInstallationId: 2,
      positionVolumeChauffeStockage1: 1,
      positionVolumeChauffeStockage2: 1,
      positionVolumeChauffeStockage3: 0,
      expected: {
        QdwIndVc: { conventionnel: 15, depensier: 27 },
        QdwColVc: { conventionnel: 16.8, depensier: 30.24 },
        QdwColHVc: { conventionnel: 4.2, depensier: 7.56 },
        QgwRecuperable: 0
      }
    }
  ])(
    'Calcul des pertes de distribution et de stockage $label',
    ({
      enumTypeInstallationId,
      positionVolumeChauffeStockage1,
      positionVolumeChauffeStockage2,
      positionVolumeChauffe2 = undefined,
      positionVolumeChauffeStockage3,
      expected
    }) => {
      /** @type {InstallationEcs} */
      const installationEcs = {
        donnee_entree: { enum_type_installation_id: enumTypeInstallationId },
        generateur_ecs_collection: {
          generateur_ecs: [
            {
              donnee_entree: { position_volume_chauffe_stockage: positionVolumeChauffeStockage1 },
              donnee_utilisateur: { Qgw: 100 }
            },
            {
              donnee_entree: {
                position_volume_chauffe_stockage: positionVolumeChauffeStockage2,
                position_volume_chauffe: positionVolumeChauffe2
              },
              donnee_utilisateur: { Qgw: 120 }
            },
            {
              donnee_entree: { position_volume_chauffe_stockage: positionVolumeChauffeStockage3 },
              donnee_utilisateur: { Qgw: 140 }
            }
          ]
        }
      };

      service.pertesDistributionStockageEcsInstallation(installationEcs, 150, 270);

      expect(installationEcs.donnee_utilisateur.QdwIndVc.conventionnel).toBeCloseTo(
        expected.QdwIndVc.conventionnel,
        5
      );
      expect(installationEcs.donnee_utilisateur.QdwIndVc.depensier).toBeCloseTo(
        expected.QdwIndVc.depensier,
        5
      );
      expect(installationEcs.donnee_utilisateur.QdwColVc.conventionnel).toBeCloseTo(
        expected.QdwColVc.conventionnel,
        5
      );
      expect(installationEcs.donnee_utilisateur.QdwColVc.depensier).toBeCloseTo(
        expected.QdwColVc.depensier,
        5
      );
      expect(installationEcs.donnee_utilisateur.QdwColHVc.conventionnel).toBeCloseTo(
        expected.QdwColHVc.conventionnel,
        5
      );
      expect(installationEcs.donnee_utilisateur.QdwColHVc.depensier).toBeCloseTo(
        expected.QdwColHVc.depensier,
        5
      );
      expect(installationEcs.donnee_utilisateur.QgwRecuperable).toBeCloseTo(
        expected.QgwRecuperable,
        5
      );
    }
  );

  test("Determination du caractère individuelle de l'installation", () => {
    expect(service.isInstallationIndividuelle({ enum_type_installation_id: 1 })).toBeTruthy();
    expect(service.isInstallationIndividuelle({ enum_type_installation_id: 2 })).toBeFalsy();
    expect(service.isInstallationIndividuelle({ enum_type_installation_id: 3 })).toBeFalsy();
    expect(service.isInstallationIndividuelle({ enum_type_installation_id: 4 })).toBeFalsy();
  });

  describe("Test d'intégration des installations ECS", () => {
    test.each(corpus)('vérification des DI des installations ECS pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const installationsECS = structuredClone(
        dpeRequest.logement.installation_ecs_collection?.installation_ecs || []
      );
      service.execute(ctx, dpeRequest.logement, {
        besoin_ecs: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs,
        besoin_ecs_depensier: dpeRequest.logement.sortie.apport_et_besoin.besoin_ecs_depensier
      });

      installationsECS.forEach((installationECS, i) => {
        expect_or(
          () =>
            expect(installationECS.donnee_intermediaire.besoin_ecs).toBeCloseTo(
              dpeRequest.logement.installation_ecs_collection.installation_ecs[i]
                .donnee_intermediaire.besoin_ecs,
              2
            ),
          () =>
            expect(installationECS.donnee_intermediaire.besoin_ecs).toBeCloseTo(
              dpeRequest.logement.installation_ecs_collection.installation_ecs[i]
                .donnee_intermediaire.besoin_ecs * 1000,
              2
            )
        );
      });
    });
  });
});
