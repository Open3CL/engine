import { beforeEach, describe, expect, test } from 'vitest';
import { ChTvStore } from './chTv.store.js';

/** @type {ChTvStore} **/
let chTvStore;

describe('Lecture des tables de valeurs', () => {
  beforeEach(() => {
    chTvStore = new ChTvStore();
  });

  test('ids des générateurs de chauffage à combustion', () => {
    expect(chTvStore.getCombustionGenerateurs()).toStrictEqual([
      48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
      71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
      94, 95, 96, 97, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
      134, 135, 136, 137, 138, 139, 140, 141, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158,
      159, 160, 161
    ]);
  });

  test('ids des générateurs de chauffage pompe à chaleur', () => {
    expect(chTvStore.getPacGenerateurs()).toStrictEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 143, 145, 146, 147, 162,
      163, 164, 165, 166, 167, 168, 169, 170
    ]);
  });

  test('Caractéristique du générateur à combustion', () => {
    expect(chTvStore.getGenerateurCombustion('128', 125)).toStrictEqual({
      tv_generateur_combustion_id: '2',
      enum_type_generateur_ch_id: '86|128',
      enum_type_generateur_ecs_id: '46|93',
      type_generateur: 'Chaudière gaz  classique 1981-1985',
      pn: 'Pn',
      rpn: '84 + 2 logPn',
      rpint: '80 + 3 logPn',
      qp0_perc: '2%',
      pveil: '150'
    });

    expect(chTvStore.getGenerateurCombustion('84', 125)).toStrictEqual({
      tv_generateur_combustion_id: '26',
      enum_type_generateur_ch_id: '84',
      enum_type_generateur_ecs_id: '44',
      type_generateur: 'Chaudière fioul à condensation après 2015',
      critere_pn: '70<Pn<=400',
      pn: 'Pn',
      rpn: '94 + logPn',
      rpint: '100 + logPn',
      qp0_perc: '0.60%'
    });
  });

  describe('Lecture des valeurs de temp_fonc_30 ou temp_fonc_100', () => {
    test.each([
      {
        label:
          "Chaudière standard après 1990, emetteurs entre 1981 et 2000, basse température d'émission",
        pourcentageFonctionnement: 30,
        enumTypeGenerateurId: '89',
        enumTemperatureDistribution: 2,
        enumPeriodeEmetteurs: 2,
        expected: 45
      },
      {
        label: "Emetteurs entre 1981 et 2000, basse température d'émission",
        pourcentageFonctionnement: 100,
        enumTypeGenerateurId: '89',
        enumTemperatureDistribution: 2,
        enumPeriodeEmetteurs: 2,
        expected: 35
      }
    ])(
      `$label`,
      ({
        pourcentageFonctionnement,
        enumTypeGenerateurId,
        enumTemperatureDistribution,
        enumPeriodeEmetteurs,
        expected
      }) => {
        expect(
          chTvStore.temperatureFonctionnement(
            pourcentageFonctionnement,
            enumTypeGenerateurId,
            enumTemperatureDistribution,
            enumPeriodeEmetteurs
          )
        ).toBe(expected);
      }
    );

    test('pas de valeur de temp_fonc_30 ou temp_fonc_100', () => {
      const pertes_stockage = chTvStore.temperatureFonctionnement(100, 600, 600, 600);
      expect(pertes_stockage).toBeUndefined();
    });
  });
});
