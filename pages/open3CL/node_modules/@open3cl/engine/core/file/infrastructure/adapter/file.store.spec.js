import { FileStore } from './file.store.js';
import { describe, expect, test, vi } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
  })
);

describe('FileStore unit tests', () => {
  test('should be able to download and parse an xlsx file', () => {
    const fileStore = new FileStore();

    return fileStore.downloadXlsxFileAndConvertToJson('http://localhost:8080').then((output) => {
      expect(output).toEqual({ Sheet1: [] });
    });
  });

  test('should be able to read and parse local ods file', () => {
    const fileStore = new FileStore();

    return fileStore.readLocalOdsFileAndConvertToJson('file.ods').then((output) => {
      expect(output).toEqual({ Sheet1: [] });
    });
  });

  test('should write file to local system', () => {
    const fileStore = new FileStore();
    return fileStore.writeFileToLocalSystem('src/output.js', 'filecontent');
  });
});
