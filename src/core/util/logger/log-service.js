import { createLogger, format, transports } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors, printf } = format;

/**
 * Formate une ligne de log. Si une pile (`stack`) est présente, elle est
 * ajoutée à la suite du message. Fonction pure exportée pour être testée
 * unitairement.
 * @param {{level: string, message: string, timestamp: string, stack?: string}} info
 * @return {string}
 */
export const formatLogLine = ({ level, message, timestamp, stack }) => {
  if (stack) {
    // print log trace
    return `${timestamp} ${level}: ${message} - ${stack}`;
  }
  return `${timestamp} ${level}: ${message}`;
};

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
    printf(formatLogLine)
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
