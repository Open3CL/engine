/**
 * Svelte action that traps focus within a DOM node and handles Escape key
 * @param node - The DOM node to trap focus within
 * @param options - Optional configuration object
 * @returns An action object with destroy method
 */
export declare function trapFocus(node: HTMLElement, options?: {
    onEscape?: () => void;
    isClosing?: boolean;
} | null): {
    update(newOptions?: {
        onEscape?: () => void;
        isClosing?: boolean;
    } | null): void;
    destroy(): void;
};
