/**
 * Upload vers l'object storage Scaleway de tous les DPE (JSON) présents dans le cache local du
 * corpus (`DPE_FOLDER_PATH`, un fichier `<numero_dpe>.json` par DPE).
 *
 * Les objets sont écrits sous la même clé que celle lue par `corpus_worker.mjs` :
 * `<bucket>/<numero_dpe>/<numero_dpe>.json`.
 *
 * Par défaut, les DPE déjà présents dans le bucket sont ignorés (un seul listing du bucket au
 * démarrage, pas de HEAD par fichier).
 *
 * `--corpus-file-path` restreint l'envoi aux DPE d'un corpus (fichier de `test/corpus/files` ou
 * chemin vers un CSV). Option répétable pour cibler plusieurs corpus. `--no-dpe-pos` donne
 * l'index de la colonne des numéros DPE (0 par défaut), comme pour `test:corpus`.
 *
 * Usage :
 *   npm run corpus:upload -- --dpes-folder-path=/chemin/vers/dpes \
 *     [--corpus-file-path=dpe_maison_individuelle_2026.csv] [--no-dpe-pos=0] \
 *     [--concurrency=20] [--force] [--dry-run]
 *
 * Variables d'environnement :
 *   SCW_ACCESS_KEY, SCW_SECRET_KEY  (obligatoires)
 *   S3_REGION    (défaut : fr-par)
 *   S3_ENDPOINT  (défaut : https://s3.<S3_REGION>.scw.cloud)
 *   S3_BUCKET    (défaut : dpe)
 *   DPE_FOLDER_PATH (alternative à --dpes-folder-path)
 */
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SingleBar } from 'cli-progress';
import colors from 'ansi-colors';
import { createReadStream, existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import CsvParserStore from '../src/core/file/infrastructure/adapter/csv-parser.store.js';

const CORPUS_FILES_FOLDER = 'test/corpus/files';

const { values: args } = parseArgs({
  options: {
    'dpes-folder-path': { type: 'string' },
    'corpus-file-path': { type: 'string', multiple: true, default: [] },
    'no-dpe-pos': { type: 'string', default: '0' },
    bucket: { type: 'string' },
    concurrency: { type: 'string', default: '20' },
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false }
  }
});

const dpesFolderPath = args['dpes-folder-path'] ?? process.env.DPE_FOLDER_PATH;
const bucket = args.bucket ?? process.env.S3_BUCKET ?? 'dpe';
const region = process.env.S3_REGION ?? 'fr-par';
const endpoint = process.env.S3_ENDPOINT ?? `https://s3.${region}.scw.cloud`;
const concurrency = Math.max(1, Number(args.concurrency) || 20);
const corpusFiles = args['corpus-file-path'];
const noDpePosition = Math.max(0, Number(args['no-dpe-pos']) || 0);

if (!dpesFolderPath) {
  throw new Error('Argument --dpes-folder-path (ou variable DPE_FOLDER_PATH) manquant !');
}
if (!existsSync(dpesFolderPath)) {
  throw new Error(`Le dossier ${dpesFolderPath} n'existe pas !`);
}
if (!process.env.SCW_ACCESS_KEY || !process.env.SCW_SECRET_KEY) {
  throw new Error('Variables SCW_ACCESS_KEY et SCW_SECRET_KEY obligatoires');
}

const s3client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.SCW_ACCESS_KEY,
    secretAccessKey: process.env.SCW_SECRET_KEY
  }
});

/**
 * @param dpeCode {string}
 * @return {string}
 */
const objectKey = (dpeCode) => `${dpeCode}/${dpeCode}.json`;

/**
 * Liste toutes les clés déjà présentes dans le bucket (pagination par 1000).
 * @return {Promise<Set<string>>}
 */
const listExistingKeys = async () => {
  const keys = new Set();
  let continuationToken;
  do {
    const response = await s3client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
    );
    (response.Contents ?? []).forEach(({ Key }) => keys.add(Key));
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
};

/**
 * @param dpeCode {string}
 * @return {Promise<'uploaded'|'invalid'>}
 */
const uploadDpe = async (dpeCode) => {
  const content = await readFile(join(dpesFolderPath, `${dpeCode}.json`), { encoding: 'utf8' });

  // Le cache local peut contenir une réponse d'erreur de l'API : on n'envoie que du JSON valide
  try {
    JSON.parse(content);
  } catch {
    return 'invalid';
  }

  if (!args['dry-run']) {
    await s3client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey(dpeCode),
        Body: content,
        ContentType: 'application/json'
      })
    );
  }
  return 'uploaded';
};

/**
 * Codes DPE d'un fichier de corpus, lus comme dans `corpus.runner.js` (1re ligne = en-tête).
 * @param corpusFile {string} nom d'un fichier de `test/corpus/files` ou chemin vers un CSV
 * @return {Promise<string[]>}
 */
const readCorpusDpeCodes = (corpusFile) => {
  const corpusFilePath = existsSync(corpusFile)
    ? corpusFile
    : join(CORPUS_FILES_FOLDER, corpusFile);
  if (!existsSync(corpusFilePath)) {
    throw new Error(
      `Fichier de corpus ${corpusFile} introuvable (ni tel quel, ni dans ${CORPUS_FILES_FOLDER})`
    );
  }
  const headers = [...Array(noDpePosition).fill(undefined), 'dpeCode'];
  return new CsvParserStore()
    .parseFromStream(
      createReadStream(corpusFilePath),
      { headers, ignoreEmpty: true, skipRows: 1, discardUnmappedColumns: true },
      (row) => row
    )
    .then((rows) => rows.map(({ dpeCode }) => dpeCode?.trim()).filter(Boolean));
};

const localDpeCodeSet = new Set(
  (await readdir(dpesFolderPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.slice(0, -'.json'.length))
);

console.log(`${localDpeCodeSet.size} DPE trouvés dans ${dpesFolderPath}`);

/** @type {string[]} **/
let localDpeCodes = [...localDpeCodeSet];

if (corpusFiles.length) {
  const corpusDpeCodes = new Set();
  for (const corpusFile of corpusFiles) {
    const codes = await readCorpusDpeCodes(corpusFile);
    console.log(`${codes.length} DPE dans le corpus ${corpusFile}`);
    codes.forEach((code) => corpusDpeCodes.add(code));
  }
  localDpeCodes = [...corpusDpeCodes].filter((code) => localDpeCodeSet.has(code));
  const missingLocally = corpusDpeCodes.size - localDpeCodes.length;
  if (missingLocally) {
    console.log(
      colors.yellow(
        `${missingLocally} DPE du corpus absents du dossier local (lancer test:corpus pour les télécharger)`
      )
    );
  }
  console.log(`${localDpeCodes.length} DPE du corpus présents localement`);
}

let dpeCodesToUpload = localDpeCodes;
if (!args.force) {
  console.log(`Listing du bucket ${bucket} (${endpoint})...`);
  const existingKeys = await listExistingKeys();
  dpeCodesToUpload = localDpeCodes.filter((dpeCode) => !existingKeys.has(objectKey(dpeCode)));
  console.log(
    `${localDpeCodes.length - dpeCodesToUpload.length} DPE déjà présents dans le bucket, ignorés`
  );
}

const report = { uploaded: 0, invalid: [], failed: [] };

if (dpeCodesToUpload.length) {
  console.log(
    `${dpeCodesToUpload.length} DPE à envoyer${args['dry-run'] ? ' (dry-run, aucun envoi)' : ''}`
  );
  const bar = new SingleBar({
    format: colors.cyan('{bar}') + '| {percentage}% | ETA: {eta}s | {value}/{total} DPE envoyés',
    barCompleteChar: '█',
    barIncompleteChar: '░'
  });
  bar.start(dpeCodesToUpload.length, 0);

  let next = 0;
  const lanes = Array.from({ length: Math.min(concurrency, dpeCodesToUpload.length) }, async () => {
    while (next < dpeCodesToUpload.length) {
      const dpeCode = dpeCodesToUpload[next++];
      try {
        const status = await uploadDpe(dpeCode);
        if (status === 'invalid') {
          report.invalid.push(dpeCode);
        } else {
          report.uploaded++;
        }
      } catch (error) {
        report.failed.push({ dpeCode, reason: error.message });
      }
      bar.increment();
    }
  });
  await Promise.all(lanes);
  bar.stop();
}

console.log(
  colors.green(`${report.uploaded} DPE ${args['dry-run'] ? 'à envoyer (dry-run)' : 'envoyés'}`)
);
if (report.invalid.length) {
  console.log(
    colors.yellow(`${report.invalid.length} fichiers JSON invalides ignorés :`),
    report.invalid.join(', ')
  );
}
if (report.failed.length) {
  console.error(colors.red(`${report.failed.length} échecs d'envoi :`));
  report.failed.forEach(({ dpeCode, reason }) => console.error(`  ${dpeCode} : ${reason}`));
  process.exitCode = 1;
}
