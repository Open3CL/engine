import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ConsoFroidService } from './froid/conso-froid.service.js';
import { ConsoService } from './conso.service.js';

/** @type {ConsoService} **/
let service;

/** @type {ConsoFroidService} **/
let consoFroidService;

describe('Calcul des consos du logement', () => {
  beforeEach(() => {
    consoFroidService = new ConsoFroidService();
    service = new ConsoService(consoFroidService);
  });

  test('Determination des consommmations du logement', () => {
    vi.spyOn(consoFroidService, 'execute').mockReturnThis();

    /** @type {Contexte} */
    const ctx = { zoneClimatique: { id: 1 }, nadeq: 2.5 };
    /** @type { Logement } **/
    const logement = { enveloppe: {} };

    service.execute(ctx, logement);

    expect(consoFroidService.execute).toHaveBeenCalledWith(ctx, logement);
  });
});
