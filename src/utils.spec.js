import { beforeEach, describe, expect, test, vi } from 'vitest';

// --- Mocks des dépendances de données (contenu réel non testé ici) -----------------------------
// enums.js et tv.js sont des tables de valeurs : on les mocke pour rendre les tests autonomes
// vis-à-vis de l'évolution des données réelles. lodash-es, fast-xml-parser et mathjs restent
// réels car leur comportement (set, parsing XML, evaluate) fait partie de ce que l'on vérifie.
vi.mock('./enums.js', () => ({
  default: {
    materiaux: { 1: 'brique', 2: 'beton' }
  }
}));

vi.mock('./tv.js', () => ({
  default: {
    // Table dédiée à tvColumnIDs : plusieurs colonnes enum_x_id, dont une indéfinie.
    colonnes: [{ enum_x_id: '1|2' }, { enum_x_id: '2|3' }, { enum_x_id: undefined }],
    // Table dédiée à tvMatch (version historique) et à tv().
    table_defaut: [
      { enum_x_id: '1', val: 'r0' },
      { enum_x_id: '2|3', val: 'r1' },
      { seuil: '≥50', val: 'r2' },
      { code: 'iti+ite', val: 'r3' },
      { code: 'abc', val: 'r4' }
    ],
    // Table dédiée à tvMatchOptimized (version optimisée).
    table_opt: [{ a: 'brique', b: '1|2', c: '≥50', d: 'isolation par exterieur', e: 'zone 3' }]
  }
}));

const {
  xmlParser,
  set_bug_for_bug_compat,
  useEnumAsString,
  set_use_enum_as_string,
  set_tv_match_optimized_version,
  unset_tv_match_optimized_version,
  add_references,
  requestInputID,
  requestInput,
  getKeyByValue,
  tvColumnIDs,
  tvColumnLines,
  tv,
  removeKeyFromJSON,
  clean_dpe,
  getThicknessFromDescription,
  collectionCanBeEmpty,
  getVolumeStockageFromDescription,
  cleanReference,
  compareReferences,
  isEffetJoule,
  containsAnySubstring,
  excel_to_js_exec,
  convertExpression,
  getRange
} = await import('./utils.js');
const utils = await import('./utils.js');

describe('Utils unit tests', () => {
  test.each([
    [0, null],
    [0, undefined],
    [0, ''],
    [0, 'Mur en blocs de béton creux'],
    [0, "Mur en blocs de béton creux d'épaisseur xxx cm non isolé"],
    [4, "Mur en blocs de béton creux d'épaisseur 4 cm non isolé"],
    [25, "Mur en blocs de béton creux d'&apos;'épaisseur ≥ 25 cm non isolé"]
  ])('should get thickness %s from description %s', (thickness, description) => {
    expect(getThicknessFromDescription(description)).toBe(thickness);
  });

  test.each([
    ['70 < Pn <= 400', '(70 < Pn) && (Pn <= 400)'],
    ['70 < Pn', '70 < Pn'],
    ['Pn <= 400', 'Pn <= 400'],
    ['Pn == 400', 'Pn == 400'],
    ['Pn', 'Pn'],
    [null, null],
    [undefined, undefined]
  ])('should transform expression %s to %s', (expression, expected) => {
    expect(convertExpression(expression)).toBe(expected);
  });

  test.each([
    [[1, 1.2, 3.4, 5.6], 0.5, [1, 1.2]],
    [[1, 1.2, 3.4, 5.6], 1, [1, 1]],
    [[1, 1.2, 3.4, 5.6], 1.3, [1.2, 3.4]],
    [[1, 1.2, 3.4, 5.6], 6.5, [3.4, 5.6]]
  ])('should for values %s and inputNumber %s return range %s', (ranges, inputNumber, expected) => {
    expect(getRange(inputNumber, ranges)).toStrictEqual(expected);
  });

  describe('excel_to_js_exec', () => {
    // Règle : une valeur numérique est retournée telle quelle (le séparateur décimal virgule
    // est converti en point au préalable).
    test.each([
      ['12', 12],
      ['0,6', 0.6],
      [42, 42]
    ])('retourne la valeur numérique %s telle quelle', (value, expected) => {
      expect(excel_to_js_exec(value, 25000)).toBe(expected);
    });

    // Règle : `Pn` est exprimé en kW (l'argument `pn` fourni en W est divisé par 1000) et
    // `logPn` vaut son logarithme décimal.
    test('expose Pn en kW et logPn = log10(Pn)', () => {
      // Pn = 25000 / 1000 = 25 → logPn = log10(25)
      expect(excel_to_js_exec('Pn', 25000)).toBe(25);
      expect(excel_to_js_exec('logPn', 25000)).toBeCloseTo(Math.log10(25), 12);
    });

    // Règle : le pourcentage est interprété comme une fraction (`0.6%` → 0.006).
    test('interprète un pourcentage comme une fraction', () => {
      expect(excel_to_js_exec('0.6%', 25000)).toBeCloseTo(0.006, 12);
    });

    // Valeurs de référence de régression (calculées via le vrai module).
    test.each([
      // formule, pn, E, F, résultat attendu
      ['84 + 2 logPn', 25000, undefined, undefined, 86.79588001734407],
      ['Pn * (E + F * logPn) / 100', 50000, 2.5, -0.8, 0.5704119982655924],
      ['0,085*Pn*(Pn)^-0,4', 25000, undefined, undefined, 0.5863851061210162]
    ])('évalue la formule %s (pn=%s)', (formula, pn, E, F, expected) => {
      expect(excel_to_js_exec(formula, pn, E, F)).toBeCloseTo(expected, 9);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('xmlParser', () => {
    // Règle : les balises listées dans collectionNames sont toujours forcées en tableau, même
    // si la collection ne contient qu'un seul élément.
    test('force les collections connues en tableau', () => {
      const result = xmlParser.parse('<root><mur>1</mur></root>');
      expect(Array.isArray(result.root.mur)).toBe(true);
      expect(result.root.mur).toStrictEqual([1]);
    });

    // Règle : une balise hors collectionNames n'est pas forcée en tableau.
    test('ne force pas les balises hors collection en tableau', () => {
      const result = xmlParser.parse('<root><autre>1</autre></root>');
      expect(Array.isArray(result.root.autre)).toBe(false);
    });

    // Règle du tagValueProcessor : les balises enum_* conservent leur valeur brute (chaîne), les
    // valeurs numériques sont converties en nombre, les autres restent des chaînes.
    test('préserve les enum_* en chaîne et convertit les nombres', () => {
      const result = xmlParser.parse(
        '<root><enum_type_id>05</enum_type_id><count>42</count><name>hello</name></root>'
      );
      expect(result.root.enum_type_id).toBe('05');
      expect(result.root.count).toBe(42);
      expect(result.root.name).toBe('hello');
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('drapeaux globaux', () => {
    test('set_bug_for_bug_compat active le drapeau', () => {
      set_bug_for_bug_compat();
      expect(utils.bug_for_bug_compat).toBe(true);
    });

    test('set_use_enum_as_string active le drapeau', () => {
      set_use_enum_as_string();
      expect(utils.use_enum_as_string).toBe(true);
    });

    test('set/unset_tv_match_optimized_version bascule le drapeau', () => {
      set_tv_match_optimized_version();
      expect(utils.tv_match_new_version).toBe(true);
      unset_tv_match_optimized_version();
      expect(utils.tv_match_new_version).toBe(false);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('useEnumAsString', () => {
    // Règle : seules les clés enum_* non nulles sont converties en chaîne, récursivement.
    test('convertit récursivement les enum_* non nuls en chaîne', () => {
      const obj = {
        enum_a: 5,
        enum_b: null,
        other: 3,
        nested: { enum_c: 7 }
      };
      useEnumAsString(obj);
      expect(obj.enum_a).toBe('5');
      expect(obj.enum_b).toBeNull();
      expect(obj.other).toBe(3);
      expect(obj.nested.enum_c).toBe('7');
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('add_references', () => {
    const buildCollections = (items) => ({
      mur_collection: { mur: items ? [...items] : undefined },
      plancher_haut_collection: { plancher_haut: items ? [...items] : undefined },
      plancher_bas_collection: { plancher_bas: items ? [...items] : undefined },
      baie_vitree_collection: { baie_vitree: items ? [...items] : undefined },
      porte_collection: { porte: items ? [...items] : undefined }
    });

    // Règle : chaque élément sans référence reçoit `<type>_<index>` ; ceux qui en ont une la
    // conservent.
    test('affecte une référence aux éléments qui n en ont pas', () => {
      const enveloppe = {
        mur_collection: {
          mur: [{ donnee_entree: {} }, { donnee_entree: { reference: 'M' } }]
        },
        plancher_haut_collection: {
          plancher_haut: [{ donnee_entree: {} }, { donnee_entree: { reference: 'PH' } }]
        },
        plancher_bas_collection: {
          plancher_bas: [{ donnee_entree: {} }, { donnee_entree: { reference: 'PB' } }]
        },
        baie_vitree_collection: {
          baie_vitree: [{ donnee_entree: {} }, { donnee_entree: { reference: 'BV' } }]
        },
        porte_collection: {
          porte: [{ donnee_entree: {} }, { donnee_entree: { reference: 'P' } }]
        }
      };

      add_references(enveloppe);

      expect(enveloppe.mur_collection.mur[0].donnee_entree.reference).toBe('mur_0');
      expect(enveloppe.mur_collection.mur[1].donnee_entree.reference).toBe('M');
      expect(enveloppe.plancher_haut_collection.plancher_haut[0].donnee_entree.reference).toBe(
        'plancher_haut_0'
      );
      expect(enveloppe.plancher_bas_collection.plancher_bas[0].donnee_entree.reference).toBe(
        'plancher_bas_0'
      );
      expect(enveloppe.baie_vitree_collection.baie_vitree[0].donnee_entree.reference).toBe(
        'baie_vitree_0'
      );
      expect(enveloppe.porte_collection.porte[0].donnee_entree.reference).toBe('porte_0');
    });

    // Règle : une collection absente (tableau indéfini) est traitée comme vide, sans erreur.
    test('supporte des collections absentes', () => {
      const enveloppe = buildCollections(null);
      expect(() => add_references(enveloppe)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('requestInput / requestInputID', () => {
    test('requestInput : champ enum sans type retourne la valeur enum et publie les clés', () => {
      const de = { enum_materiaux_id: '1' };
      const du = {};
      expect(requestInput(de, du, 'materiaux')).toBe('brique');
      expect(du.enum_materiaux_id).toStrictEqual(['1', '2']);
    });

    test('requestInput : champ enum avec type publie le type fourni', () => {
      const de = { enum_materiaux_id: '2' };
      const du = {};
      expect(requestInput(de, du, 'materiaux', ['2'])).toBe('beton');
      expect(du.enum_materiaux_id).toStrictEqual(['2']);
    });

    test('requestInput : champ non enum avec type retourne la valeur brute', () => {
      const de = { epaisseur: 5 };
      const du = {};
      expect(requestInput(de, du, 'epaisseur', 'number')).toBe(5);
      expect(du.epaisseur).toBe('number');
    });

    test('requestInput : champ non enum sans type journalise une erreur et retourne null', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const du = {};
      expect(requestInput({}, du, 'epaisseur')).toBeNull();
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    test('requestInputID : sans type publie les clés et retourne l identifiant', () => {
      const de = { enum_materiaux_id: '1' };
      const du = {};
      expect(requestInputID(de, du, 'materiaux')).toBe('1');
      expect(du.enum_materiaux_id).toStrictEqual(['1', '2']);
    });

    test('requestInputID : avec type publie le type fourni', () => {
      const de = { enum_materiaux_id: '2' };
      const du = {};
      expect(requestInputID(de, du, 'materiaux', ['2'])).toBe('2');
      expect(du.enum_materiaux_id).toStrictEqual(['2']);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('getKeyByValue', () => {
    test('retourne la clé associée à la valeur', () => {
      expect(getKeyByValue({ a: 1, b: 2 }, 2)).toBe('b');
    });
    test('retourne undefined si la valeur est absente', () => {
      expect(getKeyByValue({ a: 1 }, 99)).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('tvColumnIDs', () => {
    // Règle : agrège les identifiants uniques de la colonne enum_<field>_id, en éclatant les
    // valeurs multiples séparées par « | » et en ignorant les cellules vides.
    test('retourne les identifiants uniques éclatés', () => {
      expect(tvColumnIDs('colonnes', 'x')).toStrictEqual(['1', '2', '3']);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('tv / tvMatch (version historique)', () => {
    beforeEach(() => {
      unset_tv_match_optimized_version();
    });

    // Règle enum : la valeur est ancrée (^...$) et une cellule « a|b » matche si l'une des
    // alternatives correspond.
    test('matche une valeur enum contenue dans une cellule « a|b »', () => {
      expect(tv('table_defaut', { enum_x_id: '3' })).toStrictEqual({
        enum_x_id: '2|3',
        val: 'r1'
      });
    });

    // Règle seuil : pour un entier et une cellule « ≥/≤ », la comparaison est évaluée.
    test('évalue un seuil « ≥ » pour une valeur entière', () => {
      expect(tv('table_defaut', { seuil: 60 })).toStrictEqual({ seuil: '≥50', val: 'r2' });
      // 40 < 50 → pas de correspondance complète, retourne le meilleur match partiel (ici aucun
      // autre champ commun → premier candidat comptabilisé nul).
    });

    // Règle d'échappement : « ^iti+ite$ » est transformé pour échapper le « + » littéral.
    test('échappe le « + » dans un motif ancré', () => {
      expect(tv('table_defaut', { code: '^iti+ite$' })).toStrictEqual({
        code: 'iti+ite',
        val: 'r3'
      });
    });

    // Règle : sans correspondance complète, tv retourne la ligne au plus grand nombre de
    // champs concordants.
    test('retourne le meilleur match partiel faute de correspondance complète', () => {
      expect(tv('table_defaut', { enum_x_id: '1', absent: 'z' })).toStrictEqual({
        enum_x_id: '1',
        val: 'r0'
      });
    });

    // Règle : une clé absente de la ligne ne matche jamais.
    test('une clé absente de la ligne empêche la correspondance', () => {
      // « seuil » n'existe que sur r2 ; matcher enum_x_id + seuil ne matche complètement aucune
      // ligne → meilleur partiel = r0 (enum_x_id concorde).
      expect(tv('table_defaut', { enum_x_id: '1', seuil: 60 })).toStrictEqual({
        enum_x_id: '1',
        val: 'r0'
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('tvColumnLines', () => {
    beforeEach(() => {
      unset_tv_match_optimized_version();
    });

    // Règle : retourne les valeurs de la colonne demandée pour toutes les lignes qui matchent le
    // matcher.
    test('retourne les colonnes des lignes concordantes', () => {
      expect(tvColumnLines('table_defaut', 'val', { enum_x_id: '1' })).toStrictEqual(['r0']);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('tv / tvMatchOptimized (version optimisée)', () => {
    beforeEach(() => {
      set_tv_match_optimized_version();
    });

    // Correspondance exacte.
    test('matche une valeur identique', () => {
      expect(tv('table_opt', { a: 'brique' }).a).toBe('brique');
    });

    // Correspondance après suppression des ancres ^...$.
    test('matche après suppression des ancres du motif', () => {
      expect(tv('table_opt', { a: '^brique$' }).a).toBe('brique');
    });

    // Correspondance par sous-chaîne pour une valeur non numérique.
    test('matche par sous-chaîne (valeur non numérique)', () => {
      expect(tv('table_opt', { d: 'exterieur' }).d).toBe('isolation par exterieur');
    });

    // Correspondance sur une cellule « a|b ».
    test('matche une alternative d une cellule « a|b »', () => {
      expect(tv('table_opt', { b: '2' }).b).toBe('1|2');
    });

    // Comparaison de seuil « ≥ » pour un entier.
    test('évalue un seuil « ≥ » pour une valeur entière', () => {
      expect(tv('table_opt', { c: 60 }).c).toBe('≥50');
    });

    // Correspondance par sous-chaîne finale (valeur numérique présente en fin de chaîne).
    test('matche par sous-chaîne finale une valeur numérique', () => {
      expect(tv('table_opt', { e: 3 }).e).toBe('zone 3');
    });

    // Absence de correspondance : cellule vide.
    test('ne matche pas une clé absente de la ligne', () => {
      expect(tv('table_opt', { absent: 'x' })).toBeNull();
    });

    // Absence de correspondance : sous-chaîne introuvable.
    test('ne matche pas une sous-chaîne introuvable', () => {
      expect(tv('table_opt', { a: 'zzz' })).toBeNull();
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('removeKeyFromJSON', () => {
    // Règle : supprime récursivement la clé cible, sauf sous les branches listées dans skipKeys.
    test('supprime récursivement la clé sauf sous les branches ignorées', () => {
      const obj = {
        a: 1,
        remove_me: 2,
        skip: { remove_me: 3 },
        nested: { remove_me: 4, b: 5 }
      };
      removeKeyFromJSON(obj, 'remove_me', ['skip']);
      expect(obj.remove_me).toBeUndefined();
      expect(obj.skip.remove_me).toBe(3);
      expect(obj.nested.remove_me).toBeUndefined();
      expect(obj.nested.b).toBe(5);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('clean_dpe', () => {
    // Règle : supprime les donnee_intermediaire sauf sous generateur_ecs/generateur_chauffage et
    // remet logement.sortie à null.
    test('nettoie les données intermédiaires et vide la sortie', () => {
      const dpe = {
        logement: {
          sortie: { x: 1 },
          donnee_intermediaire: { y: 2 },
          generateur_ecs: [{ donnee_intermediaire: { keep: 1 } }]
        }
      };
      clean_dpe(dpe);
      expect(dpe.logement.donnee_intermediaire).toBeUndefined();
      expect(dpe.logement.generateur_ecs[0].donnee_intermediaire).toStrictEqual({ keep: 1 });
      expect(dpe.logement.sortie).toBeNull();
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('collectionCanBeEmpty', () => {
    const buildLogement = (ponts, deperditionMur) => ({
      enveloppe: {
        pont_thermique_collection: ponts ? { pont_thermique: ponts } : {}
      },
      sortie: { deperdition: { deperdition_mur: deperditionMur } }
    });

    // Règle : vide autorisé si aucun pont thermique de la liaison ET déperdition nulle.
    test('vrai si aucun pont de liaison et déperdition nulle', () => {
      const logement = buildLogement([{ donnee_entree: { enum_type_liaison_id: 5 } }], 0);
      expect(collectionCanBeEmpty(logement, 'mur', 9)).toBe(true);
    });

    // Règle : faux si au moins un pont de la liaison existe.
    test('faux si un pont de la liaison existe', () => {
      const logement = buildLogement([{ donnee_entree: { enum_type_liaison_id: 5 } }], 0);
      expect(collectionCanBeEmpty(logement, 'mur', 5)).toBe(false);
    });

    // Règle : faux si la déperdition est non nulle.
    test('faux si la déperdition est non nulle', () => {
      const logement = buildLogement([], 10);
      expect(collectionCanBeEmpty(logement, 'mur', 5)).toBe(false);
    });

    // Règle : collection de ponts absente traitée comme vide.
    test('supporte une collection de ponts absente', () => {
      const logement = buildLogement(null, 0);
      expect(collectionCanBeEmpty(logement, 'mur', 5)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('getVolumeStockageFromDescription', () => {
    test.each([
      [null, 0],
      ['pas de contenance', 0],
      ['ballon type contenance ballon 200 litres', 200]
    ])('extrait le volume de « %s » → %s', (description, expected) => {
      expect(getVolumeStockageFromDescription(description)).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('cleanReference / compareReferences', () => {
    test.each([
      ['Réf Élément 1', 'refelement1'],
      [42, '42'],
      [null, null],
      [undefined, undefined]
    ])('nettoie « %s » → %s', (input, expected) => {
      expect(cleanReference(input)).toBe(expected);
    });

    test('compareReferences ignore espaces et accents', () => {
      expect(compareReferences('Réf 1', 'ref1')).toBe(true);
      expect(compareReferences('a', 'b')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('isEffetJoule', () => {
    const buildInstal = (genId, surface) => ({
      generateur_chauffage_collection: {
        generateur_chauffage: [{ donnee_entree: { enum_type_generateur_ch_id: genId } }]
      },
      donnee_entree: { surface_chauffee: surface }
    });

    // Règle : effet joule si la surface chauffée par résistance électrique est majoritaire (>= 50 %).
    test('retourne « 1 » quand l effet joule est majoritaire', () => {
      const instal = [buildInstal('100', 60), buildInstal('50', 40)];
      expect(isEffetJoule(instal)).toBe('1');
    });

    test('retourne « 0 » quand l effet joule est minoritaire', () => {
      const instal = [buildInstal('100', 30), buildInstal('50', 70)];
      expect(isEffetJoule(instal)).toBe('0');
    });
  });

  // -------------------------------------------------------------------------------------------
  describe('containsAnySubstring', () => {
    test.each([
      ['Hello World', ['xyz', 'wor'], true],
      ['abc', ['xyz'], false],
      [123, ['2'], true]
    ])('« %s » contient une des sous-chaînes %s → %s', (mainString, substrings, expected) => {
      expect(containsAnySubstring(mainString, substrings)).toBe(expected);
    });
  });
});
