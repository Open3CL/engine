import {
  f as d,
  n as g,
  u as c,
  i as m,
  o as i,
  q as b,
  t as p,
  v,
  w as h,
  x as k
} from './B1hZYm7s.js';
function y(n = !1) {
  const s = d,
    e = s.l.u;
  if (!e) return;
  let f = () => v(s.s);
  if (n) {
    let o = 0,
      t = {};
    const _ = h(() => {
      let l = !1;
      const r = s.s;
      for (const a in r) r[a] !== t[a] && ((t[a] = r[a]), (l = !0));
      return (l && o++, o);
    });
    f = () => p(_);
  }
  (e.b.length &&
    g(() => {
      (u(s, f), i(e.b));
    }),
    c(() => {
      const o = m(() => e.m.map(b));
      return () => {
        for (const t of o) typeof t == 'function' && t();
      };
    }),
    e.a.length &&
      c(() => {
        (u(s, f), i(e.a));
      }));
}
function u(n, s) {
  if (n.l.s) for (const e of n.l.s) p(e);
  s();
}
k();
export { y as i };
