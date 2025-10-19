const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", C = (r) => {
  r = r.replace(/\r\n/g, `
`);
  let n = 0, e = "";
  for (; n < r.length; n++) {
    const t = r.charCodeAt(n);
    t < 128 ? e += String.fromCharCode(t) : t > 127 && t < 2048 ? (e += String.fromCharCode(t >> 6 | 192), e += String.fromCharCode(63 & t | 128)) : (e += String.fromCharCode(t >> 12 | 224), e += String.fromCharCode(t >> 6 & 63 | 128), e += String.fromCharCode(63 & t | 128));
  }
  return e;
}, f = (r) => {
  let n, e, t, d, g, h, a, o = 0, s = "";
  for (r = C(r); o < r.length; ) n = r.charCodeAt(o++), e = r.charCodeAt(o++), t = r.charCodeAt(o++), d = n >> 2, g = (3 & n) << 4 | e >> 4, h = (15 & e) << 2 | t >> 6, a = 63 & t, isNaN(e) ? h = a = 64 : isNaN(t) && (a = 64), s = s + i.charAt(d) + i.charAt(g) + i.charAt(h) + i.charAt(a);
  return s;
}, l = (r) => typeof r == "string" ? "string" : typeof SVGElement < "u" && r instanceof SVGElement ? "element" : void 0, c = (r) => "data:image/svg+xml;base64," + f(r), m = (r) => c(new XMLSerializer().serializeToString(r)), S = (r) => {
  switch (l(r)) {
    case "string":
      return c(r);
    case "element":
      return m(r);
    default:
      return r;
  }
};
function u(r = 8) {
  return Math.random().toString(36).substring(2, r + 2);
}
export {
  S as i,
  u as s
};
