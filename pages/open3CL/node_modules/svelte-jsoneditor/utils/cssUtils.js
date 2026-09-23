/**
 * A simplified version of https://github.com/JedWatson/classnames
 *
 * Example usage:
 *
 *     classnames('primary-button', { selected: true }, 'left')
 *
 */
export function classnames(...args) {
    const classes = [];
    for (const arg of args) {
        if (typeof arg === 'string') {
            classes.push(arg);
        }
        if (arg && typeof arg === 'object') {
            for (const key in arg) {
                if (Object.hasOwnProperty.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }
    return classes.join(' ');
}
