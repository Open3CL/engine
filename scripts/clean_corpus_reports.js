#!/usr/bin/env node

/**
 * Supprime des dossiers de corpus les rapports qui ne sont pas commités.
 *
 * Chaque exécution des tests de corpus écrit ses rapports suffixés par la branche courante
 * (`corpus_global_report_<branche>.json`...). Seuls ceux de `main` sont versionnés : les autres
 * s'accumulent d'une branche de travail à l'autre. Lancé avant les tests de corpus, ce script
 * repart des seuls rapports de `main`, l'exécution ajoutant ensuite ceux de la branche courante.
 *
 * Utilisation :
 *   node scripts/clean_corpus_reports.js
 *   node scripts/clean_corpus_reports.js --dry-run
 */

import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_FOLDER_PATH = resolve(ROOT, 'dist/reports/corpus');
const CORPUS_LIST_PATH = resolve(REPORTS_FOLDER_PATH, 'corpus_list_main.json');

const REFERENCE_BRANCH = 'main';

/** Rapports conservés dans chaque dossier de corpus (cf. `.gitignore`). */
const KEPT_FILES = [
  `corpus_detailed_report_${REFERENCE_BRANCH}.csv`,
  `corpus_global_report_${REFERENCE_BRANCH}.json`,
  `corpus_dpe_list_above_threshold_${REFERENCE_BRANCH}.json`
];

const dryRun = process.argv.includes('--dry-run');

if (!existsSync(REPORTS_FOLDER_PATH)) {
  process.exit(0);
}

let nbRemoved = 0;

for (const corpusFolder of readdirSync(REPORTS_FOLDER_PATH, { withFileTypes: true })) {
  if (!corpusFolder.isDirectory()) continue;

  const corpusFolderPath = resolve(REPORTS_FOLDER_PATH, corpusFolder.name);
  for (const report of readdirSync(corpusFolderPath, { withFileTypes: true })) {
    if (!report.isFile() || KEPT_FILES.includes(report.name)) continue;

    const reportPath = resolve(corpusFolderPath, report.name);
    if (!dryRun) rmSync(reportPath);
    console.log(`${dryRun ? '[dry-run] ' : ''}supprimé : ${relative(ROOT, reportPath)}`);
    nbRemoved++;
  }
}

// Les branches dont les rapports viennent d'être supprimés ne doivent plus être proposées
// par le rapport interactif.
if (existsSync(CORPUS_LIST_PATH)) {
  const corpusList = JSON.parse(readFileSync(CORPUS_LIST_PATH, { encoding: 'utf8' }));
  if (corpusList.branches?.some((branch) => branch !== REFERENCE_BRANCH)) {
    corpusList.branches = [REFERENCE_BRANCH];
    if (!dryRun) {
      writeFileSync(CORPUS_LIST_PATH, JSON.stringify(corpusList), { encoding: 'utf8' });
    }
  }
}

console.log(`${nbRemoved} rapport(s) de corpus supprimé(s).`);
