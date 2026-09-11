#!/usr/bin/env node

/**
 * Génère la section « Résultats corpus » d'un fichier markdown à partir des
 * rapports produits par les tests de corpus.
 *
 * Source  : dist/reports/corpus/<corpus>.csv/corpus_global_report_<branche>.json
 * Cible   : bloc délimité par <!-- CORPUS:START --> / <!-- CORPUS:END -->
 * Archive : docs/CORPUS-HISTORY.md (une section par exécution)
 *
 * Utilisation :
 *   node scripts/generate_corpus_readme.js
 *   node scripts/generate_corpus_readme.js --readme=README.new.md
 *   node scripts/generate_corpus_readme.js --dry-run
 *
 * Options :
 *   --readme=<path>    Fichier markdown à mettre à jour   (défaut: README.md)
 *   --branch=<name>    Branche des rapports à lire        (défaut: branche git courante)
 *   --version=<x.y.z>  Version affichée                   (défaut: dernier tag git)
 *   --history=<path>   Historique markdown                (défaut: docs/CORPUS-HISTORY.md)
 *   --no-history       N'alimente pas l'historique
 *   --dry-run          Affiche le bloc généré sans rien écrire
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_FOLDER_PATH = resolve(ROOT, 'dist/reports/corpus');

const START_MARKER = '<!-- CORPUS:START -->';
const END_MARKER = '<!-- CORPUS:END -->';

/** Largeur de la barre de progression en caractères. */
const BAR_WIDTH = 20;

/** Corpus affiché en premier : c'est le corpus généraliste de référence. */
const MAIN_CORPUS = 'corpus_dpe.csv';

/** Libellés lisibles des corpus. */
const CORPUS_LABELS = {
  'corpus_dpe.csv': 'Généraliste',
  'dpe_logement_individuel_2025.csv': 'Logement individuel (2025)',
  'dpe_maison_individuelle_2025.csv': 'Maison individuelle (2025)',
  'dpe_appartement_individuel_chauffage_individuel_2025.csv':
    'Appartement · chauffage individuel (2025)',
  'dpe_appartement_individuel_chauffage_collectif_2025.csv':
    'Appartement · chauffage collectif (2025)',
  'dpe_immeuble_chauffage_individuel.csv': 'Immeuble · chauffage individuel',
  'dpe_immeuble_chauffage_collectif.csv': 'Immeuble · chauffage collectif',
  'dpe_immeuble_chauffage_mixte.csv': 'Immeuble · chauffage mixte',
  'dpe_individuel_a_partir_dpe_immeuble_2026.csv': "Individuel généré depuis l'immeuble (2026)"
};

// ----------------------------------------------------------------------------
// Arguments
// ----------------------------------------------------------------------------

/**
 * @param name {string} nom de l'option
 * @param fallback {string|undefined} valeur par défaut
 * @return {string|undefined}
 */
function arg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
}

/**
 * @param name {string} nom du drapeau
 * @return {boolean}
 */
function flag(name) {
  return process.argv.includes(`--${name}`);
}

/**
 * Exécute une commande git et renvoie sa sortie, ou `undefined` si elle échoue
 * (dépôt absent, aucun tag, ...).
 * @param command {string}
 * @return {string|undefined}
 */
function git(command) {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

// ----------------------------------------------------------------------------
// Lecture des rapports
// ----------------------------------------------------------------------------

/**
 * Liste les corpus connus, dans l'ordre du fichier d'index s'il existe.
 * @return {string[]}
 */
function listCorpusFiles() {
  const indexPath = resolve(REPORTS_FOLDER_PATH, 'corpus_list_main.json');
  if (existsSync(indexPath)) {
    const { files } = JSON.parse(readFileSync(indexPath, { encoding: 'utf8' }));
    if (Array.isArray(files) && files.length) return files;
  }
  if (!existsSync(REPORTS_FOLDER_PATH)) return [];
  return readdirSync(REPORTS_FOLDER_PATH, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * @param corpusFile {string} nom du fichier de corpus
 * @param branch {string} branche des rapports
 * @return {object|undefined} rapport global, ou `undefined` s'il n'existe pas
 */
function readGlobalReport(corpusFile, branch) {
  const path = resolve(REPORTS_FOLDER_PATH, corpusFile, `corpus_global_report_${branch}.json`);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, { encoding: 'utf8' }));
}

/**
 * Construit une ligne de résultat par corpus disposant d'un rapport.
 * @param branch {string}
 * @return {{corpus: string, label: string, below: number, valid: number, total: number, ratio: number, threshold: string}[]}
 */
function collectResults(branch) {
  return listCorpusFiles()
    .map((corpus) => {
      const report = readGlobalReport(corpus, branch);
      if (!report) return undefined;
      const total = report.totalDpesInFile || 0;
      const below = report.nbAllChecksBelowThreshold || 0;
      return {
        corpus,
        label: CORPUS_LABELS[corpus] || corpus.replace(/\.csv$/, ''),
        below,
        valid: report.nbValidDpe || 0,
        total,
        ratio: total ? (below / total) * 100 : 0,
        threshold: report.threshold || '5%'
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.corpus === MAIN_CORPUS) return -1;
      if (b.corpus === MAIN_CORPUS) return 1;
      return b.ratio - a.ratio;
    });
}

// ----------------------------------------------------------------------------
// Rendu markdown
// ----------------------------------------------------------------------------

const fmtNum = (n) => new Intl.NumberFormat('fr-FR').format(n);
const fmtRatio = (n) => `${n.toFixed(2).replace('.', ',')} %`;

/**
 * Barre de progression en blocs pleins / vides.
 * @param ratio {number} pourcentage entre 0 et 100
 * @return {string}
 */
function bar(ratio) {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((ratio / 100) * BAR_WIDTH)));
  return `${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}`;
}

/**
 * @param ratio {number}
 * @return {string} pastille de statut
 */
function statusDot(ratio) {
  if (ratio >= 85) return '🟢';
  if (ratio >= 60) return '🟡';
  return '🔴';
}

/**
 * @param rows {object[]}
 * @param context {{version: string, branch: string, date: string}}
 * @return {string} contenu markdown du bloc (sans les marqueurs)
 */
function renderBlock(rows, { version, branch, date }) {
  if (!rows.length) {
    return [
      '',
      '> Aucun rapport de corpus trouvé. Lancez `npm run test:corpus:all` pour les générer.',
      ''
    ].join('\n');
  }

  const totalDpe = rows.reduce((acc, r) => acc + r.total, 0);
  const totalBelow = rows.reduce((acc, r) => acc + r.below, 0);
  const globalRatio = totalDpe ? (totalBelow / totalDpe) * 100 : 0;
  const threshold = rows[0].threshold;

  const lines = [
    '',
    `> **Version \`${version}\`** · branche \`${branch}\` · généré le ${date}`,
    `> Seuil de tolérance **${threshold}**`,
    '',
    '<table>',
    '<tr>',
    `<td align="center"><strong>${fmtNum(rows.length)}</strong><br/><sub>corpus</sub></td>`,
    `<td align="center"><strong>${fmtNum(totalDpe)}</strong><br/><sub>DPE analysés</sub></td>`,
    `<td align="center"><strong>${fmtNum(totalBelow)}</strong><br/><sub>DPE conformes</sub></td>`,
    `<td align="center"><strong>${fmtRatio(globalRatio)}</strong><br/><sub>réussite globale</sub></td>`,
    '</tr>',
    '</table>',
    '',
    '| | Corpus | Réussite | | DPE conformes |',
    '| :-: | :--- | ---: | :--- | ---: |'
  ];

  for (const row of rows) {
    const cells = [
      statusDot(row.ratio),
      `**${row.label}**<br/><sub>\`${row.corpus}\`</sub>`,
      `**${fmtRatio(row.ratio)}**`,
      `\`${bar(row.ratio)}\``,
      `${fmtNum(row.below)} / ${fmtNum(row.total)}`
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }

  lines.push('', '<sub>🟢 ≥ 85 % · 🟡 ≥ 60 % · 🔴 < 60 %</sub>', '');

  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// Écriture
// ----------------------------------------------------------------------------

/**
 * Remplace le contenu situé entre les marqueurs.
 * @param content {string} contenu du fichier markdown
 * @param block {string} nouveau contenu
 * @return {string|undefined} contenu mis à jour, ou `undefined` si marqueurs absents
 */
function replaceBlock(content, block) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) return undefined;
  return content.slice(0, start + START_MARKER.length) + '\n' + block + '\n' + content.slice(end);
}

/**
 * Ajoute la génération courante en tête de l'historique.
 * @param path {string}
 * @param rows {object[]}
 * @param context {{version: string, branch: string, date: string}}
 */
function appendHistory(path, rows, context) {
  const header = [
    '# Historique des résultats de corpus',
    '',
    'Une section par génération, la plus récente en premier. Ce fichier est alimenté',
    'automatiquement par `npm run reports:readme`.',
    ''
  ].join('\n');

  const title = `## ${context.version} — ${context.date} (\`${context.branch}\`)`;
  const section = [title, renderBlock(rows, context), ''].join('\n');

  const existing = existsSync(path) ? readFileSync(path, { encoding: 'utf8' }) : `${header}\n`;

  // Une seule section par (version, date, branche) : une nouvelle génération le
  // même jour remplace la précédente au lieu de s'empiler.
  const sameSection = existing.indexOf(`\n${title}`);
  if (sameSection !== -1) {
    const after = existing.indexOf('\n## ', sameSection + 1);
    const tail = after === -1 ? '' : existing.slice(after + 1);
    writeFileSync(path, `${existing.slice(0, sameSection + 1)}${section}${tail}`, {
      encoding: 'utf8'
    });
    return;
  }

  // Insertion avant la première section existante pour garder l'ordre antéchronologique.
  const firstSection = existing.indexOf('\n## ');
  const content =
    firstSection === -1
      ? `${existing}\n${section}`
      : `${existing.slice(0, firstSection + 1)}${section}${existing.slice(firstSection + 1)}`;

  writeFileSync(path, content, { encoding: 'utf8' });
}

/**
 * Reformate les fichiers écrits avec le prettier du projet, s'il est installé.
 * Sans cela, le hook de pre-commit reformaterait le bloc généré et chaque
 * exécution produirait un diff parasite.
 * @param paths {string[]}
 */
function formatWithPrettier(paths) {
  const bin = resolve(ROOT, 'node_modules/.bin/prettier');
  if (!existsSync(bin) || !paths.length) return;
  try {
    execSync(`"${bin}" --write --log-level=silent ${paths.map((p) => `"${p}"`).join(' ')}`, {
      cwd: ROOT,
      stdio: 'ignore'
    });
  } catch {
    // Le formatage est un confort : son échec ne doit pas faire échouer la génération.
  }
}

// ----------------------------------------------------------------------------
// Point d'entrée
// ----------------------------------------------------------------------------

const branch = arg('branch', git('git rev-parse --abbrev-ref HEAD') || 'main');
const version = arg(
  'version',
  (git('git describe --tags --abbrev=0') || '').replace(/^v/, '') ||
    JSON.parse(readFileSync(resolve(ROOT, 'package.json'), { encoding: 'utf8' })).version
);
const readmePath = resolve(ROOT, arg('readme', 'README.md'));
const historyPath = resolve(ROOT, arg('history', 'docs/CORPUS-HISTORY.md'));
const dryRun = flag('dry-run');

const date = new Date().toISOString().slice(0, 10);
const rows = collectResults(branch);
const block = renderBlock(rows, { version, branch, date });

if (dryRun) {
  console.log(block);
  process.exit(0);
}

if (!existsSync(readmePath)) {
  console.error(`❌ Fichier introuvable : ${readmePath}`);
  process.exit(1);
}

const content = readFileSync(readmePath, { encoding: 'utf8' });
const updated = replaceBlock(content, block);

if (!updated) {
  console.warn(
    `⚠️  Marqueurs ${START_MARKER} / ${END_MARKER} absents de ${readmePath} : rien à mettre à jour.`
  );
  process.exit(0);
}

writeFileSync(readmePath, updated, { encoding: 'utf8' });
console.log(
  `✅ Résultats corpus écrits dans ${readmePath} (${rows.length} corpus, branche ${branch})`
);

if (!rows.length) process.exit(0);

if (!flag('no-history')) {
  appendHistory(historyPath, rows, { version, branch, date });
  console.log(`✅ Historique mis à jour : ${historyPath}`);
}

formatWithPrettier([readmePath, flag('no-history') ? undefined : historyPath].filter(Boolean));
