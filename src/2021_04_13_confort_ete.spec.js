import { describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `calc_confort_ete` :
 * - `enums.classe_inertie` : détermine le caractère « lourd » de l'inertie ;
 * - `getKeyByValue` : réduit à un passe-plat renvoyant directement le libellé
 *   de confort (on assertera donc `enum_indicateur_confort_ete_id` = libellé) ;
 * - `requestInput` : passe-plat lisant le champ demandé dans les données d'entrée.
 */
vi.mock('./enums.js', () => ({
  default: {
    classe_inertie: { 1: 'légère', 2: 'moyenne', 3: 'lourde', 4: 'très lourde' },
    indicateur_confort_ete: { 1: 'insuffisant', 2: 'moyen', 3: 'bon' }
  }
}));

vi.mock('./utils.js', () => ({
  getKeyByValue: (object, value) => value,
  requestInput: (de, du, field) => de[field]
}));

const { default: calc_confort_ete } = await import('./2021_04_13_confort_ete.js');

/** Fabrique une baie vitrée : `enum_orientation_id` sert au caractère traversant,
 * `orientation` et `type_fermeture` à la protection solaire. */
function baie({ orientationId, orientation = 'sud', typeFermeture = 'volet' }) {
  return {
    donnee_entree: {
      enum_orientation_id: orientationId,
      orientation,
      type_fermeture: typeFermeture
    },
    donnee_utilisateur: {}
  };
}

/** Fabrique un plancher haut avec son type d'adjacence et d'isolation. */
function plancherHaut({ typeAdjacence = 'extérieur', typeIsolation = 'isolé' }) {
  return {
    donnee_entree: { type_adjacence: typeAdjacence, type_isolation: typeIsolation },
    donnee_utilisateur: {}
  };
}

/**
 * Indicateur de confort d'été
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - annexe confort d'été
 */
describe("calc_confort_ete - indicateur de confort d'été", () => {
  test('inertie lourde + aspect traversant : niveau « bon »', () => {
    // deux orientations distinctes => aspect_traversant = 1 ; inertie lourde = 1 => nv_bon = 2
    const bv = [baie({ orientationId: '1' }), baie({ orientationId: '2' })];
    const ph = [plancherHaut({ typeIsolation: 'isolé' })];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.inertie_lourde).toBe(1);
    expect(ret.aspect_traversant).toBe(1);
    expect(ret.enum_indicateur_confort_ete_id).toBe('bon');
  });

  test('inertie « très lourde » également considérée comme lourde', () => {
    const bv = [baie({ orientationId: '1' }), baie({ orientationId: '2' })];
    const ph = [plancherHaut({})];

    const ret = calc_confort_ete('4', bv, ph);

    expect(ret.inertie_lourde).toBe(1);
  });

  test('une seule orientation : aspect non traversant', () => {
    const bv = [baie({ orientationId: '1' }), baie({ orientationId: '1' })];
    const ph = [plancherHaut({})];

    const ret = calc_confort_ete('2', bv, ph);

    expect(ret.aspect_traversant).toBe(0);
  });

  test('inertie légère sans aspect traversant : niveau « moyen »', () => {
    // nv_bon = 0 (< 2) mais protections OK => moyen
    const bv = [baie({ orientationId: '1' })];
    const ph = [plancherHaut({})];

    const ret = calc_confort_ete('1', bv, ph);

    expect(ret.inertie_lourde).toBe(0);
    expect(ret.enum_indicateur_confort_ete_id).toBe('moyen');
  });

  test("toiture non isolée donnant sur l'extérieur : niveau « insuffisant »", () => {
    const bv = [baie({ orientationId: '1' }), baie({ orientationId: '2' })];
    const ph = [plancherHaut({ typeAdjacence: 'extérieur', typeIsolation: 'non isolé' })];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.isolation_toiture).toBe(0);
    expect(ret.enum_indicateur_confort_ete_id).toBe('insuffisant');
  });

  test("toiture d'isolation inconnue donnant sur l'extérieur : isolation nulle", () => {
    const bv = [baie({ orientationId: '1' })];
    const ph = [plancherHaut({ typeAdjacence: 'extérieur', typeIsolation: 'inconnu' })];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.isolation_toiture).toBe(0);
  });

  test('toiture non isolée mais non extérieure : isolation préservée', () => {
    const bv = [baie({ orientationId: '1' }), baie({ orientationId: '2' })];
    const ph = [plancherHaut({ typeAdjacence: 'local non chauffé', typeIsolation: 'non isolé' })];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.isolation_toiture).toBe(1);
  });

  test('baie non nord sans fermeture : protection solaire nulle => « insuffisant »', () => {
    const bv = [
      baie({
        orientationId: '1',
        orientation: 'sud',
        typeFermeture: 'abscence de fermeture pour la baie vitrée'
      })
    ];
    const ph = [plancherHaut({})];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.protection_solaire_exterieure).toBe(0);
    expect(ret.enum_indicateur_confort_ete_id).toBe('insuffisant');
  });

  test('baie nord sans fermeture : ignorée, protection solaire préservée', () => {
    const bv = [
      baie({
        orientationId: '1',
        orientation: 'nord',
        typeFermeture: 'abscence de fermeture pour la baie vitrée'
      }),
      baie({
        orientationId: '2',
        orientation: 'nord',
        typeFermeture: 'abscence de fermeture pour la baie vitrée'
      })
    ];
    const ph = [plancherHaut({})];

    const ret = calc_confort_ete('3', bv, ph);

    expect(ret.protection_solaire_exterieure).toBe(1);
  });

  test("le brasseur d'air est toujours absent (0) dans ce calcul", () => {
    const ret = calc_confort_ete('3', [baie({ orientationId: '1' })], [plancherHaut({})]);
    expect(ret.brasseur_air).toBe(0);
  });
});
