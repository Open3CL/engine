import { MultiBar } from 'cli-progress';
import colors from 'ansi-colors';
import Piscina from 'piscina';
import { resolve } from 'path';
import {
  DIFF_VALUE_THRESHOLD,
  DPE_PROPERTIES_TO_VALIDATE,
  OUTPUT_CSV_HEADERS
} from './corpus_utils.js';
import { createReadStream, createWriteStream, existsSync, writeFileSync } from 'node:fs';
import { chunk } from 'lodash-es';
import { mkdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { format } from 'fast-csv';
import CsvParserStore from '../../src/core/file/infrastructure/adapter/csv-parser.store.js';

const REPORTS_FOLFER_PATH = 'dist/reports/corpus';

export class CorpusRunner {
  /** @type  {CsvParserStore} **/
  #csvStore;
  /** @type {import('piscina').Piscina} **/
  #piscina;
  /** @type {import('cli-progress').MultiBar} **/
  #multiBar;
  /** @type {import('cli-progress').MultiBar} **/
  #downloadBar;
  /** @type {import('cli-progress').MultiBar} **/
  #corpusBar;
  /** @type {number} **/
  #totalDpes;
  /** @type {number} **/
  #downloadDedFiles;
  /** @type {object} **/
  #globalReport;
  /** @type {object[]} **/
  #dpeOutputs;
  /** @type {string} **/
  #curentGitBranch;

  /**
   * @param csvStore {CsvParserStore}
   */
  constructor(csvStore) {
    this.#csvStore = csvStore;
    this.#dpeOutputs = [];
    this.#totalDpes = 0;
    this.#downloadDedFiles = 0;
    this.#globalReport = {
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
    this.#multiBar = new MultiBar({
      format: colors.cyan('{bar}') + '| {percentage}% | ETA: {eta}s | {value}/{total} DPE {action}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591'
    });
    this.#piscina = new Piscina({
      filename: resolve(process.cwd(), `${import.meta.dirname}/corpus_worker.mjs`),
      maxQueue: 'auto',
      maxThreads: process.env.MAX_WORKER_THREADS
        ? Number(process.env.MAX_WORKER_THREADS)
        : undefined
    });
    this.#piscina.on('message', this.#onWorkerMessage.bind(this));
    this.#curentGitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }

  static getInstance() {
    return new CorpusRunner(new CsvParserStore());
  }

  /**
   * @param dpesFilePath {string}
   * @param corpusFilePath {string}
   * @param csvHeaders {string[]}
   * @return {Promise<void>}
   */
  run(dpesFilePath, corpusFilePath, csvHeaders) {
    console.time(corpusFilePath);
    return this.#validateCorpus(dpesFilePath, corpusFilePath, csvHeaders).then(() => {
      console.timeEnd(corpusFilePath);
      this.#piscina.off('message', this.#onWorkerMessage.bind(this));
      this.#multiBar.stop();

      this.#globalReport.successRatio = `${Number((this.#globalReport.nbAllChecksBelowThreshold / this.#globalReport.totalDpesInFile) * 100).toFixed(2)} %`;

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
      if (!corpusList.branches.includes(this.#curentGitBranch)) {
        corpusList.branches.push(this.#curentGitBranch);
      }

      writeFileSync(`${REPORTS_FOLFER_PATH}/corpus_list_main.json`, JSON.stringify(corpusList), {
        encoding: 'utf8'
      });

      mkdirSync(`${REPORTS_FOLFER_PATH}/${fileName}`, { recursive: true });
      writeFileSync(
        `${REPORTS_FOLFER_PATH}/${fileName}/corpus_global_report_${this.#curentGitBranch}.json`,
        JSON.stringify({ ...this.#globalReport, dpeExceedThreshold: undefined }),
        { encoding: 'utf8' }
      );
      this.#createCsv(
        this.#dpeOutputs,
        OUTPUT_CSV_HEADERS,
        `${REPORTS_FOLFER_PATH}/${fileName}/corpus_detailed_report_${this.#curentGitBranch}.csv`
      );

      /** @type {string[]} **/
      let currentDpeExceedThreshold = [];
      if (
        existsSync(`${REPORTS_FOLFER_PATH}/${fileName}/corpus_dpe_list_above_threshold_main.json`)
      ) {
        currentDpeExceedThreshold = JSON.parse(
          readFileSync(
            `${REPORTS_FOLFER_PATH}/${fileName}/corpus_dpe_list_above_threshold_main.json`,
            {
              encoding: 'utf8'
            }
          ).toString()
        );
      }

      /** @type {string[]} **/
      const diffDpeThreshold = this.#globalReport.dpeExceedThreshold.filter(
        (dpe) => !currentDpeExceedThreshold.includes(dpe)
      );
      if (diffDpeThreshold.length > 0) {
        writeFileSync(
          `${REPORTS_FOLFER_PATH}/${fileName}/corpus_dpe_list_above_threshold_diff_main_${this.#curentGitBranch}.json`,
          JSON.stringify(diffDpeThreshold),
          { encoding: 'utf8' }
        );
      }

      writeFileSync(
        `${REPORTS_FOLFER_PATH}/${fileName}/corpus_dpe_list_above_threshold_${this.#curentGitBranch}.json`,
        JSON.stringify(this.#globalReport.dpeExceedThreshold),
        { encoding: 'utf8' }
      );
    });
  }

  #createCsv(rows, headers, filename) {
    const csvStream = format({ headers });

    // loop over nested row arrays
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      csvStream.write(row);
    }
    csvStream.pipe(createWriteStream(filename, { encoding: 'utf8' }));
    csvStream.end();
    return `Finished writing data to: ${filename}`;
  }

  /**
   * @param dpesFilePath {string}
   * @param corpusFilePath {string}
   * @param csvHeaders {string[]}
   * @return {Promise<void>}
   */
  #validateCorpus(dpesFilePath, corpusFilePath, csvHeaders) {
    const readableStream = createReadStream(`test/corpus/files/${corpusFilePath}`);
    return this.#csvStore
      .parseFromStream(
        readableStream,
        {
          // Keep only interested headers + rename them
          headers: csvHeaders,
          ignoreEmpty: true,
          skipRows: 1,
          discardUnmappedColumns: true
        },
        (row) => row
      )
      .then(
        /** @param dpeCodes {{dpeCode: string}[]} **/ async (dpeCodes) => {
          const dpesToAnalyze = dpeCodes;

          this.#totalDpes = dpesToAnalyze.length;
          this.#globalReport.totalDpesInFile = this.#totalDpes;

          console.log(`${this.#totalDpes} DPE to analyze from corpus: ${corpusFilePath}`);
          this.#corpusBar = this.#multiBar.create(this.#totalDpes, 0, { action: 'analysés' });

          // Certains DPE, après analyse manuelle sont à exclure
          const dpesToExclude = [];

          let nbAnalyzedDpe = 0;

          /**
           * @type {{dpeCode: string}[][]}
           */
          const chunks = chunk(dpesToAnalyze, process.env.WORKER_THREADS_CHUNKS || 200);
          /** @type {any[][]} **/
          const results = await Promise.all(
            chunks.map((chunk) => {
              return this.#piscina.run({ chunk, dpesToExclude, dpesFilePath }).then((data) => {
                nbAnalyzedDpe += chunks.length;
                this.#corpusBar.increment(chunk.length, { action: 'analysés' });
                return data;
              });
            })
          );

          results.forEach((result) => {
            this.#dpeOutputs.push(...result);
          });
        }
      );
  }

  #onWorkerMessage(event) {
    switch (event.action) {
      case 'fileProcessed': {
        if (!this.#downloadBar) {
          this.#downloadBar = this.#multiBar.create(this.#totalDpes, 1, {});
        }
        if (this.#downloadDedFiles < this.#totalDpes) {
          this.#downloadBar.increment({ action: 'chargés' });
        }
        break;
      }
      case 'incrementTotalReport': {
        this.#globalReport.nbValidDpe++;
        break;
      }
      case 'decrementTotalReport': {
        this.#globalReport.nbValidDpe--;
        break;
      }
      case 'incrementExcludedDpe': {
        this.#globalReport.nbExcludedDpe++;
        break;
      }
      case 'incrementInvalidDpeVersion': {
        this.#globalReport.nbInvalidDpeVersion++;
        break;
      }
      case 'addFailedDpe': {
        this.#globalReport.dpeRunFailed.push(event.dpeCode);
        break;
      }
      case 'incrementAllChecksThreshold': {
        this.#globalReport.nbAllChecksBelowThreshold++;
        break;
      }
      case 'addDpeExceedThresholdInList': {
        if (!this.#globalReport.dpeExceedThreshold.includes(event.dpeCode)) {
          this.#globalReport.dpeExceedThreshold.push(event.dpeCode);
        }
        break;
      }
      case 'incrementCheckPropertyThreshold': {
        const mandatoryProperties = DPE_PROPERTIES_TO_VALIDATE.flatMap((property) =>
          property.split('#')
        );
        if (!this.#globalReport.checks[event.property]) {
          this.#globalReport.checks[event.property] = {
            nbBelowThreshold: 0,
            mandatory: mandatoryProperties.some((mandatoryProperty) =>
              mandatoryProperty.includes(event.property)
            )
          };
        }

        this.#globalReport.checks[event.property].nbBelowThreshold++;
        this.#globalReport.checks[event.property].successRatio =
          `${Number((this.#globalReport.checks[event.property].nbBelowThreshold / this.#globalReport.totalDpesInFile) * 100).toFixed(2)} %`;
        break;
      }
    }
  }
}
