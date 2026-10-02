import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJson } from './test-helpers.js';
import {
  set_bug_for_bug_compat,
  set_tv_match_optimized_version,
  unset_tv_match_optimized_version
} from '../src/utils.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * DPE cités dans l'issue #124 : puissance nominale d'une chaudière gaz collective virtualisée.
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §17.2.1 (virtualisation des usages collectifs)
 */

function generateursChauffage(dpe) {
  return [dpe.logement.installation_chauffage_collection.installation_chauffage]
    .flat()
    .flatMap((installation) =>
      [installation.generateur_chauffage_collection.generateur_chauffage].flat()
    );
}

function generateursEcs(dpe) {
  return [dpe.logement.installation_ecs_collection.installation_ecs]
    .flat()
    .flatMap((installation) => [installation.generateur_ecs_collection.generateur_ecs].flat());
}

describe('Chaudière collective : puissance nominale saisie selon les logiciels (issue #124)', () => {
  beforeAll(() => {
    set_bug_for_bug_compat();
    set_tv_match_optimized_version();
  });

  afterAll(() => {
    unset_tv_match_optimized_version();
  });

  test('2595E3549425E (LICIEL) : pn saisi en Pe, convention 3CL conservée et conso conforme', () => {
    const input = getAdemeFileJson('2595E3549425E');
    const output = calcul_3cl(structuredClone(input));

    const generateursDpe = generateursChauffage(input);
    const generateursCalcules = generateursChauffage(output);
    expect(generateursCalcules).toHaveLength(2);

    generateursCalcules.forEach((generateur, index) => {
      const diDpe = generateursDpe[index].donnee_intermediaire;
      const di = generateur.donnee_intermediaire;
      // pn = Pe = a × Pn : aucune réinterprétation de la puissance
      expect(di.pn).toBe(diDpe.pn);
      expect(generateur.donnee_entree.tv_generateur_combustion_id).toBe(12);
      expect(di.rpn).toBeCloseTo(diDpe.rpn, 6);
      expect(di.rpint).toBeCloseTo(diDpe.rpint, 6);
      expect(di.qp0).toBeCloseTo(diDpe.qp0, 4);
      expect(di.conso_ch).toBeCloseTo(diDpe.conso_ch, 1);
    });

    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      1
    );
    expect(output.logement.sortie.ep_conso.classe_bilan_dpe).toBe(
      input.logement.sortie.ep_conso.classe_bilan_dpe
    );
  });

  test("2592E2935275X (WinDpe) : pn saisi ni en Pe ni en Pn, aucune correction n'est appliquée", () => {
    const input = getAdemeFileJson('2592E2935275X');
    const output = calcul_3cl(structuredClone(input));

    const diDpe = generateursChauffage(input)[0].donnee_intermediaire;
    const di = generateursChauffage(output)[0].donnee_intermediaire;

    /**
     * rpn du DPE = 0,938426 = (91 + log10(Pn)) / 100 -> Pn(collectif) = 696 kW, soit
     * Pe = a × Pn = 2018,32 W. Le pn saisi (69600 W) n'est cohérent ni avec Pe (pn / a = 24 MW)
     * ni avec Pn (69,6 kW) : la détection conserve la convention 3CL (pn / a).
     */
    expect(10 ** (diDpe.rpn * 100 - 91)).toBeCloseTo(696, 2);
    expect(di.pn).toBe(69600);
    expect(di.rpn).not.toBeCloseTo(diDpe.rpn, 3);
    expect(output.logement.sortie.ef_conso.conso_ch).toBeGreaterThan(
      input.logement.sortie.ef_conso.conso_ch * 1.4
    );
  });

  test('2592E2935275X (WinDpe) : avec pn = Pe non tronqué, rendements et conso ECS du DPE retrouvés', () => {
    const input = getAdemeFileJson('2592E2935275X');
    const ratio = [
      input.logement.installation_chauffage_collection.installation_chauffage
    ].flat()[0].donnee_entree.ratio_virtualisation;

    // Comportement attendu décrit dans l'issue : Pe = a × Pn(collectif) = a × 696 kW
    const pe = ratio * 696000;
    expect(pe).toBeCloseTo(2018.32, 2);

    const corrige = structuredClone(input);
    [...generateursChauffage(corrige), ...generateursEcs(corrige)].forEach((generateur) => {
      generateur.donnee_intermediaire.pn = pe;
    });
    const output = calcul_3cl(corrige);

    const diDpe = generateursChauffage(input)[0].donnee_intermediaire;
    const di = generateursChauffage(output)[0].donnee_intermediaire;
    expect(di.rpn).toBeCloseTo(diDpe.rpn, 6);
    expect(di.rpint).toBeCloseTo(diDpe.rpint, 6);
    expect(di.rendement_generation).toBeCloseTo(diDpe.rendement_generation, 2);

    expect(output.logement.sortie.ef_conso.conso_ecs).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ecs,
      2
    );

    /**
     * L'écart résiduel sur conso_ch (≈ -4,9 %) vient du besoin de chauffage (déperditions de
     * l'enveloppe 74,8 W/K contre 78,5 W/K), signalé dans l'issue (« problème de mur »).
     */
    const ecartConsoCh =
      output.logement.sortie.ef_conso.conso_ch / input.logement.sortie.ef_conso.conso_ch - 1;
    expect(Math.abs(ecartConsoCh)).toBeLessThan(0.06);
  });
});
