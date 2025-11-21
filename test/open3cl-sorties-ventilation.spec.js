import { getAdemeFileJson, getAdemeFileJsonOrDownload } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { describe, expect, test, beforeEach } from 'vitest';
import { set_bug_for_bug_compat } from '../src/utils.js';

describe('calcul de déperdition par ventilation', () => {
  beforeEach(() => {
    set_bug_for_bug_compat();
  });

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

  test('q4paconv si 50% surface presence joint', async () => {
    const inputDpe = await getAdemeFileJsonOrDownload('2475E0480474U');

    const outputDpe = calcul_3cl(structuredClone(inputDpe));
    expect(
      inputDpe.logement.ventilation_collection.ventilation[0].donnee_intermediaire.q4pa_conv
    ).toBeCloseTo(
      outputDpe.logement.ventilation_collection.ventilation[0].donnee_intermediaire.q4pa_conv
    );
  });
});
