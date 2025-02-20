import { jest } from '@jest/globals';
import { Log } from './log-service.js';

describe('Log service unit tests', () => {
  let errorSpy, debugSpy, warnSpy, infoSpy;

  beforeEach(() => {
    process.env.LOG_LEVEL = null;
    errorSpy = jest.spyOn(console, 'error');
    debugSpy = jest.spyOn(console, 'debug');
    warnSpy = jest.spyOn(console, 'warn');
    infoSpy = jest.spyOn(console, 'info');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should write debug on console', () => {
    Log.debug('A debug message', { prop: 'value' });
    expect(debugSpy).toHaveBeenCalledWith('[DEBUG] A debug message', {
      prop: 'value'
    });

    Log.log('A log message', { prop: 'value' });
    expect(debugSpy).toHaveBeenCalledWith('[DEBUG] A log message', {
      prop: 'value'
    });
  });

  it('should write info on console', () => {
    Log.info('An info message', { prop: 'value' });
    expect(infoSpy).toHaveBeenCalledWith('[INFO] An info message', {
      prop: 'value'
    });
  });

  it('should write warn on console', () => {
    Log.warn('A warn message', { prop: 'value' });
    expect(warnSpy).toHaveBeenCalledWith('[WARN] A warn message', {
      prop: 'value'
    });
  });

  it('should write error on console', () => {
    Log.error('An error message', { prop: 'value' });
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] An error message', {
      prop: 'value'
    });
  });

  it('should write on console with correct log level : debug', () => {
    process.env.LOG_LEVEL = 'debug';

    Log.debug('A message');
    expect(debugSpy).toHaveBeenCalled();

    Log.info('A message');
    expect(infoSpy).toHaveBeenCalled();

    Log.warn('A message');
    expect(warnSpy).toHaveBeenCalled();

    Log.error('A message');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should write on console with correct log level : info', () => {
    process.env.LOG_LEVEL = 'info';

    Log.debug('A message');
    expect(debugSpy).not.toHaveBeenCalled();

    Log.info('A message');
    expect(infoSpy).toHaveBeenCalled();

    Log.warn('A message');
    expect(warnSpy).toHaveBeenCalled();

    Log.error('A message');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should write on console with correct log level : warn', () => {
    process.env.LOG_LEVEL = 'warn';

    Log.debug('A message');
    expect(debugSpy).not.toHaveBeenCalled();

    Log.info('A message');
    expect(infoSpy).not.toHaveBeenCalled();

    Log.warn('A message');
    expect(warnSpy).toHaveBeenCalled();

    Log.error('A message');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should write on console with correct log level : error', () => {
    process.env.LOG_LEVEL = 'error';

    Log.debug('A message');
    expect(debugSpy).not.toHaveBeenCalled();

    Log.info('A message');
    expect(infoSpy).not.toHaveBeenCalled();

    Log.warn('A message');
    expect(warnSpy).not.toHaveBeenCalled();

    Log.error('A message');
    expect(errorSpy).toHaveBeenCalled();
  });
});
