import { readdirSync } from 'fs';
import { existsSync } from 'node:fs';
import { CorpusRunner } from './corpus.runner.js';

const corpusFileNameArg = process.argv.find((arg) => arg.includes('corpus-file-path'));
const corpusFile = corpusFileNameArg ? corpusFileNameArg.split('=').pop() : undefined;

const dpeCodeArg = process.argv.find((arg) => arg.includes('dpe-code'));
const dpeCode = dpeCodeArg ? dpeCodeArg.split('=').pop() : undefined;

const noDpePositionArg = process.argv.find((arg) => arg.includes('no-dpe-pos'));
const noDpePosition = noDpePositionArg ? Number(noDpePositionArg.split('=').pop()) : 0;

const INPUT_CSV_HEADERS = [];
for (let i = 0; i < noDpePosition; i++) {
  INPUT_CSV_HEADERS.push(undefined);
}
INPUT_CSV_HEADERS.push('dpeCode');

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

if (dpeCode) {
  await CorpusRunner.getInstance().runSingleDpeByCode(dpesFilePath, dpeCode);
} else {
  if (corpusFile) {
    await CorpusRunner.getInstance().run(dpesFilePath, corpusFile, undefined, INPUT_CSV_HEADERS);
  } else {
    console.time('all corpus');
    const corpusFiles = readdirSync('test/corpus/files');

    for (const corpusFileName of corpusFiles) {
      await CorpusRunner.getInstance().run(
        dpesFilePath,
        corpusFileName,
        undefined,
        INPUT_CSV_HEADERS
      );
    }
    console.timeEnd('all corpus');
  }
}
