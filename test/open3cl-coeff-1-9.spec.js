import { describe, expect, test } from 'vitest';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('Open3cl misc unit tests', () => {
  test('should calculate primary conso with coeff 1.9 (since janvier 2026) for dpe: 2369E2791083C', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2369E2791083C');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.previous_classe_bilan_dpe).toBe('G');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe).toBe('F');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2026).toBe('F');

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_m2).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages_m2
    );
  });

  test('should calculate primary conso with coeff 1.9 (since janvier 2026) for dpe: 2513E1166911W', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2513E1166911W');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.previous_classe_bilan_dpe).toBe('C');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe).toBe('B');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2026).toBe('B');

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_m2).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages_m2
    );
  });

  test('should calculate primary conso with coeff 1.9 (since janvier 2026) for dpe: 2528E1249844E', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2528E1249844E');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.previous_classe_bilan_dpe).toBe('A');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe).toBe('A');
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2026).toBe('A');

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages
    );

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_m2).toBeLessThan(
      outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages_m2
    );
  });

  test('should calculate primary conso with coeff 1.9 (since janvier 2026) for dpe: 2464E1799476F', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2464E1799476F');
    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(outputDpe.logement.sortie.ep_conso.previous_ep_conso_5_usages).toBeCloseTo(
      44852.95,
      0.5
    );
  });
});
