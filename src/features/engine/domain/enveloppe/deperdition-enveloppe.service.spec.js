import { DeperditionEnveloppeService } from './deperdition-enveloppe.service.js';
import corpus from '../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../test/test-helpers.js';
import { ContexteBuilder } from '../contexte.builder.js';
import { DeperditionPlancherBasService } from './plancher_bas/deperdition-plancher-bas.service.js';
import { DeperditionMurService } from './mur/deperdition-mur.service.js';
import { DeperditionPorteService } from './porte/deperdition-porte.service.js';
import { DeperditionPlancherHautService } from './plancher_haut/deperdition-plancher-haut.service.js';
import { DpeNormalizerService } from '../../../normalizer/domain/dpe-normalizer.service.js';
import { TvStore } from '../../../dpe/infrastructure/tv.store.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import b from '../../../../3.1_b.js';
import { describeIntegration } from '../../../../../test/helpers/integration-test.js';

/** @type {DeperditionPorteService} **/
let deperditionPorteService;

/** @type {DeperditionMurService} **/
let deperditionMurService;

/** @type {DeperditionPlancherBasService} **/
let deperditionPlancherBasService;

/** @type {DeperditionPlancherHautService} **/
let deperditionPlancherHautService;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {TvStore} **/
let tvStore;

/** @type {DeperditionEnveloppeService} **/
let service;

describe('Calcul des déperditions', () => {
  beforeEach(() => {
    tvStore = new TvStore();
    deperditionPorteService = new DeperditionPorteService(tvStore);
    deperditionMurService = new DeperditionMurService(tvStore);
    deperditionPlancherBasService = new DeperditionPlancherBasService(tvStore);
    deperditionPlancherHautService = new DeperditionPlancherHautService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();

    service = new DeperditionEnveloppeService(
      deperditionMurService,
      deperditionPorteService,
      deperditionPlancherBasService,
      deperditionPlancherHautService
    );
  });

  describe('Détermination du coefficient de réduction des déperditions b', () => {
    test.each([
      { enumTypeAdjacenceId: '1', label: 'extérieur', bExpected: 1 },
      { enumTypeAdjacenceId: '2', label: 'paroi enterrée', bExpected: 1 },
      { enumTypeAdjacenceId: '3', label: 'vide sanitaire', bExpected: 1 },
      {
        enumTypeAdjacenceId: '4',
        label: "bâtiment ou local à usage autre que d'habitation",
        bExpected: 0.2
      },
      { enumTypeAdjacenceId: '5', label: 'terre-plein', bExpected: 1 },
      { enumTypeAdjacenceId: '6', label: 'sous-sol non chauffé', bExpected: 1 },
      {
        enumTypeAdjacenceId: '7',
        enumCfgIsolationLncId: '1',
        label: 'locaux non chauffés non accessible',
        bExpected: 0.95
      },
      {
        enumTypeAdjacenceId: '8',
        surfaceAiu: 14.75,
        surfaceAue: 300,
        enumCfgIsolationLncId: '2',
        label: 'garage',
        bExpected: 0.9
      },
      {
        enumTypeAdjacenceId: '9',
        surfaceAiu: 8.14,
        surfaceAue: 22.8,
        enumCfgIsolationLncId: '4',
        label: 'cellier',
        bExpected: 0.95
      },
      {
        enumTypeAdjacenceId: '10',
        surfaceAiu: 8.14,
        surfaceAue: 22.8,
        enumCfgIsolationLncId: '9',
        label: 'espace tampon solarisé (véranda,loggia fermée)',
        bExpected: undefined
      },
      {
        enumTypeAdjacenceId: '10',
        surfaceAiu: 8.14,
        surfaceAue: 22.8,
        zoneClimatique: 'h2c',
        enumCfgIsolationLncId: '9',
        label: 'espace tampon solarisé (véranda,loggia fermée)',
        bExpected: 0.85
      },
      {
        enumTypeAdjacenceId: '11',
        surfaceAiu: 50.2,
        surfaceAue: 60,
        enumCfgIsolationLncId: '4',
        label: 'comble fortement ventilé',
        bExpected: 0.95
      },
      {
        enumTypeAdjacenceId: '12',
        surfaceAiu: 74,
        surfaceAue: 110,
        enumCfgIsolationLncId: '4',
        label: 'comble faiblement ventilé',
        bExpected: 0.95
      },
      {
        enumTypeAdjacenceId: '13',
        surfaceAiu: 30,
        surfaceAue: 45,
        enumCfgIsolationLncId: '2',
        label: 'comble très faiblement ventilé',
        bExpected: 0.65
      },
      {
        enumTypeAdjacenceId: '14',
        surfaceAiu: 22,
        surfaceAue: 15,
        enumCfgIsolationLncId: '2',
        label: "circulation sans ouverture directe sur l'extérieur",
        bExpected: 0.35
      },
      {
        enumTypeAdjacenceId: '15',
        surfaceAiu: 20,
        surfaceAue: 2.5,
        enumCfgIsolationLncId: '2',
        label: "circulation avec ouverture directe sur l'extérieur",
        bExpected: 0.15
      },
      {
        enumTypeAdjacenceId: '16',
        surfaceAiu: 120,
        surfaceAue: 300,
        enumCfgIsolationLncId: '3',
        label: 'circulation avec bouche ou gaine de désenfumage ouverte en permanence',
        bExpected: 0.7
      },
      {
        enumTypeAdjacenceId: '17',
        label: "hall d'entrée avec dispositif de fermeture automatique",
        bExpected: 0
      },
      {
        enumTypeAdjacenceId: '18',
        surfaceAiu: 335.22,
        surfaceAue: 29.18,
        enumCfgIsolationLncId: '2',
        label: "hall d'entrée sans dispositif de fermeture automatique",
        bExpected: 0.15
      },
      {
        enumTypeAdjacenceId: '19',
        surfaceAiu: 49,
        surfaceAue: 65,
        enumCfgIsolationLncId: '2',
        label: 'garage privé collectif',
        bExpected: 0.7
      },
      {
        enumTypeAdjacenceId: '20',
        label: "local tertiaire à l'intérieur de l'immeuble en contact avec l'appartement",
        bExpected: 0.2
      },
      {
        enumTypeAdjacenceId: '21',
        surfaceAiu: 4.94,
        surfaceAue: 8.8,
        enumCfgIsolationLncId: '2',
        label: 'autres dépendances',
        bExpected: 0.75
      },
      {
        enumTypeAdjacenceId: '22',
        label: "local non déperditif (local à usage d'habitation chauffé)",
        bExpected: 0
      }
    ])(
      '$label (id:$enumTypeAdjacenceId)',
      ({
        enumTypeAdjacenceId,
        surfaceAiu = undefined,
        surfaceAue = undefined,
        zoneClimatique = undefined,
        enumCfgIsolationLncId = undefined,
        bExpected
      }) => {
        const data = {
          enumTypeAdjacenceId,
          surfaceAiu,
          surfaceAue,
          enumCfgIsolationLncId,
          zoneClimatique
        };

        const b = deperditionMurService.b(data);
        expect(b).toBe(bExpected);
      }
    );
  });

  describe('deperditions (agrégation GV + ventilation) avec des doubles de test', () => {
    /**
     * Construit un service avec huit doubles de test dont la méthode `execute`
     * renvoie le `__di` (donnée intermédiaire) attaché à chaque donnée d'entrée.
     */
    const buildService = () => {
      const murService = { execute: vi.fn((ctx, de) => de.__di) };
      const porteService = { execute: vi.fn((ctx, de) => de.__di) };
      const plancherBasService = { execute: vi.fn((ctx, de) => de.__di) };
      const plancherHautService = { execute: vi.fn((ctx, de) => de.__di) };
      const baieVitreeService = { execute: vi.fn((ctx, bv) => bv.donnee_entree.__di) };
      const espaceTamponService = { execute: vi.fn(() => ({ tag: 'ets-di' })) };
      const pontThermiqueService = { execute: vi.fn((ctx, env, de) => de.__di) };
      const ventilationService = { execute: vi.fn((ctx, de) => de.__di) };

      const service = new DeperditionEnveloppeService(
        murService,
        porteService,
        plancherBasService,
        plancherHautService,
        baieVitreeService,
        espaceTamponService,
        pontThermiqueService,
        ventilationService
      );

      return {
        service,
        murService,
        porteService,
        plancherBasService,
        plancherHautService,
        baieVitreeService,
        espaceTamponService,
        pontThermiqueService,
        ventilationService
      };
    };

    test('somme les contributions de chaque paroi et alimente la ventilation avec les surfaces', () => {
      const { service, espaceTamponService, ventilationService } = buildService();

      const enveloppe = {
        mur_collection: {
          mur: [
            {
              // déperditif, isolé "connu" (1) => surfaceNonIsolee
              donnee_entree: {
                surface_paroi_opaque: 10,
                enum_type_adjacence_id: '1',
                enum_type_isolation_id: '1',
                __di: { b: 0.5, umur: 2 }
              }
            },
            {
              // b > 0 mais adjacence 22 (local non déperditif) => non compté en surface déperditive,
              // isolation hors ['1','2'] => surfaceIsolee
              donnee_entree: {
                surface_paroi_opaque: 20,
                enum_type_adjacence_id: '22',
                enum_type_isolation_id: '3',
                __di: { b: 0.8, umur: 1 }
              }
            },
            {
              // b = 0 => aucune surface comptée
              donnee_entree: {
                surface_paroi_opaque: 5,
                enum_type_adjacence_id: '1',
                enum_type_isolation_id: '2',
                __di: { b: 0, umur: 3 }
              }
            }
          ]
        },
        porte_collection: {
          porte: [
            {
              donnee_entree: {
                surface_porte: 2,
                presence_joint: true,
                __di: { b: 0.5, uporte: 3 }
              }
            },
            {
              donnee_entree: {
                surface_porte: 4,
                presence_joint: false,
                __di: { b: 0, uporte: 2 }
              }
            }
          ]
        },
        plancher_bas_collection: {
          plancher_bas: [
            {
              donnee_entree: {
                surface_paroi_opaque: 8,
                __di: { b: 0.9, upb_final: 1.5 }
              }
            }
          ]
        },
        plancher_haut_collection: {
          plancher_haut: [
            {
              donnee_entree: {
                surface_paroi_opaque: 12,
                enum_type_adjacence_id: '1',
                enum_type_isolation_id: '1',
                __di: { b: 0.7, uph: 1 }
              }
            },
            {
              donnee_entree: {
                surface_paroi_opaque: 6,
                enum_type_adjacence_id: '22',
                enum_type_isolation_id: '5',
                __di: { b: 0.5, uph: 2 }
              }
            },
            {
              donnee_entree: {
                surface_paroi_opaque: 3,
                enum_type_adjacence_id: '1',
                enum_type_isolation_id: '1',
                __di: { b: 0, uph: 1 }
              }
            }
          ]
        },
        baie_vitree_collection: {
          baie_vitree: [
            {
              donnee_entree: {
                surface_totale_baie: 5,
                presence_joint: true,
                __di: { b: 0.6, u_menuiserie: 2 }
              }
            },
            {
              donnee_entree: {
                surface_totale_baie: 3,
                presence_joint: false,
                __di: { b: 0, u_menuiserie: 1 }
              }
            }
          ]
        },
        ets_collection: {
          ets: { donnee_entree: {} }
        },
        pont_thermique_collection: {
          pont_thermique: [
            {
              // pourcentage explicite
              donnee_entree: { l: 4, pourcentage_valeur_pont_thermique: 0.5, __di: { k: 0.2 } }
            },
            {
              // pourcentage absent => 1 par défaut
              donnee_entree: { l: 2, __di: { k: 0.3 } }
            }
          ]
        }
      };

      const logement = {
        enveloppe,
        ventilation_collection: {
          ventilation: [{ donnee_entree: { __di: { hvent: 100, hperm: 50 } } }]
        }
      };

      const ctx = { zoneClimatique: { value: 'h1a' } };
      const resultat = service.deperditions(ctx, logement);

      // Contributions GV (b * surface * u)
      expect(resultat.deperdition_mur).toBeCloseTo(0.5 * 10 * 2 + 0.8 * 20 * 1 + 0, 9); // 26
      expect(resultat.deperdition_porte).toBeCloseTo(0.5 * 2 * 3, 9); // 3
      expect(resultat.deperdition_plancher_bas).toBeCloseTo(0.9 * 8 * 1.5, 9); // 10.8
      expect(resultat.deperdition_plancher_haut).toBeCloseTo(0.7 * 12 * 1 + 0.5 * 6 * 2, 9); // 14.4
      expect(resultat.deperdition_baie_vitree).toBeCloseTo(0.6 * 5 * 2, 9); // 6
      expect(resultat.deperdition_pont_thermique).toBeCloseTo(4 * 0.2 * 0.5 + 2 * 0.3 * 1, 9); // 1
      expect(resultat.hvent).toBe(100);
      expect(resultat.hperm).toBe(50);

      // deperdition_enveloppe = somme GV + hvent + hperm
      expect(resultat.deperdition_enveloppe).toBeCloseTo(
        26 + 3 + 10.8 + 14.4 + 6 + 1 + 100 + 50,
        9
      );

      // L'espace tampon a bien été calculé et stocké
      expect(espaceTamponService.execute).toHaveBeenCalledOnce();
      expect(enveloppe.ets_collection.ets.donnee_intermediaire).toStrictEqual({ tag: 'ets-di' });

      // La ventilation reçoit les surfaces agrégées :
      // déperditive = 10 (mur A) + 2 (porte A) + 12 (ph A) + 5 (baie A) = 29
      // isolée = 20 (mur B) + 6 (ph B) = 26
      // non isolée = 10 (mur A) + 12 (ph A) = 22
      // menuiserie avec joint = 2 (porte A) + 5 (baie A) = 7
      // menuiserie sans joint = 4 (porte B) + 3 (baie B) = 7
      expect(ventilationService.execute).toHaveBeenCalledWith(
        ctx,
        { __di: { hvent: 100, hperm: 50 } },
        29,
        26,
        22,
        7,
        7
      );
    });

    test('utilise la première véranda lorsque les ETS sont dupliqués (tableau)', () => {
      const { service, espaceTamponService } = buildService();

      const premierEts = { donnee_entree: { reference: 'ets-1' } };
      const enveloppe = {
        mur_collection: {},
        porte_collection: {},
        plancher_bas_collection: {},
        plancher_haut_collection: {},
        baie_vitree_collection: {},
        ets_collection: { ets: [premierEts, { donnee_entree: { reference: 'ets-2' } }] },
        pont_thermique_collection: {}
      };
      const logement = { enveloppe, ventilation_collection: {} };

      service.deperditions({ zoneClimatique: { value: 'h1a' } }, logement);

      // Seule la première véranda est traitée
      expect(espaceTamponService.execute).toHaveBeenCalledOnce();
      expect(premierEts.donnee_intermediaire).toStrictEqual({ tag: 'ets-di' });
    });

    test('renvoie des déperditions nulles pour une enveloppe et une ventilation vides', () => {
      const { service, espaceTamponService, ventilationService } = buildService();

      const enveloppe = {
        mur_collection: {},
        porte_collection: {},
        plancher_bas_collection: {},
        plancher_haut_collection: {},
        baie_vitree_collection: {},
        pont_thermique_collection: {}
      };
      const logement = { enveloppe, ventilation_collection: {} };

      const resultat = service.deperditions({ zoneClimatique: { value: 'h1a' } }, logement);

      // Aucune paroi, aucun ETS, aucune ventilation
      expect(espaceTamponService.execute).not.toHaveBeenCalled();
      expect(ventilationService.execute).not.toHaveBeenCalled();
      expect(resultat).toStrictEqual({
        deperdition_mur: 0,
        deperdition_plancher_bas: 0,
        deperdition_plancher_haut: 0,
        deperdition_baie_vitree: 0,
        deperdition_pont_thermique: 0,
        deperdition_porte: 0,
        hperm: 0,
        hvent: 0,
        deperdition_enveloppe: 0
      });
    });
  });

  describe.skip('Benchmark', () => {
    test('reworked', () => {
      const data = {
        enumTypeAdjacenceId: '8',
        surfaceAiu: 2.82,
        surfaceAue: 300,
        enumCfgIsolationLncId: '2',
        label: 'garage'
      };

      for (let i = 0; i < 1000; i++) {
        const b = deperditionMurService.b(data);
        expect(b).toBe(0.9);
      }
    });

    test('legacy', () => {
      const di = { b: undefined };
      const de = {
        enum_type_adjacence_id: '8',
        surface_aiu: 2.82,
        surface_aue: 300,
        enum_cfg_isolation_lnc_id: '2'
      };
      const du = {};
      const zc = '1';

      for (let i = 0; i < 1000; i++) {
        b(di, de, du, zc);
        expect(di.b).toBe(0.9);
      }
    });
  });

  describeIntegration("Test d'intégration de calcul des deperditions", () => {
    test.each(corpus)('deperditions pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);
      /** @type {Logement} */
      const logement = dpeRequest.logement;
      /** @type {Deperdition} */
      const deperditions = service.deperditions(ctx, logement);

      expect(deperditions.deperdition_mur).toBeCloseTo(
        dpeRequest.logement.sortie.deperdition.deperdition_mur,
        1
      );
      expect(deperditions.deperdition_porte).toBeCloseTo(
        dpeRequest.logement.sortie.deperdition.deperdition_porte,
        1
      );
      expect(deperditions.deperdition_plancher_bas).toBeCloseTo(
        dpeRequest.logement.sortie.deperdition.deperdition_plancher_bas,
        1
      );
      expect(deperditions.deperdition_plancher_haut).toBeCloseTo(
        dpeRequest.logement.sortie.deperdition.deperdition_plancher_haut,
        1
      );
    });
  });
});
