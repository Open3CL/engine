import { calcul_3cl } from '../src/engine.js';
import { getAdemeFileJsonOrDownload } from './test-helpers.js';
import { set_bug_for_bug_compat } from '../src/utils.js';
import { describe, expect, test } from 'vitest';

describe('Murs unit tests', () => {
  test('should rectify mur epaisseur for invalid value', async () => {
    set_bug_for_bug_compat();
    let input = await getAdemeFileJsonOrDownload('2593E3377930D');

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));

    expect(input.logement.enveloppe.mur_collection.mur[0].donnee_intermediaire.umur0).toBe(
      output.logement.enveloppe.mur_collection.mur[0].donnee_intermediaire.umur0
    );
  });
});
