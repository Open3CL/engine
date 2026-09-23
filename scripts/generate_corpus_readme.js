#!/usr/bin/env node

/**
 * Génère la section « Résultats corpus » d'un fichier markdown à partir des
 * rapports produits par les tests de corpus.
 *
 * Source  : dist/reports/corpus/<corpus>.csv/corpus_global_report_<branche>.json
 * Cible   : bloc délimité par <!-- CORPUS:START --> / <!-- CORPUS:END -->
 * Archive : docs/CORPUS-HISTORY.md (une section par version, branche main uniquement)
 * Données : docs/corpus-history.json (une entrée par version) et sa copie
 *           dist/reports/corpus/corpus_history.json, lue par la courbe du rapport HTML
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
 *   --date=<aaaa-mm-jj> Date affichée                     (défaut: aujourd'hui)
 *   --history=<path>   Historique markdown                (défaut: docs/CORPUS-HISTORY.md)
 *   --history-branch=<name> Branche archivée dans l'historique (défaut: main)
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

/** Bloc de la courbe, régénéré à chaque écriture de l'historique. */
const CHART_START_MARKER = '<!-- CORPUS-CHART:START -->';
const CHART_END_MARKER = '<!-- CORPUS-CHART:END -->';

/**
 * Seule branche archivée dans l'historique : les exécutions de branche servent à
 * comparer une PR à `main`, elles n'ont pas leur place dans le suivi des versions.
 */
const HISTORY_BRANCH = 'main';

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
        threshold: report.threshold || '5%',
        // Absent des rapports générés avant l'ajout de la mesure de temps.
        perf: report.performance
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
const fmtMs = (ms) =>
  ms === undefined || ms === null
    ? '—'
    : ms >= 1000
      ? `${(ms / 1000).toFixed(2).replace('.', ',')} s`
      : `${ms.toFixed(ms < 10 ? 2 : 1).replace('.', ',')} ms`;

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
  lines.push(...renderPerformanceBlock(rows));

  return lines.join('\n');
}

/**
 * Bloc « temps d'exécution ». Les rapports antérieurs à l'ajout de la mesure n'ont pas de
 * section `performance` : le bloc est alors omis.
 *
 * @param rows {{label: string, corpus: string, perf: object|undefined}[]}
 * @return {string[]}
 */
function renderPerformanceBlock(rows) {
  const withPerf = rows.filter((row) => row.perf?.count);
  if (!withPerf.length) return [];

  const count = withPerf.reduce((acc, r) => acc + r.perf.count, 0);
  const totalMs = withPerf.reduce((acc, r) => acc + r.perf.totalMs, 0);
  const min = Math.min(...withPerf.map((r) => r.perf.min));
  const max = Math.max(...withPerf.map((r) => r.perf.max));

  const lines = [
    '',
    '#### Temps d’exécution',
    '',
    `> Durée de l’appel à \`calcul_3cl\` par DPE, sur ${fmtNum(count)} calculs.`,
    '> La copie défensive de l’entrée et la lecture du fichier sont exclues de la mesure.',
    '',
    '<table>',
    '<tr>',
    `<td align="center"><strong>${fmtMs(totalMs / count)}</strong><br/><sub>moyenne</sub></td>`,
    `<td align="center"><strong>${fmtMs(medianOfCorpora(withPerf))}</strong><br/><sub>médiane</sub></td>`,
    `<td align="center"><strong>${fmtMs(min)}</strong><br/><sub>min</sub></td>`,
    `<td align="center"><strong>${fmtMs(max)}</strong><br/><sub>max</sub></td>`,
    '</tr>',
    '</table>',
    '',
    '| Corpus | Moyenne | Médiane | Min | Max | p95 | p99 |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | ---: |'
  ];

  for (const row of withPerf) {
    const p = row.perf;
    lines.push(
      `| **${row.label}** | ${fmtMs(p.mean)} | ${fmtMs(p.median)} | ${fmtMs(p.min)} | ${fmtMs(p.max)} | ${fmtMs(p.p95)} | ${fmtMs(p.p99)} |`
    );
  }

  lines.push(
    '',
    '<sub>La moyenne est tirée vers le haut par les DPE collectifs, dont le coût atteint plusieurs',
    'dizaines de fois la médiane : c’est la médiane qui décrit le cas courant, et p95/p99 le cas',
    'défavorable réel.</sub>',
    ''
  );

  return lines;
}

/**
 * Médiane globale, approchée par la moyenne des médianes pondérée par le nombre de DPE.
 *
 * La médiane exacte demanderait de conserver les durées de tous les corpus réunis ; les rapports
 * n’en gardent que les quantiles. L’approximation est fidèle tant que les corpus ont des profils
 * proches, et reste un bien meilleur indicateur du cas courant que la moyenne.
 *
 * @param rows {{perf: {median: number, count: number}}[]}
 * @return {number}
 */
function medianOfCorpora(rows) {
  const count = rows.reduce((acc, r) => acc + r.perf.count, 0);
  return rows.reduce((acc, r) => acc + r.perf.median * r.perf.count, 0) / count;
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
 * Compare deux numéros de version (ordre croissant).
 * @param a {string}
 * @param b {string}
 * @return {number}
 */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

/**
 * Enregistre les résultats de la version courante dans le fichier de données, une
 * entrée par version. Réexécuter la même version écrase son entrée.
 *
 * @param path {string}
 * @param rows {object[]}
 * @param context {{version: string, date: string}}
 * @return {{versions: {version: string, date: string|null, results: Object<string, {below: number, total: number}>}[]}}
 */
function updateHistoryData(path, rows, { version, date }) {
  const history = existsSync(path)
    ? JSON.parse(readFileSync(path, { encoding: 'utf8' }))
    : { versions: [] };

  const results = {};
  for (const row of rows) {
    results[row.corpus] = { below: row.below, total: row.total };
  }

  const entry = { version, date, results };
  const index = history.versions.findIndex((item) => item.version === version);
  if (index === -1) {
    history.versions.push(entry);
  } else {
    history.versions[index] = entry;
  }
  history.versions.sort((a, b) => compareVersions(a.version, b.version));

  writeFileSync(path, `${JSON.stringify(history, null, 2)}\n`, { encoding: 'utf8' });
  return history;
}

/**
 * Publie les données d'historique à côté des rapports : le rapport HTML les lit en
 * relatif (`corpus_history.json`) pour tracer la courbe d'évolution.
 *
 * @param history {object}
 * @return {string} chemin écrit
 */
function writeReportHistoryData(history) {
  const path = resolve(REPORTS_FOLDER_PATH, 'corpus_history.json');
  writeFileSync(path, `${JSON.stringify(history)}\n`, { encoding: 'utf8' });
  return path;
}

/**
 * Bloc de la courbe : l'image dans ses deux thèmes, puis les données qui la
 * composent, pour que le graphe ne soit pas la seule façon de lire les chiffres.
 *
 * @param history {object}
 * @return {string}
 */
function renderChartBlock(history) {
  const seen = new Set(history.versions.flatMap((entry) => Object.keys(entry.results)));
  const corpora = [
    ...Object.keys(CORPUS_LABELS).filter((corpus) => seen.has(corpus)),
    ...[...seen].filter((corpus) => !CORPUS_LABELS[corpus]).sort()
  ].map((corpus) => ({ corpus, label: CORPUS_LABELS[corpus] || corpus.replace(/\.csv$/, '') }));

  const lines = [
    '',
    '> 📈 **Courbe interactive** : `npm run reports:preview`, section « Historique des versions ».',
    '> Une courbe par corpus, survol pour comparer les versions, bascule nombre / taux.',
    '',
    '<details>',
    '<summary>Données de la courbe — DPE conformes par version</summary>',
    '',
    `| Version | ${corpora.map((c) => c.label).join(' | ')} |`,
    `| :--- | ${corpora.map(() => '---:').join(' | ')} |`
  ];

  for (const entry of [...history.versions].reverse()) {
    const cells = corpora.map((c) =>
      typeof entry.results[c.corpus]?.below === 'number'
        ? fmtNum(entry.results[c.corpus].below)
        : '—'
    );
    lines.push(`| **${entry.version}** | ${cells.join(' | ')} |`);
  }

  lines.push(
    '',
    '</details>',
    '',
    '<sub>Un corpus absent d’une version n’était pas encore joué à cette date : la courbe démarre',
    'à sa première mesure. Les versions antérieures à 1.6.2 proviennent du tableau tenu à la main,',
    'dont deux valeurs manquantes ou erronées ont été écartées (`corpus_dpe.csv` en 1.2.8 et 1.3.25).</sub>',
    ''
  );

  return lines.join('\n');
}

/**
 * Insère ou remplace le bloc de la courbe, avant la première section de version.
 * @param content {string}
 * @param block {string}
 * @return {string}
 */
function replaceChartBlock(content, block) {
  const start = content.indexOf(CHART_START_MARKER);
  const end = content.indexOf(CHART_END_MARKER);
  if (start !== -1 && end !== -1 && end > start) {
    return (
      content.slice(0, start + CHART_START_MARKER.length) + '\n' + block + '\n' + content.slice(end)
    );
  }

  const wrapped = `${CHART_START_MARKER}\n${block}\n${CHART_END_MARKER}\n`;
  const firstSection = content.indexOf('\n## ');
  return firstSection === -1
    ? `${content}\n${wrapped}`
    : `${content.slice(0, firstSection + 1)}${wrapped}\n${content.slice(firstSection + 1)}`;
}

/**
 * Met l'historique à jour : une seule section par version, la plus récente en
 * premier, précédée de la courbe.
 *
 * @param path {string}
 * @param history {object}
 * @param rows {object[]}
 * @param context {{version: string, date: string}}
 */
function writeHistory(path, history, rows, context) {
  const header = [
    '# Historique des résultats de corpus',
    '',
    'Une section par version publiée, la plus récente en premier, pour la branche `main`',
    'uniquement. Ce fichier est alimenté automatiquement par `npm run reports:readme`.',
    ''
  ].join('\n');

  const title = `## ${context.version} — ${context.date}`;
  const section = [title, renderBlock(rows, context), ''].join('\n');

  let existing = existsSync(path) ? readFileSync(path, { encoding: 'utf8' }) : `${header}\n`;

  // Une seule section par version : toutes les sections de cette version sont
  // retirées, y compris celles générées par une exécution antérieure.
  const versionPattern = new RegExp(
    `\n## ${context.version.replace(/\./g, '\\.')} —[^\n]*\n[\\s\\S]*?(?=\n## |$)`,
    'g'
  );
  existing = existing.replace(versionPattern, '\n');

  // Insertion avant la première section existante pour garder l'ordre antéchronologique.
  const firstSection = existing.indexOf('\n## ');
  const content =
    firstSection === -1
      ? `${existing}\n${section}`
      : `${existing.slice(0, firstSection + 1)}${section}${existing.slice(firstSection + 1)}`;

  // Le retrait d'anciennes sections laisse des lignes vides en trop : on les réduit
  // ici plutôt que de compter sur prettier, qui peut ne pas être installé.
  const markdown = replaceChartBlock(content, renderChartBlock(history)).replace(/\n{3,}/g, '\n\n');

  writeFileSync(path, markdown, { encoding: 'utf8' });
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
const historyBranch = arg('history-branch', HISTORY_BRANCH);
const historyDataPath = resolve(dirname(historyPath), 'corpus-history.json');
const dryRun = flag('dry-run');

const date = arg('date', new Date().toISOString().slice(0, 10));
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

if (flag('no-history')) {
  formatWithPrettier([readmePath]);
  process.exit(0);
}

// L'historique suit les versions publiées : une exécution de branche compare une PR
// à `main` et n'a pas à y laisser de trace.
if (branch !== historyBranch) {
  console.log(`↪️  Historique inchangé : branche ${branch} (seule ${historyBranch} est archivée).`);
  formatWithPrettier([readmePath]);
  process.exit(0);
}

const history = updateHistoryData(historyDataPath, rows, { version, date });
writeHistory(historyPath, history, rows, { version, branch, date });
const reportData = writeReportHistoryData(history);

console.log(`✅ Historique mis à jour : ${historyPath} (version ${version})`);
console.log(`✅ Données d'historique : ${historyDataPath} (${history.versions.length} versions)`);
console.log(`✅ Courbe du rapport HTML : ${reportData}`);

formatWithPrettier([readmePath, historyPath, historyDataPath]);
