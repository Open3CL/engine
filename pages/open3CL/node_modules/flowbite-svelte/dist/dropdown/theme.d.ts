import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export declare const dropdown: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "mt-2 divide-y divide-gray-300 dark:divide-gray-500 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-700", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "mt-2 divide-y divide-gray-300 dark:divide-gray-500 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-700", unknown, unknown, undefined>>;
export declare const dropdownDivider: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "my-1 h-px bg-gray-100 dark:bg-gray-500", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "my-1 h-px bg-gray-100 dark:bg-gray-500", unknown, unknown, undefined>>;
export declare const dropdownHeader: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "px-4 py-3 text-sm text-gray-900 dark:text-white", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "px-4 py-3 text-sm text-gray-900 dark:text-white", unknown, unknown, undefined>>;
export type DropdownItemVariants = VariantProps<typeof dropdownItem> & Classes<typeof dropdownItem>;
export declare const dropdownItem: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            active?: import("tailwind-merge").ClassNameValue;
            li?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            active?: import("tailwind-merge").ClassNameValue;
            li?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    active: string;
    li: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            active?: import("tailwind-merge").ClassNameValue;
            li?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    active: string;
    li: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    base: string;
    active: string;
    li: string;
}, undefined, unknown, unknown, undefined>>;
export declare const dropdownGroup: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "py-2 text-sm text-gray-700 dark:text-gray-200", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "py-2 text-sm text-gray-700 dark:text-gray-200", unknown, unknown, undefined>>;
