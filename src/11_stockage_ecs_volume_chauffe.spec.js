import { describe, expect, test } from 'vitest';
import { isStockageEcsVolumeChauffe } from './11_stockage_ecs_volume_chauffe.js';

describe('isStockageEcsVolumeChauffe - stockage ECS en volume chauffé (#293)', () => {
  /**
   * Tribu : installation_ECS.Is_volume_chauffee (Calcul_batiment.cs l.375-377), lue dans l'export
   * par position_volume_chauffe_stockage, puis tv_rendement_distribution_ecs_id, puis
   * position_volume_chauffe.
   */
  test.each([
    // [position stockage, rendement distribution, position générateur, attendu]
    [1, '3', 0, true], // stockage renseigné prioritaire (oui)
    [0, '1', 1, false], // stockage renseigné prioritaire (non)
    ['1', undefined, 0, true], // valeur texte acceptée
    [undefined, '1', 0, true], // production en volume habitable
    [undefined, 2, 0, true], // production en volume habitable, pièces non contiguës
    [undefined, '3', 1, false], // production hors volume habitable
    [undefined, '4', 0, false], // ligne collective : repli sur la position du générateur
    [undefined, undefined, 1, true], // repli : générateur en volume chauffé
    [undefined, undefined, 0, false], // repli : générateur hors volume chauffé
    [undefined, undefined, undefined, true], // aucune information : récupération conservée
    [null, null, 0, false] // champs nuls traités comme absents
  ])('stockage %s, rd %s, générateur %s => %s', (pvcs, rd, pvc, attendu) => {
    expect(
      isStockageEcsVolumeChauffe(
        { position_volume_chauffe_stockage: pvcs, position_volume_chauffe: pvc },
        { tv_rendement_distribution_ecs_id: rd }
      )
    ).toBe(attendu);
  });

  test('installation absente : repli sur la position du générateur', () => {
    expect(isStockageEcsVolumeChauffe({ position_volume_chauffe: 0 }, undefined)).toBe(false);
  });
});
