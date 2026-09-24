#!/usr/bin/env node

/**
 * Génère la section « Résultats corpus » d'un fichier markdown à partir des
 * rapports produits par les tests de corpus.
 *
 * Source  : dist/reports/corpus/<corpus>.csv/corpus_global_report_<branche>.json
 * Cible   : bloc délimité par <!-- CORPUS:START --> / <!-- CORPUS:END -->
 * Archive : docs/CORPUS-HISTORY.md, reconstruit à partir des tags git (une entrée par release,
 *           plus la version en préparation, marquée « à publier »)
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
 *   --version=<x.y.z>  Version affichée                   (défaut: prévue par semantic-release)
 *   --date=<aaaa-mm-jj> Date affichée                     (défaut: aujourd'hui)
 *   --history=<path>   Historique markdown                (défaut: docs/CORPUS-HISTORY.md)
 *   --no-history       N'alimente pas l'historique
 *   --dry-run          Affiche le bloc généré sans rien écrire
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectHistoryFromTags, toPublishedHistory } from './collect_corpus_history.js';
import { PENDING_LABEL, resolveCorpusVersion } from './corpus_version.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_FOLDER_PATH = resolve(ROOT, 'dist/reports/corpus');

const START_MARKER = '<!-- CORPUS:START -->';
const END_MARKER = '<!-- CORPUS:END -->';

/** Bloc de la courbe, régénéré à chaque écriture de l'historique. */
const CHART_START_MARKER = '<!-- CORPUS-CHART:START -->';
const CHART_END_MARKER = '<!-- CORPUS-CHART:END -->';

/** Nombre de releases détaillées dans l'historique ; au-delà, le tableau de la courbe suffit. */
const HISTORY_DETAILED_SECTIONS = 5;

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
 * @param context {{version: string, branch?: string, date: string, pending?: boolean}}
 * @return {string} ligne d'en-tête du bloc
 */
function renderHeadline({ version, branch, date, pending }) {
  const status = pending ? ` · ${PENDING_LABEL}` : '';
  if (branch)
    return `> **Version \`${version}\`**${status} · branche \`${branch}\` · généré le ${date}`;
  return pending
    ? `> **Version \`${version}\`**${status} · résultats du ${date}`
    : `> **Version \`${version}\`** · publiée le ${date}`;
}

/**
 * @param rows {object[]}
 * @param context {{version: string, branch?: string, date: string, pending?: boolean}} `branch`
 *   pour une exécution en cours, absent pour une release relue dans l'historique ; `pending`
 *   pour une version pas encore publiée
 * @return {string} contenu markdown du bloc (sans les marqueurs)
 */
function renderBlock(rows, context) {
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
    renderHeadline(context),
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
 * Écrit les données d'historique : la source dans `docs/`, et sa copie à côté des rapports,
 * lue en relatif par la courbe du rapport HTML.
 *
 * @param history {object}
 * @param dataPath {string}
 * @return {string[]} chemins écrits
 */
function writeHistoryData(history, dataPath) {
  const published = toPublishedHistory(history);
  const reportPath = resolve(REPORTS_FOLDER_PATH, 'corpus_history.json');

  // Les deux fichiers sont indentés comme prettier le ferait : le hook de pre-commit les
  // reformaterait sinon, et chaque génération produirait un diff parasite.
  const json = `${JSON.stringify(published, null, 2)}\n`;
  writeFileSync(dataPath, json, { encoding: 'utf8' });
  writeFileSync(reportPath, json, { encoding: 'utf8' });

  return [dataPath, reportPath];
}

/**
 * Corpus présents dans l'historique, dans l'ordre éditorial des libellés.
 * @param history {object}
 * @return {{corpus: string, label: string}[]}
 */
function historyCorpora(history) {
  const seen = new Set(history.versions.flatMap((entry) => Object.keys(entry.results)));
  return [
    ...Object.keys(CORPUS_LABELS).filter((corpus) => seen.has(corpus)),
    ...[...seen].filter((corpus) => !CORPUS_LABELS[corpus]).sort()
  ].map((corpus) => ({ corpus, label: CORPUS_LABELS[corpus] || corpus.replace(/\.csv$/, '') }));
}

/**
 * Traduit une release en lignes de rendu, au même format que `collectResults`.
 * @param entry {object}
 * @return {object[]}
 */
function historyRows(entry) {
  return historyCorpora({ versions: [entry] })
    .map(({ corpus, label }) => {
      const result = entry.results[corpus];
      if (!result) return undefined;
      return {
        corpus,
        label,
        below: result.below,
        valid: result.total,
        total: result.total,
        ratio: result.total ? (result.below / result.total) * 100 : 0,
        threshold: entry.threshold,
        perf: entry.perf?.[corpus]
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.corpus === MAIN_CORPUS) return -1;
      if (b.corpus === MAIN_CORPUS) return 1;
      return b.ratio - a.ratio;
    });
}

/**
 * Bloc de la courbe : renvoi vers le rapport interactif, puis les données qui la
 * composent, pour que le graphe ne soit pas la seule façon de lire les chiffres.
 *
 * @param history {object}
 * @return {string}
 */
function renderChartBlock(history) {
  const corpora = historyCorpora(history);

  const lines = [
    '',
    '> 📈 **Courbe interactive** : `npm run reports:preview`, section « Historique des versions ».',
    '> Une courbe par corpus, survol pour comparer les versions, légende cliquable.',
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
    const version = entry.pending
      ? `**${entry.version}** (${PENDING_LABEL})`
      : `**${entry.version}**`;
    lines.push(`| ${version} | ${cells.join(' | ')} |`);
  }

  lines.push(
    '',
    '</details>',
    '',
    '<sub>Chiffres relevés dans les rapports de `main` de chaque release. Un corpus absent',
    "d'une version n'était pas encore joué à cette date : la courbe démarre à sa première mesure.</sub>",
    ''
  );

  return lines.join('\n');
}

/**
 * Insère ou remplace le bloc de la courbe, en tête du fichier.
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

  return `${content}\n\n${CHART_START_MARKER}\n${block}\n${CHART_END_MARKER}\n`;
}

/**
 * Réécrit l'historique : la courbe, puis une section détaillée par release récente, puis
 * les sections rédigées à la main (tableau antérieur à l'automatisation) conservées telles
 * quelles.
 *
 * @param path {string}
 * @param history {object}
 */
function writeHistory(path, history) {
  const header = [
    '# Historique des résultats de corpus',
    '',
    'Une section par version publiée, la plus récente en premier. Les chiffres sont relus dans',
    'les rapports de `main` au dernier commit de chaque release : ce fichier se reconstruit à',
    'l’identique avec `npm run reports:readme`.',
    ''
  ].join('\n');

  const existing = existsSync(path) ? readFileSync(path, { encoding: 'utf8' }) : `${header}\n`;

  // Les sections rédigées à la main (titre sans numéro de version) sont préservées ;
  // celles d'une release sont systématiquement régénérées.
  const manualSections = existing
    .split(/\n(?=## )/)
    .slice(1)
    .filter((section) => !/^## \d+\.\d+\.\d+ —/.test(section))
    .map((section) => section.trim());

  const releases = [...history.versions]
    .reverse()
    .slice(0, HISTORY_DETAILED_SECTIONS)
    .map((entry) =>
      [
        `## ${entry.version} — ${entry.pending ? PENDING_LABEL : entry.date}`,
        renderBlock(historyRows(entry), {
          version: entry.version,
          date: entry.date,
          pending: entry.pending
        }),
        ''
      ].join('\n')
    );

  const intro = existing.slice(
    0,
    existing.indexOf('\n## ') === -1 ? undefined : existing.indexOf('\n## ')
  );
  const markdown = [
    replaceChartBlock(intro.trimEnd(), renderChartBlock(history)),
    '',
    ...releases,
    ...manualSections,
    ''
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

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
// Sans version imposée, les résultats sont rattachés à la release qui contiendra ce code :
// la dernière publiée si rien de publiable ne l'a suivie, sinon la prochaine, prévue comme
// semantic-release la calculera au merge sur `main`.
const resolved = arg('version') ? undefined : await resolveCorpusVersion(ROOT);
const version = arg('version') || resolved.version;
const pending = Boolean(resolved?.pending);
const readmePath = resolve(ROOT, arg('readme', 'README.md'));
const historyPath = resolve(ROOT, arg('history', 'docs/CORPUS-HISTORY.md'));
const historyDataPath = resolve(dirname(historyPath), 'corpus-history.json');
const dryRun = flag('dry-run');

const date = arg('date', new Date().toISOString().slice(0, 10));
const rows = collectResults(branch);
const block = renderBlock(rows, { version, branch, date, pending });

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
  `✅ Résultats corpus écrits dans ${readmePath} (${rows.length} corpus, branche ${branch}, version ${version}${pending ? ` ${PENDING_LABEL}` : ''})`
);

if (!rows.length) process.exit(0);

if (flag('no-history')) {
  formatWithPrettier([readmePath]);
  process.exit(0);
}

// Les releases sont relues dans git, indépendamment de la branche courante ; seule la version
// en préparation provient de l'exécution en cours.
const history = await collectHistoryFromTags(ROOT, {
  pending: pending ? { version, date, branch } : undefined
});

if (!history.versions.length) {
  console.warn('⚠️  Aucun tag de release ne contient de rapport : historique inchangé.');
  formatWithPrettier([readmePath]);
  process.exit(0);
}

writeHistory(historyPath, history);
const dataPaths = writeHistoryData(history, historyDataPath);

const last = history.versions.at(-1);
console.log(`✅ Historique reconstruit : ${historyPath} (${history.versions.length} versions)`);
console.log(`✅ Données d'historique : ${dataPaths.join(', ')}`);
console.log(`✅ Dernière version : ${last.version} (${last.pending ? PENDING_LABEL : last.date})`);

formatWithPrettier([readmePath, historyPath, historyDataPath]);
