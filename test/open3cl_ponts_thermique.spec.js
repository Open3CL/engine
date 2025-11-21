import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJson, getAdemeFileJsonOrDownload } from './test-helpers.js';
import { describe, expect, test, beforeEach } from 'vitest';
import { set_bug_for_bug_compat } from '../src/utils.js';

describe('Ponts thermiques unit tests', () => {
  beforeEach(() => {
    set_bug_for_bug_compat();
  });

  test('should calculate deperdition if k_saisi=0', () => {
    let input = getAdemeFileJson('2569E3101728B');
    const inputPt =
      input.logement.enveloppe.pont_thermique_collection.pont_thermique[2].donnee_intermediaire.k;

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));
    const outputPt =
      output.logement.enveloppe.pont_thermique_collection.pont_thermique[2].donnee_intermediaire.k;

    expect(inputPt).toEqual(outputPt);
    expect(input.logement.sortie.deperdition.deperdition_pont_thermique).toBeCloseTo(
      output.logement.sortie.deperdition.deperdition_pont_thermique
    );
  });

  test('should find reference pont thermique/mur', async () => {
    let input = await getAdemeFileJsonOrDownload('2321E3872263C');

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));
    input.logement.enveloppe.pont_thermique_collection.pont_thermique.forEach((ptInput, index) => {
      expect(ptInput.donnee_intermediaire.k).toBeCloseTo(
        output.logement.enveloppe.pont_thermique_collection.pont_thermique[index]
          .donnee_intermediaire.k
      );
      expect(ptInput.donnee_entree.tv_pont_thermique_id).toBeCloseTo(
        output.logement.enveloppe.pont_thermique_collection.pont_thermique[index].donnee_entree
          .tv_pont_thermique_id
      );
    });
  });
});
