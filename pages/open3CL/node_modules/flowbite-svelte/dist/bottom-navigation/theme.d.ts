import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type BottomNavVariants = VariantProps<typeof bottomNav> & Classes<typeof bottomNav>;
export type BottomNavItemVariants = VariantProps<typeof bottomNavItem> & Classes<typeof bottomNavItem>;
export type BottomNavHeaderVariants = VariantProps<typeof bottomNavHeader> & Classes<typeof bottomNavHeader>;
export type BottomNavHeaderItemVariants = VariantProps<typeof bottomNavHeaderItem>;
export declare const bottomNav: import("tailwind-variants").TVReturnType<{
    position: {
        static: {
            base: string;
        };
        fixed: {
            base: string;
        };
        absolute: {
            base: string;
        };
        relative: {
            base: string;
        };
        sticky: {
            base: string;
        };
    };
    navType: {
        default: {
            base: string;
        };
        border: {
            base: string;
        };
        application: {
            base: string;
        };
        pagination: {
            base: string;
        };
        group: {
            base: string;
        };
        card: {
            base: string;
        };
        meeting: {
            base: string;
            inner: string;
        };
        video: {
            base: string;
            inner: string;
        };
    };
}, {
    base: string;
    inner: string;
}, undefined, {
    position: {
        static: {
            base: string;
        };
        fixed: {
            base: string;
        };
        absolute: {
            base: string;
        };
        relative: {
            base: string;
        };
        sticky: {
            base: string;
        };
    };
    navType: {
        default: {
            base: string;
        };
        border: {
            base: string;
        };
        application: {
            base: string;
        };
        pagination: {
            base: string;
        };
        group: {
            base: string;
        };
        card: {
            base: string;
        };
        meeting: {
            base: string;
            inner: string;
        };
        video: {
            base: string;
            inner: string;
        };
    };
}, {
    base: string;
    inner: string;
}, import("tailwind-variants").TVReturnType<{
    position: {
        static: {
            base: string;
        };
        fixed: {
            base: string;
        };
        absolute: {
            base: string;
        };
        relative: {
            base: string;
        };
        sticky: {
            base: string;
        };
    };
    navType: {
        default: {
            base: string;
        };
        border: {
            base: string;
        };
        application: {
            base: string;
        };
        pagination: {
            base: string;
        };
        group: {
            base: string;
        };
        card: {
            base: string;
        };
        meeting: {
            base: string;
            inner: string;
        };
        video: {
            base: string;
            inner: string;
        };
    };
}, {
    base: string;
    inner: string;
}, undefined, unknown, unknown, undefined>>;
export declare const bottomNavItem: import("tailwind-variants").TVReturnType<{
    navType: {
        default: {
            base: string;
            span: string;
        };
        border: {
            base: string;
            span: string;
        };
        application: {
            base: string;
            span: string;
        };
        pagination: {
            base: string;
            span: string;
        };
        group: {
            base: string;
            span: string;
        };
        card: {
            base: string;
            span: string;
        };
        meeting: {
            base: string;
            span: string;
        };
        video: {
            base: string;
            span: string;
        };
    };
    appBtnPosition: {
        left: {
            base: string;
        };
        middle: {
            base: string;
        };
        right: {
            base: string;
        };
    };
}, {
    base: string;
    span: string;
}, undefined, {
    navType: {
        default: {
            base: string;
            span: string;
        };
        border: {
            base: string;
            span: string;
        };
        application: {
            base: string;
            span: string;
        };
        pagination: {
            base: string;
            span: string;
        };
        group: {
            base: string;
            span: string;
        };
        card: {
            base: string;
            span: string;
        };
        meeting: {
            base: string;
            span: string;
        };
        video: {
            base: string;
            span: string;
        };
    };
    appBtnPosition: {
        left: {
            base: string;
        };
        middle: {
            base: string;
        };
        right: {
            base: string;
        };
    };
}, {
    base: string;
    span: string;
}, import("tailwind-variants").TVReturnType<{
    navType: {
        default: {
            base: string;
            span: string;
        };
        border: {
            base: string;
            span: string;
        };
        application: {
            base: string;
            span: string;
        };
        pagination: {
            base: string;
            span: string;
        };
        group: {
            base: string;
            span: string;
        };
        card: {
            base: string;
            span: string;
        };
        meeting: {
            base: string;
            span: string;
        };
        video: {
            base: string;
            span: string;
        };
    };
    appBtnPosition: {
        left: {
            base: string;
        };
        middle: {
            base: string;
        };
        right: {
            base: string;
        };
    };
}, {
    base: string;
    span: string;
}, undefined, unknown, unknown, undefined>>;
export declare const bottomNavHeader: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            innerDiv?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            innerDiv?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    innerDiv: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            innerDiv?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    innerDiv: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    base: string;
    innerDiv: string;
}, undefined, unknown, unknown, undefined>>;
export declare const bottomNavHeaderItem: import("tailwind-variants").TVReturnType<{
    active: {
        true: string;
        false: string;
    };
}, undefined, "px-5 py-1.5 text-xs font-medium rounded-lg", {
    active: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    active: {
        true: string;
        false: string;
    };
}, undefined, "px-5 py-1.5 text-xs font-medium rounded-lg", unknown, unknown, undefined>>;
