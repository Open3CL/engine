import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('RCU unit tests', () => {
  test('conso ch should be conform with last rcu values', () => {
    /** @type {FullDpe} **/
    let input = getAdemeFileJson('2569E2704431K');

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));
    expect(
      output.logement.sortie.emission_ges.emission_ges_5_usages_m2 -
        input.logement.sortie.emission_ges.emission_ges_5_usages_m2
    ).toBeLessThan(1);
  });
});
