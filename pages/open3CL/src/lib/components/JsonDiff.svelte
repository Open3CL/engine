<script>
  import { format, hideUnchanged } from 'jsondiffpatch/formatters/html';
  import { create } from 'jsondiffpatch';
  import { afterUpdate } from 'svelte';

  /**
   * @type {object}
   */
  export let input;

  /**
   * @type {object}
   */
  export let output;

  afterUpdate(() => {
    const jsonDiffInstance = create({
      propertyFilter: (name) =>
        !name.includes('donnee_utilisateur') && !name.includes('administratif')
    });

    const jsonDiff = jsonDiffInstance.diff(input, output);

    const htmlElem = document.getElementById('visual-diff');

    // beautiful html diff
    htmlElem.innerHTML = format(jsonDiff, input);

    hideUnchanged();
  });
</script>

<div id="visual-diff"></div>

<style>
  @import 'https://esm.sh/jsondiffpatch@0.6.0/lib/formatters/styles/html.css';
</style>
