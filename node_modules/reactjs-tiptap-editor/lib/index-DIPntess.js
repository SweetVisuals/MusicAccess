import { M as a, m as l } from "./index-BWx1Mchx.js";
const u = (t) => {
  if (!t.children.length)
    return;
  const r = t.querySelectorAll("span");
  r && r.forEach((e) => {
    var n, s;
    const i = e.getAttribute("style"), o = (s = (n = e.parentElement) === null || n === void 0 ? void 0 : n.closest("span")) === null || s === void 0 ? void 0 : s.getAttribute("style");
    e.setAttribute("style", `${o};${i}`);
  });
}, p = a.create({
  name: "textStyle",
  priority: 101,
  addOptions() {
    return {
      HTMLAttributes: {},
      mergeNestedSpanStyles: !1
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (t) => t.hasAttribute("style") ? (this.options.mergeNestedSpanStyles && u(t), {}) : !1
      }
    ];
  },
  renderHTML({ HTMLAttributes: t }) {
    return ["span", l(this.options.HTMLAttributes, t), 0];
  },
  addCommands() {
    return {
      removeEmptyTextStyle: () => ({ tr: t }) => {
        const { selection: r } = t;
        return t.doc.nodesBetween(r.from, r.to, (e, n) => {
          if (e.isTextblock)
            return !0;
          e.marks.filter((s) => s.type === this.type).some((s) => Object.values(s.attrs).some((i) => !!i)) || t.removeMark(n, n + e.nodeSize, this.type);
        }), !0;
      }
    };
  }
});
export {
  p as T
};
