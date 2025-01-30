import corpus from '../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../test/test-helpers.js';
import { DeperditionMurService } from './deperdition-mur.service.js';
import { ContexteBuilder } from './contexte.builder.js';
import { DpeNormalizerService } from '../../normalizer/domain/dpe-normalizer.service.js';
import { TvStore } from '../../dpe/infrastructure/tv.store.js';

/** @type {DeperditionMurService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

describe('Calcul de déperdition des murs', () => {
  beforeEach(() => {
    service = new DeperditionMurService(new TvStore());
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  describe('Determination de uMur et uMur0', () => {
    test.each([
      {
        label: 'cas 2187E1039187C mur 1',
        enumMateriauxStructureMurId: '2',
        enumMethodeSaisieUId: '8',
        enumMethodeSaisieU0Id: '2',
        paroiAncienne: false,
        epaisseurStructure: 60,
        enumTypeIsolationId: '9',
        enumTypeDoublageId: '2',
        enumPeriodeConstructionId: '2',
        zoneClimatiqueId: '3',
        umurExpected: 1,
        umur0Expected: 1.8
      },
      {
        label:
          "(2287E0577966W) Mur  2 Sud, Est, Ouest (p1) - Mur en blocs de béton creux d'épaisseur ≥ 25 cm avec un doublage rapporté donnant sur l'extérieur",
        enumMateriauxStructureMurId: '12',
        enumMethodeSaisieUId: '7',
        enumMethodeSaisieU0Id: '2',
        paroiAncienne: false,
        enumTypeIsolationId: '1',
        enumTypeDoublageId: '4',
        enumPeriodeConstructionId: '1',
        enumIsolationId: '5',
        epaisseurStructure: 25,
        zoneClimatiqueId: '3',
        umurExpected: 0.8, // 0.7 dans le DPE original, mais certainement lié à une erreur
        umur0Expected: 1.55091
      }
    ])(
      '$label',
      ({
        enumMateriauxStructureMurId,
        enumMethodeSaisieUId,
        enumMethodeSaisieU0Id,
        enumTypeDoublageId,
        enumTypeIsolationId,
        umurSaisi,
        epaisseurStructure,
        paroiAncienne,
        resistanceIsolation,
        umurExpected,
        umur0Expected,
        enumPeriodeConstructionId = 1,
        enumIsolationId,
        effetJoule = false,
        zoneClimatiqueId = '1'
      }) => {
        /** @type {Contexte} */
        const ctx = {
          effetJoule,
          enumPeriodeConstructionId,
          zoneClimatiqueId
        };

        /** @type {MurDE} */
        const de = {
          enum_materiaux_structure_mur_id: enumMateriauxStructureMurId,
          enum_methode_saisie_u_id: enumMethodeSaisieUId,
          enum_methode_saisie_u0_id: enumMethodeSaisieU0Id,
          umur_saisi: umurSaisi,
          resistance_isolation: resistanceIsolation,
          paroi_ancienne: paroiAncienne,
          epaisseur_structure: epaisseurStructure,
          enum_type_doublage_id: enumTypeDoublageId,
          enum_type_isolation_id: enumTypeIsolationId,
          enum_periode_isolation_id: enumIsolationId
        };

        const di = service.process(ctx, de);
        expect(di.umur0).toBe(umur0Expected);
        expect(di.umur).toBeCloseTo(umurExpected);
      }
    );

    test("Mur  1 Sud, Est, Ouest (p1) - Mur en blocs de béton pleins d'épaisseur ≤ 20 cm avec isolation intérieure (10 cm) donnant sur l'extérieur", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '11',
        enum_methode_saisie_u_id: '3',
        enum_methode_saisie_u0_id: '2',
        paroi_ancienne: false,
        epaisseur_structure: 20,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '3',
        epaisseur_isolation: 10
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBe(2.5);
      expect(di.umur).toBeCloseTo(0.3448275862068969);
    });

    test('Mur  1 Nord - Mur en pierre de taille et moellons avec remplissage tout venant d&apos;épaisseur 70 cm avec isolation intérieure (10 cm) donnant sur l&apos;extérieur', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '3',
        enum_methode_saisie_u_id: '3',
        enum_methode_saisie_u0_id: '2',
        paroi_ancienne: true,
        epaisseur_structure: 70,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '3',
        epaisseur_isolation: 10
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBe(1.45);
      expect(di.umur).toBeCloseTo(0.31351351351351353);
    });

    test("(2387E0430619S) Mur  3 Nord, Est (p1) - Mur en placoplatre isolé par l'intérieur (environ 10 cm) avec isolation intérieure donnant sur des circulations avec ouverture directe sur l'extérieur", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '23',
        enum_methode_saisie_u_id: '9',
        enum_methode_saisie_u0_id: '5',
        paroi_ancienne: false,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '3',
        umur_saisi: 0.32
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeUndefined();
      expect(di.umur).toBeCloseTo(0.32);
    });

    test("Mur 1 Nord, Sud, Ouest (p1) - Mur en pierre de taille et moellons avec remplissage tout venant d'épaisseur 50 cm non isolé donnant sur l'extérieur", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '3',
        enum_methode_saisie_u_id: '1',
        enum_methode_saisie_u0_id: '2',
        enduit_isolant_paroi_ancienne: true,
        epaisseur_structure: 50,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '2'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeCloseTo(0.81545);
      expect(di.umur).toBeCloseTo(0.81545);
    });

    test("Mur 8 Est - Mur en pierre de taille et moellons avec remplissage tout venant d'épaisseur 50 cm avec un doublage rapporté non isolé donnant sur l'extérieur", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '6',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '3',
        enum_methode_saisie_u_id: '1',
        enum_methode_saisie_u0_id: '2',
        paroi_ancienne: true,
        epaisseur_structure: 50,
        enum_type_doublage_id: '3',
        enum_type_isolation_id: '2'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeCloseTo(1.59664);
      expect(di.umur).toBeCloseTo(1.59664);
    });

    test('(2287E0577966W) umur 0.7 au lieu de 0.8', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: true,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '12',
        enum_methode_saisie_u_id: '7',
        enum_methode_saisie_u0_id: '2',
        paroi_ancienne: false,
        epaisseur_structure: 25,
        enum_type_doublage_id: '4',
        enum_type_isolation_id: '1',
        enum_periode_isolation_id: '5'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeCloseTo(1.55091);
      expect(di.umur).toBeCloseTo(0.7); // 0.7 dans le DPE d'origine, comme si effet joule
    });

    test("(2387E0430619S) Mur  3 Nord, Est (p1) - Mur en placoplatre isolé par l'intérieur (environ 10 cm) avec isolation intérieure donnant sur des circulations avec ouverture directe sur l'extérieur", () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: true,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '23',
        enum_methode_saisie_u_id: '9',
        enum_methode_saisie_u0_id: '5',
        paroi_ancienne: false,
        umur_saisi: 0.32,
        epaisseur_structure: 25,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '3'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeUndefined(); // umur saisie directement
      expect(di.umur).toBeCloseTo(0.32);
    });

    test('(2287E1724516Y) Mur 4 Nord, Sud (p1) - Mur en pan de bois sans remplissage tout venant d&apos;épaisseur 18 cm avec isolation intérieure (R=2.5m².K/W) donnant sur l&apos;extérieur', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_materiaux_structure_mur_id: '5',
        enum_methode_saisie_u_id: '6',
        enum_methode_saisie_u0_id: '2',
        enduit_isolant_paroi_ancienne: true,
        epaisseur_structure: 18,
        resistance_isolation: 2.5,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '3'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeCloseTo(0.82983999999999991);
      expect(di.umur).toBeCloseTo(0.26990177584075975);
    });

    test('(2187E0982013C) Mur Nord, Sud, Est, Ouest - Mur en pierre de taille et moellons avec remplissage tout venant d&apos;épaisseur 50 cm non isolé donnant sur l&apos;extérieur', () => {
      /** @type {Contexte} */
      const ctx = {
        effetJoule: false,
        enumPeriodeConstructionId: '1',
        zoneClimatiqueId: '3'
      };
      /** @type {MurDE} */
      const de = {
        enum_type_adjacence_id: '1',
        enum_materiaux_structure_mur_id: '3',
        enum_methode_saisie_u_id: '1',
        enum_methode_saisie_u0_id: '2',
        enduit_isolant_paroi_ancienne: true,
        epaisseur_structure: 18,
        resistance_isolation: 2.5,
        enum_type_doublage_id: '2',
        enum_type_isolation_id: '2'
      };

      const di = service.process(ctx, de);
      expect(di.umur0).toBeCloseTo(0.81545);
      expect(di.umur).toBeCloseTo(0.81545);
    });
  });

  describe("Test d'intégration de mur", () => {
    test.each(corpus)('vérification des DI des murs pour dpe %s', (ademeId) => {
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const murs = dpeRequest.logement.enveloppe.mur_collection?.mur || [];

      murs.forEach((m) => {
        // dans ces cas de figure, les données paroi_ancienne sont bien traitées
        if (['2187E0982013C', '2287E2336469P', '2387E0045247S'].includes(ademeId)) {
          m.donnee_entree.enduit_isolant_paroi_ancienne = m.donnee_entree.paroi_ancienne;
        }
        const di = service.process(ctx, m.donnee_entree);

        if (m.donnee_intermediaire.umur0) {
          expect(di.umur0).toBeCloseTo(m.donnee_intermediaire.umur0, 2);
        } else {
          expect(di.umur0).toBeUndefined();
        }
        expect(di.umur).toBeCloseTo(m.donnee_intermediaire.umur, 2);
        expect(di.b).toBeCloseTo(m.donnee_intermediaire.b, 2);
      });
    });
  });
});
