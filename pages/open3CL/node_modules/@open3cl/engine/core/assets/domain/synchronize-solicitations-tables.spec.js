import { FileStore } from '../../file/infrastructure/adapter/file.store.js';
import { ApplicationConfig } from '../../conf/infrastructure/application.config.js';
import { SynchronizeSolicitationsTables } from './synchronize-solicitations-tables.js';
import { SolicitationsTablesFixture } from '../../../../test/fixtures/core/assets/solicitations-tables.fixture.js';
import { describe, expect, test, vi } from 'vitest';

describe('SynchronizeSolicitationsTables unit tests', () => {
  test('should read and parse 18.2_sollicitations_ext.ods file', () => {
    const fileStore = new FileStore();
    const appConfig = new ApplicationConfig();
    const synchronizeSolicitationsTables = new SynchronizeSolicitationsTables(fileStore, appConfig);

    const solicitationsData = SolicitationsTablesFixture.aSolicitationExample();
    vi.spyOn(fileStore, 'readLocalOdsFileAndConvertToJson').mockResolvedValue(solicitationsData);
    vi.spyOn(ApplicationConfig.prototype, 'solicitationsExtFilePath', 'get').mockReturnValue(
      'src/file.ods'
    );

    return synchronizeSolicitationsTables.execute().then((output) => {
      expect(fileStore.readLocalOdsFileAndConvertToJson).toHaveBeenCalled();
      expect(output).toMatchObject({
        e: {
          0: {
            'inférieur à 400m': {
              Janvier: {
                h1a: 38.36
              },
              Février: {
                h1a: 37.47
              }
            }
          }
        },
        e_fr_26: {
          'inférieur à 400m': {
            Janvier: {
              h1a: 0
            },
            Février: {
              h1a: 0
            }
          }
        }
      });
    });
  });
});
