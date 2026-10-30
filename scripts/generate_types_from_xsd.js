#!/usr/bin/env node
/**
 * Génère les types TypeScript du modèle DPE à partir du schéma XSD officiel de l'observatoire DPE.
 *
 * Usage :
 *   node scripts/generate_types_from_xsd.js [chemin-ou-url-du-xsd] [fichier-de-sortie]
 *   npm run types:generate
 *
 * Par défaut : télécharge DPEv2.7.xsd depuis GitLab (ou utilise la variable d'environnement
 * `DPE_XSD_PATH`) et écrit `src/features/dpe/domain/models/dpe-xsd.generated.ts`.
 *
 * Règles de génération (types « tels que le moteur les lit après `xmlParser`, cf. `src/utils.js``) :
 * - `minOccurs="0"` => propriété optionnelle (`?`), `nillable="true"` => `| null`.
 * - `xs:choice` => chaque membre devient optionnel.
 * - Balises en `isArray` du parseur du moteur (mur, plancher_bas, ...) => toujours `T[]` ;
 *   autres `maxOccurs="unbounded"` => `T | T[]` (un seul élément n'est pas converti en tableau).
 * - Balises `enum_*` => `string` (valeur conservée en chaîne par le parseur) ; `xs:int`/`xs:double`
 *   => `number` ; `s_oui_non` => `0 | 1` (le parseur produit un nombre, pas un booléen) ; dates => `string`.
 * - `xs:any` => `Record<string, any>`.
 * - Attributs de `dpe` (hashkey, id, version) => propriétés de l'objet (ajoutées par le moteur).
 *
 * Les noms d'interfaces sont dérivés du chemin XML (préfixe `Xsd`), en fusionnant `X_collection/X`.
 */
import { XMLParser } from 'fast-xml-parser';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const XSD_URL =
  'https://gitlab.com/observatoire-dpe/observatoire-dpe/-/raw/master/modele_donnee/DPEv2.7.xsd';
const DEFAULT_OUT = 'src/features/dpe/domain/models/dpe-xsd.generated.ts';

/** Balises toujours converties en tableau par `xmlParser` (miroir de `isArray` dans `src/utils.js`). */
export const ALWAYS_ARRAY = new Set([
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
]);

const asArray = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const pascal = (s) =>
  s
    .split('_')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
const text = (n) => (typeof n === 'string' ? n : (n?.['#text'] ?? ''));
const oneLine = (s) => s.replace(/\s+/g, ' ').trim().replace(/\*\//g, '* /');

function parseXsd(xml) {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    removeNSPrefix: true,
    isArray: (name) =>
      ['element', 'enumeration', 'complexType', 'simpleType', 'attribute'].includes(name)
  }).parse(xml).schema;
}

/** Libellés d'enum (appinfo JSON) => "1=avant 1948, 2=1948-1974". */
function enumLabels(annotation) {
  const raw = asArray(annotation?.appinfo)
    .map(text)
    .find((t) => t.trim().startsWith('{'));
  if (!raw) return '';
  try {
    const entries = Object.entries(JSON.parse(raw));
    const s = entries.map(([k, v]) => `${k}=${oneLine(String(v))}`).join(', ');
    return s.length > 400 ? `${s.slice(0, 400)}…` : s;
  } catch {
    return '';
  }
}

export function generate(xml, { sourceLabel = 'DPEv2.7.xsd' } = {}) {
  const schema = parseXsd(xml);
  const simpleTypes = new Map(schema.simpleType.map((s) => [s['@_name'], s]));
  const complexTypes = new Map(schema.complexType.map((c) => [c['@_name'], c]));
  const topElements = new Map(schema.element.map((e) => [e['@_name'], e]));
  const version = text(asArray(topElements.get('dpe')?.annotation?.documentation)[0]);

  /** @type {Map<string, string>} nom d'interface -> source TS */
  const interfaces = new Map();
  const docOf = (annotation) => oneLine(asArray(annotation?.documentation).map(text).join(' '));
  const unique = (base) => {
    let name = base;
    for (let i = 2; interfaces.has(name); i++) name = `${base}${i}`;
    return name;
  };

  /** Type TS d'un xs:simpleType / type nommé / xs:* */
  function simpleTs(name, simple, typeAttr) {
    if (typeAttr?.startsWith('xs:')) simple = { restriction: { '@_base': typeAttr } };
    else if (typeAttr) simple = simpleTypes.get(typeAttr);
    const r = simple?.restriction;
    if (!r) return 'string';
    const base = r['@_base'];
    if (name.startsWith('enum_')) return 'string';
    const values = asArray(r.enumeration).map((e) => e['@_value']);
    if (base === 'xs:int' || base === 'xs:double' || base === 'xs:decimal') {
      return values.length ? values.map(Number).join(' | ') : 'number';
    }
    if (base === 'xs:boolean') return 'boolean';
    if (values.length) return values.map((v) => JSON.stringify(v)).join(' | ');
    return 'string'; // xs:string, xs:date, xs:dateTime
  }

  /** Construit l'interface d'un xs:complexType et retourne son nom. */
  function buildComplex(ct, segs, doc, explicitName) {
    if (explicitName && interfaces.has(explicitName)) return explicitName; // type nommé déjà généré
    const name = explicitName ?? unique(`Xsd${segs.map(pascal).join('')}`);
    interfaces.set(name, ''); // réserve le nom (récursion)
    const lines = [];
    const walk = (g, inChoice) => {
      for (const el of asArray(g.element)) lines.push(...propLines(el, segs, inChoice));
      if (g.any) lines.push('  [key: string]: any;');
      for (const sub of asArray(g.choice)) walk(sub, true);
      for (const sub of asArray(g.sequence)) walk(sub, inChoice);
    };
    for (const g of [ct.all, ct.sequence, ct.choice].filter(Boolean)) walk(g, g === ct.choice);
    for (const at of asArray(ct.attribute)) {
      const d = docOf(at.annotation);
      if (d) lines.push(`  /** ${d} (attribut XML) */`);
      lines.push(`  ${at['@_name']}${at['@_use'] === 'required' ? '' : '?'}: string;`);
    }
    const head = doc ? `/** ${doc} */\n` : '';
    interfaces.set(name, `${head}export interface ${name} {\n${lines.join('\n')}\n}`);
    return name;
  }

  function propLines(el, segs, inChoice) {
    const ref = el['@_ref'];
    const name = el['@_name'] ?? ref;
    const target = ref ? topElements.get(ref) : el;
    const doc = docOf(target.annotation);
    const labels = enumLabels(target.annotation);

    const minOccurs = el['@_minOccurs'] ?? '1';
    const maxOccurs = el['@_maxOccurs'] ?? '1';
    const optional = inChoice || minOccurs === '0';
    const nullable = el['@_nillable'] === 'true';
    const many = maxOccurs === 'unbounded' || Number(maxOccurs) > 1;

    let type;
    const ct = target.complexType?.[0];
    if (ref) {
      type = buildComplex(
        topElements.get(ref).complexType[0],
        [ref],
        docOf(topElements.get(ref).annotation)
      );
    } else if (target['@_type'] && complexTypes.has(target['@_type'])) {
      type = buildComplex(
        complexTypes.get(target['@_type']),
        [target['@_type']],
        '',
        `Xsd${pascal(target['@_type'])}`
      );
    } else if (ct) {
      type = complexTs(name, ct, segs, doc);
    } else {
      type = simpleTs(name, target.simpleType?.[0], target['@_type']);
    }

    if (many) {
      type = ALWAYS_ARRAY.has(name) ? `(${type})[]` : `${type} | (${type})[]`;
    }
    const full = type + (nullable ? ' | null' : '');
    const comment = [doc, labels && `Valeurs : ${labels}`].filter(Boolean).join(' — ');
    return [
      ...(comment ? [`  /** ${comment} */`] : []),
      `  ${name}${optional ? '?' : ''}: ${full};`
    ];
  }

  /** Type d'un élément complexe ; fusionne le motif `X_collection > X` en type littéral. */
  function complexTs(name, ct, segs, doc) {
    const inner = asArray((ct.all ?? ct.sequence)?.element);
    const isCollection =
      name.endsWith('_collection') &&
      inner.length === 1 &&
      inner[0]['@_name'] === name.slice(0, -'_collection'.length);
    if (isCollection) {
      const item = inner[0];
      const itemCt = item.complexType?.[0];
      const itemType = itemCt
        ? complexTs(item['@_name'], itemCt, segs, docOf(item.annotation))
        : simpleTs(item['@_name'], item.simpleType?.[0], item['@_type']);
      const many = item['@_maxOccurs'] === 'unbounded' || Number(item['@_maxOccurs']) > 1;
      const arr = many
        ? ALWAYS_ARRAY.has(item['@_name'])
          ? `(${itemType})[]`
          : `${itemType} | (${itemType})[]`
        : itemType;
      return `{ ${item['@_name']}${item['@_minOccurs'] === '0' ? '?' : ''}: ${arr} }`;
    }
    if (!ct.all && !ct.sequence && !ct.choice && !ct.attribute) return 'any';
    return buildComplex(ct, [...segs, name], doc);
  }

  // Racine : dpe (chemin vide, interface XsdDpe) ; administratif = élément global référencé
  const dpe = topElements.get('dpe');
  const dpeName = buildComplex(dpe.complexType[0], [], docOf(dpe.annotation), 'XsdDpe');
  // les segments des enfants de dpe commencent par leur propre nom (segs = [])
  const header = `/**
 * Fichier généré par scripts/generate_types_from_xsd.js — ne pas modifier.
 * Source : ${sourceLabel}
 * ${oneLine(version)}
 * Régénération : npm run types:generate
 *
 * Les extensions propres à Open3CL (donnees de calcul, DU, champs calculés par le moteur) ne sont
 * pas ici : voir les fichiers *.model.ts voisins.
 */
/* eslint-disable */
`;
  void dpeName;
  return `${header}\n${[...interfaces.values()].join('\n\n')}\n`;
}

async function main() {
  const [src = process.env.DPE_XSD_PATH ?? XSD_URL, out = DEFAULT_OUT] = process.argv.slice(2);
  let xml;
  if (/^https?:/.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Téléchargement du XSD impossible (${res.status}) : ${src}`);
    xml = await res.text();
  } else {
    xml = readFileSync(src, 'utf8');
  }
  const ts = generate(xml, {
    sourceLabel: src.startsWith('http') ? src : 'DPEv2.7.xsd (observatoire-dpe)'
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, ts);
  console.log(`${out} écrit (${ts.split('\n').length} lignes)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
