#!/usr/bin/env node

/**
 * Marque comme publiée la version de corpus « à publier » au moment de la release.
 *
 * Appelé par semantic-release (`prepareCmd` de `.releaserc`) avec le numéro réellement publié.
 * Les résultats ne sont pas recalculés : ce sont ceux commités avec le code, générés par
 * `npm run test:corpus:all` sous la version prévue. Seul leur statut change, et les fichiers
 * modifiés entrent dans le commit de release, donc dans le tag.
 *
 * Si la version prévue diffère de la version publiée (plusieurs PR fusionnées entre deux
 * releases, type de commit modifié...), rien n'est réécrit : les résultats ne correspondent
 * plus au code publié, il faut relancer les tests de corpus.
 *
 * Utilisation :
 *   node scripts/stamp_corpus_release.js <x.y.z> [--date=<aaaa-mm-jj>]
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PENDING_LABEL } from './corpus_version.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Copies du README : `src/README.md` est celle publiée sur npm. */
const README_PATHS = ['README.md', 'src/README.md'];
const HISTORY_MARKDOWN_PATH = 'docs/CORPUS-HISTORY.md';
const HISTORY_DATA_PATHS = ['docs/corpus-history.json', 'dist/reports/corpus/corpus_history.json'];

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('❌ Usage : node scripts/stamp_corpus_release.js <x.y.z>');
  process.exit(1);
}

const dateArg = process.argv.find((a) => a.startsWith('--date='));
const date = dateArg ? dateArg.split('=')[1] : new Date().toISOString().slice(0, 10);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const v = escape(version);
const pending = escape(PENDING_LABEL);

/**
 * Applique des remplacements à un fichier existant.
 * @param path {string} chemin relatif à la racine
 * @param replacements {[RegExp, string][]}
 * @return {boolean} vrai si le fichier a changé
 */
function rewrite(path, replacements) {
  const absolute = resolve(ROOT, path);
  if (!existsSync(absolute)) return false;
  const content = readFileSync(absolute, { encoding: 'utf8' });
  const updated = replacements.reduce(
    (acc, [pattern, value]) => acc.replace(pattern, value),
    content
  );
  if (updated === content) return false;
  writeFileSync(absolute, updated, { encoding: 'utf8' });
  return true;
}

const changed = [];

for (const path of README_PATHS) {
  // > **Version `1.8.0`** · à publier · branche `main` · généré le …
  if (rewrite(path, [[new RegExp(`(\\*\\*Version \`${v}\`\\*\\*) · ${pending}`, 'g'), '$1']])) {
    changed.push(path);
  }
}

if (
  rewrite(HISTORY_MARKDOWN_PATH, [
    [new RegExp(`^## ${v} — ${pending}$`, 'gm'), `## ${version} — ${date}`],
    [
      new RegExp(`(\\*\\*Version \`${v}\`\\*\\*) · ${pending} · résultats du \\S+`, 'g'),
      `$1 · publiée le ${date}`
    ],
    [new RegExp(`\\*\\*${v}\\*\\* \\(${pending}\\)`, 'g'), `**${version}**`]
  ])
) {
  changed.push(HISTORY_MARKDOWN_PATH);
}

for (const path of HISTORY_DATA_PATHS) {
  const absolute = resolve(ROOT, path);
  if (!existsSync(absolute)) continue;
  const history = JSON.parse(readFileSync(absolute, { encoding: 'utf8' }));
  const entry = history.versions?.find((e) => e.version === version && e.pending);
  if (!entry) continue;
  delete entry.pending;
  entry.date = date;
  writeFileSync(absolute, `${JSON.stringify(history, null, 2)}\n`, { encoding: 'utf8' });
  changed.push(path);
}

if (!changed.length) {
  const readme = readFileSync(resolve(ROOT, 'README.md'), { encoding: 'utf8' });
  const other = readme.match(new RegExp(`\\*\\*Version \`([^\`]+)\`\\*\\* · ${pending}`));
  console.warn(
    other
      ? `⚠️  Résultats de corpus générés pour ${other[1]}, version publiée ${version} : relancez npm run test:corpus:all.`
      : `ℹ️  Aucun résultat de corpus « ${PENDING_LABEL} » pour ${version} : rien à marquer.`
  );
  process.exit(0);
}

// Même formatage que le hook de pre-commit, pour ne pas laisser de diff parasite.
const prettier = resolve(ROOT, 'node_modules/.bin/prettier');
if (existsSync(prettier)) {
  try {
    execSync(`"${prettier}" --write --log-level=silent ${changed.map((p) => `"${p}"`).join(' ')}`, {
      cwd: ROOT,
      stdio: 'ignore'
    });
  } catch {
    // Le formatage est un confort : son échec ne doit pas bloquer la release.
  }
}

console.log(`✅ Résultats de corpus marqués publiés en ${version} : ${changed.join(', ')}`);
