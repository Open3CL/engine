import { beforeEach, describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat } from '../src/utils.js';

/**
 * Non-regression test for https://github.com/Open3CL/engine/issues/153
 *
 * Le DPE 2630E0016701S (LICIEL, moteur BBS_Slama_2025.11.1.0) contient un chauffe-eau gaz
 * à production instantanée dédié à l'ECS (enum_usage_generateur_id = 2, Qp0 = 240 W), situé
 * dans le volume chauffé, avec un chauffage par convecteurs électriques.
 *
 * Avant le correctif, ses pertes de génération n'étaient pas récupérées pour le chauffage
 * (pertes_generateur_ch_recup = 0), d'où un léger excès de besoin_ch.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §9.1.1
 */
describe('Pertes récupérées d’un générateur ECS seul - issue #153', () => {
  beforeEach(() => {
    set_bug_for_bug_compat();
  });

  test('pertes_generateur_ch_recup et besoin_ch identiques au DPE 2630E0016701S', () => {
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2630E0016701S');
    /** @type {FullDpe} */
    const output = calcul_3cl(structuredClone(input));

    const abIn = input.logement.sortie.apport_et_besoin;
    const abOut = output.logement.sortie.apport_et_besoin;

    // bug for bug : le logiciel exporte la perte en kWh, Open3CL la conserve en Wh
    expect(abOut.pertes_generateur_ch_recup).toBeCloseTo(abIn.pertes_generateur_ch_recup * 1000, 2);
    expect(abOut.pertes_generateur_ch_recup_depensier).toBeCloseTo(
      abIn.pertes_generateur_ch_recup_depensier * 1000,
      2
    );
    expect(abOut.besoin_ch).toBeCloseTo(abIn.besoin_ch, 1);
    expect(output.logement.sortie.ef_conso.conso_ch).toBeCloseTo(
      input.logement.sortie.ef_conso.conso_ch,
      1
    );
  });
});
