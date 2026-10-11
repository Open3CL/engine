import { beforeEach, describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { set_bug_for_bug_compat } from '../src/utils.js';

/**
 * Non-regression test for https://github.com/Open3CL/engine/issues/35
 *
 * Le DPE 2459E3195669T (LICIEL, moteur 3cl_tribu_1.4.25.1) contient une chaudière gaz basse
 * température après 2015 (24 kW) à ventouse mais sans ventilateur dans le circuit de combustion
 * (fiche technique catégorie 7), et un chauffe-eau gaz instantané dédié à l'ECS.
 *
 * Les coefficients (E, F) de qp0 dépendent du ventilateur et non de la ventouse : qp0 = 335 W
 * (sans ventilateur) et non 237,8 W. Avant le correctif, pertes_generateur_ch_recup valait 414 kWh
 * au lieu de 555 kWh.
 *
 * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - §13.2.2
 */
describe('Qp0 selon le ventilateur de combustion - issue #35', () => {
  beforeEach(() => {
    set_bug_for_bug_compat();
  });

  test('qp0, pertes_generateur_ch_recup et conso_ch proches du DPE 2459E3195669T', () => {
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2459E3195669T');
    /** @type {FullDpe} */
    const output = calcul_3cl(structuredClone(input));

    const chaudiere = (dpe) =>
      [dpe.logement.installation_chauffage_collection.installation_chauffage]
        .flat()
        .flatMap((i) => [i.generateur_chauffage_collection.generateur_chauffage].flat())[0];
    const genIn = chaudiere(input);
    const genOut = chaudiere(output);
    expect(genOut.donnee_intermediaire.qp0).toBeCloseTo(genIn.donnee_intermediaire.qp0, 3);

    const abIn = input.logement.sortie.apport_et_besoin;
    const abOut = output.logement.sortie.apport_et_besoin;
    // bug for bug : le logiciel exporte la perte en kWh, Open3CL la conserve en Wh (écart < 0,1 %)
    expect(abOut.pertes_generateur_ch_recup / (abIn.pertes_generateur_ch_recup * 1000)).toBeCloseTo(
      1,
      2
    );
    // écart résiduel < 0,1 % (déperditions de l'enveloppe légèrement différentes)
    expect(
      output.logement.sortie.ef_conso.conso_ch / input.logement.sortie.ef_conso.conso_ch
    ).toBeCloseTo(1, 2);
  });
});
