import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type BreadcrumbVariants = VariantProps<typeof breadcrumb> & Classes<typeof breadcrumb>;
export type BreadcrumbItemVariants = VariantProps<typeof breadcrumbItem> & Classes<typeof breadcrumbItem>;
export declare const breadcrumb: import("tailwind-variants").TVReturnType<{
    solid: {
        true: {
            base: string;
        };
        false: string;
    };
}, {
    base: string;
    list: string;
}, undefined, {
    solid: {
        true: {
            base: string;
        };
        false: string;
    };
}, {
    base: string;
    list: string;
}, import("tailwind-variants").TVReturnType<{
    solid: {
        true: {
            base: string;
        };
        false: string;
    };
}, {
    base: string;
    list: string;
}, undefined, unknown, unknown, undefined>>;
export declare const breadcrumbItem: import("tailwind-variants").TVReturnType<{
    home: {
        true: string;
        false: string;
    };
    hasHref: {
        true: string;
        false: string;
    };
}, {
    base: string;
    separator: string;
}, undefined, {
    home: {
        true: string;
        false: string;
    };
    hasHref: {
        true: string;
        false: string;
    };
}, {
    base: string;
    separator: string;
}, import("tailwind-variants").TVReturnType<{
    home: {
        true: string;
        false: string;
    };
    hasHref: {
        true: string;
        false: string;
    };
}, {
    base: string;
    separator: string;
}, undefined, unknown, unknown, undefined>>;
