#!/usr/bin/env node

/**
 * Détermine la version à laquelle rattacher les résultats de corpus.
 *
 * Les commits postérieurs au dernier tag sont analysés avec le même analyseur et les mêmes
 * `releaseRules` que semantic-release (`.releaserc`) :
 *   - aucun commit publiable (docs, test, ci...) : le code est celui du dernier tag, les
 *     résultats appartiennent à cette release ;
 *   - sinon : ils appartiennent à la prochaine release, dont le numéro est prévu à partir des
 *     types de commits (fix → patch, feat → minor, BREAKING CHANGE → major).
 *
 * Utilisation :
 *   node scripts/corpus_version.js   # affiche la version prévue
 */

import { analyzeCommits } from '@semantic-release/commit-analyzer';
import yaml from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Séparateurs improbables dans un message de commit. */
const FIELD_SEPARATOR = '\x1f';
const RECORD_SEPARATOR = '\x1e';

/** Libellé d'une version pas encore publiée, dans le README, l'historique et le rapport HTML. */
export const PENDING_LABEL = 'à publier';

const SILENT_LOGGER = { log() {}, error() {}, warn() {}, success() {} };

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
export function versionTags(root) {
  const tags = git('git tag --list', root);
  if (!tags) return [];
  return tags
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
    .sort((a, b) => compareVersions(a.slice(1), b.slice(1)));
}

/**
 * @param version {string} x.y.z
 * @param releaseType {'major'|'minor'|'patch'}
 * @return {string}
 */
export function bumpVersion(version, releaseType) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (releaseType === 'major') return `${major + 1}.0.0`;
  if (releaseType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Configuration du commit-analyzer, lue une fois dans `.releaserc`. */
const analyzerConfigs = new Map();

/**
 * @param root {string}
 * @return {object} configuration du plugin `@semantic-release/commit-analyzer`
 */
function analyzerConfig(root) {
  if (analyzerConfigs.has(root)) return analyzerConfigs.get(root);

  let config = {};
  const path = resolve(root, '.releaserc');
  if (existsSync(path)) {
    // `.releaserc` est lu en YAML par semantic-release : c'est un sur-ensemble de sa syntaxe.
    const { plugins = [] } = yaml.load(readFileSync(path, { encoding: 'utf8' })) || {};
    const plugin = plugins.find(
      (p) =>
        p === '@semantic-release/commit-analyzer' || p?.[0] === '@semantic-release/commit-analyzer'
    );
    config = (Array.isArray(plugin) && plugin[1]) || {};
  }

  analyzerConfigs.set(root, config);
  return config;
}

/**
 * Commits d'une plage git, au format attendu par le commit-analyzer.
 * @param range {string}
 * @param root {string}
 * @return {{hash: string, message: string}[]}
 */
export function commitsOf(range, root) {
  const raw = git(`git log --format=%H${FIELD_SEPARATOR}%B${RECORD_SEPARATOR} ${range}`, root);
  if (!raw) return [];
  return raw
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, message = ''] = record.split(FIELD_SEPARATOR);
      return { hash, message };
    });
}

/**
 * @param commits {{hash: string, message: string}[]}
 * @param root {string}
 * @return {Promise<'major'|'minor'|'patch'|null>} type de release déclenché, `null` si aucun
 */
export function releaseTypeOf(commits, root) {
  if (!commits.length) return Promise.resolve(null);
  return analyzeCommits(analyzerConfig(root), { commits, logger: SILENT_LOGGER, cwd: root });
}

/**
 * @param root {string}
 * @return {Promise<{version: string, lastVersion: string|undefined, pending: boolean, releaseType: string|null}>}
 *   `pending` est vrai quand la version n'est pas encore publiée
 */
export async function resolveCorpusVersion(root) {
  const lastTag = versionTags(root).at(-1);

  if (!lastTag) {
    const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    return { version, lastVersion: undefined, pending: true, releaseType: null };
  }

  const lastVersion = lastTag.slice(1);
  // Commits accessibles depuis HEAD mais pas depuis le dernier tag : sur une branche en retard
  // sur `main`, ce sont ceux de la branche, qui s'appliqueront par-dessus la dernière release.
  const releaseType = await releaseTypeOf(commitsOf(`${lastTag}..HEAD`, root), root);

  return releaseType
    ? { version: bumpVersion(lastVersion, releaseType), lastVersion, pending: true, releaseType }
    : { version: lastVersion, lastVersion, pending: false, releaseType };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { version, lastVersion, pending, releaseType } = await resolveCorpusVersion(root);
  console.log(
    pending
      ? `${version} (à publier : ${releaseType ?? 'première release'} depuis ${lastVersion ?? '—'})`
      : `${version} (publiée)`
  );
}
