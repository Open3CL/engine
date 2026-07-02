import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('Open3cl sintizing tests', () => {
  test('should create missing collections', () => {
    const inputDpe = getAdemeFileJson('dpe_without_porte_collection');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.coeff_2_3_classe_bilan_dpe).toBe('G');
  });
});
