import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';

/**
 * Non-régression https://github.com/Open3CL/engine/issues/312
 *
 * Le DPE 2287E1201982M (LICIEL) retient la ligne q4pa_conv 10 « avant 1948, surfaces isolées »
 * (q4pa_conv = 2) alors que toutes ses parois sont non isolées (ligne 1 : 4,6). La ligne du DPE
 * n'est pas reprise : q4pa_conv est recalculé selon la méthode à partir des parois, si bien que
 * l'écart avec le DPE est détecté.
 */
describe('q4pa_conv recalculé sans reprendre la ligne du DPE - issue #312', () => {
  test('2287E1201982M : ligne q4pa du DPE contradictoire, valeur recalculée (4,6)', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2287E1201982M');
    const output = calcul_3cl(structuredClone(input));

    const ventIn = input.logement.ventilation_collection.ventilation[0];
    const ventOut = output.logement.ventilation_collection.ventilation[0];
    expect(ventIn.donnee_intermediaire.q4pa_conv).toBe(2);
    expect(ventOut.donnee_intermediaire.q4pa_conv).toBe(4.6);
    expect(Number(ventOut.donnee_entree.tv_q4pa_conv_id)).toBe(1);
    expect(ventOut.donnee_intermediaire.hperm).toBeGreaterThan(ventIn.donnee_intermediaire.hperm);
  });

  /**
   * Le DPE 2469E2650374G retient la ligne q4pa_conv 1 « avant 1948, surfaces non isolées » (4,6).
   * Un scénario de rénovation isole tous ses murs puis recalcule le DPE modifié : q4pa_conv suit
   * les parois isolées.
   */
  test('2469E2650374G murs isolés : la ligne non isolée du DPE n’est pas reprise', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2469E2650374G');
    const ventIn = [input.logement.ventilation_collection.ventilation].flat()[0];
    expect(Number(ventIn.donnee_entree.tv_q4pa_conv_id)).toBe(1);

    const scenario = structuredClone(input);
    for (const mur of [scenario.logement.enveloppe.mur_collection.mur].flat()) {
      Object.assign(mur.donnee_entree, {
        enum_type_isolation_id: '3',
        enum_methode_saisie_u_id: '9',
        umur_saisi: 0.25
      });
    }
    const output = calcul_3cl(scenario);

    const ventOut = [output.logement.ventilation_collection.ventilation].flat()[0];
    expect(ventOut.donnee_intermediaire.q4pa_conv).toBe(2);
    expect(output.logement.sortie.ep_conso.classe_bilan_dpe).toBe('E');
  });
});
