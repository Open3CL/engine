import {
  L as k,
  $ as W,
  d as P,
  b as D,
  ap as G,
  h as N,
  j as X,
  aL as m,
  aM as x,
  aF as rr,
  aN as ir,
  t as fr,
  aO as er,
  a8 as V,
  aP as tr,
  aQ as ar,
  J as sr,
  aR as ur,
  aS as lr,
  aT as or,
  aU as cr,
  aV as nr
} from './B1hZYm7s.js';
import { B as vr } from './rOqi8yj0.js';
import { e as dr, g as br, j as gr, n as _r, k as hr } from './DCLGFrsA.js';
function jr(r, e, ...i) {
  var f = new vr(r);
  k(() => {
    const t = e() ?? null;
    f.ensure(t, t && ((a) => t(a, ...i)));
  }, W);
}
function pr(r, e) {
  var i = void 0,
    f;
  k(() => {
    i !== (i = e()) &&
      (f && (P(f), (f = null)),
      i &&
        (f = D(() => {
          G(() => i(r));
        })));
  });
}
function K(r) {
  var e,
    i,
    f = '';
  if (typeof r == 'string' || typeof r == 'number') f += r;
  else if (typeof r == 'object')
    if (Array.isArray(r)) {
      var t = r.length;
      for (e = 0; e < t; e++) r[e] && (i = K(r[e])) && (f && (f += ' '), (f += i));
    } else for (i in r) r[i] && (f && (f += ' '), (f += i));
  return f;
}
function Ar() {
  for (var r, e, i = 0, f = '', t = arguments.length; i < t; i++)
    (r = arguments[i]) && (e = K(r)) && (f && (f += ' '), (f += e));
  return f;
}
function Nr(r) {
  return typeof r == 'object' ? Ar(r) : (r ?? '');
}
const B = [
  ...` 	
\r\f \v\uFEFF`
];
function Sr(r, e, i) {
  var f = r == null ? '' : '' + r;
  if ((e && (f = f ? f + ' ' + e : e), i)) {
    for (var t in i)
      if (i[t]) f = f ? f + ' ' + t : t;
      else if (f.length)
        for (var a = t.length, l = 0; (l = f.indexOf(t, l)) >= 0;) {
          var c = l + a;
          (l === 0 || B.includes(f[l - 1])) && (c === f.length || B.includes(f[c]))
            ? (f = (l === 0 ? '' : f.substring(0, l)) + f.substring(c + 1))
            : (l = c);
        }
  }
  return f === '' ? null : f;
}
function F(r, e = !1) {
  var i = e ? ' !important;' : ';',
    f = '';
  for (var t in r) {
    var a = r[t];
    a != null && a !== '' && (f += ' ' + t + ': ' + a + i);
  }
  return f;
}
function M(r) {
  return r[0] !== '-' || r[1] !== '-' ? r.toLowerCase() : r;
}
function Tr(r, e) {
  if (e) {
    var i = '',
      f,
      t;
    if ((Array.isArray(e) ? ((f = e[0]), (t = e[1])) : (f = e), r)) {
      r = String(r)
        .replaceAll(/\s*\/\*.*?\*\/\s*/g, '')
        .trim();
      var a = !1,
        l = 0,
        c = !1,
        d = [];
      (f && d.push(...Object.keys(f).map(M)), t && d.push(...Object.keys(t).map(M)));
      var n = 0,
        _ = -1;
      const T = r.length;
      for (var v = 0; v < T; v++) {
        var s = r[v];
        if (
          (c
            ? s === '/' && r[v - 1] === '*' && (c = !1)
            : a
              ? a === s && (a = !1)
              : s === '/' && r[v + 1] === '*'
                ? (c = !0)
                : s === '"' || s === "'"
                  ? (a = s)
                  : s === '('
                    ? l++
                    : s === ')' && l--,
          !c && a === !1 && l === 0)
        ) {
          if (s === ':' && _ === -1) _ = v;
          else if (s === ';' || v === T - 1) {
            if (_ !== -1) {
              var S = M(r.substring(n, _).trim());
              if (!d.includes(S)) {
                s !== ';' && v++;
                var A = r.substring(n, v).trim();
                i += ' ' + A + ';';
              }
            }
            ((n = v + 1), (_ = -1));
          }
        }
      }
    }
    return (f && (i += F(f)), t && (i += F(t, !0)), (i = i.trim()), i === '' ? null : i);
  }
  return r == null ? null : String(r);
}
function Er(r, e, i, f, t, a) {
  var l = r.__className;
  if (N || l !== i || l === void 0) {
    var c = Sr(i, f, a);
    ((!N || c !== r.getAttribute('class')) &&
      (c == null ? r.removeAttribute('class') : e ? (r.className = c) : r.setAttribute('class', c)),
      (r.__className = i));
  } else if (a && t !== a)
    for (var d in a) {
      var n = !!a[d];
      (t == null || n !== !!t[d]) && r.classList.toggle(d, n);
    }
  return a;
}
function w(r, e = {}, i, f) {
  for (var t in i) {
    var a = i[t];
    e[t] !== a && (i[t] == null ? r.style.removeProperty(t) : r.style.setProperty(t, a, f));
  }
}
function Lr(r, e, i, f) {
  var t = r.__style;
  if (N || t !== e) {
    var a = Tr(e, f);
    ((!N || a !== r.getAttribute('style')) &&
      (a == null ? r.removeAttribute('style') : (r.style.cssText = a)),
      (r.__style = e));
  } else
    f && (Array.isArray(f) ? (w(r, i?.[0], f[0]), w(r, i?.[1], f[1], 'important')) : w(r, i, f));
  return f;
}
function j(r, e, i = !1) {
  if (r.multiple) {
    if (e == null) return;
    if (!X(e)) return m();
    for (var f of r.options) f.selected = e.includes(H(f));
    return;
  }
  for (f of r.options) {
    var t = H(f);
    if (x(t, e)) {
      f.selected = !0;
      return;
    }
  }
  (!i || e !== void 0) && (r.selectedIndex = -1);
}
function Or(r) {
  var e = new MutationObserver(() => {
    j(r, r.__value);
  });
  (e.observe(r, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ['value'] }),
    rr(() => {
      e.disconnect();
    }));
}
function H(r) {
  return '__value' in r ? r.__value : r.value;
}
const O = Symbol('class'),
  I = Symbol('style'),
  q = Symbol('is custom element'),
  z = Symbol('is html');
function Ir(r) {
  if (N) {
    var e = !1,
      i = () => {
        if (!e) {
          if (((e = !0), r.hasAttribute('value'))) {
            var f = r.value;
            (C(r, 'value', null), (r.value = f));
          }
          if (r.hasAttribute('checked')) {
            var t = r.checked;
            (C(r, 'checked', null), (r.checked = t));
          }
        }
      };
    ((r.__on_r = i), sr(i), ur());
  }
}
function kr(r, e) {
  var i = R(r);
  i.value === (i.value = e ?? void 0) ||
    (r.value === e && (e !== 0 || r.nodeName !== 'PROGRESS')) ||
    (r.value = e ?? '');
}
function Cr(r, e) {
  e ? r.hasAttribute('selected') || r.setAttribute('selected', '') : r.removeAttribute('selected');
}
function C(r, e, i, f) {
  var t = R(r);
  (N &&
    ((t[e] = r.getAttribute(e)),
    e === 'src' || e === 'srcset' || (e === 'href' && r.nodeName === 'LINK'))) ||
    (t[e] !== (t[e] = i) &&
      (e === 'loading' && (r[cr] = i),
      i == null
        ? r.removeAttribute(e)
        : typeof i != 'string' && J(r).includes(e)
          ? (r[e] = i)
          : r.setAttribute(e, i)));
}
function yr(r, e, i, f, t = !1, a = !1) {
  if (N && t && r.tagName === 'INPUT') {
    var l = r,
      c = l.type === 'checkbox' ? 'defaultChecked' : 'defaultValue';
    c in i || Ir(l);
  }
  var d = R(r),
    n = d[q],
    _ = !d[z];
  let v = N && n;
  v && V(!1);
  var s = e || {},
    S = r.tagName === 'OPTION';
  for (var A in e) A in i || (i[A] = null);
  (i.class ? (i.class = Nr(i.class)) : (f || i[O]) && (i.class = null), i[I] && (i.style ??= null));
  var T = J(r);
  for (const u in i) {
    let o = i[u];
    if (S && u === 'value' && o == null) {
      ((r.value = r.__value = ''), (s[u] = o));
      continue;
    }
    if (u === 'class') {
      var L = r.namespaceURI === 'http://www.w3.org/1999/xhtml';
      (Er(r, L, o, f, e?.[O], i[O]), (s[u] = o), (s[O] = i[O]));
      continue;
    }
    if (u === 'style') {
      (Lr(r, o, e?.[I], i[I]), (s[u] = o), (s[I] = i[I]));
      continue;
    }
    var h = s[u];
    if (!(o === h && !(o === void 0 && r.hasAttribute(u)))) {
      s[u] = o;
      var $ = u[0] + u[1];
      if ($ !== '$$')
        if ($ === 'on') {
          const p = {},
            E = '$$' + u;
          let b = u.slice(2);
          var y = hr(b);
          if ((dr(b) && ((b = b.slice(0, -7)), (p.capture = !0)), !y && h)) {
            if (o != null) continue;
            (r.removeEventListener(b, s[E], p), (s[E] = null));
          }
          if (o != null)
            if (y) ((r[`__${b}`] = o), gr([b]));
            else {
              let Q = function (Z) {
                s[u].call(this, Z);
              };
              s[E] = br(b, r, Q, p);
            }
          else y && (r[`__${b}`] = void 0);
        } else if (u === 'style') C(r, u, o);
        else if (u === 'autofocus') tr(r, !!o);
        else if (!n && (u === '__value' || (u === 'value' && o != null))) r.value = r.__value = o;
        else if (u === 'selected' && S) Cr(r, o);
        else {
          var g = u;
          _ || (g = _r(g));
          var U = g === 'defaultValue' || g === 'defaultChecked';
          if (o == null && !n && !U)
            if (((d[u] = null), g === 'value' || g === 'checked')) {
              let p = r;
              const E = e === void 0;
              if (g === 'value') {
                let b = p.defaultValue;
                (p.removeAttribute(g), (p.defaultValue = b), (p.value = p.__value = E ? b : null));
              } else {
                let b = p.defaultChecked;
                (p.removeAttribute(g), (p.defaultChecked = b), (p.checked = E ? b : !1));
              }
            } else r.removeAttribute(u);
          else
            U || (T.includes(g) && (n || typeof o != 'string'))
              ? ((r[g] = o), g in d && (d[g] = ar))
              : typeof o != 'function' && C(r, g, o);
        }
    }
  }
  return (v && V(!0), s);
}
function Rr(r, e, i = [], f = [], t = [], a, l = !1, c = !1) {
  ir(t, i, f, (d) => {
    var n = void 0,
      _ = {},
      v = r.nodeName === 'SELECT',
      s = !1;
    if (
      (k(() => {
        var A = e(...d.map(fr)),
          T = yr(r, n, A, a, l, c);
        s && v && 'value' in A && j(r, A.value);
        for (let h of Object.getOwnPropertySymbols(_)) A[h] || P(_[h]);
        for (let h of Object.getOwnPropertySymbols(A)) {
          var L = A[h];
          (h.description === er &&
            (!n || L !== n[h]) &&
            (_[h] && P(_[h]), (_[h] = D(() => pr(r, () => L)))),
            (T[h] = L));
        }
        n = T;
      }),
      v)
    ) {
      var S = r;
      G(() => {
        (j(S, n.value, !0), Or(S));
      });
    }
    s = !0;
  });
}
function R(r) {
  return (r.__attributes ??= { [q]: r.nodeName.includes('-'), [z]: r.namespaceURI === lr });
}
var Y = new Map();
function J(r) {
  var e = r.getAttribute('is') || r.nodeName,
    i = Y.get(e);
  if (i) return i;
  Y.set(e, (i = []));
  for (var f, t = r, a = Element.prototype; a !== t;) {
    f = nr(t);
    for (var l in f) f[l].set && i.push(l);
    t = or(t);
  }
  return i;
}
export { O as C, C as a, Rr as b, Ar as c, Nr as d, Er as e, Lr as f, kr as g, Ir as r, jr as s };
