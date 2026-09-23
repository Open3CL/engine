// Dial
import { tv } from "tailwind-variants";
export const speedDial = tv({
    slots: {
        base: "group bg-transparent",
        popper: "flex items-center gap-2 bg-transparent text-inherit"
    },
    variants: {
        vertical: {
            true: { popper: "flex-col" }
        }
    },
    defaultVariants: {
        vertical: false
    }
});
export const speedDialButton = tv({
    slots: {
        base: "w-[52px] h-[52px] shadow-xs p-0",
        span: "mb-px text-xs font-medium"
    },
    variants: {
        noTooltip: {
            false: {},
            true: {}
        },
        textOutside: {
            true: {
                base: "relative",
                span: "absolute -start-12 top-1/2 mb-px text-sm font-medium -translate-y-1/2"
            }
        }
    },
    compoundVariants: [{ noTooltip: true, textOutside: false, class: { base: "flex flex-col" } }],
    defaultVariants: {}
});
