import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { set_bug_for_bug_compat } from '../src/utils.js';
import { describe, expect, test } from 'vitest';

describe('Production enr unit tests', () => {
  test.each(['2542E0238063B'])('should include pnr in ep conso for dpe %s', async (dpeCode) => {
    set_bug_for_bug_compat();
    let input = await getAdemeFileJsonOrDownload(dpeCode);

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));

    expect(input.logement.sortie.ef_conso.conso_5_usages_m2).toBeCloseTo(
      output.logement.sortie.ef_conso.conso_5_usages_m2
    );
  });
});
