import type { Classes } from "../theme/themeUtils";
import { type VariantProps } from "tailwind-variants";
export type CarouselVariants = VariantProps<typeof carousel> & Classes<typeof carousel>;
export declare const carousel: import("tailwind-variants").TVReturnType<{}, {
    base: string;
    slide: string;
}, undefined, {}, {
    base: string;
    slide: string;
}, import("tailwind-variants").TVReturnType<{}, {
    base: string;
    slide: string;
}, undefined, unknown, unknown, undefined>>;
export declare const carouselIndicators: import("tailwind-variants").TVReturnType<{
    selected: {
        true: {
            indicator: string;
        };
        false: {
            indicator: string;
        };
    };
    position: {
        top: {
            base: string;
        };
        bottom: {
            base: string;
        };
    };
}, {
    base: string;
    indicator: string;
}, undefined, {
    selected: {
        true: {
            indicator: string;
        };
        false: {
            indicator: string;
        };
    };
    position: {
        top: {
            base: string;
        };
        bottom: {
            base: string;
        };
    };
}, {
    base: string;
    indicator: string;
}, import("tailwind-variants").TVReturnType<{
    selected: {
        true: {
            indicator: string;
        };
        false: {
            indicator: string;
        };
    };
    position: {
        top: {
            base: string;
        };
        bottom: {
            base: string;
        };
    };
}, {
    base: string;
    indicator: string;
}, undefined, unknown, unknown, undefined>>;
export declare const controlButton: import("tailwind-variants").TVReturnType<{
    forward: {
        true: string;
        false: string;
    };
}, {
    base: string;
    span: string;
}, undefined, {
    forward: {
        true: string;
        false: string;
    };
}, {
    base: string;
    span: string;
}, import("tailwind-variants").TVReturnType<{
    forward: {
        true: string;
        false: string;
    };
}, {
    base: string;
    span: string;
}, undefined, unknown, unknown, undefined>>;
export declare const thumbnails: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flex flex-row justify-center bg-gray-100 w-full", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flex flex-row justify-center bg-gray-100 w-full", unknown, unknown, undefined>>;
export declare const thumbnail: import("tailwind-variants").TVReturnType<{
    selected: {
        true: string;
        false: string;
    };
}, undefined, "", {
    selected: {
        true: string;
        false: string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    selected: {
        true: string;
        false: string;
    };
}, undefined, "", unknown, unknown, undefined>>;
export type SlideVariants = VariantProps<typeof slide>;
export declare const slide: import("tailwind-variants").TVReturnType<{
    fit: {
        contain: string;
        cover: string;
        fill: string;
        none: string;
        "scale-down": string;
    };
}, undefined, "absolute block w-full h-full", {
    fit: {
        contain: string;
        cover: string;
        fill: string;
        none: string;
        "scale-down": string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    fit: {
        contain: string;
        cover: string;
        fill: string;
        none: string;
        "scale-down": string;
    };
}, undefined, "absolute block w-full h-full", unknown, unknown, undefined>>;
