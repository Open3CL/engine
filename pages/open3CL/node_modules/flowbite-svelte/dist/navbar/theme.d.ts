import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type NavbarBreakpoint = "sm" | "md" | "lg" | "xl";
export type NavbarUlVariants = VariantProps<typeof navbarUl> & Classes<typeof navbarUl>;
export type NavbarHamburgerVariants = VariantProps<typeof navbarHamburger> & Classes<typeof navbarHamburger>;
export declare const navbar: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "relative w-full px-2 py-2.5 sm:px-4", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "relative w-full px-2 py-2.5 sm:px-4", unknown, unknown, undefined>>;
export declare const navbarBrand: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flex items-center", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flex items-center", unknown, unknown, undefined>>;
export declare const navbarContainer: import("tailwind-variants").TVReturnType<{
    fluid: {
        true: string;
        false: string;
    };
}, undefined, "mx-auto flex flex-wrap items-center justify-between ", {
    fluid: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    fluid: {
        true: string;
        false: string;
    };
}, undefined, "mx-auto flex flex-wrap items-center justify-between ", unknown, unknown, undefined>>;
export declare const navbarUl: import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        md: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        lg: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        xl: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
    };
    hidden: {
        false: {
            base: string;
            ul: string;
        };
        true: {
            base: string;
        };
    };
}, {
    base: string;
    ul: string;
    active: string;
    nonActive: string;
}, undefined, {
    breakpoint: {
        sm: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        md: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        lg: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        xl: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
    };
    hidden: {
        false: {
            base: string;
            ul: string;
        };
        true: {
            base: string;
        };
    };
}, {
    base: string;
    ul: string;
    active: string;
    nonActive: string;
}, import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        md: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        lg: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
        xl: {
            base: string;
            ul: string;
            active: string;
            nonActive: string;
        };
    };
    hidden: {
        false: {
            base: string;
            ul: string;
        };
        true: {
            base: string;
        };
    };
}, {
    base: string;
    ul: string;
    active: string;
    nonActive: string;
}, undefined, unknown, unknown, undefined>>;
export declare const navbarLi: import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    hidden: {
        false: string;
    };
}, undefined, "block py-2 pe-4 ps-3 rounded-sm", {
    breakpoint: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    hidden: {
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    hidden: {
        false: string;
    };
}, undefined, "block py-2 pe-4 ps-3 rounded-sm", unknown, unknown, undefined>>;
export declare const navbarHamburger: import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: {
            base: string;
        };
        md: {
            base: string;
        };
        lg: {
            base: string;
        };
        xl: {
            base: string;
        };
    };
}, {
    base: string;
    menu: string;
}, undefined, {
    breakpoint: {
        sm: {
            base: string;
        };
        md: {
            base: string;
        };
        lg: {
            base: string;
        };
        xl: {
            base: string;
        };
    };
}, {
    base: string;
    menu: string;
}, import("tailwind-variants").TVReturnType<{
    breakpoint: {
        sm: {
            base: string;
        };
        md: {
            base: string;
        };
        lg: {
            base: string;
        };
        xl: {
            base: string;
        };
    };
}, {
    base: string;
    menu: string;
}, undefined, unknown, unknown, undefined>>;
