import { DeperditionEnveloppeService } from './deperdition-enveloppe.service.js';
import b from '../../../3.1_b.js';
import corpus from '../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../test/test-helpers.js';
import { ContexteBuilder } from './contexte.builder.js';
import { DeperditionPlancherBasService } from './deperdition-plancher-bas.service.js';
import { DeperditionMurService } from './deperdition-mur.service.js';
import { DeperditionPorteService } from './deperdition-porte.service.js';
import { DeperditionPlancherHautService } from './deperdition-plancher-haut.service.js';
import { DpeNormalizerService } from '../../normalizer/domain/dpe-normalizer.service.js';
import { TvStore } from '../../dpe/infrastructure/tv.store.js';

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
        zoneClimatiqueId: '5',
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
        zoneClimatiqueId = undefined,
        enumCfgIsolationLncId = undefined,
        bExpected
      }) => {
        const data = {
          enumTypeAdjacenceId,
          surfaceAiu,
          surfaceAue,
          enumCfgIsolationLncId,
          zoneClimatiqueId
        };

        const b = deperditionMurService.b(data);
        expect(b).toBe(bExpected);
      }
    );
  });

  xdescribe('Benchmark', () => {
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

  describe("Test d'intégration de calcul des deperditions", () => {
    test.each(corpus)('deperditions pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);
      /** @type {Enveloppe} */
      const enveloppe = dpeRequest.logement.enveloppe;
      /** @type {Deperdition} */
      const deperditions = service.gv(ctx, enveloppe);

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
