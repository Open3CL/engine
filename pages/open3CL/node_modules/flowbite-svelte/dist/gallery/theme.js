import { tv } from "tailwind-variants";
export const gallery = tv({
    slots: {
        image: "h-auto max-w-full rounded-lg",
        div: "grid"
    }
});
