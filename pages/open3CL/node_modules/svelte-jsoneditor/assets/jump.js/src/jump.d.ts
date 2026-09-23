type Easing = (t: number, b: number, c: number, d: number) => number;
type Duration = number | ((distance: number) => number);
interface JumpOptions {
    duration?: Duration;
    offset?: number;
    callback?: () => void;
    easing?: Easing;
    a11y?: boolean;
    container?: Element | string;
}
export declare const createJump: () => (target: Element | number | string, options?: JumpOptions) => void;
declare const singleton: (target: Element | number | string, options?: JumpOptions) => void;
export default singleton;
