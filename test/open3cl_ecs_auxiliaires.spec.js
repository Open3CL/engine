import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { set_bug_for_bug_compat } from '../src/utils.js';
import { describe, expect, test } from 'vitest';

describe('Ecs auxiliaires unit tests', () => {
  test('should calculate distribution auxiliaire ecs', async () => {
    set_bug_for_bug_compat();
    let input = await getAdemeFileJsonOrDownload('2674E0057251A');

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));

    expect(input.logement.sortie.ef_conso.conso_auxiliaire_distribution_ecs).toBeCloseTo(
      output.logement.sortie.ef_conso.conso_auxiliaire_distribution_ecs
    );
  });
});
