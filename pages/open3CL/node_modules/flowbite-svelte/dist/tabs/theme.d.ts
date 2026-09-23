import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type TabsVaraints = VariantProps<typeof tabs> & Classes<typeof tabs>;
export type TabItemVariants = VariantProps<typeof tabItem> & Classes<typeof tabItem>;
export declare const tabs: import("tailwind-variants").TVReturnType<{
    tabStyle: {
        full: {
            active: string;
            inactive: string;
        };
        pill: {
            active: string;
            inactive: string;
        };
        underline: {
            base: string;
            active: string;
            inactive: string;
        };
        none: {
            active: string;
            inactive: string;
        };
    };
    hasDivider: {
        true: {};
    };
}, {
    base: string;
    content: string;
    divider: string;
    active: string;
    inactive: string;
}, undefined, {
    tabStyle: {
        full: {
            active: string;
            inactive: string;
        };
        pill: {
            active: string;
            inactive: string;
        };
        underline: {
            base: string;
            active: string;
            inactive: string;
        };
        none: {
            active: string;
            inactive: string;
        };
    };
    hasDivider: {
        true: {};
    };
}, {
    base: string;
    content: string;
    divider: string;
    active: string;
    inactive: string;
}, import("tailwind-variants").TVReturnType<{
    tabStyle: {
        full: {
            active: string;
            inactive: string;
        };
        pill: {
            active: string;
            inactive: string;
        };
        underline: {
            base: string;
            active: string;
            inactive: string;
        };
        none: {
            active: string;
            inactive: string;
        };
    };
    hasDivider: {
        true: {};
    };
}, {
    base: string;
    content: string;
    divider: string;
    active: string;
    inactive: string;
}, undefined, unknown, unknown, undefined>>;
export declare const tabItem: import("tailwind-variants").TVReturnType<{
    open: {
        true: {
            button: string;
        };
    };
    disabled: {
        true: {
            button: string;
        };
    };
}, {
    base: string;
    button: string;
}, undefined, {
    open: {
        true: {
            button: string;
        };
    };
    disabled: {
        true: {
            button: string;
        };
    };
}, {
    base: string;
    button: string;
}, import("tailwind-variants").TVReturnType<{
    open: {
        true: {
            button: string;
        };
    };
    disabled: {
        true: {
            button: string;
        };
    };
}, {
    base: string;
    button: string;
}, undefined, unknown, unknown, undefined>>;
