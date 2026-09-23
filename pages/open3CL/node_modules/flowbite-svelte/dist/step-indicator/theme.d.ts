import { type VariantProps } from "tailwind-variants";
import type { ClassValue } from "svelte/elements";
import type { Classes } from "../theme/themeUtils";
export type StepIndicatorVariants = VariantProps<typeof stepIndicator> & Classes<typeof stepIndicator>;
export type StepIndicatorSlots = keyof typeof stepIndicator.slots;
export type StepIndicatorTheme = Partial<Record<StepIndicatorSlots, ClassValue>>;
export declare const stepIndicator: import("tailwind-variants").TVReturnType<{
    size: {
        xs: {
            container: string;
        };
        sm: {
            container: string;
        };
        md: {
            container: string;
        };
        lg: {
            container: string;
        };
        xl: {
            container: string;
        };
    };
    color: {
        primary: {
            step: string;
            glow: string;
        };
        secondary: {
            step: string;
            glow: string;
        };
        gray: {
            step: string;
            glow: string;
        };
        red: {
            step: string;
            glow: string;
        };
        yellow: {
            step: string;
            glow: string;
        };
        green: {
            step: string;
            glow: string;
        };
        indigo: {
            step: string;
            glow: string;
        };
        purple: {
            step: string;
            glow: string;
        };
        pink: {
            step: string;
            glow: string;
        };
        blue: {
            step: string;
            glow: string;
        };
        custom: {
            step: string;
            glow: string;
        };
    };
    glow: {
        true: {};
        false: {};
    };
    hideLabel: {
        true: {};
        false: {};
    };
}, {
    base: string;
    label: string;
    container: string;
    wrapper: string;
    step: string;
    glow: string;
    incomplete: string;
}, undefined, {
    size: {
        xs: {
            container: string;
        };
        sm: {
            container: string;
        };
        md: {
            container: string;
        };
        lg: {
            container: string;
        };
        xl: {
            container: string;
        };
    };
    color: {
        primary: {
            step: string;
            glow: string;
        };
        secondary: {
            step: string;
            glow: string;
        };
        gray: {
            step: string;
            glow: string;
        };
        red: {
            step: string;
            glow: string;
        };
        yellow: {
            step: string;
            glow: string;
        };
        green: {
            step: string;
            glow: string;
        };
        indigo: {
            step: string;
            glow: string;
        };
        purple: {
            step: string;
            glow: string;
        };
        pink: {
            step: string;
            glow: string;
        };
        blue: {
            step: string;
            glow: string;
        };
        custom: {
            step: string;
            glow: string;
        };
    };
    glow: {
        true: {};
        false: {};
    };
    hideLabel: {
        true: {};
        false: {};
    };
}, {
    base: string;
    label: string;
    container: string;
    wrapper: string;
    step: string;
    glow: string;
    incomplete: string;
}, import("tailwind-variants").TVReturnType<{
    size: {
        xs: {
            container: string;
        };
        sm: {
            container: string;
        };
        md: {
            container: string;
        };
        lg: {
            container: string;
        };
        xl: {
            container: string;
        };
    };
    color: {
        primary: {
            step: string;
            glow: string;
        };
        secondary: {
            step: string;
            glow: string;
        };
        gray: {
            step: string;
            glow: string;
        };
        red: {
            step: string;
            glow: string;
        };
        yellow: {
            step: string;
            glow: string;
        };
        green: {
            step: string;
            glow: string;
        };
        indigo: {
            step: string;
            glow: string;
        };
        purple: {
            step: string;
            glow: string;
        };
        pink: {
            step: string;
            glow: string;
        };
        blue: {
            step: string;
            glow: string;
        };
        custom: {
            step: string;
            glow: string;
        };
    };
    glow: {
        true: {};
        false: {};
    };
    hideLabel: {
        true: {};
        false: {};
    };
}, {
    base: string;
    label: string;
    container: string;
    wrapper: string;
    step: string;
    glow: string;
    incomplete: string;
}, undefined, unknown, unknown, undefined>>;
export declare const getStepStateClasses: (stepIndex: number, currentStep: number) => "data-[state=current]" | "data-[state=completed]" | "data-[state=incomplete]";
