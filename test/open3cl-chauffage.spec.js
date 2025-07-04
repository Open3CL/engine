import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '../src/utils.js';

describe('DPE Chauffage unit tests', () => {
  test('logement besoin ecs should be a ratio of the total besoin ecs', () => {
    /** @type {FullDpe} **/
    const input = getAdemeFileJson('2292E0765245C');

    set_bug_for_bug_compat();
    set_tv_match_optimized_version();

    /** @type {FullDpe} **/
    const output = calcul_3cl(structuredClone(input));

    const installationChauffage =
      output.logement.installation_chauffage_collection.installation_chauffage[0];
    console.log('input_besoin_ch', input.logement.sortie.apport_et_besoin.besoin_ch);
    console.log('output_besoin_ch', output.logement.sortie.apport_et_besoin.besoin_ch);
    const generateurPrincipal =
      installationChauffage.generateur_chauffage_collection.generateur_chauffage[0];
    expect(generateurPrincipal.donnee_intermediaire.conso_ch).toBeCloseTo(
      input.logement.installation_chauffage_collection.installation_chauffage[0]
        .generateur_chauffage_collection.generateur_chauffage[0].donnee_intermediaire.conso_ch,
      3
    );

    /**const generateurPrincipal = installationChauffage.generateur_chauffage_collection.generateur_chauffage[0];
    expect(generateurPrincipal.donnee_intermediaire.conso_ch).toBeCloseTo(5835.1447, 3);

    const generateurAppoint = installationChauffage.generateur_chauffage_collection.generateur_chauffage[1];
    expect(generateurAppoint.donnee_intermediaire.conso_ch).toBeCloseTo(5076.6840, 3);**/
  });
});
