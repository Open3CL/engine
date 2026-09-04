import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DpeNormalizerService } from '../../../../normalizer/domain/dpe-normalizer.service.js';
import { ContexteBuilder } from '../../contexte.builder.js';
import corpus from '../../../../../../test/corpus-sano.json';
import { getAdemeFileJson } from '../../../../../../test/test-helpers.js';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { ConsoFroidService } from './conso-froid.service.js';
import { describeIntegration } from '../../../../../../test/helpers/integration-test.js';

/** @type {ConsoFroidService} **/
let service;

/** @type {DpeNormalizerService} **/
let normalizerService;

/** @type {ContexteBuilder} **/
let contexteBuilder;

/** @type {FrTvStore} **/
let tvStore;

describe('Calcul des consos en froid du logement', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new ConsoFroidService(tvStore);
    normalizerService = new DpeNormalizerService();
    contexteBuilder = new ContexteBuilder();
  });

  test.each([
    {
      label: 'Climatisation avec méthode de saisie 6, sans surface clim',
      enumMethodeSaisieCaracSysId: 6,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 7, sans surface clim',
      enumMethodeSaisieCaracSysId: 7,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 8, sans surface clim',
      enumMethodeSaisieCaracSysId: 8,
      eerInitial: 125,
      expected: { conso_fr: 7.2, conso_fr_depensier: 10.8 }
    },
    {
      label: 'Climatisation avec méthode de saisie 6, avec surface clim',
      enumMethodeSaisieCaracSysId: 6,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 7, avec surface clim',
      enumMethodeSaisieCaracSysId: 7,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 8, avec surface clim',
      enumMethodeSaisieCaracSysId: 8,
      eerInitial: 125,
      surfaceClim: 80,
      expected: { conso_fr: 5.76, conso_fr_depensier: 8.64 }
    },
    {
      label: 'Climatisation avec méthode de saisie 5, sans surface clim',
      enumMethodeSaisieCaracSysId: 5,
      eer: 90,
      expected: { conso_fr: 10, conso_fr_depensier: 15 }
    },
    {
      label: 'Climatisation avec méthode de saisie 5, avec surface clim',
      enumMethodeSaisieCaracSysId: 5,
      eer: 90,
      surfaceClim: 80,
      expected: { conso_fr: 8, conso_fr_depensier: 12 }
    }
  ])(
    'Détermination des consommations des systèmes de refroidissement pour $label',
    ({
      enumMethodeSaisieCaracSysId,
      surfaceClim = undefined,
      eer = undefined,
      eerInitial,
      expected
    }) => {
      vi.spyOn(tvStore, 'getEer').mockReturnValue(eer);

      /** @type {Contexte} */
      const contexte = {
        zoneClimatique: { id: 1 },
        surfaceHabitable: 100
      };

      /** @type {Climatisation} */
      const climatisation = {
        donnee_entree: {
          enum_methode_saisie_carac_sys_id: enumMethodeSaisieCaracSysId,
          surface_clim: surfaceClim
        },
        donnee_intermediaire: { eer: eerInitial }
      };

      /** @type {ApportEtBesoin} */
      const apportEtBesoin = {
        besoin_fr: 1000,
        besoin_fr_depensier: 1500
      };

      const consoFroid = service.consoFroid(contexte, apportEtBesoin, climatisation);
      expect(consoFroid.conso_fr).toBeCloseTo(expected.conso_fr, 2);
      expect(consoFroid.conso_fr_depensier).toBeCloseTo(expected.conso_fr_depensier, 2);
    }
  );

  test('consoFroid : données intermédiaires absentes -> EER lu dans la table (repli {})', () => {
    // climatisation.donnee_intermediaire absente : repli sur {} puis lecture de l'EER forfaitaire.
    vi.spyOn(tvStore, 'getEer').mockReturnValue(90);

    /** @type {Contexte} */
    const contexte = { zoneClimatique: { id: 1 }, surfaceHabitable: 100 };

    /** @type {Climatisation} */
    const climatisation = {
      donnee_entree: { enum_methode_saisie_carac_sys_id: 6, enum_periode_installation_fr_id: 2 }
    };

    /** @type {ApportEtBesoin} */
    const apportEtBesoin = { besoin_fr: 1000, besoin_fr_depensier: 1500 };

    const consoFroid = service.consoFroid(contexte, apportEtBesoin, climatisation);

    expect(tvStore.getEer).toHaveBeenCalledWith(1, 2);
    // conso = 0.9 * besoin / eer
    expect(consoFroid.conso_fr).toBeCloseTo((0.9 * 1000) / 90, 5);
    expect(consoFroid.conso_fr_depensier).toBeCloseTo((0.9 * 1500) / 90, 5);
  });

  test('execute : renseigne les données intermédiaires de chaque climatisation', () => {
    // On isole execute du calcul détaillé : consoFroid est doublée pour ne vérifier que
    // l'itération sur les climatisations et l'affectation des champs (dont l'initialisation ??=).
    vi.spyOn(service, 'consoFroid').mockReturnValue({
      besoin_fr: 10,
      besoin_fr_depensier: 15,
      conso_fr: 2,
      conso_fr_depensier: 3
    });

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 }, surfaceHabitable: 100 };

    // Première climatisation sans donnee_intermediaire (branche ??= {}),
    // seconde avec un objet préexistant (branche ??= conservée).
    const climSansDI = { donnee_entree: {} };
    const climAvecDI = { donnee_entree: {}, donnee_intermediaire: { eer: 42 } };

    /** @type {Logement} */
    const logement = {
      sortie: { apport_et_besoin: { besoin_fr: 1000, besoin_fr_depensier: 1500 } },
      climatisation_collection: { climatisation: [climSansDI, climAvecDI] }
    };

    service.execute(ctx, logement);

    expect(service.consoFroid).toHaveBeenCalledTimes(2);
    expect(service.consoFroid).toHaveBeenCalledWith(
      ctx,
      logement.sortie.apport_et_besoin,
      climSansDI
    );

    for (const clim of [climSansDI, climAvecDI]) {
      expect(clim.donnee_intermediaire).toMatchObject({
        besoin_fr: 10,
        besoin_fr_depensier: 15,
        conso_fr: 2,
        conso_fr_depensier: 3
      });
    }
    // L'objet préexistant a été conservé (eer non écrasé par ??=)
    expect(climAvecDI.donnee_intermediaire.eer).toBe(42);
  });

  test("execute : aucune conso calculée en l'absence de climatisation", () => {
    // Valeur de repli [] quand climatisation_collection est absente.
    vi.spyOn(service, 'consoFroid');

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 }, surfaceHabitable: 100 };

    service.execute(ctx, { sortie: { apport_et_besoin: {} } });

    expect(service.consoFroid).not.toHaveBeenCalled();
  });

  describeIntegration("Test d'intégration pour le besoin en froid", () => {
    test.each(corpus)('vérification des sorties besoin_fr et conso_fr pour dpe %s', (ademeId) => {
      /**
       * @type {Dpe}
       */
      let dpeRequest = getAdemeFileJson(ademeId);
      dpeRequest = normalizerService.normalize(dpeRequest);

      /** @type {Contexte} */
      const ctx = contexteBuilder.fromDpe(dpeRequest);

      const climatisations = structuredClone(
        dpeRequest.logement.climatisation_collection?.climatisation || []
      );
      service.execute(ctx, dpeRequest.logement);

      climatisations.forEach((climatisation, i) => {
        console.log('climatisation.donnee_intermediaire.besoin_fr');
        expect(climatisation.donnee_intermediaire.besoin_fr).toBeCloseTo(
          dpeRequest.logement.climatisation_collection.climatisation[i].donnee_intermediaire
            .besoin_fr,
          2
        );
        console.log(climatisation.donnee_intermediaire.conso_fr);
        expect(climatisation.donnee_intermediaire.conso_fr).toBeCloseTo(
          dpeRequest.logement.climatisation_collection.climatisation[i].donnee_intermediaire
            .conso_fr,
          2
        );
      });
    });
  });
});
