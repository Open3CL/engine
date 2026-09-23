/**
 * Create a readonly proxy around an object or array.
 *
 * Will throw an error when trying to mutate the object or array
 *
 * Inspired by: https://github.com/kourge/readonly-proxy/
 */
export declare function readonlyProxy(target: unknown): unknown;
