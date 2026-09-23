import type { JSONPath } from 'immutable-json-patch';
export declare function traverse(json: unknown, callback: (value: unknown, path: JSONPath, json: unknown) => boolean | void): void;
