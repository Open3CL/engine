import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées :
 * - `utils` : utilitaires (tv, bug_for_bug_compat)
 * - `TvsStore` : service d'accès aux tables de valeurs forfaitaires pour les émetteurs de chaleur.
 *
 * `bug_for_bug_compat` est exposé via un getter afin de pouvoir basculer sa valeur par test.
 */
const utilsState = vi.hoisted(() => ({ bugForBugCompat: false }));

const mockTvsStore = vi.hoisted(() => ({
  getRendementDistributionCh: vi.fn(),
  getRendementDistributionChById: vi.fn()
}));

vi.mock('./utils.js', () => ({
  set_bug_for_bug_compat: vi.fn(),
  tv: vi.fn(),
  get bug_for_bug_compat() {
    return utilsState.bugForBugCompat;
  }
}));

vi.mock('./core/tv/infrastructure/tvs.store.js', () => ({
  TvsStore: vi.fn(() => mockTvsStore)
}));

const { rendement_emission, calc_emetteur_ch } = await import('./9_emetteur_ch.js');
const { tv } = await import('./utils.js');

beforeEach(() => {
  mockTvsStore.getRendementDistributionCh.mockReset();
  mockTvsStore.getRendementDistributionChById.mockReset();
  vi.mocked(tv).mockReset();
  utilsState.bugForBugCompat = false;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

/**
 * Configure le mock `tv` pour renvoyer une ligne par nom de table.
 * Pour `intermittence`, `rows.intermittence` peut être une fonction (matcher) => row.
 */
function mockTv(rows = {}) {
  vi.mocked(tv).mockImplementation((table, matcher) => {
    const row = rows[table];
    return typeof row === 'function' ? row(matcher) : row;
  });
}

/** Retourne les matchers passés à `tv` pour une table donnée. */
function tvMatchers(table) {
  return vi
    .mocked(tv)
    .mock.calls.filter(([name]) => name === table)
    .map(([, matcher]) => matcher);
}

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

describe('tv_rendement_distribution_ch - cas de repli', () => {
  test('type_emission=41 AVEC id inconnu par id : repli sur getRendementDistributionCh', () => {
    const em = emetteur({ typeEmissionDistributionId: '41', tvRendementDistributionChId: 99 });
    mockTvsStore.getRendementDistributionChById.mockReturnValue(undefined);
    mockTvsStore.getRendementDistributionCh.mockReturnValue({
      rd: '0.87',
      tv_rendement_distribution_ch_id: '4'
    });

    calc_emetteur_ch(em, {}, '1', '1');

    expect(mockTvsStore.getRendementDistributionChById).toHaveBeenCalledWith(99);
    expect(mockTvsStore.getRendementDistributionCh).toHaveBeenCalledWith('41', false);
    expect(em.donnee_intermediaire.rendement_distribution).toBeCloseTo(0.87, 10);
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBe(4);
  });

  test('aucune ligne par critères mais id présent : recherche par id', () => {
    const em = emetteur({
      typeEmissionDistributionId: '12',
      networkIsolated: true,
      tvRendementDistributionChId: 7
    });
    mockTvsStore.getRendementDistributionCh.mockReturnValue(undefined);
    mockTvsStore.getRendementDistributionChById.mockReturnValue({
      rd: '0.93',
      tv_rendement_distribution_ch_id: '7'
    });

    calc_emetteur_ch(em, {}, '1', '1');

    expect(mockTvsStore.getRendementDistributionCh).toHaveBeenCalledWith('12', true);
    expect(mockTvsStore.getRendementDistributionChById).toHaveBeenCalledWith(7);
    expect(em.donnee_intermediaire.rendement_distribution).toBeCloseTo(0.93, 10);
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBe(7);
  });

  test('aucune ligne trouvée et pas d’id : erreur et rendement non renseigné', () => {
    const em = emetteur({ typeEmissionDistributionId: '12' });
    mockTvsStore.getRendementDistributionCh.mockReturnValue(undefined);

    calc_emetteur_ch(em, {}, '1', '1');

    expect(mockTvsStore.getRendementDistributionChById).not.toHaveBeenCalled();
    expect(em.donnee_intermediaire.rendement_distribution).toBeUndefined();
    expect(em.donnee_entree.tv_rendement_distribution_ch_id).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour rendement_distribution_ch !!'
    );
  });
});

describe('tv_rendement_emission / tv_rendement_regulation', () => {
  test('lignes trouvées : renseigne les rendements et les ids de table', () => {
    const em = emetteur({ typeEmissionDistributionId: '12' });
    mockTv({
      rendement_emission: { re: '0.95', tv_rendement_emission_id: '2' },
      rendement_regulation: { rr: '0.9', tv_rendement_regulation_id: '3' }
    });

    calc_emetteur_ch(em, {}, '1', '1');

    expect(tvMatchers('rendement_emission')).toEqual([
      { enum_type_emission_distribution_id: '12' }
    ]);
    expect(tvMatchers('rendement_regulation')).toEqual([
      { enum_type_emission_distribution_id: '12' }
    ]);
    expect(em.donnee_intermediaire.rendement_emission).toBeCloseTo(0.95, 10);
    expect(em.donnee_intermediaire.rendement_regulation).toBeCloseTo(0.9, 10);
    expect(em.donnee_entree.tv_rendement_emission_id).toBe(2);
    expect(em.donnee_entree.tv_rendement_regulation_id).toBe(3);
  });

  test('aucune ligne trouvée : erreurs et rendements non renseignés', () => {
    const em = emetteur({ typeEmissionDistributionId: '12' });
    mockTv({});

    calc_emetteur_ch(em, {}, '1', '1');

    expect(em.donnee_intermediaire.rendement_emission).toBeUndefined();
    expect(em.donnee_intermediaire.rendement_regulation).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour rendement_emission !!'
    );
    expect(console.error).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour rendement_regulation !!'
    );
  });
});

describe('tv_intermittence - intermittence', () => {
  /**
   * Fabrique un émetteur avec les données d'entrée nécessaires au matcher d'intermittence.
   */
  function emetteurIntermittence(tvIntermittenceId = 10) {
    const em = emetteur({ typeEmissionDistributionId: '12' });
    Object.assign(em.donnee_entree, {
      enum_type_chauffage_id: '1',
      enum_equipement_intermittence_id: '2',
      enum_type_regulation_id: '3',
      tv_intermittence_id: tvIntermittenceId
    });
    return em;
  }

  /** Ligne de résultat d'intermittence renvoyée par le matcher final (sans tv_intermittence_id). */
  const intermittenceRow = (row) => (matcher) =>
    'tv_intermittence_id' in matcher ? row.lookup : row.result;

  test('maison individuelle (map_id=1) : matcher complet avec classe d’inertie', () => {
    const em = emetteurIntermittence();
    mockTv({ intermittence: { i0: '0.86', tv_intermittence_id: '42' } });

    calc_emetteur_ch(em, { enum_type_installation_id: '1' }, '1', '3');

    expect(tvMatchers('intermittence')).toEqual([
      {
        enum_methode_application_dpe_log_id: '1',
        enum_type_installation_id: '1',
        enum_type_chauffage_id: '1',
        enum_equipement_intermittence_id: '2',
        enum_type_regulation_id: '3',
        enum_type_emission_distribution_id: '12',
        comptage_individuel: 'Absence',
        enum_classe_inertie_id: '3'
      }
    ]);
    expect(em.donnee_intermediaire.i0).toBeCloseTo(0.86, 10);
    expect(em.donnee_entree.tv_intermittence_id).toBe(42);
  });

  test('autre méthode (map_id≠1) : pas de classe d’inertie dans le matcher', () => {
    const em = emetteurIntermittence();
    mockTv({ intermittence: { i0: '0.9', tv_intermittence_id: '43' } });

    calc_emetteur_ch(em, { enum_type_installation_id: '2' }, '5', '3');

    const [matcher] = tvMatchers('intermittence');
    expect(matcher).not.toHaveProperty('enum_classe_inertie_id');
    expect(matcher.enum_methode_application_dpe_log_id).toBe('5');
    expect(em.donnee_entree.tv_intermittence_id).toBe(43);
  });

  test.each([
    ['1', 'Présence'],
    ['oui', 'Présence'],
    ['OUI', 'Présence'],
    ['non', 'Absence'],
    ['0', 'Absence'],
    [null, 'Absence']
  ])('fiche technique comptage valeur=%s → comptage %s', (valeur, attendu) => {
    utilsState.bugForBugCompat = true;
    const em = emetteurIntermittence();
    mockTv({ intermittence: { i0: '0.9', tv_intermittence_id: '1' } });

    calc_emetteur_ch(
      em,
      { enum_type_installation_id: '1', ficheTechniqueComptage: { valeur } },
      '1',
      '1'
    );

    // La fiche technique prime : pas de recherche par tv_intermittence_id même en bug_for_bug_compat
    const matchers = tvMatchers('intermittence');
    expect(matchers).toHaveLength(1);
    expect(matchers[0].comptage_individuel).toBe(attendu);
  });

  test('bug_for_bug_compat sans fiche : comptage déduit de tv_intermittence_id (Présence)', () => {
    utilsState.bugForBugCompat = true;
    const em = emetteurIntermittence(10);
    mockTv({
      intermittence: intermittenceRow({
        lookup: { comptage_individuel: 'Présence de comptage' },
        result: { i0: '0.95', tv_intermittence_id: '11' }
      })
    });

    calc_emetteur_ch(em, { enum_type_installation_id: '2' }, '1', '1');

    const matchers = tvMatchers('intermittence');
    expect(matchers[0]).toEqual({ tv_intermittence_id: 10 });
    expect(matchers[1].comptage_individuel).toBe('Présence');
    expect(em.donnee_intermediaire.i0).toBeCloseTo(0.95, 10);
    expect(em.donnee_entree.tv_intermittence_id).toBe(11);
  });

  test.each([
    ['ligne sans comptage_individuel', {}],
    ['aucune ligne', undefined]
  ])('bug_for_bug_compat sans fiche, %s : comptage Absence', (_, lookup) => {
    utilsState.bugForBugCompat = true;
    const em = emetteurIntermittence(10);
    mockTv({
      intermittence: intermittenceRow({
        lookup,
        result: { i0: '0.9', tv_intermittence_id: '12' }
      })
    });

    calc_emetteur_ch(em, { enum_type_installation_id: '2' }, '1', '1');

    const matchers = tvMatchers('intermittence');
    expect(matchers).toHaveLength(2);
    expect(matchers[1].comptage_individuel).toBe('Absence');
  });

  test('aucune ligne trouvée : erreur et i0 non renseigné', () => {
    const em = emetteurIntermittence(10);
    mockTv({});

    calc_emetteur_ch(em, { enum_type_installation_id: '1' }, '1', '1');

    expect(em.donnee_intermediaire.i0).toBeUndefined();
    expect(em.donnee_entree.tv_intermittence_id).toBe(10);
    expect(console.error).toHaveBeenCalledWith(
      '!! pas de valeur forfaitaire trouvée pour intermittence !!'
    );
  });
});

describe('calc_emetteur_ch - résultat', () => {
  test('initialise donnee_utilisateur et remplace donnee_intermediaire', () => {
    const em = emetteur({ typeEmissionDistributionId: '12' });
    em.donnee_intermediaire = { ancien: true };
    mockTvsStore.getRendementDistributionCh.mockReturnValue({
      rd: '0.9',
      tv_rendement_distribution_ch_id: '1'
    });
    mockTv({});

    calc_emetteur_ch(em, {}, '1', '1');

    expect(em.donnee_intermediaire).not.toHaveProperty('ancien');
    expect(em.donnee_utilisateur).toEqual({});
  });
});
