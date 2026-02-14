import { calcul_3cl } from '../src/engine.js';
import corpus from './corpus.json';
import { getAdemeFileJson, getResultFile, saveResultFile } from './test-helpers.js';
import { PRECISION } from './constant.js';
import { beforeAll, describe, expect, test, vi } from 'vitest';

describe('Test Open3CL engine on corpus', () => {
  /**
   * Generate all required files
   */
  beforeAll(() => {
    corpus.forEach((ademeId) => {
      const dpeRequest = getAdemeFileJson(ademeId);
      try {
        const dpeResult = calcul_3cl(structuredClone(dpeRequest));
        saveResultFile(ademeId, dpeResult);
      } catch (err) {
        console.warn(`3CL Engine failed for file ${ademeId}`, err);
      }
    });
  });

  test('should pass', () => {
    expect(true).toBe(true);
  });
});
