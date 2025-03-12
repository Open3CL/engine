import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SurfaceSudEquivalenteService } from './surface-sud-equivalente.service.js';
import { BaieVitreeTvStore } from '../../../dpe/infrastructure/enveloppe/baieVitreeTv.store.js';
import { ApportEtBesoinService } from './apport-et-besoin.service.js';
import { BesoinEcsService } from './ecs/besoin-ecs.service.js';
import { BesoinFroidService } from './froid/besoin-froid.service.js';
import { ApportGratuitService } from './apport_gratuit/apport-gratuit.service.js';
import { PerteEcsRecupService } from './ecs/perte-ecs-recup.service.js';
import { InstallationEcsService } from '../ecs/installation-ecs.service.js';
import { PerteChRecupService } from './ch/perte-ch-recup.service.js';
import { BesoinChService } from './ch/besoin-ch.service.js';
import corpus from '../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { PRECISION_PERCENT } from '../../../../../test/constant.js';
import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../contexte.builder.js';
import { InstallationChService } from '../ch/installation-ch.service.js';

/** @type {SurfaceSudEquivalenteService} **/
let surfaceSudEquivalenteService;

/** @type {BesoinEcsService} **/
let besoinEcsService;

/** @type {BesoinFroidService} **/
let besoinFroidService;

/** @type {InstallationEcsService} **/
let installationEcsService;

/** @type {InstallationChService} **/
let installationChService;

/** @type {PerteEcsRecupService} **/
let perteEcsRecupService;

/** @type {ApportGratuitService} **/
let apportGratuitService;

/** @type {PerteChRecupService} **/
let perteChRecupService;

/** @type {BesoinChService} **/
let besoinChService;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {ApportEtBesoinService} **/
let service;

/** @type {BaieVitreeTvStore} **/
let tvStore;

describe('Calcul des apports et besoin du logement', () => {
  beforeEach(() => {
    tvStore = new BaieVitreeTvStore();
    surfaceSudEquivalenteService = new SurfaceSudEquivalenteService(tvStore);
    besoinEcsService = new BesoinEcsService();
    besoinChService = new BesoinChService();
    besoinFroidService = new BesoinFroidService();
    installationEcsService = new InstallationEcsService();
    installationChService = new InstallationChService();
    perteEcsRecupService = new PerteEcsRecupService();
    apportGratuitService = new ApportGratuitService();
    perteChRecupService = new PerteChRecupService();
    service = new ApportEtBesoinService(
      besoinEcsService,
      besoinChService,
      installationEcsService,
      installationChService,
      perteEcsRecupService,
      besoinFroidService,
      surfaceSudEquivalenteService,
      perteChRecupService,
      apportGratuitService
    );
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test('Determination des apports et besoin du logement', () => {
    vi.spyOn(surfaceSudEquivalenteService, 'execute').mockReturnValue(18.5);
    vi.spyOn(besoinEcsService, 'execute').mockReturnValue({
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3
    });
    vi.spyOn(besoinChService, 'execute').mockReturnValue({
      besoin_ch_hp: 2563,
      besoin_ch_depensier_hp: 3258.6
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
    vi.spyOn(installationChService, 'execute').mockReturnThis();
    vi.spyOn(perteEcsRecupService, 'execute').mockReturnValue({
      pertes_distribution_ecs_recup: 354.2,
      pertes_distribution_ecs_recup_depensier: 532.6,
      pertes_stockage_ecs_recup: 25.9,
      pertes_stockage_ecs_recup_depensier: 12.9
    });
    vi.spyOn(perteChRecupService, 'execute').mockReturnValue({
      pertes_generateur_ch_recup: 102.2,
      pertes_generateur_ch_recup_depensier: 153.4
    });

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 }, nadeq: 2.5 };
    /** @type { Logement } **/
    const logement = { enveloppe: {} };
    expect(service.execute(ctx, logement)).toStrictEqual({
      surface_sud_equivalente: 18.5,
      besoin_ecs: 1526,
      besoin_ecs_depensier: 2685.3,
      besoin_ch: 2080.7000000000003,
      besoin_ch_depensier: 2559.7,
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
      pertes_generateur_ch_recup: 102.2,
      pertes_generateur_ch_recup_depensier: 153.4,
      pertes_stockage_ecs_recup: 25.9,
      pertes_stockage_ecs_recup_depensier: 12.9
    });
    expect(surfaceSudEquivalenteService.execute).toHaveBeenCalledWith(ctx, logement.enveloppe);
    expect(besoinEcsService.execute).toHaveBeenCalledWith(ctx);
    expect(besoinFroidService.execute).toHaveBeenCalledWith(ctx, logement);
    expect(apportGratuitService.apportSolaire).toHaveBeenCalledWith(ctx, logement);
    expect(apportGratuitService.apportInterne).toHaveBeenCalledWith(ctx, logement);
  });

  describe("Test d'intégration pour les besoins en chauffage", () => {
    test.each(corpus)(
      'Vérification de la DI besoin_ch des besoins en chauffage pour dpe %s',
      (ademeId) => {
        /**
         * @type {Dpe}
         */
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        dpeRequest.logement.donnees_de_calcul = {
          apportsInterneDepensier: [],
          apportsInterneCh: [],
          apportsSolaire: [],
          besoinChauffageHP: [],
          besoinChauffageDepensierHP: []
        };

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);
        const apportEtBesoin = service.execute(ctx, dpeRequest.logement);

        expect(
          Math.abs(
            apportEtBesoin.besoin_ch - dpeRequest.logement.sortie.apport_et_besoin.besoin_ch
          ) / (dpeRequest.logement.sortie.apport_et_besoin.besoin_ch || 1)
        ).toBeLessThan(PRECISION_PERCENT);
      }
    );

    test.each(corpus)(
      'Vérification de la DI besoin_ch_depensier des besoins en chauffage pour dpe %s',
      (ademeId) => {
        /**
         * @type {Dpe}
         */
        let dpeRequest = getAdemeFileJson(ademeId);
        dpeRequest = normalizerService.normalize(dpeRequest);

        dpeRequest.logement.donnees_de_calcul = {
          apportsInterneDepensier: [],
          apportsInterneCh: [],
          apportsSolaire: [],
          besoinChauffageHP: [],
          besoinChauffageDepensierHP: []
        };

        /** @type {Contexte} */
        const ctx = contexteBuilder.fromDpe(dpeRequest);

        const apportEtBesoin = service.execute(ctx, dpeRequest.logement);

        expect(
          Math.abs(
            apportEtBesoin.besoin_ch_depensier -
              dpeRequest.logement.sortie.apport_et_besoin.besoin_ch_depensier
          ) / (dpeRequest.logement.sortie.apport_et_besoin.besoin_ch_depensier || 1)
        ).toBeLessThan(PRECISION_PERCENT);
      }
    );
  });
});
