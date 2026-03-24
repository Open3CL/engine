import { beforeEach, describe, expect, test, vi } from 'vitest';
import corpus from '../../../../../../test/corpus-sano.json';
import { expect_or, getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { mois_liste } from '../../../../../utils.js';
import { PerteChRecupService } from './perte-ch-recup.service.js';
import { BesoinChService } from './besoin-ch.service.js';
import { ApportGratuitService } from '../apport_gratuit/apport-gratuit.service.js';
import { PRECISION_PERCENT } from '../../../../../../test/constant.js';

/** @type {PerteChRecupService} **/
let service;

/** @type {BesoinChService} **/
let besoinChService;

/** @type {ApportGratuitService} **/
let apportGratuitService;

/** @type {FrTvStore} **/
let tvStore;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul des pertes de génération de chauffage récupérées', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new PerteChRecupService(tvStore);
    besoinChService = new BesoinChService();
    apportGratuitService = new ApportGratuitService();
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test.each([
    {
      label: 'Installation CH uniquement avec ventouse, utilisation de nref',
      enumUsageGenerateurId: 1,
      presenceVentouse: 1,
      expected: 562.5
    },
    {
      label: 'Installation CH uniquement sans ventouse, utilisation de nref',
      enumUsageGenerateurId: 1,
      presenceVentouse: 0,
      expected: 375
    },
    {
      label: "Installation CH uniquement sans ventouse, pas d'utilisation de nref",
      enumUsageGenerateurId: 1,
      presenceVentouse: 0,
      nref: 500,
      expected: 7971.08
    },
    {
      label: 'Installation ECS uniquement avec ventouse',
      enumUsageGenerateurId: 2,
      presenceVentouse: 1,
      expected: 114.94
    },
    {
      label: 'Installation ECS uniquement sans ventouse',
      enumUsageGenerateurId: 2,
      presenceVentouse: 0,
      expected: 76.627
    },
    {
      label: 'Installation ECS + CH avec ventouse, utilisation de nref',
      enumUsageGenerateurId: 3,
      presenceVentouse: 1,
      expected: 562.5
    },
    {
      label: 'Installation ECS + CH sans ventouse, utilisation de nref',
      enumUsageGenerateurId: 3,
      presenceVentouse: 0,
      expected: 375
    },
    {
      label: "Installation ECS + CH sans ventouse, pas d'utilisation de nref",
      enumUsageGenerateurId: 3,
      presenceVentouse: 0,
      nref: 450,
      expected: 10729.642
    }
  ])(
    'Calcul des pertes récupérées de génération pour le chauffage sur un mois pour $label',
    ({ enumUsageGenerateurId, presenceVentouse, nref = undefined, expected }) => {
      /** @type {GenerateurChauffage[]} */
      const generateurs = [
        {
          donnee_entree: {
            presence_ventouse: presenceVentouse,
            enum_usage_generateur_id: enumUsageGenerateurId
          },
          donnee_intermediaire: { pn: 25000, qp0: 125 }
        }
      ];

      expect(service.Qrec(generateurs, nref ?? 12.5, 1532.9)).toBeCloseTo(expected, 3);
    }
  );

  test('Filtre des générateurs avec pertes de génération', () => {
    const generateur1 = {
      donnee_entree: {}
    };
    const generateur2 = {
      donnee_entree: { position_volume_chauffe: 0, enum_type_generateur_ch_id: 45 }
    };
    const generateur3 = {
      donnee_entree: { position_volume_chauffe: 0, enum_type_generateur_ch_id: 50 }
    };
    const generateur4 = {
      donnee_entree: { position_volume_chauffe: 1, enum_type_generateur_ch_id: 50 }
    };
    const generateur5 = {
      donnee_entree: { position_volume_chauffe: 1, enum_type_generateur_ch_id: 48 }
    };

    /** @type {Logement} */
    let logement = { installation_chauffage_collection: {} };
    expect(service.generateursWithPertesGeneration(logement)).toStrictEqual([]);

    logement.installation_chauffage_collection = { installation_chauffage: [] };
    expect(service.generateursWithPertesGeneration(logement)).toStrictEqual([]);

    logement.installation_chauffage_collection = {
      installation_chauffage: [{ generateur_chauffage_collection: {} }]
    };
    expect(service.generateursWithPertesGeneration(logement)).toStrictEqual([]);

    logement.installation_chauffage_collection = {
      installation_chauffage: [{ generateur_chauffage_collection: { generateur_chauffage: [] } }]
    };
    expect(service.generateursWithPertesGeneration(logement)).toStrictEqual([]);

    logement.installation_chauffage_collection = {
      installation_chauffage: [
        {
          generateur_chauffage_collection: {
            generateur_chauffage: [generateur1, generateur2, generateur3]
          }
        },
        { generateur_chauffage_collection: { generateur_chauffage: [generateur4, generateur5] } }
      ]
    };
    expect(service.generateursWithPertesGeneration(logement)).toStrictEqual([generateur5]);
  });

  test.each([
    {
      label: 'Installation CH en mode conventionnel',
      depensier: false,
      expected: 288
    },
    {
      label: 'Installation CH en mode dépensier',
      depensier: true,
      expected: 540
    }
  ])('Pertes de chauffage récupérées pour $label', ({ depensier, expected }) => {
    vi.spyOn(tvStore, 'getData').mockReturnValue(depensier ? 1.5 : 0.8);

    /** @type {Contexte} */
    const ctx = {
      altitude: { value: '400-800m' },
      zoneClimatique: { value: 'h1a' },
      inertie: { ilpa: 1 }
    };

    /** @type {Logement} */
    const logement = {
      installation_chauffage_collection: {
        installation_chauffage: [
          {
            generateur_chauffage_collection: {
              generateur_chauffage: [
                {
                  donnee_entree: {
                    position_volume_chauffe: 1,
                    enum_type_generateur_ch_id: 48,
                    enum_usage_generateur_id: 1
                  },
                  donnee_intermediaire: { pn: 25000, qp0: 125 }
                }
              ]
            }
          }
        ]
      },
      donnees_de_calcul: {
        besoinChauffageHP: {
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
        besoinChauffageDepensierHP: {
          Janvier: 112.5,
          Février: 112.5,
          Mars: 112.5,
          Avril: 112.5,
          Mai: 112.5,
          Juin: 112.5,
          Juillet: 112.5,
          Aout: 112.5,
          Septembre: 112.5,
          Octobre: 112.5,
          Novembre: 112.5,
          Décembre: 112.5
        }
      }
    };

    expect(service.pertesGenerateurChRecup(ctx, logement, depensier)).toBeCloseTo(expected, 3);
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

  describe("Test d'intégration des installations CH", () => {
    test.each(corpus)('vérification des pertes de génération ch pour dpe %s', (ademeId) => {
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
      apportGratuitService.apportInterne(ctx, dpeRequest.logement);
      apportGratuitService.apportSolaire(ctx, dpeRequest.logement);
      besoinChService.execute(ctx, dpeRequest.logement);
      const pertesGeneration = service.execute(ctx, dpeRequest.logement);

      const expectedValue = dpeRequest.logement.sortie.apport_et_besoin.pertes_generateur_ch_recup;
      const calculatedValue = pertesGeneration.pertes_generateur_ch_recup;

      expect_or(
        () =>
          expect(Math.abs(calculatedValue - expectedValue) / (expectedValue || 1)).toBeLessThan(
            PRECISION_PERCENT
          ),
        () =>
          expect(
            Math.abs(calculatedValue - expectedValue * 1000) / (expectedValue * 1000 || 1)
          ).toBeLessThan(PRECISION_PERCENT)
      );
    });

    test.each(corpus)(
      'vérification des pertes de génération ch depensier des installations CH pour dpe %s',
      (ademeId) => {
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
        apportGratuitService.apportInterne(ctx, dpeRequest.logement);
        apportGratuitService.apportSolaire(ctx, dpeRequest.logement);
        besoinChService.execute(ctx, dpeRequest.logement);
        const pertesGeneration = service.execute(ctx, dpeRequest.logement);

        const expectedValue =
          dpeRequest.logement.sortie.apport_et_besoin.pertes_generateur_ch_recup_depensier;
        const calculatedValue = pertesGeneration.pertes_generateur_ch_recup_depensier;

        expect_or(
          () =>
            expect(Math.abs(calculatedValue - expectedValue) / (expectedValue || 1)).toBeLessThan(
              PRECISION_PERCENT
            ),
          () =>
            expect(
              Math.abs(calculatedValue - expectedValue * 1000) / (expectedValue * 1000 || 1)
            ).toBeLessThan(PRECISION_PERCENT)
        );
      }
    );
  });
});
