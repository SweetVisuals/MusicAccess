import { a as T, P as U, D as j, b as L, e as z } from "./index-BWx1Mchx.js";
function G(R) {
  var s;
  const { char: q, allowSpaces: D, allowToIncludeChar: _, allowedPrefixes: f, startOfLine: B, $position: d } = R, E = D && !_, g = z(q), C = new RegExp(`\\s${g}$`), v = B ? "^" : "", I = _ ? "" : g, M = E ? new RegExp(`${v}${g}.*?(?=\\s${I}|$)`, "gm") : new RegExp(`${v}(?:^)?${g}[^\\s${I}]*`, "gm"), r = ((s = d.nodeBefore) === null || s === void 0 ? void 0 : s.isText) && d.nodeBefore.text;
  if (!r)
    return null;
  const e = d.pos - r.length, o = Array.from(r.matchAll(M)).pop();
  if (!o || o.input === void 0 || o.index === void 0)
    return null;
  const n = o.input.slice(Math.max(0, o.index - 1), o.index), i = new RegExp(`^[${f == null ? void 0 : f.join("")}\0]?$`).test(n);
  if (f !== null && !i)
    return null;
  const a = e + o.index;
  let l = a + o[0].length;
  return E && C.test(r.slice(l - 1, l + 1)) && (o[0] += " ", l += 1), a < d.pos && l >= d.pos ? {
    range: {
      from: a,
      to: l
    },
    query: o[0].slice(q.length),
    text: o[0]
  } : null;
}
const H = new T("suggestion");
function Q({ pluginKey: R = H, editor: s, char: q = "@", allowSpaces: D = !1, allowToIncludeChar: _ = !1, allowedPrefixes: f = [" "], startOfLine: B = !1, decorationTag: d = "span", decorationClass: E = "suggestion", command: g = () => null, items: C = () => [], render: v = () => ({}), allow: I = () => !0, findSuggestionMatch: M = G }) {
  let r;
  const e = v == null ? void 0 : v(), o = new U({
    key: R,
    view() {
      return {
        update: async (n, i) => {
          var a, l, u, p, m, y, x;
          const t = (a = this.key) === null || a === void 0 ? void 0 : a.getState(i), c = (l = this.key) === null || l === void 0 ? void 0 : l.getState(n.state), S = t.active && c.active && t.range.from !== c.range.from, b = !t.active && c.active, N = t.active && !c.active, k = !b && !N && t.query !== c.query, $ = b || S && k, P = k || S, A = N || S && k;
          if (!$ && !P && !A)
            return;
          const h = A && !$ ? t : c, F = n.dom.querySelector(`[data-decoration-id="${h.decorationId}"]`);
          r = {
            editor: s,
            range: h.range,
            query: h.query,
            text: h.text,
            items: [],
            command: (w) => g({
              editor: s,
              range: h.range,
              props: w
            }),
            decorationNode: F,
            // virtual node for popper.js or tippy.js
            // this can be used for building popups without a DOM node
            clientRect: F ? () => {
              var w;
              const { decorationId: O } = (w = this.key) === null || w === void 0 ? void 0 : w.getState(s.state), K = n.dom.querySelector(`[data-decoration-id="${O}"]`);
              return (K == null ? void 0 : K.getBoundingClientRect()) || null;
            } : null
          }, $ && ((u = e == null ? void 0 : e.onBeforeStart) === null || u === void 0 || u.call(e, r)), P && ((p = e == null ? void 0 : e.onBeforeUpdate) === null || p === void 0 || p.call(e, r)), (P || $) && (r.items = await C({
            editor: s,
            query: h.query
          })), A && ((m = e == null ? void 0 : e.onExit) === null || m === void 0 || m.call(e, r)), P && ((y = e == null ? void 0 : e.onUpdate) === null || y === void 0 || y.call(e, r)), $ && ((x = e == null ? void 0 : e.onStart) === null || x === void 0 || x.call(e, r));
        },
        destroy: () => {
          var n;
          r && ((n = e == null ? void 0 : e.onExit) === null || n === void 0 || n.call(e, r));
        }
      };
    },
    state: {
      // Initialize the plugin's internal state.
      init() {
        return {
          active: !1,
          range: {
            from: 0,
            to: 0
          },
          query: null,
          text: null,
          composing: !1
        };
      },
      // Apply changes to the plugin state from a view transaction.
      apply(n, i, a, l) {
        const { isEditable: u } = s, { composing: p } = s.view, { selection: m } = n, { empty: y, from: x } = m, t = { ...i };
        if (t.composing = p, u && (y || s.view.composing)) {
          (x < i.range.from || x > i.range.to) && !p && !i.composing && (t.active = !1);
          const c = M({
            char: q,
            allowSpaces: D,
            allowToIncludeChar: _,
            allowedPrefixes: f,
            startOfLine: B,
            $position: m.$from
          }), S = `id_${Math.floor(Math.random() * 4294967295)}`;
          c && I({
            editor: s,
            state: l,
            range: c.range,
            isActive: i.active
          }) ? (t.active = !0, t.decorationId = i.decorationId ? i.decorationId : S, t.range = c.range, t.query = c.query, t.text = c.text) : t.active = !1;
        } else
          t.active = !1;
        return t.active || (t.decorationId = null, t.range = { from: 0, to: 0 }, t.query = null, t.text = null), t;
      }
    },
    props: {
      // Call the keydown hook if suggestion is active.
      handleKeyDown(n, i) {
        var a;
        const { active: l, range: u } = o.getState(n.state);
        return l && ((a = e == null ? void 0 : e.onKeyDown) === null || a === void 0 ? void 0 : a.call(e, { view: n, event: i, range: u })) || !1;
      },
      // Setup decorator on the currently active suggestion.
      decorations(n) {
        const { active: i, range: a, decorationId: l } = o.getState(n);
        return i ? j.create(n.doc, [
          L.inline(a.from, a.to, {
            nodeName: d,
            class: E,
            "data-decoration-id": l
          })
        ]) : null;
      }
    }
  });
  return o;
}
export {
  Q as S
};
