import { describe, expect, test } from 'vitest';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('Open3cl misc unit tests', () => {
  test('should calculate primary conso with coeff 1.9 (since janvier 2026)', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2369E2791083C');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2025).toBe('G');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe).toBe('F');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2026).toBe('F');

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2025
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2025
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_m2).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2025_m2
    );
  });
});
