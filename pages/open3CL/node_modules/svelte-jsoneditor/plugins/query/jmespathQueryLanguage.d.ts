import type { JSONPath } from 'immutable-json-patch';
import type { QueryLanguage } from '../../types';
export declare const jmespathQueryLanguage: QueryLanguage;
export declare function stringifyPathForJmespath(path: JSONPath): string;
