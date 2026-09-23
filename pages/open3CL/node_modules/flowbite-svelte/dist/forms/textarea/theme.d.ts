import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../../theme/themeUtils";
export type TextareaVariants = VariantProps<typeof textarea> & Classes<typeof textarea>;
export declare const textarea: import("tailwind-variants").TVReturnType<{
    wrapped: {
        false: {
            wrapper: string;
        };
    };
    hasHeader: {
        true: {
            header: string;
        };
        false: {
            inner: string;
        };
    };
    hasFooter: {
        true: {
            footer: string;
        };
        false: {
            inner: string;
        };
    };
}, {
    div: string;
    base: string;
    wrapper: string;
    inner: string;
    header: string;
    footer: string;
    addon: string;
    close: string;
    svg: string;
}, undefined, {
    wrapped: {
        false: {
            wrapper: string;
        };
    };
    hasHeader: {
        true: {
            header: string;
        };
        false: {
            inner: string;
        };
    };
    hasFooter: {
        true: {
            footer: string;
        };
        false: {
            inner: string;
        };
    };
}, {
    div: string;
    base: string;
    wrapper: string;
    inner: string;
    header: string;
    footer: string;
    addon: string;
    close: string;
    svg: string;
}, import("tailwind-variants").TVReturnType<{
    wrapped: {
        false: {
            wrapper: string;
        };
    };
    hasHeader: {
        true: {
            header: string;
        };
        false: {
            inner: string;
        };
    };
    hasFooter: {
        true: {
            footer: string;
        };
        false: {
            inner: string;
        };
    };
}, {
    div: string;
    base: string;
    wrapper: string;
    inner: string;
    header: string;
    footer: string;
    addon: string;
    close: string;
    svg: string;
}, undefined, unknown, unknown, undefined>>;
