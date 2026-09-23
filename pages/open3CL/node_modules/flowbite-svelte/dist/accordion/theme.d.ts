import type { Classes } from "../theme/themeUtils";
import { type VariantProps } from "tailwind-variants";
export type AccordionVariants = VariantProps<typeof accordion>;
export type AccordionItemVariants = VariantProps<typeof accordionItem> & Classes<typeof accordionItem>;
export declare const accordion: import("tailwind-variants").TVReturnType<{
    color: {
        primary: string;
        secondary: string;
    };
    flush: {
        true: string;
        false: string;
    };
}, undefined, "w-full", {
    color: {
        primary: string;
        secondary: string;
    };
    flush: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    color: {
        primary: string;
        secondary: string;
    };
    flush: {
        true: string;
        false: string;
    };
}, undefined, "w-full", unknown, unknown, undefined>>;
export declare const accordionItem: import("tailwind-variants").TVReturnType<{
    flush: {
        true: {
            button: string;
            content: string;
        };
        false: {
            button: string;
            content: string;
        };
    };
    open: {
        true: {};
        false: {};
    };
}, {
    base: string;
    button: string;
    content: string;
    active: string;
    inactive: string;
}, undefined, {
    flush: {
        true: {
            button: string;
            content: string;
        };
        false: {
            button: string;
            content: string;
        };
    };
    open: {
        true: {};
        false: {};
    };
}, {
    base: string;
    button: string;
    content: string;
    active: string;
    inactive: string;
}, import("tailwind-variants").TVReturnType<{
    flush: {
        true: {
            button: string;
            content: string;
        };
        false: {
            button: string;
            content: string;
        };
    };
    open: {
        true: {};
        false: {};
    };
}, {
    base: string;
    button: string;
    content: string;
    active: string;
    inactive: string;
}, undefined, unknown, unknown, undefined>>;
