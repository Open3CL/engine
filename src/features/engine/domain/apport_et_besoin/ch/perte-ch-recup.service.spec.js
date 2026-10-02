import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FrTvStore } from '../../../../dpe/infrastructure/froid/frTv.store.js';
import { PerteChRecupService } from './perte-ch-recup.service.js';
import { mois_liste } from '../../../../../utils.js';

/** @type {PerteChRecupService} **/
let service;

/** @type {FrTvStore} **/
let tvStore;

/**
 * 9.1.1 Pertes récupérées de génération pour le chauffage
 * Qgen_rec_j = 0,48 * Cper * Qp0 * Dperj
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1
 */
describe('Calcul des pertes récupérées de génération pour le chauffage', () => {
  /** @type {Contexte} */
  const ctx = {
    altitude: { value: '400-800m' },
    zoneClimatique: { value: 'h1a' },
    inertie: { ilpa: 0 }
  };

  /** Besoins de chauffage hors pertes (kWh) : 10 kWh par mois */
  const donneesDeCalcul = {
    besoinChauffageHP: Object.fromEntries(mois_liste.map((m) => [m, 10])),
    besoinChauffageDepensierHP: Object.fromEntries(mois_liste.map((m) => [m, 12]))
  };

  /** Générateur ECS seul (usage 2), en volume chauffé, Qp0 = 100 W */
  function generateurEcs(de = {}, di = { qp0: 100 }) {
    return {
      donnee_entree: {
        enum_usage_generateur_id: 2,
        position_volume_chauffe: 1,
        presence_ventouse: 0,
        ...de
      },
      donnee_intermediaire: di
    };
  }

  /** Logement avec une installation ECS et, optionnellement, des générateurs de chauffage */
  function logement(generateursEcs = [], generateursCh = []) {
    return {
      donnees_de_calcul: donneesDeCalcul,
      installation_ecs_collection: {
        installation_ecs: [{ generateur_ecs_collection: { generateur_ecs: generateursEcs } }]
      },
      installation_chauffage_collection: {
        installation_chauffage: [
          { generateur_chauffage_collection: { generateur_chauffage: generateursCh } }
        ]
      }
    };
  }

  beforeEach(() => {
    tvStore = new FrTvStore();
    service = new PerteChRecupService(tvStore);
    // Nref constant : 100 h (conventionnel) / 120 h (dépensier) pour chacun des 12 mois
    vi.spyOn(tvStore, 'getData').mockImplementation((type) => (type === 'nref21' ? 120 : 100));
  });

  describe('Générateurs ECS assurant l’ECS uniquement (issue #153)', () => {
    test('ECS seul sans ventouse : 0,48 * 0,5 * Qp0 * Nref * 1790 / 8760 par mois', () => {
      const result = service.execute(ctx, logement([generateurEcs()]));

      // 12 * 0.48 * 0.5 * 100 * (100 * 1790 / 8760) / 1000 = 5.884931506... kWh
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(5.884931506849315, 9);
      // 12 * 0.48 * 0.5 * 100 * (120 * 1790 / 8760) / 1000 = 7.061917808... kWh
      expect(result.pertes_generateur_ch_recup_depensier).toBeCloseTo(7.061917808219178, 9);
    });

    test('ECS seul avec ventouse : Cper = 0,75', () => {
      const result = service.execute(ctx, logement([generateurEcs({ presence_ventouse: 1 })]));
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(1.5 * 5.884931506849315, 9);
    });

    test.each([
      { cas: 'hors volume chauffé', de: { position_volume_chauffe: 0 }, di: { qp0: 100 } },
      {
        cas: 'position non renseignée',
        de: { position_volume_chauffe: undefined },
        di: { qp0: 100 }
      },
      {
        cas: "usage 'chauffage + ecs' (déjà compté)",
        de: { enum_usage_generateur_id: 3 },
        di: { qp0: 100 }
      },
      { cas: 'Qp0 nul', de: {}, di: { qp0: 0 } },
      { cas: 'Qp0 absent', de: {}, di: null }
    ])('pas de récupération pour un générateur ECS $cas', ({ de, di }) => {
      const result = service.execute(ctx, logement([generateurEcs(de, di)]));
      expect(result.pertes_generateur_ch_recup).toBe(0);
      expect(result.pertes_generateur_ch_recup_depensier).toBe(0);
    });

    test('logement sans installation ECS ni chauffage : aucune récupération', () => {
      const result = service.execute(ctx, { donnees_de_calcul: donneesDeCalcul });
      expect(result.pertes_generateur_ch_recup).toBe(0);
    });

    test('installation ECS sans collection de générateurs : aucune récupération', () => {
      const result = service.execute(ctx, {
        donnees_de_calcul: donneesDeCalcul,
        installation_ecs_collection: { installation_ecs: [{}] }
      });
      expect(result.pertes_generateur_ch_recup).toBe(0);
    });
  });

  describe('Générateurs de chauffage', () => {
    /** Générateur de chauffage en volume chauffé, Pn = 10 000 W, Qp0 = 100 W */
    function generateurCh(de = {}) {
      return {
        donnee_entree: {
          position_volume_chauffe: 1,
          enum_type_generateur_ch_id: 85,
          enum_usage_generateur_id: 1,
          ...de
        },
        donnee_intermediaire: { pn: 10000, qp0: 100 }
      };
    }

    test('usage chauffage : Dperj = min(Nref, 1,3 * Bch / (0,3 * Pn))', () => {
      const result = service.execute(ctx, logement([], [generateurCh()]));
      // Dperj = min(100, 1.3 * 10 * 1000 / 3000) = 4.333.. h
      // 12 * 0.48 * 0.5 * 100 * 4.333.. / 1000 = 1.248 kWh
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(1.248, 9);
    });

    test('usage ECS : Dperj = Nref * 1790 / 8760', () => {
      const result = service.execute(
        ctx,
        logement([], [generateurCh({ enum_usage_generateur_id: 2 })])
      );
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(5.884931506849315, 9);
    });

    test('usage chauffage + ECS avec ventouse : cumul des deux durées, Cper = 0,75', () => {
      const result = service.execute(
        ctx,
        logement([], [generateurCh({ enum_usage_generateur_id: 3, presence_ventouse: 1 })])
      );
      // Dperj = min(100, 4.333.. + 20.4337..) ; 12 * 0.48 * 0.75 * 100 * Dperj / 1000
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(10.699397260273972, 9);
    });

    test.each([
      { cas: 'hors volume chauffé', de: { position_volume_chauffe: 0 } },
      { cas: 'à air chaud (50)', de: { enum_type_generateur_ch_id: 50 } },
      { cas: 'à air chaud (52)', de: { enum_type_generateur_ch_id: 52 } }
    ])('pas de récupération pour un générateur de chauffage $cas', ({ de }) => {
      const result = service.execute(ctx, logement([], [generateurCh(de)]));
      expect(result.pertes_generateur_ch_recup).toBe(0);
    });

    test('installation de chauffage sans collection de générateurs : aucune récupération', () => {
      const result = service.execute(ctx, {
        donnees_de_calcul: donneesDeCalcul,
        installation_chauffage_collection: { installation_chauffage: [{}] }
      });
      expect(result.pertes_generateur_ch_recup).toBe(0);
    });

    test('cumul générateur de chauffage + générateur ECS seul', () => {
      const result = service.execute(ctx, logement([generateurEcs()], [generateurCh()]));
      expect(result.pertes_generateur_ch_recup).toBeCloseTo(1.248 + 5.884931506849315, 9);
    });

    test('un générateur ECS mixte (usage 3) n’est pas compté deux fois', () => {
      const ch = generateurCh({ enum_usage_generateur_id: 3 });
      const seul = service.execute(ctx, logement([], [ch]));
      const avecEcsMixte = service.execute(
        ctx,
        logement([generateurEcs({ enum_usage_generateur_id: 3 })], [ch])
      );
      expect(avecEcsMixte.pertes_generateur_ch_recup).toBe(seul.pertes_generateur_ch_recup);
    });
  });
});
