import { describe, expect, test } from 'vitest';
import { getAdemeFileJson, CORPUS_ANALYSIS_OPTIONS } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';

/**
 * Non-régression https://github.com/Open3CL/engine/issues/312
 *
 * Le DPE 2287E1201982M (LICIEL) retient la ligne q4pa_conv 10 « avant 1948, surfaces isolées »
 * (q4pa_conv = 2) alors que toutes ses parois sont non isolées (ligne 1 : 4,6).
 * - option `compat_for_corpus_analysis` : la ligne du DPE est reprise, q4pa_conv, hperm et conso_ch
 *   sont ceux du DPE (analyse du corpus ADEME) ;
 * - par défaut : q4pa_conv est recalculé selon la méthode (contrôle de cohérence du DPE).
 */
describe('q4pa_conv et ligne tv_q4pa_conv_id du DPE - issue #312', () => {
  test('2287E1201982M avec compat_for_corpus_analysis : q4pa_conv, hperm et conso_ch identiques au DPE', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2287E1201982M');
    const output = calcul_3cl(structuredClone(input), CORPUS_ANALYSIS_OPTIONS);

    const ventIn = input.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    const ventOut = output.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    expect(ventOut.q4pa_conv).toBe(2);
    expect(ventOut.hperm).toBeCloseTo(ventIn.hperm, 1);
    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      0
    );
  });

  test('2287E1201982M par défaut : q4pa_conv recalculé selon la méthode (parois non isolées)', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2287E1201982M');
    const output = calcul_3cl(structuredClone(input));

    const ventOut = output.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    expect(ventOut.q4pa_conv).toBe(4.6);
  });

  test('l’option n’est pas conservée d’un appel à l’autre', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2287E1201982M');
    calcul_3cl(structuredClone(input), CORPUS_ANALYSIS_OPTIONS);
    const output = calcul_3cl(structuredClone(input), { sanitize: true });

    const ventOut = output.logement.ventilation_collection.ventilation[0].donnee_intermediaire;
    expect(ventOut.q4pa_conv).toBe(4.6);
  });

  /**
   * Le DPE 2469E2650374G retient la ligne q4pa_conv 1 « avant 1948, surfaces non isolées » (4,6).
   * Un scénario de rénovation (calcul par défaut) isole tous ses murs puis recalcule le DPE
   * modifié : la ligne du DPE contredit alors les parois isolées et n'est pas reprise.
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
