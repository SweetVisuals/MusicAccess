import { E as u, a as h, P as g } from "./index-BWx1Mchx.js";
function s({ types: n, node: o }) {
  return Array.isArray(n) && n.includes(o.type) || o.type === n;
}
const m = /* @__PURE__ */ u.create({
  name: "trailingNode",
  addOptions() {
    return {
      node: "paragraph",
      notAfter: ["paragraph"]
    };
  },
  addProseMirrorPlugins() {
    const n = new h(this.name), o = Object.entries(this.editor.schema.nodes).map(([, e]) => e).filter((e) => this.options.notAfter.includes(e.name));
    return [
      new g({
        key: n,
        appendTransaction: (e, r, t) => {
          const { doc: i, tr: a, schema: d } = t, c = n.getState(t), l = i.content.size, p = d.nodes[this.options.node];
          if (c)
            return a.insert(l, p.create());
        },
        state: {
          init: (e, r) => {
            const t = r.tr.doc.lastChild;
            return !s({ node: t, types: o });
          },
          apply: (e, r) => {
            if (!e.docChanged)
              return r;
            const t = e.doc.lastChild;
            return !s({ node: t, types: o });
          }
        }
      })
    ];
  }
});
export {
  m as TrailingNode
};
