/**
 * Find a unique name. Suffix the name with ' (copy)', '(copy 2)', etc
 * until a unique name is found
 * @param name    Proposed name
 * @param keys    Array with existing keys
 */
export declare function findUniqueName(name: string, keys: string[]): string;
/**
 * Transform a text into lower case with the first character upper case
 */
export declare function toCapital(text: string): string;
export declare function compareStrings(a: string, b: string): -1 | 0 | 1;
/**
 * Duplicate a piece of text
 */
export declare function duplicateInText(text: string, anchorOffset: number, focusOffset: number): string;
/**
 * Truncate a text to a maximum length.
 * When truncated, the text will pe appended with ellipsis '...'
 * @param text Text to be truncated
 * @param maxLength Maximum allowed length for the text including ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Cast contents of a string to the correct type.
 * This can be a string, a number, a boolean, null, undefined, etc
 * @param str
 * @return parsed string
 */
export declare function parseString(str: string): string | number | boolean | null | undefined;
