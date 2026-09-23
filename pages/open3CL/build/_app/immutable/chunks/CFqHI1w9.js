import {
  F as U,
  t as M,
  G as B,
  H as j,
  i as G,
  I as x,
  J as P,
  e as u,
  h as c,
  K as b,
  L as J,
  M as K,
  N as O,
  O as Q,
  b as d,
  P as g,
  p as R,
  a as V,
  Q as C,
  R as v,
  S as L,
  T as X,
  U as Y,
  f as W,
  m as Z,
  V as z,
  d as w,
  W as E,
  X as ee,
  Y as te,
  Z as H,
  _ as se,
  $ as ie,
  a0 as ne,
  a1 as re,
  a2 as ae,
  a3 as N,
  a4 as he,
  a5 as oe,
  a6 as fe,
  a7 as A,
  a8 as y,
  a9 as le,
  aa as _e,
  ab as de,
  ac as ue,
  y as ce,
  ad as pe,
  ae as ge,
  B as ve
} from './B1hZYm7s.js';
import { b as ye, r as I, h as m, i as me, c as be } from './DCLGFrsA.js';
function Ee(i) {
  let e = 0,
    t = B(0),
    n;
  return () => {
    U() &&
      (M(t),
      j(
        () => (
          e === 0 && (n = G(() => i(() => x(t)))),
          (e += 1),
          () => {
            P(() => {
              ((e -= 1), e === 0 && (n?.(), (n = void 0), x(t)));
            });
          }
        )
      ));
  };
}
var Te = ie | ne | re;
function Re(i, e, t) {
  new we(i, e, t);
}
class we {
  parent;
  #s = !1;
  #t;
  #g = c ? u : null;
  #n;
  #_;
  #r;
  #i = null;
  #e = null;
  #a = null;
  #h = null;
  #o = null;
  #d = 0;
  #f = 0;
  #u = !1;
  #l = null;
  #m = Ee(
    () => (
      (this.#l = B(this.#d)),
      () => {
        this.#l = null;
      }
    )
  );
  constructor(e, t, n) {
    ((this.#t = e),
      (this.#n = t),
      (this.#_ = n),
      (this.parent = b.b),
      (this.#s = !!this.#n.pending),
      (this.#r = J(() => {
        if (((b.b = this), c)) {
          const s = this.#g;
          (K(), s.nodeType === O && s.data === Q ? this.#E() : this.#b());
        } else {
          var o = this.#v();
          try {
            this.#i = d(() => n(o));
          } catch (s) {
            this.error(s);
          }
          this.#f > 0 ? this.#p() : (this.#s = !1);
        }
        return () => {
          this.#o?.remove();
        };
      }, Te)),
      c && (this.#t = u));
  }
  #b() {
    try {
      this.#i = d(() => this.#_(this.#t));
    } catch (e) {
      this.error(e);
    }
    this.#s = !1;
  }
  #E() {
    const e = this.#n.pending;
    e &&
      ((this.#e = d(() => e(this.#t))),
      g.enqueue(() => {
        var t = this.#v();
        ((this.#i = this.#c(() => (g.ensure(), d(() => this.#_(t))))),
          this.#f > 0
            ? this.#p()
            : (R(this.#e, () => {
                this.#e = null;
              }),
              (this.#s = !1)));
      }));
  }
  #v() {
    var e = this.#t;
    return (this.#s && ((this.#o = V()), this.#t.before(this.#o), (e = this.#o)), e);
  }
  is_pending() {
    return this.#s || (!!this.parent && this.parent.is_pending());
  }
  has_pending_snippet() {
    return !!this.#n.pending;
  }
  #c(e) {
    var t = b,
      n = Y,
      o = W;
    (C(this.#r), v(this.#r), L(this.#r.ctx));
    try {
      return e();
    } catch (s) {
      return (X(s), null);
    } finally {
      (C(t), v(n), L(o));
    }
  }
  #p() {
    const e = this.#n.pending;
    (this.#i !== null &&
      ((this.#h = document.createDocumentFragment()), this.#h.append(this.#o), Z(this.#i, this.#h)),
      this.#e === null && (this.#e = d(() => e(this.#t))));
  }
  #y(e) {
    if (!this.has_pending_snippet()) {
      this.parent && this.parent.#y(e);
      return;
    }
    ((this.#f += e),
      this.#f === 0 &&
        ((this.#s = !1),
        this.#e &&
          R(this.#e, () => {
            this.#e = null;
          }),
        this.#h && (this.#t.before(this.#h), (this.#h = null))));
  }
  update_pending_count(e) {
    (this.#y(e), (this.#d += e), this.#l && z(this.#l, this.#d));
  }
  get_effect_pending() {
    return (this.#m(), M(this.#l));
  }
  error(e) {
    var t = this.#n.onerror;
    let n = this.#n.failed;
    if (this.#u || (!t && !n)) throw e;
    (this.#i && (w(this.#i), (this.#i = null)),
      this.#e && (w(this.#e), (this.#e = null)),
      this.#a && (w(this.#a), (this.#a = null)),
      c && (E(this.#g), ee(), E(te())));
    var o = !1,
      s = !1;
    const r = () => {
      if (o) {
        ae();
        return;
      }
      ((o = !0),
        s && se(),
        g.ensure(),
        (this.#d = 0),
        this.#a !== null &&
          R(this.#a, () => {
            this.#a = null;
          }),
        (this.#s = this.has_pending_snippet()),
        (this.#i = this.#c(() => ((this.#u = !1), d(() => this.#_(this.#t))))),
        this.#f > 0 ? this.#p() : (this.#s = !1));
    };
    var f = Y;
    try {
      (v(null), (s = !0), t?.(e, r), (s = !1));
    } catch (l) {
      H(l, this.#r && this.#r.parent);
    } finally {
      v(f);
    }
    n &&
      P(() => {
        this.#a = this.#c(() => {
          (g.ensure(), (this.#u = !0));
          try {
            return d(() => {
              n(
                this.#t,
                () => e,
                () => r
              );
            });
          } catch (l) {
            return (H(l, this.#r.parent), null);
          } finally {
            this.#u = !1;
          }
        });
      });
  }
}
let D = !0;
function Fe(i) {
  D = i;
}
function Oe(i, e) {
  var t = e == null ? '' : typeof e == 'object' ? e + '' : e;
  t !== (i.__t ??= i.nodeValue) && ((i.__t = t), (i.nodeValue = t + ''));
}
function Ne(i, e) {
  return $(i, e);
}
function ke(i, e) {
  (N(), (e.intro = e.intro ?? !1));
  const t = e.target,
    n = c,
    o = u;
  try {
    for (var s = he(t); s && (s.nodeType !== O || s.data !== oe);) s = fe(s);
    if (!s) throw A;
    (y(!0), E(s));
    const r = $(i, { ...e, anchor: s });
    return (y(!1), r);
  } catch (r) {
    if (
      r instanceof Error &&
      r.message
        .split(
          `
`
        )
        .some((f) => f.startsWith('https://svelte.dev/e/'))
    )
      throw r;
    return (
      r !== A && console.warn('Failed to hydrate: ', r),
      e.recover === !1 && le(),
      N(),
      _e(t),
      y(!1),
      Ne(i, e)
    );
  } finally {
    (y(n), E(o));
  }
}
const p = new Map();
function $(i, { target: e, anchor: t, props: n = {}, events: o, context: s, intro: r = !0 }) {
  N();
  var f = new Set(),
    l = (_) => {
      for (var h = 0; h < _.length; h++) {
        var a = _[h];
        if (!f.has(a)) {
          f.add(a);
          var k = me(a);
          e.addEventListener(a, m, { passive: k });
          var S = p.get(a);
          S === void 0
            ? (document.addEventListener(a, m, { passive: k }), p.set(a, 1))
            : p.set(a, S + 1);
        }
      }
    };
  (l(de(ye)), I.add(l));
  var T = void 0,
    q = ue(() => {
      var _ = t ?? e.appendChild(V());
      return (
        Re(_, { pending: () => {} }, (h) => {
          if (s) {
            ce({});
            var a = W;
            a.c = s;
          }
          if (
            (o && (n.$$events = o),
            c && be(h, null),
            (D = r),
            (T = i(h, n) || {}),
            (D = !0),
            c && ((b.nodes_end = u), u === null || u.nodeType !== O || u.data !== pe))
          )
            throw (ge(), A);
          s && ve();
        }),
        () => {
          for (var h of f) {
            e.removeEventListener(h, m);
            var a = p.get(h);
            --a === 0 ? (document.removeEventListener(h, m), p.delete(h)) : p.set(h, a);
          }
          (I.delete(l), _ !== t && _.parentNode?.removeChild(_));
        }
      );
    });
  return (F.set(T, q), T);
}
let F = new WeakMap();
function Se(i, e) {
  const t = F.get(i);
  return t ? (F.delete(i), t(e)) : Promise.resolve();
}
export { Fe as a, D as b, ke as h, Ne as m, Oe as s, Se as u };
