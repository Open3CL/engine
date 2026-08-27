import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import { calcul_3cl, get_conso_coeff_1_7_2027 } from '../src/index.js';

/**
 * Load a DPE fixture from local JSON cache (no ADEME credentials needed).
 * Falls back to null if file not found.
 */
function loadFixture(dpeCode) {
  const path = `test/fixtures/${dpeCode}.json`;
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

describe('Open3cl CEP 1.7 (janvier 2027) unit tests', () => {
  test('calcul_3cl output should include _2027 ep_conso fields', () => {
    // Use any available local JSON fixture
    const fixtures = fs
      .readdirSync('test/fixtures')
      .filter((f) => f.endsWith('.json') && !f.endsWith('-result.json'));
    expect(fixtures.length).toBeGreaterThan(0);

    const inputDpe = loadFixture(fixtures[0].replace('.json', ''));
    expect(inputDpe).not.toBeNull();

    const outputDpe = calcul_3cl(structuredClone(inputDpe));

    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2027).toBeDefined();
    expect(outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2027_m2).toBeDefined();
    expect(outputDpe.logement.sortie.ep_conso.classe_bilan_dpe_2027).toBeDefined();
  });

  test('_2027 ep_conso should be <= _2026 ep_conso (lower coefficient)', () => {
    const fixtures = fs
      .readdirSync('test/fixtures')
      .filter((f) => f.endsWith('.json') && !f.endsWith('-result.json'));

    // Test across all available fixtures
    let tested = 0;
    for (const file of fixtures.slice(0, 10)) {
      const inputDpe = loadFixture(file.replace('.json', ''));
      if (!inputDpe) continue;
      const outputDpe = calcul_3cl(structuredClone(inputDpe));
      const ep2026 = outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2026;
      const ep2027 = outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2027;
      // 1.7 ≤ 1.9, so 2027 energy consumption must be ≤ 2026
      expect(ep2027).toBeLessThanOrEqual(ep2026 + 0.001); // +0.001 for floating point tolerance
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });

  test('_2027 ep_conso should be <= _2026 ep_conso for all non-result fixtures', () => {
    const fixtures = fs
      .readdirSync('test/fixtures')
      .filter((f) => f.endsWith('.json') && !f.endsWith('-result.json'));

    let tested = 0;
    for (const file of fixtures) {
      const inputDpe = loadFixture(file.replace('.json', ''));
      if (!inputDpe) continue;
      const outputDpe = calcul_3cl(structuredClone(inputDpe));
      const ep2026 = outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2026;
      const ep2027 = outputDpe.logement.sortie.ep_conso.ep_conso_5_usages_2027;
      expect(ep2027).toBeLessThanOrEqual(ep2026 + 0.001);
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  }, 60_000);

  test('get_conso_coeff_1_7_2027 returns valid result with ep_conso_5_usages <= 1.9 result', () => {
    const fixtures = fs
      .readdirSync('test/fixtures')
      .filter((f) => f.endsWith('.json') && !f.endsWith('-result.json'));

    const inputDpe = loadFixture(fixtures[0].replace('.json', ''));
    expect(inputDpe).not.toBeNull();

    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    const result1_7 = get_conso_coeff_1_7_2027(outputDpe);

    expect(result1_7.ep_conso_5_usages).toBeDefined();
    expect(result1_7.ep_conso_5_usages_m2).toBeDefined();
    expect(result1_7.classe_bilan_dpe).toBeDefined();
    expect(typeof result1_7.ep_conso_5_usages).toBe('number');
    expect(typeof result1_7.ep_conso_5_usages_m2).toBe('number');

    // 1.7 coefficient should give lower or equal conso than 1.9
    expect(result1_7.ep_conso_5_usages).toBeLessThanOrEqual(
      outputDpe.logement.sortie.ep_conso.ep_conso_5_usages + 0.001
    );
  });
});
