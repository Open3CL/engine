/**
 * Génère les définitions de types des tables du moteur à partir de leur contenu réel :
 * - `src/enums.d.ts` pour `src/enums.js` (tables d'enums : identifiant => libellé) ;
 * - `src/tv.d.ts` pour `src/tv.js` (tables de valeurs).
 *
 * Les `.d.ts` placés à côté des `.js` sont utilisés par TypeScript (checkJs, éditeur) à la place
 * de l'inférence sur les fichiers source (`tv.js` pèse ~3 Mo).
 *
 * Règles :
 * - enums : clés et libellés conservés en littéraux, plus une signature d'index `string` (les
 *   identifiants d'enum sont toujours des chaînes) ;
 * - tables de valeurs « lignes » (tableaux) : une interface de ligne par table, champs `string`
 *   (valeurs conservées en chaîne dans `tv.js`), optionnels s'ils ne sont pas présents sur toutes
 *   les lignes ;
 * - tables de valeurs « dictionnaires » (objets imbriqués : météo, c1, seuils...) : type inféré
 *   récursivement, clés littérales si leur nombre reste raisonnable, `Record<string, T>` sinon.
 *
 * Usage : node scripts/generate_tables_types.js
 * (relancer après `npm run assets:sync`, inclus dans `npm run types:generate`).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const HEADER = (source) =>
  `/**\n * Fichier généré par scripts/generate_tables_types.js depuis src/${source} — ne pas modifier.\n */\n`;
const MAX_LITERAL_KEYS = 40;

const pascal = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

/* ----------------------------------------------------------------------------------------------
 * enums.d.ts
 * -------------------------------------------------------------------------------------------- */
async function generateEnums() {
  const { default: enums } = await import('../src/enums.js');
  const tables = Object.entries(enums).map(([name, values]) => {
    const entries = Object.entries(values)
      .map(([id, label]) => `    readonly ${JSON.stringify(id)}: ${JSON.stringify(label)};`)
      .join('\n');
    return `  ${key(name)}: {\n${entries}\n    readonly [id: string]: string;\n  };`;
  });
  const out =
    HEADER('enums.js') +
    `\n/** Table d'enum : identifiant (toujours une chaîne) => libellé. */\n` +
    `export type EnumTable = { readonly [id: string]: string };\n\n` +
    `/** Ensemble des tables d'enums de la méthode 3CL (observatoire DPE). */\n` +
    `export interface TableEnum {\n${tables.join('\n')}\n}\n\n` +
    `/** Nom d'une table d'enum. */\nexport type EnumTableName = keyof TableEnum;\n\n` +
    `declare const enums: TableEnum;\nexport default enums;\n`;
  writeFileSync(join(SRC, 'enums.d.ts'), out);
  return Object.keys(enums).length;
}

/* ----------------------------------------------------------------------------------------------
 * tv.d.ts
 * -------------------------------------------------------------------------------------------- */
function primitive(v) {
  if (v === null) return 'null';
  return typeof v;
}

/** Nom métier d'un dictionnaire selon ses clés (zones climatiques, mois, classes d'altitude...). */
function structureName(keys) {
  if (keys.every((k) => /^h[1-3][a-d]?$/.test(k))) return 'TvParZoneClimatique';
  if (keys.includes('Janvier') && keys.includes('Décembre')) return 'TvParMois';
  if (keys.some((k) => k.includes('400m'))) return 'TvParClasseAltitude';
  if (keys.every((k) => /^[A-G]$/.test(k))) return 'TvParClasseEtiquette';
  if (keys.every((k) => /^(sud|nord|est|ouest|horizontal)/.test(k))) return 'TvParOrientation';
  return null;
}

/** Types « dictionnaires » mutualisés : corps du type => nom (ex. mois × zone climatique). */
const sharedTypes = new Map();

/**
 * Infère le type d'un ensemble de valeurs de même position dans une table « dictionnaire ».
 * Chaque objet imbriqué est remonté en type nommé, réutilisé lorsqu'une autre table a la même
 * structure (évite de répéter 12 mois × 8 zones dans chaque table météo).
 */
function inferType(values, path) {
  const objects = values.filter((v) => v !== null && typeof v === 'object' && !Array.isArray(v));
  const others = values.filter((v) => !(v !== null && typeof v === 'object' && !Array.isArray(v)));
  const parts = new Set(others.map(primitive));
  if (objects.length) {
    const keys = [...new Set(objects.flatMap((o) => Object.keys(o)))];
    const children = (k) => objects.filter((o) => k in o).map((o) => o[k]);
    if (keys.length > MAX_LITERAL_KEYS) {
      parts.add(`Record<string, ${inferType(keys.flatMap(children), path)}>`);
    } else {
      const lines = keys.map((k) => {
        const optional = objects.every((o) => k in o) ? '' : '?';
        return `  ${key(k)}${optional}: ${inferType(children(k), [...path, k])};`;
      });
      const body = `{\n${lines.join('\n')}\n}`;
      if (!sharedTypes.has(body)) {
        const base = structureName(keys) ?? `Tv${path.map(pascal).join('') || 'Dict'}`;
        let name = base;
        for (let i = 2; [...sharedTypes.values()].includes(name); i++) name = `${base}${i}`;
        sharedTypes.set(body, name);
      }
      parts.add(sharedTypes.get(body));
    }
  }
  return [...parts].join(' | ') || 'unknown';
}

async function generateTv() {
  const { tvs } = await import('../src/tv.js');
  const rowInterfaces = [];
  const members = [];
  for (const [name, table] of Object.entries(tvs)) {
    if (Array.isArray(table)) {
      const rowName = `Tv${pascal(name)}Row`;
      const fields = [...new Set(table.flatMap((r) => Object.keys(r)))];
      const lines = fields.map((f) => {
        const optional = table.every((r) => f in r) ? '' : '?';
        const types = [...new Set(table.filter((r) => f in r).map((r) => primitive(r[f])))];
        return `  ${key(f)}${optional}: ${types.join(' | ')};`;
      });
      rowInterfaces.push(
        `/** Ligne de la table de valeurs \`${name}\`. */\nexport interface ${rowName} {\n${lines.join('\n')}\n}`
      );
      members.push(`  ${key(name)}: ${rowName}[];`);
    } else {
      members.push(`  ${key(name)}: ${inferType([table], [name])};`);
    }
  }
  const arrayNames = Object.entries(tvs)
    .filter(([, t]) => Array.isArray(t))
    .map(([n]) => JSON.stringify(n));
  const out =
    HEADER('tv.js') +
    `\n${rowInterfaces.join('\n\n')}\n\n` +
    [...sharedTypes].map(([body, n]) => `export type ${n} = ${body};`).join('\n\n') +
    `\n\n` +
    `/** Ensemble des tables de valeurs de la méthode 3CL. */\nexport interface TableValeur {\n${members.join('\n')}\n}\n\n` +
    `/** Nom d'une table de valeurs. */\nexport type TvTableName = keyof TableValeur;\n\n` +
    `/** Nom d'une table de valeurs organisée en lignes (utilisable avec \`tv()\`). */\nexport type TvRowTableName = ${arrayNames.join(' | ')};\n\n` +
    `/** Ligne d'une table de valeurs organisée en lignes. */\nexport type TvRow<K extends TvRowTableName> = TableValeur[K][number];\n\n` +
    `export declare const tvs: TableValeur;\nexport default tvs;\n`;
  writeFileSync(join(SRC, 'tv.d.ts'), out);
  return { lignes: arrayNames.length, dictionnaires: Object.keys(tvs).length - arrayNames.length };
}

const nbEnums = await generateEnums();
const tv = await generateTv();
console.log(
  `src/enums.d.ts : ${nbEnums} tables d'enums ; src/tv.d.ts : ${tv.lignes} tables en lignes, ${tv.dictionnaires} dictionnaires`
);
