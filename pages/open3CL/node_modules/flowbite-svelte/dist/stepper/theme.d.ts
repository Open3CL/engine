import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../theme/themeUtils";
export type StepperVariants = VariantProps<typeof stepper> & Classes<typeof stepper>;
export type ProgressStepperVariants = VariantProps<typeof progressStepper> & Classes<typeof progressStepper>;
export type DetailedStepperVariants = VariantProps<typeof detailedStepper> & Classes<typeof detailedStepper>;
export type VerticalStepperVariants = VariantProps<typeof verticalStepper> & Classes<typeof verticalStepper>;
export type BreadcrumbStepperVariants = VariantProps<typeof breadcrumbStepper> & Classes<typeof breadcrumbStepper>;
export type TimelineStepperVariants = VariantProps<typeof timelineStepper> & Classes<typeof timelineStepper>;
export declare const stepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            content: string;
        };
        current: {
            item: string;
            content: string;
        };
        pending: {
            item: string;
            content: string;
        };
    };
    isLast: {
        true: {
            item: string;
            content: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    content: string;
}, undefined, {
    status: {
        completed: {
            item: string;
            content: string;
        };
        current: {
            item: string;
            content: string;
        };
        pending: {
            item: string;
            content: string;
        };
    };
    isLast: {
        true: {
            item: string;
            content: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    content: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            content: string;
        };
        current: {
            item: string;
            content: string;
        };
        pending: {
            item: string;
            content: string;
        };
    };
    isLast: {
        true: {
            item: string;
            content: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
export declare const progressStepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            circle: string;
        };
        current: {
            item: string;
            circle: string;
        };
        pending: {
            item: string;
            circle: string;
        };
    };
    isLast: {
        true: {
            item: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    circle: string;
}, undefined, {
    status: {
        completed: {
            item: string;
            circle: string;
        };
        current: {
            item: string;
            circle: string;
        };
        pending: {
            item: string;
            circle: string;
        };
    };
    isLast: {
        true: {
            item: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    circle: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            circle: string;
        };
        current: {
            item: string;
            circle: string;
        };
        pending: {
            item: string;
            circle: string;
        };
    };
    isLast: {
        true: {
            item: string;
        };
        false: {};
    };
}, {
    base: string;
    item: string;
    circle: string;
}, undefined, unknown, unknown, undefined>>;
export declare const detailedStepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, undefined, {
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, undefined, unknown, unknown, undefined>>;
export declare const verticalStepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            card: string;
        };
        current: {
            card: string;
        };
        pending: {
            card: string;
        };
    };
}, {
    base: string;
    card: string;
    content: string;
}, undefined, {
    status: {
        completed: {
            card: string;
        };
        current: {
            card: string;
        };
        pending: {
            card: string;
        };
    };
}, {
    base: string;
    card: string;
    content: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            card: string;
        };
        current: {
            card: string;
        };
        pending: {
            card: string;
        };
    };
}, {
    base: string;
    card: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
export declare const breadcrumbStepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
    hasChevron: {
        true: {};
        false: {};
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, undefined, {
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
    hasChevron: {
        true: {};
        false: {};
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            item: string;
            indicator: string;
        };
        current: {
            item: string;
            indicator: string;
        };
        pending: {
            item: string;
            indicator: string;
        };
    };
    hasChevron: {
        true: {};
        false: {};
    };
}, {
    base: string;
    item: string;
    indicator: string;
}, undefined, unknown, unknown, undefined>>;
export declare const timelineStepper: import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            circle: string;
        };
        current: {
            circle: string;
        };
        pending: {
            circle: string;
        };
    };
    isLast: {
        true: {};
        false: {
            item: string;
        };
    };
}, {
    base: string;
    item: string;
    circle: string;
}, undefined, {
    status: {
        completed: {
            circle: string;
        };
        current: {
            circle: string;
        };
        pending: {
            circle: string;
        };
    };
    isLast: {
        true: {};
        false: {
            item: string;
        };
    };
}, {
    base: string;
    item: string;
    circle: string;
}, import("tailwind-variants").TVReturnType<{
    status: {
        completed: {
            circle: string;
        };
        current: {
            circle: string;
        };
        pending: {
            circle: string;
        };
    };
    isLast: {
        true: {};
        false: {
            item: string;
        };
    };
}, {
    base: string;
    item: string;
    circle: string;
}, undefined, unknown, unknown, undefined>>;
