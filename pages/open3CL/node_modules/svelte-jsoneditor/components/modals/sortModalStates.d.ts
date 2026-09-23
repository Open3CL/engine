import type { NumberOption, PathOption } from '../../types.js';
export interface SortModalState {
    selectedProperty: PathOption;
    selectedDirection: NumberOption;
}
export declare const sortModalStates: Record<string, SortModalState>;
