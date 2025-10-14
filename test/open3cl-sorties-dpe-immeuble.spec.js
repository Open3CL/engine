import { describe, expect, test } from 'vitest';
import { getAdemeFileJson } from './test-helpers.js';
import { calcul_3cl } from '../src/index.js';
import { expect_or } from './utils.js';

describe('DPE immeuble unit tests', () => {
  test.each([
    '2292E0765245C',
    '2274E0581391C',
    '2473E4175012I',
    '2268E0739293A',
    '2259E1264915X',
    '2292E0764683M',
    '2293E1394343F',
    '2277E1006563Z',
    '2251E1368858K',
    '2231E1163584M',
    '2238E0520237Q',
    '2274E1403983G'
  ])(
    '9.8 - Installation de chauffage collectif avec base + appoint, dpe: %s with ratio: 5%',
    (dpe) => {
      const diffRatio = 5;

      /** @type {FullDpe} **/
      const input = getAdemeFileJson(dpe);

      /** @type {FullDpe} **/
      const output = calcul_3cl(structuredClone(input));

      const diffBch =
        (Math.abs(
          input.logement.sortie.apport_et_besoin.besoin_ch -
            output.logement.sortie.apport_et_besoin.besoin_ch
        ) /
          input.logement.sortie.apport_et_besoin.besoin_ch) *
        100;
      expect(diffBch).toBeLessThanOrEqual(diffRatio);

      output.logement.installation_chauffage_collection.installation_chauffage.forEach(
        (inst, index) => {
          const consoInput =
            input.logement.installation_chauffage_collection.installation_chauffage[index]
              .donnee_intermediaire.conso_ch;
          const consoOutput = inst.donnee_intermediaire.conso_ch;
          const instRatioDiff =
            consoInput > 0 ? (Math.abs(consoInput - consoOutput) / consoInput) * 100 : 0;
          expect(instRatioDiff).toBeLessThanOrEqual(diffRatio);

          inst.generateur_chauffage_collection.generateur_chauffage.forEach((gen, indexGen) => {
            const consoGenInput =
              input.logement.installation_chauffage_collection.installation_chauffage[index]
                .generateur_chauffage_collection.generateur_chauffage[indexGen].donnee_intermediaire
                .conso_ch;
            const consoGenOutput = gen.donnee_intermediaire.conso_ch;
            const ratioDiff =
              consoGenInput > 0
                ? (Math.abs(consoGenInput - consoGenOutput) / consoGenInput) * 100
                : 0;
            expect(ratioDiff).toBeLessThanOrEqual(diffRatio);
          });
        }
      );
    }
  );

  test.each([{ code: '2574E0561248M' }, { code: '2431E1275871H' }, { code: '2592E0472851H' }])(
    'perte distribution ecs recup dpe immeuble: $code',
    ({ code }) => {
      /** @type {FullDpe} **/
      let input = getAdemeFileJson(code);

      /** @type {FullDpe} **/
      let output = calcul_3cl(structuredClone(input));

      const inputEcsRecup = input.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup;
      const outputEcsRecup = output.logement.sortie.apport_et_besoin.pertes_distribution_ecs_recup;
      expect_or(
        () => expect(inputEcsRecup).toBeCloseTo(outputEcsRecup),
        () => expect(inputEcsRecup).toBeCloseTo(outputEcsRecup / 1000)
      );
    }
  );
});
