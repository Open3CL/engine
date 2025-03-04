import { beforeEach, describe, expect, test } from 'vitest';
import { PontThermiqueTvStore } from './pontThermiqueTv.store.js';

/** @type {PontThermiqueTvStore} **/
let tvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    tvStore = new PontThermiqueTvStore();
  });

  describe('lecture des valeurs de k', () => {
    test.each([
      {
        label: 'tv_pont_thermique_id existant',
        tvPontThermiqueId: 1,
        expected: 0.39
      },
      {
        label: 'tv_pont_thermique_id inexistant',
        tvPontThermiqueId: 0,
        expected: 0
      }
    ])(
      `k via tv_pont_thermique_id pour un pont thermique avec $label`,
      ({ tvPontThermiqueId, expected }) => {
        expect(tvStore.getKForMurById(tvPontThermiqueId)).toBe(expected);
      }
    );

    test.each([
      {
        label: 'enum_type_liaison_id et isolation_mur qui correspondent',
        enumTypeLiaisonId: 1,
        isolationMur: 'Non isolé',
        expected: 0.39
      },
      {
        label: 'enum_type_liaison_id et isolation_mur qui ne correspondent à aucune entrée',
        enumTypeLiaisonId: 0,
        isolationMur: '',
        expected: undefined
      }
    ])(`k pour un pont thermique via $label`, ({ enumTypeLiaisonId, isolationMur, expected }) => {
      expect(tvStore.getKForMur(enumTypeLiaisonId, isolationMur)).toBe(expected);
    });

    test.each([
      {
        label: 'enum_type_liaison_id, isolation_mur et isolationPlancher qui correspondent',
        enumTypeLiaisonId: 1,
        isolationMur: 'Non isolé',
        isolationPlancher: 'iti',
        expected: 0.47
      },
      {
        label: 'enum_type_liaison_id et isolation_mur qui ne correspondent à aucune entrée',
        enumTypeLiaisonId: 0,
        isolationMur: 'Non isolé',
        isolationPlancher: 'iti',
        expected: undefined
      }
    ])(
      `k pour un pont thermique via $label`,
      ({ enumTypeLiaisonId, isolationMur, isolationPlancher, expected }) => {
        expect(tvStore.getKForPlancher(enumTypeLiaisonId, isolationMur, isolationPlancher)).toBe(
          expected
        );
      }
    );
  });

  test.each([
    {
      label:
        'enum_type_liaison_id, isolation_mur, typePose, largeurDormant, sans largeurDormant et presenceRetourIsolation qui correspondent',
      enumTypeLiaisonId: 5,
      isolationMur: 'Non isolé',
      typePose: 1,
      presenceRetourIsolation: undefined,
      largeurDormant: undefined,
      expected: 0.43
    },
    {
      label:
        'enum_type_liaison_id, isolation_mur, typePose, largeurDormant, sans presenceRetourIsolation qui correspondent',
      enumTypeLiaisonId: 5,
      isolationMur: 'Non isolé',
      typePose: 1,
      presenceRetourIsolation: undefined,
      largeurDormant: 5,
      expected: 0.43
    },
    {
      label:
        'enum_type_liaison_id, isolation_mur, typePose, largeurDormant, presenceRetourIsolation qui correspondent',
      enumTypeLiaisonId: 5,
      isolationMur: 'iti',
      typePose: 3,
      presenceRetourIsolation: 1,
      largeurDormant: 10,
      expected: 0.13
    },
    {
      label: 'enum_type_liaison_id et isolation_mur qui ne correspondent à aucune entrée',
      enumTypeLiaisonId: 5,
      isolationMur: 'undefined',
      typePose: 1,
      presenceRetourIsolation: '1',
      largeurDormant: 5,
      expected: undefined
    }
  ])(
    `k pour un pont thermique via $label`,
    ({
      enumTypeLiaisonId,
      isolationMur,
      typePose,
      presenceRetourIsolation,
      largeurDormant,
      expected
    }) => {
      expect(
        tvStore.getKForMenuiserie(
          enumTypeLiaisonId,
          isolationMur,
          typePose,
          presenceRetourIsolation,
          largeurDormant
        )
      ).toBe(expected);
    }
  );
});
