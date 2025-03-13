import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ChTvStore } from '../../../dpe/infrastructure/ch/chTv.store.js';
import { EmetteurChService } from './emetteur-ch.service.js';

/** @type {EmetteurChService} **/
let service;

/** @type {ChTvStore} **/
let chTvStore;

describe('Calcul des caractéristiques des générateurs de chauffage', () => {
  beforeEach(() => {
    chTvStore = new ChTvStore();
    service = new EmetteurChService(chTvStore);
  });

  test("Determination de l'année d'installation des emetteurs", () => {
    /** @type {EmetteurChauffage} **/
    const emetteurChauffage = {
      donnee_entree: {}
    };

    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1850 }, emetteurChauffage)
    ).toBe(1);
    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1985 }, emetteurChauffage)
    ).toBe(2);
    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 2002 }, emetteurChauffage)
    ).toBe(3);

    emetteurChauffage.donnee_entree.enum_periode_installation_emetteur_id = 3;

    expect(
      service.periodeInstallationEmetteur({ anneeConstruction: 1850 }, emetteurChauffage)
    ).toBe(3);
  });

  test('Détermination des températures de fonctionnement à 30 et 100% de charge', () => {
    vi.spyOn(chTvStore, 'temperatureFonctionnement')
      .mockReturnValueOnce(25)
      .mockReturnValueOnce(32)
      .mockReturnValueOnce(27)
      .mockReturnValueOnce(31);

    vi.spyOn(chTvStore, 'temperatureFonctionnement').mockReturnValue(32);
    /** @type {GenerateurChauffageDE} */
    const generateurChauffageDE = {
      enum_type_generateur_ch_id: 80
    };

    /** @type {EmetteurChauffage[]} */
    const emetteursChauffage = [
      {
        donnee_entree: { enum_temp_distribution_ch_id: 1 }
      },
      {
        donnee_entree: { enum_temp_distribution_ch_id: 2, enum_periode_installation_emetteur_id: 1 }
      },
      {
        donnee_entree: { enum_temp_distribution_ch_id: 2, enum_periode_installation_emetteur_id: 2 }
      }
    ];

    expect(
      service.temperatureFonctionnement({}, generateurChauffageDE, emetteursChauffage)
    ).toStrictEqual({
      temp_fonc_30: 27,
      temp_fonc_100: 32
    });
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledTimes(4);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('30', 80, 2, 1);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('100', 80, 2, 1);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('30', 80, 2, 2);
    expect(chTvStore.temperatureFonctionnement).toHaveBeenCalledWith('100', 80, 2, 2);
  });
});
