import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJson } from './test-helpers.js';
import {
  set_bug_for_bug_compat,
  set_tv_match_optimized_version,
  unset_tv_match_optimized_version
} from '../src/utils.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Issue #220 : période d'installation des émetteurs non exportée par le logiciel. En mode
 * bug_for_bug_compat, la période est retrouvée à partir des temp_fonc_30 / temp_fonc_100 stockées
 * dans les données intermédiaires du générateur ; les valeurs retenues proviennent des tables.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.1.5
 */

function generateursChauffage(dpe) {
  return [dpe.logement.installation_chauffage_collection.installation_chauffage]
    .flat()
    .flatMap((installation) =>
      [installation.generateur_chauffage_collection.generateur_chauffage].flat()
    );
}

describe("Période d'installation des émetteurs déduite des temp_fonc du DPE (issue #220)", () => {
  beforeAll(() => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
  });

  afterAll(() => {
    unset_tv_match_optimized_version();
  });

  test('2459E0028946S (4.1.1, construction 1920, chaudière hybride) : 32/60 (« après 2000 ») au lieu de 38/80', () => {
    const input = getAdemeFileJson('2459E0028946S');
    const output = calcul_3cl(structuredClone(input));

    const diDpe = generateursChauffage(input)[0].donnee_intermediaire;
    const generateur = generateursChauffage(output)[0];
    expect(generateur.donnee_intermediaire.temp_fonc_30).toBe(32);
    expect(generateur.donnee_intermediaire.temp_fonc_100).toBe(60);
    // Lignes de table « moyenne / après 2000 »
    expect(generateur.donnee_entree.tv_temp_fonc_30_id).toBe('8');
    expect(generateur.donnee_entree.tv_temp_fonc_100_id).toBe('8');
    expect(generateur.donnee_intermediaire.rendement_generation).toBeCloseTo(
      diDpe.rendement_generation,
      6
    );
    // Avant correctif : conso_ch = 7297,10 kWh (+1,88 %) ; DPE : 7162,38 kWh
    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      1
    );
  });

  test('2287E0373232M (LICIEL, construction 1947, chaudière fioul) : 52,5/70 au lieu de 55,5/80', () => {
    const input = getAdemeFileJson('2287E0373232M');
    const output = calcul_3cl(structuredClone(input));

    const diDpe = generateursChauffage(input)[0].donnee_intermediaire;
    const generateur = generateursChauffage(output)[0];
    expect(generateur.donnee_intermediaire.temp_fonc_30).toBe(52.5);
    expect(generateur.donnee_intermediaire.temp_fonc_100).toBe(70);
    expect(generateur.donnee_entree.tv_temp_fonc_30_id).toBeDefined();
    expect(generateur.donnee_entree.tv_temp_fonc_100_id).toBeDefined();
    expect(generateur.donnee_intermediaire.rendement_generation).toBeCloseTo(
      diDpe.rendement_generation,
      6
    );
    // Avant correctif : conso_ch = 31232,85 kWh (+1,28 %) ; DPE : 30837,05 kWh
    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      0
    );
  });
});
