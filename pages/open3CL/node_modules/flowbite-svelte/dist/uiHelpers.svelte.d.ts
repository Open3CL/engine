export function uiHelpers(): {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    open: () => void;
};
export function clickOutside(element: any, callbackFunction: any): {
    update(newCallbackFunction: any): void;
    destroy(): void;
};
