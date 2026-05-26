import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';

/**
 * Non-regression test for https://github.com/Open3CL/engine/issues/150
 *
 * Pour l'ECS, il existe deux types de RCU, isolé ou non isolé, et dont dépend
 * le rendement de génération :
 *   - enum_type_generateur_ecs_id = 72 : "Réseau de chaleur non isolé" -> 0.75
 *   - enum_type_generateur_ecs_id = 73 : "Réseau de chaleur isolé"     -> 0.90
 *
 * Avant le correctif, le rendement_generation_stockage était fixé à 0.75 quel
 * que soit le type de RCU. Le DPE 2694E0480609U est celui mentionné dans le
 * ticket et contient un générateur ECS de type "Réseau de chaleur isolé" (73).
 */
describe('ECS RCU isolé / non isolé - issue #150', () => {
  test('rendement_generation_stockage doit être proche entre DPE entrée et DPE sortie pour 2694E0480609U', () => {
    /** @type {FullDpe} */
    const input = getAdemeFileJson('2694E0480609U');
    const output = calcul_3cl(structuredClone(input));

    expect(
      input.logement.installation_ecs_collection.installation_ecs[0].generateur_ecs_collection
        .generateur_ecs[0].donnee_intermediaire.rendement_generation_stockage
    ).toBe(
      output.logement.installation_ecs_collection.installation_ecs[0].generateur_ecs_collection
        .generateur_ecs[0].donnee_intermediaire.rendement_generation_stockage
    );
  });
});
