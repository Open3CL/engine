import { createReadStream, createWriteStream, writeFileSync, existsSync } from 'node:fs';
import { format } from 'fast-csv';
import { chunk } from 'lodash-es';
import Piscina from 'piscina';
import { resolve } from 'path';
import { MultiBar } from 'cli-progress';
import colors from 'ansi-colors';
import CsvParserStore from '../../src/core/file/infrastructure/adapter/csv-parser.store.js';
import { OUTPUT_CSV_HEADERS } from './corpus_utils.js';
import { mkdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const current_git_branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

const DIFF_VALUE_THRESHOLD = 5;

let downloadDedFiles = 0;
let totalDpes = 0;

const multibar = new MultiBar({
  format: colors.cyan('{bar}') + '| {percentage}% | ETA: {eta}s | {value}/{total} DPE {action}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591'
});
let downloadBar;
let corpusBar;

const fileName = resolve(process.cwd(), `${import.meta.dirname}/corpus_worker.mjs`);
const piscina = new Piscina({
  filename: fileName,
  maxQueue: 'auto'
});

piscina.on('message', (event) => {
  switch (event.action) {
    case 'fileProcessed': {
      if (!downloadBar) {
        downloadBar = multibar.create(totalDpes, 1);
      }
      if (downloadDedFiles < totalDpes) {
        downloadBar.increment({ action: 'chargés' });
      }
      break;
    }
    case 'incrementTotalReport': {
      globalReport.nbValidDpe++;
      break;
    }
    case 'decrementTotalReport': {
      globalReport.nbValidDpe--;
      break;
    }
    case 'incrementExcludedDpe': {
      globalReport.nbExcludedDpe++;
      break;
    }
    case 'incrementInvalidDpeVersion': {
      globalReport.nbInvalidDpeVersion++;
      break;
    }
    case 'addFailedDpe': {
      globalReport.dpeRunFailed.push(event.dpeCode);
      break;
    }
    case 'incrementAllChecksThreshold': {
      globalReport.nbAllChecksBelowThreshold++;
      break;
    }
    case 'addDpeExceedThresholdInList': {
      if (!globalReport.dpeExceedThreshold.includes(event.dpeCode)) {
        globalReport.dpeExceedThreshold.push(event.dpeCode);
      }
      break;
    }
    case 'incrementCheckPropertyThreshold': {
      if (!globalReport.checks[event.property]) {
        globalReport.checks[event.property] = { nbBelowThreshold: 0 };
      }
      globalReport.checks[event.property].nbBelowThreshold++;
      globalReport.checks[event.property].successRatio =
        `${Number((globalReport.checks[event.property].nbBelowThreshold / globalReport.totalDpesInFile) * 100).toFixed(2)} %`;
      break;
    }
  }
});

/**
 * @type {{}[]}
 */
let dpeOutputs = [];

const globalReport = {
  threshold: `${DIFF_VALUE_THRESHOLD}%`,
  totalDpesInFile: 0,
  nbValidDpe: 0,
  nbInvalidDpeVersion: 0,
  nbExcludedDpe: 0,
  nbAllChecksBelowThreshold: 0,
  successRatio: '',
  dpeRunFailed: [],
  checks: {},
  dpeExceedThreshold: []
};

const INPUT_CSV_HEADERS = [];

const corpusFilePathArg = process.argv.find((arg) => arg.includes('corpus-file-path'));
const corpusFilePath = corpusFilePathArg
  ? corpusFilePathArg.split('=').pop()
  : 'test/corpus/corpus_dpe.csv';

if (!corpusFilePath.endsWith('.csv')) {
  throw new Error('The corpus file should be a CSV file !');
}

const noDpePositionArg = process.argv.find((arg) => arg.includes('no-dpe-pos'));
const noDpePosition = noDpePositionArg ? Number(noDpePositionArg.split('=').pop()) : 0;

const store = new CsvParserStore();
const readableStream = createReadStream(corpusFilePath);

for (let i = 0; i < noDpePosition; i++) {
  INPUT_CSV_HEADERS.push(undefined);
}
INPUT_CSV_HEADERS.push('dpeCode');

const createCsv = (rows, headers, filename) => {
  const csvStream = format({ headers });

  // loop over nested row arrays
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    csvStream.write(row);
  }
  csvStream.pipe(createWriteStream(filename, { encoding: 'utf8' }));
  csvStream.end();
  return `Finished writing data to: ${filename}`;
};

/**
 * @param dpesFilePath {string}
 * @return {Promise<void>}
 */
export const validateCorpus = (dpesFilePath) => {
  return store
    .parseFromStream(
      readableStream,
      {
        // Keep only interested headers + rename them
        headers: INPUT_CSV_HEADERS,
        ignoreEmpty: true,
        skipRows: 1,
        discardUnmappedColumns: true
      },
      (row) => row
    )
    .then(
      /** @param dpeCodes {{dpeCode: string}[]} **/ async (dpeCodes) => {
        const dpesToAnalyze = dpeCodes;

        totalDpes = dpesToAnalyze.length;
        globalReport.totalDpesInFile = totalDpes;

        console.log(`${totalDpes} DPE to analyze from corpus: ${corpusFilePath}`);
        corpusBar = multibar.create(totalDpes, 0, { action: 'analysés' });

        // Certains DPE, après analyse manuelle sont à exclure
        const dpesToExclude = [];

        let nbAnalyzedDpe = 0;

        /**
         * @type {{dpeCode: string}[][]}
         */
        const chunks = chunk(dpesToAnalyze, 100);
        /** @type {any[][]} **/
        const results = await Promise.all(
          chunks.map((chunk) => {
            return piscina.run({ chunk, dpesToExclude, dpesFilePath }).then((data) => {
              nbAnalyzedDpe += chunks.length;
              corpusBar.increment(chunk.length, { action: 'analysés' });
              return data;
            });
          })
        );

        results.forEach((result, index) => {
          dpeOutputs.push(...result);
        });
      }
    );
};

let dpesFilePath = process.env.DPE_FOLDER_PATH;

if (!dpesFilePath) {
  if (!process.argv.find((arg) => arg.includes('dpes-folder-path'))) {
    throw new Error('Argument dpes-folder-path not found !');
  }
  dpesFilePath = process.argv
    .find((arg) => arg.includes('dpes-folder-path'))
    .split('=')
    .pop();
}

if (!existsSync(dpesFilePath)) {
  throw new Error(`File path ${dpesFilePath} does not exists !`);
}

console.time('validateCorpus');
validateCorpus(dpesFilePath).then(() => {
  multibar.stop();
  console.timeEnd('validateCorpus');

  globalReport.successRatio = `${Number((globalReport.nbAllChecksBelowThreshold / globalReport.totalDpesInFile) * 100).toFixed(2)} %`;

  const fileName = corpusFilePath.split('/').pop();

  /** @type {{files: string[], branches: string[]}} **/
  const corpusList = JSON.parse(
    readFileSync(`dist/reports/corpus/corpus_list_main.json`, {
      encoding: 'utf8'
    }).toString()
  );

  if (!corpusList.files.includes(fileName)) {
    corpusList.files.push(fileName);
  }
  if (!corpusList.branches.includes(current_git_branch)) {
    corpusList.branches.push(current_git_branch);
  }

  writeFileSync(`dist/reports/corpus/corpus_list_main.json`, JSON.stringify(corpusList), {
    encoding: 'utf8'
  });

  mkdirSync(`dist/reports/corpus/${fileName}`, { recursive: true });
  writeFileSync(
    `dist/reports/corpus/${fileName}/corpus_global_report_${current_git_branch}.json`,
    JSON.stringify({ ...globalReport, dpeExceedThreshold: undefined }),
    { encoding: 'utf8' }
  );
  createCsv(
    dpeOutputs,
    OUTPUT_CSV_HEADERS,
    `dist/reports/corpus/${fileName}/corpus_detailed_report_${current_git_branch}.csv`
  );

  /** @type {string[]} **/
  const currentDpeExceedThreshold = JSON.parse(
    readFileSync(`dist/reports/corpus/${fileName}/corpus_dpe_list_under_threshold_main.json`, {
      encoding: 'utf8'
    }).toString()
  );

  /** @type {string[]} **/
  const diffDpeThreshold = globalReport.dpeExceedThreshold.filter(
    (dpe) => !currentDpeExceedThreshold.includes(dpe)
  );
  if (diffDpeThreshold.length > 0) {
    writeFileSync(
      `dist/reports/corpus/${fileName}/corpus_dpe_list_under_threshold_diff_main_${current_git_branch}.json`,
      JSON.stringify(diffDpeThreshold),
      { encoding: 'utf8' }
    );
  }

  writeFileSync(
    `dist/reports/corpus/${fileName}/corpus_dpe_list_under_threshold_${current_git_branch}.json`,
    JSON.stringify(globalReport.dpeExceedThreshold),
    { encoding: 'utf8' }
  );
});
