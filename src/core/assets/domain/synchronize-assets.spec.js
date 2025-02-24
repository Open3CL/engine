import { SynchronizeAssets } from './synchronize-assets.js';
import { SynchronizeEnumTables } from './synchronize-enum-tables.js';
import { SynchronizeValeurTables } from './synchronize-valeur-tables.js';
import { describe, expect, test, vi } from 'vitest';

describe('SynchronizeAssets unit tests', () => {
  test('should synchronize xlsx and ods files', () => {
    const synchronizeEnumTables = new SynchronizeEnumTables(null, null);
    const synchronizeValeurTables = new SynchronizeValeurTables(null, null, null);
    const synchronizeAssets = new SynchronizeAssets(synchronizeEnumTables, synchronizeValeurTables);

    vi.spyOn(console, 'log').mockReturnValue(null);
    vi.spyOn(synchronizeEnumTables, 'execute').mockResolvedValue({});
    vi.spyOn(synchronizeValeurTables, 'execute').mockResolvedValue({});

    return synchronizeAssets.execute().then(() => {
      expect(synchronizeEnumTables.execute).toHaveBeenCalled();
      expect(synchronizeValeurTables.execute).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });
  });

  test('should log errors if synchronization has failed', () => {
    const synchronizeEnumTables = new SynchronizeEnumTables(null, null);
    const synchronizeValeurTables = new SynchronizeValeurTables(null, null, null);
    const synchronizeAssets = new SynchronizeAssets(synchronizeEnumTables, synchronizeValeurTables);

    vi.spyOn(console, 'error').mockReturnValue(null);
    vi.spyOn(synchronizeEnumTables, 'execute').mockResolvedValue({});
    vi.spyOn(synchronizeValeurTables, 'execute').mockRejectedValue(null);

    return synchronizeAssets.execute().catch((error) => {
      expect(error).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
