import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/enveloppe/baieVitreeTv.store.js';
import { ApportEtBesoinService } from './apport-et-besoin.service.js';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';
import { BesoinFroidService } from './froid/besoin-froid.service.js';
import { ApportGratuitService } from './apport_gratuit/apport-gratuit.service.js';
import { PerteEcsRecupService } from './ecs/perte-ecs-recup.service.js';
import { InstallationEcsService } from '../ecs/installation-ecs.service.js';

/** @type {SurfaceSudEquivalenteService} **/
let surfaceSudEquivalenteService;

/** @type {BesoinEcsService} **/
let besoinEcsService;

/** @type {BesoinFroidService} **/
let besoinFroidService;

/** @type {InstallationEcsService} **/
let installationEcsService;

/** @type {PerteEcsRecupService} **/
let perteEcsRecupService;

/** @type {ApportGratuitService} **/
let apportGratuitService;

/** @type {ApportEtBesoinService} **/
let service;

/** @type {BaieVitreeTvStore} **/
let tvStore;

describe('Calcul des apports et besoin du logement', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    surfaceSudEquivalenteService = new SurfaceSudEquivalenteService(tvStore);
    besoinEcsService = new BesoinEcsService();
    besoinFroidService = new BesoinFroidService();
    installationEcsService = new InstallationEcsService();
    perteEcsRecupService = new PerteEcsRecupService();
    apportGratuitService = new ApportGratuitService();
    service = new ApportEtBesoinService(
      besoinEcsService,
      installationEcsService,
      perteEcsRecupService,
      besoinFroidService,
      surfaceSudEquivalenteService,
      apportGratuitService
    );
  });

  test('Determination des apports et besoin du logement', () => {
    vi.spyOn(surfaceSudEquivalenteService, 'execute').mockReturnValue(18.5);
    vi.spyOn(besoinEcsService, 'execute').mockReturnValue({
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3
    });
    vi.spyOn(besoinFroidService, 'execute').mockReturnValue({
      besoin_fr: 896,
      besoin_fr_depensier: 1025.3
    });
    vi.spyOn(apportGratuitService, 'apportSolaire').mockReturnValue({
      apport_solaire_ch: 5236.9,
      apport_solaire_fr: 145.2
    });
    vi.spyOn(apportGratuitService, 'apportInterne').mockReturnValue({
      apport_interne_ch: 1236.9,
      apport_interne_fr: 3345.2
    });
    vi.spyOn(installationEcsService, 'execute').mockReturnThis();
    vi.spyOn(perteEcsRecupService, 'execute').mockReturnValue({
      pertes_distribution_ecs_recup: 354.2,
      pertes_distribution_ecs_recup_depensier: 532.6,
      pertes_stockage_ecs_recup: 25.9
    });

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 }, nadeq: 2.5 };
    /** @type { Logement } **/
    const logement = { enveloppe: {} };
    expect(service.execute(ctx, logement)).toStrictEqual({
      surface_sud_equivalente: 18.5,
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3,
      besoin_fr: 896,
      besoin_fr_depensier: 1025.3,
      apport_solaire_ch: 5236.9,
      apport_solaire_fr: 145.2,
      apport_interne_ch: 1236.9,
      apport_interne_fr: 3345.2,
      nadeq: 2.5,
      v40_ecs_journalier: 140,
      v40_ecs_journalier_depensier: 197.5,
      pertes_distribution_ecs_recup: 354.2,
      pertes_distribution_ecs_recup_depensier: 532.6,
      pertes_stockage_ecs_recup: 25.9
    });
    expect(surfaceSudEquivalenteService.execute).toHaveBeenCalledWith(ctx, logement.enveloppe);
    expect(besoinEcsService.execute).toHaveBeenCalledWith(ctx);
    expect(besoinFroidService.execute).toHaveBeenCalledWith(ctx, logement);
    expect(apportGratuitService.apportSolaire).toHaveBeenCalledWith(ctx, logement);
    expect(apportGratuitService.apportInterne).toHaveBeenCalledWith(ctx, logement);
  });
});
