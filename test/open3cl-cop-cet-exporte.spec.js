import { describe, expect, test } from 'vitest';
import { getAdemeFileJson, CORPUS_ANALYSIS_OPTIONS } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';

/**
 * Non-régression : COP des chauffe-eau thermodynamiques exporté par LICIEL.
 *
 * Le DPE 2672E0078383S (LICIEL, moteur BBS_Slama_2025.11.1.0, zone H1/H2) déclare un CET sur air
 * ambiant installé après 2014 (enum_type_generateur_ecs_id 3, tv_scop_id 73, COP de la table 2,5)
 * mais exporte cop = 2,8 (valeur « air extrait » de la méthode).
 * - option `compat_for_corpus_analysis` : le COP du DPE est repris, conso_ecs est celle du DPE ;
 * - par défaut : le COP de la table (2,5) est utilisé.
 */
function generateurEcs(dpe) {
  return dpe.logement.installation_ecs_collection.installation_ecs[0].generateur_ecs_collection
    .generateur_ecs[0];
}

describe('COP du CET exporté par le DPE - 2672E0078383S', () => {
  test('avec compat_for_corpus_analysis : COP 2,8 du DPE repris, conso_ecs identique au DPE', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2672E0078383S');
    const output = calcul_3cl(structuredClone(input), CORPUS_ANALYSIS_OPTIONS);

    expect(generateurEcs(output).donnee_intermediaire.cop).toBe(2.8);
    expect(generateurEcs(output).donnee_entree.tv_scop_id).toBe(73);
    expect(output.logement.sortie.ef_conso.conso_ecs).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ecs,
      1
    );
  });

  test('par défaut : COP de la table (2,5) utilisé', () => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2672E0078383S');
    const output = calcul_3cl(structuredClone(input));

    expect(generateurEcs(output).donnee_intermediaire.cop).toBe(2.5);
    expect(output.logement.sortie.ef_conso.conso_ecs).toBeGreaterThan(
      input.logement.sortie.ef_conso.conso_ecs * 1.1
    );
  });
});
