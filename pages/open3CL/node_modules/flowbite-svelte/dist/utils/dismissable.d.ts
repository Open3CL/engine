/**
 * DismissableContext provides a way to dismiss a component or modal.
 * It should be used within a component that needs to provide dismiss functionality.
 */
export type DismissableContext = {
    dismiss: (event: MouseEvent) => void;
};
export declare function createDismissableContext(onDismiss: (event: MouseEvent) => void): DismissableContext;
export declare function useDismiss(): DismissableContext;
