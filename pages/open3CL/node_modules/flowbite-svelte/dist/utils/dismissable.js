import { getContext, setContext } from "svelte";
const DISMISSABLE_KEY = Symbol("dismissable");
export function createDismissableContext(onDismiss) {
    const context = {
        dismiss: onDismiss
    };
    return setContext(DISMISSABLE_KEY, context);
}
export function useDismiss() {
    const context = getContext(DISMISSABLE_KEY);
    if (!context) {
        // uncomment below line if you want to trace usage without the context
        // console.warn('useDismiss must be used within a Dismissable component'); // For development purposes
    }
    return context;
}
