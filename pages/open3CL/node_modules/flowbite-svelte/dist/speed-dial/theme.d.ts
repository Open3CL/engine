import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type SpeedDialVariants = VariantProps<typeof speedDial> & Classes<typeof speedDial>;
export type SpeedDialButtonVariants = VariantProps<typeof speedDialButton> & Classes<typeof speedDialButton>;
export declare const speedDial: import("tailwind-variants").TVReturnType<{
    vertical: {
        true: {
            popper: string;
        };
    };
}, {
    base: string;
    popper: string;
}, undefined, {
    vertical: {
        true: {
            popper: string;
        };
    };
}, {
    base: string;
    popper: string;
}, import("tailwind-variants").TVReturnType<{
    vertical: {
        true: {
            popper: string;
        };
    };
}, {
    base: string;
    popper: string;
}, undefined, unknown, unknown, undefined>>;
export declare const speedDialButton: import("tailwind-variants").TVReturnType<{
    noTooltip: {
        false: {};
        true: {};
    };
    textOutside: {
        true: {
            base: string;
            span: string;
        };
    };
}, {
    base: string;
    span: string;
}, undefined, {
    noTooltip: {
        false: {};
        true: {};
    };
    textOutside: {
        true: {
            base: string;
            span: string;
        };
    };
}, {
    base: string;
    span: string;
}, import("tailwind-variants").TVReturnType<{
    noTooltip: {
        false: {};
        true: {};
    };
    textOutside: {
        true: {
            base: string;
            span: string;
        };
    };
}, {
    base: string;
    span: string;
}, undefined, unknown, unknown, undefined>>;
