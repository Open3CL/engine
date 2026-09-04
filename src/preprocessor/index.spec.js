import { describe, expect, test } from 'vitest';
import { DpePreProcessor } from './index.js';

describe('Pré-processeur du DPE (DpePreProcessor)', () => {
  test('preprocess est un no-op : renvoie le DPE inchangé (même référence)', () => {
    const preProcessor = new DpePreProcessor();
    const dpe = { logement: { enveloppe: {} } };

    const resultat = preProcessor.preprocess(dpe);

    // Placeholder : le DPE est renvoyé tel quel, sans copie ni mutation.
    expect(resultat).toBe(dpe);
    expect(resultat).toEqual({ logement: { enveloppe: {} } });
  });
});
