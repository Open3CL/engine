import { l, u as p, f as e, g as m, i as f, j as v, k as i } from './B1hZYm7s.js';
function d(n) {
  (e === null && l(),
    m && e.l !== null
      ? s(e).m.push(n)
      : p(() => {
          const t = f(n);
          if (typeof t == 'function') return t;
        }));
}
function g(n) {
  (e === null && l(), d(() => () => f(n)));
}
function y(n, t, { bubbles: a = !1, cancelable: o = !1 } = {}) {
  return new CustomEvent(n, { detail: t, bubbles: a, cancelable: o });
}
function h() {
  const n = e;
  return (
    n === null && l(),
    (t, a, o) => {
      const c = n.s.$$events?.[t];
      if (c) {
        const r = v(c) ? c.slice() : [c],
          u = y(t, a, o);
        for (const _ of r) _.call(n.x, u);
        return !u.defaultPrevented;
      }
      return !0;
    }
  );
}
function k(n) {
  (e === null && l(), e.l === null && i(), s(e).b.push(n));
}
function x(n) {
  (e === null && l(), e.l === null && i(), s(e).a.push(n));
}
function s(n) {
  var t = n.l;
  return (t.u ??= { a: [], b: [], m: [] });
}
export { g as a, k as b, h as c, x as d, d as o };
