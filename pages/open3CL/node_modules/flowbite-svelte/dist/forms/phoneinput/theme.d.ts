import { type VariantProps } from "tailwind-variants";
import type { Classes } from "../../theme/themeUtils";
export type PhoneInputVariants = VariantProps<typeof phoneInput> & Classes<typeof phoneInput>;
export declare const phoneInput: import("tailwind-variants").TVReturnType<{
    phoneType: {
        default: {};
        floating: {
            svg: string;
        };
        countryCode: {
            input: string;
        };
        copy: {};
        advanced: {};
    };
    phoneIcon: {
        true: {
            input: string;
        };
        false: {};
    };
}, {
    div: string;
    svg: string;
    input: string;
    span: string;
    floatingInput: string;
    label: string;
}, undefined, {
    phoneType: {
        default: {};
        floating: {
            svg: string;
        };
        countryCode: {
            input: string;
        };
        copy: {};
        advanced: {};
    };
    phoneIcon: {
        true: {
            input: string;
        };
        false: {};
    };
}, {
    div: string;
    svg: string;
    input: string;
    span: string;
    floatingInput: string;
    label: string;
}, import("tailwind-variants").TVReturnType<{
    phoneType: {
        default: {};
        floating: {
            svg: string;
        };
        countryCode: {
            input: string;
        };
        copy: {};
        advanced: {};
    };
    phoneIcon: {
        true: {
            input: string;
        };
        false: {};
    };
}, {
    div: string;
    svg: string;
    input: string;
    span: string;
    floatingInput: string;
    label: string;
}, undefined, unknown, unknown, undefined>>;
