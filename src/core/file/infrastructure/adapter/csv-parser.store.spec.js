import { beforeEach, describe, expect, it } from 'vitest';
import CsvParserStore from './csv-parser.store.js';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';

describe('CsvParserStore', () => {
  /** @type {CsvParserStore} **/
  let store;

  /** @type {ReadStream} **/
  let stream;

  beforeEach(() => {
    store = new CsvParserStore();
  });

  describe('parseFromStream', () => {
    it('should parse a csv file from a stream', () => {
      stream = createReadStream(resolve('test/corpus/corpus_dpe.csv'));

      return store
        .parseFromStream(stream, {}, (data) => data)
        .then((data) => {
          expect(data).toBeDefined();
        });
    });
  });
});
