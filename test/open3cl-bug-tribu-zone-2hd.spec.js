import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('Unit tests for bug tribu about dh19 value for 2hd zone', () => {
  test('besoin ch should be valid for dpe in zone 2hd after 2024', () => {
    /** @type {FullDpe} **/
    let input = getAdemeFileJson('2526E2511731F');
    const inputGenerateurChauffage =
      input.logement.installation_chauffage_collection.installation_chauffage[0];

    /** @type {FullDpe} **/
    let output = calcul_3cl(structuredClone(input));
    const outputGenerateurChauffage =
      output.logement.installation_chauffage_collection.installation_chauffage[0];

    expect(
      outputGenerateurChauffage.donnee_intermediaire.besoin_ch -
        inputGenerateurChauffage.donnee_intermediaire.besoin_ch
    ).toBeLessThan(150);
  });
});
