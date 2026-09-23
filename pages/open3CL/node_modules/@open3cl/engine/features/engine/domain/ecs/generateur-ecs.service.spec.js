import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GenerateurEcsService } from './generateur-ecs.service.js';
import { EcsTvStore } from '../../../dpe/infrastructure/ecs/ecsTv.store.js';
import { TypeStockage } from '../../../dpe/domain/models/type-stockage.model.js';

/** @type {GenerateurEcsService} **/
let service;

/** @type {EcsTvStore} **/
let tvStore;

describe('Calcul des informations techniques des générateurs ECS', () => {
  beforeEach(() => {
    tvStore = new EcsTvStore();
    service = new GenerateurEcsService(tvStore);
  });

  describe("Calcul des pertes de stockage d'un générateur", () => {
    test.each([
      {
        label: 'Générateur ECS avec production instantanée',
        enumTypeGenerateurEcsId: 1,
        enumTypeStockageEcsId: 1,
        volumeStockage: 100,
        expected: 0
      },
      {
        label: 'Générateur ECS avec stockage intégré au générateur',
        enumTypeGenerateurEcsId: 1,
        enumTypeStockageEcsId: 2,
        volumeStockage: 100,
        expected: 851814.11
      },
      {
        label: 'Générateur ECS électrique avec stockage indépendant de 100L',
        enumTypeGenerateurEcsId: 2,
        enumTypeStockageEcsId: 3,
        electrique: true,
        volumeStockage: 250,
        expected: 1288800
      },
      {
        label: 'Générateur ECS à gaz avec stockage indépendant de 200L',
        enumTypeGenerateurEcsId: 1,
        enumTypeStockageEcsId: 3,
        volumeStockage: 200,
        expected: 1247128.86
      }
    ])(
      '$label',
      ({
        enumTypeGenerateurEcsId,
        volumeStockage,
        enumTypeStockageEcsId,
        electrique = false,
        expected
      }) => {
        vi.spyOn(tvStore, 'getPertesStockage').mockReturnValue(0.32);
        vi.spyOn(tvStore, 'getElectriqueEcsGenerateurs').mockReturnValue([2]);

        /** @type {GenerateurEcsDE} */
        const generateurEcsDE = {
          enum_type_generateur_ecs_id: enumTypeGenerateurEcsId,
          volume_stockage: volumeStockage,
          enum_type_stockage_ecs_id: enumTypeStockageEcsId
        };

        const pertesStockage = service.pertesStockage(generateurEcsDE);

        if (electrique) {
          expect(tvStore.getPertesStockage).toHaveBeenCalledWith(
            enumTypeGenerateurEcsId,
            volumeStockage
          );
        }
        expect(pertesStockage).toBeCloseTo(expected, 2);
      }
    );

    test('Ajout des données utilisateurs sur tous les générateurs', () => {
      /** @type {InstallationEcs} */
      const installationsEcs = {
        generateur_ecs_collection: {
          generateur_ecs: [
            {
              donnee_entree: {
                enum_type_stockage_ecs_id: 2,
                enum_type_energie_id: 2,
                volume_stockage: 100
              }
            },
            {
              donnee_entree: {
                enum_type_stockage_ecs_id: 2,
                enum_type_energie_id: 2,
                volume_stockage: 150
              }
            },
            {
              donnee_entree: {
                enum_type_stockage_ecs_id: 1,
                enum_type_energie_id: 2,
                volume_stockage: 150
              }
            }
          ]
        }
      };

      service.execute(installationsEcs);

      expect(
        installationsEcs.generateur_ecs_collection.generateur_ecs[0].donnee_utilisateur.Qgw
      ).toBeCloseTo(851814.112128, 2);
      expect(
        installationsEcs.generateur_ecs_collection.generateur_ecs[1].donnee_utilisateur.Qgw
      ).toBeCloseTo(1064620.98719, 2);
      expect(
        installationsEcs.generateur_ecs_collection.generateur_ecs[2].donnee_utilisateur.Qgw
      ).toBe(0);
    });
  });

  test("Determination du type d'énergie électrique du générateur", () => {
    vi.spyOn(tvStore, 'getElectriqueEcsGenerateurs').mockReturnValue([1]);
    expect(service.generateurElectrique({ enum_type_generateur_ecs_id: 1 })).toBeTruthy();
    expect(service.generateurElectrique({ enum_type_generateur_ecs_id: 2 })).toBeFalsy();
    expect(tvStore.getElectriqueEcsGenerateurs).toHaveBeenCalled();
  });

  test('Determination du type de stockage du générateur', () => {
    expect(service.typeStockage({ enum_type_stockage_ecs_id: 1 })).toBe(TypeStockage.INSTANTANE);
    expect(service.typeStockage({ enum_type_stockage_ecs_id: 2 })).toBe(TypeStockage.INDEPENDANT);
    expect(service.typeStockage({ enum_type_stockage_ecs_id: 3 })).toBe(TypeStockage.INTEGRE);
  });
});
