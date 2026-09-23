import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type TableVariants = VariantProps<typeof table> & Classes<typeof table>;
export type TableSearchVariants = Omit<VariantProps<typeof tableSearch>, "color"> & Classes<typeof tableSearch>;
export type TableSearchColor = "default" | "blue" | "green" | "red" | "yellow" | "purple" | "indigo" | "pink" | "custom" | undefined;
export declare const table: import("tailwind-variants").TVReturnType<{
    color: {
        default: {
            table: string;
        };
        primary: {
            table: string;
        };
        secondary: {
            table: string;
        };
        gray: {
            table: string;
        };
        red: {
            table: string;
        };
        orange: {
            table: string;
        };
        amber: {
            table: string;
        };
        yellow: {
            table: string;
        };
        lime: {
            table: string;
        };
        green: {
            table: string;
        };
        emerald: {
            table: string;
        };
        teal: {
            table: string;
        };
        cyan: {
            table: string;
        };
        sky: {
            table: string;
        };
        blue: {
            table: string;
        };
        indigo: {
            table: string;
        };
        violet: {
            table: string;
        };
        purple: {
            table: string;
        };
        fuchsia: {
            table: string;
        };
        pink: {
            table: string;
        };
        rose: {
            table: string;
        };
    };
    shadow: {
        true: {
            div: string;
        };
    };
}, {
    div: string;
    table: string;
}, undefined, {
    color: {
        default: {
            table: string;
        };
        primary: {
            table: string;
        };
        secondary: {
            table: string;
        };
        gray: {
            table: string;
        };
        red: {
            table: string;
        };
        orange: {
            table: string;
        };
        amber: {
            table: string;
        };
        yellow: {
            table: string;
        };
        lime: {
            table: string;
        };
        green: {
            table: string;
        };
        emerald: {
            table: string;
        };
        teal: {
            table: string;
        };
        cyan: {
            table: string;
        };
        sky: {
            table: string;
        };
        blue: {
            table: string;
        };
        indigo: {
            table: string;
        };
        violet: {
            table: string;
        };
        purple: {
            table: string;
        };
        fuchsia: {
            table: string;
        };
        pink: {
            table: string;
        };
        rose: {
            table: string;
        };
    };
    shadow: {
        true: {
            div: string;
        };
    };
}, {
    div: string;
    table: string;
}, import("tailwind-variants").TVReturnType<{
    color: {
        default: {
            table: string;
        };
        primary: {
            table: string;
        };
        secondary: {
            table: string;
        };
        gray: {
            table: string;
        };
        red: {
            table: string;
        };
        orange: {
            table: string;
        };
        amber: {
            table: string;
        };
        yellow: {
            table: string;
        };
        lime: {
            table: string;
        };
        green: {
            table: string;
        };
        emerald: {
            table: string;
        };
        teal: {
            table: string;
        };
        cyan: {
            table: string;
        };
        sky: {
            table: string;
        };
        blue: {
            table: string;
        };
        indigo: {
            table: string;
        };
        violet: {
            table: string;
        };
        purple: {
            table: string;
        };
        fuchsia: {
            table: string;
        };
        pink: {
            table: string;
        };
        rose: {
            table: string;
        };
    };
    shadow: {
        true: {
            div: string;
        };
    };
}, {
    div: string;
    table: string;
}, undefined, unknown, unknown, undefined>>;
export declare const tableBodyRow: import("tailwind-variants").TVReturnType<{
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    hoverable: {
        true: string;
    };
    striped: {
        true: string;
    };
    border: {
        true: string;
    };
}, undefined, "", {
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    hoverable: {
        true: string;
    };
    striped: {
        true: string;
    };
    border: {
        true: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    hoverable: {
        true: string;
    };
    striped: {
        true: string;
    };
    border: {
        true: string;
    };
}, undefined, "", unknown, unknown, undefined>>;
export declare const tableHead: import("tailwind-variants").TVReturnType<{
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    border: {
        true: string;
        false: string;
    };
    striped: {
        true: string;
        false: string;
    };
}, undefined, "text-xs uppercase", {
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    border: {
        true: string;
        false: string;
    };
    striped: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    color: {
        default: string;
        primary: string;
        secondary: string;
        gray: string;
        red: string;
        orange: string;
        amber: string;
        yellow: string;
        lime: string;
        green: string;
        emerald: string;
        teal: string;
        cyan: string;
        sky: string;
        blue: string;
        indigo: string;
        violet: string;
        purple: string;
        fuchsia: string;
        pink: string;
        rose: string;
    };
    border: {
        true: string;
        false: string;
    };
    striped: {
        true: string;
        false: string;
    };
}, undefined, "text-xs uppercase", unknown, unknown, undefined>>;
export declare const tableBodyCell: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "px-6 py-4 whitespace-nowrap font-medium", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "px-6 py-4 whitespace-nowrap font-medium", unknown, unknown, undefined>>;
export declare const tableHeadCell: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "px-6 py-3", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "px-6 py-3", unknown, unknown, undefined>>;
export declare const tableSearch: import("tailwind-variants").TVReturnType<{
    color: {
        default: {
            svg: string;
            table: string;
        };
        blue: {
            svg: string;
            table: string;
        };
        green: {
            svg: string;
            table: string;
        };
        red: {
            svg: string;
            table: string;
        };
        yellow: {
            svg: string;
            table: string;
        };
        purple: {
            svg: string;
            table: string;
        };
        indigo: {
            svg: string;
            table: string;
        };
        pink: {
            svg: string;
            table: string;
        };
    };
    striped: {
        true: {
            table: string;
        };
        false: {};
    };
    hoverable: {
        true: {
            table: string;
        };
        false: {};
    };
}, {
    root: string;
    inner: string;
    search: string;
    svgDiv: string;
    svg: string;
    input: string;
    table: string;
}, undefined, {
    color: {
        default: {
            svg: string;
            table: string;
        };
        blue: {
            svg: string;
            table: string;
        };
        green: {
            svg: string;
            table: string;
        };
        red: {
            svg: string;
            table: string;
        };
        yellow: {
            svg: string;
            table: string;
        };
        purple: {
            svg: string;
            table: string;
        };
        indigo: {
            svg: string;
            table: string;
        };
        pink: {
            svg: string;
            table: string;
        };
    };
    striped: {
        true: {
            table: string;
        };
        false: {};
    };
    hoverable: {
        true: {
            table: string;
        };
        false: {};
    };
}, {
    root: string;
    inner: string;
    search: string;
    svgDiv: string;
    svg: string;
    input: string;
    table: string;
}, import("tailwind-variants").TVReturnType<{
    color: {
        default: {
            svg: string;
            table: string;
        };
        blue: {
            svg: string;
            table: string;
        };
        green: {
            svg: string;
            table: string;
        };
        red: {
            svg: string;
            table: string;
        };
        yellow: {
            svg: string;
            table: string;
        };
        purple: {
            svg: string;
            table: string;
        };
        indigo: {
            svg: string;
            table: string;
        };
        pink: {
            svg: string;
            table: string;
        };
    };
    striped: {
        true: {
            table: string;
        };
        false: {};
    };
    hoverable: {
        true: {
            table: string;
        };
        false: {};
    };
}, {
    root: string;
    inner: string;
    search: string;
    svgDiv: string;
    svg: string;
    input: string;
    table: string;
}, undefined, unknown, unknown, undefined>>;
