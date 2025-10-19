import { E as o, P as r, a as i, D as t, b as s } from "./index-BWx1Mchx.js";
const l = /* @__PURE__ */ o.create({
  name: "selection",
  addProseMirrorPlugins() {
    const { editor: n } = this;
    return [
      new r({
        key: new i("selection"),
        props: {
          decorations(e) {
            return e.selection.empty || n.isFocused === !0 ? null : t.create(e.doc, [
              s.inline(e.selection.from, e.selection.to, {
                class: "selection"
              })
            ]);
          }
        }
      })
    ];
  }
});
export {
  l as Selection,
  l as default
};
