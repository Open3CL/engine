#!/usr/bin/env node

/**
 * Reconstruit l'historique des résultats de corpus à partir des tags git.
 *
 * Chaque release embarque ses rapports globaux (`corpus_global_report_main.json`) : ce sont
 * eux qui font foi. Lire l'arbre de travail reviendrait à étiqueter les résultats de `main`
 * avec le numéro de la release précédente — le dernier tag n'est pas la version en cours de
 * préparation.
 *
 * L'historique est donc une fonction des tags : il se recalcule à l'identique, se corrige
 * tout seul, et une release n'y apparaît qu'une fois son tag posé.
 */

import { execSync } from 'node:child_process';

/** Rapport global d'un corpus, tel que commité dans chaque release. */
const GLOBAL_REPORT = 'corpus_global_report_main.json';

/** Emplacement des rapports dans l'arbre git. */
const REPORTS_PATH = 'dist/reports/corpus';

/**
 * @param command {string}
 * @param root {string}
 * @return {string|undefined} sortie de la commande, ou `undefined` si elle échoue
 */
function git(command, root) {
  try {
    return execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * @param a {string}
 * @param b {string}
 * @return {number} ordre croissant des versions
 */
export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

/**
 * Tags de version, du plus ancien au plus récent.
 * @param root {string}
 * @return {string[]}
 */
function versionTags(root) {
  const tags = git('git tag --list', root);
  if (!tags) return [];
  return tags
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
    .sort((a, b) => compareVersions(a.slice(1), b.slice(1)));
}

/**
 * Lit les rapports globaux d'une release.
 *
 * @param tag {string}
 * @param root {string}
 * @return {{version: string, date: string, threshold: string, results: Object<string, {below: number, total: number}>, perf: Object<string, object>}|undefined}
 */
function readTag(tag, root) {
  const tree = git(`git ls-tree -r --name-only ${tag} -- ${REPORTS_PATH}`, root);
  if (!tree) return undefined;

  const files = tree.split('\n').filter((file) => file.endsWith(`/${GLOBAL_REPORT}`));
  if (!files.length) return undefined;

  const results = {};
  const perf = {};
  let threshold;

  for (const file of files) {
    const raw = git(`git show ${tag}:${file}`, root);
    if (!raw) continue;

    let report;
    try {
      report = JSON.parse(raw);
    } catch {
      // Un rapport illisible dans une vieille release ne doit pas faire échouer la collecte.
      continue;
    }

    const corpus = file.split('/').at(-2);
    results[corpus] = {
      below: report.nbAllChecksBelowThreshold || 0,
      total: report.totalDpesInFile || 0
    };
    if (report.performance) perf[corpus] = report.performance;
    threshold = threshold || report.threshold;
  }

  if (!Object.keys(results).length) return undefined;

  return {
    version: tag.slice(1),
    date: git(`git log -1 --format=%cs ${tag}`, root),
    threshold: threshold || '5%',
    results,
    perf
  };
}

/**
 * @param root {string} racine du dépôt
 * @return {{versions: {version: string, date: string, threshold: string, results: object, perf: object}[]}}
 */
export function collectHistoryFromTags(root) {
  const versions = versionTags(root)
    .map((tag) => readTag(tag, root))
    .filter(Boolean);

  return { versions };
}

/**
 * Version allégée pour publication : le graphe n'a besoin que des compteurs.
 * @param history {object}
 * @return {object}
 */
export function toPublishedHistory(history) {
  return {
    versions: history.versions.map(({ version, date, results }) => ({ version, date, results }))
  };
}
