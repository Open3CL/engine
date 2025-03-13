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

  describe('Lecture des valeurs de pertes_stockage', () => {
    test.each([
      {
        label: 'Ballon électrique à accumulation horizontal < 100L',
        enumTypeGenerateurEcsId: '68',
        volumeStockage: 50,
        expected: 0.39
      },
      {
        label: 'Ballon électrique à accumulation horizontal entre 100L et 200L',
        enumTypeGenerateurEcsId: '68',
        volumeStockage: 150,
        expected: 0.33
      },
      {
        label: 'Ballon électrique à accumulation horizontal entre 200L et 300L',
        enumTypeGenerateurEcsId: '68',
        volumeStockage: 250,
        expected: 0.3
      },
      {
        label: 'Ballon électrique à accumulation horizontal > 300L',
        enumTypeGenerateurEcsId: '68',
        volumeStockage: 301,
        expected: 0.3
      }
    ])(`$label`, ({ enumTypeGenerateurEcsId, volumeStockage, expected }) => {
      expect(ecsTvStore.getPertesStockage(enumTypeGenerateurEcsId, volumeStockage)).toBe(expected);
    });

    test('pas de valeur de pertes_stockage', () => {
      const pertes_stockage = ecsTvStore.getPertesStockage('298', 600);
      expect(pertes_stockage).toBeUndefined();
    });
  });

  test('ids des générateurs électriques ECS', () => {
    expect(ecsTvStore.getElectriqueEcsGenerateurs()).toStrictEqual([68, 118, 69, 70, 71]);
  });
});
