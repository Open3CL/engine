import type { QueryLanguageOptions } from '../../types.js';
export interface TransformModalState {
    queryLanguageId: string;
    queryOptions: QueryLanguageOptions;
    query: string;
    isManual: boolean;
}
export declare const transformModalStates: Record<string, TransformModalState>;
export interface TransformModalStateShared {
    showWizard: boolean;
    showOriginal: boolean;
}
export declare const transformModalStateShared: TransformModalStateShared;
