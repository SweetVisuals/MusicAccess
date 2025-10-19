import { a as b, N as y, m as c } from "./index-BWx1Mchx.js";
import { S as T } from "./index-oQutU45z.js";
import { c as p, g as h, a as L } from "./dom-dataset-CHDbKz5J.js";
import M from "tippy.js";
import { jsx as u } from "react/jsx-runtime";
import { forwardRef as w, useRef as v, useState as H, useEffect as f, useImperativeHandle as U } from "react";
import A from "scroll-into-view-if-needed";
const _ = new b("mention"), x = y.create({
  name: "mention",
  priority: 101,
  addOptions() {
    return {
      HTMLAttributes: {},
      renderText({ options: e, node: n }) {
        var t;
        return `${e.suggestion.char}${(t = n.attrs.label) !== null && t !== void 0 ? t : n.attrs.id}`;
      },
      deleteTriggerWithBackspace: !1,
      renderHTML({ options: e, node: n }) {
        var t;
        return [
          "span",
          c(this.HTMLAttributes, e.HTMLAttributes),
          `${e.suggestion.char}${(t = n.attrs.label) !== null && t !== void 0 ? t : n.attrs.id}`
        ];
      },
      suggestion: {
        char: "@",
        pluginKey: _,
        command: ({ editor: e, range: n, props: t }) => {
          var r, s, o;
          const a = e.view.state.selection.$to.nodeAfter;
          ((r = a == null ? void 0 : a.text) === null || r === void 0 ? void 0 : r.startsWith(" ")) && (n.to += 1), e.chain().focus().insertContentAt(n, [
            {
              type: this.name,
              attrs: t
            },
            {
              type: "text",
              text: " "
            }
          ]).run(), (o = (s = e.view.dom.ownerDocument.defaultView) === null || s === void 0 ? void 0 : s.getSelection()) === null || o === void 0 || o.collapseToEnd();
        },
        allow: ({ state: e, range: n }) => {
          const t = e.doc.resolve(n.from), r = e.schema.nodes[this.name];
          return !!t.parent.type.contentMatch.matchType(r);
        }
      }
    };
  },
  group: "inline",
  inline: !0,
  selectable: !1,
  atom: !0,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (e) => e.getAttribute("data-id"),
        renderHTML: (e) => e.id ? {
          "data-id": e.id
        } : {}
      },
      label: {
        default: null,
        parseHTML: (e) => e.getAttribute("data-label"),
        renderHTML: (e) => e.label ? {
          "data-label": e.label
        } : {}
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`
      }
    ];
  },
  renderHTML({ node: e, HTMLAttributes: n }) {
    if (this.options.renderLabel !== void 0)
      return console.warn("renderLabel is deprecated use renderText and renderHTML instead"), [
        "span",
        c({ "data-type": this.name }, this.options.HTMLAttributes, n),
        this.options.renderLabel({
          options: this.options,
          node: e
        })
      ];
    const t = { ...this.options };
    t.HTMLAttributes = c({ "data-type": this.name }, this.options.HTMLAttributes, n);
    const r = this.options.renderHTML({
      options: t,
      node: e
    });
    return typeof r == "string" ? [
      "span",
      c({ "data-type": this.name }, this.options.HTMLAttributes, n),
      r
    ] : r;
  },
  renderText({ node: e }) {
    return this.options.renderLabel !== void 0 ? (console.warn("renderLabel is deprecated use renderText and renderHTML instead"), this.options.renderLabel({
      options: this.options,
      node: e
    })) : this.options.renderText({
      options: this.options,
      node: e
    });
  },
  addKeyboardShortcuts() {
    return {
      Backspace: () => this.editor.commands.command(({ tr: e, state: n }) => {
        let t = !1;
        const { selection: r } = n, { empty: s, anchor: o } = r;
        return s ? (n.doc.nodesBetween(o - 1, o, (a, l) => {
          if (a.type.name === this.name)
            return t = !0, e.insertText(this.options.deleteTriggerWithBackspace ? "" : this.options.suggestion.char || "", l, l + a.nodeSize), !1;
        }), t) : !1;
      })
    };
  },
  addProseMirrorPlugins() {
    return [
      T({
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
}), S = "_listUsers_en3pm_1", R = "_itemUser_en3pm_10", N = "_selectedUser_en3pm_31", m = {
  listUsers: S,
  itemUser: R,
  selectedUser: N
}, $ = w((e, n) => {
  const t = v(null), [r, s] = H(0), o = (i) => {
    const d = e.items[i];
    d && e.command({ id: d, label: d });
  }, a = () => {
    s((r + e.items.length - 1) % e.items.length);
  }, l = () => {
    s((r + 1) % e.items.length);
  }, g = () => {
    o(r);
  };
  return f(() => s(0), [e.items]), f(() => {
    if (Number.isNaN(r + 1))
      return;
    const i = t.current.querySelector(`span:nth-of-type(${r + 1})`);
    i && A(i, { behavior: "smooth", scrollMode: "if-needed" });
  }, [r]), U(n, () => ({
    onKeyDown: ({ event: i }) => i.key === "ArrowUp" ? (a(), !0) : i.key === "ArrowDown" ? (l(), !0) : i.key === "Enter" ? (g(), !0) : !1
  })), /* @__PURE__ */ u("div", { className: p("listUsers", m.listUsers), children: /* @__PURE__ */ u("div", { ref: t, children: e.items.length > 0 ? e.items.map((i, d) => /* @__PURE__ */ u(
    "span",
    {
      className: p("itemUser", m.itemUser, d === r ? m.selectedUser : ""),
      onClick: () => o(d),
      children: i
    },
    d
  )) : /* @__PURE__ */ u("div", { className: p("itemUserEmpty", m.itemUser), children: "Empty" }) }) });
}), k = [
  {
    id: "1",
    name: "John Doe"
  },
  {
    id: "2",
    name: "Jane Doe"
  },
  {
    id: "3",
    name: "Alice"
  },
  {
    id: "4",
    name: "Bob"
  }
], C = {
  items: async ({ query: e }) => k.map((t) => t.name).filter((t) => t.toLowerCase().startsWith(e.toLowerCase())),
  render: () => {
    let e, n;
    return {
      onStart: (t) => {
        e = new L($, {
          props: t,
          editor: t.editor
        }), n = M("body", {
          getReferenceClientRect: t.clientRect,
          appendTo: () => document.body,
          content: e.element,
          showOnCreate: !0,
          interactive: !0,
          trigger: "manual",
          placement: "bottom-start"
        });
      },
      onUpdate(t) {
        e.updateProps(t), n[0].setProps({
          getReferenceClientRect: t.clientRect
        });
      },
      onKeyDown(t) {
        var r;
        return t.event.key === "Escape" ? (n[0].hide(), !0) : (r = e.ref) == null ? void 0 : r.onKeyDown(t);
      },
      onExit() {
        n[0].destroy(), e.destroy();
      }
    };
  }
}, W = /* @__PURE__ */ x.extend({
  addAttributes() {
    return {
      id: {
        default: "",
        parseHTML: h("id")
      },
      label: {
        default: "",
        parseHTML: h("label")
      }
    };
  }
}).configure({
  HTMLAttributes: {
    class: "mention"
  },
  suggestion: C
});
export {
  W as Mention
};
