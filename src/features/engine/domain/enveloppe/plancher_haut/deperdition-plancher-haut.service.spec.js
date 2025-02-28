import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { DeperditionPlancherHautService } from './deperdition-plancher-haut.service.js';
import corpus from '../../../../../../test/corpus-sano.json';
import { TvStore } from '../../../../dpe/infrastructure/tv.store.js';
import { beforeEach, describe, expect, test } from 'vitest';

/** @type {DeperditionPlancherHautService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des planchers haut', () => {
  beforeEach(() => {
    service = new DeperditionPlancherHautService(new TvStore());
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination de uph, uph0 et uph_final', () => {
    test('(2187E1039187C) Plafond 2 : plafond bois sous solives bois', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '2',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '1',
        enum_type_plancher_haut_id: '10',
        enum_methode_saisie_u0_id: '2',
        enum_type_isolation_id: '9',
        enum_periode_isolation_id: '3',
        enum_methode_saisie_u_id: '8'
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(2.3);
      expect(di.uph).toBeCloseTo(0.75);
    });

    test("(2287E0224445X) Plafond  2 - Plafond structure inconnu (sous combles perdus) donnant sur l'extérieur (combles aménagés) avec isolation intérieure (réalisée entre 1989 et 2000)", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '1', // extérieur
        enum_type_plancher_haut_id: '1', // inconnu
        enum_methode_saisie_u0_id: '2', // déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire
        enum_type_isolation_id: '3', // iti
        enum_periode_isolation_id: '6', // 1989-2000
        enum_methode_saisie_u_id: '7' // année d'isolation différente de l'année de construction saisie justifiée (table forfaitaire)
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(2.5);
      expect(di.uph).toBeCloseTo(0.4); // Dans le DPE d'origine, uph (0.25) est pris dans la partie "comble" et pas "terrasse" alors que le local donne sur l'extérieur
      expect(di.b).toBeCloseTo(1);
    });

    test("(2387E0562437Q) Plafond  2 - Plafond structure inconnu (sous combles perdus) donnant sur l'extérieur (combles aménagés) avec isolation intérieure (réalisée entre 1989 et 2000)", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: true,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '1', // extérieur
        enum_type_plancher_haut_id: '1', // inconnu
        enum_methode_saisie_u0_id: '2', // déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire
        enum_type_isolation_id: '3', // iti
        enum_periode_isolation_id: '8', // 2006-2012
        enum_methode_saisie_u_id: '7' // année d'isolation différente de l'année de construction saisie justifiée (table forfaitaire)
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(2.5);
      expect(di.uph).toBeCloseTo(0.27); // Dans le DPE d'origine, uph (0.2) est pris dans la partie "comble" et pas "terrasse" alors que le local donne sur l'extérieur
      expect(di.b).toBeCloseTo(1);
    });

    test("(2287E0272588O) Plafond - Combles aménagés sous rampants donnant sur l'extérieur (combles aménagés) avec isolation intérieure (réalisée entre 1975 et 1977)", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: true,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '1', // extérieur
        enum_type_plancher_haut_id: '12', // combles aménagés sous rampant
        enum_methode_saisie_u0_id: '2', // déterminé selon le matériau et épaisseur à partir de la table de valeur forfaitaire
        enum_type_isolation_id: '3', // iti
        enum_periode_isolation_id: '3', // 1975-1977
        enum_methode_saisie_u_id: '7' // année d'isolation différente de l'année de construction saisie justifiée (table forfaitaire)
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(2.5);
      expect(di.uph).toBeCloseTo(0.5);
      expect(di.b).toBeCloseTo(1);
    });

    test('Test de plancher avec uph directement saisie', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_haut_id: '1',
        enum_methode_saisie_u0_id: '5',
        enum_type_isolation_id: '2',
        enum_methode_saisie_u_id: '9',
        uph_saisi: 1.25
      };

      const di = service.execute(ctx, de);
      expect(di.uph).toBeCloseTo(1.25);
      expect(di.uph0).toBeUndefined();
    });

    test('Test de plancher avec uph0 directement saisie', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '21',
        enum_type_plancher_haut_id: '1',
        enum_methode_saisie_u0_id: '3',
        enum_type_isolation_id: '2',
        enum_periode_isolation_id: '3',
        enum_methode_saisie_u_id: '7',
        uph0_saisi: 1.25
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(1.25);
      expect(di.uph).toBeCloseTo(0.5);
    });

    test('Test de plancher avec uph0 type de paroi inconnu (valeur par défaut)', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {PlancherHautDE} */
      const de = {
        enum_type_adjacence_id: '1',
        enum_type_plancher_haut_id: '1',
        enum_methode_saisie_u0_id: '1',
        enum_type_isolation_id: '1',
        enum_methode_saisie_u_id: '7'
      };

      const di = service.execute(ctx, de);
      expect(di.uph0).toBeCloseTo(2.5);
      expect(di.uph).toBeCloseTo(0.4);
    });
  });

  test.each([
    {
      label: 'plafond avec isolation inconnue et période isolation 1974',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: 1,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 2
    },
    {
      label: 'plafond avec isolation inconnue et période construction 1974',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: undefined,
      enumPeriodeConstructionId: 1,
      typeIsolationExpected: 2
    },
    {
      label: 'plafond avec isolation inconnue et période isolation 1975',
      enumTypeIsolationId: 1,
      enumPeriodIsolationId: 3,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 4
    },
    {
      label: 'plafond avec isolation de type "isolé mais type d\'isolation inconnu"',
      enumTypeIsolationId: 9,
      enumPeriodIsolationId: 1,
      enumPeriodeConstructionId: undefined,
      typeIsolationExpected: 4
    },
    {
      label: 'plafond avec isolation iti+ite',
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
      enumPeriodeConstructionId = undefined,
      typeIsolationExpected
    }) => {
      /**
       * @type {PlancherHautDE}
       */
      let plancherHautDE = {
        enum_type_isolation_id: enumTypeIsolationId,
        enum_periode_isolation_id: enumPeriodIsolationId
      };

      /**
       * @type {Contexte}
       */
      const ctx = { enumPeriodeConstructionId };

      expect(service.typeIsolation(ctx, plancherHautDE)).toBe(typeIsolationExpected);
    }
  );

  describe("Test d'intégration de plancher haut", () => {
    test.each(corpus)('vérification des DI des ph pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      /** @type {PlancherHaut[]} */
      const phs = dpeRequest.logement.enveloppe.plancher_haut_collection?.plancher_haut || [];

      phs.forEach((ph) => {
        const di = service.execute(ctx, ph.donnee_entree);

        if (ph.donnee_intermediaire) {
          expect(di.uph0).toBeCloseTo(ph.donnee_intermediaire.uph0, 2);
        } else {
          expect(di.uph0).toBeUndefined();
        }
        expect(di.uph).toBeCloseTo(ph.donnee_intermediaire.uph, 2);
        expect(di.b).toBeCloseTo(ph.donnee_intermediaire.b, 2);
      });
    });
  });
});
