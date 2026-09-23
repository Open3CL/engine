export const index = 1;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default);
export const imports = [
  '_app/immutable/nodes/1.P8c2YVg4.js',
  '_app/immutable/chunks/DCLGFrsA.js',
  '_app/immutable/chunks/B1hZYm7s.js',
  '_app/immutable/chunks/grUBbj3m.js',
  '_app/immutable/chunks/CFqHI1w9.js',
  '_app/immutable/chunks/Bkjb22WU.js',
  '_app/immutable/chunks/CipWvtMu.js'
];
export const stylesheets = [];
export const fonts = [];
