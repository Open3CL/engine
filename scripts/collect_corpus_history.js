#!/usr/bin/env node

/**
 * Reconstruit l'historique des résultats de corpus à partir des tags git.
 *
 * Une release est taguée au merge, et ses rapports ne sont souvent commités qu'ensuite
 * (`docs: update reports`) : le tag lui-même embarque alors ceux de la release précédente.
 * Les rapports d'une version sont donc relus dans le **dernier commit de `main` dont le code
 * est encore celui de cette version**, c'est-à-dire juste avant le commit suivant qui
 * déclencherait une release (analyse des commits identique à semantic-release). Pour la
 * dernière release, si aucun commit publiable ne l'a suivie, c'est l'arbre de travail qui fait
 * foi : une exécution locale sur `main` s'y rattache directement.
 *
 * L'historique est donc une fonction de git : il se recalcule à l'identique et se corrige tout
 * seul. La version en préparation peut y être ajoutée, marquée `pending`.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { commitsOf, releaseTypeOf, versionTags } from './corpus_version.js';

/** Rapport global d'un corpus sur `main`. */
const GLOBAL_REPORT = 'corpus_global_report_main.json';

/** Emplacement des rapports dans l'arbre git. */
const REPORTS_PATH = 'dist/reports/corpus';

/** Référence désignant l'arbre de travail plutôt qu'un commit. */
const WORKTREE = Symbol('worktree');

const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';

/**
 * @param command {string}
 * @param root {string}
 * @return {string|undefined} sortie de la commande, ou `undefined` si elle échoue
 */
function git(command, root) {
  try {
    return execSync(command, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024
    })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

/**
 * Dernier commit dont le code est celui de `tag`.
 *
 * Parcourt la ligne principale (`--first-parent`) de `tag` vers `nextTag` (ou HEAD) et s'arrête
 * avant le premier commit publiable : pour un merge, ce sont les commits qu'il apporte qui sont
 * analysés.
 *
 * @param tag {string}
 * @param nextTag {string|undefined}
 * @param root {string}
 * @return {Promise<string|symbol>} hash du commit, ou `WORKTREE` si la version court jusqu'à HEAD
 */
async function lastCommitOfVersion(tag, nextTag, root) {
  const end = nextTag ?? 'HEAD';
  const raw = git(
    `git log --first-parent --reverse --format=%H${FIELD_SEPARATOR}%P${FIELD_SEPARATOR}%B${RECORD_SEPARATOR} ${tag}..${end}`,
    root
  );
  const records = (raw || '')
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, parents, message = ''] = record.split(FIELD_SEPARATOR);
      return { hash, parents: parents.split(' ').filter(Boolean), message };
    });

  // Le tag suivant marque la release suivante : son commit n'appartient plus à cette version.
  if (nextTag) records.pop();

  let ref = git(`git rev-list -n 1 ${tag}`, root);
  for (const { hash, parents, message } of records) {
    const introduced =
      parents.length > 1 ? commitsOf(`${parents[0]}..${hash}`, root) : [{ hash, message }];
    if (await releaseTypeOf(introduced, root)) return ref;
    ref = hash;
  }

  return nextTag ? ref : WORKTREE;
}

/**
 * Lit les rapports globaux d'un commit, ou de l'arbre de travail.
 *
 * @param ref {string|symbol} hash de commit, ou `WORKTREE`
 * @param root {string}
 * @param reportName {string} nom du rapport global à lire
 * @return {{threshold: string, results: Object<string, {below: number, total: number}>, perf: Object<string, object>}|undefined}
 */
function readReports(ref, root, reportName = GLOBAL_REPORT) {
  const files = [];

  if (ref === WORKTREE) {
    const folder = resolve(root, REPORTS_PATH);
    if (!existsSync(folder)) return undefined;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name, reportName);
      if (entry.isDirectory() && existsSync(path)) {
        files.push({ corpus: entry.name, read: () => readFileSync(path, { encoding: 'utf8' }) });
      }
    }
  } else {
    const tree = git(`git ls-tree -r --name-only ${ref} -- ${REPORTS_PATH}`, root);
    for (const file of (tree || '').split('\n').filter((f) => f.endsWith(`/${reportName}`))) {
      files.push({
        corpus: file.split('/').at(-2),
        read: () => git(`git show ${ref}:${file}`, root)
      });
    }
  }

  const results = {};
  const perf = {};
  let threshold;

  for (const { corpus, read } of files) {
    let report;
    try {
      report = JSON.parse(read());
    } catch {
      // Un rapport illisible dans une vieille release ne doit pas faire échouer la collecte.
      continue;
    }

    results[corpus] = {
      below: report.nbAllChecksBelowThreshold || 0,
      total: report.totalDpesInFile || 0
    };
    if (report.performance) perf[corpus] = report.performance;
    threshold = threshold || report.threshold;
  }

  if (!Object.keys(results).length) return undefined;
  return { threshold: threshold || '5%', results, perf };
}

/**
 * @param root {string} racine du dépôt
 * @param [options] {{pending?: {version: string, date: string, branch: string}}} version en
 *   préparation, lue dans les rapports de `branch` de l'arbre de travail
 * @return {Promise<{versions: {version: string, date: string, threshold: string, results: object, perf: object, pending?: boolean}[]}>}
 */
export async function collectHistoryFromTags(root, { pending } = {}) {
  const tags = versionTags(root);
  const versions = [];

  for (const [i, tag] of tags.entries()) {
    const ref = await lastCommitOfVersion(tag, tags[i + 1], root);
    const reports = readReports(ref, root);
    if (!reports) continue;
    versions.push({
      version: tag.slice(1),
      date: git(`git log -1 --format=%cs ${tag}`, root),
      ...reports
    });
  }

  if (pending && !versions.some((entry) => entry.version === pending.version)) {
    const reports = readReports(WORKTREE, root, `corpus_global_report_${pending.branch}.json`);
    if (reports)
      versions.push({ version: pending.version, date: pending.date, pending: true, ...reports });
  }

  return { versions };
}

/**
 * Version allégée pour publication : le graphe n'a besoin que des compteurs.
 * @param history {object}
 * @return {object}
 */
export function toPublishedHistory(history) {
  return {
    versions: history.versions.map(({ version, date, results, pending }) => ({
      version,
      date,
      ...(pending ? { pending: true } : {}),
      results
    }))
  };
}
