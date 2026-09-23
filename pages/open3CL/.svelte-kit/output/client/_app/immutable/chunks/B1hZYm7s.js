var Bt = Array.isArray,
  Vt = Array.prototype.indexOf,
  Cn = Array.from,
  Mn = Object.defineProperty,
  ce = Object.getOwnPropertyDescriptor,
  Gt = Object.getOwnPropertyDescriptors,
  Kt = Object.prototype,
  $t = Array.prototype,
  it = Object.getPrototypeOf,
  Qe = Object.isExtensible;
function Ln(e) {
  return typeof e == 'function';
}
const Fn = () => {};
function jn(e) {
  return e();
}
function zt(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
function at() {
  var e,
    t,
    n = new Promise((r, s) => {
      ((e = r), (t = s));
    });
  return { promise: n, resolve: e, reject: t };
}
const E = 2,
  Ye = 4,
  xe = 8,
  j = 16,
  Y = 32,
  re = 64,
  qe = 128,
  N = 512,
  m = 1024,
  T = 2048,
  P = 4096,
  I = 8192,
  H = 16384,
  He = 32768,
  pe = 65536,
  Ie = 1 << 17,
  lt = 1 << 18,
  de = 1 << 19,
  ot = 1 << 20,
  ee = 32768,
  Pe = 1 << 21,
  Ue = 1 << 22,
  U = 1 << 23,
  J = Symbol('$state'),
  Yn = Symbol('legacy props'),
  qn = Symbol(''),
  se = new (class extends Error {
    name = 'StaleReactionError';
    message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
  })(),
  Un = 1,
  Be = 3,
  ut = 8;
function Xt(e) {
  throw new Error('https://svelte.dev/e/lifecycle_outside_component');
}
function Zt() {
  throw new Error('https://svelte.dev/e/async_derived_orphan');
}
function Wt(e) {
  throw new Error('https://svelte.dev/e/effect_in_teardown');
}
function Jt() {
  throw new Error('https://svelte.dev/e/effect_in_unowned_derived');
}
function Qt(e) {
  throw new Error('https://svelte.dev/e/effect_orphan');
}
function en() {
  throw new Error('https://svelte.dev/e/effect_update_depth_exceeded');
}
function tn() {
  throw new Error('https://svelte.dev/e/experimental_async_fork');
}
function nn() {
  throw new Error('https://svelte.dev/e/fork_discarded');
}
function rn() {
  throw new Error('https://svelte.dev/e/fork_timing');
}
function Bn() {
  throw new Error('https://svelte.dev/e/hydration_failed');
}
function Vn(e) {
  throw new Error('https://svelte.dev/e/lifecycle_legacy_only');
}
function Gn(e) {
  throw new Error('https://svelte.dev/e/props_invalid_value');
}
function sn() {
  throw new Error('https://svelte.dev/e/state_descriptors_fixed');
}
function fn() {
  throw new Error('https://svelte.dev/e/state_prototype_fixed');
}
function an() {
  throw new Error('https://svelte.dev/e/state_unsafe_mutation');
}
function Kn() {
  throw new Error('https://svelte.dev/e/svelte_boundary_reset_onerror');
}
const $n = 1,
  zn = 2,
  Xn = 4,
  Zn = 8,
  Wn = 16,
  Jn = 1,
  Qn = 2,
  er = 4,
  tr = 8,
  nr = 16,
  rr = 4,
  sr = 1,
  fr = 2,
  ln = '[',
  on = '[!',
  un = ']',
  Ve = {},
  g = Symbol(),
  ir = 'http://www.w3.org/1999/xhtml',
  ar = 'http://www.w3.org/2000/svg',
  lr = '@attach';
function Ge(e) {
  console.warn('https://svelte.dev/e/hydration_mismatch');
}
function or() {
  console.warn('https://svelte.dev/e/select_multiple_invalid_value');
}
function ur() {
  console.warn('https://svelte.dev/e/svelte_boundary_reset_noop');
}
let G = !1;
function cr(e) {
  G = e;
}
let x;
function fe(e) {
  if (e === null) throw (Ge(), Ve);
  return (x = e);
}
function _r() {
  return fe(z(x));
}
function vr(e) {
  if (G) {
    if (z(x) !== null) throw (Ge(), Ve);
    x = e;
  }
}
function dr(e = 1) {
  if (G) {
    for (var t = e, n = x; t--;) n = z(n);
    x = n;
  }
}
function hr(e = !0) {
  for (var t = 0, n = x; ;) {
    if (n.nodeType === ut) {
      var r = n.data;
      if (r === un) {
        if (t === 0) return n;
        t -= 1;
      } else (r === ln || r === on) && (t += 1);
    }
    var s = z(n);
    (e && n.remove(), (n = s));
  }
}
function pr(e) {
  if (!e || e.nodeType !== ut) throw (Ge(), Ve);
  return e.data;
}
function ct(e) {
  return e === this.v;
}
function cn(e, t) {
  return e != e
    ? t == t
    : e !== t || (e !== null && typeof e == 'object') || typeof e == 'function';
}
function _t(e) {
  return !cn(e, this.v);
}
let ke = !1;
function wr() {
  ke = !0;
}
let w = null;
function we(e) {
  w = e;
}
function yr(e) {
  return vt().get(e);
}
function Er(e, t) {
  return (vt().set(e, t), t);
}
function mr(e, t = !1, n) {
  w = {
    p: w,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    l: ke && !t ? { s: null, u: null, $: [] } : null
  };
}
function gr(e) {
  var t = w,
    n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n) Rt(r);
  }
  return (e !== void 0 && (t.x = e), (t.i = !0), (w = t.p), e ?? {});
}
function he() {
  return !ke || (w !== null && w.l === null);
}
function vt(e) {
  return (w === null && Xt(), (w.c ??= new Map(_n(w) || void 0)));
}
function _n(e) {
  let t = e.p;
  for (; t !== null;) {
    const n = t.c;
    if (n !== null) return n;
    t = t.p;
  }
  return null;
}
let X = [];
function dt() {
  var e = X;
  ((X = []), zt(e));
}
function ht(e) {
  if (X.length === 0 && !_e) {
    var t = X;
    queueMicrotask(() => {
      t === X && dt();
    });
  }
  X.push(e);
}
function vn() {
  for (; X.length > 0;) dt();
}
function dn(e) {
  var t = h;
  if (t === null) return ((_.f |= U), e);
  if ((t.f & He) === 0) {
    if ((t.f & qe) === 0) throw e;
    t.b.error(e);
  } else ye(e, t);
}
function ye(e, t) {
  for (; t !== null;) {
    if ((t.f & qe) !== 0)
      try {
        t.b.error(e);
        return;
      } catch (n) {
        e = n;
      }
    t = t.parent;
  }
  throw e;
}
const Z = new Set();
let p = null,
  Ne = null,
  R = null,
  S = [],
  Se = null,
  Ce = !1,
  _e = !1;
class K {
  committed = !1;
  current = new Map();
  previous = new Map();
  #r = new Set();
  #s = new Set();
  #t = 0;
  #n = 0;
  #a = null;
  #f = [];
  #i = [];
  skipped_effects = new Set();
  is_fork = !1;
  is_deferred() {
    return this.is_fork || this.#n > 0;
  }
  process(t) {
    ((S = []), (Ne = null), this.apply());
    var n = { parent: null, effect: null, effects: [], render_effects: [], block_effects: [] };
    for (const r of t) this.#l(r, n);
    (this.is_fork || this.#u(),
      this.is_deferred()
        ? (this.#e(n.effects), this.#e(n.render_effects), this.#e(n.block_effects))
        : ((Ne = this),
          (p = null),
          et(n.render_effects),
          et(n.effects),
          (Ne = null),
          this.#a?.resolve()),
      (R = null));
  }
  #l(t, n) {
    t.f ^= m;
    for (var r = t.first; r !== null;) {
      var s = r.f,
        f = (s & (Y | re)) !== 0,
        o = f && (s & m) !== 0,
        l = o || (s & I) !== 0 || this.skipped_effects.has(r);
      if (
        ((r.f & qe) !== 0 &&
          r.b?.is_pending() &&
          (n = { parent: n, effect: r, effects: [], render_effects: [], block_effects: [] }),
        !l && r.fn !== null)
      ) {
        f
          ? (r.f ^= m)
          : (s & Ye) !== 0
            ? n.effects.push(r)
            : oe(r) && ((r.f & j) !== 0 && n.block_effects.push(r), ae(r));
        var i = r.first;
        if (i !== null) {
          r = i;
          continue;
        }
      }
      var a = r.parent;
      for (r = r.next; r === null && a !== null;)
        (a === n.effect &&
          (this.#e(n.effects), this.#e(n.render_effects), this.#e(n.block_effects), (n = n.parent)),
          (r = a.next),
          (a = a.parent));
    }
  }
  #e(t) {
    for (const n of t) (((n.f & T) !== 0 ? this.#f : this.#i).push(n), this.#o(n.deps), y(n, m));
  }
  #o(t) {
    if (t !== null)
      for (const n of t) (n.f & E) === 0 || (n.f & ee) === 0 || ((n.f ^= ee), this.#o(n.deps));
  }
  capture(t, n) {
    (this.previous.has(t) || this.previous.set(t, n),
      (t.f & U) === 0 && (this.current.set(t, t.v), R?.set(t, t.v)));
  }
  activate() {
    ((p = this), this.apply());
  }
  deactivate() {
    p === this && ((p = null), (R = null));
  }
  flush() {
    if ((this.activate(), S.length > 0)) {
      if ((Le(), p !== null && p !== this)) return;
    } else this.#t === 0 && this.process([]);
    this.deactivate();
  }
  discard() {
    for (const t of this.#s) t(this);
    this.#s.clear();
  }
  #u() {
    if (this.#n === 0) {
      for (const t of this.#r) t();
      this.#r.clear();
    }
    this.#t === 0 && this.#c();
  }
  #c() {
    if (Z.size > 1) {
      this.previous.clear();
      var t = R,
        n = !0,
        r = { parent: null, effect: null, effects: [], render_effects: [], block_effects: [] };
      for (const f of Z) {
        if (f === this) {
          n = !1;
          continue;
        }
        const o = [];
        for (const [i, a] of this.current) {
          if (f.current.has(i))
            if (n && a !== f.current.get(i)) f.current.set(i, a);
            else continue;
          o.push(i);
        }
        if (o.length === 0) continue;
        const l = [...f.current.keys()].filter((i) => !this.current.has(i));
        if (l.length > 0) {
          var s = S;
          S = [];
          const i = new Set(),
            a = new Map();
          for (const u of o) pt(u, l, i, a);
          if (S.length > 0) {
            ((p = f), f.apply());
            for (const u of S) f.#l(u, r);
            f.deactivate();
          }
          S = s;
        }
      }
      ((p = null), (R = t));
    }
    ((this.committed = !0), Z.delete(this));
  }
  increment(t) {
    ((this.#t += 1), t && (this.#n += 1));
  }
  decrement(t) {
    ((this.#t -= 1), t && (this.#n -= 1), this.revive());
  }
  revive() {
    for (const t of this.#f) (y(t, T), te(t));
    for (const t of this.#i) (y(t, P), te(t));
    ((this.#f = []), (this.#i = []), this.flush());
  }
  oncommit(t) {
    this.#r.add(t);
  }
  ondiscard(t) {
    this.#s.add(t);
  }
  settled() {
    return (this.#a ??= at()).promise;
  }
  static ensure() {
    if (p === null) {
      const t = (p = new K());
      (Z.add(p),
        _e ||
          K.enqueue(() => {
            p === t && t.flush();
          }));
    }
    return p;
  }
  static enqueue(t) {
    ht(t);
  }
  apply() {}
}
function Me(e) {
  var t = _e;
  _e = !0;
  try {
    var n;
    for (e && (p !== null && Le(), (n = e())); ;) {
      if ((vn(), S.length === 0 && (p?.flush(), S.length === 0))) return ((Se = null), n);
      Le();
    }
  } finally {
    _e = t;
  }
}
function Le() {
  var e = V;
  Ce = !0;
  var t = null;
  try {
    var n = 0;
    for (Te(!0); S.length > 0;) {
      var r = K.ensure();
      if (n++ > 1e3) {
        var s, f;
        hn();
      }
      (r.process(S), B.clear());
    }
  } finally {
    ((Ce = !1), Te(e), (Se = null));
  }
}
function hn() {
  try {
    en();
  } catch (e) {
    ye(e, Se);
  }
}
let M = null;
function et(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t;) {
      var r = e[n++];
      if (
        (r.f & (H | I)) === 0 &&
        oe(r) &&
        ((M = new Set()),
        ae(r),
        r.deps === null &&
          r.first === null &&
          r.nodes_start === null &&
          (r.teardown === null && r.ac === null ? It(r) : (r.fn = null)),
        M?.size > 0)
      ) {
        B.clear();
        for (const s of M) {
          if ((s.f & (H | I)) !== 0) continue;
          const f = [s];
          let o = s.parent;
          for (; o !== null;) (M.has(o) && (M.delete(o), f.push(o)), (o = o.parent));
          for (let l = f.length - 1; l >= 0; l--) {
            const i = f[l];
            (i.f & (H | I)) === 0 && ae(i);
          }
        }
        M.clear();
      }
    }
    M = null;
  }
}
function pt(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const s of e.reactions) {
      const f = s.f;
      (f & E) !== 0
        ? pt(s, t, n, r)
        : (f & (Ue | j)) !== 0 && (f & T) === 0 && yt(s, t, r) && (y(s, T), te(s));
    }
}
function wt(e, t) {
  if (e.reactions !== null)
    for (const n of e.reactions) {
      const r = n.f;
      (r & E) !== 0 ? wt(n, t) : (r & Ie) !== 0 && (y(n, T), t.add(n));
    }
}
function yt(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const s of e.deps) {
      if (t.includes(s)) return !0;
      if ((s.f & E) !== 0 && yt(s, t, n)) return (n.set(s, !0), !0);
    }
  return (n.set(e, !1), !1);
}
function te(e) {
  for (var t = (Se = e); t.parent !== null;) {
    t = t.parent;
    var n = t.f;
    if (Ce && t === h && (n & j) !== 0 && (n & lt) === 0) return;
    if ((n & (re | Y)) !== 0) {
      if ((n & m) === 0) return;
      t.f ^= m;
    }
  }
  S.push(t);
}
function br(e) {
  (tn(), p !== null && rn());
  var t = K.ensure();
  t.is_fork = !0;
  var n = !1,
    r = t.settled();
  Me(e);
  for (var [s, f] of t.previous) s.v = f;
  return {
    commit: async () => {
      if (n) {
        await r;
        return;
      }
      (Z.has(t) || nn(), (n = !0), (t.is_fork = !1));
      for (var [o, l] of t.current) o.v = l;
      (Me(() => {
        var i = new Set();
        for (var a of t.current.keys()) wt(a, i);
        (gn(i), bt());
      }),
        t.revive(),
        await r);
    },
    discard: () => {
      !n && Z.has(t) && (Z.delete(t), t.discard());
    }
  };
}
function pn(e, t, n, r) {
  const s = he() ? Ke : En;
  if (n.length === 0 && e.length === 0) {
    r(t.map(s));
    return;
  }
  var f = p,
    o = h,
    l = wn();
  function i() {
    Promise.all(n.map((a) => yn(a)))
      .then((a) => {
        l();
        try {
          r([...t.map(s), ...a]);
        } catch (u) {
          (o.f & H) === 0 && ye(u, o);
        }
        (f?.deactivate(), Ee());
      })
      .catch((a) => {
        ye(a, o);
      });
  }
  e.length > 0
    ? Promise.all(e).then(() => {
        l();
        try {
          return i();
        } finally {
          (f?.deactivate(), Ee());
        }
      })
    : i();
}
function wn() {
  var e = h,
    t = _,
    n = w,
    r = p;
  return function (f = !0) {
    (ie(e), $(t), we(n), f && r?.activate());
  };
}
function Ee() {
  (ie(null), $(null), we(null));
}
function Ke(e) {
  var t = E | T,
    n = _ !== null && (_.f & E) !== 0 ? _ : null;
  return (
    h !== null && (h.f |= de),
    {
      ctx: w,
      deps: null,
      effects: null,
      equals: ct,
      f: t,
      fn: e,
      reactions: null,
      rv: 0,
      v: g,
      wv: 0,
      parent: n ?? h,
      ac: null
    }
  );
}
function yn(e, t) {
  let n = h;
  n === null && Zt();
  var r = n.b,
    s = void 0,
    f = ze(g),
    o = !_,
    l = new Map();
  return (
    kn(() => {
      var i = at();
      s = i.promise;
      try {
        Promise.resolve(e())
          .then(i.resolve, i.reject)
          .then(() => {
            (a === p && a.committed && a.deactivate(), Ee());
          });
      } catch (c) {
        (i.reject(c), Ee());
      }
      var a = p;
      if (o) {
        var u = !r.is_pending();
        (r.update_pending_count(1), a.increment(u), l.get(a)?.reject(se), l.delete(a), l.set(a, i));
      }
      const v = (c, d = void 0) => {
        if ((a.activate(), d)) d !== se && ((f.f |= U), Fe(f, d));
        else {
          ((f.f & U) !== 0 && (f.f ^= U), Fe(f, c));
          for (const [O, Re] of l) {
            if ((l.delete(O), O === a)) break;
            Re.reject(se);
          }
        }
        o && (r.update_pending_count(-1), a.decrement(u));
      };
      i.promise.then(v, (c) => v(null, c || 'unknown'));
    }),
    St(() => {
      for (const i of l.values()) i.reject(se);
    }),
    new Promise((i) => {
      function a(u) {
        function v() {
          u === s ? i(f) : a(s);
        }
        u.then(v, v);
      }
      a(s);
    })
  );
}
function Tr(e) {
  const t = Ke(e);
  return (Mt(t), t);
}
function En(e) {
  const t = Ke(e);
  return ((t.equals = _t), t);
}
function Et(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1) ne(t[n]);
  }
}
function mn(e) {
  for (var t = e.parent; t !== null;) {
    if ((t.f & E) === 0) return (t.f & H) === 0 ? t : null;
    t = t.parent;
  }
  return null;
}
function $e(e) {
  var t,
    n = h;
  ie(mn(e));
  try {
    ((e.f &= ~ee), Et(e), (t = Yt(e)));
  } finally {
    ie(n);
  }
  return t;
}
function mt(e) {
  var t = $e(e);
  if ((e.equals(t) || (p?.is_fork || (e.v = t), (e.wv = Ft())), !le))
    if (R !== null) Ze() && R.set(e, t);
    else {
      var n = (e.f & N) === 0 ? P : m;
      y(e, n);
    }
}
let me = new Set();
const B = new Map();
function gn(e) {
  me = e;
}
let gt = !1;
function ze(e, t) {
  var n = { f: 0, v: e, reactions: null, equals: ct, rv: 0, wv: 0 };
  return n;
}
function q(e, t) {
  const n = ze(e);
  return (Mt(n), n);
}
function Ar(e, t = !1, n = !0) {
  const r = ze(e);
  return (t || (r.equals = _t), ke && n && w !== null && w.l !== null && (w.l.s ??= []).push(r), r);
}
function xr(e, t) {
  return (
    L(
      e,
      Ut(() => W(e))
    ),
    t
  );
}
function L(e, t, n = !1) {
  _ !== null &&
    (!D || (_.f & Ie) !== 0) &&
    he() &&
    (_.f & (E | j | Ue | Ie)) !== 0 &&
    !F?.includes(e) &&
    an();
  let r = n ? ue(t) : t;
  return Fe(e, r);
}
function Fe(e, t) {
  if (!e.equals(t)) {
    var n = e.v;
    (le ? B.set(e, t) : B.set(e, n), (e.v = t));
    var r = K.ensure();
    (r.capture(e, n),
      (e.f & E) !== 0 && ((e.f & T) !== 0 && $e(e), y(e, (e.f & N) !== 0 ? m : P)),
      (e.wv = Ft()),
      Tt(e, T),
      he() &&
        h !== null &&
        (h.f & m) !== 0 &&
        (h.f & (Y | re)) === 0 &&
        (k === null ? Dn([e]) : k.push(e)),
      !r.is_fork && me.size > 0 && !gt && bt());
  }
  return t;
}
function bt() {
  gt = !1;
  var e = V;
  Te(!0);
  const t = Array.from(me);
  try {
    for (const n of t) ((n.f & m) !== 0 && y(n, P), oe(n) && ae(n));
  } finally {
    Te(e);
  }
  me.clear();
}
function kr(e, t = 1) {
  var n = W(e),
    r = t === 1 ? n++ : n--;
  return (L(e, n), r);
}
function De(e) {
  L(e, e.v + 1);
}
function Tt(e, t) {
  var n = e.reactions;
  if (n !== null)
    for (var r = he(), s = n.length, f = 0; f < s; f++) {
      var o = n[f],
        l = o.f;
      if (!(!r && o === h)) {
        var i = (l & T) === 0;
        if ((i && y(o, t), (l & E) !== 0)) {
          var a = o;
          (R?.delete(a), (l & ee) === 0 && (l & N && (o.f |= ee), Tt(a, P)));
        } else i && ((l & j) !== 0 && M !== null && M.add(o), te(o));
      }
    }
}
function ue(e) {
  if (typeof e != 'object' || e === null || J in e) return e;
  const t = it(e);
  if (t !== Kt && t !== $t) return e;
  var n = new Map(),
    r = Bt(e),
    s = q(0),
    f = Q,
    o = (l) => {
      if (Q === f) return l();
      var i = _,
        a = Q;
      ($(null), ft(f));
      var u = l();
      return ($(i), ft(a), u);
    };
  return (
    r && n.set('length', q(e.length)),
    new Proxy(e, {
      defineProperty(l, i, a) {
        (!('value' in a) || a.configurable === !1 || a.enumerable === !1 || a.writable === !1) &&
          sn();
        var u = n.get(i);
        return (
          u === void 0
            ? (u = o(() => {
                var v = q(a.value);
                return (n.set(i, v), v);
              }))
            : L(u, a.value, !0),
          !0
        );
      },
      deleteProperty(l, i) {
        var a = n.get(i);
        if (a === void 0) {
          if (i in l) {
            const u = o(() => q(g));
            (n.set(i, u), De(s));
          }
        } else (L(a, g), De(s));
        return !0;
      },
      get(l, i, a) {
        if (i === J) return e;
        var u = n.get(i),
          v = i in l;
        if (
          (u === void 0 &&
            (!v || ce(l, i)?.writable) &&
            ((u = o(() => {
              var d = ue(v ? l[i] : g),
                O = q(d);
              return O;
            })),
            n.set(i, u)),
          u !== void 0)
        ) {
          var c = W(u);
          return c === g ? void 0 : c;
        }
        return Reflect.get(l, i, a);
      },
      getOwnPropertyDescriptor(l, i) {
        var a = Reflect.getOwnPropertyDescriptor(l, i);
        if (a && 'value' in a) {
          var u = n.get(i);
          u && (a.value = W(u));
        } else if (a === void 0) {
          var v = n.get(i),
            c = v?.v;
          if (v !== void 0 && c !== g)
            return { enumerable: !0, configurable: !0, value: c, writable: !0 };
        }
        return a;
      },
      has(l, i) {
        if (i === J) return !0;
        var a = n.get(i),
          u = (a !== void 0 && a.v !== g) || Reflect.has(l, i);
        if (a !== void 0 || (h !== null && (!u || ce(l, i)?.writable))) {
          a === void 0 &&
            ((a = o(() => {
              var c = u ? ue(l[i]) : g,
                d = q(c);
              return d;
            })),
            n.set(i, a));
          var v = W(a);
          if (v === g) return !1;
        }
        return u;
      },
      set(l, i, a, u) {
        var v = n.get(i),
          c = i in l;
        if (r && i === 'length')
          for (var d = a; d < v.v; d += 1) {
            var O = n.get(d + '');
            O !== void 0 ? L(O, g) : d in l && ((O = o(() => q(g))), n.set(d + '', O));
          }
        if (v === void 0)
          (!c || ce(l, i)?.writable) && ((v = o(() => q(void 0))), L(v, ue(a)), n.set(i, v));
        else {
          c = v.v !== g;
          var Re = o(() => ue(a));
          L(v, Re);
        }
        var We = Reflect.getOwnPropertyDescriptor(l, i);
        if ((We?.set && We.set.call(u, a), !c)) {
          if (r && typeof i == 'string') {
            var Je = n.get('length'),
              Oe = Number(i);
            Number.isInteger(Oe) && Oe >= Je.v && L(Je, Oe + 1);
          }
          De(s);
        }
        return !0;
      },
      ownKeys(l) {
        W(s);
        var i = Reflect.ownKeys(l).filter((v) => {
          var c = n.get(v);
          return c === void 0 || c.v !== g;
        });
        for (var [a, u] of n) u.v !== g && !(a in l) && i.push(a);
        return i;
      },
      setPrototypeOf() {
        fn();
      }
    })
  );
}
function tt(e) {
  try {
    if (e !== null && typeof e == 'object' && J in e) return e[J];
  } catch {}
  return e;
}
function Sr(e, t) {
  return Object.is(tt(e), tt(t));
}
var nt, bn, At, xt;
function Rr() {
  if (nt === void 0) {
    ((nt = window), (bn = /Firefox/.test(navigator.userAgent)));
    var e = Element.prototype,
      t = Node.prototype,
      n = Text.prototype;
    ((At = ce(t, 'firstChild').get),
      (xt = ce(t, 'nextSibling').get),
      Qe(e) &&
        ((e.__click = void 0),
        (e.__className = void 0),
        (e.__attributes = null),
        (e.__style = void 0),
        (e.__e = void 0)),
      Qe(n) && (n.__t = void 0));
  }
}
function ge(e = '') {
  return document.createTextNode(e);
}
function be(e) {
  return At.call(e);
}
function z(e) {
  return xt.call(e);
}
function Or(e, t) {
  if (!G) return be(e);
  var n = be(x);
  if (n === null) n = x.appendChild(ge());
  else if (t && n.nodeType !== Be) {
    var r = ge();
    return (n?.before(r), fe(r), r);
  }
  return (fe(n), n);
}
function Nr(e, t = !1) {
  if (!G) {
    var n = be(e);
    return n instanceof Comment && n.data === '' ? z(n) : n;
  }
  if (t && x?.nodeType !== Be) {
    var r = ge();
    return (x?.before(r), fe(r), r);
  }
  return x;
}
function Dr(e, t = 1, n = !1) {
  let r = G ? x : e;
  for (var s; t--;) ((s = r), (r = z(r)));
  if (!G) return r;
  if (n && r?.nodeType !== Be) {
    var f = ge();
    return (r === null ? s?.after(f) : r.before(f), fe(f), f);
  }
  return (fe(r), r);
}
function Tn(e) {
  e.textContent = '';
}
function Ir() {
  return !1;
}
function Pr(e, t) {
  if (t) {
    const n = document.body;
    ((e.autofocus = !0),
      ht(() => {
        document.activeElement === n && e.focus();
      }));
  }
}
function Cr(e) {
  G && be(e) !== null && Tn(e);
}
let rt = !1;
function An() {
  rt ||
    ((rt = !0),
    document.addEventListener(
      'reset',
      (e) => {
        Promise.resolve().then(() => {
          if (!e.defaultPrevented) for (const t of e.target.elements) t.__on_r?.();
        });
      },
      { capture: !0 }
    ));
}
function Mr(e, t, n, r = !0) {
  r && n();
  for (var s of t) e.addEventListener(s, n);
  St(() => {
    for (var f of t) e.removeEventListener(f, n);
  });
}
function Xe(e) {
  var t = _,
    n = h;
  ($(null), ie(null));
  try {
    return e();
  } finally {
    ($(t), ie(n));
  }
}
function Lr(e, t, n, r = n) {
  e.addEventListener(t, () => Xe(n));
  const s = e.__on_r;
  (s
    ? (e.__on_r = () => {
        (s(), r(!0));
      })
    : (e.__on_r = () => r(!0)),
    An());
}
function kt(e) {
  (h === null && (_ === null && Qt(), Jt()), le && Wt());
}
function xn(e, t) {
  var n = t.last;
  n === null ? (t.last = t.first = e) : ((n.next = e), (e.prev = n), (t.last = e));
}
function C(e, t, n) {
  var r = h;
  r !== null && (r.f & I) !== 0 && (e |= I);
  var s = {
    ctx: w,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: e | T | N,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: r,
    b: r && r.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (n)
    try {
      (ae(s), (s.f |= He));
    } catch (l) {
      throw (ne(s), l);
    }
  else t !== null && te(s);
  var f = s;
  if (
    (n &&
      f.deps === null &&
      f.teardown === null &&
      f.nodes_start === null &&
      f.first === f.last &&
      (f.f & de) === 0 &&
      ((f = f.first), (e & j) !== 0 && (e & pe) !== 0 && f !== null && (f.f |= pe)),
    f !== null &&
      ((f.parent = r), r !== null && xn(f, r), _ !== null && (_.f & E) !== 0 && (e & re) === 0))
  ) {
    var o = _;
    (o.effects ??= []).push(f);
  }
  return s;
}
function Ze() {
  return _ !== null && !D;
}
function St(e) {
  const t = C(xe, null, !1);
  return (y(t, m), (t.teardown = e), t);
}
function Fr(e) {
  kt();
  var t = h.f,
    n = !_ && (t & Y) !== 0 && (t & He) === 0;
  if (n) {
    var r = w;
    (r.e ??= []).push(e);
  } else return Rt(e);
}
function Rt(e) {
  return C(Ye | ot, e, !1);
}
function jr(e) {
  return (kt(), C(xe | ot, e, !0));
}
function Yr(e) {
  K.ensure();
  const t = C(re | de, e, !0);
  return (n = {}) =>
    new Promise((r) => {
      n.outro
        ? On(t, () => {
            (ne(t), r(void 0));
          })
        : (ne(t), r(void 0));
    });
}
function qr(e) {
  return C(Ye, e, !1);
}
function Hr(e, t) {
  var n = w,
    r = { effect: null, ran: !1, deps: e };
  (n.l.$.push(r),
    (r.effect = Ot(() => {
      (e(), !r.ran && ((r.ran = !0), Ut(t)));
    })));
}
function Ur() {
  var e = w;
  Ot(() => {
    for (var t of e.l.$) {
      t.deps();
      var n = t.effect;
      ((n.f & m) !== 0 && y(n, P), oe(n) && ae(n), (t.ran = !1));
    }
  });
}
function kn(e) {
  return C(Ue | de, e, !0);
}
function Ot(e, t = 0) {
  return C(xe | t, e, !0);
}
function Br(e, t = [], n = [], r = []) {
  pn(r, t, n, (s) => {
    C(xe, () => e(...s.map(W)), !0);
  });
}
function Vr(e, t = 0) {
  var n = C(j | t, e, !0);
  return n;
}
function Gr(e) {
  return C(Y | de, e, !0);
}
function Nt(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = le,
      r = _;
    (st(!0), $(null));
    try {
      t.call(null);
    } finally {
      (st(n), $(r));
    }
  }
}
function Dt(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null;) {
    const s = n.ac;
    s !== null &&
      Xe(() => {
        s.abort(se);
      });
    var r = n.next;
    ((n.f & re) !== 0 ? (n.parent = null) : ne(n, t), (n = r));
  }
}
function Sn(e) {
  for (var t = e.first; t !== null;) {
    var n = t.next;
    ((t.f & Y) === 0 && ne(t), (t = n));
  }
}
function ne(e, t = !0) {
  var n = !1;
  ((t || (e.f & lt) !== 0) &&
    e.nodes_start !== null &&
    e.nodes_end !== null &&
    (Rn(e.nodes_start, e.nodes_end), (n = !0)),
    Dt(e, t && !n),
    Ae(e, 0),
    y(e, H));
  var r = e.transitions;
  if (r !== null) for (const f of r) f.stop();
  Nt(e);
  var s = e.parent;
  (s !== null && s.first !== null && It(e),
    (e.next =
      e.prev =
      e.teardown =
      e.ctx =
      e.deps =
      e.fn =
      e.nodes_start =
      e.nodes_end =
      e.ac =
        null));
}
function Rn(e, t) {
  for (; e !== null;) {
    var n = e === t ? null : z(e);
    (e.remove(), (e = n));
  }
}
function It(e) {
  var t = e.parent,
    n = e.prev,
    r = e.next;
  (n !== null && (n.next = r),
    r !== null && (r.prev = n),
    t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n)));
}
function On(e, t, n = !0) {
  var r = [];
  (Pt(e, r, !0),
    Nn(r, () => {
      (n && ne(e), t && t());
    }));
}
function Nn(e, t) {
  var n = e.length;
  if (n > 0) {
    var r = () => --n || t();
    for (var s of e) s.out(r);
  } else t();
}
function Pt(e, t, n) {
  if ((e.f & I) === 0) {
    if (((e.f ^= I), e.transitions !== null))
      for (const o of e.transitions) (o.is_global || n) && t.push(o);
    for (var r = e.first; r !== null;) {
      var s = r.next,
        f = (r.f & pe) !== 0 || ((r.f & Y) !== 0 && (e.f & j) !== 0);
      (Pt(r, t, f ? n : !1), (r = s));
    }
  }
}
function Kr(e) {
  Ct(e, !0);
}
function Ct(e, t) {
  if ((e.f & I) !== 0) {
    ((e.f ^= I), (e.f & m) === 0 && (y(e, T), te(e)));
    for (var n = e.first; n !== null;) {
      var r = n.next,
        s = (n.f & pe) !== 0 || (n.f & Y) !== 0;
      (Ct(n, s ? t : !1), (n = r));
    }
    if (e.transitions !== null) for (const f of e.transitions) (f.is_global || t) && f.in();
  }
}
function $r(e, t) {
  for (var n = e.nodes_start, r = e.nodes_end; n !== null;) {
    var s = n === r ? null : z(n);
    (t.append(n), (n = s));
  }
}
let V = !1;
function Te(e) {
  V = e;
}
let le = !1;
function st(e) {
  le = e;
}
let _ = null,
  D = !1;
function $(e) {
  _ = e;
}
let h = null;
function ie(e) {
  h = e;
}
let F = null;
function Mt(e) {
  _ !== null && (F === null ? (F = [e]) : F.push(e));
}
let b = null,
  A = 0,
  k = null;
function Dn(e) {
  k = e;
}
let Lt = 1,
  ve = 0,
  Q = ve;
function ft(e) {
  Q = e;
}
function Ft() {
  return ++Lt;
}
function oe(e) {
  var t = e.f;
  if ((t & T) !== 0) return !0;
  if ((t & E && (e.f &= ~ee), (t & P) !== 0)) {
    var n = e.deps;
    if (n !== null)
      for (var r = n.length, s = 0; s < r; s++) {
        var f = n[s];
        if ((oe(f) && mt(f), f.wv > e.wv)) return !0;
      }
    (t & N) !== 0 && R === null && y(e, m);
  }
  return !1;
}
function jt(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !F?.includes(e))
    for (var s = 0; s < r.length; s++) {
      var f = r[s];
      (f.f & E) !== 0 ? jt(f, t, !1) : t === f && (n ? y(f, T) : (f.f & m) !== 0 && y(f, P), te(f));
    }
}
function Yt(e) {
  var t = b,
    n = A,
    r = k,
    s = _,
    f = F,
    o = w,
    l = D,
    i = Q,
    a = e.f;
  ((b = null),
    (A = 0),
    (k = null),
    (_ = (a & (Y | re)) === 0 ? e : null),
    (F = null),
    we(e.ctx),
    (D = !1),
    (Q = ++ve),
    e.ac !== null &&
      (Xe(() => {
        e.ac.abort(se);
      }),
      (e.ac = null)));
  try {
    e.f |= Pe;
    var u = e.fn,
      v = u(),
      c = e.deps;
    if (b !== null) {
      var d;
      if ((Ae(e, A), c !== null && A > 0))
        for (c.length = A + b.length, d = 0; d < b.length; d++) c[A + d] = b[d];
      else e.deps = c = b;
      if (V && Ze() && (e.f & N) !== 0)
        for (d = A; d < c.length; d++) (c[d].reactions ??= []).push(e);
    } else c !== null && A < c.length && (Ae(e, A), (c.length = A));
    if (he() && k !== null && !D && c !== null && (e.f & (E | P | T)) === 0)
      for (d = 0; d < k.length; d++) jt(k[d], e);
    return (
      s !== null && s !== e && (ve++, k !== null && (r === null ? (r = k) : r.push(...k))),
      (e.f & U) !== 0 && (e.f ^= U),
      v
    );
  } catch (O) {
    return dn(O);
  } finally {
    ((e.f ^= Pe), (b = t), (A = n), (k = r), (_ = s), (F = f), we(o), (D = l), (Q = i));
  }
}
function In(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Vt.call(n, e);
    if (r !== -1) {
      var s = n.length - 1;
      s === 0 ? (n = t.reactions = null) : ((n[r] = n[s]), n.pop());
    }
  }
  n === null &&
    (t.f & E) !== 0 &&
    (b === null || !b.includes(t)) &&
    (y(t, P), (t.f & N) !== 0 && ((t.f ^= N), (t.f &= ~ee)), Et(t), Ae(t, 0));
}
function Ae(e, t) {
  var n = e.deps;
  if (n !== null) for (var r = t; r < n.length; r++) In(e, n[r]);
}
function ae(e) {
  var t = e.f;
  if ((t & H) === 0) {
    y(e, m);
    var n = h,
      r = V;
    ((h = e), (V = !0));
    try {
      ((t & j) !== 0 ? Sn(e) : Dt(e), Nt(e));
      var s = Yt(e);
      ((e.teardown = typeof s == 'function' ? s : null), (e.wv = Lt));
      var f;
    } finally {
      ((V = r), (h = n));
    }
  }
}
async function zr() {
  (await Promise.resolve(), Me());
}
function Xr() {
  return K.ensure().settled();
}
function W(e) {
  var t = e.f,
    n = (t & E) !== 0;
  if (_ !== null && !D) {
    var r = h !== null && (h.f & H) !== 0;
    if (!r && !F?.includes(e)) {
      var s = _.deps;
      if ((_.f & Pe) !== 0)
        e.rv < ve &&
          ((e.rv = ve),
          b === null && s !== null && s[A] === e
            ? A++
            : b === null
              ? (b = [e])
              : b.includes(e) || b.push(e));
      else {
        (_.deps ??= []).push(e);
        var f = e.reactions;
        f === null ? (e.reactions = [_]) : f.includes(_) || f.push(_);
      }
    }
  }
  if (le) {
    if (B.has(e)) return B.get(e);
    if (n) {
      var o = e,
        l = o.v;
      return ((((o.f & m) === 0 && o.reactions !== null) || Ht(o)) && (l = $e(o)), B.set(o, l), l);
    }
  } else n && !R?.has(e) && ((o = e), oe(o) && mt(o), V && Ze() && (o.f & N) === 0 && qt(o));
  if (R?.has(e)) return R.get(e);
  if ((e.f & U) !== 0) throw e.v;
  return e.v;
}
function qt(e) {
  if (e.deps !== null) {
    e.f ^= N;
    for (const t of e.deps)
      ((t.reactions ??= []).push(e), (t.f & E) !== 0 && (t.f & N) === 0 && qt(t));
  }
}
function Ht(e) {
  if (e.v === g) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps) if (B.has(t) || ((t.f & E) !== 0 && Ht(t))) return !0;
  return !1;
}
function Ut(e) {
  var t = D;
  try {
    return ((D = !0), e());
  } finally {
    D = t;
  }
}
const Pn = -7169;
function y(e, t) {
  e.f = (e.f & Pn) | t;
}
function Zr(e) {
  if (!(typeof e != 'object' || !e || e instanceof EventTarget)) {
    if (J in e) je(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == 'object' && n && J in n && je(n);
      }
  }
}
function je(e, t = new Set()) {
  if (typeof e == 'object' && e !== null && !(e instanceof EventTarget) && !t.has(e)) {
    (t.add(e), e instanceof Date && e.getTime());
    for (let r in e)
      try {
        je(e[r], t);
      } catch {}
    const n = it(e);
    if (
      n !== Object.prototype &&
      n !== Array.prototype &&
      n !== Map.prototype &&
      n !== Set.prototype &&
      n !== Date.prototype
    ) {
      const r = Gt(n);
      for (let s in r) {
        const f = r[s].get;
        if (f)
          try {
            f.call(e);
          } catch {}
      }
    }
  }
}
export {
  pe as $,
  Br as A,
  gr as B,
  Or as C,
  vr as D,
  Dr as E,
  Ze as F,
  ze as G,
  Ot as H,
  De as I,
  ht as J,
  h as K,
  Vr as L,
  _r as M,
  ut as N,
  on as O,
  K as P,
  ie as Q,
  $ as R,
  we as S,
  dn as T,
  _ as U,
  Fe as V,
  fe as W,
  dr as X,
  hr as Y,
  ye as Z,
  Kn as _,
  ge as a,
  Zn as a$,
  de as a0,
  qe as a1,
  ur as a2,
  Rr as a3,
  be as a4,
  ln as a5,
  z as a6,
  Ve as a7,
  cr as a8,
  Bn as a9,
  Jn as aA,
  nr as aB,
  kr as aC,
  Ln as aD,
  Xe as aE,
  St as aF,
  bn as aG,
  sr as aH,
  fr as aI,
  He as aJ,
  Be as aK,
  or as aL,
  Sr as aM,
  pn as aN,
  lr as aO,
  Pr as aP,
  g as aQ,
  An as aR,
  ir as aS,
  it as aT,
  qn as aU,
  Gt as aV,
  zn as aW,
  $n as aX,
  Wn as aY,
  Xn as aZ,
  I as a_,
  Tn as aa,
  Cn as ab,
  Yr as ac,
  un as ad,
  Ge as ae,
  lt as af,
  L as ag,
  Yn as ah,
  Me as ai,
  Mn as aj,
  Ar as ak,
  q as al,
  zr as am,
  Tr as an,
  pr as ao,
  qr as ap,
  J as aq,
  ce as ar,
  Gn as as,
  er as at,
  En as au,
  ue as av,
  le as aw,
  H as ax,
  tr as ay,
  Qn as az,
  Gr as b,
  Pt as b0,
  Nn as b1,
  he as b2,
  Rn as b3,
  Un as b4,
  ar as b5,
  cn as b6,
  j as b7,
  rr as b8,
  Fn as b9,
  Lr as ba,
  Ne as bb,
  Mr as bc,
  yr as bd,
  Er as be,
  nt as bf,
  Hr as bg,
  Ur as bh,
  xr as bi,
  Cr as bj,
  br as bk,
  Xr as bl,
  p as c,
  ne as d,
  x as e,
  w as f,
  ke as g,
  G as h,
  Ut as i,
  Bt as j,
  Vn as k,
  Xt as l,
  $r as m,
  jr as n,
  zt as o,
  On as p,
  jn as q,
  Kr as r,
  Ir as s,
  W as t,
  Fr as u,
  Zr as v,
  Ke as w,
  wr as x,
  mr as y,
  Nr as z
};
