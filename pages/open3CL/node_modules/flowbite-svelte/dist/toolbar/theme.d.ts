import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type ToolbarVariants = VariantProps<typeof toolbar> & Classes<typeof toolbar>;
export type ToolbarGroupVariants = VariantProps<typeof toolbarGroup>;
export declare const toolbar: import("tailwind-variants").TVReturnType<{
    embedded: {
        true: {};
        false: {
            base: string;
        };
    };
    color: {
        default: {
            base: string;
            content: string;
        };
        primary: {
            base: string;
            content: string;
        };
        secondary: {
            base: string;
            content: string;
        };
        gray: {
            base: string;
            content: string;
        };
        red: {
            base: string;
            content: string;
        };
        yellow: {
            base: string;
            content: string;
        };
        green: {
            base: string;
            content: string;
        };
        indigo: {
            base: string;
            content: string;
        };
        purple: {
            base: string;
            content: string;
        };
        pink: {
            base: string;
            content: string;
        };
        blue: {
            base: string;
            content: string;
        };
        dark: {
            base: string;
            content: string;
        };
    };
    separators: {
        true: {
            content: string;
        };
    };
}, {
    base: string;
    content: string;
}, undefined, {
    embedded: {
        true: {};
        false: {
            base: string;
        };
    };
    color: {
        default: {
            base: string;
            content: string;
        };
        primary: {
            base: string;
            content: string;
        };
        secondary: {
            base: string;
            content: string;
        };
        gray: {
            base: string;
            content: string;
        };
        red: {
            base: string;
            content: string;
        };
        yellow: {
            base: string;
            content: string;
        };
        green: {
            base: string;
            content: string;
        };
        indigo: {
            base: string;
            content: string;
        };
        purple: {
            base: string;
            content: string;
        };
        pink: {
            base: string;
            content: string;
        };
        blue: {
            base: string;
            content: string;
        };
        dark: {
            base: string;
            content: string;
        };
    };
    separators: {
        true: {
            content: string;
        };
    };
}, {
    base: string;
    content: string;
}, import("tailwind-variants").TVReturnType<{
    embedded: {
        true: {};
        false: {
            base: string;
        };
    };
    color: {
        default: {
            base: string;
            content: string;
        };
        primary: {
            base: string;
            content: string;
        };
        secondary: {
            base: string;
            content: string;
        };
        gray: {
            base: string;
            content: string;
        };
        red: {
            base: string;
            content: string;
        };
        yellow: {
            base: string;
            content: string;
        };
        green: {
            base: string;
            content: string;
        };
        indigo: {
            base: string;
            content: string;
        };
        purple: {
            base: string;
            content: string;
        };
        pink: {
            base: string;
            content: string;
        };
        blue: {
            base: string;
            content: string;
        };
        dark: {
            base: string;
            content: string;
        };
    };
    separators: {
        true: {
            content: string;
        };
    };
}, {
    base: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
export declare const toolbarGroup: import("tailwind-variants").TVReturnType<{
    spacing: {
        default: string;
        tight: string;
        loose: string;
    };
    padding: {
        default: string;
        none: string;
    };
    position: {
        middle: string;
        first: string;
        last: string;
    };
}, undefined, "flex items-center", {
    spacing: {
        default: string;
        tight: string;
        loose: string;
    };
    padding: {
        default: string;
        none: string;
    };
    position: {
        middle: string;
        first: string;
        last: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    spacing: {
        default: string;
        tight: string;
        loose: string;
    };
    padding: {
        default: string;
        none: string;
    };
    position: {
        middle: string;
        first: string;
        last: string;
    };
}, undefined, "flex items-center", unknown, unknown, undefined>>;
export type ToolbarButtonVariants = VariantProps<typeof toolbarButton>;
export declare const toolbarButton: import("tailwind-variants").TVReturnType<{
    color: {
        dark: string;
        gray: string;
        red: string;
        yellow: string;
        green: string;
        indigo: string;
        purple: string;
        pink: string;
        blue: string;
        primary: string;
        default: string;
    };
    size: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
    };
    background: {
        true: string;
        false: string;
    };
}, undefined, "focus:outline-hidden whitespace-normal", {
    color: {
        dark: string;
        gray: string;
        red: string;
        yellow: string;
        green: string;
        indigo: string;
        purple: string;
        pink: string;
        blue: string;
        primary: string;
        default: string;
    };
    size: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
    };
    background: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    color: {
        dark: string;
        gray: string;
        red: string;
        yellow: string;
        green: string;
        indigo: string;
        purple: string;
        pink: string;
        blue: string;
        primary: string;
        default: string;
    };
    size: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
    };
    background: {
        true: string;
        false: string;
    };
}, undefined, "focus:outline-hidden whitespace-normal", unknown, unknown, undefined>>;
