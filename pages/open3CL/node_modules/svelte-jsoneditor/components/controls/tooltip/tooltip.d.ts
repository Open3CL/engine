import type { SvelteComponent } from 'svelte';
import type { AbsolutePopupOptions } from '../../../types';
export interface TooltipOptions {
    text: string;
    openAbsolutePopup: (component: typeof SvelteComponent<Record<string, unknown>>, props: Record<string, unknown>, options: AbsolutePopupOptions) => number;
    closeAbsolutePopup: (popupId: number | undefined) => void;
}
export declare function tooltip(node: Element, { text, openAbsolutePopup, closeAbsolutePopup }: TooltipOptions): {
    destroy(): void;
};
