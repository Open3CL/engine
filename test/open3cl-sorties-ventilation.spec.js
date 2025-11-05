import { getAdemeFileJson, getAdemeFileJsonOrDownload } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { describe, expect, test } from 'vitest';

describe('calcul de déperdition par ventilation', () => {
  test('Les surfaces de déperdition ne doivent pas prendre en compte les surfaces déperditives (b > 0)', () => {
    const inputDpe = getAdemeFileJson('2213E0696993Z');

    const deperdition = calcul_3cl(structuredClone(inputDpe)).logement.sortie.deperdition;
    expect(deperdition.hperm).toBe(5.21254089805847);
    expect(deperdition.hvent).toBe(58.352976000000005);
  });

  test('Conso vmc sf gaz', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2578E1899852K');

    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(inputDpe.logement.sortie.ep_conso.ep_conso_auxiliaire_ventilation).toBeCloseTo(
      outputDpe.logement.sortie.ep_conso.ep_conso_auxiliaire_ventilation
    );
  });
});
