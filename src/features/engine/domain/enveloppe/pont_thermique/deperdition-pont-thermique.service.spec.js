import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeperditionPontThermiqueService } from './deperdition-pont-thermique.service.js';

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
    getKForMurById: vi.fn(() => 0.5)
  };
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
