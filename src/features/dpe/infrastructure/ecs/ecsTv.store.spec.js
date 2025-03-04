import { beforeEach, describe, expect, test } from 'vitest';
import { EcsTvStore } from './ecsTv.store.js';

/** @type {EcsTvStore} **/
let ecsTvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    ecsTvStore = new EcsTvStore();
  });

  describe('Lecture des valeurs de tefs', () => {
    test.each([
      {
        label: 'température moyenne eau froide sanitaire en janvier sur zone h1a inférieure à 400m',
        classeAltitude: 'inférieur à 400m',
        zoneClimatique: 'h1a',
        mois: 'Janvier',
        expected: 7.8
      },
      {
        label:
          'température moyenne eau froide sanitaire en Décembre sur zone h3 inférieure entre 400-800m',
        classeAltitude: '400-800m',
        zoneClimatique: 'h3',
        mois: 'Décembre',
        expected: 10.1
      }
    ])(`$label`, ({ classeAltitude, zoneClimatique, mois, expected }) => {
      expect(ecsTvStore.getTefs(classeAltitude, zoneClimatique, mois)).toBe(expected);
    });
  });
});
