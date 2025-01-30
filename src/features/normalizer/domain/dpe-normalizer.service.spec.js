import { jest } from '@jest/globals';
import { Log } from '../../../core/util/logger/log-service.js';

/**
 * @type {Dpe}
 * */

describe('Normalisation des DPE', () => {
  beforeAll(() => {
    Log.debug = jest.fn();
    Log.warn = jest.fn();
    Log.error = jest.fn();
    Log.info = jest.fn();
  });
});
