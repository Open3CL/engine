import { beforeEach, describe, expect, test, vi } from 'vitest';
import { InstallationChService } from './installation-ch.service.js';
import { GenerateurChService } from './generateur-ch.service.js';

/** @type {InstallationChService} **/
let service;

/** @type {GenerateurChService} **/
let generateurChService;

describe('Calcul des installations de chauffage', () => {
  beforeEach(() => {
    generateurChService = new GenerateurChService();
    service = new InstallationChService(generateurChService);
  });

  test('Calcul des données des générateurs de chaque installation de chauffage', () => {
    vi.spyOn(generateurChService, 'execute').mockReturnThis();

    /** @type {InstallationChauffage} */
    const installationCh = {
      donnee_entree: { enum_type_installation_id: 1 },
      generateur_chauffage_collection: {
        generateur_chauffage: [{ donnee_entree: { position_volume_chauffe_stockage: 1 } }]
      }
    };

    /** @type {Logement} */
    const logement = {
      installation_chauffage_collection: { installation_chauffage: [installationCh] }
    };

    service.execute(logement);
    expect(generateurChService.execute).toHaveBeenCalledWith(installationCh);
  });
});
