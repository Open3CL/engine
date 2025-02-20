import { createLogger, format, transports } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors, printf } = format;

// Disable traditional console logs
const copyLog = console.log;
const copyWarn = console.warn;
const copyDebug = console.debug;
const copyError = console.error;

export const logger = createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }),
    colorize(),
    timestamp(),
    prettyPrint(),
    printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        // print log trace
        return `${timestamp} ${level}: ${message} - ${stack}`;
      }
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()]
});

export const setLoggerOff = (ignoreErrors = false) => {
  logger.silent = true;
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
  if (ignoreErrors) {
    console.error = () => {};
  }
};

export const setLoggerOn = (errorsIgnored = false) => {
  logger.silent = false;
  console.log = copyLog;
  console.warn = copyWarn;
  console.debug = copyDebug;
  if (errorsIgnored) {
    console.error = copyError;
  }
};
