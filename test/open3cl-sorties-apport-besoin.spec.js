import { calcul_3cl } from '../src/engine.js';
import corpus from './corpus.json';
import { getAdemeFileJson, getResultFile, saveResultFile } from './test-helpers.js';
import { describe, expect, test, beforeAll, vi } from 'vitest';
import { PRECISION, PRECISION_PERCENT } from './constant.js';
import { expect_or } from './utils.js';

describe('Test Open3CL engine compliance on corpus', () => {
  /**
   * Generate all required files
   */
  beforeAll(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
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

  describe.each([
    'surface_sud_equivalente',
    'apport_solaire_fr',
    'apport_interne_fr',
    'apport_solaire_ch',
    'apport_interne_ch',
    'fraction_apport_gratuit_ch',
    'fraction_apport_gratuit_depensier_ch',
    'pertes_distribution_ecs_recup',
    'pertes_distribution_ecs_recup_depensier',
    'pertes_stockage_ecs_recup',
    'pertes_generateur_ch_recup',
    'pertes_generateur_ch_recup_depensier',
    'nadeq',
    'v40_ecs_journalier',
    'v40_ecs_journalier_depensier',
    'besoin_fr',
    'besoin_fr_depensier'
  ])('check "apport_et_besoin.%s" value', (attr) => {
    test.each(corpus)('dpe %s', (ademeId) => {
      const exceptedDpe = getAdemeFileJson(ademeId);
      const calculatedDpe = getResultFile(ademeId);
      expect(calculatedDpe.logement.sortie.apport_et_besoin[attr]).toBeCloseTo(
        exceptedDpe.logement.sortie.apport_et_besoin[attr],
        PRECISION
      );
    });
  });

  describe.each(['besoin_ecs', 'besoin_ecs_depensier', 'besoin_ch', 'besoin_ch_depensier'])(
    'check "%s" value',
    (attr) => {
      test.each(corpus)('dpe %s, attribut:' + attr, (ademeId) => {
        const exceptedDpe = getAdemeFileJson(ademeId);
        const calculatedDpe = getResultFile(ademeId);

        const expectedValue = exceptedDpe.logement.sortie.apport_et_besoin[attr];
        const calculatedValue = calculatedDpe.logement.sortie.apport_et_besoin[attr];

        // Values should sometimes be in different unit
        const diff = Math.abs(expectedValue - calculatedValue) / (expectedValue || 1);
        const diff1 = Math.abs(expectedValue - calculatedValue * 1000) / (expectedValue || 1);
        const diff2 = Math.abs(expectedValue - calculatedValue / 1000) / (expectedValue || 1);

        const expectMessage = `${attr}: expected: ${expectedValue}, calculated: ${calculatedValue}`;
        expect_or(
          () => expect(diff, `${expectMessage}, diff: ${diff}`).toBeLessThan(PRECISION_PERCENT),
          () => expect(diff1, `${expectMessage}, diff: ${diff1}`).toBeLessThan(PRECISION_PERCENT),
          () => expect(diff2, `${expectMessage}, diff: ${diff2}`).toBeLessThan(PRECISION_PERCENT)
        );
      });
    }
  );
});
