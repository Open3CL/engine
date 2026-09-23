/**
 * Example usage:
 *
 *   <script lang="ts">
 *      let clientWidth = 0
 *   </script>
 *
 *   <div use:resizeObserver={element => clientWidth = element.clientWidth}>
 *      My width is: {clientWidth}
 *   </div>
 */
export declare function resizeObserver(element: Element, onResize: (element: Element) => void): {
    destroy: () => void;
};
