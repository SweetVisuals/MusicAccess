import { P as ue, a as ae, j as de, i as le, p as ce, E as he, k as fe, l as pe, o as me } from "./index-BWx1Mchx.js";
import ve from "tippy.js";
import g, { useRef as Se, useState as F, useDebugValue as k, useEffect as K, forwardRef as ye, useLayoutEffect as Ee, useContext as ee, createContext as te, createRef as _e, memo as ge, createElement as be, version as q } from "react";
import Oe, { flushSync as we } from "react-dom";
class De {
  constructor({ editor: e, element: t, view: r, tippyOptions: i = {}, updateDelay: o = 250, shouldShow: h }) {
    this.preventHide = !1, this.shouldShow = ({ view: s, state: f, from: l, to: d }) => {
      const { doc: u, selection: p } = f, { empty: m } = p, y = !u.textBetween(l, d).length && de(f.selection), S = this.element.contains(document.activeElement);
      return !(!(s.hasFocus() || S) || m || y || !this.editor.isEditable);
    }, this.mousedownHandler = () => {
      this.preventHide = !0;
    }, this.dragstartHandler = () => {
      this.hide();
    }, this.focusHandler = () => {
      setTimeout(() => this.update(this.editor.view));
    }, this.blurHandler = ({ event: s }) => {
      var f;
      if (this.preventHide) {
        this.preventHide = !1;
        return;
      }
      s != null && s.relatedTarget && (!((f = this.element.parentNode) === null || f === void 0) && f.contains(s.relatedTarget)) || (s == null ? void 0 : s.relatedTarget) !== this.editor.view.dom && this.hide();
    }, this.tippyBlurHandler = (s) => {
      this.blurHandler({ event: s });
    }, this.handleDebouncedUpdate = (s, f) => {
      const l = !(f != null && f.selection.eq(s.state.selection)), d = !(f != null && f.doc.eq(s.state.doc));
      !l && !d || (this.updateDebounceTimer && clearTimeout(this.updateDebounceTimer), this.updateDebounceTimer = window.setTimeout(() => {
        this.updateHandler(s, l, d, f);
      }, this.updateDelay));
    }, this.updateHandler = (s, f, l, d) => {
      var u, p, m;
      const { state: y, composing: S } = s, { selection: E } = y;
      if (S || !f && !l)
        return;
      this.createTooltip();
      const { ranges: D } = E, v = Math.min(...D.map((a) => a.$from.pos)), c = Math.max(...D.map((a) => a.$to.pos));
      if (!((u = this.shouldShow) === null || u === void 0 ? void 0 : u.call(this, {
        editor: this.editor,
        element: this.element,
        view: s,
        state: y,
        oldState: d,
        from: v,
        to: c
      }))) {
        this.hide();
        return;
      }
      (p = this.tippy) === null || p === void 0 || p.setProps({
        getReferenceClientRect: ((m = this.tippyOptions) === null || m === void 0 ? void 0 : m.getReferenceClientRect) || (() => {
          if (le(y.selection)) {
            let a = s.nodeDOM(v);
            if (a) {
              const _ = a.dataset.nodeViewWrapper ? a : a.querySelector("[data-node-view-wrapper]");
              if (_ && (a = _.firstChild), a)
                return a.getBoundingClientRect();
            }
          }
          return ce(s, v, c);
        })
      }), this.show();
    }, this.editor = e, this.element = t, this.view = r, this.updateDelay = o, h && (this.shouldShow = h), this.element.addEventListener("mousedown", this.mousedownHandler, { capture: !0 }), this.view.dom.addEventListener("dragstart", this.dragstartHandler), this.editor.on("focus", this.focusHandler), this.editor.on("blur", this.blurHandler), this.tippyOptions = i, this.element.remove(), this.element.style.visibility = "visible";
  }
  createTooltip() {
    const { element: e } = this.editor.options, t = !!e.parentElement;
    this.tippy || !t || (this.tippy = ve(e, {
      duration: 0,
      getReferenceClientRect: null,
      content: this.element,
      interactive: !0,
      trigger: "manual",
      placement: "top",
      hideOnClick: "toggle",
      ...this.tippyOptions
    }), this.tippy.popper.firstChild && this.tippy.popper.firstChild.addEventListener("blur", this.tippyBlurHandler));
  }
  update(e, t) {
    const { state: r } = e, i = r.selection.from !== r.selection.to;
    if (this.updateDelay > 0 && i) {
      this.handleDebouncedUpdate(e, t);
      return;
    }
    const o = !(t != null && t.selection.eq(e.state.selection)), h = !(t != null && t.doc.eq(e.state.doc));
    this.updateHandler(e, o, h, t);
  }
  show() {
    var e;
    (e = this.tippy) === null || e === void 0 || e.show();
  }
  hide() {
    var e;
    (e = this.tippy) === null || e === void 0 || e.hide();
  }
  destroy() {
    var e, t;
    !((e = this.tippy) === null || e === void 0) && e.popper.firstChild && this.tippy.popper.firstChild.removeEventListener("blur", this.tippyBlurHandler), (t = this.tippy) === null || t === void 0 || t.destroy(), this.element.removeEventListener("mousedown", this.mousedownHandler, { capture: !0 }), this.view.dom.removeEventListener("dragstart", this.dragstartHandler), this.editor.off("focus", this.focusHandler), this.editor.off("blur", this.blurHandler);
  }
}
const ne = (n) => new ue({
  key: typeof n.pluginKey == "string" ? new ae(n.pluginKey) : n.pluginKey,
  view: (e) => new De({ view: e, ...n })
});
he.create({
  name: "bubbleMenu",
  addOptions() {
    return {
      element: null,
      tippyOptions: {},
      pluginKey: "bubbleMenu",
      updateDelay: void 0,
      shouldShow: null
    };
  },
  addProseMirrorPlugins() {
    return this.options.element ? [
      ne({
        pluginKey: this.options.pluginKey,
        editor: this.editor,
        element: this.options.element,
        tippyOptions: this.options.tippyOptions,
        updateDelay: this.options.updateDelay,
        shouldShow: this.options.shouldShow
      })
    ] : [];
  }
});
function Ce(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var P = { exports: {} }, I = {};
/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var z;
function Re() {
  if (z) return I;
  z = 1;
  var n = g;
  function e(u, p) {
    return u === p && (u !== 0 || 1 / u === 1 / p) || u !== u && p !== p;
  }
  var t = typeof Object.is == "function" ? Object.is : e, r = n.useState, i = n.useEffect, o = n.useLayoutEffect, h = n.useDebugValue;
  function s(u, p) {
    var m = p(), y = r({ inst: { value: m, getSnapshot: p } }), S = y[0].inst, E = y[1];
    return o(function() {
      S.value = m, S.getSnapshot = p, f(S) && E({ inst: S });
    }, [u, m, p]), i(function() {
      return f(S) && E({ inst: S }), u(function() {
        f(S) && E({ inst: S });
      });
    }, [u]), h(m), m;
  }
  function f(u) {
    var p = u.getSnapshot;
    u = u.value;
    try {
      var m = p();
      return !t(u, m);
    } catch {
      return !0;
    }
  }
  function l(u, p) {
    return p();
  }
  var d = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? l : s;
  return I.useSyncExternalStore = n.useSyncExternalStore !== void 0 ? n.useSyncExternalStore : d, I;
}
var H = {};
/**
 * @license React
 * use-sync-external-store-shim.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var G;
function Te() {
  return G || (G = 1, process.env.NODE_ENV !== "production" && function() {
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
    var n = g, e = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function t(v) {
      {
        for (var c = arguments.length, b = new Array(c > 1 ? c - 1 : 0), a = 1; a < c; a++)
          b[a - 1] = arguments[a];
        r("error", v, b);
      }
    }
    function r(v, c, b) {
      {
        var a = e.ReactDebugCurrentFrame, _ = a.getStackAddendum();
        _ !== "" && (c += "%s", b = b.concat([_]));
        var w = b.map(function(O) {
          return String(O);
        });
        w.unshift("Warning: " + c), Function.prototype.apply.call(console[v], console, w);
      }
    }
    function i(v, c) {
      return v === c && (v !== 0 || 1 / v === 1 / c) || v !== v && c !== c;
    }
    var o = typeof Object.is == "function" ? Object.is : i, h = n.useState, s = n.useEffect, f = n.useLayoutEffect, l = n.useDebugValue, d = !1, u = !1;
    function p(v, c, b) {
      d || n.startTransition !== void 0 && (d = !0, t("You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."));
      var a = c();
      if (!u) {
        var _ = c();
        o(a, _) || (t("The result of getSnapshot should be cached to avoid an infinite loop"), u = !0);
      }
      var w = h({
        inst: {
          value: a,
          getSnapshot: c
        }
      }), O = w[0].inst, R = w[1];
      return f(function() {
        O.value = a, O.getSnapshot = c, m(O) && R({
          inst: O
        });
      }, [v, a, c]), s(function() {
        m(O) && R({
          inst: O
        });
        var L = function() {
          m(O) && R({
            inst: O
          });
        };
        return v(L);
      }, [v]), l(a), a;
    }
    function m(v) {
      var c = v.getSnapshot, b = v.value;
      try {
        var a = c();
        return !o(b, a);
      } catch {
        return !0;
      }
    }
    function y(v, c, b) {
      return c();
    }
    var S = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", E = !S, C = E ? y : p, D = n.useSyncExternalStore !== void 0 ? n.useSyncExternalStore : C;
    H.useSyncExternalStore = D, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
  }()), H;
}
process.env.NODE_ENV === "production" ? P.exports = Re() : P.exports = Te();
var M = P.exports;
const Me = (...n) => (e) => {
  n.forEach((t) => {
    typeof t == "function" ? t(e) : t && (t.current = e);
  });
}, Le = ({ contentComponent: n }) => {
  const e = M.useSyncExternalStore(n.subscribe, n.getSnapshot, n.getServerSnapshot);
  return g.createElement(g.Fragment, null, Object.values(e));
};
function Ae() {
  const n = /* @__PURE__ */ new Set();
  let e = {};
  return {
    /**
     * Subscribe to the editor instance's changes.
     */
    subscribe(t) {
      return n.add(t), () => {
        n.delete(t);
      };
    },
    getSnapshot() {
      return e;
    },
    getServerSnapshot() {
      return e;
    },
    /**
     * Adds a new NodeView Renderer to the editor.
     */
    setRenderer(t, r) {
      e = {
        ...e,
        [t]: Oe.createPortal(r.reactElement, r.element, t)
      }, n.forEach((i) => i());
    },
    /**
     * Removes a NodeView Renderer from the editor.
     */
    removeRenderer(t) {
      const r = { ...e };
      delete r[t], e = r, n.forEach((i) => i());
    }
  };
}
class Ne extends g.Component {
  constructor(e) {
    var t;
    super(e), this.editorContentRef = g.createRef(), this.initialized = !1, this.state = {
      hasContentComponentInitialized: !!(!((t = e.editor) === null || t === void 0) && t.contentComponent)
    };
  }
  componentDidMount() {
    this.init();
  }
  componentDidUpdate() {
    this.init();
  }
  init() {
    const e = this.props.editor;
    if (e && !e.isDestroyed && e.options.element) {
      if (e.contentComponent)
        return;
      const t = this.editorContentRef.current;
      t.append(...e.options.element.childNodes), e.setOptions({
        element: t
      }), e.contentComponent = Ae(), this.state.hasContentComponentInitialized || (this.unsubscribeToContentComponent = e.contentComponent.subscribe(() => {
        this.setState((r) => r.hasContentComponentInitialized ? r : {
          hasContentComponentInitialized: !0
        }), this.unsubscribeToContentComponent && this.unsubscribeToContentComponent();
      })), e.createNodeViews(), this.initialized = !0;
    }
  }
  componentWillUnmount() {
    const e = this.props.editor;
    if (!e || (this.initialized = !1, e.isDestroyed || e.view.setProps({
      nodeViews: {}
    }), this.unsubscribeToContentComponent && this.unsubscribeToContentComponent(), e.contentComponent = null, !e.options.element.firstChild))
      return;
    const t = document.createElement("div");
    t.append(...e.options.element.childNodes), e.setOptions({
      element: t
    });
  }
  render() {
    const { editor: e, innerRef: t, ...r } = this.props;
    return g.createElement(
      g.Fragment,
      null,
      g.createElement("div", { ref: Me(t, this.editorContentRef), ...r }),
      (e == null ? void 0 : e.contentComponent) && g.createElement(Le, { contentComponent: e.contentComponent })
    );
  }
}
const xe = ye((n, e) => {
  const t = g.useMemo(() => Math.floor(Math.random() * 4294967295).toString(), [n.editor]);
  return g.createElement(Ne, {
    key: t,
    innerRef: e,
    ...n
  });
}), tt = g.memo(xe);
var Ve = function n(e, t) {
  if (e === t) return !0;
  if (e && t && typeof e == "object" && typeof t == "object") {
    if (e.constructor !== t.constructor) return !1;
    var r, i, o;
    if (Array.isArray(e)) {
      if (r = e.length, r != t.length) return !1;
      for (i = r; i-- !== 0; )
        if (!n(e[i], t[i])) return !1;
      return !0;
    }
    if (e instanceof Map && t instanceof Map) {
      if (e.size !== t.size) return !1;
      for (i of e.entries())
        if (!t.has(i[0])) return !1;
      for (i of e.entries())
        if (!n(i[1], t.get(i[0]))) return !1;
      return !0;
    }
    if (e instanceof Set && t instanceof Set) {
      if (e.size !== t.size) return !1;
      for (i of e.entries())
        if (!t.has(i[0])) return !1;
      return !0;
    }
    if (ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) {
      if (r = e.length, r != t.length) return !1;
      for (i = r; i-- !== 0; )
        if (e[i] !== t[i]) return !1;
      return !0;
    }
    if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
    if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === t.valueOf();
    if (e.toString !== Object.prototype.toString) return e.toString() === t.toString();
    if (o = Object.keys(e), r = o.length, r !== Object.keys(t).length) return !1;
    for (i = r; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(t, o[i])) return !1;
    for (i = r; i-- !== 0; ) {
      var h = o[i];
      if (!(h === "_owner" && e.$$typeof) && !n(e[h], t[h]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}, Ie = /* @__PURE__ */ Ce(Ve), U = { exports: {} }, B = {};
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var J;
function He() {
  if (J) return B;
  J = 1;
  var n = g, e = M;
  function t(l, d) {
    return l === d && (l !== 0 || 1 / l === 1 / d) || l !== l && d !== d;
  }
  var r = typeof Object.is == "function" ? Object.is : t, i = e.useSyncExternalStore, o = n.useRef, h = n.useEffect, s = n.useMemo, f = n.useDebugValue;
  return B.useSyncExternalStoreWithSelector = function(l, d, u, p, m) {
    var y = o(null);
    if (y.current === null) {
      var S = { hasValue: !1, value: null };
      y.current = S;
    } else S = y.current;
    y = s(function() {
      function C(a) {
        if (!D) {
          if (D = !0, v = a, a = p(a), m !== void 0 && S.hasValue) {
            var _ = S.value;
            if (m(_, a)) return c = _;
          }
          return c = a;
        }
        if (_ = c, r(v, a)) return _;
        var w = p(a);
        return m !== void 0 && m(_, w) ? _ : (v = a, c = w);
      }
      var D = !1, v, c, b = u === void 0 ? null : u;
      return [function() {
        return C(d());
      }, b === null ? void 0 : function() {
        return C(b());
      }];
    }, [d, u, p, m]);
    var E = i(l, y[0], y[1]);
    return h(function() {
      S.hasValue = !0, S.value = E;
    }, [E]), f(E), E;
  }, B;
}
var j = {};
/**
 * @license React
 * use-sync-external-store-shim/with-selector.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Y;
function Be() {
  return Y || (Y = 1, process.env.NODE_ENV !== "production" && function() {
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
    var n = g, e = M;
    function t(d, u) {
      return d === u && (d !== 0 || 1 / d === 1 / u) || d !== d && u !== u;
    }
    var r = typeof Object.is == "function" ? Object.is : t, i = e.useSyncExternalStore, o = n.useRef, h = n.useEffect, s = n.useMemo, f = n.useDebugValue;
    function l(d, u, p, m, y) {
      var S = o(null), E;
      S.current === null ? (E = {
        hasValue: !1,
        value: null
      }, S.current = E) : E = S.current;
      var C = s(function() {
        var b = !1, a, _, w = function(T) {
          if (!b) {
            b = !0, a = T;
            var A = m(T);
            if (y !== void 0 && E.hasValue) {
              var N = E.value;
              if (y(N, A))
                return _ = N, N;
            }
            return _ = A, A;
          }
          var se = a, x = _;
          if (r(se, T))
            return x;
          var V = m(T);
          return y !== void 0 && y(x, V) ? x : (a = T, _ = V, V);
        }, O = p === void 0 ? null : p, R = function() {
          return w(u());
        }, L = O === null ? void 0 : function() {
          return w(O());
        };
        return [R, L];
      }, [u, p, m, y]), D = C[0], v = C[1], c = i(d, D, v);
      return h(function() {
        E.hasValue = !0, E.value = c;
      }, [c]), f(c), c;
    }
    j.useSyncExternalStoreWithSelector = l, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
  }()), j;
}
process.env.NODE_ENV === "production" ? U.exports = He() : U.exports = Be();
var je = U.exports;
const Pe = typeof window < "u" ? Ee : K;
class Ue {
  constructor(e) {
    this.transactionNumber = 0, this.lastTransactionNumber = 0, this.subscribers = /* @__PURE__ */ new Set(), this.editor = e, this.lastSnapshot = { editor: e, transactionNumber: 0 }, this.getSnapshot = this.getSnapshot.bind(this), this.getServerSnapshot = this.getServerSnapshot.bind(this), this.watch = this.watch.bind(this), this.subscribe = this.subscribe.bind(this);
  }
  /**
   * Get the current editor instance.
   */
  getSnapshot() {
    return this.transactionNumber === this.lastTransactionNumber ? this.lastSnapshot : (this.lastTransactionNumber = this.transactionNumber, this.lastSnapshot = { editor: this.editor, transactionNumber: this.transactionNumber }, this.lastSnapshot);
  }
  /**
   * Always disable the editor on the server-side.
   */
  getServerSnapshot() {
    return { editor: null, transactionNumber: 0 };
  }
  /**
   * Subscribe to the editor instance's changes.
   */
  subscribe(e) {
    return this.subscribers.add(e), () => {
      this.subscribers.delete(e);
    };
  }
  /**
   * Watch the editor instance for changes.
   */
  watch(e) {
    if (this.editor = e, this.editor) {
      const t = () => {
        this.transactionNumber += 1, this.subscribers.forEach((i) => i());
      }, r = this.editor;
      return r.on("transaction", t), () => {
        r.off("transaction", t);
      };
    }
  }
}
function $e(n) {
  var e;
  const [t] = F(() => new Ue(n.editor)), r = je.useSyncExternalStoreWithSelector(t.subscribe, t.getSnapshot, t.getServerSnapshot, n.selector, (e = n.equalityFn) !== null && e !== void 0 ? e : Ie);
  return Pe(() => t.watch(n.editor), [n.editor, t]), k(r), r;
}
const Q = process.env.NODE_ENV !== "production", $ = typeof window > "u", Fe = $ || !!(typeof window < "u" && window.next);
class W {
  constructor(e) {
    this.editor = null, this.subscriptions = /* @__PURE__ */ new Set(), this.isComponentMounted = !1, this.previousDeps = null, this.instanceId = "", this.options = e, this.subscriptions = /* @__PURE__ */ new Set(), this.setEditor(this.getInitialEditor()), this.scheduleDestroy(), this.getEditor = this.getEditor.bind(this), this.getServerSnapshot = this.getServerSnapshot.bind(this), this.subscribe = this.subscribe.bind(this), this.refreshEditorInstance = this.refreshEditorInstance.bind(this), this.scheduleDestroy = this.scheduleDestroy.bind(this), this.onRender = this.onRender.bind(this), this.createEditor = this.createEditor.bind(this);
  }
  setEditor(e) {
    this.editor = e, this.instanceId = Math.random().toString(36).slice(2, 9), this.subscriptions.forEach((t) => t());
  }
  getInitialEditor() {
    if (this.options.current.immediatelyRender === void 0)
      return $ || Fe ? (Q && console.warn("Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false` to avoid hydration mismatches."), null) : this.createEditor();
    if (this.options.current.immediatelyRender && $ && Q)
      throw new Error("Tiptap Error: SSR has been detected, and `immediatelyRender` has been set to `true` this is an unsupported configuration that may result in errors, explicitly set `immediatelyRender` to `false` to avoid hydration mismatches.");
    return this.options.current.immediatelyRender ? this.createEditor() : null;
  }
  /**
   * Create a new editor instance. And attach event listeners.
   */
  createEditor() {
    const e = {
      ...this.options.current,
      // Always call the most recent version of the callback function by default
      onBeforeCreate: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onBeforeCreate) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onBlur: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onBlur) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onCreate: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onCreate) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onDestroy: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onDestroy) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onFocus: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onFocus) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onSelectionUpdate: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onSelectionUpdate) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onTransaction: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onTransaction) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onUpdate: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onUpdate) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onContentError: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onContentError) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onDrop: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onDrop) === null || o === void 0 ? void 0 : o.call(i, ...r);
      },
      onPaste: (...r) => {
        var i, o;
        return (o = (i = this.options.current).onPaste) === null || o === void 0 ? void 0 : o.call(i, ...r);
      }
    };
    return new fe(e);
  }
  /**
   * Get the current editor instance.
   */
  getEditor() {
    return this.editor;
  }
  /**
   * Always disable the editor on the server-side.
   */
  getServerSnapshot() {
    return null;
  }
  /**
   * Subscribe to the editor instance's changes.
   */
  subscribe(e) {
    return this.subscriptions.add(e), () => {
      this.subscriptions.delete(e);
    };
  }
  static compareOptions(e, t) {
    return Object.keys(e).every((r) => ["onCreate", "onBeforeCreate", "onDestroy", "onUpdate", "onTransaction", "onFocus", "onBlur", "onSelectionUpdate", "onContentError", "onDrop", "onPaste"].includes(r) ? !0 : r === "extensions" && e.extensions && t.extensions ? e.extensions.length !== t.extensions.length ? !1 : e.extensions.every((i, o) => {
      var h;
      return i === ((h = t.extensions) === null || h === void 0 ? void 0 : h[o]);
    }) : e[r] === t[r]);
  }
  /**
   * On each render, we will create, update, or destroy the editor instance.
   * @param deps The dependencies to watch for changes
   * @returns A cleanup function
   */
  onRender(e) {
    return () => (this.isComponentMounted = !0, clearTimeout(this.scheduledDestructionTimeout), this.editor && !this.editor.isDestroyed && e.length === 0 ? W.compareOptions(this.options.current, this.editor.options) || this.editor.setOptions({
      ...this.options.current,
      editable: this.editor.isEditable
    }) : this.refreshEditorInstance(e), () => {
      this.isComponentMounted = !1, this.scheduleDestroy();
    });
  }
  /**
   * Recreate the editor instance if the dependencies have changed.
   */
  refreshEditorInstance(e) {
    if (this.editor && !this.editor.isDestroyed) {
      if (this.previousDeps === null) {
        this.previousDeps = e;
        return;
      }
      if (this.previousDeps.length === e.length && this.previousDeps.every((r, i) => r === e[i]))
        return;
    }
    this.editor && !this.editor.isDestroyed && this.editor.destroy(), this.setEditor(this.createEditor()), this.previousDeps = e;
  }
  /**
   * Schedule the destruction of the editor instance.
   * This will only destroy the editor if it was not mounted on the next tick.
   * This is to avoid destroying the editor instance when it's actually still mounted.
   */
  scheduleDestroy() {
    const e = this.instanceId, t = this.editor;
    this.scheduledDestructionTimeout = setTimeout(() => {
      if (this.isComponentMounted && this.instanceId === e) {
        t && t.setOptions(this.options.current);
        return;
      }
      t && !t.isDestroyed && (t.destroy(), this.instanceId === e && this.setEditor(null));
    }, 1);
  }
}
function nt(n = {}, e = []) {
  const t = Se(n);
  t.current = n;
  const [r] = F(() => new W(t)), i = M.useSyncExternalStore(r.subscribe, r.getEditor, r.getServerSnapshot);
  return k(i), K(r.onRender(e)), $e({
    editor: i,
    selector: ({ transactionNumber: o }) => n.shouldRerenderOnTransaction === !1 ? null : n.immediatelyRender && o === 0 ? 0 : o + 1
  }), i;
}
const re = te({
  editor: null
});
re.Consumer;
const Ke = () => ee(re), rt = (n) => {
  const [e, t] = F(null), { editor: r } = Ke();
  return K(() => {
    var i;
    if (!e || !((i = n.editor) === null || i === void 0) && i.isDestroyed || r != null && r.isDestroyed)
      return;
    const { pluginKey: o = "bubbleMenu", editor: h, tippyOptions: s = {}, updateDelay: f, shouldShow: l = null } = n, d = h || r;
    if (!d) {
      console.warn("BubbleMenu component is not rendered inside of an editor component or does not have editor prop.");
      return;
    }
    const u = ne({
      updateDelay: f,
      editor: d,
      element: e,
      pluginKey: o,
      shouldShow: l,
      tippyOptions: s
    });
    return d.registerPlugin(u), () => {
      d.unregisterPlugin(o);
    };
  }, [n.editor, r, e]), g.createElement("div", { ref: t, className: n.className, style: { visibility: "hidden" } }, n.children);
}, ie = te({
  onDragStart: void 0
}), We = () => ee(ie), it = g.forwardRef((n, e) => {
  const { onDragStart: t } = We(), r = n.as || "div";
  return (
    // @ts-ignore
    g.createElement(r, { ...n, ref: e, "data-node-view-wrapper": "", onDragStart: t, style: {
      whiteSpace: "normal",
      ...n.style
    } })
  );
});
function X(n) {
  return !!(typeof n == "function" && n.prototype && n.prototype.isReactComponent);
}
function Z(n) {
  return !!(typeof n == "object" && n.$$typeof && (n.$$typeof.toString() === "Symbol(react.forward_ref)" || n.$$typeof.description === "react.forward_ref"));
}
function qe(n) {
  return !!(typeof n == "object" && n.$$typeof && (n.$$typeof.toString() === "Symbol(react.memo)" || n.$$typeof.description === "react.memo"));
}
function ze(n) {
  if (X(n) || Z(n))
    return !0;
  if (qe(n)) {
    const e = n.type;
    if (e)
      return X(e) || Z(e);
  }
  return !1;
}
function Ge() {
  try {
    if (q)
      return parseInt(q.split(".")[0], 10) >= 19;
  } catch {
  }
  return !1;
}
class Je {
  /**
   * Immediately creates element and renders the provided React component.
   */
  constructor(e, { editor: t, props: r = {}, as: i = "div", className: o = "" }) {
    this.ref = null, this.id = Math.floor(Math.random() * 4294967295).toString(), this.component = e, this.editor = t, this.props = r, this.element = document.createElement(i), this.element.classList.add("react-renderer"), o && this.element.classList.add(...o.split(" ")), this.editor.isInitialized ? we(() => {
      this.render();
    }) : this.render();
  }
  /**
   * Render the React component.
   */
  render() {
    var e;
    const t = this.component, r = this.props, i = this.editor, o = Ge(), h = ze(t), s = { ...r };
    s.ref && !(o || h) && delete s.ref, !s.ref && (o || h) && (s.ref = (f) => {
      this.ref = f;
    }), this.reactElement = g.createElement(t, { ...s }), (e = i == null ? void 0 : i.contentComponent) === null || e === void 0 || e.setRenderer(this.id, this);
  }
  /**
   * Re-renders the React component with new props.
   */
  updateProps(e = {}) {
    this.props = {
      ...this.props,
      ...e
    }, this.render();
  }
  /**
   * Destroy the React component.
   */
  destroy() {
    var e;
    const t = this.editor;
    (e = t == null ? void 0 : t.contentComponent) === null || e === void 0 || e.removeRenderer(this.id);
  }
  /**
   * Update the attributes of the element that holds the React component.
   */
  updateAttributes(e) {
    Object.keys(e).forEach((t) => {
      this.element.setAttribute(t, e[t]);
    });
  }
}
class Ye extends pe {
  /**
   * Setup the React component.
   * Called on initialization.
   */
  mount() {
    const e = {
      editor: this.editor,
      node: this.node,
      decorations: this.decorations,
      innerDecorations: this.innerDecorations,
      view: this.view,
      selected: !1,
      extension: this.extension,
      HTMLAttributes: this.HTMLAttributes,
      getPos: () => this.getPos(),
      updateAttributes: (l = {}) => this.updateAttributes(l),
      deleteNode: () => this.deleteNode(),
      ref: _e()
    };
    if (!this.component.displayName) {
      const l = (d) => d.charAt(0).toUpperCase() + d.substring(1);
      this.component.displayName = l(this.extension.name);
    }
    const i = { onDragStart: this.onDragStart.bind(this), nodeViewContentRef: (l) => {
      l && this.contentDOMElement && l.firstChild !== this.contentDOMElement && l.appendChild(this.contentDOMElement);
    } }, o = this.component, h = ge((l) => g.createElement(ie.Provider, { value: i }, be(o, l)));
    h.displayName = "ReactNodeView", this.node.isLeaf ? this.contentDOMElement = null : this.options.contentDOMElementTag ? this.contentDOMElement = document.createElement(this.options.contentDOMElementTag) : this.contentDOMElement = document.createElement(this.node.isInline ? "span" : "div"), this.contentDOMElement && (this.contentDOMElement.dataset.nodeViewContentReact = "", this.contentDOMElement.style.whiteSpace = "inherit");
    let s = this.node.isInline ? "span" : "div";
    this.options.as && (s = this.options.as);
    const { className: f = "" } = this.options;
    this.handleSelectionUpdate = this.handleSelectionUpdate.bind(this), this.renderer = new Je(h, {
      editor: this.editor,
      props: e,
      as: s,
      className: `node-${this.node.type.name} ${f}`.trim()
    }), this.editor.on("selectionUpdate", this.handleSelectionUpdate), this.updateElementAttributes();
  }
  /**
   * Return the DOM element.
   * This is the element that will be used to display the node view.
   */
  get dom() {
    var e;
    if (this.renderer.element.firstElementChild && !(!((e = this.renderer.element.firstElementChild) === null || e === void 0) && e.hasAttribute("data-node-view-wrapper")))
      throw Error("Please use the NodeViewWrapper component for your node view.");
    return this.renderer.element;
  }
  /**
   * Return the content DOM element.
   * This is the element that will be used to display the rich-text content of the node.
   */
  get contentDOM() {
    return this.node.isLeaf ? null : this.contentDOMElement;
  }
  /**
   * On editor selection update, check if the node is selected.
   * If it is, call `selectNode`, otherwise call `deselectNode`.
   */
  handleSelectionUpdate() {
    const { from: e, to: t } = this.editor.state.selection, r = this.getPos();
    if (typeof r == "number")
      if (e <= r && t >= r + this.node.nodeSize) {
        if (this.renderer.props.selected)
          return;
        this.selectNode();
      } else {
        if (!this.renderer.props.selected)
          return;
        this.deselectNode();
      }
  }
  /**
   * On update, update the React component.
   * To prevent unnecessary updates, the `update` option can be used.
   */
  update(e, t, r) {
    const i = (o) => {
      this.renderer.updateProps(o), typeof this.options.attrs == "function" && this.updateElementAttributes();
    };
    if (e.type !== this.node.type)
      return !1;
    if (typeof this.options.update == "function") {
      const o = this.node, h = this.decorations, s = this.innerDecorations;
      return this.node = e, this.decorations = t, this.innerDecorations = r, this.options.update({
        oldNode: o,
        oldDecorations: h,
        newNode: e,
        newDecorations: t,
        oldInnerDecorations: s,
        innerDecorations: r,
        updateProps: () => i({ node: e, decorations: t, innerDecorations: r })
      });
    }
    return e === this.node && this.decorations === t && this.innerDecorations === r || (this.node = e, this.decorations = t, this.innerDecorations = r, i({ node: e, decorations: t, innerDecorations: r })), !0;
  }
  /**
   * Select the node.
   * Add the `selected` prop and the `ProseMirror-selectednode` class.
   */
  selectNode() {
    this.renderer.updateProps({
      selected: !0
    }), this.renderer.element.classList.add("ProseMirror-selectednode");
  }
  /**
   * Deselect the node.
   * Remove the `selected` prop and the `ProseMirror-selectednode` class.
   */
  deselectNode() {
    this.renderer.updateProps({
      selected: !1
    }), this.renderer.element.classList.remove("ProseMirror-selectednode");
  }
  /**
   * Destroy the React component instance.
   */
  destroy() {
    this.renderer.destroy(), this.editor.off("selectionUpdate", this.handleSelectionUpdate), this.contentDOMElement = null;
  }
  /**
   * Update the attributes of the top-level element that holds the React component.
   * Applying the attributes defined in the `attrs` option.
   */
  updateElementAttributes() {
    if (this.options.attrs) {
      let e = {};
      if (typeof this.options.attrs == "function") {
        const t = this.editor.extensionManager.attributes, r = me(this.node, t);
        e = this.options.attrs({ node: this.node, HTMLAttributes: r });
      } else
        e = this.options.attrs;
      this.renderer.updateAttributes(e);
    }
  }
}
function ot(n, e) {
  return (t) => t.editor.contentComponent ? new Ye(n, t, e) : {};
}
function oe(n) {
  var e, t, r = "";
  if (typeof n == "string" || typeof n == "number") r += n;
  else if (typeof n == "object") if (Array.isArray(n)) {
    var i = n.length;
    for (e = 0; e < i; e++) n[e] && (t = oe(n[e])) && (r && (r += " "), r += t);
  } else for (t in n) n[t] && (r && (r += " "), r += t);
  return r;
}
function st() {
  for (var n, e, t = 0, r = "", i = arguments.length; t < i; t++) (n = arguments[t]) && (e = oe(n)) && (r && (r += " "), r += e);
  return r;
}
function Qe(n) {
  try {
    return JSON.stringify(n);
  } catch {
    return JSON.stringify({});
  }
}
function ut(n, e = !1) {
  return (t) => {
    const r = n.startsWith("data-") ? n : `data-${n}`;
    let i = decodeURIComponent(t.getAttribute(r));
    if (i == null || typeof i == "string" && i === "null")
      try {
        const s = t.outerHTML.match(/([\S\s])+?="([\S\s])+?"/g);
        s && s.length > 0 && (i = (s.map((l) => l.trim()).reduce((l, d) => {
          const u = d.indexOf("="), p = [d.slice(0, u), d.slice(u + 1).slice(1, -1)];
          return l[p[0]] = p[1], l;
        }, {})[n.toLowerCase()] || "").replaceAll("&quot;", '"'));
      } catch (h) {
        console.error("Error getDatasetAttribute ", h.message, t);
      }
    if (e)
      try {
        return JSON.parse(i);
      } catch {
        return {};
      }
    if (i.includes("%") || i.includes("auto"))
      return i;
    const o = Number.parseInt(i);
    return o !== o ? i : o;
  };
}
function at(n) {
  const { attrs: e } = n;
  return Object.keys(e).reduce((t, r) => {
    const i = e[r];
    if (i == null)
      return t;
    let o = "";
    return typeof i == "object" ? o = Qe(i) : o = i, t[r] = o, t;
  }, /* @__PURE__ */ Object.create(null));
}
export {
  rt as B,
  tt as E,
  it as N,
  ot as R,
  Je as a,
  st as c,
  ut as g,
  at as n,
  nt as u
};
