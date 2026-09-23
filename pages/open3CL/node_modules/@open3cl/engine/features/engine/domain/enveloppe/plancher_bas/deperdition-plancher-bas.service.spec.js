import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { DeperditionPlancherBasService } from './deperdition-plancher-bas.service.js';
import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';
import { beforeEach, describe, expect, test } from 'vitest';

/** @type {DeperditionPlancherBasService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des planchers bas', () => {
  beforeEach(() => {
    service = new DeperditionPlancherBasService(new TvStore());
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination de upb, upb0 et upb_final', () => {
    test('Plancher  1 - Dalle béton non isolée donnant sur un terre-plein', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '5',
        enum_type_plancher_bas_id: '9',
        enum_methode_saisie_u0_id: '2',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '1',
        calcul_ue: 1,
        perimetre_ue: 19.2,
        ue: 0.49684211
      };

      const di = service.execute(ctx, de, []);
      expect(di.upb).toBeCloseTo(2);
      expect(di.upb0).toBeCloseTo(2);
      expect(di.upb_final).toBeCloseTo(0.49684211);
    });

    test('Plancher  1 - Plancher lourd type entrevous terre-cuite, poutrelles béton donnant sur un sous-sol non chauffé avec isolation intrinsèque ou en sous-face (5 cm)', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '6',
        enum_type_plancher_bas_id: '11',
        enum_methode_saisie_u0_id: '2',
        enum_type_isolation_id: '4',
        epaisseur_isolation: 5,
        enum_methode_saisie_u_id: '3',
        calcul_ue: 0,
        perimetre_ue: 27,
        surface_ue: 42.08,
        ue: 0.37117494
      };

      const di = service.execute(ctx, de, [{ donnee_entree: de }]);
      expect(di.upb).toBeCloseTo(0.59154929577464788);
      expect(di.upb0).toBeCloseTo(2);
      expect(di.upb_final).toBeCloseTo(0.37117494);
    });

    test('Plancher  2 - Plancher avec ou sans remplissage non isolé donnant sur un garage', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_bas_id: '2',
        enum_methode_saisie_u0_id: '2',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '1',
        calcul_ue: 0
      };

      const di = service.execute(ctx, de, []);
      expect(di.upb).toBeCloseTo(1.45);
      expect(di.upb0).toBeCloseTo(1.45);
      expect(di.upb_final).toBeCloseTo(1.45);
    });

    test('Test de plancher avec upb0 saisie', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_bas_id: '2',
        enum_methode_saisie_u0_id: '9',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '1',
        calcul_ue: 0,
        upb0_saisi: 3.2
      };

      const di = service.execute(ctx, de, []);
      expect(di.upb).toBeCloseTo(2);
      expect(di.upb0).toBeCloseTo(3.2);
      expect(di.upb_final).toBeCloseTo(2);
    });

    test('Test de plancher avec type de paroi inconnue', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_bas_id: '1',
        enum_methode_saisie_u0_id: '1',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '1',
        calcul_ue: 0
      };

      const di = service.execute(ctx, de, []);
      expect(di.upb).toBeCloseTo(2);
      expect(di.upb0).toBeCloseTo(2);
      expect(di.upb_final).toBeCloseTo(2);
    });

    test('Test de plancher avec upb directement saisie', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatique: {
          id: '3'
        }
      };
      /** @type {PlancherBasDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_bas_id: '1',
        enum_methode_saisie_u0_id: '5',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '9',
        calcul_ue: 0,
        upb_saisi: 1.25
      };

      const di = service.execute(ctx, de, []);
      expect(di.upb).toBeCloseTo(1.25);
      expect(di.upb0).toBeUndefined();
      expect(di.upb_final).toBeCloseTo(1.25);
    });
  });

  test.each([
    {
      label:
        'plancher bas avec isolation inconnue, adjacence terre-plein et période isolation 1974',
      enumTypeIsolationId: 1,
      enumTypeAdjacenceId: 5,
      enumPeriodIsolationId: 1,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 2
    },
    {
      label:
        'plancher bas avec isolation inconnue, adjacence terre-plein et période construction 2000',
      enumTypeIsolationId: 1,
      enumTypeAdjacenceId: 5,
      enumPeriodIsolationId: undefined,
      enumPeriodeConstructionId: 6,
      typeIsolationExpected: 2
    },
    {
      label:
        'plancher bas avec isolation inconnue, adjacence terre-plein et période isolation 2001',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: 7,
      enumTypeAdjacenceId: 5,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 4
    },
    {
      label: 'plancher bas avec isolation inconnue, adjacence garage et période isolation 1974',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: 2,
      enumTypeAdjacenceId: 8,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 2
    },
    {
      label: 'plancher bas avec isolation inconnue, adjacence garage et période isolation 1975',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: 3,
      enumTypeAdjacenceId: 8,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 4
    },
    {
      label: 'plancher bas avec isolation de type "isolé mais type d\'isolation inconnu"',
      enumTypeIsolationId: 9,
      enumPeriodIsolationId: 1,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 4
    },
    {
      label: 'plancher bas avec isolation iti+ite',
      enumTypeIsolationId: 6,
      enumPeriodIsolationId: 1,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 6
    }
  ])(
    "Récupération du type d'isolation pour $label",
    ({
      enumTypeIsolationId,
      enumPeriodIsolationId = undefined,
      enumTypeAdjacenceId = undefined,
      enumPeriodeConstructionId = undefined,
      typeIsolationExpected
    }) => {
      /**
       * @type {PlancherBasDE}
       */
      let plancherBasDE = {
        enum_type_isolation_id: enumTypeIsolationId,
        enum_type_adjacence_id: enumTypeAdjacenceId,
        enum_periode_isolation_id: enumPeriodIsolationId
      };

      /**
       * @type {Contexte}
       */
      const ctx = { enumPeriodeConstructionId };

      expect(service.typeIsolation(ctx, plancherBasDE)).toBe(typeIsolationExpected);
    }
  );

  describe("Test d'intégration de plancher bas", () => {
    test.each(corpus)('vérification des DI des pb pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      /** @type {PlancherBas[]} */
      const pbs = dpeRequest.logement.enveloppe.plancher_bas_collection?.plancher_bas || [];

      pbs.forEach((pb) => {
        const di = service.execute(ctx, pb.donnee_entree, pbs);

        if (pb.donnee_intermediaire) {
          expect(di.upb0).toBeCloseTo(pb.donnee_intermediaire.upb0, 2);
        } else {
          expect(di.upb0).toBeUndefined();
        }
        expect(di.upb_final).toBeCloseTo(pb.donnee_intermediaire.upb_final, 2);
        expect(di.b).toBeCloseTo(pb.donnee_intermediaire.b, 2);
      });
    });
  });
});
