import { FileStore } from '../../file/infrastructure/adapter/file.store.js';
import { ApplicationConfig } from '../../conf/infrastructure/application.config.js';
import { EnumTablesFixture } from '../../../../test/fixtures/core/assets/enum-tables.fixture.js';
import { SynchronizeEnumTables } from './synchronize-enum-tables.js';
import { describe, expect, test, vi } from 'vitest';

describe('SynchronizeEnumTables', () => {
  test('should download, parse and convert enum_tables.xlsx file', () => {
    const fileStore = new FileStore();
    const appConfig = new ApplicationConfig();
    const synchronizeEnumTables = new SynchronizeEnumTables(fileStore, appConfig);

    const enumTablesData = EnumTablesFixture.anEnumTableExample();
    vi.spyOn(ApplicationConfig.prototype, 'ademeEnumTablesFileUrl', 'get').mockReturnValue(
      'http://localhost/file.xlsx'
    );
    vi.spyOn(ApplicationConfig.prototype, 'assetsOutputFolder', 'get').mockReturnValue(
      'src/assets'
    );
    vi.spyOn(fileStore, 'downloadXlsxFileAndConvertToJson').mockResolvedValue(enumTablesData);
    vi.spyOn(fileStore, 'writeFileToLocalSystem').mockResolvedValue(null);

    return synchronizeEnumTables.execute().then(() => {
      expect(fileStore.downloadXlsxFileAndConvertToJson).toHaveBeenCalled();
      expect(fileStore.writeFileToLocalSystem).toHaveBeenCalledWith(
        'src/assets/enums.js',
        expect.any(String)
      );
    });
  });
});
