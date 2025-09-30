import { SynchronizeValeurTables } from './synchronize-valeur-tables.js';
import { FileStore } from '../../file/infrastructure/adapter/file.store.js';
import { ApplicationConfig } from '../../conf/infrastructure/application.config.js';
import { SynchronizeC1Tables } from './synchronize-c1-tables.js';
import { SynchronizeSolicitationsTables } from './synchronize-solicitations-tables.js';
import { ValeurTablesFixture } from '../../../../test/fixtures/core/assets/valeur-tables.fixture.js';
import { SynchronizeDpeGesLimitValuesTables } from './synchronize-dpe-ges-limit-values-tables.js';
import { AddTvAdditionalValuesTables } from './add-tv-additional-values-tables.js';
import { describe, expect, test, vi } from 'vitest';

describe('SynchronizeValeurTables unit tests', () => {
  test('should download, parse and convert valeur_tables.xlsx file', () => {
    const fileStore = new FileStore();
    const appConfig = new ApplicationConfig();
    const synchronizeC1Tables = new SynchronizeC1Tables(fileStore, appConfig);
    const synchronizeSolicitationTables = new SynchronizeSolicitationsTables(fileStore, appConfig);
    const synchronizeDpeGesLimitValuesTables = new SynchronizeDpeGesLimitValuesTables(
      fileStore,
      appConfig
    );
    const addAdditionnalUeValuesTables = new AddTvAdditionalValuesTables(fileStore, appConfig);
    const synchronizeValeurTables = new SynchronizeValeurTables(
      fileStore,
      appConfig,
      synchronizeSolicitationTables,
      synchronizeDpeGesLimitValuesTables,
      addAdditionnalUeValuesTables,
      synchronizeC1Tables
    );

    const valeurTablesData = ValeurTablesFixture.aValeurTableExample();
    vi.spyOn(ApplicationConfig.prototype, 'ademeValeurTablesFileUrl', 'get').mockReturnValue(
      'http://localhost/file.xlsx'
    );
    vi.spyOn(ApplicationConfig.prototype, 'assetsOutputFolder', 'get').mockReturnValue(
      'src/assets'
    );

    vi.spyOn(fileStore, 'downloadXlsxFileAndConvertToJson').mockResolvedValue(valeurTablesData);
    vi.spyOn(fileStore, 'writeFileToLocalSystem').mockResolvedValue(null);
    vi.spyOn(synchronizeC1Tables, 'execute').mockResolvedValue({});
    vi.spyOn(synchronizeSolicitationTables, 'execute').mockResolvedValue({});
    vi.spyOn(synchronizeDpeGesLimitValuesTables, 'execute').mockResolvedValue({});
    vi.spyOn(addAdditionnalUeValuesTables, 'execute').mockResolvedValue({});

    return synchronizeValeurTables.execute().then(() => {
      expect(fileStore.downloadXlsxFileAndConvertToJson).toHaveBeenCalled();
      expect(fileStore.writeFileToLocalSystem).toHaveBeenCalledWith(
        'src/assets/tv.js',
        expect.any(String)
      );
    });
  });
});
