import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * `bug_for_bug_compat` est exposé via un accesseur adossé à un état hoisté afin de pouvoir
 * l'activer dans certains tests (issue #296), tout en restant désactivé par défaut.
 */
const state = vi.hoisted(() => ({ bug: false }));

vi.mock('../../../../../utils.js', async (importOriginal) => ({
  ...(await importOriginal()),
  get bug_for_bug_compat() {
    return state.bug;
  }
}));

const { DeperditionPontThermiqueService } = await import('./deperdition-pont-thermique.service.js');

/**
 * Tests unitaires isolés de `DeperditionPontThermiqueService` (nouvelle architecture).
 *
 * Le store des tables de valeurs et les services de déperdition des parois sont remplacés par des
 * doubles de test : seule la logique propre au service (exclusions de ponts thermiques) est vérifiée.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4
 */

let tvStore;
let murService;
let plancherHautService;
let plancherBasService;

/** @type {DeperditionPontThermiqueService} */
let service;

const ctx = {};

beforeEach(() => {
  tvStore = {
    getKForPlancher: vi.fn(() => 0.71),
    getKForMur: vi.fn(() => 0.82),
    getKForMenuiserie: vi.fn(() => 0.3),
    getKForMurById: vi.fn(() => 0.5),
    getForMenuiserie: vi.fn(),
    getById: vi.fn()
  };
  state.bug = false;
  murService = { typeIsolation: vi.fn(() => 3) };
  plancherHautService = { typeIsolation: vi.fn(() => 4) };
  plancherBasService = { typeIsolation: vi.fn(() => 4) };
  service = new DeperditionPontThermiqueService(
    tvStore,
    murService,
    plancherHautService,
    plancherBasService
  );
});

/** Enveloppe : mur extérieur lourd + plancher (bas ou haut) lourd avec l'adjacence donnée. */
function enveloppe(adjacencePlancher, adjacenceMur = '1') {
  const plancher = {
    donnee_entree: {
      reference: 'P1',
      enum_type_adjacence_id: adjacencePlancher,
      enum_type_plancher_bas_id: '1',
      enum_type_plancher_haut_id: '1'
    }
  };
  return {
    mur_collection: {
      mur: [
        {
          donnee_entree: {
            reference: 'M1',
            enum_type_adjacence_id: adjacenceMur,
            enum_materiaux_structure_mur_id: '1'
          }
        }
      ]
    },
    plancher_bas_collection: { plancher_bas: [plancher] },
    plancher_haut_collection: { plancher_haut: [plancher] }
  };
}

function pontThermique(enumTypeLiaisonId) {
  return {
    enum_methode_saisie_pont_thermique_id: '1',
    enum_type_liaison_id: enumTypeLiaisonId,
    reference_1: 'P1',
    reference_2: 'M1',
    description: 'plancher / mur'
  };
}

describe('DeperditionPontThermiqueService - adjacence du plancher (issue #212)', () => {
  test.each(['14', '15', '16', '17', '18', '22'])(
    'adjacence %s : plancher sans pont thermique',
    (adjacence) => {
      expect(service.plancherHasPontThermiqueAdjacence({ enum_type_adjacence_id: adjacence })).toBe(
        false
      );
    }
  );

  test.each(['1', '3', '5', '6', '7', '20'])(
    'adjacence %s : plancher avec pont thermique',
    (adj) => {
      expect(service.plancherHasPontThermiqueAdjacence({ enum_type_adjacence_id: adj })).toBe(true);
    }
  );

  test('cas 2557E3382433Y : plancher bas / mur, plancher sur local habitation chauffé (22) : k = 0', () => {
    const di = service.execute(ctx, enveloppe('22'), pontThermique('1'));
    expect(di.k).toBe(0);
    expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
  });

  test('cas 2534E3387900I : plancher haut lourd / mur, plafond sous local habitation chauffé (22) : k = 0', () => {
    const di = service.execute(ctx, enveloppe('22'), pontThermique('3'));
    expect(di.k).toBe(0);
    expect(tvStore.getKForPlancher).not.toHaveBeenCalled();
  });

  test('plancher bas sur hall d’entrée (17) : k = 0', () => {
    expect(service.execute(ctx, enveloppe('17'), pontThermique('1')).k).toBe(0);
  });

  test('contre-test : plancher bas sur sous-sol non chauffé (6) : valeur tabulée (pas de b sur les PT)', () => {
    const di = service.execute(ctx, enveloppe('6'), pontThermique('1'));
    expect(tvStore.getKForPlancher).toHaveBeenCalledWith(1, expect.anything(), expect.anything());
    expect(di.k).toBe(0.71);
  });

  test('contre-test : plancher haut lourd sur extérieur : valeur tabulée', () => {
    const di = service.execute(ctx, enveloppe('1'), pontThermique('3'));
    expect(tvStore.getKForPlancher).toHaveBeenCalledWith(3, expect.anything(), expect.anything());
    expect(di.k).toBe(0.71);
  });

  test('mur sur circulation (14) : k = 0 quelle que soit l’adjacence du plancher', () => {
    expect(service.execute(ctx, enveloppe('1', '14'), pontThermique('1')).k).toBe(0);
  });
});

/**
 * Reprise de la ligne « menuiserie / mur » exportée par le DPE quand seule la largeur du dormant
 * diffère de la ligne recalculée (compatibilité bug uniquement).
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §3.4.5
 * @see https://github.com/Open3CL/engine/issues/296
 */
describe('DeperditionPontThermiqueService - ligne DPE reprise si seul le dormant diffère (issue #296)', () => {
  /** Ligne recalculée : dormant 5 cm. */
  const ligneRecalculee = {
    tv_pont_thermique_id: '71',
    enum_type_liaison_id: '5',
    isolation_mur: 'Non isolé',
    enum_type_pose_id: '1',
    type_pose: 'Nu Extérieur',
    largeur_dormant: '5',
    k: '0.43'
  };
  /** Ligne exportée par le DPE : dormant 10 cm, mêmes autres critères. */
  const ligneDpe = {
    ...ligneRecalculee,
    tv_pont_thermique_id: '72',
    largeur_dormant: '10',
    k: '0.29'
  };

  function enveloppeMenuiserie() {
    return {
      mur_collection: {
        mur: [
          {
            donnee_entree: {
              reference: 'M1',
              enum_type_adjacence_id: '1',
              enum_materiaux_structure_mur_id: '1'
            }
          }
        ]
      },
      baie_vitree_collection: {
        baie_vitree: [
          {
            donnee_entree: {
              reference: 'B1',
              enum_type_vitrage_id: '2',
              enum_type_pose_id: '1',
              largeur_dormant: 5
            }
          }
        ]
      }
    };
  }

  function ptMenuiserie() {
    return {
      enum_methode_saisie_pont_thermique_id: '1',
      enum_type_liaison_id: '5',
      reference_1: 'B1',
      reference_2: 'M1',
      description: 'menuiserie / mur',
      tv_pont_thermique_id: 72
    };
  }

  beforeEach(() => {
    murService.typeIsolation.mockReturnValue(2);
    tvStore.getKForMenuiserie.mockReturnValue(0.43);
    tvStore.getForMenuiserie.mockReturnValue(ligneRecalculee);
    tvStore.getById.mockReturnValue(ligneDpe);
  });

  test('cas 2375E2293948T : dormant exporté 5 mais ligne DPE « dormant 10 » avec k exporté : ligne DPE reprise', () => {
    state.bug = true;

    const di = service.execute(ctx, enveloppeMenuiserie(), ptMenuiserie(), 0.29);

    expect(tvStore.getForMenuiserie).toHaveBeenCalledWith(5, expect.anything(), 1, undefined, 5);
    expect(tvStore.getById).toHaveBeenCalledWith(72);
    expect(di.k).toBe(0.29);
  });

  test('sans compatibilité bug : ligne recalculée conservée (règle normative), table non relue', () => {
    const di = service.execute(ctx, enveloppeMenuiserie(), ptMenuiserie(), 0.29);

    expect(di.k).toBe(0.43);
    expect(tvStore.getForMenuiserie).not.toHaveBeenCalled();
    expect(tvStore.getById).not.toHaveBeenCalled();
  });

  test('compatibilité bug mais k exporté différent du k de la ligne DPE : ligne recalculée conservée', () => {
    state.bug = true;

    expect(service.execute(ctx, enveloppeMenuiserie(), ptMenuiserie(), 0.43).k).toBe(0.43);
  });

  test('compatibilité bug sans k exporté : ligne recalculée conservée', () => {
    state.bug = true;

    expect(service.execute(ctx, enveloppeMenuiserie(), ptMenuiserie()).k).toBe(0.43);
    expect(tvStore.getById).not.toHaveBeenCalled();
  });

  test('compatibilité bug, aucune ligne recalculée : pas de reprise (repli habituel)', () => {
    state.bug = true;
    tvStore.getKForMenuiserie.mockReturnValue(undefined);

    const di = service.execute(ctx, enveloppeMenuiserie(), ptMenuiserie(), 0.29);

    expect(tvStore.getById).not.toHaveBeenCalled();
    expect(di.k).toBe(0.5); // valeur par défaut via tv_pont_thermique_id
  });

  describe('ligneDpeSiSeulDormantDiffere', () => {
    test('ligne DPE ne différant que par le dormant et k identique : ligne DPE retournée', () => {
      expect(service.ligneDpeSiSeulDormantDiffere(ligneRecalculee, '72', '0.29')).toBe(ligneDpe);
    });

    test.each([
      ['aucune ligne recalculée', undefined, 72, 0.29],
      ['tv_pont_thermique_id absent', ligneRecalculee, undefined, 0.29],
      ['tv_pont_thermique_id nul', ligneRecalculee, null, 0.29],
      ['k exporté absent', ligneRecalculee, 72, undefined],
      ['k exporté nul', ligneRecalculee, 72, null]
    ])('%s : aucune reprise, table non relue', (_, ligne, id, k) => {
      expect(service.ligneDpeSiSeulDormantDiffere(ligne, id, k)).toBeUndefined();
      expect(tvStore.getById).not.toHaveBeenCalled();
    });

    test.each([
      ['ligne DPE introuvable', undefined],
      ['type de liaison différent', { ...ligneDpe, enum_type_liaison_id: '1' }],
      ['largeur de dormant absente', { ...ligneDpe, largeur_dormant: undefined }],
      ['même largeur de dormant', { ...ligneDpe, largeur_dormant: '5' }],
      ['isolation du mur différente', { ...ligneDpe, isolation_mur: 'ITI' }],
      ['type de pose différent', { ...ligneDpe, enum_type_pose_id: '3' }],
      ['retour d’isolation différent', { ...ligneDpe, presence_retour_isolation: '1' }],
      ['k de la ligne DPE différent du k exporté', { ...ligneDpe, k: '0.25' }]
    ])('%s : aucune reprise', (_, dpe) => {
      tvStore.getById.mockReturnValue(dpe);

      expect(service.ligneDpeSiSeulDormantDiffere(ligneRecalculee, 72, 0.29)).toBeUndefined();
    });
  });
});
