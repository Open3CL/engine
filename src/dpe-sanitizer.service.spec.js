import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendances mockées pour isoler `DpeSanitizerService` :
 * - `lodash-es` : `has`/`set` contrôlés pour observer la création des collections
 *   manquantes ;
 * - `ObjectUtil.deepObjectTransform` : mocké pour capturer la fonction de
 *   transformation des valeurs et la tester unitairement, sans parcourir un vrai DPE.
 */
vi.mock('lodash-es', () => ({
  has: vi.fn(),
  set: vi.fn()
}));

vi.mock('./core/util/infrastructure/object-util.js', () => ({
  ObjectUtil: {
    deepObjectTransform: vi.fn()
  }
}));

const { default: DpeSanitizerService } = await import('./dpe-sanitizer.service.js');
const { has, set } = await import('lodash-es');
const { ObjectUtil } = await import('./core/util/infrastructure/object-util.js');

/** Liste des collections dont l'absence doit être compensée par un tableau vide. */
const COLLECTIONS = [
  'logement.enveloppe.mur_collection.mur',
  'logement.enveloppe.plancher_bas_collection.plancher_bas',
  'logement.enveloppe.plancher_haut_collection.plancher_haut',
  'logement.ventilation_collection.ventilation',
  'logement.climatisation_collection.climatisation',
  'logement.enveloppe.baie_vitree_collection.baie_vitree',
  'logement.enveloppe.porte_collection.porte',
  'logement.enveloppe.pont_thermique_collection.pont_thermique'
];

let service;

beforeEach(() => {
  vi.mocked(has).mockReset();
  vi.mocked(set).mockReset();
  vi.mocked(ObjectUtil.deepObjectTransform).mockReset();
  vi.mocked(ObjectUtil.deepObjectTransform).mockImplementation((dpe) => dpe);
  service = new DpeSanitizerService();
});

describe('DpeSanitizerService.execute - collections manquantes', () => {
  test('crée un tableau vide pour chaque collection absente', () => {
    vi.mocked(has).mockReturnValue(false);
    const dpe = {};

    service.execute(dpe);

    expect(set).toHaveBeenCalledTimes(COLLECTIONS.length);
    for (const path of COLLECTIONS) {
      expect(set).toHaveBeenCalledWith(dpe, path, []);
    }
  });

  test('ne recrée pas les collections déjà présentes', () => {
    vi.mocked(has).mockReturnValue(true);

    service.execute({});

    expect(set).not.toHaveBeenCalled();
  });

  test('délègue la transformation profonde et retourne son résultat', () => {
    vi.mocked(has).mockReturnValue(true);
    const transforme = { transforme: true };
    vi.mocked(ObjectUtil.deepObjectTransform).mockReturnValue(transforme);

    const resultat = service.execute({ brut: true });

    expect(ObjectUtil.deepObjectTransform).toHaveBeenCalledOnce();
    expect(resultat).toBe(transforme);
  });
});

/**
 * Récupère la fonction de transformation des valeurs passée en 3e argument de
 * `deepObjectTransform` après un appel à `execute`.
 */
function getValueTransform() {
  vi.mocked(has).mockReturnValue(true);
  service.execute({});
  return vi.mocked(ObjectUtil.deepObjectTransform).mock.calls[0][2];
}

describe('DpeSanitizerService - transformation des valeurs', () => {
  test('encapsule dans un tableau les nœuds simples à cardinalité multiple', () => {
    const valueTransform = getValueTransform();
    const generateur = { id: 1 };
    // `generateur_ecs` fait partie des nœuds à transformer en tableau
    expect(valueTransform(generateur, 'generateur_ecs')).toEqual([generateur]);
  });

  test('ne ré-encapsule pas un nœud déjà sous forme de tableau', () => {
    const valueTransform = getValueTransform();
    const deja = [{ id: 1 }];
    // déjà un tableau => traité comme une valeur non numérique et renvoyé tel quel
    expect(valueTransform(deja, 'generateur_ecs')).toBe(deja);
  });

  test("convertit les valeurs d'énumération en chaîne de caractères", () => {
    const valueTransform = getValueTransform();
    expect(valueTransform(12, 'enum_type_generateur_ch_id')).toBe('12');
    expect(valueTransform(5, 'original_enum_type_generateur_ch_id')).toBe('5');
  });

  test('une énumération nulle donne une valeur indéfinie (optional chaining)', () => {
    const valueTransform = getValueTransform();
    expect(valueTransform(null, 'enum_type_generateur_ch_id')).toBeUndefined();
  });

  test('remplace les valeurs vides ou nulles par une chaîne vide', () => {
    const valueTransform = getValueTransform();
    expect(valueTransform('', 'surface_paroi_opaque')).toBe('');
    expect(valueTransform(null, 'surface_paroi_opaque')).toBe('');
  });

  test('conserve les tableaux vides tels quels', () => {
    const valueTransform = getValueTransform();
    const vide = [];
    expect(valueTransform(vide, 'mur')).toBe(vide);
  });

  test('conserve les chaînes non numériques telles quelles', () => {
    const valueTransform = getValueTransform();
    expect(valueTransform('maison', 'description')).toBe('maison');
  });

  test('convertit les chaînes numériques en nombres', () => {
    const valueTransform = getValueTransform();
    expect(valueTransform('40.94', 'surface_paroi_opaque')).toBe(40.94);
    expect(valueTransform('12', 'quantite')).toBe(12);
  });
});
