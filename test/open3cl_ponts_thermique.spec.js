import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJson } from './test-helpers.js';
import { describe, expect, test } from 'vitest';

describe('Ponts thermiques unit tests', () => {
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
});
