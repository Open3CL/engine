import { afterEach, describe, expect, test } from 'vitest';
import { logger, setLoggerOff, setLoggerOn } from './log-service.js';

/**
 * Sauvegarde des méthodes console d'origine : `setLoggerOff`/`setLoggerOn`
 * réaffectent les globales `console.*`, on restaure après chaque test pour
 * garantir l'isolation.
 */
const consoleOrigine = {
  log: console.log,
  warn: console.warn,
  debug: console.debug,
  error: console.error
};

describe('Service de logs (log-service)', () => {
  afterEach(() => {
    console.log = consoleOrigine.log;
    console.warn = consoleOrigine.warn;
    console.debug = consoleOrigine.debug;
    console.error = consoleOrigine.error;
    logger.silent = false;
  });

  test('expose un logger winston avec les méthodes de niveau usuelles', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(logger.level).toBe('info');
  });

  test('setLoggerOff rend le logger silencieux et neutralise log/warn/debug', () => {
    setLoggerOff();

    expect(logger.silent).toBe(true);
    expect(console.log).not.toBe(consoleOrigine.log);
    expect(console.warn).not.toBe(consoleOrigine.warn);
    expect(console.debug).not.toBe(consoleOrigine.debug);
    // Par défaut, console.error n'est pas neutralisé
    expect(console.error).toBe(consoleOrigine.error);
  });

  test('setLoggerOff(true) neutralise aussi console.error', () => {
    setLoggerOff(true);

    expect(console.error).not.toBe(consoleOrigine.error);
  });

  test('setLoggerOn réactive le logger et restaure les méthodes console', () => {
    setLoggerOff(true);
    setLoggerOn(true);

    expect(logger.silent).toBe(false);
    expect(console.log).toBe(consoleOrigine.log);
    expect(console.warn).toBe(consoleOrigine.warn);
    expect(console.debug).toBe(consoleOrigine.debug);
    expect(console.error).toBe(consoleOrigine.error);
  });

  test('les méthodes console neutralisées sont des fonctions no-op', () => {
    setLoggerOff();

    expect(() => console.log('ignoré')).not.toThrow();
    expect(console.log('ignoré')).toBeUndefined();
  });
});
