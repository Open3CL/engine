import { jest } from '@jest/globals';
import { Log } from '../../../core/util/logger/log-service.js';

describe('Application de la méthode 3CL', () => {
  beforeAll(() => {
    Log.debug = jest.fn();
    Log.warn = jest.fn();
    Log.error = jest.fn();
    Log.info = jest.fn();
  });

  xtest('test complet de calcul (validation ADEME?)', () => {
    // const dpe = EngineService.process(originalDpe);=
  });
});
