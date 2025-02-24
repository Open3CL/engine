import { TvsStore } from './tvs.store.js';
import { describe, expect, test } from 'vitest';

describe('TvsStore unit tests', () => {
  test('should get rendement distribution ch id', () => {
    const store = new TvsStore();

    expect(store.getRendementDistributionCh('41', '0')).toMatchObject({
      tv_rendement_distribution_ch_id: '2'
    });

    expect(store.getRendementDistributionCh('41', 0)).toMatchObject({
      tv_rendement_distribution_ch_id: '2'
    });

    expect(store.getRendementDistributionCh('41')).toMatchObject({
      tv_rendement_distribution_ch_id: '1'
    });

    expect(store.getRendementDistributionCh('15', 1)).toMatchObject({
      tv_rendement_distribution_ch_id: '8'
    });
    expect(store.getRendementDistributionCh('42')).toMatchObject({
      tv_rendement_distribution_ch_id: '12'
    });
  });

  test('should get rendement distribution ch by id', () => {
    const store = new TvsStore();

    expect(store.getRendementDistributionChById('10')).toMatchObject({
      tv_rendement_distribution_ch_id: '10'
    });
  });
});
