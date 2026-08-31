import { beforeEach, describe, expect, it } from 'vitest';
import CsvParserStore from './csv-parser.store.js';
import { Readable } from 'node:stream';

describe('CsvParserStore', () => {
  /** @type {CsvParserStore} **/
  let store;

  beforeEach(() => {
    store = new CsvParserStore();
  });

  describe('parseFromStream', () => {
    // Flux CSV construit en mémoire pour garder le test isolé (aucune dépendance à un fichier réel).
    it('convertit chaque ligne du flux en objet à partir des en-têtes', async () => {
      const stream = Readable.from(['numero_dpe,etiquette\nDPE-1,A\nDPE-2,F\n']);

      const data = await store.parseFromStream(stream, { headers: true }, (row) => row);

      expect(data).toStrictEqual([
        { numero_dpe: 'DPE-1', etiquette: 'A' },
        { numero_dpe: 'DPE-2', etiquette: 'F' }
      ]);
    });

    it('applique la fonction de transformation à chaque ligne', async () => {
      const stream = Readable.from(['numero_dpe,etiquette\nDPE-1,A\n']);

      const data = await store.parseFromStream(stream, { headers: true }, (row) => ({
        id: row.numero_dpe
      }));

      expect(data).toStrictEqual([{ id: 'DPE-1' }]);
    });

    it('rejette la promesse lorsque la transformation lève une erreur', async () => {
      const stream = Readable.from(['numero_dpe,etiquette\nDPE-1,A\n']);

      await expect(
        store.parseFromStream(stream, { headers: true }, () => {
          throw new Error('ligne invalide');
        })
      ).rejects.toThrow('ligne invalide');
    });
  });
});
