import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { set_bug_for_bug_compat } from '../src/utils.js';
import { describe, expect, test } from 'vitest';

describe('Ecs unit tests', () => {
  test.each(['2259E2655747L', '2475E0800069X', '2325E0263200D', '2325E0263102J'])(
    'should have valid ecs conso with valid ratio virtualisation for dpe %s',
    async (dpeCode) => {
      set_bug_for_bug_compat();
      let input = await getAdemeFileJsonOrDownload(dpeCode);

      /** @type {FullDpe} **/
      let output = calcul_3cl(structuredClone(input));

      expect(input.logement.sortie.ep_conso.ep_conso_ecs).toBeCloseTo(
        output.logement.sortie.ep_conso.ep_conso_ecs,
        0.5
      );
    }
  );
});
