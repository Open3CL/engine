import type { Section } from '../types.js';
/**
 * Create sections that can be expanded.
 * Used to display a button like "Show items 100-200"
 */
export declare function getExpandItemsSections(startIndex: number, endIndex: number): Section[];
/**
 * Sort and merge a list with sections
 */
export declare function mergeSections(sections: Section[]): Section[];
export declare function inVisibleSection(sections: Section[], index: number): boolean;
export declare function nextRoundNumber(index: number): number;
export declare function currentRoundNumber(index: number): number;
