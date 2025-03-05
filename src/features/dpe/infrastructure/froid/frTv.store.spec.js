import { beforeEach, describe, expect, test } from 'vitest';
import { FrTvStore } from './frTv.store.js';

/** @type {FrTvStore} **/
let tvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    tvStore = new FrTvStore();
  });

  describe('lecture des valeurs par zone climatique et altitude', () => {
    test.each([
      {
        type: 'e',
        ilpa: 1,
        expected: 60.45
      },
      {
        type: 'e',
        ilpa: 0,
        expected: 84.66
      },
      {
        type: 'nref26',
        expected: 5.98
      },
      {
        type: 'nref28',
        expected: 1.14
      },
      {
        type: 'e_fr_26',
        expected: 5.98
      },
      {
        type: 'e_fr_28',
        expected: 1.14
      },
      {
        type: 'textmoy_clim_26',
        expected: 28.4
      },
      {
        type: 'textmoy_clim_28',
        expected: 28.4
      }
    ])(`type: $type, ilpa: $ilpa`, ({ type, ilpa = undefined, expected }) => {
      expect(tvStore.getData(type, '400-800m', 'h1a', 'Juin', ilpa)).toBe(expected);
    });
  });
});
