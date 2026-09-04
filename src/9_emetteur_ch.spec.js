import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées :
 * - `utils` : utilitaires (tv, bug_for_bug_compat)
 * - `TvsStore` : service d'accès aux tables de valeurs forfaitaires pour les émetteurs de chaleur.
 */
const mockTvsStore = vi.hoisted(() => ({
  getRendementDistributionCh: vi.fn(),
  getRendementDistributionChById: vi.fn()
}));

vi.mock('./utils.js', () => ({
  tv: vi.fn(),
  bug_for_bug_compat: false
}));

vi.mock('./core/tv/infrastructure/tvs.store.js', () => ({
  TvsStore: vi.fn(() => mockTvsStore)
}));

const { rendement_emission, calc_emetteur_ch } = await import('./9_emetteur_ch.js');

beforeEach(() => {
  mockTvsStore.getRendementDistributionCh.mockReset();
  mockTvsStore.getRendementDistributionChById.mockReset();
});

/**
 * Fabrique un émetteur de chaleur avec les données d'entrée utiles au calcul.
 */
function emetteur({
  typeEmissionDistributionId = '1',
  networkIsolated = false,
  tvRendementDistributionChId = null
}) {
  return {
    donnee_entree: {
      enum_type_emission_distribution_id: typeEmissionDistributionId,
      reseau_distribution_isole: networkIsolated,
      tv_rendement_distribution_ch_id: tvRendementDistributionChId
    },
    donnee_intermediaire: {}
  };
}

/**
 * Tests pour le calcul du rendement de distribution pour chauffage (9_emetteur_ch.js)
 * Focus sur la correction du bug #170 : conservation du tv_rendement_distribution_ch_id
 * pour type_emission_distribution=41 ('Autres équipements').
 * @see : https://github.com/Open3CL/engine/issues/170
 */
describe('tv_rendement_distribution_ch - rendement de distribution CH', () => {
  test("type_emission=41 AVEC tv_rendement_distribution_ch_id=6 : conserve l'ID original", () => {
    // Arrange
    const em = emetteur({
      typeEmissionDistributionId: '41',
      tvRendementDistributionChId: 6
    });

    // Mock : getRendementDistributionChById(6) retourne rd=0.91
    mockTvsStore.getRendementDistributionChById.mockReturnValue({
      rd: '0.91',
      tv_rendement_distribution_ch_id: '6'
    });

    // Act
    calc_emetteur_ch(em, {}, '1', '1');

    // Assert
    // Vérification que getRendementDistributionChById a été appelé en premier (court-circuit du bug)
    expect(mockTvsStore.getRendementDistributionChById).toHaveBeenCalledWith(6);
    expect(em.donnee_intermediaire.rendement_distribution).toBeCloseTo(0.91, 10);
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBe(6);
  });

  test('type_emission=41 SANS tv_rendement_distribution_ch_id : utilise getRendementDistributionCh', () => {
    // Arrange
    const em = emetteur({
      typeEmissionDistributionId: '41',
      tvRendementDistributionChId: null
    });

    // Mock : getRendementDistributionCh retourne rd=0.85
    mockTvsStore.getRendementDistributionCh.mockReturnValue({
      rd: '0.85',
      tv_rendement_distribution_ch_id: '3'
    });

    // Act
    calc_emetteur_ch(em, {}, '1', '1');

    // Assert
    // Vérification que getRendementDistributionCh est appelé (fallthrough)
    expect(mockTvsStore.getRendementDistributionCh).toHaveBeenCalledWith('41', false);
    expect(em.donnee_intermediaire.rendement_distribution).toBeCloseTo(0.85, 10);
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBe(3);
  });

  test('type_emission=12 (pas 41) : utilise getRendementDistributionCh normalement', () => {
    // Arrange
    const em = emetteur({
      typeEmissionDistributionId: '12',
      tvRendementDistributionChId: 5
    });

    // Mock : getRendementDistributionCh retourne rd=0.90
    mockTvsStore.getRendementDistributionCh.mockReturnValue({
      rd: '0.90',
      tv_rendement_distribution_ch_id: '5'
    });

    // Act
    calc_emetteur_ch(em, {}, '1', '1');

    // Assert
    // Vérification que getRendementDistributionCh est appelé directement (pas de court-circuit)
    expect(mockTvsStore.getRendementDistributionCh).toHaveBeenCalledWith('12', false);
    expect(em.donnee_intermediaire.rendement_distribution).toBeCloseTo(0.9, 10);
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBe(5);
  });

  test('rendement_emission - calcul du rendement total', () => {
    // Arrange
    const em = {
      donnee_intermediaire: {
        rendement_emission: 0.85,
        rendement_distribution: 0.9,
        rendement_regulation: 0.95
      }
    };

    // Act
    const result = rendement_emission(em);

    // Assert
    // rg * re * rd * rr = 1 * 0.85 * 0.9 * 0.95
    expect(result).toBeCloseTo(0.72675, 10);
  });

  test('rendement_emission - avec coefficient de régulation différent de 1', () => {
    // Arrange
    const em = {
      donnee_intermediaire: {
        rendement_emission: 0.8,
        rendement_distribution: 0.85,
        rendement_regulation: 0.9
      }
    };

    // Act
    const result = rendement_emission(em, 0.95);

    // Assert
    // rg * re * rd * rr = 0.95 * 0.8 * 0.85 * 0.9
    expect(result).toBeCloseTo(0.5814, 10);
  });
});
