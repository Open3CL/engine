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
});
