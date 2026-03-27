import { calcul_3cl } from '../src/engine.js';
import corpus from './corpus.json';
import { getAdemeFileJson, getAdemeFileJsonOrDownload } from './test-helpers.js';
import {
  set_bug_for_bug_compat,
  set_tv_match_optimized_version,
  unset_tv_match_optimized_version
} from '../src/utils.js';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Pertes generateur ch unit tests', () => {
  beforeEach(() => {
    set_bug_for_bug_compat();
  });

  test('should calculate deperdition if k_saisi=0', async () => {
    let input = await getAdemeFileJsonOrDownload('2684E0017144V');

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));
    expect(input.logement.sortie.apport_et_besoin.pertes_generateur_ch_recup * 1000).toBeCloseTo(
      output.logement.sortie.apport_et_besoin.pertes_generateur_ch_recup,
      0.5
    );
  });
});
