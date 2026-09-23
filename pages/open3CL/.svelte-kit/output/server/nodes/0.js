export const index = 0;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default);
export const imports = [
  '_app/immutable/nodes/0.BCxDu5fY.js',
  '_app/immutable/chunks/DCLGFrsA.js',
  '_app/immutable/chunks/B1hZYm7s.js',
  '_app/immutable/chunks/CSx6k4m-.js',
  '_app/immutable/chunks/rOqi8yj0.js'
];
export const stylesheets = ['_app/immutable/assets/0.Bzr__E3n.css'];
export const fonts = [];
