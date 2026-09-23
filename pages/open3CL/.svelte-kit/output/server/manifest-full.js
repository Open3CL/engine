export const manifest = (() => {
  function __memo(fn) {
    let value;
    return () => (value ??= value = fn());
  }

  return {
    appDir: '_app',
    appPath: '_app',
    assets: new Set(['robots.txt']),
    mimeTypes: { '.txt': 'text/plain' },
    _: {
      client: {
        start: '_app/immutable/entry/start.CGNQGien.js',
        app: '_app/immutable/entry/app.BnvyMjzd.js',
        imports: [
          '_app/immutable/entry/start.CGNQGien.js',
          '_app/immutable/chunks/Bkjb22WU.js',
          '_app/immutable/chunks/B1hZYm7s.js',
          '_app/immutable/chunks/CipWvtMu.js',
          '_app/immutable/entry/app.BnvyMjzd.js',
          '_app/immutable/chunks/CjAW-N_a.js',
          '_app/immutable/chunks/B1hZYm7s.js',
          '_app/immutable/chunks/rOqi8yj0.js',
          '_app/immutable/chunks/CFqHI1w9.js',
          '_app/immutable/chunks/DCLGFrsA.js',
          '_app/immutable/chunks/CipWvtMu.js'
        ],
        stylesheets: [],
        fonts: [],
        uses_env_dynamic_public: false
      },
      nodes: [
        __memo(() => import('./nodes/0.js')),
        __memo(() => import('./nodes/1.js')),
        __memo(() => import('./nodes/2.js'))
      ],
      remotes: {},
      routes: [
        {
          id: '/',
          pattern: /^\/$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 2 },
          endpoint: null
        }
      ],
      prerendered_routes: new Set([]),
      matchers: async () => {
        return {};
      },
      server_assets: {}
    }
  };
})();
