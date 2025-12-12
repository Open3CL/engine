import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({ fallback: 'index.html' }),
    alias: {
      $src: 'src',
      $features: 'src/features',
      $components: 'src/lib/components',
      $lib: 'src/lib',
      $models: 'src/lib/models',
      $stores: 'src/lib/stores',
      $services: 'src/lib/services',
      $core: 'src/core'
    },
    paths: {
      base: process.env.SVELTE_BASE_PATH || ''
    }
  }
};

export default config;
