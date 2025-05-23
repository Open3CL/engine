import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

describe('DPE immeuble unit tests', () => {
  test('logement besoin ecs should be a ratio of the total besoin ecs', () => {
    /** @type {FullDpe} **/
    const input = getAdemeFileJson('2561E0059504D');

    /** @type {FullDpe} **/
    const output = calcul_3cl(structuredClone(input));

    expect(
      output.logement.installation_ecs_collection.installation_ecs[0].donnee_intermediaire
        .besoin_ecs
    ).toEqual(
      input.logement.installation_ecs_collection.installation_ecs[0].donnee_intermediaire.besoin_ecs
    );
  });
});
