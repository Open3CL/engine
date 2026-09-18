import enums from './enums.js';
import tvs from './tv.js';
import { set } from 'lodash-es';
import { XMLParser } from 'fast-xml-parser';
import { evaluateFormula } from './formula.js';

export const xmlParser = new XMLParser({
  // We want to make sure collections of length 1 are still parsed as arrays
  isArray: (name) => {
    const collectionNames = [
      'mur',
      'plancher_bas',
      'plancher_haut',
      'baie_vitree',
      'porte',
      'pont_thermique',
      'ventilation',
      'installation_ecs',
      'generateur_ecs',
      'climatisation',
      'installation_chauffage',
      'generateur_chauffage',
      'emetteur_chauffage',
      'sortie_par_energie'
    ];
    if (collectionNames.includes(name)) return true;
  },
  tagValueProcessor: (tagName, val) => {
    if (tagName.startsWith('enum_')) {
      // Preserve value as string for tags starting with "enum_"
      return null;
    }
    if (Number.isNaN(Number(val))) return val;
    return Number(val);
  }
});

export let bug_for_bug_compat = false;
export function set_bug_for_bug_compat() {
  bug_for_bug_compat = true;
}

export function useEnumAsString(jsonObj) {
  for (const key in jsonObj) {
    if (jsonObj.hasOwnProperty(key)) {
      if (key.startsWith('enum_')) {
        if (jsonObj[key] !== null) jsonObj[key] = jsonObj[key].toString();
      } else if (typeof jsonObj[key] === 'object') {
        useEnumAsString(jsonObj[key]);
      }
    }
  }
}

export let use_enum_as_string = false;
export function set_use_enum_as_string() {
  use_enum_as_string = true;
}

/**
 * Implémentation de `tvMatch` réellement utilisée.
 *
 * Le choix est fait une seule fois, au moment du réglage, et non à chaque appel :
 * `tv_match_new_version` est un *live binding* ESM, donc un `if (tv_match_new_version)`
 * dans `tvMatch` force V8 à relire le slot de module à chaque appel et l'empêche
 * d'inliner la délégation. Sur plusieurs millions d'appels par calcul, ce seul
 * aiguillage représentait ~10% du temps CPU total.
 *
 * Les déclarations de fonction étant hoistées, la référence est valide ici.
 */
let tvMatchImpl = tvMatchLegacy;

/**
 * Cache mémoïsant `tv()`.
 *
 * Les tables de valeurs sont statiques et `tv()` est pure : pour un même couple
 * (filePath, matcher) la ligne retournée est toujours la même. Le moteur rejoue
 * les mêmes combinaisons des milliers de fois par DPE.
 *
 * Éviction FIFO : certains matchers contiennent des valeurs issues des données
 * d'entrée (ug, aiu/aue…), la cardinalité n'est donc pas fermée sur un process
 * qui tourne longtemps.
 */
let TV_CACHE_MAX = 20000;

/**
 * Change la borne du cache de `tv()`.
 *
 * `Infinity` désactive l'éviction — utile pour les outils de diagnostic, qui ont besoin de
 * l'union réelle des matchers et non d'une taille plafonnée. Réduire la borne n'évince pas
 * immédiatement : les entrées en trop partent au fil des insertions suivantes.
 *
 * @param max {number}
 */
export function setTvCacheMax(max) {
  TV_CACHE_MAX = max;
}

/** @returns {number} borne courante du cache de `tv()`. */
export function getTvCacheMax() {
  return TV_CACHE_MAX;
}
const tvCache = new Map();

/**
 * Vide le cache de `tv()`.
 * À appeler si les tables de valeurs ou la sémantique de matching changent.
 */
export function clearTvCache() {
  tvCache.clear();
}

/**
 * Nombre d'entrées actuellement mémoïsées, c'est-à-dire de matchers distincts rencontrés depuis
 * le dernier `clearTvCache()`. Purement diagnostique (bancs de mesure, métriques) : aucun
 * compteur n'est tenu sur le chemin chaud, la taille est lue à la demande.
 *
 * @returns {number}
 */
export function tvCacheSize() {
  return tvCache.size;
}

/**
 * Clés actuellement mémoïsées, au format interne : `table` puis, pour chaque entrée du matcher,
 * `clévaleur`. Purement diagnostique — sert à analyser quelle table et quelle colonne
 * génèrent de la cardinalité ouverte. Ne pas utiliser en production : la liste est copiée.
 *
 * @returns {string[]}
 */
export function tvCacheKeys() {
  return [...tvCache.keys()];
}

/**
 * Séparateurs utilisés dans les clés du cache, exposés pour que les outils de diagnostic
 * n'aient pas à les redéclarer.
 */
export const TV_CACHE_KEY_SEPARATORS = { entry: '', value: '' };

export let tv_match_new_version = false;
export function set_tv_match_optimized_version() {
  tv_match_new_version = true;
  tvMatchImpl = tvMatchOptimized;
  // La sémantique de matching change : les résultats mémoïsés ne sont plus valides.
  clearTvCache();
}

export function unset_tv_match_optimized_version() {
  tv_match_new_version = false;
  tvMatchImpl = tvMatchLegacy;
  clearTvCache();
}

export const Tbase = {
  'inférieur à 400m': {
    h1: -9.5,
    h2: -6.5,
    h3: -3.5
  },
  '400-800m': {
    h1: -11.5,
    h2: -8.5,
    h3: -5.5
  },
  'supérieur à 800m': {
    h1: -13.5,
    h2: -10.5,
    h3: -7.5
  }
};

export const Njj = {
  Janvier: 31,
  Février: 28,
  Mars: 31,
  Avril: 30,
  Mai: 31,
  Juin: 30,
  Juillet: 31,
  Aout: 31,
  Septembre: 30,
  Octobre: 31,
  Novembre: 30,
  Décembre: 24
};

// sum all Njj values
export const Njj_sum = Object.values(Njj).reduce((acc, val) => acc + val, 0);

/** @type {string[]} **/
export const mois_liste = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

export function add_references(enveloppe) {
  let i = 0;
  for (const mur of enveloppe.mur_collection.mur || []) {
    if (!mur.donnee_entree.reference) {
      mur.donnee_entree.reference = `mur_${i}`;
    }
    i += 1;
  }
  i = 0;
  for (const ph of enveloppe.plancher_haut_collection.plancher_haut || []) {
    if (!ph.donnee_entree.reference) {
      ph.donnee_entree.reference = `plancher_haut_${i}`;
    }
    i += 1;
  }
  i = 0;
  for (const pb of enveloppe.plancher_bas_collection.plancher_bas || []) {
    if (!pb.donnee_entree.reference) {
      pb.donnee_entree.reference = `plancher_bas_${i}`;
    }
    i += 1;
  }
  i = 0;
  for (const bv of enveloppe.baie_vitree_collection.baie_vitree || []) {
    if (!bv.donnee_entree.reference) {
      bv.donnee_entree.reference = `baie_vitree_${i}`;
    }
    i += 1;
  }
  i = 0;
  for (const porte of enveloppe.porte_collection.porte || []) {
    if (!porte.donnee_entree.reference) {
      porte.donnee_entree.reference = `porte_${i}`;
    }
    i += 1;
  }
}

/**
 * `Object.keys(enums[field])` mémoïsé.
 *
 * ATTENTION : le tableau retourné est partagé entre tous les appels et affecté tel
 * quel à `du[enum_*_id]`. C'est sans risque tant que personne ne mute ces tableaux
 * (aucun appelant ne le fait aujourd'hui) ; si un jour c'est le cas, remplacer par
 * `enumKeys(field).slice()`.
 */
const enumKeysCache = new Map();
function enumKeys(field) {
  let keys = enumKeysCache.get(field);
  if (keys === undefined) {
    keys = Object.keys(enums[field]);
    enumKeysCache.set(field, keys);
  }
  return keys;
}

export function requestInputID(de, du, field, type) {
  // enums
  const enum_name = `enum_${field}_id`;
  if (type) du[enum_name] = type;
  else du[enum_name] = enumKeys(field);
  return de[enum_name];
}

export function requestInput(de, du, field, type) {
  if (enums.hasOwnProperty(field)) {
    // enums
    const enum_name = `enum_${field}_id`;
    if (type) du[enum_name] = type;
    else du[enum_name] = enumKeys(field);
    return enums[field][de[enum_name]];
  } else {
    // not enums
    if (!type) {
      console.error(`requestInput: type is not defined for ${field}`);
      return null;
    }
    du[field] = type;
    return de[field];
  }
}

export function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

/**
 * `tvColumnIDs` est une fonction pure de deux constantes (une table statique et un
 * nom de colonne), mais elle était rappelée pour chaque générateur de chaque DPE.
 * Le `unique_ids.includes(value)` en O(n²) est remplacé par un `Set`.
 *
 * Le tableau retourné est partagé : les appelants ne font que le lire (`includes`).
 */
const tvColumnIDsCache = new Map();

export function tvColumnIDs(filePath, field) {
  const cacheKey = `${filePath}${field}`;
  const cached = tvColumnIDsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const list = tvs[filePath];
  const enum_name = `enum_${field}_id`;
  // split each by | and get uniques
  const seen = new Set();
  const unique_ids = [];
  for (const row of list) {
    const id = row[enum_name];
    // remove undefineds
    if (!id) continue;
    for (const value of id.split('|')) {
      if (!seen.has(value)) {
        seen.add(value);
        unique_ids.push(value);
      }
    }
  }

  tvColumnIDsCache.set(cacheKey, unique_ids);
  return unique_ids;
}

export function tvColumnLines(filePath, column, matcher) {
  const list = tvs[filePath];
  // find lines in list that match matcher
  const lines = [];
  for (const row of list) {
    let match = true;
    for (const key in matcher) {
      if (tvMatchImpl(row, key, matcher) === false) {
        match = false;
        break;
      }
    }
    if (match) lines.push(row[column]);
  }
  return lines;
}

function tvMatchLegacy(row, key, matcher) {
  if (!row.hasOwnProperty(key)) {
    // for empty csv columns
    // for q4pa_conv
    return false;
  }

  let match_value = String(matcher[key]).toLowerCase();

  // If the match value starts with ^, ends with $ and contains  + then we escape the +
  // Ex: ^iti+ite$ becomes ^iti\\+ite$
  if (/^\^(.*)\+(.*)\$$/g.test(match_value)) {
    match_value = match_value.replace('+', '\\+');
  }

  if (key.startsWith('enum_')) match_value = `^${String(matcher[key]).toLowerCase()}$`;

  if (row[key].includes('|')) {
    const values = row[key].split('|');
    if (!values.some((v) => v.toLowerCase().match(String(match_value)))) {
      return false;
    }
  } else if (Number.isInteger(matcher[key]) && ['≥', '≤'].some((char) => row[key].includes(char))) {
    return eval(match_value + row[key].replace('≥', '>=').replace('≤', '<='));
  } else if (!row[key].toLowerCase().match(String(match_value))) {
    return false;
  }
  return true;
}

function tvMatchOptimized(row, key, matcher) {
  if (!row[key]) {
    // for empty csv columns
    // for q4pa_conv
    return false;
  }

  let row_value = row[key].toLowerCase();
  let match_value = String(matcher[key]).toLowerCase();

  if (row_value === match_value) {
    return true;
  }

  if (match_value.startsWith('^')) {
    const match_value_no_regex = match_value.replace('^', '').replace('$', '');
    if (row_value === match_value_no_regex) {
      return true;
    }
  }

  if (isNaN(matcher[key]) && row_value.includes(match_value)) {
    return true;
  }

  if (row_value.includes('|')) {
    return row_value.split('|').includes(match_value);
  }

  if (Number.isInteger(matcher[key]) && ['≥', '≤'].some((char) => row[key].includes(char))) {
    return eval(match_value + row[key].replace('≥', '>=').replace('≤', '<='));
  }

  return row_value.includes(match_value);
}

export function tv(filePath, matcher) {
  let cacheKey = filePath;
  for (const key in matcher) cacheKey += `${key}${matcher[key]}`;

  const cached = tvCache.get(cacheKey);
  // `tvLookup` ne retourne jamais `undefined` (une ligne ou `null`) : `undefined`
  // distingue donc bien un défaut de cache d'un `null` mémoïsé.
  if (cached !== undefined) return cached;

  const result = tvLookup(filePath, matcher);

  if (tvCache.size >= TV_CACHE_MAX) {
    // Éviction FIFO : `Map` conserve l'ordre d'insertion.
    tvCache.delete(tvCache.keys().next().value);
  }
  tvCache.set(cacheKey, result);

  return result;
}

function tvLookup(filePath, matcher) {
  const list = tvs[filePath];
  const matcher_size = Object.keys(matcher).length;
  let match_count = 0;
  let max_match_count = 0;
  let match = null;

  for (const row of list) {
    match_count = 0;
    for (const key in matcher) {
      if (tvMatchImpl(row, key, matcher)) match_count += 1;
    }
    // if match_count is same as matcher, we are done
    if (match_count === matcher_size) return row;

    /* if (filePath === 'q4pa_conv') console.warn(match_count) */
    if (match_count > max_match_count) {
      max_match_count = match_count;
      match = row;
    }
  }
  /* if (filePath === 'pont_thermique') { */
  /* 	console.warn(matcher) */
  /* 	console.warn(match) */
  /* } */
  return match;
}

export function removeKeyFromJSON(jsonObj, keyToRemove, skipKeys) {
  for (const key in jsonObj) {
    if (skipKeys.includes(key)) continue;
    if (jsonObj.hasOwnProperty(key)) {
      if (key === keyToRemove) {
        delete jsonObj[key];
      } else if (typeof jsonObj[key] === 'object') {
        removeKeyFromJSON(jsonObj[key], keyToRemove, skipKeys);
      }
    }
  }
}

export function clean_dpe(dpe_in) {
  // skip generateur_[ecs|chauffage] because some input data is contained in donnee_intermediaire (e.g. pn, qp0, ...)
  removeKeyFromJSON(dpe_in, 'donnee_intermediaire', ['generateur_ecs', 'generateur_chauffage']);
  set(dpe_in, 'logement.sortie', null);
}

/**
 * Retrieve a number describing a thickness from the description
 * @param description string in which to get the number
 * @returns {number} if found, 0 otherwise
 */
export function getThicknessFromDescription(description) {
  if (!description) {
    return 0;
  }

  const matching = description.match(/(\d+) cm/);
  return matching && matching.length > 1 ? Number.parseFloat(matching[1]) : 0;
}

/**
 * Return true si la collection $type peut être vide
 * - Pas de pont thermique ou pas de pont thermique de type enum_type_liaison_id
 * - Déperdition pour $type === 0 (donne probablement sur un autre local chauffé)
 * @param logement {Logement}
 * @param type {string}
 * @param enum_type_liaison_id {number}
 * @returns {boolean}
 */
export function collectionCanBeEmpty(logement, type, enum_type_liaison_id) {
  const pontsThermiques = logement.enveloppe.pont_thermique_collection.pont_thermique || [];

  const pontsThermiquesWithLiaison = pontsThermiques.filter(
    (pontThermique) => pontThermique.donnee_entree.enum_type_liaison_id === enum_type_liaison_id
  );

  const deperdition = logement.sortie.deperdition[`deperdition_${type}`];

  return pontsThermiquesWithLiaison.length === 0 && deperdition === 0;
}

/**
 * Retrieve a number describing a volume from the description
 * @param description string in which to get the number
 * @returns {number} if found, 0 otherwise
 */
export function getVolumeStockageFromDescription(description) {
  if (!description) {
    return 0;
  }

  const matching = description.split('contenance ballon ');
  return matching && matching.length > 1 ? parseInt(matching[1], 10) : 0;
}

/**
 * Cache de `cleanReference`.
 *
 * Les r\u00e9f\u00e9rences proviennent des DPE en entr\u00e9e, leur cardinalit\u00e9 n'est donc pas ferm\u00e9e sur un
 * process qui tourne longtemps (\u00e9coute NATS, worker) : le cache est born\u00e9 et \u00e9vinc\u00e9 en FIFO,
 * comme celui de `tv()`.
 */
const CLEAN_REFERENCE_CACHE_MAX = 5000;
const cleanReferenceCache = new Map();

/**
 * Remove space and accented characters
 *
 * M\u00e9mo\u00efs\u00e9e : `normalize('NFD')` suivi de deux remplacements par expression r\u00e9guli\u00e8re co\u00fbte cher,
 * et les m\u00eames r\u00e9f\u00e9rences sont compar\u00e9es en boucle (chaque pont thermique est confront\u00e9 \u00e0 toutes
 * les parois).
 *
 * @param reference {string}
 * return {string}
 */
export function cleanReference(reference) {
  // Valeurs falsy (undefined, null, '', 0) : retourn\u00e9es telles quelles, sans passer par le cache.
  if (!reference) {
    return reference;
  }

  const cached = cleanReferenceCache.get(reference);
  if (cached !== undefined) {
    return cached;
  }

  const cleaned = reference
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  if (cleanReferenceCache.size >= CLEAN_REFERENCE_CACHE_MAX) {
    // \u00c9viction FIFO : `Map` conserve l'ordre d'insertion.
    cleanReferenceCache.delete(cleanReferenceCache.keys().next().value);
  }
  cleanReferenceCache.set(reference, cleaned);

  return cleaned;
}

/**
 * Return true if references are the same (without spaces and accented characters)
 * @param reference1 {string}
 * @param reference2 {string}
 * return {boolean}
 */
export function compareReferences(reference1, reference2) {
  return cleanReference(reference1) === cleanReference(reference2);
}

/**
 * Vérification si le chauffage est par effet joule
 * 3.2 Calcul des U des parois opaques
 * On considère qu’un logement est chauffé par effet joule lorsque la chaleur est fournie par une résistance électrique.
 * @param instal_ch {InstallationChauffageItem[]}
 * @returns {string} 1 if effet joule, 0 otherwise
 */
export function isEffetJoule(instal_ch) {
  const { surfaceEffetJoule, surfaceTotale } = instal_ch.reduce(
    (acc, item) => {
      const generatorIds = item.generateur_chauffage_collection.generateur_chauffage.reduce(
        (acc, generateur) => {
          return [...acc, generateur.donnee_entree.enum_type_generateur_ch_id];
        },
        []
      );

      /**
       * enum_type_generateur_ch_id
       * 98 - convecteur électrique nfc, nf** et nf***
       * 99 - panneau rayonnant électrique nfc, nf** et nf***
       * 100 - radiateur électrique nfc, nf** et nf***
       * 101 - autres émetteurs à effet joule
       * 102 - plancher ou plafond rayonnant électrique avec régulation terminale
       * 103 - plancher ou plafond rayonnant électrique sans régulation terminale
       * 104 - radiateur électrique à accumulation
       * 105 - convecteur bi-jonction
       * 106 - chaudière électrique
       * @type {boolean}
       */
      const isEffetJoule =
        generatorIds.filter((value) =>
          ['98', '99', '100', '101', '102', '103', '104', '105', '106'].includes(value)
        ).length > 0;

      if (isEffetJoule) {
        acc.surfaceEffetJoule += item.donnee_entree.surface_chauffee;
      }

      acc.surfaceTotale += item.donnee_entree.surface_chauffee;
      return acc;
    },
    { surfaceEffetJoule: 0, surfaceTotale: 0 }
  );

  // Si la surface chauffée par une résistance électrique est majoritaire => effet_joule = 1
  return surfaceEffetJoule / surfaceTotale >= 0.5 ? '1' : '0';
}

/**
 * Vérification si on trouve au moins une des chaînes de caractères substrings dans mainString
 * @param mainString chaîne dans laquelle vérifier l'existence des substrings
 * @param substrings chaîne à chercher dans la chaine principale
 * @returns {boolean}
 */
export function containsAnySubstring(mainString, substrings) {
  return substrings.some((substring) =>
    mainString.toString().toLowerCase().includes(substring.toLowerCase())
  );
}

/**
 * Évalue une formule de type tableur issue des tables de valeurs des générateurs à combustion
 * (ex. `Pn * (E + F * logPn) / 100`, `84 + 2 logPn`).
 *
 * Une valeur numérique est retournée telle quelle. Sinon la formule est évaluée avec les
 * variables suivantes :
 *   - `Pn`    : puissance nominale exprimée en kW (l'argument `pn` est fourni en W, donc divisé
 *               par 1000),
 *   - `logPn` : logarithme décimal de `Pn`,
 *   - `E`, `F`: coefficients forfaitaires (présence ou non d'une ventouse).
 *
 * @param formulaOrValue {string|number} Formule tableur ou valeur numérique.
 * @param pn {number} Puissance nominale en W.
 * @param E {number} [Coefficient forfaitaire E]
 * @param F {number} [Coefficient forfaitaire F]
 * @returns {number} Résultat de l'évaluation.
 */
export function excel_to_js_exec(formulaOrValue, pn, E, F) {
  return evaluateFormula(formulaOrValue, pn, E, F);
}

/**
 * Conversion des expressions du type `70 < Pn <= 400` en (70 < Pn) && (Pn <= 400)
 * @param expression {string}
 * @returns {string}
 */
export function convertExpression(expression) {
  if (!expression) {
    return expression;
  }

  // Gère les expressions combinées comme `70 < Pn <= 400`
  expression = expression.replace(
    /(\d+)\s*<\s*([a-zA-Z_$][\w]*)\s*<=\s*(\d+)/g,
    '($1 < $2) && ($2 <= $3)'
  );
  return expression;
}

/**
 * Retourne les valeurs qui encadrent inputNumber dans ranges
 * Si inputNumber est présent dans ranges, inputNumber est retourné comme borne 1 et borne 2
 *
 * @param inputNumber {float}
 * @param ranges {number[]}
 * @returns {*[]}
 */
export function getRange(inputNumber, ranges) {
  const result = [];

  ranges.sort();

  if (inputNumber < ranges[0]) {
    result.push(ranges[0]);
    result.push(ranges[1]);
    return result;
  }
  if (inputNumber >= ranges[ranges.length - 1]) {
    result.push(ranges[ranges.length - 2]);
    result.push(ranges[ranges.length - 1]);
  }
  if (ranges.includes(inputNumber)) {
    result.push(inputNumber);
    result.push(inputNumber);
  } else {
    ranges.find((range, index) => {
      if (inputNumber < range) {
        /* c8 ignore start -- branche défensive inatteignable : inputNumber < ranges[0] provoque
           déjà le retour anticipé en amont, donc index vaut toujours > 0 ici. */
        if (index > 0) {
          result.push(ranges[index - 1]);
        } else {
          result.push(ranges[index]);
        }
        /* c8 ignore stop */
        result.push(ranges[index]);
        return true;
      }
    });
  }
  return result;
}
