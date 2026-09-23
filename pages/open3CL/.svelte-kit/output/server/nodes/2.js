export const index = 2;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import('../entries/pages/_page.svelte.js')).default);
export const imports = [
  '_app/immutable/nodes/2.0OT65D6k.js',
  '_app/immutable/chunks/DCLGFrsA.js',
  '_app/immutable/chunks/B1hZYm7s.js',
  '_app/immutable/chunks/grUBbj3m.js',
  '_app/immutable/chunks/CFqHI1w9.js',
  '_app/immutable/chunks/CjAW-N_a.js',
  '_app/immutable/chunks/rOqi8yj0.js',
  '_app/immutable/chunks/CSx6k4m-.js',
  '_app/immutable/chunks/CipWvtMu.js'
];
export const stylesheets = ['_app/immutable/assets/2.C7KyTbkx.css'];
export const fonts = [];
