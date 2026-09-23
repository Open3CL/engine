import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
import { dialog } from "../dialog/theme";
export type ModalVariants = VariantProps<typeof modal> & Classes<typeof modal> & Classes<typeof dialog>;
export declare const modal: import("tailwind-variants").TVReturnType<{
    fullscreen: {
        true: {
            base: string;
        };
    };
    placement: {
        "top-left": {
            base: string;
        };
        "top-center": {
            base: string;
        };
        "top-right": {
            base: string;
        };
        "center-left": {
            base: string;
        };
        center: {
            base: string;
        };
        "center-right": {
            base: string;
        };
        "bottom-left": {
            base: string;
        };
        "bottom-center": {
            base: string;
        };
        "bottom-right": {
            base: string;
        };
    };
    size: {
        none: {
            base: string;
        };
        xs: {
            base: string;
        };
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
    form: string;
    header: string;
    footer: string;
    body: string;
}, undefined, {}, {
    base: string;
    form: string;
    close: string;
}, import("tailwind-variants").TVReturnType<{}, {
    base: string;
    form: string;
    close: string;
}, undefined, {}, {
    base: string;
    form: string;
    close: string;
}, import("tailwind-variants").TVReturnType<{}, {
    base: string;
    form: string;
    close: string;
}, undefined, unknown, unknown, undefined>>>;
