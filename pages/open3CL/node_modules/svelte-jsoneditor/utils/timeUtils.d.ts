/**
 * Measure how long a callback takes to execute.
 * Returns the response from the callback
 * The measured duration is returned via the onDuration callback
 */
export declare function measure<T>(callback: () => T, onDuration: (duration: number) => void): T;
