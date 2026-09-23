import { type ClassValue } from "clsx";
export { default as CloseButton } from "./CloseButton.svelte";
export { closeButton } from "./theme";
export { trapFocus } from "./actions";
export { default as Popper } from "./Popper.svelte";
export * from "./responsive.svelte";
export declare function cn(...inputs: ClassValue[]): string;
export declare function idGenerator(): string;
