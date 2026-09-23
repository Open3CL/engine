import {
  aj as M,
  R as y,
  Q as N,
  U as A,
  K as w,
  J as x,
  aE as I,
  aF as P,
  a4 as d,
  aG as C,
  a as g,
  aH as k,
  aI as O,
  h as _,
  e as c,
  aJ as R,
  M as D,
  aK as F,
  W as V
} from './B1hZYm7s.js';
function z(e) {
  return e.endsWith('capture') && e !== 'gotpointercapture' && e !== 'lostpointercapture';
}
const W = [
  'beforeinput',
  'click',
  'change',
  'dblclick',
  'contextmenu',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'touchend',
  'touchmove',
  'touchstart'
];
function Q(e) {
  return W.includes(e);
}
const j = {
  formnovalidate: 'formNoValidate',
  ismap: 'isMap',
  nomodule: 'noModule',
  playsinline: 'playsInline',
  readonly: 'readOnly',
  defaultvalue: 'defaultValue',
  defaultchecked: 'defaultChecked',
  srcobject: 'srcObject',
  novalidate: 'noValidate',
  allowfullscreen: 'allowFullscreen',
  disablepictureinpicture: 'disablePictureInPicture',
  disableremoteplayback: 'disableRemotePlayback'
};
function Y(e) {
  return ((e = e.toLowerCase()), j[e] ?? e);
}
const B = ['touchstart', 'touchmove'];
function Z(e) {
  return B.includes(e);
}
const U = ['textarea', 'script', 'style', 'title'];
function ee(e) {
  return U.includes(e);
}
const G = new Set(),
  H = new Set();
function $(e, t, r, i = {}) {
  function n(a) {
    if ((i.capture || q.call(t, a), !a.cancelBubble)) return I(() => r?.call(this, a));
  }
  return (
    e.startsWith('pointer') || e.startsWith('touch') || e === 'wheel'
      ? x(() => {
          t.addEventListener(e, n, i);
        })
      : t.addEventListener(e, n, i),
    n
  );
}
function te(e, t, r, i, n) {
  var a = { capture: i, passive: n },
    o = $(e, t, r, a);
  (t === document.body || t === window || t === document || t instanceof HTMLMediaElement) &&
    P(() => {
      t.removeEventListener(e, o, a);
    });
}
function re(e) {
  for (var t = 0; t < e.length; t++) G.add(e[t]);
  for (var r of H) r(e);
}
let S = null;
function q(e) {
  var t = this,
    r = t.ownerDocument,
    i = e.type,
    n = e.composedPath?.() || [],
    a = n[0] || e.target;
  S = e;
  var o = 0,
    f = S === e && e.__root;
  if (f) {
    var u = n.indexOf(f);
    if (u !== -1 && (t === document || t === window)) {
      e.__root = t;
      return;
    }
    var l = n.indexOf(t);
    if (l === -1) return;
    u <= l && (o = u);
  }
  if (((a = n[o] || e.target), a !== t)) {
    M(e, 'currentTarget', {
      configurable: !0,
      get() {
        return a || r;
      }
    });
    var h = A,
      m = w;
    (y(null), N(null));
    try {
      for (var v, T = []; a !== null;) {
        var E = a.assignedSlot || a.parentNode || a.host || null;
        try {
          var b = a['__' + i];
          b != null && (!a.disabled || e.target === a) && b.call(a, e);
        } catch (p) {
          v ? T.push(p) : (v = p);
        }
        if (e.cancelBubble || E === t || E === null) break;
        a = E;
      }
      if (v) {
        for (let p of T)
          queueMicrotask(() => {
            throw p;
          });
        throw v;
      }
    } finally {
      ((e.__root = t), delete e.currentTarget, y(h), N(m));
    }
  }
}
function L(e) {
  var t = document.createElement('template');
  return ((t.innerHTML = e.replaceAll('<!>', '<!---->')), t.content);
}
function s(e, t) {
  var r = w;
  r.nodes_start === null && ((r.nodes_start = e), (r.nodes_end = t));
}
function ae(e, t) {
  var r = (t & k) !== 0,
    i = (t & O) !== 0,
    n,
    a = !e.startsWith('<!>');
  return () => {
    if (_) return (s(c, null), c);
    n === void 0 && ((n = L(a ? e : '<!>' + e)), r || (n = d(n)));
    var o = i || C ? document.importNode(n, !0) : n.cloneNode(!0);
    if (r) {
      var f = d(o),
        u = o.lastChild;
      s(f, u);
    } else s(o, o);
    return o;
  };
}
function J(e, t, r = 'svg') {
  var i = !e.startsWith('<!>'),
    n = (t & k) !== 0,
    a = `<${r}>${i ? e : '<!>' + e}</${r}>`,
    o;
  return () => {
    if (_) return (s(c, null), c);
    if (!o) {
      var f = L(a),
        u = d(f);
      if (n) for (o = document.createDocumentFragment(); d(u);) o.appendChild(d(u));
      else o = d(u);
    }
    var l = o.cloneNode(!0);
    if (n) {
      var h = d(l),
        m = l.lastChild;
      s(h, m);
    } else s(l, l);
    return l;
  };
}
function ne(e, t) {
  return J(e, t, 'svg');
}
function oe(e = '') {
  if (!_) {
    var t = g(e + '');
    return (s(t, t), t);
  }
  var r = c;
  return (r.nodeType !== F && (r.before((r = g())), V(r)), s(r, r), r);
}
function ie() {
  if (_) return (s(c, null), c);
  var e = document.createDocumentFragment(),
    t = document.createComment(''),
    r = g();
  return (e.append(t, r), s(t, r), e);
}
function se(e, t) {
  if (_) {
    var r = w;
    (((r.f & R) === 0 || r.nodes_end === null) && (r.nodes_end = c), D());
    return;
  }
  e !== null && e.before(t);
}
const K = '5';
typeof window < 'u' && ((window.__svelte ??= {}).v ??= new Set()).add(K);
export {
  se as a,
  G as b,
  s as c,
  ie as d,
  z as e,
  ae as f,
  $ as g,
  q as h,
  Z as i,
  re as j,
  Q as k,
  L as l,
  ee as m,
  Y as n,
  ne as o,
  te as p,
  H as r,
  oe as t
};
