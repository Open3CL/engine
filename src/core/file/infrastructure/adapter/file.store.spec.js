import { beforeEach, describe, expect, test, vi } from 'vitest';

// Isolation : on mocke le module `fs` pour ne pas dépendre du système de fichiers
// (lecture d'un vrai `.ods`) ni écrire réellement sur le disque.
vi.mock('fs', () => ({
  readFile: vi.fn((path, cb) => cb(null, Buffer.from(new ArrayBuffer(1)))),
  writeFile: vi.fn((path, content, opts, cb) => cb(null))
}));

// Isolation : on mocke `xlsx` pour piloter le contenu du classeur retourné et
// tester la logique propre au fichier (fusion de cellules `!merges`) sans
// dépendre du parsing réel d'un binaire.
vi.mock('xlsx', () => ({
  read: vi.fn(() => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } })),
  utils: {
    // Colonnes : 0 -> A, 1 -> B, ...
    encode_col: vi.fn((c) => String.fromCharCode(65 + c)),
    // Lignes : 0 -> 1, 1 -> 2, ... (numérotation 1-based du tableur)
    encode_row: vi.fn((r) => String(r + 1)),
    sheet_to_json: vi.fn(() => [])
  }
}));

const { readFile, writeFile } = await import('fs');
const XLSX = await import('xlsx');
const { FileStore } = await import('./file.store.js');

global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
  })
);

describe('FileStore', () => {
  beforeEach(() => {
    vi.mocked(readFile).mockReset();
    vi.mocked(writeFile).mockReset();
    vi.mocked(XLSX.read).mockReset();
    vi.mocked(XLSX.utils.sheet_to_json).mockReset();
    vi.mocked(XLSX.utils.encode_col).mockClear();
    vi.mocked(XLSX.utils.encode_row).mockClear();

    // Comportements par défaut « nominaux ».
    vi.mocked(readFile).mockImplementation((path, cb) => cb(null, Buffer.from(new ArrayBuffer(1))));
    vi.mocked(writeFile).mockImplementation((path, content, opts, cb) => cb(null));
    vi.mocked(XLSX.read).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} }
    });
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);
  });

  describe('downloadXlsxFileAndConvertToJson', () => {
    test('télécharge le fichier puis le convertit en JSON par feuille', async () => {
      const fileStore = new FileStore();

      const output = await fileStore.downloadXlsxFileAndConvertToJson('http://localhost:8080');

      expect(output).toEqual({ Sheet1: [] });
      // Le buffer téléchargé est lu par XLSX avec les bonnes options.
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080');
      expect(XLSX.read).toHaveBeenCalledWith(expect.anything(), {
        type: 'string',
        raw: false
      });
    });
  });

  describe('readLocalOdsFileAndConvertToJson', () => {
    test('lit le fichier local et le convertit en JSON par feuille', async () => {
      const fileStore = new FileStore();

      const output = await fileStore.readLocalOdsFileAndConvertToJson('file.ods');

      expect(output).toEqual({ Sheet1: [] });
      expect(readFile).toHaveBeenCalledWith('file.ods', expect.any(Function));
      // La lecture locale utilise l'option `type: 'buffer'`.
      expect(XLSX.read).toHaveBeenCalledWith(expect.anything(), {
        type: 'buffer',
        raw: false
      });
    });

    test("journalise et avale l'erreur si la lecture échoue (branche rejet + catch)", async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(readFile).mockImplementation((path, cb) => cb(new Error('lecture impossible')));

      const fileStore = new FileStore();
      const output = await fileStore.readLocalOdsFileAndConvertToJson('absent.ods');

      // Le catch avale l'erreur : la promesse se résout sur `undefined`.
      expect(output).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Could not parse file: absent.ods, reason: lecture impossible'
      );
      // XLSX ne doit pas être appelé en cas d'erreur de lecture.
      expect(XLSX.read).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('writeFileToLocalSystem', () => {
    test('écrit le contenu en UTF-8 et résout la promesse', async () => {
      const fileStore = new FileStore();

      await expect(
        fileStore.writeFileToLocalSystem('sortie.json', 'contenu')
      ).resolves.toBeUndefined();

      expect(writeFile).toHaveBeenCalledWith(
        'sortie.json',
        'contenu',
        { encoding: 'utf-8' },
        expect.any(Function)
      );
    });

    test("rejette la promesse si l'écriture échoue (branche rejet)", async () => {
      const erreur = new Error('disque plein');
      vi.mocked(writeFile).mockImplementation((path, content, opts, cb) => cb(erreur));

      const fileStore = new FileStore();

      await expect(fileStore.writeFileToLocalSystem('sortie.json', 'contenu')).rejects.toBe(erreur);
    });
  });

  describe('conversion des feuilles avec cellules fusionnées', () => {
    test('propage la valeur de la première cellule sur les lignes fusionnées', async () => {
      const firstCell = { v: 'valeur fusionnée' };
      const feuille = {
        // Fusion de A1 à A3 (3 lignes, colonne 0).
        '!merges': [{ s: { c: 0, r: 0 }, e: { c: 0, r: 2 } }],
        A1: firstCell
      };
      const classeur = { SheetNames: ['Sheet1'], Sheets: { Sheet1: feuille } };
      vi.mocked(XLSX.read).mockReturnValue(classeur);

      const fileStore = new FileStore();
      await fileStore.downloadXlsxFileAndConvertToJson('http://localhost:8080');

      // nbMergedRows = 2 : les cellules A2 et A3 reçoivent la valeur de A1.
      expect(feuille.A2).toBe(firstCell);
      expect(feuille.A3).toBe(firstCell);
      // La feuille (mutée) est ensuite transformée en JSON.
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalledWith(feuille, {
        raw: false
      });
    });

    test("ne modifie pas la feuille en l'absence de fusion", async () => {
      const feuille = { A1: { v: 'x' } };
      vi.mocked(XLSX.read).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: feuille }
      });

      const fileStore = new FileStore();
      await fileStore.downloadXlsxFileAndConvertToJson('http://localhost:8080');

      // Aucune cellule supplémentaire n'est créée.
      expect(Object.keys(feuille)).toEqual(['A1']);
      expect(XLSX.utils.encode_col).not.toHaveBeenCalled();
    });
  });
});
