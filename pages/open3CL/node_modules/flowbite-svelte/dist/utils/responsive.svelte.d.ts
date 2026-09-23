/**
 * A Svelte 5 rune-based media query hook
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns A function that returns the current match state
 */
export declare function useMediaQuery(query: string): () => boolean;
/**
 * Hook for common Tailwind CSS breakpoints
 * @returns Object with boolean values for each breakpoint
 */
export declare function useBreakpoints(): {
    readonly sm: boolean;
    readonly md: boolean;
    readonly lg: boolean;
    readonly xl: boolean;
    readonly "2xl": boolean;
    readonly isMobile: boolean;
    readonly isTablet: boolean;
    readonly isDesktop: boolean;
};
/**
 * Get current breakpoint name
 * @returns Current breakpoint as string
 */
export declare function useCurrentBreakpoint(): () => "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export declare const BREAKPOINTS: Record<BreakpointKey, number>;
interface $$__sveltets_2_IsomorphicComponent<Props extends Record<string, any> = any, Events extends Record<string, any> = any, Slots extends Record<string, any> = any, Exports = {}, Bindings = string> {
    new (options: import('svelte').ComponentConstructorOptions<Props>): import('svelte').SvelteComponent<Props, Events, Slots> & {
        $$bindings?: Bindings;
    } & Exports;
    (internal: unknown, props: {
        $$events?: Events;
        $$slots?: Slots;
    }): Exports & {
        $set?: any;
        $on?: any;
    };
    z_$$bindings?: Bindings;
}
declare const Responsive: $$__sveltets_2_IsomorphicComponent<Record<string, never>, {
    [evt: string]: CustomEvent<any>;
}, {}, {}, string>;
type Responsive = InstanceType<typeof Responsive>;
export default Responsive;
