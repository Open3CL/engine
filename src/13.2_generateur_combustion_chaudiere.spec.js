import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Dépendance mockée : `getFicheTechnique` (import par défaut), qui fournit l'année
 * d'installation utilisée pour choisir le générateur équivalent. On contrôle sa valeur
 * de retour ; son fonctionnement interne n'est pas testé ici.
 */
vi.mock('./ficheTechnique.js', () => ({
  default: vi.fn()
}));

const { updateGenerateurChaudieres, findIdForAnnee, getChaudiereFioulDefautId } =
  await import('./13.2_generateur_combustion_chaudiere.js');
const { default: getFicheTechnique } = await import('./ficheTechnique.js');

beforeEach(() => {
  vi.mocked(getFicheTechnique).mockReset();
});

/**
 * 13.2 - Les "autres systèmes à combustion" sont assimilés à des chaudières standard
 * de la période correspondante.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2
 */
describe('updateGenerateurChaudieres - substitution par une chaudière équivalente', () => {
  test('type non concerné : aucune substitution, pas de champ previous', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '90' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('90');
    expect(de.previous_enum_type_generateur_ch_id).toBeUndefined();
  });

  test('sans fiche technique : identifiant conservé mais previous renseigné (ch, gaz 113)', () => {
    getFicheTechnique.mockReturnValue(undefined);
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('113');
    expect(de.previous_enum_type_generateur_ch_id).toBe('113');
  });

  test('fiche "avant 1948" : chaudière la plus ancienne de la table (ch, gaz 113 -> 85)', () => {
    getFicheTechnique.mockReturnValue({ valeur: 'avant 1948' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('85');
    expect(de.previous_enum_type_generateur_ch_id).toBe('113');
  });

  test('année 1985 : seuil 1981 retenu (ch, gaz 113 -> 86)', () => {
    getFicheTechnique.mockReturnValue({ valeur: '1985' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('86');
  });

  test('année postérieure au dernier seuil : chaudière la plus récente (ch, gaz 113 -> 90)', () => {
    getFicheTechnique.mockReturnValue({ valeur: '2030' });
    const de = { enum_type_generateur_ch_id: '113' };
    updateGenerateurChaudieres({}, de, 'ch');
    expect(de.enum_type_generateur_ch_id).toBe('90');
  });

  test('type ECS (fioul 79) : utilise la table ECS et le seuil correspondant', () => {
    getFicheTechnique.mockReturnValue({ valeur: '1972' });
    const de = { enum_type_generateur_ecs_id: '79' };
    updateGenerateurChaudieres({}, de, 'ecs');
    // seuils fioul ECS : 1948->35, 1970->36 ... 1972 >= 1970 => 36
    expect(de.enum_type_generateur_ecs_id).toBe('36');
    expect(de.previous_enum_type_generateur_ecs_id).toBe('79');
  });

  test("la fiche technique est interrogée avec le bon domaine ('7' pour ch, '8' pour ecs)", () => {
    getFicheTechnique.mockReturnValue({ valeur: '2000' });
    updateGenerateurChaudieres({}, { enum_type_generateur_ch_id: '113' }, 'ch');
    expect(getFicheTechnique).toHaveBeenCalledWith({}, '7', 'année', [
      'Autre système à combustion'
    ]);

    getFicheTechnique.mockClear();
    updateGenerateurChaudieres({}, { enum_type_generateur_ecs_id: '79' }, 'ecs');
    expect(getFicheTechnique).toHaveBeenCalledWith({}, '8', 'année', [
      'Autre système à combustion'
    ]);
  });
});

describe('findIdForAnnee - sélection de la période', () => {
  const values = { 1948: 'a', 1970: 'b', 1991: 'c' };

  test('année égale à un seuil : période du seuil retenue', () => {
    expect(findIdForAnnee(values, 1970)).toBe('b');
  });

  test('année entre deux seuils : période du seuil inférieur retenue', () => {
    expect(findIdForAnnee(values, 1990)).toBe('b');
  });

  test('année postérieure au dernier seuil : période la plus récente', () => {
    expect(findIdForAnnee(values, 2030)).toBe('c');
  });

  test('année antérieure au premier seuil : période la plus ancienne', () => {
    expect(findIdForAnnee(values, 1900)).toBe('a');
  });
});

/**
 * Système collectif par défaut (ch 119 / ecs 84) : chaudière atmosphérique mixte standard
 * datant de la construction du bâtiment, énergie fioul.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §17.2.1.1
 */
describe('getChaudiereFioulDefautId - chaudière fioul par défaut selon l’année de construction', () => {
  const dpe = (annee) => ({
    logement: { caracteristique_generale: { annee_construction: annee } }
  });

  test.each([
    [1900, '75', '35'],
    [1969, '75', '35'],
    [1970, '76', '36'],
    [1975, '76', '36'],
    [1976, '77', '37'],
    [1981, '78', '38'],
    [1990, '78', '38'],
    [1991, '79', '39'],
    [2014, '79', '39'],
    [2015, '80', '40'],
    [2024, '80', '40']
  ])('construction %s : chaudière ch %s / ecs %s', (annee, chId, ecsId) => {
    expect(getChaudiereFioulDefautId(dpe(annee), 'ch')).toBe(chId);
    expect(getChaudiereFioulDefautId(dpe(annee), 'ecs')).toBe(ecsId);
  });

  test('année de construction sous forme de chaîne : prise en compte', () => {
    expect(getChaudiereFioulDefautId(dpe('1995'), 'ch')).toBe('79');
  });

  /**
   * "Dans le cas où certaines de ces informations sont connues sur l'installation collective, elles
   * pourront être utilisées et complétées par les valeurs par défaut" (§17.2.1.1).
   * Une chaudière saisie d'une période postérieure ou égale à la construction (chaudière remplacée)
   * est conservée ; une période antérieure à la construction, non crédible, est redressée.
   */
  test.each([
    // [annee, type saisi, attendu, type]
    [1930, '77', '77', 'ch'], // 2162E1020576I : chaudière 1976-1980 dans un bâtiment de 1930
    [1970, '78', '78', 'ch'], // 2262E0012158B : chaudière 1981-1990 dans un bâtiment de 1970
    [1930, '39', '39', 'ecs'], // 2262E0038009I : chaudière 1991-2014 dans un bâtiment de 1930
    [1995, '79', '79', 'ch'], // même période que la construction
    [1996, '75', '79', 'ch'], // 2368E2119912U : chaudière < 1970 dans un bâtiment de 1996
    [2000, '36', '39', 'ecs'], // chaudière 1970-1975 dans un bâtiment de 2000
    [1996, '99', '79', 'ch'], // type saisi hors chaudières fioul standard
    [1996, undefined, '79', 'ch']
  ])(
    'construction %s, type saisi %s : chaudière %s retenue (%s)',
    (annee, typeSaisi, attendu, type) => {
      expect(getChaudiereFioulDefautId(dpe(annee), type, typeSaisi)).toBe(attendu);
    }
  );

  test('année de construction absente : aucune chaudière par défaut', () => {
    expect(getChaudiereFioulDefautId(dpe(undefined), 'ch')).toBeUndefined();
    expect(getChaudiereFioulDefautId({}, 'ecs')).toBeUndefined();
    expect(getChaudiereFioulDefautId(undefined, 'ecs')).toBeUndefined();
  });
});
