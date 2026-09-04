import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DeperditionService } from './deperdition.service.js';
import { logger } from '../../../../core/util/logger/log-service.js';

/**
 * Tests unitaires isolés de la classe de base `DeperditionService`.
 *
 * Le `TvStore` est remplacé par un double de test (spies `vi.fn`) afin de
 * n'exercer que la logique de la classe (méthodes `b` et
 * `getEnumPeriodeIsolationId`), sans dépendre des tables de valeurs réelles.
 */

/** @type {{ getUVue: import('vitest').Mock, getB: import('vitest').Mock }} */
let tvStore;

/** @type {DeperditionService} */
let service;

describe('DeperditionService (classe de base des déperditions)', () => {
  beforeEach(() => {
    tvStore = {
      getUVue: vi.fn(),
      getB: vi.fn()
    };
    service = new DeperditionService(tvStore);
    vi.restoreAllMocks();
  });

  test('conserve la référence au tvStore injecté', () => {
    expect(service.tvStore).toBe(tvStore);
  });

  test('execute() lève une erreur (opération non supportée sur la classe de base)', () => {
    expect(() => service.execute({}, {})).toThrow('Unsupported operation');
  });

  describe('b() - coefficient de réduction des déperditions', () => {
    test('retourne 0 pour une adjacence sur AUE sans surface AUE renseignée', () => {
      const resultat = service.b({ enumTypeAdjacenceId: '8', surfaceAue: 0 });
      expect(resultat).toBe(0);
      expect(tvStore.getB).not.toHaveBeenCalled();
    });

    test('retourne 0 pour une adjacence sur AUE avec surface AUE indéfinie', () => {
      const resultat = service.b({ enumTypeAdjacenceId: '15' });
      expect(resultat).toBe(0);
    });

    test('local non chauffé non accessible (cfg isolation 1) : appel getB sans adjacence ni uVue', () => {
      tvStore.getB.mockReturnValue(0.95);

      const resultat = service.b({
        enumTypeAdjacenceId: '9',
        surfaceAue: 20,
        enumCfgIsolationLncId: '1'
      });

      expect(resultat).toBe(0.95);
      expect(tvStore.getUVue).not.toHaveBeenCalled();
      // enumTypeAdjacenceId remis à undefined, uVue et rAiuAue non calculés
      expect(tvStore.getB).toHaveBeenCalledWith(undefined, undefined, '1', undefined, undefined);
    });

    test('adjacence sur AUE avec surfaces : calcule uVue et le ratio rAiuAue', () => {
      tvStore.getUVue.mockReturnValue(2.5);
      tvStore.getB.mockReturnValue(0.8);

      const resultat = service.b({
        enumTypeAdjacenceId: '8',
        surfaceAue: 40,
        surfaceAiu: 20,
        enumCfgIsolationLncId: '2'
      });

      expect(resultat).toBe(0.8);
      expect(tvStore.getUVue).toHaveBeenCalledWith('8');
      expect(tvStore.getB).toHaveBeenCalledWith('8', 2.5, '2', 0.5, undefined);
    });

    test('adjacence sur AUE : uVue vaut 0 si le tvStore ne retourne pas de valeur', () => {
      tvStore.getUVue.mockReturnValue(undefined);
      tvStore.getB.mockReturnValue(0.9);

      service.b({
        enumTypeAdjacenceId: '12',
        surfaceAue: 10,
        surfaceAiu: 5,
        enumCfgIsolationLncId: '2'
      });

      expect(tvStore.getB).toHaveBeenCalledWith('12', 0, '2', 0.5, undefined);
    });

    test('espace tampon solarisé (adjacence 10) sans zone climatique : avertit et retourne undefined', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      const resultat = service.b({ enumTypeAdjacenceId: '10' });

      expect(resultat).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(tvStore.getB).not.toHaveBeenCalled();
    });

    test('espace tampon solarisé (adjacence 10) avec zone climatique : transmet la zone à getB', () => {
      tvStore.getB.mockReturnValue(0.7);

      const resultat = service.b({ enumTypeAdjacenceId: '10', zoneClimatique: 'h1a' });

      expect(resultat).toBe(0.7);
      expect(tvStore.getB).toHaveBeenCalledWith('10', undefined, undefined, undefined, 'h1a');
    });

    test('adjacence classique (hors listes) : délègue directement à getB', () => {
      tvStore.getB.mockReturnValue(1);

      const resultat = service.b({ enumTypeAdjacenceId: '1' });

      expect(resultat).toBe(1);
      expect(tvStore.getUVue).not.toHaveBeenCalled();
      expect(tvStore.getB).toHaveBeenCalledWith('1', undefined, undefined, undefined, undefined);
    });
  });

  describe('getEnumPeriodeIsolationId()', () => {
    test("retourne la période d'isolation si elle est fournie", () => {
      expect(service.getEnumPeriodeIsolationId('7', { enumPeriodeConstructionId: '1' })).toBe('7');
    });

    test("période d'isolation inconnue et construction ≤ 74 : retourne '3' (75-77)", () => {
      expect(service.getEnumPeriodeIsolationId(undefined, { enumPeriodeConstructionId: '2' })).toBe(
        '3'
      );
    });

    test("période d'isolation inconnue et construction récente : reprend la période de construction", () => {
      expect(service.getEnumPeriodeIsolationId(undefined, { enumPeriodeConstructionId: '8' })).toBe(
        '8'
      );
    });
  });
});
