import { DuckDBInstance, version } from '@duckdb/node-api';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { sanitizeBranchName } from './corpus_utils.js';

const current_git_branch = sanitizeBranchName(
  execSync('git rev-parse --abbrev-ref HEAD').toString()
);

console.log(version());

const instance = await DuckDBInstance.create(`test/corpus/corpus_reports.db`);
const connection = await instance.connect();

/** @type {{files: string[]}} **/
const corpusList = JSON.parse(
  readFileSync(`dist/reports/corpus/corpus_list_main.json`, {
    encoding: 'utf8'
  }).toString()
);

const files = corpusList.files;

for (const file of files) {
  await importCsvReportResults(file, 'main');
  if (current_git_branch !== 'main') {
    await importCsvReportResults(file, current_git_branch);
  }
}

/**
 * @param fileName {string}
 * @param branchName {string}
 * @return {Promise<void>}
 */
async function importCsvReportResults(fileName, branchName) {
  const reportCsvFilePath = `dist/reports/corpus/${fileName}/corpus_detailed_report_${branchName}.csv`;
  const fileTrunc = fileName.replace('.csv', '');
  // Un identifiant SQL ne tolère ni tiret ni point : `fix-issue-205` deviendrait une
  // soustraction dans le nom de table.
  const tableName = `detail_report_${fileTrunc}_${branchName}`.replace(/[^A-Za-z0-9_]/g, '_');
  try {
    await connection.run(`DROP TABLE IF EXISTS ${tableName}`);
    await connection.run(`CREATE TABLE ${tableName} AS FROM read_csv_auto('${reportCsvFilePath}')`);
  } catch (error) {
    console.error(error.message);
  }
}
