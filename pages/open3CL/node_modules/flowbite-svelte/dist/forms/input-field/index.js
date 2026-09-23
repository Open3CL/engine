export { default as Input } from "./Input.svelte";
export { input } from "./theme";
export function clampSize(s) {
    return s && s === "xs" ? "sm" : s === "xl" ? "lg" : s;
}
