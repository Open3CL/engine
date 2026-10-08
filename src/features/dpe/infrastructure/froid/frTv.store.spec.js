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
        // Nref (26°C) 400-800m, H1a, Juin (et non la valeur E_fr de 5.98)
        expected: 19
      },
      {
        type: 'nref28',
        // Nref (28°C) 400-800m, H1a, Juin (et non la valeur E_fr de 1.14)
        expected: 4
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

  /**
   * Nombre d’heures de refroidissement Nref entre 400 m et 800 m d’altitude
   * @see : Methode_de_calcul_3CL_DPE_2021-338.pdf - Annexe 18.2.2 (tableaux Nref (26°C) et Nref (28°C))
   */
  describe('lecture des heures de refroidissement Nref entre 400m et 800m', () => {
    const zones = ['h1a', 'h1b', 'h1c', 'h2a', 'h2b', 'h2c', 'h2d', 'h3'];

    test.each([
      { type: 'nref26', mois: 'Mai', expected: [0, 5, 8, 0, 6, 6, 9, 20] },
      { type: 'nref26', mois: 'Juillet', expected: [33, 90, 88, 42, 27, 92, 238, 206] },
      { type: 'nref26', mois: 'Octobre', expected: [0, 0, 0, 0, 8, 11, 0, 0] },
      { type: 'nref28', mois: 'Mai', expected: [0, 0, 5, 0, 0, 2, 0, 4] },
      { type: 'nref28', mois: 'Juillet', expected: [14, 37, 46, 14, 17, 46, 170, 105] },
      { type: 'nref28', mois: 'Octobre', expected: [0, 0, 0, 0, 8, 11, 0, 0] }
    ])('valeurs de la méthode : $type, $mois', ({ type, mois, expected }) => {
      expect(zones.map((zone) => tvStore.getData(type, '400-800m', zone, mois))).toStrictEqual(
        expected
      );
    });

    test.each(['Janvier', 'Février', 'Mars', 'Avril', 'Novembre', 'Décembre'])(
      'aucune heure de refroidissement en %s',
      (mois) => {
        for (const zone of zones) {
          expect(tvStore.getData('nref26', '400-800m', zone, mois)).toBe(0);
          expect(tvStore.getData('nref28', '400-800m', zone, mois)).toBe(0);
        }
      }
    );

    test('les heures Nref ne reprennent pas les valeurs d’ensoleillement E_fr', () => {
      for (const zone of zones) {
        expect(tvStore.getData('nref26', '400-800m', zone, 'Juillet')).not.toBe(
          tvStore.getData('e_fr_26', '400-800m', zone, 'Juillet')
        );
        expect(tvStore.getData('nref28', '400-800m', zone, 'Juillet')).not.toBe(
          tvStore.getData('e_fr_28', '400-800m', zone, 'Juillet')
        );
      }
    });

    test('à 28°C le nombre d’heures de refroidissement ne dépasse pas celui à 26°C', () => {
      for (const mois of ['Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre']) {
        for (const zone of zones) {
          expect(tvStore.getData('nref28', '400-800m', zone, mois)).toBeLessThanOrEqual(
            tvStore.getData('nref26', '400-800m', zone, mois)
          );
        }
      }
    });
  });

  describe('Lecture des valeurs de coefficient d’efficience énergétique eer', () => {
    test.each([
      {
        zoneClimatiqueId: '2',
        periodeInstallationId: 1,
        expected: 3.6
      },
      {
        zoneClimatiqueId: '8',
        periodeInstallationId: 2,
        expected: 5.415
      }
    ])(`type: $type, ilpa: $ilpa`, ({ zoneClimatiqueId, periodeInstallationId, expected }) => {
      expect(tvStore.getEer(zoneClimatiqueId, periodeInstallationId)).toBe(expected);
    });

    test('pas de valeur de eer', () => {
      const eer = tvStore.getEer('8', 8);
      expect(eer).toBeUndefined();
    });
  });
});
