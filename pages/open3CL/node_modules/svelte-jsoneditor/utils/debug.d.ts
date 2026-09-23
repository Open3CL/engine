/**
 * Create a lightweight debug function to log output into the browser console.
 *
 * Inspired by https://github.com/visionmedia/debug (some code is copied below)
 *
 * Usage:
 *
 *     import { createDebug } from './debug.js'
 *
 *     const debug = createDebug('my:namespace')
 *
 *     debug('testing:', 2 + 2)
 *
 * By default, logging is only enabled when a property DEBUG is set in the
 * localStorage of your browser:
 *
 *     localStorage['debug'] = '*'
 *     localStorage['debug'] = 'jsoneditor:*'
 *     localStorage['debug'] = 'jsoneditor:TreeMode'
 *
 * The actual value of 'debug' is used to filter the debug messages.
 * The value can end with a '*' wild card to match any remaining text.
 *
 * By providing a value for `enabled`, you can choose conditions to
 * enable/disable debugging if you want, for example some flag determining
 * whether in development or production.
 */
export declare function createDebug(namespace: string, enabled?: boolean): (...args: unknown[]) => void;
