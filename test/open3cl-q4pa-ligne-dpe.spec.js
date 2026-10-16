import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';

/**
 * Non-régression https://github.com/Open3CL/engine/issues/312
 *
 * Le DPE 2287E1201982M (LICIEL) retient la ligne q4pa_conv 10 « avant 1948, surfaces isolées »
 * (q4pa_conv = 2) alors que toutes ses parois sont non isolées (ligne 1 : 4,6). En mode
 * bug_for_bug_compat, la ligne du DPE est reprise : q4pa_conv, hperm et conso_ch sont ceux du DPE.
 */
describe('q4pa_conv repris de la ligne du DPE - issue #312', () => {
  test('2287E1201982M : q4pa_conv, hperm et conso_ch identiques au DPE', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2287E1201982M');
    const output = calcul_3cl(structuredClone(input));

    const ventIn = input.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    const ventOut = output.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    expect(ventOut.q4pa_conv).toBe(2);
    expect(ventOut.hperm).toBeCloseTo(ventIn.hperm, 1);
    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      0
    );
  });
});
