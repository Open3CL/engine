/**
 * Log service
 * Override standard console with log level configuration
 *
 * Define LOG_LEVEL with maximum level you want to log into console
 * possible values are : debug, trace, info, warn, error
 */
export class Log {
  /**
   * @type {string[]}
   */
  static levelOrder = ['debug', 'info', 'warn', 'error'];

  /**
   * @param message {string} Log message
   * @param detail {any|undefined} Log detail
   */
  static debug(message, detail = undefined) {
    if (Log.isLogged('debug')) {
      const msg = `[DEBUG] ${message}`;
      detail ? console.debug(msg, detail) : console.debug(msg);
    }
  }

  /**
   * @param message {string} Log message
   * @param detail {any|undefined} Log detail
   */
  static log(message, detail = undefined) {
    if (Log.isLogged('debug')) {
      Log.debug(message, detail);
    }
  }

  /**
   * @param message {string} Log message
   * @param detail {any|undefined} Log detail
   */
  static info(message, detail = undefined) {
    if (Log.isLogged('info')) {
      const msg = `[INFO] ${message}`;
      detail ? console.info(msg, detail) : console.info(msg);
    }
  }

  /**
   * @param message {string} Log message
   * @param detail {any|undefined} Log detail
   */
  static warn(message, detail = undefined) {
    if (Log.isLogged('warn')) {
      const msg = `[WARN] ${message}`;
      detail ? console.warn(msg, detail) : console.warn(msg);
    }
  }

  /**
   * @param message {string} Log message
   * @param detail {any|undefined} Log detail
   */
  static error(message, detail = undefined) {
    if (Log.isLogged('error')) {
      const msg = `[ERROR] ${message}`;
      detail ? console.error(msg, detail) : console.error(msg);
    }
  }

  /**
   * @param level {string} Log level
   * @return true if this level should be logged
   */
  static isLogged(level) {
    return (
      !process.env.LOG_LEVEL ||
      Log.levelOrder.indexOf(process.env.LOG_LEVEL) <= Log.levelOrder.indexOf(level)
    );
  }
}
