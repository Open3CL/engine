import {
  L as N,
  h as y,
  M as B,
  $,
  ao as q,
  O as U,
  Y as z,
  W as F,
  a8 as A,
  ap as G,
  H,
  i as C,
  J as W,
  aq as x,
  ar as g,
  as as J,
  at as K,
  t as E,
  w as Q,
  au as Z,
  av as V,
  ag as X,
  aw as k,
  K as R,
  ax as ee,
  ay as re,
  g as ne,
  az as se,
  aA as te,
  aB as ie,
  ah as M,
  G as ae,
  aC as T,
  Q as L,
  aD as b
} from './B1hZYm7s.js';
import { B as Y } from './rOqi8yj0.js';
function he(e, r, n = !1) {
  y && B();
  var s = new Y(e),
    t = n ? $ : 0;
  function i(l, a) {
    if (y) {
      const v = q(e) === U;
      if (l === v) {
        var c = z();
        (F(c), (s.anchor = c), A(!1), s.ensure(l, a), A(!0));
        return;
      }
    }
    s.ensure(l, a);
  }
  N(() => {
    var l = !1;
    (r((a, c = !0) => {
      ((l = !0), i(c, a));
    }),
      l || i(!1, null));
  }, t);
}
function Pe(e, r, n) {
  y && B();
  var s = new Y(e);
  N(() => {
    var t = r() ?? null;
    s.ensure(t, t && ((i) => n(i, t)));
  }, $);
}
function I(e, r) {
  return e === r || e?.[x] === r;
}
function be(e = {}, r, n, s) {
  return (
    G(() => {
      var t, i;
      return (
        H(() => {
          ((t = i),
            (i = []),
            C(() => {
              e !== n(...i) && (r(e, ...i), t && I(n(...t), e) && r(null, ...t));
            }));
        }),
        () => {
          W(() => {
            i && I(n(...i), e) && r(null, ...i);
          });
        }
      );
    }),
    e
  );
}
let S = !1;
function ue(e) {
  var r = S;
  try {
    return ((S = !1), [e(), S]);
  } finally {
    S = r;
  }
}
const le = {
  get(e, r) {
    if (!e.exclude.includes(r)) return e.props[r];
  },
  set(e, r) {
    return !1;
  },
  getOwnPropertyDescriptor(e, r) {
    if (!e.exclude.includes(r) && r in e.props)
      return { enumerable: !0, configurable: !0, value: e.props[r] };
  },
  has(e, r) {
    return e.exclude.includes(r) ? !1 : r in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((r) => !e.exclude.includes(r));
  }
};
function we(e, r, n) {
  return new Proxy({ props: e, exclude: r }, le);
}
const fe = {
  get(e, r) {
    if (!e.exclude.includes(r)) return (E(e.version), r in e.special ? e.special[r]() : e.props[r]);
  },
  set(e, r, n) {
    if (!(r in e.special)) {
      var s = R;
      try {
        (L(e.parent_effect),
          (e.special[r] = ce(
            {
              get [r]() {
                return e.props[r];
              }
            },
            r,
            K
          )));
      } finally {
        L(s);
      }
    }
    return (e.special[r](n), T(e.version), !0);
  },
  getOwnPropertyDescriptor(e, r) {
    if (!e.exclude.includes(r) && r in e.props)
      return { enumerable: !0, configurable: !0, value: e.props[r] };
  },
  deleteProperty(e, r) {
    return (e.exclude.includes(r) || (e.exclude.push(r), T(e.version)), !0);
  },
  has(e, r) {
    return e.exclude.includes(r) ? !1 : r in e.props;
  },
  ownKeys(e) {
    return Reflect.ownKeys(e.props).filter((r) => !e.exclude.includes(r));
  }
};
function Se(e, r) {
  return new Proxy({ props: e, exclude: r, special: {}, version: ae(0), parent_effect: R }, fe);
}
const oe = {
  get(e, r) {
    let n = e.props.length;
    for (; n--;) {
      let s = e.props[n];
      if ((b(s) && (s = s()), typeof s == 'object' && s !== null && r in s)) return s[r];
    }
  },
  set(e, r, n) {
    let s = e.props.length;
    for (; s--;) {
      let t = e.props[s];
      b(t) && (t = t());
      const i = g(t, r);
      if (i && i.set) return (i.set(n), !0);
    }
    return !1;
  },
  getOwnPropertyDescriptor(e, r) {
    let n = e.props.length;
    for (; n--;) {
      let s = e.props[n];
      if ((b(s) && (s = s()), typeof s == 'object' && s !== null && r in s)) {
        const t = g(s, r);
        return (t && !t.configurable && (t.configurable = !0), t);
      }
    }
  },
  has(e, r) {
    if (r === x || r === M) return !1;
    for (let n of e.props) if ((b(n) && (n = n()), n != null && r in n)) return !0;
    return !1;
  },
  ownKeys(e) {
    const r = [];
    for (let n of e.props)
      if ((b(n) && (n = n()), !!n)) {
        for (const s in n) r.includes(s) || r.push(s);
        for (const s of Object.getOwnPropertySymbols(n)) r.includes(s) || r.push(s);
      }
    return r;
  }
};
function Ee(...e) {
  return new Proxy({ props: e }, oe);
}
function ce(e, r, n, s) {
  var t = !ne || (n & se) !== 0,
    i = (n & re) !== 0,
    l = (n & ie) !== 0,
    a = s,
    c = !0,
    v = () => (c && ((c = !1), (a = l ? C(s) : s)), a),
    u;
  if (i) {
    var _ = x in e || M in e;
    u = g(e, r)?.set ?? (_ && r in e ? (f) => (e[r] = f) : void 0);
  }
  var d,
    p = !1;
  (i ? ([d, p] = ue(() => e[r])) : (d = e[r]),
    d === void 0 && s !== void 0 && ((d = v()), u && (t && J(), u(d))));
  var o;
  if (
    (t
      ? (o = () => {
          var f = e[r];
          return f === void 0 ? v() : ((c = !0), f);
        })
      : (o = () => {
          var f = e[r];
          return (f !== void 0 && (a = void 0), f === void 0 ? a : f);
        }),
    t && (n & K) === 0)
  )
    return o;
  if (u) {
    var h = e.$$legacy;
    return function (f, w) {
      return arguments.length > 0 ? ((!t || !w || h || p) && u(w ? o() : f), f) : o();
    };
  }
  var m = !1,
    P = ((n & te) !== 0 ? Q : Z)(() => ((m = !1), o()));
  i && E(P);
  var j = R;
  return function (f, w) {
    if (arguments.length > 0) {
      const O = w ? E(P) : t && i ? V(f) : f;
      return (X(P, O), (m = !0), a !== void 0 && (a = O), f);
    }
    return (k && m) || (j.f & ee) !== 0 ? P.v : E(P);
  };
}
const de = 'modulepreload',
  pe = function (e, r) {
    return new URL(e, r).href;
  },
  D = {},
  me = function (r, n, s) {
    let t = Promise.resolve();
    if (n && n.length > 0) {
      let v = function (u) {
        return Promise.all(
          u.map((_) =>
            Promise.resolve(_).then(
              (d) => ({ status: 'fulfilled', value: d }),
              (d) => ({ status: 'rejected', reason: d })
            )
          )
        );
      };
      const l = document.getElementsByTagName('link'),
        a = document.querySelector('meta[property=csp-nonce]'),
        c = a?.nonce || a?.getAttribute('nonce');
      t = v(
        n.map((u) => {
          if (((u = pe(u, s)), u in D)) return;
          D[u] = !0;
          const _ = u.endsWith('.css'),
            d = _ ? '[rel="stylesheet"]' : '';
          if (s)
            for (let o = l.length - 1; o >= 0; o--) {
              const h = l[o];
              if (h.href === u && (!_ || h.rel === 'stylesheet')) return;
            }
          else if (document.querySelector(`link[href="${u}"]${d}`)) return;
          const p = document.createElement('link');
          if (
            ((p.rel = _ ? 'stylesheet' : de),
            _ || (p.as = 'script'),
            (p.crossOrigin = ''),
            (p.href = u),
            c && p.setAttribute('nonce', c),
            document.head.appendChild(p),
            _)
          )
            return new Promise((o, h) => {
              (p.addEventListener('load', o),
                p.addEventListener('error', () => h(new Error(`Unable to preload CSS for ${u}`))));
            });
        })
      );
    }
    function i(l) {
      const a = new Event('vite:preloadError', { cancelable: !0 });
      if (((a.payload = l), window.dispatchEvent(a), !a.defaultPrevented)) throw l;
    }
    return t.then((l) => {
      for (const a of l || []) a.status === 'rejected' && i(a.reason);
      return r().catch(i);
    });
  };
export { me as _, be as b, Pe as c, he as i, Se as l, ce as p, we as r, Ee as s };
