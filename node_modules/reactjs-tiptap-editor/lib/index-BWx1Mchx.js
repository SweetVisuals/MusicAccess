function F(r) {
  this.content = r;
}
F.prototype = {
  constructor: F,
  find: function(r) {
    for (var e = 0; e < this.content.length; e += 2)
      if (this.content[e] === r) return e;
    return -1;
  },
  // :: (string) → ?any
  // Retrieve the value stored under `key`, or return undefined when
  // no such key exists.
  get: function(r) {
    var e = this.find(r);
    return e == -1 ? void 0 : this.content[e + 1];
  },
  // :: (string, any, ?string) → OrderedMap
  // Create a new map by replacing the value of `key` with a new
  // value, or adding a binding to the end of the map. If `newKey` is
  // given, the key of the binding will be replaced with that key.
  update: function(r, e, t) {
    var n = t && t != r ? this.remove(t) : this, i = n.find(r), s = n.content.slice();
    return i == -1 ? s.push(t || r, e) : (s[i + 1] = e, t && (s[i] = t)), new F(s);
  },
  // :: (string) → OrderedMap
  // Return a map with the given key removed, if it existed.
  remove: function(r) {
    var e = this.find(r);
    if (e == -1) return this;
    var t = this.content.slice();
    return t.splice(e, 2), new F(t);
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the start of the map.
  addToStart: function(r, e) {
    return new F([r, e].concat(this.remove(r).content));
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the end of the map.
  addToEnd: function(r, e) {
    var t = this.remove(r).content.slice();
    return t.push(r, e), new F(t);
  },
  // :: (string, string, any) → OrderedMap
  // Add a key after the given key. If `place` is not found, the new
  // key is added to the end.
  addBefore: function(r, e, t) {
    var n = this.remove(e), i = n.content.slice(), s = n.find(r);
    return i.splice(s == -1 ? i.length : s, 0, e, t), new F(i);
  },
  // :: ((key: string, value: any))
  // Call the given function for each key/value pair in the map, in
  // order.
  forEach: function(r) {
    for (var e = 0; e < this.content.length; e += 2)
      r(this.content[e], this.content[e + 1]);
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by prepending the keys in this map that don't
  // appear in `map` before the keys in `map`.
  prepend: function(r) {
    return r = F.from(r), r.size ? new F(r.content.concat(this.subtract(r).content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by appending the keys in this map that don't
  // appear in `map` after the keys in `map`.
  append: function(r) {
    return r = F.from(r), r.size ? new F(this.subtract(r).content.concat(r.content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a map containing all the keys in this map that don't
  // appear in `map`.
  subtract: function(r) {
    var e = this;
    r = F.from(r);
    for (var t = 0; t < r.content.length; t += 2)
      e = e.remove(r.content[t]);
    return e;
  },
  // :: () → Object
  // Turn ordered map into a plain object.
  toObject: function() {
    var r = {};
    return this.forEach(function(e, t) {
      r[e] = t;
    }), r;
  },
  // :: number
  // The amount of keys in this map.
  get size() {
    return this.content.length >> 1;
  }
};
F.from = function(r) {
  if (r instanceof F) return r;
  var e = [];
  if (r) for (var t in r) e.push(t, r[t]);
  return new F(e);
};
function xi(r, e, t) {
  for (let n = 0; ; n++) {
    if (n == r.childCount || n == e.childCount)
      return r.childCount == e.childCount ? null : t;
    let i = r.child(n), s = e.child(n);
    if (i == s) {
      t += i.nodeSize;
      continue;
    }
    if (!i.sameMarkup(s))
      return t;
    if (i.isText && i.text != s.text) {
      for (let o = 0; i.text[o] == s.text[o]; o++)
        t++;
      return t;
    }
    if (i.content.size || s.content.size) {
      let o = xi(i.content, s.content, t + 1);
      if (o != null)
        return o;
    }
    t += i.nodeSize;
  }
}
function Si(r, e, t, n) {
  for (let i = r.childCount, s = e.childCount; ; ) {
    if (i == 0 || s == 0)
      return i == s ? null : { a: t, b: n };
    let o = r.child(--i), l = e.child(--s), a = o.nodeSize;
    if (o == l) {
      t -= a, n -= a;
      continue;
    }
    if (!o.sameMarkup(l))
      return { a: t, b: n };
    if (o.isText && o.text != l.text) {
      let c = 0, f = Math.min(o.text.length, l.text.length);
      for (; c < f && o.text[o.text.length - c - 1] == l.text[l.text.length - c - 1]; )
        c++, t--, n--;
      return { a: t, b: n };
    }
    if (o.content.size || l.content.size) {
      let c = Si(o.content, l.content, t - 1, n - 1);
      if (c)
        return c;
    }
    t -= a, n -= a;
  }
}
class b {
  /**
  @internal
  */
  constructor(e, t) {
    if (this.content = e, this.size = t || 0, t == null)
      for (let n = 0; n < e.length; n++)
        this.size += e[n].nodeSize;
  }
  /**
  Invoke a callback for all descendant nodes between the given two
  positions (relative to start of this fragment). Doesn't descend
  into a node when the callback returns `false`.
  */
  nodesBetween(e, t, n, i = 0, s) {
    for (let o = 0, l = 0; l < t; o++) {
      let a = this.content[o], c = l + a.nodeSize;
      if (c > e && n(a, i + l, s || null, o) !== !1 && a.content.size) {
        let f = l + 1;
        a.nodesBetween(Math.max(0, e - f), Math.min(a.content.size, t - f), n, i + f);
      }
      l = c;
    }
  }
  /**
  Call the given callback for every descendant node. `pos` will be
  relative to the start of the fragment. The callback may return
  `false` to prevent traversal of a given node's children.
  */
  descendants(e) {
    this.nodesBetween(0, this.size, e);
  }
  /**
  Extract the text between `from` and `to`. See the same method on
  [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
  */
  textBetween(e, t, n, i) {
    let s = "", o = !0;
    return this.nodesBetween(e, t, (l, a) => {
      let c = l.isText ? l.text.slice(Math.max(e, a) - a, t - a) : l.isLeaf ? i ? typeof i == "function" ? i(l) : i : l.type.spec.leafText ? l.type.spec.leafText(l) : "" : "";
      l.isBlock && (l.isLeaf && c || l.isTextblock) && n && (o ? o = !1 : s += n), s += c;
    }, 0), s;
  }
  /**
  Create a new fragment containing the combined content of this
  fragment and the other.
  */
  append(e) {
    if (!e.size)
      return this;
    if (!this.size)
      return e;
    let t = this.lastChild, n = e.firstChild, i = this.content.slice(), s = 0;
    for (t.isText && t.sameMarkup(n) && (i[i.length - 1] = t.withText(t.text + n.text), s = 1); s < e.content.length; s++)
      i.push(e.content[s]);
    return new b(i, this.size + e.size);
  }
  /**
  Cut out the sub-fragment between the two given positions.
  */
  cut(e, t = this.size) {
    if (e == 0 && t == this.size)
      return this;
    let n = [], i = 0;
    if (t > e)
      for (let s = 0, o = 0; o < t; s++) {
        let l = this.content[s], a = o + l.nodeSize;
        a > e && ((o < e || a > t) && (l.isText ? l = l.cut(Math.max(0, e - o), Math.min(l.text.length, t - o)) : l = l.cut(Math.max(0, e - o - 1), Math.min(l.content.size, t - o - 1))), n.push(l), i += l.nodeSize), o = a;
      }
    return new b(n, i);
  }
  /**
  @internal
  */
  cutByIndex(e, t) {
    return e == t ? b.empty : e == 0 && t == this.content.length ? this : new b(this.content.slice(e, t));
  }
  /**
  Create a new fragment in which the node at the given index is
  replaced by the given node.
  */
  replaceChild(e, t) {
    let n = this.content[e];
    if (n == t)
      return this;
    let i = this.content.slice(), s = this.size + t.nodeSize - n.nodeSize;
    return i[e] = t, new b(i, s);
  }
  /**
  Create a new fragment by prepending the given node to this
  fragment.
  */
  addToStart(e) {
    return new b([e].concat(this.content), this.size + e.nodeSize);
  }
  /**
  Create a new fragment by appending the given node to this
  fragment.
  */
  addToEnd(e) {
    return new b(this.content.concat(e), this.size + e.nodeSize);
  }
  /**
  Compare this fragment to another one.
  */
  eq(e) {
    if (this.content.length != e.content.length)
      return !1;
    for (let t = 0; t < this.content.length; t++)
      if (!this.content[t].eq(e.content[t]))
        return !1;
    return !0;
  }
  /**
  The first child of the fragment, or `null` if it is empty.
  */
  get firstChild() {
    return this.content.length ? this.content[0] : null;
  }
  /**
  The last child of the fragment, or `null` if it is empty.
  */
  get lastChild() {
    return this.content.length ? this.content[this.content.length - 1] : null;
  }
  /**
  The number of child nodes in this fragment.
  */
  get childCount() {
    return this.content.length;
  }
  /**
  Get the child node at the given index. Raise an error when the
  index is out of range.
  */
  child(e) {
    let t = this.content[e];
    if (!t)
      throw new RangeError("Index " + e + " out of range for " + this);
    return t;
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(e) {
    return this.content[e] || null;
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(e) {
    for (let t = 0, n = 0; t < this.content.length; t++) {
      let i = this.content[t];
      e(i, n, t), n += i.nodeSize;
    }
  }
  /**
  Find the first position at which this fragment and another
  fragment differ, or `null` if they are the same.
  */
  findDiffStart(e, t = 0) {
    return xi(this, e, t);
  }
  /**
  Find the first position, searching from the end, at which this
  fragment and the given fragment differ, or `null` if they are
  the same. Since this position will not be the same in both
  nodes, an object with two separate positions is returned.
  */
  findDiffEnd(e, t = this.size, n = e.size) {
    return Si(this, e, t, n);
  }
  /**
  Find the index and inner offset corresponding to a given relative
  position in this fragment. The result object will be reused
  (overwritten) the next time the function is called. @internal
  */
  findIndex(e, t = -1) {
    if (e == 0)
      return Mt(0, e);
    if (e == this.size)
      return Mt(this.content.length, e);
    if (e > this.size || e < 0)
      throw new RangeError(`Position ${e} outside of fragment (${this})`);
    for (let n = 0, i = 0; ; n++) {
      let s = this.child(n), o = i + s.nodeSize;
      if (o >= e)
        return o == e || t > 0 ? Mt(n + 1, o) : Mt(n, i);
      i = o;
    }
  }
  /**
  Return a debugging string that describes this fragment.
  */
  toString() {
    return "<" + this.toStringInner() + ">";
  }
  /**
  @internal
  */
  toStringInner() {
    return this.content.join(", ");
  }
  /**
  Create a JSON-serializeable representation of this fragment.
  */
  toJSON() {
    return this.content.length ? this.content.map((e) => e.toJSON()) : null;
  }
  /**
  Deserialize a fragment from its JSON representation.
  */
  static fromJSON(e, t) {
    if (!t)
      return b.empty;
    if (!Array.isArray(t))
      throw new RangeError("Invalid input for Fragment.fromJSON");
    return new b(t.map(e.nodeFromJSON));
  }
  /**
  Build a fragment from an array of nodes. Ensures that adjacent
  text nodes with the same marks are joined together.
  */
  static fromArray(e) {
    if (!e.length)
      return b.empty;
    let t, n = 0;
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      n += s.nodeSize, i && s.isText && e[i - 1].sameMarkup(s) ? (t || (t = e.slice(0, i)), t[t.length - 1] = s.withText(t[t.length - 1].text + s.text)) : t && t.push(s);
    }
    return new b(t || e, n);
  }
  /**
  Create a fragment from something that can be interpreted as a
  set of nodes. For `null`, it returns the empty fragment. For a
  fragment, the fragment itself. For a node or array of nodes, a
  fragment containing those nodes.
  */
  static from(e) {
    if (!e)
      return b.empty;
    if (e instanceof b)
      return e;
    if (Array.isArray(e))
      return this.fromArray(e);
    if (e.attrs)
      return new b([e], e.nodeSize);
    throw new RangeError("Can not convert " + e + " to a Fragment" + (e.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
  }
}
b.empty = new b([], 0);
const ln = { index: 0, offset: 0 };
function Mt(r, e) {
  return ln.index = r, ln.offset = e, ln;
}
function vt(r, e) {
  if (r === e)
    return !0;
  if (!(r && typeof r == "object") || !(e && typeof e == "object"))
    return !1;
  let t = Array.isArray(r);
  if (Array.isArray(e) != t)
    return !1;
  if (t) {
    if (r.length != e.length)
      return !1;
    for (let n = 0; n < r.length; n++)
      if (!vt(r[n], e[n]))
        return !1;
  } else {
    for (let n in r)
      if (!(n in e) || !vt(r[n], e[n]))
        return !1;
    for (let n in e)
      if (!(n in r))
        return !1;
  }
  return !0;
}
let I = class On {
  /**
  @internal
  */
  constructor(e, t) {
    this.type = e, this.attrs = t;
  }
  /**
  Given a set of marks, create a new set which contains this one as
  well, in the right position. If this mark is already in the set,
  the set itself is returned. If any marks that are set to be
  [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
  those are replaced by this one.
  */
  addToSet(e) {
    let t, n = !1;
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      if (this.eq(s))
        return e;
      if (this.type.excludes(s.type))
        t || (t = e.slice(0, i));
      else {
        if (s.type.excludes(this.type))
          return e;
        !n && s.type.rank > this.type.rank && (t || (t = e.slice(0, i)), t.push(this), n = !0), t && t.push(s);
      }
    }
    return t || (t = e.slice()), n || t.push(this), t;
  }
  /**
  Remove this mark from the given set, returning a new set. If this
  mark is not in the set, the set itself is returned.
  */
  removeFromSet(e) {
    for (let t = 0; t < e.length; t++)
      if (this.eq(e[t]))
        return e.slice(0, t).concat(e.slice(t + 1));
    return e;
  }
  /**
  Test whether this mark is in the given set of marks.
  */
  isInSet(e) {
    for (let t = 0; t < e.length; t++)
      if (this.eq(e[t]))
        return !0;
    return !1;
  }
  /**
  Test whether this mark has the same type and attributes as
  another mark.
  */
  eq(e) {
    return this == e || this.type == e.type && vt(this.attrs, e.attrs);
  }
  /**
  Convert this mark to a JSON-serializeable representation.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let t in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return e;
  }
  /**
  Deserialize a mark from JSON.
  */
  static fromJSON(e, t) {
    if (!t)
      throw new RangeError("Invalid input for Mark.fromJSON");
    let n = e.marks[t.type];
    if (!n)
      throw new RangeError(`There is no mark type ${t.type} in this schema`);
    let i = n.create(t.attrs);
    return n.checkAttrs(i.attrs), i;
  }
  /**
  Test whether two sets of marks are identical.
  */
  static sameSet(e, t) {
    if (e == t)
      return !0;
    if (e.length != t.length)
      return !1;
    for (let n = 0; n < e.length; n++)
      if (!e[n].eq(t[n]))
        return !1;
    return !0;
  }
  /**
  Create a properly sorted mark set from null, a single mark, or an
  unsorted array of marks.
  */
  static setFrom(e) {
    if (!e || Array.isArray(e) && e.length == 0)
      return On.none;
    if (e instanceof On)
      return [e];
    let t = e.slice();
    return t.sort((n, i) => n.type.rank - i.type.rank), t;
  }
};
I.none = [];
class Pt extends Error {
}
class k {
  /**
  Create a slice. When specifying a non-zero open depth, you must
  make sure that there are nodes of at least that depth at the
  appropriate side of the fragment—i.e. if the fragment is an
  empty paragraph node, `openStart` and `openEnd` can't be greater
  than 1.
  
  It is not necessary for the content of open nodes to conform to
  the schema's content constraints, though it should be a valid
  start/end/middle for such a node, depending on which sides are
  open.
  */
  constructor(e, t, n) {
    this.content = e, this.openStart = t, this.openEnd = n;
  }
  /**
  The size this slice would add when inserted into a document.
  */
  get size() {
    return this.content.size - this.openStart - this.openEnd;
  }
  /**
  @internal
  */
  insertAt(e, t) {
    let n = Mi(this.content, e + this.openStart, t);
    return n && new k(n, this.openStart, this.openEnd);
  }
  /**
  @internal
  */
  removeBetween(e, t) {
    return new k(Ci(this.content, e + this.openStart, t + this.openStart), this.openStart, this.openEnd);
  }
  /**
  Tests whether this slice is equal to another slice.
  */
  eq(e) {
    return this.content.eq(e.content) && this.openStart == e.openStart && this.openEnd == e.openEnd;
  }
  /**
  @internal
  */
  toString() {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")";
  }
  /**
  Convert a slice to a JSON-serializable representation.
  */
  toJSON() {
    if (!this.content.size)
      return null;
    let e = { content: this.content.toJSON() };
    return this.openStart > 0 && (e.openStart = this.openStart), this.openEnd > 0 && (e.openEnd = this.openEnd), e;
  }
  /**
  Deserialize a slice from its JSON representation.
  */
  static fromJSON(e, t) {
    if (!t)
      return k.empty;
    let n = t.openStart || 0, i = t.openEnd || 0;
    if (typeof n != "number" || typeof i != "number")
      throw new RangeError("Invalid input for Slice.fromJSON");
    return new k(b.fromJSON(e, t.content), n, i);
  }
  /**
  Create a slice from a fragment by taking the maximum possible
  open value on both side of the fragment.
  */
  static maxOpen(e, t = !0) {
    let n = 0, i = 0;
    for (let s = e.firstChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.firstChild)
      n++;
    for (let s = e.lastChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.lastChild)
      i++;
    return new k(e, n, i);
  }
}
k.empty = new k(b.empty, 0, 0);
function Ci(r, e, t) {
  let { index: n, offset: i } = r.findIndex(e), s = r.maybeChild(n), { index: o, offset: l } = r.findIndex(t);
  if (i == e || s.isText) {
    if (l != t && !r.child(o).isText)
      throw new RangeError("Removing non-flat range");
    return r.cut(0, e).append(r.cut(t));
  }
  if (n != o)
    throw new RangeError("Removing non-flat range");
  return r.replaceChild(n, s.copy(Ci(s.content, e - i - 1, t - i - 1)));
}
function Mi(r, e, t, n) {
  let { index: i, offset: s } = r.findIndex(e), o = r.maybeChild(i);
  if (s == e || o.isText)
    return r.cut(0, e).append(t).append(r.cut(e));
  let l = Mi(o.content, e - s - 1, t);
  return l && r.replaceChild(i, o.copy(l));
}
function so(r, e, t) {
  if (t.openStart > r.depth)
    throw new Pt("Inserted content deeper than insertion position");
  if (r.depth - t.openStart != e.depth - t.openEnd)
    throw new Pt("Inconsistent open depths");
  return wi(r, e, t, 0);
}
function wi(r, e, t, n) {
  let i = r.index(n), s = r.node(n);
  if (i == e.index(n) && n < r.depth - t.openStart) {
    let o = wi(r, e, t, n + 1);
    return s.copy(s.content.replaceChild(i, o));
  } else if (t.content.size)
    if (!t.openStart && !t.openEnd && r.depth == n && e.depth == n) {
      let o = r.parent, l = o.content;
      return Pe(o, l.cut(0, r.parentOffset).append(t.content).append(l.cut(e.parentOffset)));
    } else {
      let { start: o, end: l } = oo(t, r);
      return Pe(s, Ni(r, o, l, e, n));
    }
  else return Pe(s, Bt(r, e, n));
}
function Oi(r, e) {
  if (!e.type.compatibleContent(r.type))
    throw new Pt("Cannot join " + e.type.name + " onto " + r.type.name);
}
function Nn(r, e, t) {
  let n = r.node(t);
  return Oi(n, e.node(t)), n;
}
function ve(r, e) {
  let t = e.length - 1;
  t >= 0 && r.isText && r.sameMarkup(e[t]) ? e[t] = r.withText(e[t].text + r.text) : e.push(r);
}
function st(r, e, t, n) {
  let i = (e || r).node(t), s = 0, o = e ? e.index(t) : i.childCount;
  r && (s = r.index(t), r.depth > t ? s++ : r.textOffset && (ve(r.nodeAfter, n), s++));
  for (let l = s; l < o; l++)
    ve(i.child(l), n);
  e && e.depth == t && e.textOffset && ve(e.nodeBefore, n);
}
function Pe(r, e) {
  return r.type.checkContent(e), r.copy(e);
}
function Ni(r, e, t, n, i) {
  let s = r.depth > i && Nn(r, e, i + 1), o = n.depth > i && Nn(t, n, i + 1), l = [];
  return st(null, r, i, l), s && o && e.index(i) == t.index(i) ? (Oi(s, o), ve(Pe(s, Ni(r, e, t, n, i + 1)), l)) : (s && ve(Pe(s, Bt(r, e, i + 1)), l), st(e, t, i, l), o && ve(Pe(o, Bt(t, n, i + 1)), l)), st(n, null, i, l), new b(l);
}
function Bt(r, e, t) {
  let n = [];
  if (st(null, r, t, n), r.depth > t) {
    let i = Nn(r, e, t + 1);
    ve(Pe(i, Bt(r, e, t + 1)), n);
  }
  return st(e, null, t, n), new b(n);
}
function oo(r, e) {
  let t = e.depth - r.openStart, i = e.node(t).copy(r.content);
  for (let s = t - 1; s >= 0; s--)
    i = e.node(s).copy(b.from(i));
  return {
    start: i.resolveNoCache(r.openStart + t),
    end: i.resolveNoCache(i.content.size - r.openEnd - t)
  };
}
class ft {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.pos = e, this.path = t, this.parentOffset = n, this.depth = t.length / 3 - 1;
  }
  /**
  @internal
  */
  resolveDepth(e) {
    return e == null ? this.depth : e < 0 ? this.depth + e : e;
  }
  /**
  The parent node that the position points into. Note that even if
  a position points into a text node, that node is not considered
  the parent—text nodes are ‘flat’ in this model, and have no content.
  */
  get parent() {
    return this.node(this.depth);
  }
  /**
  The root node in which the position was resolved.
  */
  get doc() {
    return this.node(0);
  }
  /**
  The ancestor node at the given level. `p.node(p.depth)` is the
  same as `p.parent`.
  */
  node(e) {
    return this.path[this.resolveDepth(e) * 3];
  }
  /**
  The index into the ancestor at the given level. If this points
  at the 3rd node in the 2nd paragraph on the top level, for
  example, `p.index(0)` is 1 and `p.index(1)` is 2.
  */
  index(e) {
    return this.path[this.resolveDepth(e) * 3 + 1];
  }
  /**
  The index pointing after this position into the ancestor at the
  given level.
  */
  indexAfter(e) {
    return e = this.resolveDepth(e), this.index(e) + (e == this.depth && !this.textOffset ? 0 : 1);
  }
  /**
  The (absolute) position at the start of the node at the given
  level.
  */
  start(e) {
    return e = this.resolveDepth(e), e == 0 ? 0 : this.path[e * 3 - 1] + 1;
  }
  /**
  The (absolute) position at the end of the node at the given
  level.
  */
  end(e) {
    return e = this.resolveDepth(e), this.start(e) + this.node(e).content.size;
  }
  /**
  The (absolute) position directly before the wrapping node at the
  given level, or, when `depth` is `this.depth + 1`, the original
  position.
  */
  before(e) {
    if (e = this.resolveDepth(e), !e)
      throw new RangeError("There is no position before the top-level node");
    return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1];
  }
  /**
  The (absolute) position directly after the wrapping node at the
  given level, or the original position when `depth` is `this.depth + 1`.
  */
  after(e) {
    if (e = this.resolveDepth(e), !e)
      throw new RangeError("There is no position after the top-level node");
    return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1] + this.path[e * 3].nodeSize;
  }
  /**
  When this position points into a text node, this returns the
  distance between the position and the start of the text node.
  Will be zero for positions that point between nodes.
  */
  get textOffset() {
    return this.pos - this.path[this.path.length - 1];
  }
  /**
  Get the node directly after the position, if any. If the position
  points into a text node, only the part of that node after the
  position is returned.
  */
  get nodeAfter() {
    let e = this.parent, t = this.index(this.depth);
    if (t == e.childCount)
      return null;
    let n = this.pos - this.path[this.path.length - 1], i = e.child(t);
    return n ? e.child(t).cut(n) : i;
  }
  /**
  Get the node directly before the position, if any. If the
  position points into a text node, only the part of that node
  before the position is returned.
  */
  get nodeBefore() {
    let e = this.index(this.depth), t = this.pos - this.path[this.path.length - 1];
    return t ? this.parent.child(e).cut(0, t) : e == 0 ? null : this.parent.child(e - 1);
  }
  /**
  Get the position at the given index in the parent node at the
  given depth (which defaults to `this.depth`).
  */
  posAtIndex(e, t) {
    t = this.resolveDepth(t);
    let n = this.path[t * 3], i = t == 0 ? 0 : this.path[t * 3 - 1] + 1;
    for (let s = 0; s < e; s++)
      i += n.child(s).nodeSize;
    return i;
  }
  /**
  Get the marks at this position, factoring in the surrounding
  marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
  position is at the start of a non-empty node, the marks of the
  node after it (if any) are returned.
  */
  marks() {
    let e = this.parent, t = this.index();
    if (e.content.size == 0)
      return I.none;
    if (this.textOffset)
      return e.child(t).marks;
    let n = e.maybeChild(t - 1), i = e.maybeChild(t);
    if (!n) {
      let l = n;
      n = i, i = l;
    }
    let s = n.marks;
    for (var o = 0; o < s.length; o++)
      s[o].type.spec.inclusive === !1 && (!i || !s[o].isInSet(i.marks)) && (s = s[o--].removeFromSet(s));
    return s;
  }
  /**
  Get the marks after the current position, if any, except those
  that are non-inclusive and not present at position `$end`. This
  is mostly useful for getting the set of marks to preserve after a
  deletion. Will return `null` if this position is at the end of
  its parent node or its parent node isn't a textblock (in which
  case no marks should be preserved).
  */
  marksAcross(e) {
    let t = this.parent.maybeChild(this.index());
    if (!t || !t.isInline)
      return null;
    let n = t.marks, i = e.parent.maybeChild(e.index());
    for (var s = 0; s < n.length; s++)
      n[s].type.spec.inclusive === !1 && (!i || !n[s].isInSet(i.marks)) && (n = n[s--].removeFromSet(n));
    return n;
  }
  /**
  The depth up to which this position and the given (non-resolved)
  position share the same parent nodes.
  */
  sharedDepth(e) {
    for (let t = this.depth; t > 0; t--)
      if (this.start(t) <= e && this.end(t) >= e)
        return t;
    return 0;
  }
  /**
  Returns a range based on the place where this position and the
  given position diverge around block content. If both point into
  the same textblock, for example, a range around that textblock
  will be returned. If they point into different blocks, the range
  around those blocks in their shared ancestor is returned. You can
  pass in an optional predicate that will be called with a parent
  node to see if a range into that parent is acceptable.
  */
  blockRange(e = this, t) {
    if (e.pos < this.pos)
      return e.blockRange(this);
    for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--)
      if (e.pos <= this.end(n) && (!t || t(this.node(n))))
        return new zt(this, e, n);
    return null;
  }
  /**
  Query whether the given position shares the same parent node.
  */
  sameParent(e) {
    return this.pos - this.parentOffset == e.pos - e.parentOffset;
  }
  /**
  Return the greater of this and the given position.
  */
  max(e) {
    return e.pos > this.pos ? e : this;
  }
  /**
  Return the smaller of this and the given position.
  */
  min(e) {
    return e.pos < this.pos ? e : this;
  }
  /**
  @internal
  */
  toString() {
    let e = "";
    for (let t = 1; t <= this.depth; t++)
      e += (e ? "/" : "") + this.node(t).type.name + "_" + this.index(t - 1);
    return e + ":" + this.parentOffset;
  }
  /**
  @internal
  */
  static resolve(e, t) {
    if (!(t >= 0 && t <= e.content.size))
      throw new RangeError("Position " + t + " out of range");
    let n = [], i = 0, s = t;
    for (let o = e; ; ) {
      let { index: l, offset: a } = o.content.findIndex(s), c = s - a;
      if (n.push(o, l, i + a), !c || (o = o.child(l), o.isText))
        break;
      s = c - 1, i += a + 1;
    }
    return new ft(t, n, s);
  }
  /**
  @internal
  */
  static resolveCached(e, t) {
    let n = pr.get(e);
    if (n)
      for (let s = 0; s < n.elts.length; s++) {
        let o = n.elts[s];
        if (o.pos == t)
          return o;
      }
    else
      pr.set(e, n = new lo());
    let i = n.elts[n.i] = ft.resolve(e, t);
    return n.i = (n.i + 1) % ao, i;
  }
}
class lo {
  constructor() {
    this.elts = [], this.i = 0;
  }
}
const ao = 12, pr = /* @__PURE__ */ new WeakMap();
class zt {
  /**
  Construct a node range. `$from` and `$to` should point into the
  same node until at least the given `depth`, since a node range
  denotes an adjacent set of nodes in a single parent node.
  */
  constructor(e, t, n) {
    this.$from = e, this.$to = t, this.depth = n;
  }
  /**
  The position at the start of the range.
  */
  get start() {
    return this.$from.before(this.depth + 1);
  }
  /**
  The position at the end of the range.
  */
  get end() {
    return this.$to.after(this.depth + 1);
  }
  /**
  The parent node that the range points into.
  */
  get parent() {
    return this.$from.node(this.depth);
  }
  /**
  The start index of the range in the parent node.
  */
  get startIndex() {
    return this.$from.index(this.depth);
  }
  /**
  The end index of the range in the parent node.
  */
  get endIndex() {
    return this.$to.indexAfter(this.depth);
  }
}
const co = /* @__PURE__ */ Object.create(null);
let xe = class Tn {
  /**
  @internal
  */
  constructor(e, t, n, i = I.none) {
    this.type = e, this.attrs = t, this.marks = i, this.content = n || b.empty;
  }
  /**
  The array of this node's child nodes.
  */
  get children() {
    return this.content.content;
  }
  /**
  The size of this node, as defined by the integer-based [indexing
  scheme](/docs/guide/#doc.indexing). For text nodes, this is the
  amount of characters. For other leaf nodes, it is one. For
  non-leaf nodes, it is the size of the content plus two (the
  start and end token).
  */
  get nodeSize() {
    return this.isLeaf ? 1 : 2 + this.content.size;
  }
  /**
  The number of children that the node has.
  */
  get childCount() {
    return this.content.childCount;
  }
  /**
  Get the child node at the given index. Raises an error when the
  index is out of range.
  */
  child(e) {
    return this.content.child(e);
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(e) {
    return this.content.maybeChild(e);
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(e) {
    this.content.forEach(e);
  }
  /**
  Invoke a callback for all descendant nodes recursively between
  the given two positions that are relative to start of this
  node's content. The callback is invoked with the node, its
  position relative to the original node (method receiver),
  its parent node, and its child index. When the callback returns
  false for a given node, that node's children will not be
  recursed over. The last parameter can be used to specify a
  starting position to count from.
  */
  nodesBetween(e, t, n, i = 0) {
    this.content.nodesBetween(e, t, n, i, this);
  }
  /**
  Call the given callback for every descendant node. Doesn't
  descend into a node when the callback returns `false`.
  */
  descendants(e) {
    this.nodesBetween(0, this.content.size, e);
  }
  /**
  Concatenates all the text nodes found in this fragment and its
  children.
  */
  get textContent() {
    return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
  }
  /**
  Get all text between positions `from` and `to`. When
  `blockSeparator` is given, it will be inserted to separate text
  from different block nodes. If `leafText` is given, it'll be
  inserted for every non-text leaf node encountered, otherwise
  [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec^leafText) will be used.
  */
  textBetween(e, t, n, i) {
    return this.content.textBetween(e, t, n, i);
  }
  /**
  Returns this node's first child, or `null` if there are no
  children.
  */
  get firstChild() {
    return this.content.firstChild;
  }
  /**
  Returns this node's last child, or `null` if there are no
  children.
  */
  get lastChild() {
    return this.content.lastChild;
  }
  /**
  Test whether two nodes represent the same piece of document.
  */
  eq(e) {
    return this == e || this.sameMarkup(e) && this.content.eq(e.content);
  }
  /**
  Compare the markup (type, attributes, and marks) of this node to
  those of another. Returns `true` if both have the same markup.
  */
  sameMarkup(e) {
    return this.hasMarkup(e.type, e.attrs, e.marks);
  }
  /**
  Check whether this node's markup correspond to the given type,
  attributes, and marks.
  */
  hasMarkup(e, t, n) {
    return this.type == e && vt(this.attrs, t || e.defaultAttrs || co) && I.sameSet(this.marks, n || I.none);
  }
  /**
  Create a new node with the same markup as this node, containing
  the given content (or empty, if no content is given).
  */
  copy(e = null) {
    return e == this.content ? this : new Tn(this.type, this.attrs, e, this.marks);
  }
  /**
  Create a copy of this node, with the given set of marks instead
  of the node's own marks.
  */
  mark(e) {
    return e == this.marks ? this : new Tn(this.type, this.attrs, this.content, e);
  }
  /**
  Create a copy of this node with only the content between the
  given positions. If `to` is not given, it defaults to the end of
  the node.
  */
  cut(e, t = this.content.size) {
    return e == 0 && t == this.content.size ? this : this.copy(this.content.cut(e, t));
  }
  /**
  Cut out the part of the document between the given positions, and
  return it as a `Slice` object.
  */
  slice(e, t = this.content.size, n = !1) {
    if (e == t)
      return k.empty;
    let i = this.resolve(e), s = this.resolve(t), o = n ? 0 : i.sharedDepth(t), l = i.start(o), c = i.node(o).content.cut(i.pos - l, s.pos - l);
    return new k(c, i.depth - o, s.depth - o);
  }
  /**
  Replace the part of the document between the given positions with
  the given slice. The slice must 'fit', meaning its open sides
  must be able to connect to the surrounding content, and its
  content nodes must be valid children for the node they are placed
  into. If any of this is violated, an error of type
  [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
  */
  replace(e, t, n) {
    return so(this.resolve(e), this.resolve(t), n);
  }
  /**
  Find the node directly after the given position.
  */
  nodeAt(e) {
    for (let t = this; ; ) {
      let { index: n, offset: i } = t.content.findIndex(e);
      if (t = t.maybeChild(n), !t)
        return null;
      if (i == e || t.isText)
        return t;
      e -= i + 1;
    }
  }
  /**
  Find the (direct) child node after the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childAfter(e) {
    let { index: t, offset: n } = this.content.findIndex(e);
    return { node: this.content.maybeChild(t), index: t, offset: n };
  }
  /**
  Find the (direct) child node before the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childBefore(e) {
    if (e == 0)
      return { node: null, index: 0, offset: 0 };
    let { index: t, offset: n } = this.content.findIndex(e);
    if (n < e)
      return { node: this.content.child(t), index: t, offset: n };
    let i = this.content.child(t - 1);
    return { node: i, index: t - 1, offset: n - i.nodeSize };
  }
  /**
  Resolve the given position in the document, returning an
  [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
  */
  resolve(e) {
    return ft.resolveCached(this, e);
  }
  /**
  @internal
  */
  resolveNoCache(e) {
    return ft.resolve(this, e);
  }
  /**
  Test whether a given mark or mark type occurs in this document
  between the two given positions.
  */
  rangeHasMark(e, t, n) {
    let i = !1;
    return t > e && this.nodesBetween(e, t, (s) => (n.isInSet(s.marks) && (i = !0), !i)), i;
  }
  /**
  True when this is a block (non-inline node)
  */
  get isBlock() {
    return this.type.isBlock;
  }
  /**
  True when this is a textblock node, a block node with inline
  content.
  */
  get isTextblock() {
    return this.type.isTextblock;
  }
  /**
  True when this node allows inline content.
  */
  get inlineContent() {
    return this.type.inlineContent;
  }
  /**
  True when this is an inline node (a text node or a node that can
  appear among text).
  */
  get isInline() {
    return this.type.isInline;
  }
  /**
  True when this is a text node.
  */
  get isText() {
    return this.type.isText;
  }
  /**
  True when this is a leaf node.
  */
  get isLeaf() {
    return this.type.isLeaf;
  }
  /**
  True when this is an atom, i.e. when it does not have directly
  editable content. This is usually the same as `isLeaf`, but can
  be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
  on a node's spec (typically used when the node is displayed as
  an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
  */
  get isAtom() {
    return this.type.isAtom;
  }
  /**
  Return a string representation of this node for debugging
  purposes.
  */
  toString() {
    if (this.type.spec.toDebugString)
      return this.type.spec.toDebugString(this);
    let e = this.type.name;
    return this.content.size && (e += "(" + this.content.toStringInner() + ")"), Ti(this.marks, e);
  }
  /**
  Get the content match in this node at the given index.
  */
  contentMatchAt(e) {
    let t = this.type.contentMatch.matchFragment(this.content, 0, e);
    if (!t)
      throw new Error("Called contentMatchAt on a node with invalid content");
    return t;
  }
  /**
  Test whether replacing the range between `from` and `to` (by
  child index) with the given replacement fragment (which defaults
  to the empty fragment) would leave the node's content valid. You
  can optionally pass `start` and `end` indices into the
  replacement fragment.
  */
  canReplace(e, t, n = b.empty, i = 0, s = n.childCount) {
    let o = this.contentMatchAt(e).matchFragment(n, i, s), l = o && o.matchFragment(this.content, t);
    if (!l || !l.validEnd)
      return !1;
    for (let a = i; a < s; a++)
      if (!this.type.allowsMarks(n.child(a).marks))
        return !1;
    return !0;
  }
  /**
  Test whether replacing the range `from` to `to` (by index) with
  a node of the given type would leave the node's content valid.
  */
  canReplaceWith(e, t, n, i) {
    if (i && !this.type.allowsMarks(i))
      return !1;
    let s = this.contentMatchAt(e).matchType(n), o = s && s.matchFragment(this.content, t);
    return o ? o.validEnd : !1;
  }
  /**
  Test whether the given node's content could be appended to this
  node. If that node is empty, this will only return true if there
  is at least one node type that can appear in both nodes (to avoid
  merging completely incompatible nodes).
  */
  canAppend(e) {
    return e.content.size ? this.canReplace(this.childCount, this.childCount, e.content) : this.type.compatibleContent(e.type);
  }
  /**
  Check whether this node and its descendants conform to the
  schema, and raise an exception when they do not.
  */
  check() {
    this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
    let e = I.none;
    for (let t = 0; t < this.marks.length; t++) {
      let n = this.marks[t];
      n.type.checkAttrs(n.attrs), e = n.addToSet(e);
    }
    if (!I.sameSet(e, this.marks))
      throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((t) => t.type.name)}`);
    this.content.forEach((t) => t.check());
  }
  /**
  Return a JSON-serializeable representation of this node.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let t in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return this.content.size && (e.content = this.content.toJSON()), this.marks.length && (e.marks = this.marks.map((t) => t.toJSON())), e;
  }
  /**
  Deserialize a node from its JSON representation.
  */
  static fromJSON(e, t) {
    if (!t)
      throw new RangeError("Invalid input for Node.fromJSON");
    let n;
    if (t.marks) {
      if (!Array.isArray(t.marks))
        throw new RangeError("Invalid mark data for Node.fromJSON");
      n = t.marks.map(e.markFromJSON);
    }
    if (t.type == "text") {
      if (typeof t.text != "string")
        throw new RangeError("Invalid text node in JSON");
      return e.text(t.text, n);
    }
    let i = b.fromJSON(e, t.content), s = e.nodeType(t.type).create(t.attrs, i, n);
    return s.type.checkAttrs(s.attrs), s;
  }
};
xe.prototype.text = void 0;
class Ft extends xe {
  /**
  @internal
  */
  constructor(e, t, n, i) {
    if (super(e, t, null, i), !n)
      throw new RangeError("Empty text nodes are not allowed");
    this.text = n;
  }
  toString() {
    return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : Ti(this.marks, JSON.stringify(this.text));
  }
  get textContent() {
    return this.text;
  }
  textBetween(e, t) {
    return this.text.slice(e, t);
  }
  get nodeSize() {
    return this.text.length;
  }
  mark(e) {
    return e == this.marks ? this : new Ft(this.type, this.attrs, this.text, e);
  }
  withText(e) {
    return e == this.text ? this : new Ft(this.type, this.attrs, e, this.marks);
  }
  cut(e = 0, t = this.text.length) {
    return e == 0 && t == this.text.length ? this : this.withText(this.text.slice(e, t));
  }
  eq(e) {
    return this.sameMarkup(e) && this.text == e.text;
  }
  toJSON() {
    let e = super.toJSON();
    return e.text = this.text, e;
  }
}
function Ti(r, e) {
  for (let t = r.length - 1; t >= 0; t--)
    e = r[t].type.name + "(" + e + ")";
  return e;
}
class Fe {
  /**
  @internal
  */
  constructor(e) {
    this.validEnd = e, this.next = [], this.wrapCache = [];
  }
  /**
  @internal
  */
  static parse(e, t) {
    let n = new fo(e, t);
    if (n.next == null)
      return Fe.empty;
    let i = Ei(n);
    n.next && n.err("Unexpected trailing text");
    let s = bo(yo(i));
    return ko(s, n), s;
  }
  /**
  Match a node type, returning a match after that node if
  successful.
  */
  matchType(e) {
    for (let t = 0; t < this.next.length; t++)
      if (this.next[t].type == e)
        return this.next[t].next;
    return null;
  }
  /**
  Try to match a fragment. Returns the resulting match when
  successful.
  */
  matchFragment(e, t = 0, n = e.childCount) {
    let i = this;
    for (let s = t; i && s < n; s++)
      i = i.matchType(e.child(s).type);
    return i;
  }
  /**
  @internal
  */
  get inlineContent() {
    return this.next.length != 0 && this.next[0].type.isInline;
  }
  /**
  Get the first matching node type at this match position that can
  be generated.
  */
  get defaultType() {
    for (let e = 0; e < this.next.length; e++) {
      let { type: t } = this.next[e];
      if (!(t.isText || t.hasRequiredAttrs()))
        return t;
    }
    return null;
  }
  /**
  @internal
  */
  compatible(e) {
    for (let t = 0; t < this.next.length; t++)
      for (let n = 0; n < e.next.length; n++)
        if (this.next[t].type == e.next[n].type)
          return !0;
    return !1;
  }
  /**
  Try to match the given fragment, and if that fails, see if it can
  be made to match by inserting nodes in front of it. When
  successful, return a fragment of inserted nodes (which may be
  empty if nothing had to be inserted). When `toEnd` is true, only
  return a fragment if the resulting match goes to the end of the
  content expression.
  */
  fillBefore(e, t = !1, n = 0) {
    let i = [this];
    function s(o, l) {
      let a = o.matchFragment(e, n);
      if (a && (!t || a.validEnd))
        return b.from(l.map((c) => c.createAndFill()));
      for (let c = 0; c < o.next.length; c++) {
        let { type: f, next: d } = o.next[c];
        if (!(f.isText || f.hasRequiredAttrs()) && i.indexOf(d) == -1) {
          i.push(d);
          let u = s(d, l.concat(f));
          if (u)
            return u;
        }
      }
      return null;
    }
    return s(this, []);
  }
  /**
  Find a set of wrapping node types that would allow a node of the
  given type to appear at this position. The result may be empty
  (when it fits directly) and will be null when no such wrapping
  exists.
  */
  findWrapping(e) {
    for (let n = 0; n < this.wrapCache.length; n += 2)
      if (this.wrapCache[n] == e)
        return this.wrapCache[n + 1];
    let t = this.computeWrapping(e);
    return this.wrapCache.push(e, t), t;
  }
  /**
  @internal
  */
  computeWrapping(e) {
    let t = /* @__PURE__ */ Object.create(null), n = [{ match: this, type: null, via: null }];
    for (; n.length; ) {
      let i = n.shift(), s = i.match;
      if (s.matchType(e)) {
        let o = [];
        for (let l = i; l.type; l = l.via)
          o.push(l.type);
        return o.reverse();
      }
      for (let o = 0; o < s.next.length; o++) {
        let { type: l, next: a } = s.next[o];
        !l.isLeaf && !l.hasRequiredAttrs() && !(l.name in t) && (!i.type || a.validEnd) && (n.push({ match: l.contentMatch, type: l, via: i }), t[l.name] = !0);
      }
    }
    return null;
  }
  /**
  The number of outgoing edges this node has in the finite
  automaton that describes the content expression.
  */
  get edgeCount() {
    return this.next.length;
  }
  /**
  Get the _n_​th outgoing edge from this node in the finite
  automaton that describes the content expression.
  */
  edge(e) {
    if (e >= this.next.length)
      throw new RangeError(`There's no ${e}th edge in this content match`);
    return this.next[e];
  }
  /**
  @internal
  */
  toString() {
    let e = [];
    function t(n) {
      e.push(n);
      for (let i = 0; i < n.next.length; i++)
        e.indexOf(n.next[i].next) == -1 && t(n.next[i].next);
    }
    return t(this), e.map((n, i) => {
      let s = i + (n.validEnd ? "*" : " ") + " ";
      for (let o = 0; o < n.next.length; o++)
        s += (o ? ", " : "") + n.next[o].type.name + "->" + e.indexOf(n.next[o].next);
      return s;
    }).join(`
`);
  }
}
Fe.empty = new Fe(!0);
class fo {
  constructor(e, t) {
    this.string = e, this.nodeTypes = t, this.inline = null, this.pos = 0, this.tokens = e.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == "" && this.tokens.pop(), this.tokens[0] == "" && this.tokens.shift();
  }
  get next() {
    return this.tokens[this.pos];
  }
  eat(e) {
    return this.next == e && (this.pos++ || !0);
  }
  err(e) {
    throw new SyntaxError(e + " (in content expression '" + this.string + "')");
  }
}
function Ei(r) {
  let e = [];
  do
    e.push(uo(r));
  while (r.eat("|"));
  return e.length == 1 ? e[0] : { type: "choice", exprs: e };
}
function uo(r) {
  let e = [];
  do
    e.push(ho(r));
  while (r.next && r.next != ")" && r.next != "|");
  return e.length == 1 ? e[0] : { type: "seq", exprs: e };
}
function ho(r) {
  let e = go(r);
  for (; ; )
    if (r.eat("+"))
      e = { type: "plus", expr: e };
    else if (r.eat("*"))
      e = { type: "star", expr: e };
    else if (r.eat("?"))
      e = { type: "opt", expr: e };
    else if (r.eat("{"))
      e = po(r, e);
    else
      break;
  return e;
}
function mr(r) {
  /\D/.test(r.next) && r.err("Expected number, got '" + r.next + "'");
  let e = Number(r.next);
  return r.pos++, e;
}
function po(r, e) {
  let t = mr(r), n = t;
  return r.eat(",") && (r.next != "}" ? n = mr(r) : n = -1), r.eat("}") || r.err("Unclosed braced range"), { type: "range", min: t, max: n, expr: e };
}
function mo(r, e) {
  let t = r.nodeTypes, n = t[e];
  if (n)
    return [n];
  let i = [];
  for (let s in t) {
    let o = t[s];
    o.isInGroup(e) && i.push(o);
  }
  return i.length == 0 && r.err("No node type or group '" + e + "' found"), i;
}
function go(r) {
  if (r.eat("(")) {
    let e = Ei(r);
    return r.eat(")") || r.err("Missing closing paren"), e;
  } else if (/\W/.test(r.next))
    r.err("Unexpected token '" + r.next + "'");
  else {
    let e = mo(r, r.next).map((t) => (r.inline == null ? r.inline = t.isInline : r.inline != t.isInline && r.err("Mixing inline and block content"), { type: "name", value: t }));
    return r.pos++, e.length == 1 ? e[0] : { type: "choice", exprs: e };
  }
}
function yo(r) {
  let e = [[]];
  return i(s(r, 0), t()), e;
  function t() {
    return e.push([]) - 1;
  }
  function n(o, l, a) {
    let c = { term: a, to: l };
    return e[o].push(c), c;
  }
  function i(o, l) {
    o.forEach((a) => a.to = l);
  }
  function s(o, l) {
    if (o.type == "choice")
      return o.exprs.reduce((a, c) => a.concat(s(c, l)), []);
    if (o.type == "seq")
      for (let a = 0; ; a++) {
        let c = s(o.exprs[a], l);
        if (a == o.exprs.length - 1)
          return c;
        i(c, l = t());
      }
    else if (o.type == "star") {
      let a = t();
      return n(l, a), i(s(o.expr, a), a), [n(a)];
    } else if (o.type == "plus") {
      let a = t();
      return i(s(o.expr, l), a), i(s(o.expr, a), a), [n(a)];
    } else {
      if (o.type == "opt")
        return [n(l)].concat(s(o.expr, l));
      if (o.type == "range") {
        let a = l;
        for (let c = 0; c < o.min; c++) {
          let f = t();
          i(s(o.expr, a), f), a = f;
        }
        if (o.max == -1)
          i(s(o.expr, a), a);
        else
          for (let c = o.min; c < o.max; c++) {
            let f = t();
            n(a, f), i(s(o.expr, a), f), a = f;
          }
        return [n(a)];
      } else {
        if (o.type == "name")
          return [n(l, void 0, o.value)];
        throw new Error("Unknown expr type");
      }
    }
  }
}
function Di(r, e) {
  return e - r;
}
function gr(r, e) {
  let t = [];
  return n(e), t.sort(Di);
  function n(i) {
    let s = r[i];
    if (s.length == 1 && !s[0].term)
      return n(s[0].to);
    t.push(i);
    for (let o = 0; o < s.length; o++) {
      let { term: l, to: a } = s[o];
      !l && t.indexOf(a) == -1 && n(a);
    }
  }
}
function bo(r) {
  let e = /* @__PURE__ */ Object.create(null);
  return t(gr(r, 0));
  function t(n) {
    let i = [];
    n.forEach((o) => {
      r[o].forEach(({ term: l, to: a }) => {
        if (!l)
          return;
        let c;
        for (let f = 0; f < i.length; f++)
          i[f][0] == l && (c = i[f][1]);
        gr(r, a).forEach((f) => {
          c || i.push([l, c = []]), c.indexOf(f) == -1 && c.push(f);
        });
      });
    });
    let s = e[n.join(",")] = new Fe(n.indexOf(r.length - 1) > -1);
    for (let o = 0; o < i.length; o++) {
      let l = i[o][1].sort(Di);
      s.next.push({ type: i[o][0], next: e[l.join(",")] || t(l) });
    }
    return s;
  }
}
function ko(r, e) {
  for (let t = 0, n = [r]; t < n.length; t++) {
    let i = n[t], s = !i.validEnd, o = [];
    for (let l = 0; l < i.next.length; l++) {
      let { type: a, next: c } = i.next[l];
      o.push(a.name), s && !(a.isText || a.hasRequiredAttrs()) && (s = !1), n.indexOf(c) == -1 && n.push(c);
    }
    s && e.err("Only non-generatable nodes (" + o.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}
function Ai(r) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let t in r) {
    let n = r[t];
    if (!n.hasDefault)
      return null;
    e[t] = n.default;
  }
  return e;
}
function Ii(r, e) {
  let t = /* @__PURE__ */ Object.create(null);
  for (let n in r) {
    let i = e && e[n];
    if (i === void 0) {
      let s = r[n];
      if (s.hasDefault)
        i = s.default;
      else
        throw new RangeError("No value supplied for attribute " + n);
    }
    t[n] = i;
  }
  return t;
}
function Ri(r, e, t, n) {
  for (let i in e)
    if (!(i in r))
      throw new RangeError(`Unsupported attribute ${i} for ${t} of type ${i}`);
  for (let i in r) {
    let s = r[i];
    s.validate && s.validate(e[i]);
  }
}
function vi(r, e) {
  let t = /* @__PURE__ */ Object.create(null);
  if (e)
    for (let n in e)
      t[n] = new So(r, n, e[n]);
  return t;
}
let yr = class Pi {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.name = e, this.schema = t, this.spec = n, this.markSet = null, this.groups = n.group ? n.group.split(" ") : [], this.attrs = vi(e, n.attrs), this.defaultAttrs = Ai(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n.inline || e == "text"), this.isText = e == "text";
  }
  /**
  True if this is an inline type.
  */
  get isInline() {
    return !this.isBlock;
  }
  /**
  True if this is a textblock type, a block that contains inline
  content.
  */
  get isTextblock() {
    return this.isBlock && this.inlineContent;
  }
  /**
  True for node types that allow no content.
  */
  get isLeaf() {
    return this.contentMatch == Fe.empty;
  }
  /**
  True when this node is an atom, i.e. when it does not have
  directly editable content.
  */
  get isAtom() {
    return this.isLeaf || !!this.spec.atom;
  }
  /**
  Return true when this node type is part of the given
  [group](https://prosemirror.net/docs/ref/#model.NodeSpec.group).
  */
  isInGroup(e) {
    return this.groups.indexOf(e) > -1;
  }
  /**
  The node type's [whitespace](https://prosemirror.net/docs/ref/#model.NodeSpec.whitespace) option.
  */
  get whitespace() {
    return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
  }
  /**
  Tells you whether this node type has any required attributes.
  */
  hasRequiredAttrs() {
    for (let e in this.attrs)
      if (this.attrs[e].isRequired)
        return !0;
    return !1;
  }
  /**
  Indicates whether this node allows some of the same content as
  the given node type.
  */
  compatibleContent(e) {
    return this == e || this.contentMatch.compatible(e.contentMatch);
  }
  /**
  @internal
  */
  computeAttrs(e) {
    return !e && this.defaultAttrs ? this.defaultAttrs : Ii(this.attrs, e);
  }
  /**
  Create a `Node` of this type. The given attributes are
  checked and defaulted (you can pass `null` to use the type's
  defaults entirely, if no required attributes exist). `content`
  may be a `Fragment`, a node, an array of nodes, or
  `null`. Similarly `marks` may be `null` to default to the empty
  set of marks.
  */
  create(e = null, t, n) {
    if (this.isText)
      throw new Error("NodeType.create can't construct text nodes");
    return new xe(this, this.computeAttrs(e), b.from(t), I.setFrom(n));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but check the given content
  against the node type's content restrictions, and throw an error
  if it doesn't match.
  */
  createChecked(e = null, t, n) {
    return t = b.from(t), this.checkContent(t), new xe(this, this.computeAttrs(e), t, I.setFrom(n));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but see if it is
  necessary to add nodes to the start or end of the given fragment
  to make it fit the node. If no fitting wrapping can be found,
  return null. Note that, due to the fact that required nodes can
  always be created, this will always succeed if you pass null or
  `Fragment.empty` as content.
  */
  createAndFill(e = null, t, n) {
    if (e = this.computeAttrs(e), t = b.from(t), t.size) {
      let o = this.contentMatch.fillBefore(t);
      if (!o)
        return null;
      t = o.append(t);
    }
    let i = this.contentMatch.matchFragment(t), s = i && i.fillBefore(b.empty, !0);
    return s ? new xe(this, e, t.append(s), I.setFrom(n)) : null;
  }
  /**
  Returns true if the given fragment is valid content for this node
  type.
  */
  validContent(e) {
    let t = this.contentMatch.matchFragment(e);
    if (!t || !t.validEnd)
      return !1;
    for (let n = 0; n < e.childCount; n++)
      if (!this.allowsMarks(e.child(n).marks))
        return !1;
    return !0;
  }
  /**
  Throws a RangeError if the given fragment is not valid content for this
  node type.
  @internal
  */
  checkContent(e) {
    if (!this.validContent(e))
      throw new RangeError(`Invalid content for node ${this.name}: ${e.toString().slice(0, 50)}`);
  }
  /**
  @internal
  */
  checkAttrs(e) {
    Ri(this.attrs, e, "node", this.name);
  }
  /**
  Check whether the given mark type is allowed in this node.
  */
  allowsMarkType(e) {
    return this.markSet == null || this.markSet.indexOf(e) > -1;
  }
  /**
  Test whether the given set of marks are allowed in this node.
  */
  allowsMarks(e) {
    if (this.markSet == null)
      return !0;
    for (let t = 0; t < e.length; t++)
      if (!this.allowsMarkType(e[t].type))
        return !1;
    return !0;
  }
  /**
  Removes the marks that are not allowed in this node from the given set.
  */
  allowedMarks(e) {
    if (this.markSet == null)
      return e;
    let t;
    for (let n = 0; n < e.length; n++)
      this.allowsMarkType(e[n].type) ? t && t.push(e[n]) : t || (t = e.slice(0, n));
    return t ? t.length ? t : I.none : e;
  }
  /**
  @internal
  */
  static compile(e, t) {
    let n = /* @__PURE__ */ Object.create(null);
    e.forEach((s, o) => n[s] = new Pi(s, t, o));
    let i = t.spec.topNode || "doc";
    if (!n[i])
      throw new RangeError("Schema is missing its top node type ('" + i + "')");
    if (!n.text)
      throw new RangeError("Every schema needs a 'text' type");
    for (let s in n.text.attrs)
      throw new RangeError("The text node type should not have attributes");
    return n;
  }
};
function xo(r, e, t) {
  let n = t.split("|");
  return (i) => {
    let s = i === null ? "null" : typeof i;
    if (n.indexOf(s) < 0)
      throw new RangeError(`Expected value of type ${n} for attribute ${e} on type ${r}, got ${s}`);
  };
}
class So {
  constructor(e, t, n) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(n, "default"), this.default = n.default, this.validate = typeof n.validate == "string" ? xo(e, t, n.validate) : n.validate;
  }
  get isRequired() {
    return !this.hasDefault;
  }
}
class Ht {
  /**
  @internal
  */
  constructor(e, t, n, i) {
    this.name = e, this.rank = t, this.schema = n, this.spec = i, this.attrs = vi(e, i.attrs), this.excluded = null;
    let s = Ai(this.attrs);
    this.instance = s ? new I(this, s) : null;
  }
  /**
  Create a mark of this type. `attrs` may be `null` or an object
  containing only some of the mark's attributes. The others, if
  they have defaults, will be added.
  */
  create(e = null) {
    return !e && this.instance ? this.instance : new I(this, Ii(this.attrs, e));
  }
  /**
  @internal
  */
  static compile(e, t) {
    let n = /* @__PURE__ */ Object.create(null), i = 0;
    return e.forEach((s, o) => n[s] = new Ht(s, i++, t, o)), n;
  }
  /**
  When there is a mark of this type in the given set, a new set
  without it is returned. Otherwise, the input set is returned.
  */
  removeFromSet(e) {
    for (var t = 0; t < e.length; t++)
      e[t].type == this && (e = e.slice(0, t).concat(e.slice(t + 1)), t--);
    return e;
  }
  /**
  Tests whether there is a mark of this type in the given set.
  */
  isInSet(e) {
    for (let t = 0; t < e.length; t++)
      if (e[t].type == this)
        return e[t];
  }
  /**
  @internal
  */
  checkAttrs(e) {
    Ri(this.attrs, e, "mark", this.name);
  }
  /**
  Queries whether a given mark type is
  [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
  */
  excludes(e) {
    return this.excluded.indexOf(e) > -1;
  }
}
class Bi {
  /**
  Construct a schema from a schema [specification](https://prosemirror.net/docs/ref/#model.SchemaSpec).
  */
  constructor(e) {
    this.linebreakReplacement = null, this.cached = /* @__PURE__ */ Object.create(null);
    let t = this.spec = {};
    for (let i in e)
      t[i] = e[i];
    t.nodes = F.from(e.nodes), t.marks = F.from(e.marks || {}), this.nodes = yr.compile(this.spec.nodes, this), this.marks = Ht.compile(this.spec.marks, this);
    let n = /* @__PURE__ */ Object.create(null);
    for (let i in this.nodes) {
      if (i in this.marks)
        throw new RangeError(i + " can not be both a node and a mark");
      let s = this.nodes[i], o = s.spec.content || "", l = s.spec.marks;
      if (s.contentMatch = n[o] || (n[o] = Fe.parse(o, this.nodes)), s.inlineContent = s.contentMatch.inlineContent, s.spec.linebreakReplacement) {
        if (this.linebreakReplacement)
          throw new RangeError("Multiple linebreak nodes defined");
        if (!s.isInline || !s.isLeaf)
          throw new RangeError("Linebreak replacement nodes must be inline leaf nodes");
        this.linebreakReplacement = s;
      }
      s.markSet = l == "_" ? null : l ? br(this, l.split(" ")) : l == "" || !s.inlineContent ? [] : null;
    }
    for (let i in this.marks) {
      let s = this.marks[i], o = s.spec.excludes;
      s.excluded = o == null ? [s] : o == "" ? [] : br(this, o.split(" "));
    }
    this.nodeFromJSON = this.nodeFromJSON.bind(this), this.markFromJSON = this.markFromJSON.bind(this), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = /* @__PURE__ */ Object.create(null);
  }
  /**
  Create a node in this schema. The `type` may be a string or a
  `NodeType` instance. Attributes will be extended with defaults,
  `content` may be a `Fragment`, `null`, a `Node`, or an array of
  nodes.
  */
  node(e, t = null, n, i) {
    if (typeof e == "string")
      e = this.nodeType(e);
    else if (e instanceof yr) {
      if (e.schema != this)
        throw new RangeError("Node type from different schema used (" + e.name + ")");
    } else throw new RangeError("Invalid node type: " + e);
    return e.createChecked(t, n, i);
  }
  /**
  Create a text node in the schema. Empty text nodes are not
  allowed.
  */
  text(e, t) {
    let n = this.nodes.text;
    return new Ft(n, n.defaultAttrs, e, I.setFrom(t));
  }
  /**
  Create a mark with the given type and attributes.
  */
  mark(e, t) {
    return typeof e == "string" && (e = this.marks[e]), e.create(t);
  }
  /**
  Deserialize a node from its JSON representation. This method is
  bound.
  */
  nodeFromJSON(e) {
    return xe.fromJSON(this, e);
  }
  /**
  Deserialize a mark from its JSON representation. This method is
  bound.
  */
  markFromJSON(e) {
    return I.fromJSON(this, e);
  }
  /**
  @internal
  */
  nodeType(e) {
    let t = this.nodes[e];
    if (!t)
      throw new RangeError("Unknown node type: " + e);
    return t;
  }
}
function br(r, e) {
  let t = [];
  for (let n = 0; n < e.length; n++) {
    let i = e[n], s = r.marks[i], o = s;
    if (s)
      t.push(s);
    else
      for (let l in r.marks) {
        let a = r.marks[l];
        (i == "_" || a.spec.group && a.spec.group.split(" ").indexOf(i) > -1) && t.push(o = a);
      }
    if (!o)
      throw new SyntaxError("Unknown mark type: '" + e[n] + "'");
  }
  return t;
}
function Co(r) {
  return r.tag != null;
}
function Mo(r) {
  return r.style != null;
}
class Se {
  /**
  Create a parser that targets the given schema, using the given
  parsing rules.
  */
  constructor(e, t) {
    this.schema = e, this.rules = t, this.tags = [], this.styles = [];
    let n = this.matchedStyles = [];
    t.forEach((i) => {
      if (Co(i))
        this.tags.push(i);
      else if (Mo(i)) {
        let s = /[^=]*/.exec(i.style)[0];
        n.indexOf(s) < 0 && n.push(s), this.styles.push(i);
      }
    }), this.normalizeLists = !this.tags.some((i) => {
      if (!/^(ul|ol)\b/.test(i.tag) || !i.node)
        return !1;
      let s = e.nodes[i.node];
      return s.contentMatch.matchType(s);
    });
  }
  /**
  Parse a document from the content of a DOM node.
  */
  parse(e, t = {}) {
    let n = new xr(this, t, !1);
    return n.addAll(e, I.none, t.from, t.to), n.finish();
  }
  /**
  Parses the content of the given DOM node, like
  [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
  options. But unlike that method, which produces a whole node,
  this one returns a slice that is open at the sides, meaning that
  the schema constraints aren't applied to the start of nodes to
  the left of the input and the end of nodes at the end.
  */
  parseSlice(e, t = {}) {
    let n = new xr(this, t, !0);
    return n.addAll(e, I.none, t.from, t.to), k.maxOpen(n.finish());
  }
  /**
  @internal
  */
  matchTag(e, t, n) {
    for (let i = n ? this.tags.indexOf(n) + 1 : 0; i < this.tags.length; i++) {
      let s = this.tags[i];
      if (No(e, s.tag) && (s.namespace === void 0 || e.namespaceURI == s.namespace) && (!s.context || t.matchesContext(s.context))) {
        if (s.getAttrs) {
          let o = s.getAttrs(e);
          if (o === !1)
            continue;
          s.attrs = o || void 0;
        }
        return s;
      }
    }
  }
  /**
  @internal
  */
  matchStyle(e, t, n, i) {
    for (let s = i ? this.styles.indexOf(i) + 1 : 0; s < this.styles.length; s++) {
      let o = this.styles[s], l = o.style;
      if (!(l.indexOf(e) != 0 || o.context && !n.matchesContext(o.context) || // Test that the style string either precisely matches the prop,
      // or has an '=' sign after the prop, followed by the given
      // value.
      l.length > e.length && (l.charCodeAt(e.length) != 61 || l.slice(e.length + 1) != t))) {
        if (o.getAttrs) {
          let a = o.getAttrs(t);
          if (a === !1)
            continue;
          o.attrs = a || void 0;
        }
        return o;
      }
    }
  }
  /**
  @internal
  */
  static schemaRules(e) {
    let t = [];
    function n(i) {
      let s = i.priority == null ? 50 : i.priority, o = 0;
      for (; o < t.length; o++) {
        let l = t[o];
        if ((l.priority == null ? 50 : l.priority) < s)
          break;
      }
      t.splice(o, 0, i);
    }
    for (let i in e.marks) {
      let s = e.marks[i].spec.parseDOM;
      s && s.forEach((o) => {
        n(o = Sr(o)), o.mark || o.ignore || o.clearMark || (o.mark = i);
      });
    }
    for (let i in e.nodes) {
      let s = e.nodes[i].spec.parseDOM;
      s && s.forEach((o) => {
        n(o = Sr(o)), o.node || o.ignore || o.mark || (o.node = i);
      });
    }
    return t;
  }
  /**
  Construct a DOM parser using the parsing rules listed in a
  schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
  [priority](https://prosemirror.net/docs/ref/#model.ParseRule.priority).
  */
  static fromSchema(e) {
    return e.cached.domParser || (e.cached.domParser = new Se(e, Se.schemaRules(e)));
  }
}
const zi = {
  address: !0,
  article: !0,
  aside: !0,
  blockquote: !0,
  canvas: !0,
  dd: !0,
  div: !0,
  dl: !0,
  fieldset: !0,
  figcaption: !0,
  figure: !0,
  footer: !0,
  form: !0,
  h1: !0,
  h2: !0,
  h3: !0,
  h4: !0,
  h5: !0,
  h6: !0,
  header: !0,
  hgroup: !0,
  hr: !0,
  li: !0,
  noscript: !0,
  ol: !0,
  output: !0,
  p: !0,
  pre: !0,
  section: !0,
  table: !0,
  tfoot: !0,
  ul: !0
}, wo = {
  head: !0,
  noscript: !0,
  object: !0,
  script: !0,
  style: !0,
  title: !0
}, Fi = { ol: !0, ul: !0 }, dt = 1, En = 2, ot = 4;
function kr(r, e, t) {
  return e != null ? (e ? dt : 0) | (e === "full" ? En : 0) : r && r.whitespace == "pre" ? dt | En : t & ~ot;
}
class wt {
  constructor(e, t, n, i, s, o) {
    this.type = e, this.attrs = t, this.marks = n, this.solid = i, this.options = o, this.content = [], this.activeMarks = I.none, this.match = s || (o & ot ? null : e.contentMatch);
  }
  findWrapping(e) {
    if (!this.match) {
      if (!this.type)
        return [];
      let t = this.type.contentMatch.fillBefore(b.from(e));
      if (t)
        this.match = this.type.contentMatch.matchFragment(t);
      else {
        let n = this.type.contentMatch, i;
        return (i = n.findWrapping(e.type)) ? (this.match = n, i) : null;
      }
    }
    return this.match.findWrapping(e.type);
  }
  finish(e) {
    if (!(this.options & dt)) {
      let n = this.content[this.content.length - 1], i;
      if (n && n.isText && (i = /[ \t\r\n\u000c]+$/.exec(n.text))) {
        let s = n;
        n.text.length == i[0].length ? this.content.pop() : this.content[this.content.length - 1] = s.withText(s.text.slice(0, s.text.length - i[0].length));
      }
    }
    let t = b.from(this.content);
    return !e && this.match && (t = t.append(this.match.fillBefore(b.empty, !0))), this.type ? this.type.create(this.attrs, t, this.marks) : t;
  }
  inlineContext(e) {
    return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !zi.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
  }
}
class xr {
  constructor(e, t, n) {
    this.parser = e, this.options = t, this.isOpen = n, this.open = 0, this.localPreserveWS = !1;
    let i = t.topNode, s, o = kr(null, t.preserveWhitespace, 0) | (n ? ot : 0);
    i ? s = new wt(i.type, i.attrs, I.none, !0, t.topMatch || i.type.contentMatch, o) : n ? s = new wt(null, null, I.none, !0, null, o) : s = new wt(e.schema.topNodeType, null, I.none, !0, null, o), this.nodes = [s], this.find = t.findPositions, this.needsBlock = !1;
  }
  get top() {
    return this.nodes[this.open];
  }
  // Add a DOM node to the content. Text is inserted as text node,
  // otherwise, the node is passed to `addElement` or, if it has a
  // `style` attribute, `addElementWithStyles`.
  addDOM(e, t) {
    e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t);
  }
  addTextNode(e, t) {
    let n = e.nodeValue, i = this.top, s = i.options & En ? "full" : this.localPreserveWS || (i.options & dt) > 0;
    if (s === "full" || i.inlineContext(e) || /[^ \t\r\n\u000c]/.test(n)) {
      if (s)
        s !== "full" ? n = n.replace(/\r?\n|\r/g, " ") : n = n.replace(/\r\n?/g, `
`);
      else if (n = n.replace(/[ \t\r\n\u000c]+/g, " "), /^[ \t\r\n\u000c]/.test(n) && this.open == this.nodes.length - 1) {
        let o = i.content[i.content.length - 1], l = e.previousSibling;
        (!o || l && l.nodeName == "BR" || o.isText && /[ \t\r\n\u000c]$/.test(o.text)) && (n = n.slice(1));
      }
      n && this.insertNode(this.parser.schema.text(n), t), this.findInText(e);
    } else
      this.findInside(e);
  }
  // Try to find a handler for the given tag and use that to parse. If
  // none is found, the element's content nodes are added directly.
  addElement(e, t, n) {
    let i = this.localPreserveWS, s = this.top;
    (e.tagName == "PRE" || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
    let o = e.nodeName.toLowerCase(), l;
    Fi.hasOwnProperty(o) && this.parser.normalizeLists && Oo(e);
    let a = this.options.ruleFromNode && this.options.ruleFromNode(e) || (l = this.parser.matchTag(e, this, n));
    e: if (a ? a.ignore : wo.hasOwnProperty(o))
      this.findInside(e), this.ignoreFallback(e, t);
    else if (!a || a.skip || a.closeParent) {
      a && a.closeParent ? this.open = Math.max(0, this.open - 1) : a && a.skip.nodeType && (e = a.skip);
      let c, f = this.needsBlock;
      if (zi.hasOwnProperty(o))
        s.content.length && s.content[0].isInline && this.open && (this.open--, s = this.top), c = !0, s.type || (this.needsBlock = !0);
      else if (!e.firstChild) {
        this.leafFallback(e, t);
        break e;
      }
      let d = a && a.skip ? t : this.readStyles(e, t);
      d && this.addAll(e, d), c && this.sync(s), this.needsBlock = f;
    } else {
      let c = this.readStyles(e, t);
      c && this.addElementByRule(e, a, c, a.consuming === !1 ? l : void 0);
    }
    this.localPreserveWS = i;
  }
  // Called for leaf DOM nodes that would otherwise be ignored
  leafFallback(e, t) {
    e.nodeName == "BR" && this.top.type && this.top.type.inlineContent && this.addTextNode(e.ownerDocument.createTextNode(`
`), t);
  }
  // Called for ignored nodes
  ignoreFallback(e, t) {
    e.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent) && this.findPlace(this.parser.schema.text("-"), t);
  }
  // Run any style parser associated with the node's styles. Either
  // return an updated array of marks, or null to indicate some of the
  // styles had a rule with `ignore` set.
  readStyles(e, t) {
    let n = e.style;
    if (n && n.length)
      for (let i = 0; i < this.parser.matchedStyles.length; i++) {
        let s = this.parser.matchedStyles[i], o = n.getPropertyValue(s);
        if (o)
          for (let l = void 0; ; ) {
            let a = this.parser.matchStyle(s, o, this, l);
            if (!a)
              break;
            if (a.ignore)
              return null;
            if (a.clearMark ? t = t.filter((c) => !a.clearMark(c)) : t = t.concat(this.parser.schema.marks[a.mark].create(a.attrs)), a.consuming === !1)
              l = a;
            else
              break;
          }
      }
    return t;
  }
  // Look up a handler for the given node. If none are found, return
  // false. Otherwise, apply it, use its return value to drive the way
  // the node's content is wrapped, and return true.
  addElementByRule(e, t, n, i) {
    let s, o;
    if (t.node)
      if (o = this.parser.schema.nodes[t.node], o.isLeaf)
        this.insertNode(o.create(t.attrs), n) || this.leafFallback(e, n);
      else {
        let a = this.enter(o, t.attrs || null, n, t.preserveWhitespace);
        a && (s = !0, n = a);
      }
    else {
      let a = this.parser.schema.marks[t.mark];
      n = n.concat(a.create(t.attrs));
    }
    let l = this.top;
    if (o && o.isLeaf)
      this.findInside(e);
    else if (i)
      this.addElement(e, n, i);
    else if (t.getContent)
      this.findInside(e), t.getContent(e, this.parser.schema).forEach((a) => this.insertNode(a, n));
    else {
      let a = e;
      typeof t.contentElement == "string" ? a = e.querySelector(t.contentElement) : typeof t.contentElement == "function" ? a = t.contentElement(e) : t.contentElement && (a = t.contentElement), this.findAround(e, a, !0), this.addAll(a, n), this.findAround(e, a, !1);
    }
    s && this.sync(l) && this.open--;
  }
  // Add all child nodes between `startIndex` and `endIndex` (or the
  // whole node, if not given). If `sync` is passed, use it to
  // synchronize after every block element.
  addAll(e, t, n, i) {
    let s = n || 0;
    for (let o = n ? e.childNodes[n] : e.firstChild, l = i == null ? null : e.childNodes[i]; o != l; o = o.nextSibling, ++s)
      this.findAtPoint(e, s), this.addDOM(o, t);
    this.findAtPoint(e, s);
  }
  // Try to find a way to fit the given node type into the current
  // context. May add intermediate wrappers and/or leave non-solid
  // nodes that we're in.
  findPlace(e, t) {
    let n, i;
    for (let s = this.open; s >= 0; s--) {
      let o = this.nodes[s], l = o.findWrapping(e);
      if (l && (!n || n.length > l.length) && (n = l, i = o, !l.length) || o.solid)
        break;
    }
    if (!n)
      return null;
    this.sync(i);
    for (let s = 0; s < n.length; s++)
      t = this.enterInner(n[s], null, t, !1);
    return t;
  }
  // Try to insert the given node, adjusting the context when needed.
  insertNode(e, t) {
    if (e.isInline && this.needsBlock && !this.top.type) {
      let i = this.textblockFromContext();
      i && (t = this.enterInner(i, null, t));
    }
    let n = this.findPlace(e, t);
    if (n) {
      this.closeExtra();
      let i = this.top;
      i.match && (i.match = i.match.matchType(e.type));
      let s = I.none;
      for (let o of n.concat(e.marks))
        (i.type ? i.type.allowsMarkType(o.type) : Cr(o.type, e.type)) && (s = o.addToSet(s));
      return i.content.push(e.mark(s)), !0;
    }
    return !1;
  }
  // Try to start a node of the given type, adjusting the context when
  // necessary.
  enter(e, t, n, i) {
    let s = this.findPlace(e.create(t), n);
    return s && (s = this.enterInner(e, t, n, !0, i)), s;
  }
  // Open a node of the given type
  enterInner(e, t, n, i = !1, s) {
    this.closeExtra();
    let o = this.top;
    o.match = o.match && o.match.matchType(e);
    let l = kr(e, s, o.options);
    o.options & ot && o.content.length == 0 && (l |= ot);
    let a = I.none;
    return n = n.filter((c) => (o.type ? o.type.allowsMarkType(c.type) : Cr(c.type, e)) ? (a = c.addToSet(a), !1) : !0), this.nodes.push(new wt(e, t, a, i, null, l)), this.open++, n;
  }
  // Make sure all nodes above this.open are finished and added to
  // their parents
  closeExtra(e = !1) {
    let t = this.nodes.length - 1;
    if (t > this.open) {
      for (; t > this.open; t--)
        this.nodes[t - 1].content.push(this.nodes[t].finish(e));
      this.nodes.length = this.open + 1;
    }
  }
  finish() {
    return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
  }
  sync(e) {
    for (let t = this.open; t >= 0; t--) {
      if (this.nodes[t] == e)
        return this.open = t, !0;
      this.localPreserveWS && (this.nodes[t].options |= dt);
    }
    return !1;
  }
  get currentPos() {
    this.closeExtra();
    let e = 0;
    for (let t = this.open; t >= 0; t--) {
      let n = this.nodes[t].content;
      for (let i = n.length - 1; i >= 0; i--)
        e += n[i].nodeSize;
      t && e++;
    }
    return e;
  }
  findAtPoint(e, t) {
    if (this.find)
      for (let n = 0; n < this.find.length; n++)
        this.find[n].node == e && this.find[n].offset == t && (this.find[n].pos = this.currentPos);
  }
  findInside(e) {
    if (this.find)
      for (let t = 0; t < this.find.length; t++)
        this.find[t].pos == null && e.nodeType == 1 && e.contains(this.find[t].node) && (this.find[t].pos = this.currentPos);
  }
  findAround(e, t, n) {
    if (e != t && this.find)
      for (let i = 0; i < this.find.length; i++)
        this.find[i].pos == null && e.nodeType == 1 && e.contains(this.find[i].node) && t.compareDocumentPosition(this.find[i].node) & (n ? 2 : 4) && (this.find[i].pos = this.currentPos);
  }
  findInText(e) {
    if (this.find)
      for (let t = 0; t < this.find.length; t++)
        this.find[t].node == e && (this.find[t].pos = this.currentPos - (e.nodeValue.length - this.find[t].offset));
  }
  // Determines whether the given context string matches this context.
  matchesContext(e) {
    if (e.indexOf("|") > -1)
      return e.split(/\s*\|\s*/).some(this.matchesContext, this);
    let t = e.split("/"), n = this.options.context, i = !this.isOpen && (!n || n.parent.type == this.nodes[0].type), s = -(n ? n.depth + 1 : 0) + (i ? 0 : 1), o = (l, a) => {
      for (; l >= 0; l--) {
        let c = t[l];
        if (c == "") {
          if (l == t.length - 1 || l == 0)
            continue;
          for (; a >= s; a--)
            if (o(l - 1, a))
              return !0;
          return !1;
        } else {
          let f = a > 0 || a == 0 && i ? this.nodes[a].type : n && a >= s ? n.node(a - s).type : null;
          if (!f || f.name != c && !f.isInGroup(c))
            return !1;
          a--;
        }
      }
      return !0;
    };
    return o(t.length - 1, this.open);
  }
  textblockFromContext() {
    let e = this.options.context;
    if (e)
      for (let t = e.depth; t >= 0; t--) {
        let n = e.node(t).contentMatchAt(e.indexAfter(t)).defaultType;
        if (n && n.isTextblock && n.defaultAttrs)
          return n;
      }
    for (let t in this.parser.schema.nodes) {
      let n = this.parser.schema.nodes[t];
      if (n.isTextblock && n.defaultAttrs)
        return n;
    }
  }
}
function Oo(r) {
  for (let e = r.firstChild, t = null; e; e = e.nextSibling) {
    let n = e.nodeType == 1 ? e.nodeName.toLowerCase() : null;
    n && Fi.hasOwnProperty(n) && t ? (t.appendChild(e), e = t) : n == "li" ? t = e : n && (t = null);
  }
}
function No(r, e) {
  return (r.matches || r.msMatchesSelector || r.webkitMatchesSelector || r.mozMatchesSelector).call(r, e);
}
function Sr(r) {
  let e = {};
  for (let t in r)
    e[t] = r[t];
  return e;
}
function Cr(r, e) {
  let t = e.schema.nodes;
  for (let n in t) {
    let i = t[n];
    if (!i.allowsMarkType(r))
      continue;
    let s = [], o = (l) => {
      s.push(l);
      for (let a = 0; a < l.edgeCount; a++) {
        let { type: c, next: f } = l.edge(a);
        if (c == e || s.indexOf(f) < 0 && o(f))
          return !0;
      }
    };
    if (o(i.contentMatch))
      return !0;
  }
}
class $e {
  /**
  Create a serializer. `nodes` should map node names to functions
  that take a node and return a description of the corresponding
  DOM. `marks` does the same for mark names, but also gets an
  argument that tells it whether the mark's content is block or
  inline content (for typical use, it'll always be inline). A mark
  serializer may be `null` to indicate that marks of that type
  should not be serialized.
  */
  constructor(e, t) {
    this.nodes = e, this.marks = t;
  }
  /**
  Serialize the content of this fragment to a DOM fragment. When
  not in the browser, the `document` option, containing a DOM
  document, should be passed so that the serializer can create
  nodes.
  */
  serializeFragment(e, t = {}, n) {
    n || (n = an(t).createDocumentFragment());
    let i = n, s = [];
    return e.forEach((o) => {
      if (s.length || o.marks.length) {
        let l = 0, a = 0;
        for (; l < s.length && a < o.marks.length; ) {
          let c = o.marks[a];
          if (!this.marks[c.type.name]) {
            a++;
            continue;
          }
          if (!c.eq(s[l][0]) || c.type.spec.spanning === !1)
            break;
          l++, a++;
        }
        for (; l < s.length; )
          i = s.pop()[1];
        for (; a < o.marks.length; ) {
          let c = o.marks[a++], f = this.serializeMark(c, o.isInline, t);
          f && (s.push([c, i]), i.appendChild(f.dom), i = f.contentDOM || f.dom);
        }
      }
      i.appendChild(this.serializeNodeInner(o, t));
    }), n;
  }
  /**
  @internal
  */
  serializeNodeInner(e, t) {
    let { dom: n, contentDOM: i } = At(an(t), this.nodes[e.type.name](e), null, e.attrs);
    if (i) {
      if (e.isLeaf)
        throw new RangeError("Content hole not allowed in a leaf node spec");
      this.serializeFragment(e.content, t, i);
    }
    return n;
  }
  /**
  Serialize this node to a DOM node. This can be useful when you
  need to serialize a part of a document, as opposed to the whole
  document. To serialize a whole document, use
  [`serializeFragment`](https://prosemirror.net/docs/ref/#model.DOMSerializer.serializeFragment) on
  its [content](https://prosemirror.net/docs/ref/#model.Node.content).
  */
  serializeNode(e, t = {}) {
    let n = this.serializeNodeInner(e, t);
    for (let i = e.marks.length - 1; i >= 0; i--) {
      let s = this.serializeMark(e.marks[i], e.isInline, t);
      s && ((s.contentDOM || s.dom).appendChild(n), n = s.dom);
    }
    return n;
  }
  /**
  @internal
  */
  serializeMark(e, t, n = {}) {
    let i = this.marks[e.type.name];
    return i && At(an(n), i(e, t), null, e.attrs);
  }
  static renderSpec(e, t, n = null, i) {
    return At(e, t, n, i);
  }
  /**
  Build a serializer using the [`toDOM`](https://prosemirror.net/docs/ref/#model.NodeSpec.toDOM)
  properties in a schema's node and mark specs.
  */
  static fromSchema(e) {
    return e.cached.domSerializer || (e.cached.domSerializer = new $e(this.nodesFromSchema(e), this.marksFromSchema(e)));
  }
  /**
  Gather the serializers in a schema's node specs into an object.
  This can be useful as a base to build a custom serializer from.
  */
  static nodesFromSchema(e) {
    let t = Mr(e.nodes);
    return t.text || (t.text = (n) => n.text), t;
  }
  /**
  Gather the serializers in a schema's mark specs into an object.
  */
  static marksFromSchema(e) {
    return Mr(e.marks);
  }
}
function Mr(r) {
  let e = {};
  for (let t in r) {
    let n = r[t].spec.toDOM;
    n && (e[t] = n);
  }
  return e;
}
function an(r) {
  return r.document || window.document;
}
const wr = /* @__PURE__ */ new WeakMap();
function To(r) {
  let e = wr.get(r);
  return e === void 0 && wr.set(r, e = Eo(r)), e;
}
function Eo(r) {
  let e = null;
  function t(n) {
    if (n && typeof n == "object")
      if (Array.isArray(n))
        if (typeof n[0] == "string")
          e || (e = []), e.push(n);
        else
          for (let i = 0; i < n.length; i++)
            t(n[i]);
      else
        for (let i in n)
          t(n[i]);
  }
  return t(r), e;
}
function At(r, e, t, n) {
  if (typeof e == "string")
    return { dom: r.createTextNode(e) };
  if (e.nodeType != null)
    return { dom: e };
  if (e.dom && e.dom.nodeType != null)
    return e;
  let i = e[0], s;
  if (typeof i != "string")
    throw new RangeError("Invalid array passed to renderSpec");
  if (n && (s = To(n)) && s.indexOf(e) > -1)
    throw new RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
  let o = i.indexOf(" ");
  o > 0 && (t = i.slice(0, o), i = i.slice(o + 1));
  let l, a = t ? r.createElementNS(t, i) : r.createElement(i), c = e[1], f = 1;
  if (c && typeof c == "object" && c.nodeType == null && !Array.isArray(c)) {
    f = 2;
    for (let d in c)
      if (c[d] != null) {
        let u = d.indexOf(" ");
        u > 0 ? a.setAttributeNS(d.slice(0, u), d.slice(u + 1), c[d]) : a.setAttribute(d, c[d]);
      }
  }
  for (let d = f; d < e.length; d++) {
    let u = e[d];
    if (u === 0) {
      if (d < e.length - 1 || d > f)
        throw new RangeError("Content hole must be the only child of its parent node");
      return { dom: a, contentDOM: a };
    } else {
      let { dom: h, contentDOM: p } = At(r, u, t, n);
      if (a.appendChild(h), p) {
        if (l)
          throw new RangeError("Multiple content holes");
        l = p;
      }
    }
  }
  return { dom: a, contentDOM: l };
}
const Vi = 65535, Li = Math.pow(2, 16);
function Do(r, e) {
  return r + e * Li;
}
function Or(r) {
  return r & Vi;
}
function Ao(r) {
  return (r - (r & Vi)) / Li;
}
const $i = 1, Wi = 2, It = 4, Ji = 8;
class Dn {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.pos = e, this.delInfo = t, this.recover = n;
  }
  /**
  Tells you whether the position was deleted, that is, whether the
  step removed the token on the side queried (via the `assoc`)
  argument from the document.
  */
  get deleted() {
    return (this.delInfo & Ji) > 0;
  }
  /**
  Tells you whether the token before the mapped position was deleted.
  */
  get deletedBefore() {
    return (this.delInfo & ($i | It)) > 0;
  }
  /**
  True when the token after the mapped position was deleted.
  */
  get deletedAfter() {
    return (this.delInfo & (Wi | It)) > 0;
  }
  /**
  Tells whether any of the steps mapped through deletes across the
  position (including both the token before and after the
  position).
  */
  get deletedAcross() {
    return (this.delInfo & It) > 0;
  }
}
class Y {
  /**
  Create a position map. The modifications to the document are
  represented as an array of numbers, in which each group of three
  represents a modified chunk as `[start, oldSize, newSize]`.
  */
  constructor(e, t = !1) {
    if (this.ranges = e, this.inverted = t, !e.length && Y.empty)
      return Y.empty;
  }
  /**
  @internal
  */
  recover(e) {
    let t = 0, n = Or(e);
    if (!this.inverted)
      for (let i = 0; i < n; i++)
        t += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
    return this.ranges[n * 3] + t + Ao(e);
  }
  mapResult(e, t = 1) {
    return this._map(e, t, !1);
  }
  map(e, t = 1) {
    return this._map(e, t, !0);
  }
  /**
  @internal
  */
  _map(e, t, n) {
    let i = 0, s = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let l = 0; l < this.ranges.length; l += 3) {
      let a = this.ranges[l] - (this.inverted ? i : 0);
      if (a > e)
        break;
      let c = this.ranges[l + s], f = this.ranges[l + o], d = a + c;
      if (e <= d) {
        let u = c ? e == a ? -1 : e == d ? 1 : t : t, h = a + i + (u < 0 ? 0 : f);
        if (n)
          return h;
        let p = e == (t < 0 ? a : d) ? null : Do(l / 3, e - a), m = e == a ? Wi : e == d ? $i : It;
        return (t < 0 ? e != a : e != d) && (m |= Ji), new Dn(h, m, p);
      }
      i += f - c;
    }
    return n ? e + i : new Dn(e + i, 0, null);
  }
  /**
  @internal
  */
  touches(e, t) {
    let n = 0, i = Or(t), s = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let l = 0; l < this.ranges.length; l += 3) {
      let a = this.ranges[l] - (this.inverted ? n : 0);
      if (a > e)
        break;
      let c = this.ranges[l + s], f = a + c;
      if (e <= f && l == i * 3)
        return !0;
      n += this.ranges[l + o] - c;
    }
    return !1;
  }
  /**
  Calls the given function on each of the changed ranges included in
  this map.
  */
  forEach(e) {
    let t = this.inverted ? 2 : 1, n = this.inverted ? 1 : 2;
    for (let i = 0, s = 0; i < this.ranges.length; i += 3) {
      let o = this.ranges[i], l = o - (this.inverted ? s : 0), a = o + (this.inverted ? 0 : s), c = this.ranges[i + t], f = this.ranges[i + n];
      e(l, l + c, a, a + f), s += f - c;
    }
  }
  /**
  Create an inverted version of this map. The result can be used to
  map positions in the post-step document to the pre-step document.
  */
  invert() {
    return new Y(this.ranges, !this.inverted);
  }
  /**
  @internal
  */
  toString() {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
  }
  /**
  Create a map that moves all positions by offset `n` (which may be
  negative). This can be useful when applying steps meant for a
  sub-document to a larger document, or vice-versa.
  */
  static offset(e) {
    return e == 0 ? Y.empty : new Y(e < 0 ? [0, -e, 0] : [0, 0, e]);
  }
}
Y.empty = new Y([]);
class lt {
  /**
  Create a new mapping with the given position maps.
  */
  constructor(e = [], t, n = 0, i = e.length) {
    this.maps = e, this.mirror = t, this.from = n, this.to = i;
  }
  /**
  Create a mapping that maps only through a part of this one.
  */
  slice(e = 0, t = this.maps.length) {
    return new lt(this.maps, this.mirror, e, t);
  }
  /**
  @internal
  */
  copy() {
    return new lt(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
  }
  /**
  Add a step map to the end of this mapping. If `mirrors` is
  given, it should be the index of the step map that is the mirror
  image of this one.
  */
  appendMap(e, t) {
    this.to = this.maps.push(e), t != null && this.setMirror(this.maps.length - 1, t);
  }
  /**
  Add all the step maps in a given mapping to this one (preserving
  mirroring information).
  */
  appendMapping(e) {
    for (let t = 0, n = this.maps.length; t < e.maps.length; t++) {
      let i = e.getMirror(t);
      this.appendMap(e.maps[t], i != null && i < t ? n + i : void 0);
    }
  }
  /**
  Finds the offset of the step map that mirrors the map at the
  given offset, in this mapping (as per the second argument to
  `appendMap`).
  */
  getMirror(e) {
    if (this.mirror) {
      for (let t = 0; t < this.mirror.length; t++)
        if (this.mirror[t] == e)
          return this.mirror[t + (t % 2 ? -1 : 1)];
    }
  }
  /**
  @internal
  */
  setMirror(e, t) {
    this.mirror || (this.mirror = []), this.mirror.push(e, t);
  }
  /**
  Append the inverse of the given mapping to this one.
  */
  appendMappingInverted(e) {
    for (let t = e.maps.length - 1, n = this.maps.length + e.maps.length; t >= 0; t--) {
      let i = e.getMirror(t);
      this.appendMap(e.maps[t].invert(), i != null && i > t ? n - i - 1 : void 0);
    }
  }
  /**
  Create an inverted version of this mapping.
  */
  invert() {
    let e = new lt();
    return e.appendMappingInverted(this), e;
  }
  /**
  Map a position through this mapping.
  */
  map(e, t = 1) {
    if (this.mirror)
      return this._map(e, t, !0);
    for (let n = this.from; n < this.to; n++)
      e = this.maps[n].map(e, t);
    return e;
  }
  /**
  Map a position through this mapping, returning a mapping
  result.
  */
  mapResult(e, t = 1) {
    return this._map(e, t, !1);
  }
  /**
  @internal
  */
  _map(e, t, n) {
    let i = 0;
    for (let s = this.from; s < this.to; s++) {
      let o = this.maps[s], l = o.mapResult(e, t);
      if (l.recover != null) {
        let a = this.getMirror(s);
        if (a != null && a > s && a < this.to) {
          s = a, e = this.maps[a].recover(l.recover);
          continue;
        }
      }
      i |= l.delInfo, e = l.pos;
    }
    return n ? e : new Dn(e, i, null);
  }
}
const cn = /* @__PURE__ */ Object.create(null);
class J {
  /**
  Get the step map that represents the changes made by this step,
  and which can be used to transform between positions in the old
  and the new document.
  */
  getMap() {
    return Y.empty;
  }
  /**
  Try to merge this step with another one, to be applied directly
  after it. Returns the merged step when possible, null if the
  steps can't be merged.
  */
  merge(e) {
    return null;
  }
  /**
  Deserialize a step from its JSON representation. Will call
  through to the step class' own implementation of this method.
  */
  static fromJSON(e, t) {
    if (!t || !t.stepType)
      throw new RangeError("Invalid input for Step.fromJSON");
    let n = cn[t.stepType];
    if (!n)
      throw new RangeError(`No step type ${t.stepType} defined`);
    return n.fromJSON(e, t);
  }
  /**
  To be able to serialize steps to JSON, each step needs a string
  ID to attach to its JSON representation. Use this method to
  register an ID for your step classes. Try to pick something
  that's unlikely to clash with steps from other modules.
  */
  static jsonID(e, t) {
    if (e in cn)
      throw new RangeError("Duplicate use of step JSON ID " + e);
    return cn[e] = t, t.prototype.jsonID = e, t;
  }
}
class R {
  /**
  @internal
  */
  constructor(e, t) {
    this.doc = e, this.failed = t;
  }
  /**
  Create a successful step result.
  */
  static ok(e) {
    return new R(e, null);
  }
  /**
  Create a failed step result.
  */
  static fail(e) {
    return new R(null, e);
  }
  /**
  Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
  arguments. Create a successful result if it succeeds, and a
  failed one if it throws a `ReplaceError`.
  */
  static fromReplace(e, t, n, i) {
    try {
      return R.ok(e.replace(t, n, i));
    } catch (s) {
      if (s instanceof Pt)
        return R.fail(s.message);
      throw s;
    }
  }
}
function Kn(r, e, t) {
  let n = [];
  for (let i = 0; i < r.childCount; i++) {
    let s = r.child(i);
    s.content.size && (s = s.copy(Kn(s.content, e, s))), s.isInline && (s = e(s, t, i)), n.push(s);
  }
  return b.fromArray(n);
}
class ye extends J {
  /**
  Create a mark step.
  */
  constructor(e, t, n) {
    super(), this.from = e, this.to = t, this.mark = n;
  }
  apply(e) {
    let t = e.slice(this.from, this.to), n = e.resolve(this.from), i = n.node(n.sharedDepth(this.to)), s = new k(Kn(t.content, (o, l) => !o.isAtom || !l.type.allowsMarkType(this.mark.type) ? o : o.mark(this.mark.addToSet(o.marks)), i), t.openStart, t.openEnd);
    return R.fromReplace(e, this.from, this.to, s);
  }
  invert() {
    return new re(this.from, this.to, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1);
    return t.deleted && n.deleted || t.pos >= n.pos ? null : new ye(t.pos, n.pos, this.mark);
  }
  merge(e) {
    return e instanceof ye && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new ye(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
  }
  toJSON() {
    return {
      stepType: "addMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for AddMarkStep.fromJSON");
    return new ye(t.from, t.to, e.markFromJSON(t.mark));
  }
}
J.jsonID("addMark", ye);
class re extends J {
  /**
  Create a mark-removing step.
  */
  constructor(e, t, n) {
    super(), this.from = e, this.to = t, this.mark = n;
  }
  apply(e) {
    let t = e.slice(this.from, this.to), n = new k(Kn(t.content, (i) => i.mark(this.mark.removeFromSet(i.marks)), e), t.openStart, t.openEnd);
    return R.fromReplace(e, this.from, this.to, n);
  }
  invert() {
    return new ye(this.from, this.to, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1);
    return t.deleted && n.deleted || t.pos >= n.pos ? null : new re(t.pos, n.pos, this.mark);
  }
  merge(e) {
    return e instanceof re && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new re(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
  }
  toJSON() {
    return {
      stepType: "removeMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new re(t.from, t.to, e.markFromJSON(t.mark));
  }
}
J.jsonID("removeMark", re);
class be extends J {
  /**
  Create a node mark step.
  */
  constructor(e, t) {
    super(), this.pos = e, this.mark = t;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return R.fail("No node at mark step's position");
    let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
    return R.fromReplace(e, this.pos, this.pos + 1, new k(b.from(n), 0, t.isLeaf ? 0 : 1));
  }
  invert(e) {
    let t = e.nodeAt(this.pos);
    if (t) {
      let n = this.mark.addToSet(t.marks);
      if (n.length == t.marks.length) {
        for (let i = 0; i < t.marks.length; i++)
          if (!t.marks[i].isInSet(n))
            return new be(this.pos, t.marks[i]);
        return new be(this.pos, this.mark);
      }
    }
    return new _e(this.pos, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new be(t.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.pos != "number")
      throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new be(t.pos, e.markFromJSON(t.mark));
  }
}
J.jsonID("addNodeMark", be);
class _e extends J {
  /**
  Create a mark-removing step.
  */
  constructor(e, t) {
    super(), this.pos = e, this.mark = t;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return R.fail("No node at mark step's position");
    let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
    return R.fromReplace(e, this.pos, this.pos + 1, new k(b.from(n), 0, t.isLeaf ? 0 : 1));
  }
  invert(e) {
    let t = e.nodeAt(this.pos);
    return !t || !this.mark.isInSet(t.marks) ? this : new be(this.pos, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new _e(t.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.pos != "number")
      throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new _e(t.pos, e.markFromJSON(t.mark));
  }
}
J.jsonID("removeNodeMark", _e);
class P extends J {
  /**
  The given `slice` should fit the 'gap' between `from` and
  `to`—the depths must line up, and the surrounding nodes must be
  able to be joined with the open sides of the slice. When
  `structure` is true, the step will fail if the content between
  from and to is not just a sequence of closing and then opening
  tokens (this is to guard against rebased replace steps
  overwriting something they weren't supposed to).
  */
  constructor(e, t, n, i = !1) {
    super(), this.from = e, this.to = t, this.slice = n, this.structure = i;
  }
  apply(e) {
    return this.structure && An(e, this.from, this.to) ? R.fail("Structure replace would overwrite content") : R.fromReplace(e, this.from, this.to, this.slice);
  }
  getMap() {
    return new Y([this.from, this.to - this.from, this.slice.size]);
  }
  invert(e) {
    return new P(this.from, this.from + this.slice.size, e.slice(this.from, this.to));
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1);
    return t.deletedAcross && n.deletedAcross ? null : new P(t.pos, Math.max(t.pos, n.pos), this.slice);
  }
  merge(e) {
    if (!(e instanceof P) || e.structure || this.structure)
      return null;
    if (this.from + this.slice.size == e.from && !this.slice.openEnd && !e.slice.openStart) {
      let t = this.slice.size + e.slice.size == 0 ? k.empty : new k(this.slice.content.append(e.slice.content), this.slice.openStart, e.slice.openEnd);
      return new P(this.from, this.to + (e.to - e.from), t, this.structure);
    } else if (e.to == this.from && !this.slice.openStart && !e.slice.openEnd) {
      let t = this.slice.size + e.slice.size == 0 ? k.empty : new k(e.slice.content.append(this.slice.content), e.slice.openStart, this.slice.openEnd);
      return new P(e.from, this.to, t, this.structure);
    } else
      return null;
  }
  toJSON() {
    let e = { stepType: "replace", from: this.from, to: this.to };
    return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for ReplaceStep.fromJSON");
    return new P(t.from, t.to, k.fromJSON(e, t.slice), !!t.structure);
  }
}
J.jsonID("replace", P);
class B extends J {
  /**
  Create a replace-around step with the given range and gap.
  `insert` should be the point in the slice into which the content
  of the gap should be moved. `structure` has the same meaning as
  it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
  */
  constructor(e, t, n, i, s, o, l = !1) {
    super(), this.from = e, this.to = t, this.gapFrom = n, this.gapTo = i, this.slice = s, this.insert = o, this.structure = l;
  }
  apply(e) {
    if (this.structure && (An(e, this.from, this.gapFrom) || An(e, this.gapTo, this.to)))
      return R.fail("Structure gap-replace would overwrite content");
    let t = e.slice(this.gapFrom, this.gapTo);
    if (t.openStart || t.openEnd)
      return R.fail("Gap is not a flat range");
    let n = this.slice.insertAt(this.insert, t.content);
    return n ? R.fromReplace(e, this.from, this.to, n) : R.fail("Content does not fit in gap");
  }
  getMap() {
    return new Y([
      this.from,
      this.gapFrom - this.from,
      this.insert,
      this.gapTo,
      this.to - this.gapTo,
      this.slice.size - this.insert
    ]);
  }
  invert(e) {
    let t = this.gapTo - this.gapFrom;
    return new B(this.from, this.from + this.slice.size + t, this.from + this.insert, this.from + this.insert + t, e.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1), i = this.from == this.gapFrom ? t.pos : e.map(this.gapFrom, -1), s = this.to == this.gapTo ? n.pos : e.map(this.gapTo, 1);
    return t.deletedAcross && n.deletedAcross || i < t.pos || s > n.pos ? null : new B(t.pos, n.pos, i, s, this.slice, this.insert, this.structure);
  }
  toJSON() {
    let e = {
      stepType: "replaceAround",
      from: this.from,
      to: this.to,
      gapFrom: this.gapFrom,
      gapTo: this.gapTo,
      insert: this.insert
    };
    return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number" || typeof t.gapFrom != "number" || typeof t.gapTo != "number" || typeof t.insert != "number")
      throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new B(t.from, t.to, t.gapFrom, t.gapTo, k.fromJSON(e, t.slice), t.insert, !!t.structure);
  }
}
J.jsonID("replaceAround", B);
function An(r, e, t) {
  let n = r.resolve(e), i = t - e, s = n.depth;
  for (; i > 0 && s > 0 && n.indexAfter(s) == n.node(s).childCount; )
    s--, i--;
  if (i > 0) {
    let o = n.node(s).maybeChild(n.indexAfter(s));
    for (; i > 0; ) {
      if (!o || o.isLeaf)
        return !0;
      o = o.firstChild, i--;
    }
  }
  return !1;
}
function Io(r, e, t, n) {
  let i = [], s = [], o, l;
  r.doc.nodesBetween(e, t, (a, c, f) => {
    if (!a.isInline)
      return;
    let d = a.marks;
    if (!n.isInSet(d) && f.type.allowsMarkType(n.type)) {
      let u = Math.max(c, e), h = Math.min(c + a.nodeSize, t), p = n.addToSet(d);
      for (let m = 0; m < d.length; m++)
        d[m].isInSet(p) || (o && o.to == u && o.mark.eq(d[m]) ? o.to = h : i.push(o = new re(u, h, d[m])));
      l && l.to == u ? l.to = h : s.push(l = new ye(u, h, n));
    }
  }), i.forEach((a) => r.step(a)), s.forEach((a) => r.step(a));
}
function Ro(r, e, t, n) {
  let i = [], s = 0;
  r.doc.nodesBetween(e, t, (o, l) => {
    if (!o.isInline)
      return;
    s++;
    let a = null;
    if (n instanceof Ht) {
      let c = o.marks, f;
      for (; f = n.isInSet(c); )
        (a || (a = [])).push(f), c = f.removeFromSet(c);
    } else n ? n.isInSet(o.marks) && (a = [n]) : a = o.marks;
    if (a && a.length) {
      let c = Math.min(l + o.nodeSize, t);
      for (let f = 0; f < a.length; f++) {
        let d = a[f], u;
        for (let h = 0; h < i.length; h++) {
          let p = i[h];
          p.step == s - 1 && d.eq(i[h].style) && (u = p);
        }
        u ? (u.to = c, u.step = s) : i.push({ style: d, from: Math.max(l, e), to: c, step: s });
      }
    }
  }), i.forEach((o) => r.step(new re(o.from, o.to, o.style)));
}
function Hn(r, e, t, n = t.contentMatch, i = !0) {
  let s = r.doc.nodeAt(e), o = [], l = e + 1;
  for (let a = 0; a < s.childCount; a++) {
    let c = s.child(a), f = l + c.nodeSize, d = n.matchType(c.type);
    if (!d)
      o.push(new P(l, f, k.empty));
    else {
      n = d;
      for (let u = 0; u < c.marks.length; u++)
        t.allowsMarkType(c.marks[u].type) || r.step(new re(l, f, c.marks[u]));
      if (i && c.isText && t.whitespace != "pre") {
        let u, h = /\r?\n|\r/g, p;
        for (; u = h.exec(c.text); )
          p || (p = new k(b.from(t.schema.text(" ", t.allowedMarks(c.marks))), 0, 0)), o.push(new P(l + u.index, l + u.index + u[0].length, p));
      }
    }
    l = f;
  }
  if (!n.validEnd) {
    let a = n.fillBefore(b.empty, !0);
    r.replace(l, l, new k(a, 0, 0));
  }
  for (let a = o.length - 1; a >= 0; a--)
    r.step(o[a]);
}
function vo(r, e, t) {
  return (e == 0 || r.canReplace(e, r.childCount)) && (t == r.childCount || r.canReplace(0, t));
}
function et(r) {
  let t = r.parent.content.cutByIndex(r.startIndex, r.endIndex);
  for (let n = r.depth; ; --n) {
    let i = r.$from.node(n), s = r.$from.index(n), o = r.$to.indexAfter(n);
    if (n < r.depth && i.canReplace(s, o, t))
      return n;
    if (n == 0 || i.type.spec.isolating || !vo(i, s, o))
      break;
  }
  return null;
}
function Po(r, e, t) {
  let { $from: n, $to: i, depth: s } = e, o = n.before(s + 1), l = i.after(s + 1), a = o, c = l, f = b.empty, d = 0;
  for (let p = s, m = !1; p > t; p--)
    m || n.index(p) > 0 ? (m = !0, f = b.from(n.node(p).copy(f)), d++) : a--;
  let u = b.empty, h = 0;
  for (let p = s, m = !1; p > t; p--)
    m || i.after(p + 1) < i.end(p) ? (m = !0, u = b.from(i.node(p).copy(u)), h++) : c++;
  r.step(new B(a, c, o, l, new k(f.append(u), d, h), f.size - d, !0));
}
function Un(r, e, t = null, n = r) {
  let i = Bo(r, e), s = i && zo(n, e);
  return s ? i.map(Nr).concat({ type: e, attrs: t }).concat(s.map(Nr)) : null;
}
function Nr(r) {
  return { type: r, attrs: null };
}
function Bo(r, e) {
  let { parent: t, startIndex: n, endIndex: i } = r, s = t.contentMatchAt(n).findWrapping(e);
  if (!s)
    return null;
  let o = s.length ? s[0] : e;
  return t.canReplaceWith(n, i, o) ? s : null;
}
function zo(r, e) {
  let { parent: t, startIndex: n, endIndex: i } = r, s = t.child(n), o = e.contentMatch.findWrapping(s.type);
  if (!o)
    return null;
  let a = (o.length ? o[o.length - 1] : e).contentMatch;
  for (let c = n; a && c < i; c++)
    a = a.matchType(t.child(c).type);
  return !a || !a.validEnd ? null : o;
}
function Fo(r, e, t) {
  let n = b.empty;
  for (let o = t.length - 1; o >= 0; o--) {
    if (n.size) {
      let l = t[o].type.contentMatch.matchFragment(n);
      if (!l || !l.validEnd)
        throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
    }
    n = b.from(t[o].type.create(t[o].attrs, n));
  }
  let i = e.start, s = e.end;
  r.step(new B(i, s, i, s, new k(n, 0, 0), t.length, !0));
}
function Vo(r, e, t, n, i) {
  if (!n.isTextblock)
    throw new RangeError("Type given to setBlockType should be a textblock");
  let s = r.steps.length;
  r.doc.nodesBetween(e, t, (o, l) => {
    let a = typeof i == "function" ? i(o) : i;
    if (o.isTextblock && !o.hasMarkup(n, a) && Lo(r.doc, r.mapping.slice(s).map(l), n)) {
      let c = null;
      if (n.schema.linebreakReplacement) {
        let h = n.whitespace == "pre", p = !!n.contentMatch.matchType(n.schema.linebreakReplacement);
        h && !p ? c = !1 : !h && p && (c = !0);
      }
      c === !1 && qi(r, o, l, s), Hn(r, r.mapping.slice(s).map(l, 1), n, void 0, c === null);
      let f = r.mapping.slice(s), d = f.map(l, 1), u = f.map(l + o.nodeSize, 1);
      return r.step(new B(d, u, d + 1, u - 1, new k(b.from(n.create(a, null, o.marks)), 0, 0), 1, !0)), c === !0 && ji(r, o, l, s), !1;
    }
  });
}
function ji(r, e, t, n) {
  e.forEach((i, s) => {
    if (i.isText) {
      let o, l = /\r?\n|\r/g;
      for (; o = l.exec(i.text); ) {
        let a = r.mapping.slice(n).map(t + 1 + s + o.index);
        r.replaceWith(a, a + 1, e.type.schema.linebreakReplacement.create());
      }
    }
  });
}
function qi(r, e, t, n) {
  e.forEach((i, s) => {
    if (i.type == i.type.schema.linebreakReplacement) {
      let o = r.mapping.slice(n).map(t + 1 + s);
      r.replaceWith(o, o + 1, e.type.schema.text(`
`));
    }
  });
}
function Lo(r, e, t) {
  let n = r.resolve(e), i = n.index();
  return n.parent.canReplaceWith(i, i + 1, t);
}
function $o(r, e, t, n, i) {
  let s = r.doc.nodeAt(e);
  if (!s)
    throw new RangeError("No node at given position");
  t || (t = s.type);
  let o = t.create(n, null, i || s.marks);
  if (s.isLeaf)
    return r.replaceWith(e, e + s.nodeSize, o);
  if (!t.validContent(s.content))
    throw new RangeError("Invalid content for node type " + t.name);
  r.step(new B(e, e + s.nodeSize, e + 1, e + s.nodeSize - 1, new k(b.from(o), 0, 0), 1, !0));
}
function de(r, e, t = 1, n) {
  let i = r.resolve(e), s = i.depth - t, o = n && n[n.length - 1] || i.parent;
  if (s < 0 || i.parent.type.spec.isolating || !i.parent.canReplace(i.index(), i.parent.childCount) || !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount)))
    return !1;
  for (let c = i.depth - 1, f = t - 2; c > s; c--, f--) {
    let d = i.node(c), u = i.index(c);
    if (d.type.spec.isolating)
      return !1;
    let h = d.content.cutByIndex(u, d.childCount), p = n && n[f + 1];
    p && (h = h.replaceChild(0, p.type.create(p.attrs)));
    let m = n && n[f] || d;
    if (!d.canReplace(u + 1, d.childCount) || !m.type.validContent(h))
      return !1;
  }
  let l = i.indexAfter(s), a = n && n[0];
  return i.node(s).canReplaceWith(l, l, a ? a.type : i.node(s + 1).type);
}
function Wo(r, e, t = 1, n) {
  let i = r.doc.resolve(e), s = b.empty, o = b.empty;
  for (let l = i.depth, a = i.depth - t, c = t - 1; l > a; l--, c--) {
    s = b.from(i.node(l).copy(s));
    let f = n && n[c];
    o = b.from(f ? f.type.create(f.attrs, o) : i.node(l).copy(o));
  }
  r.step(new P(e, e, new k(s.append(o), t, t), !0));
}
function Ne(r, e) {
  let t = r.resolve(e), n = t.index();
  return Ki(t.nodeBefore, t.nodeAfter) && t.parent.canReplace(n, n + 1);
}
function Jo(r, e) {
  e.content.size || r.type.compatibleContent(e.type);
  let t = r.contentMatchAt(r.childCount), { linebreakReplacement: n } = r.type.schema;
  for (let i = 0; i < e.childCount; i++) {
    let s = e.child(i), o = s.type == n ? r.type.schema.nodes.text : s.type;
    if (t = t.matchType(o), !t || !r.type.allowsMarks(s.marks))
      return !1;
  }
  return t.validEnd;
}
function Ki(r, e) {
  return !!(r && e && !r.isLeaf && Jo(r, e));
}
function Ut(r, e, t = -1) {
  let n = r.resolve(e);
  for (let i = n.depth; ; i--) {
    let s, o, l = n.index(i);
    if (i == n.depth ? (s = n.nodeBefore, o = n.nodeAfter) : t > 0 ? (s = n.node(i + 1), l++, o = n.node(i).maybeChild(l)) : (s = n.node(i).maybeChild(l - 1), o = n.node(i + 1)), s && !s.isTextblock && Ki(s, o) && n.node(i).canReplace(l, l + 1))
      return e;
    if (i == 0)
      break;
    e = t < 0 ? n.before(i) : n.after(i);
  }
}
function jo(r, e, t) {
  let n = null, { linebreakReplacement: i } = r.doc.type.schema, s = r.doc.resolve(e - t), o = s.node().type;
  if (i && o.inlineContent) {
    let f = o.whitespace == "pre", d = !!o.contentMatch.matchType(i);
    f && !d ? n = !1 : !f && d && (n = !0);
  }
  let l = r.steps.length;
  if (n === !1) {
    let f = r.doc.resolve(e + t);
    qi(r, f.node(), f.before(), l);
  }
  o.inlineContent && Hn(r, e + t - 1, o, s.node().contentMatchAt(s.index()), n == null);
  let a = r.mapping.slice(l), c = a.map(e - t);
  if (r.step(new P(c, a.map(e + t, -1), k.empty, !0)), n === !0) {
    let f = r.doc.resolve(c);
    ji(r, f.node(), f.before(), r.steps.length);
  }
  return r;
}
function qo(r, e, t) {
  let n = r.resolve(e);
  if (n.parent.canReplaceWith(n.index(), n.index(), t))
    return e;
  if (n.parentOffset == 0)
    for (let i = n.depth - 1; i >= 0; i--) {
      let s = n.index(i);
      if (n.node(i).canReplaceWith(s, s, t))
        return n.before(i + 1);
      if (s > 0)
        return null;
    }
  if (n.parentOffset == n.parent.content.size)
    for (let i = n.depth - 1; i >= 0; i--) {
      let s = n.indexAfter(i);
      if (n.node(i).canReplaceWith(s, s, t))
        return n.after(i + 1);
      if (s < n.node(i).childCount)
        return null;
    }
  return null;
}
function Ko(r, e, t) {
  let n = r.resolve(e);
  if (!t.content.size)
    return e;
  let i = t.content;
  for (let s = 0; s < t.openStart; s++)
    i = i.firstChild.content;
  for (let s = 1; s <= (t.openStart == 0 && t.size ? 2 : 1); s++)
    for (let o = n.depth; o >= 0; o--) {
      let l = o == n.depth ? 0 : n.pos <= (n.start(o + 1) + n.end(o + 1)) / 2 ? -1 : 1, a = n.index(o) + (l > 0 ? 1 : 0), c = n.node(o), f = !1;
      if (s == 1)
        f = c.canReplace(a, a, i);
      else {
        let d = c.contentMatchAt(a).findWrapping(i.firstChild.type);
        f = d && c.canReplaceWith(a, a, d[0]);
      }
      if (f)
        return l == 0 ? n.pos : l < 0 ? n.before(o + 1) : n.after(o + 1);
    }
  return null;
}
function Gt(r, e, t = e, n = k.empty) {
  if (e == t && !n.size)
    return null;
  let i = r.resolve(e), s = r.resolve(t);
  return Hi(i, s, n) ? new P(e, t, n) : new Ho(i, s, n).fit();
}
function Hi(r, e, t) {
  return !t.openStart && !t.openEnd && r.start() == e.start() && r.parent.canReplace(r.index(), e.index(), t.content);
}
class Ho {
  constructor(e, t, n) {
    this.$from = e, this.$to = t, this.unplaced = n, this.frontier = [], this.placed = b.empty;
    for (let i = 0; i <= e.depth; i++) {
      let s = e.node(i);
      this.frontier.push({
        type: s.type,
        match: s.contentMatchAt(e.indexAfter(i))
      });
    }
    for (let i = e.depth; i > 0; i--)
      this.placed = b.from(e.node(i).copy(this.placed));
  }
  get depth() {
    return this.frontier.length - 1;
  }
  fit() {
    for (; this.unplaced.size; ) {
      let c = this.findFittable();
      c ? this.placeNodes(c) : this.openMore() || this.dropNode();
    }
    let e = this.mustMoveInline(), t = this.placed.size - this.depth - this.$from.depth, n = this.$from, i = this.close(e < 0 ? this.$to : n.doc.resolve(e));
    if (!i)
      return null;
    let s = this.placed, o = n.depth, l = i.depth;
    for (; o && l && s.childCount == 1; )
      s = s.firstChild.content, o--, l--;
    let a = new k(s, o, l);
    return e > -1 ? new B(n.pos, e, this.$to.pos, this.$to.end(), a, t) : a.size || n.pos != this.$to.pos ? new P(n.pos, i.pos, a) : null;
  }
  // Find a position on the start spine of `this.unplaced` that has
  // content that can be moved somewhere on the frontier. Returns two
  // depths, one for the slice and one for the frontier.
  findFittable() {
    let e = this.unplaced.openStart;
    for (let t = this.unplaced.content, n = 0, i = this.unplaced.openEnd; n < e; n++) {
      let s = t.firstChild;
      if (t.childCount > 1 && (i = 0), s.type.spec.isolating && i <= n) {
        e = n;
        break;
      }
      t = s.content;
    }
    for (let t = 1; t <= 2; t++)
      for (let n = t == 1 ? e : this.unplaced.openStart; n >= 0; n--) {
        let i, s = null;
        n ? (s = fn(this.unplaced.content, n - 1).firstChild, i = s.content) : i = this.unplaced.content;
        let o = i.firstChild;
        for (let l = this.depth; l >= 0; l--) {
          let { type: a, match: c } = this.frontier[l], f, d = null;
          if (t == 1 && (o ? c.matchType(o.type) || (d = c.fillBefore(b.from(o), !1)) : s && a.compatibleContent(s.type)))
            return { sliceDepth: n, frontierDepth: l, parent: s, inject: d };
          if (t == 2 && o && (f = c.findWrapping(o.type)))
            return { sliceDepth: n, frontierDepth: l, parent: s, wrap: f };
          if (s && c.matchType(s.type))
            break;
        }
      }
  }
  openMore() {
    let { content: e, openStart: t, openEnd: n } = this.unplaced, i = fn(e, t);
    return !i.childCount || i.firstChild.isLeaf ? !1 : (this.unplaced = new k(e, t + 1, Math.max(n, i.size + t >= e.size - n ? t + 1 : 0)), !0);
  }
  dropNode() {
    let { content: e, openStart: t, openEnd: n } = this.unplaced, i = fn(e, t);
    if (i.childCount <= 1 && t > 0) {
      let s = e.size - t <= t + i.size;
      this.unplaced = new k(nt(e, t - 1, 1), t - 1, s ? t - 1 : n);
    } else
      this.unplaced = new k(nt(e, t, 1), t, n);
  }
  // Move content from the unplaced slice at `sliceDepth` to the
  // frontier node at `frontierDepth`. Close that frontier node when
  // applicable.
  placeNodes({ sliceDepth: e, frontierDepth: t, parent: n, inject: i, wrap: s }) {
    for (; this.depth > t; )
      this.closeFrontierNode();
    if (s)
      for (let m = 0; m < s.length; m++)
        this.openFrontierNode(s[m]);
    let o = this.unplaced, l = n ? n.content : o.content, a = o.openStart - e, c = 0, f = [], { match: d, type: u } = this.frontier[t];
    if (i) {
      for (let m = 0; m < i.childCount; m++)
        f.push(i.child(m));
      d = d.matchFragment(i);
    }
    let h = l.size + e - (o.content.size - o.openEnd);
    for (; c < l.childCount; ) {
      let m = l.child(c), g = d.matchType(m.type);
      if (!g)
        break;
      c++, (c > 1 || a == 0 || m.content.size) && (d = g, f.push(Ui(m.mark(u.allowedMarks(m.marks)), c == 1 ? a : 0, c == l.childCount ? h : -1)));
    }
    let p = c == l.childCount;
    p || (h = -1), this.placed = rt(this.placed, t, b.from(f)), this.frontier[t].match = d, p && h < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
    for (let m = 0, g = l; m < h; m++) {
      let y = g.lastChild;
      this.frontier.push({ type: y.type, match: y.contentMatchAt(y.childCount) }), g = y.content;
    }
    this.unplaced = p ? e == 0 ? k.empty : new k(nt(o.content, e - 1, 1), e - 1, h < 0 ? o.openEnd : e - 1) : new k(nt(o.content, e, c), o.openStart, o.openEnd);
  }
  mustMoveInline() {
    if (!this.$to.parent.isTextblock)
      return -1;
    let e = this.frontier[this.depth], t;
    if (!e.type.isTextblock || !dn(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth)
      return -1;
    let { depth: n } = this.$to, i = this.$to.after(n);
    for (; n > 1 && i == this.$to.end(--n); )
      ++i;
    return i;
  }
  findCloseLevel(e) {
    e: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
      let { match: n, type: i } = this.frontier[t], s = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)), o = dn(e, t, i, n, s);
      if (o) {
        for (let l = t - 1; l >= 0; l--) {
          let { match: a, type: c } = this.frontier[l], f = dn(e, l, c, a, !0);
          if (!f || f.childCount)
            continue e;
        }
        return { depth: t, fit: o, move: s ? e.doc.resolve(e.after(t + 1)) : e };
      }
    }
  }
  close(e) {
    let t = this.findCloseLevel(e);
    if (!t)
      return null;
    for (; this.depth > t.depth; )
      this.closeFrontierNode();
    t.fit.childCount && (this.placed = rt(this.placed, t.depth, t.fit)), e = t.move;
    for (let n = t.depth + 1; n <= e.depth; n++) {
      let i = e.node(n), s = i.type.contentMatch.fillBefore(i.content, !0, e.index(n));
      this.openFrontierNode(i.type, i.attrs, s);
    }
    return e;
  }
  openFrontierNode(e, t = null, n) {
    let i = this.frontier[this.depth];
    i.match = i.match.matchType(e), this.placed = rt(this.placed, this.depth, b.from(e.create(t, n))), this.frontier.push({ type: e, match: e.contentMatch });
  }
  closeFrontierNode() {
    let t = this.frontier.pop().match.fillBefore(b.empty, !0);
    t.childCount && (this.placed = rt(this.placed, this.frontier.length, t));
  }
}
function nt(r, e, t) {
  return e == 0 ? r.cutByIndex(t, r.childCount) : r.replaceChild(0, r.firstChild.copy(nt(r.firstChild.content, e - 1, t)));
}
function rt(r, e, t) {
  return e == 0 ? r.append(t) : r.replaceChild(r.childCount - 1, r.lastChild.copy(rt(r.lastChild.content, e - 1, t)));
}
function fn(r, e) {
  for (let t = 0; t < e; t++)
    r = r.firstChild.content;
  return r;
}
function Ui(r, e, t) {
  if (e <= 0)
    return r;
  let n = r.content;
  return e > 1 && (n = n.replaceChild(0, Ui(n.firstChild, e - 1, n.childCount == 1 ? t - 1 : 0))), e > 0 && (n = r.type.contentMatch.fillBefore(n).append(n), t <= 0 && (n = n.append(r.type.contentMatch.matchFragment(n).fillBefore(b.empty, !0)))), r.copy(n);
}
function dn(r, e, t, n, i) {
  let s = r.node(e), o = i ? r.indexAfter(e) : r.index(e);
  if (o == s.childCount && !t.compatibleContent(s.type))
    return null;
  let l = n.fillBefore(s.content, !0, o);
  return l && !Uo(t, s.content, o) ? l : null;
}
function Uo(r, e, t) {
  for (let n = t; n < e.childCount; n++)
    if (!r.allowsMarks(e.child(n).marks))
      return !0;
  return !1;
}
function Go(r) {
  return r.spec.defining || r.spec.definingForContent;
}
function Yo(r, e, t, n) {
  if (!n.size)
    return r.deleteRange(e, t);
  let i = r.doc.resolve(e), s = r.doc.resolve(t);
  if (Hi(i, s, n))
    return r.step(new P(e, t, n));
  let o = Yi(i, r.doc.resolve(t));
  o[o.length - 1] == 0 && o.pop();
  let l = -(i.depth + 1);
  o.unshift(l);
  for (let u = i.depth, h = i.pos - 1; u > 0; u--, h--) {
    let p = i.node(u).type.spec;
    if (p.defining || p.definingAsContext || p.isolating)
      break;
    o.indexOf(u) > -1 ? l = u : i.before(u) == h && o.splice(1, 0, -u);
  }
  let a = o.indexOf(l), c = [], f = n.openStart;
  for (let u = n.content, h = 0; ; h++) {
    let p = u.firstChild;
    if (c.push(p), h == n.openStart)
      break;
    u = p.content;
  }
  for (let u = f - 1; u >= 0; u--) {
    let h = c[u], p = Go(h.type);
    if (p && !h.sameMarkup(i.node(Math.abs(l) - 1)))
      f = u;
    else if (p || !h.type.isTextblock)
      break;
  }
  for (let u = n.openStart; u >= 0; u--) {
    let h = (u + f + 1) % (n.openStart + 1), p = c[h];
    if (p)
      for (let m = 0; m < o.length; m++) {
        let g = o[(m + a) % o.length], y = !0;
        g < 0 && (y = !1, g = -g);
        let C = i.node(g - 1), M = i.index(g - 1);
        if (C.canReplaceWith(M, M, p.type, p.marks))
          return r.replace(i.before(g), y ? s.after(g) : t, new k(Gi(n.content, 0, n.openStart, h), h, n.openEnd));
      }
  }
  let d = r.steps.length;
  for (let u = o.length - 1; u >= 0 && (r.replace(e, t, n), !(r.steps.length > d)); u--) {
    let h = o[u];
    h < 0 || (e = i.before(h), t = s.after(h));
  }
}
function Gi(r, e, t, n, i) {
  if (e < t) {
    let s = r.firstChild;
    r = r.replaceChild(0, s.copy(Gi(s.content, e + 1, t, n, s)));
  }
  if (e > n) {
    let s = i.contentMatchAt(0), o = s.fillBefore(r).append(r);
    r = o.append(s.matchFragment(o).fillBefore(b.empty, !0));
  }
  return r;
}
function _o(r, e, t, n) {
  if (!n.isInline && e == t && r.doc.resolve(e).parent.content.size) {
    let i = qo(r.doc, e, n.type);
    i != null && (e = t = i);
  }
  r.replaceRange(e, t, new k(b.from(n), 0, 0));
}
function Xo(r, e, t) {
  let n = r.doc.resolve(e), i = r.doc.resolve(t), s = Yi(n, i);
  for (let o = 0; o < s.length; o++) {
    let l = s[o], a = o == s.length - 1;
    if (a && l == 0 || n.node(l).type.contentMatch.validEnd)
      return r.delete(n.start(l), i.end(l));
    if (l > 0 && (a || n.node(l - 1).canReplace(n.index(l - 1), i.indexAfter(l - 1))))
      return r.delete(n.before(l), i.after(l));
  }
  for (let o = 1; o <= n.depth && o <= i.depth; o++)
    if (e - n.start(o) == n.depth - o && t > n.end(o) && i.end(o) - t != i.depth - o && n.start(o - 1) == i.start(o - 1) && n.node(o - 1).canReplace(n.index(o - 1), i.index(o - 1)))
      return r.delete(n.before(o), t);
  r.delete(e, t);
}
function Yi(r, e) {
  let t = [], n = Math.min(r.depth, e.depth);
  for (let i = n; i >= 0; i--) {
    let s = r.start(i);
    if (s < r.pos - (r.depth - i) || e.end(i) > e.pos + (e.depth - i) || r.node(i).type.spec.isolating || e.node(i).type.spec.isolating)
      break;
    (s == e.start(i) || i == r.depth && i == e.depth && r.parent.inlineContent && e.parent.inlineContent && i && e.start(i - 1) == s - 1) && t.push(i);
  }
  return t;
}
class Ge extends J {
  /**
  Construct an attribute step.
  */
  constructor(e, t, n) {
    super(), this.pos = e, this.attr = t, this.value = n;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return R.fail("No node at attribute step's position");
    let n = /* @__PURE__ */ Object.create(null);
    for (let s in t.attrs)
      n[s] = t.attrs[s];
    n[this.attr] = this.value;
    let i = t.type.create(n, null, t.marks);
    return R.fromReplace(e, this.pos, this.pos + 1, new k(b.from(i), 0, t.isLeaf ? 0 : 1));
  }
  getMap() {
    return Y.empty;
  }
  invert(e) {
    return new Ge(this.pos, this.attr, e.nodeAt(this.pos).attrs[this.attr]);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new Ge(t.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(e, t) {
    if (typeof t.pos != "number" || typeof t.attr != "string")
      throw new RangeError("Invalid input for AttrStep.fromJSON");
    return new Ge(t.pos, t.attr, t.value);
  }
}
J.jsonID("attr", Ge);
class ut extends J {
  /**
  Construct an attribute step.
  */
  constructor(e, t) {
    super(), this.attr = e, this.value = t;
  }
  apply(e) {
    let t = /* @__PURE__ */ Object.create(null);
    for (let i in e.attrs)
      t[i] = e.attrs[i];
    t[this.attr] = this.value;
    let n = e.type.create(t, e.content, e.marks);
    return R.ok(n);
  }
  getMap() {
    return Y.empty;
  }
  invert(e) {
    return new ut(this.attr, e.attrs[this.attr]);
  }
  map(e) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(e, t) {
    if (typeof t.attr != "string")
      throw new RangeError("Invalid input for DocAttrStep.fromJSON");
    return new ut(t.attr, t.value);
  }
}
J.jsonID("docAttr", ut);
let Xe = class extends Error {
};
Xe = function r(e) {
  let t = Error.call(this, e);
  return t.__proto__ = r.prototype, t;
};
Xe.prototype = Object.create(Error.prototype);
Xe.prototype.constructor = Xe;
Xe.prototype.name = "TransformError";
class _i {
  /**
  Create a transform that starts with the given document.
  */
  constructor(e) {
    this.doc = e, this.steps = [], this.docs = [], this.mapping = new lt();
  }
  /**
  The starting document.
  */
  get before() {
    return this.docs.length ? this.docs[0] : this.doc;
  }
  /**
  Apply a new step in this transform, saving the result. Throws an
  error when the step fails.
  */
  step(e) {
    let t = this.maybeStep(e);
    if (t.failed)
      throw new Xe(t.failed);
    return this;
  }
  /**
  Try to apply a step in this transformation, ignoring it if it
  fails. Returns the step result.
  */
  maybeStep(e) {
    let t = e.apply(this.doc);
    return t.failed || this.addStep(e, t.doc), t;
  }
  /**
  True when the document has been changed (when there are any
  steps).
  */
  get docChanged() {
    return this.steps.length > 0;
  }
  /**
  @internal
  */
  addStep(e, t) {
    this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), this.doc = t;
  }
  /**
  Replace the part of the document between `from` and `to` with the
  given `slice`.
  */
  replace(e, t = e, n = k.empty) {
    let i = Gt(this.doc, e, t, n);
    return i && this.step(i), this;
  }
  /**
  Replace the given range with the given content, which may be a
  fragment, node, or array of nodes.
  */
  replaceWith(e, t, n) {
    return this.replace(e, t, new k(b.from(n), 0, 0));
  }
  /**
  Delete the content between the given positions.
  */
  delete(e, t) {
    return this.replace(e, t, k.empty);
  }
  /**
  Insert the given content at the given position.
  */
  insert(e, t) {
    return this.replaceWith(e, e, t);
  }
  /**
  Replace a range of the document with a given slice, using
  `from`, `to`, and the slice's
  [`openStart`](https://prosemirror.net/docs/ref/#model.Slice.openStart) property as hints, rather
  than fixed start and end points. This method may grow the
  replaced area or close open nodes in the slice in order to get a
  fit that is more in line with WYSIWYG expectations, by dropping
  fully covered parent nodes of the replaced region when they are
  marked [non-defining as
  context](https://prosemirror.net/docs/ref/#model.NodeSpec.definingAsContext), or including an
  open parent node from the slice that _is_ marked as [defining
  its content](https://prosemirror.net/docs/ref/#model.NodeSpec.definingForContent).
  
  This is the method, for example, to handle paste. The similar
  [`replace`](https://prosemirror.net/docs/ref/#transform.Transform.replace) method is a more
  primitive tool which will _not_ move the start and end of its given
  range, and is useful in situations where you need more precise
  control over what happens.
  */
  replaceRange(e, t, n) {
    return Yo(this, e, t, n), this;
  }
  /**
  Replace the given range with a node, but use `from` and `to` as
  hints, rather than precise positions. When from and to are the same
  and are at the start or end of a parent node in which the given
  node doesn't fit, this method may _move_ them out towards a parent
  that does allow the given node to be placed. When the given range
  completely covers a parent node, this method may completely replace
  that parent node.
  */
  replaceRangeWith(e, t, n) {
    return _o(this, e, t, n), this;
  }
  /**
  Delete the given range, expanding it to cover fully covered
  parent nodes until a valid replace is found.
  */
  deleteRange(e, t) {
    return Xo(this, e, t), this;
  }
  /**
  Split the content in the given range off from its parent, if there
  is sibling content before or after it, and move it up the tree to
  the depth specified by `target`. You'll probably want to use
  [`liftTarget`](https://prosemirror.net/docs/ref/#transform.liftTarget) to compute `target`, to make
  sure the lift is valid.
  */
  lift(e, t) {
    return Po(this, e, t), this;
  }
  /**
  Join the blocks around the given position. If depth is 2, their
  last and first siblings are also joined, and so on.
  */
  join(e, t = 1) {
    return jo(this, e, t), this;
  }
  /**
  Wrap the given [range](https://prosemirror.net/docs/ref/#model.NodeRange) in the given set of wrappers.
  The wrappers are assumed to be valid in this position, and should
  probably be computed with [`findWrapping`](https://prosemirror.net/docs/ref/#transform.findWrapping).
  */
  wrap(e, t) {
    return Fo(this, e, t), this;
  }
  /**
  Set the type of all textblocks (partly) between `from` and `to` to
  the given node type with the given attributes.
  */
  setBlockType(e, t = e, n, i = null) {
    return Vo(this, e, t, n, i), this;
  }
  /**
  Change the type, attributes, and/or marks of the node at `pos`.
  When `type` isn't given, the existing node type is preserved,
  */
  setNodeMarkup(e, t, n = null, i) {
    return $o(this, e, t, n, i), this;
  }
  /**
  Set a single attribute on a given node to a new value.
  The `pos` addresses the document content. Use `setDocAttribute`
  to set attributes on the document itself.
  */
  setNodeAttribute(e, t, n) {
    return this.step(new Ge(e, t, n)), this;
  }
  /**
  Set a single attribute on the document to a new value.
  */
  setDocAttribute(e, t) {
    return this.step(new ut(e, t)), this;
  }
  /**
  Add a mark to the node at position `pos`.
  */
  addNodeMark(e, t) {
    return this.step(new be(e, t)), this;
  }
  /**
  Remove a mark (or a mark of the given type) from the node at
  position `pos`.
  */
  removeNodeMark(e, t) {
    if (!(t instanceof I)) {
      let n = this.doc.nodeAt(e);
      if (!n)
        throw new RangeError("No node at position " + e);
      if (t = t.isInSet(n.marks), !t)
        return this;
    }
    return this.step(new _e(e, t)), this;
  }
  /**
  Split the node at the given position, and optionally, if `depth` is
  greater than one, any number of nodes above that. By default, the
  parts split off will inherit the node type of the original node.
  This can be changed by passing an array of types and attributes to
  use after the split.
  */
  split(e, t = 1, n) {
    return Wo(this, e, t, n), this;
  }
  /**
  Add the given mark to the inline content between `from` and `to`.
  */
  addMark(e, t, n) {
    return Io(this, e, t, n), this;
  }
  /**
  Remove marks from inline nodes between `from` and `to`. When
  `mark` is a single mark, remove precisely that mark. When it is
  a mark type, remove all marks of that type. When it is null,
  remove all marks of any type.
  */
  removeMark(e, t, n) {
    return Ro(this, e, t, n), this;
  }
  /**
  Removes all marks and nodes from the content of the node at
  `pos` that don't match the given new parent node type. Accepts
  an optional starting [content match](https://prosemirror.net/docs/ref/#model.ContentMatch) as
  third argument.
  */
  clearIncompatible(e, t, n) {
    return Hn(this, e, t, n), this;
  }
}
const un = /* @__PURE__ */ Object.create(null);
class N {
  /**
  Initialize a selection with the head and anchor and ranges. If no
  ranges are given, constructs a single range across `$anchor` and
  `$head`.
  */
  constructor(e, t, n) {
    this.$anchor = e, this.$head = t, this.ranges = n || [new Qo(e.min(t), e.max(t))];
  }
  /**
  The selection's anchor, as an unresolved position.
  */
  get anchor() {
    return this.$anchor.pos;
  }
  /**
  The selection's head.
  */
  get head() {
    return this.$head.pos;
  }
  /**
  The lower bound of the selection's main range.
  */
  get from() {
    return this.$from.pos;
  }
  /**
  The upper bound of the selection's main range.
  */
  get to() {
    return this.$to.pos;
  }
  /**
  The resolved lower  bound of the selection's main range.
  */
  get $from() {
    return this.ranges[0].$from;
  }
  /**
  The resolved upper bound of the selection's main range.
  */
  get $to() {
    return this.ranges[0].$to;
  }
  /**
  Indicates whether the selection contains any content.
  */
  get empty() {
    let e = this.ranges;
    for (let t = 0; t < e.length; t++)
      if (e[t].$from.pos != e[t].$to.pos)
        return !1;
    return !0;
  }
  /**
  Get the content of this selection as a slice.
  */
  content() {
    return this.$from.doc.slice(this.from, this.to, !0);
  }
  /**
  Replace the selection with a slice or, if no slice is given,
  delete the selection. Will append to the given transaction.
  */
  replace(e, t = k.empty) {
    let n = t.content.lastChild, i = null;
    for (let l = 0; l < t.openEnd; l++)
      i = n, n = n.lastChild;
    let s = e.steps.length, o = this.ranges;
    for (let l = 0; l < o.length; l++) {
      let { $from: a, $to: c } = o[l], f = e.mapping.slice(s);
      e.replaceRange(f.map(a.pos), f.map(c.pos), l ? k.empty : t), l == 0 && Dr(e, s, (n ? n.isInline : i && i.isTextblock) ? -1 : 1);
    }
  }
  /**
  Replace the selection with the given node, appending the changes
  to the given transaction.
  */
  replaceWith(e, t) {
    let n = e.steps.length, i = this.ranges;
    for (let s = 0; s < i.length; s++) {
      let { $from: o, $to: l } = i[s], a = e.mapping.slice(n), c = a.map(o.pos), f = a.map(l.pos);
      s ? e.deleteRange(c, f) : (e.replaceRangeWith(c, f, t), Dr(e, n, t.isInline ? -1 : 1));
    }
  }
  /**
  Find a valid cursor or leaf node selection starting at the given
  position and searching back if `dir` is negative, and forward if
  positive. When `textOnly` is true, only consider cursor
  selections. Will return null when no valid selection position is
  found.
  */
  static findFrom(e, t, n = !1) {
    let i = e.parent.inlineContent ? new O(e) : qe(e.node(0), e.parent, e.pos, e.index(), t, n);
    if (i)
      return i;
    for (let s = e.depth - 1; s >= 0; s--) {
      let o = t < 0 ? qe(e.node(0), e.node(s), e.before(s + 1), e.index(s), t, n) : qe(e.node(0), e.node(s), e.after(s + 1), e.index(s) + 1, t, n);
      if (o)
        return o;
    }
    return null;
  }
  /**
  Find a valid cursor or leaf node selection near the given
  position. Searches forward first by default, but if `bias` is
  negative, it will search backwards first.
  */
  static near(e, t = 1) {
    return this.findFrom(e, t) || this.findFrom(e, -t) || new _(e.node(0));
  }
  /**
  Find the cursor or leaf node selection closest to the start of
  the given document. Will return an
  [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
  exists.
  */
  static atStart(e) {
    return qe(e, e, 0, 0, 1) || new _(e);
  }
  /**
  Find the cursor or leaf node selection closest to the end of the
  given document.
  */
  static atEnd(e) {
    return qe(e, e, e.content.size, e.childCount, -1) || new _(e);
  }
  /**
  Deserialize the JSON representation of a selection. Must be
  implemented for custom classes (as a static class method).
  */
  static fromJSON(e, t) {
    if (!t || !t.type)
      throw new RangeError("Invalid input for Selection.fromJSON");
    let n = un[t.type];
    if (!n)
      throw new RangeError(`No selection type ${t.type} defined`);
    return n.fromJSON(e, t);
  }
  /**
  To be able to deserialize selections from JSON, custom selection
  classes must register themselves with an ID string, so that they
  can be disambiguated. Try to pick something that's unlikely to
  clash with classes from other modules.
  */
  static jsonID(e, t) {
    if (e in un)
      throw new RangeError("Duplicate use of selection JSON ID " + e);
    return un[e] = t, t.prototype.jsonID = e, t;
  }
  /**
  Get a [bookmark](https://prosemirror.net/docs/ref/#state.SelectionBookmark) for this selection,
  which is a value that can be mapped without having access to a
  current document, and later resolved to a real selection for a
  given document again. (This is used mostly by the history to
  track and restore old selections.) The default implementation of
  this method just converts the selection to a text selection and
  returns the bookmark for that.
  */
  getBookmark() {
    return O.between(this.$anchor, this.$head).getBookmark();
  }
}
N.prototype.visible = !0;
class Qo {
  /**
  Create a range.
  */
  constructor(e, t) {
    this.$from = e, this.$to = t;
  }
}
let Tr = !1;
function Er(r) {
  !Tr && !r.parent.inlineContent && (Tr = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + r.parent.type.name + ")"));
}
class O extends N {
  /**
  Construct a text selection between the given points.
  */
  constructor(e, t = e) {
    Er(e), Er(t), super(e, t);
  }
  /**
  Returns a resolved position if this is a cursor selection (an
  empty text selection), and null otherwise.
  */
  get $cursor() {
    return this.$anchor.pos == this.$head.pos ? this.$head : null;
  }
  map(e, t) {
    let n = e.resolve(t.map(this.head));
    if (!n.parent.inlineContent)
      return N.near(n);
    let i = e.resolve(t.map(this.anchor));
    return new O(i.parent.inlineContent ? i : n, n);
  }
  replace(e, t = k.empty) {
    if (super.replace(e, t), t == k.empty) {
      let n = this.$from.marksAcross(this.$to);
      n && e.ensureMarks(n);
    }
  }
  eq(e) {
    return e instanceof O && e.anchor == this.anchor && e.head == this.head;
  }
  getBookmark() {
    return new Yt(this.anchor, this.head);
  }
  toJSON() {
    return { type: "text", anchor: this.anchor, head: this.head };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.anchor != "number" || typeof t.head != "number")
      throw new RangeError("Invalid input for TextSelection.fromJSON");
    return new O(e.resolve(t.anchor), e.resolve(t.head));
  }
  /**
  Create a text selection from non-resolved positions.
  */
  static create(e, t, n = t) {
    let i = e.resolve(t);
    return new this(i, n == t ? i : e.resolve(n));
  }
  /**
  Return a text selection that spans the given positions or, if
  they aren't text positions, find a text selection near them.
  `bias` determines whether the method searches forward (default)
  or backwards (negative number) first. Will fall back to calling
  [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
  doesn't contain a valid text position.
  */
  static between(e, t, n) {
    let i = e.pos - t.pos;
    if ((!n || i) && (n = i >= 0 ? 1 : -1), !t.parent.inlineContent) {
      let s = N.findFrom(t, n, !0) || N.findFrom(t, -n, !0);
      if (s)
        t = s.$head;
      else
        return N.near(t, n);
    }
    return e.parent.inlineContent || (i == 0 ? e = t : (e = (N.findFrom(e, -n, !0) || N.findFrom(e, n, !0)).$anchor, e.pos < t.pos != i < 0 && (e = t))), new O(e, t);
  }
}
N.jsonID("text", O);
class Yt {
  constructor(e, t) {
    this.anchor = e, this.head = t;
  }
  map(e) {
    return new Yt(e.map(this.anchor), e.map(this.head));
  }
  resolve(e) {
    return O.between(e.resolve(this.anchor), e.resolve(this.head));
  }
}
class S extends N {
  /**
  Create a node selection. Does not verify the validity of its
  argument.
  */
  constructor(e) {
    let t = e.nodeAfter, n = e.node(0).resolve(e.pos + t.nodeSize);
    super(e, n), this.node = t;
  }
  map(e, t) {
    let { deleted: n, pos: i } = t.mapResult(this.anchor), s = e.resolve(i);
    return n ? N.near(s) : new S(s);
  }
  content() {
    return new k(b.from(this.node), 0, 0);
  }
  eq(e) {
    return e instanceof S && e.anchor == this.anchor;
  }
  toJSON() {
    return { type: "node", anchor: this.anchor };
  }
  getBookmark() {
    return new Gn(this.anchor);
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.anchor != "number")
      throw new RangeError("Invalid input for NodeSelection.fromJSON");
    return new S(e.resolve(t.anchor));
  }
  /**
  Create a node selection from non-resolved positions.
  */
  static create(e, t) {
    return new S(e.resolve(t));
  }
  /**
  Determines whether the given node may be selected as a node
  selection.
  */
  static isSelectable(e) {
    return !e.isText && e.type.spec.selectable !== !1;
  }
}
S.prototype.visible = !1;
N.jsonID("node", S);
class Gn {
  constructor(e) {
    this.anchor = e;
  }
  map(e) {
    let { deleted: t, pos: n } = e.mapResult(this.anchor);
    return t ? new Yt(n, n) : new Gn(n);
  }
  resolve(e) {
    let t = e.resolve(this.anchor), n = t.nodeAfter;
    return n && S.isSelectable(n) ? new S(t) : N.near(t);
  }
}
class _ extends N {
  /**
  Create an all-selection over the given document.
  */
  constructor(e) {
    super(e.resolve(0), e.resolve(e.content.size));
  }
  replace(e, t = k.empty) {
    if (t == k.empty) {
      e.delete(0, e.doc.content.size);
      let n = N.atStart(e.doc);
      n.eq(e.selection) || e.setSelection(n);
    } else
      super.replace(e, t);
  }
  toJSON() {
    return { type: "all" };
  }
  /**
  @internal
  */
  static fromJSON(e) {
    return new _(e);
  }
  map(e) {
    return new _(e);
  }
  eq(e) {
    return e instanceof _;
  }
  getBookmark() {
    return Zo;
  }
}
N.jsonID("all", _);
const Zo = {
  map() {
    return this;
  },
  resolve(r) {
    return new _(r);
  }
};
function qe(r, e, t, n, i, s = !1) {
  if (e.inlineContent)
    return O.create(r, t);
  for (let o = n - (i > 0 ? 0 : 1); i > 0 ? o < e.childCount : o >= 0; o += i) {
    let l = e.child(o);
    if (l.isAtom) {
      if (!s && S.isSelectable(l))
        return S.create(r, t - (i < 0 ? l.nodeSize : 0));
    } else {
      let a = qe(r, l, t + i, i < 0 ? l.childCount : 0, i, s);
      if (a)
        return a;
    }
    t += l.nodeSize * i;
  }
  return null;
}
function Dr(r, e, t) {
  let n = r.steps.length - 1;
  if (n < e)
    return;
  let i = r.steps[n];
  if (!(i instanceof P || i instanceof B))
    return;
  let s = r.mapping.maps[n], o;
  s.forEach((l, a, c, f) => {
    o == null && (o = f);
  }), r.setSelection(N.near(r.doc.resolve(o), t));
}
const Ar = 1, Ot = 2, Ir = 4;
class el extends _i {
  /**
  @internal
  */
  constructor(e) {
    super(e.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = /* @__PURE__ */ Object.create(null), this.time = Date.now(), this.curSelection = e.selection, this.storedMarks = e.storedMarks;
  }
  /**
  The transaction's current selection. This defaults to the editor
  selection [mapped](https://prosemirror.net/docs/ref/#state.Selection.map) through the steps in the
  transaction, but can be overwritten with
  [`setSelection`](https://prosemirror.net/docs/ref/#state.Transaction.setSelection).
  */
  get selection() {
    return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection;
  }
  /**
  Update the transaction's current selection. Will determine the
  selection that the editor gets when the transaction is applied.
  */
  setSelection(e) {
    if (e.$from.doc != this.doc)
      throw new RangeError("Selection passed to setSelection must point at the current document");
    return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | Ar) & ~Ot, this.storedMarks = null, this;
  }
  /**
  Whether the selection was explicitly updated by this transaction.
  */
  get selectionSet() {
    return (this.updated & Ar) > 0;
  }
  /**
  Set the current stored marks.
  */
  setStoredMarks(e) {
    return this.storedMarks = e, this.updated |= Ot, this;
  }
  /**
  Make sure the current stored marks or, if that is null, the marks
  at the selection, match the given set of marks. Does nothing if
  this is already the case.
  */
  ensureMarks(e) {
    return I.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
  }
  /**
  Add a mark to the set of stored marks.
  */
  addStoredMark(e) {
    return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()));
  }
  /**
  Remove a mark or mark type from the set of stored marks.
  */
  removeStoredMark(e) {
    return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()));
  }
  /**
  Whether the stored marks were explicitly set for this transaction.
  */
  get storedMarksSet() {
    return (this.updated & Ot) > 0;
  }
  /**
  @internal
  */
  addStep(e, t) {
    super.addStep(e, t), this.updated = this.updated & ~Ot, this.storedMarks = null;
  }
  /**
  Update the timestamp for the transaction.
  */
  setTime(e) {
    return this.time = e, this;
  }
  /**
  Replace the current selection with the given slice.
  */
  replaceSelection(e) {
    return this.selection.replace(this, e), this;
  }
  /**
  Replace the selection with the given node. When `inheritMarks` is
  true and the content is inline, it inherits the marks from the
  place where it is inserted.
  */
  replaceSelectionWith(e, t = !0) {
    let n = this.selection;
    return t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || I.none))), n.replaceWith(this, e), this;
  }
  /**
  Delete the selection.
  */
  deleteSelection() {
    return this.selection.replace(this), this;
  }
  /**
  Replace the given range, or the selection if no range is given,
  with a text node containing the given string.
  */
  insertText(e, t, n) {
    let i = this.doc.type.schema;
    if (t == null)
      return e ? this.replaceSelectionWith(i.text(e), !0) : this.deleteSelection();
    {
      if (n == null && (n = t), n = n ?? t, !e)
        return this.deleteRange(t, n);
      let s = this.storedMarks;
      if (!s) {
        let o = this.doc.resolve(t);
        s = n == t ? o.marks() : o.marksAcross(this.doc.resolve(n));
      }
      return this.replaceRangeWith(t, n, i.text(e, s)), this.selection.empty || this.setSelection(N.near(this.selection.$to)), this;
    }
  }
  /**
  Store a metadata property in this transaction, keyed either by
  name or by plugin.
  */
  setMeta(e, t) {
    return this.meta[typeof e == "string" ? e : e.key] = t, this;
  }
  /**
  Retrieve a metadata property for a given name or plugin.
  */
  getMeta(e) {
    return this.meta[typeof e == "string" ? e : e.key];
  }
  /**
  Returns true if this transaction doesn't contain any metadata,
  and can thus safely be extended.
  */
  get isGeneric() {
    for (let e in this.meta)
      return !1;
    return !0;
  }
  /**
  Indicate that the editor should scroll the selection into view
  when updated to the state produced by this transaction.
  */
  scrollIntoView() {
    return this.updated |= Ir, this;
  }
  /**
  True when this transaction has had `scrollIntoView` called on it.
  */
  get scrolledIntoView() {
    return (this.updated & Ir) > 0;
  }
}
function Rr(r, e) {
  return !e || !r ? r : r.bind(e);
}
class it {
  constructor(e, t, n) {
    this.name = e, this.init = Rr(t.init, n), this.apply = Rr(t.apply, n);
  }
}
const tl = [
  new it("doc", {
    init(r) {
      return r.doc || r.schema.topNodeType.createAndFill();
    },
    apply(r) {
      return r.doc;
    }
  }),
  new it("selection", {
    init(r, e) {
      return r.selection || N.atStart(e.doc);
    },
    apply(r) {
      return r.selection;
    }
  }),
  new it("storedMarks", {
    init(r) {
      return r.storedMarks || null;
    },
    apply(r, e, t, n) {
      return n.selection.$cursor ? r.storedMarks : null;
    }
  }),
  new it("scrollToSelection", {
    init() {
      return 0;
    },
    apply(r, e) {
      return r.scrolledIntoView ? e + 1 : e;
    }
  })
];
class hn {
  constructor(e, t) {
    this.schema = e, this.plugins = [], this.pluginsByKey = /* @__PURE__ */ Object.create(null), this.fields = tl.slice(), t && t.forEach((n) => {
      if (this.pluginsByKey[n.key])
        throw new RangeError("Adding different instances of a keyed plugin (" + n.key + ")");
      this.plugins.push(n), this.pluginsByKey[n.key] = n, n.spec.state && this.fields.push(new it(n.key, n.spec.state, n));
    });
  }
}
class He {
  /**
  @internal
  */
  constructor(e) {
    this.config = e;
  }
  /**
  The schema of the state's document.
  */
  get schema() {
    return this.config.schema;
  }
  /**
  The plugins that are active in this state.
  */
  get plugins() {
    return this.config.plugins;
  }
  /**
  Apply the given transaction to produce a new state.
  */
  apply(e) {
    return this.applyTransaction(e).state;
  }
  /**
  @internal
  */
  filterTransaction(e, t = -1) {
    for (let n = 0; n < this.config.plugins.length; n++)
      if (n != t) {
        let i = this.config.plugins[n];
        if (i.spec.filterTransaction && !i.spec.filterTransaction.call(i, e, this))
          return !1;
      }
    return !0;
  }
  /**
  Verbose variant of [`apply`](https://prosemirror.net/docs/ref/#state.EditorState.apply) that
  returns the precise transactions that were applied (which might
  be influenced by the [transaction
  hooks](https://prosemirror.net/docs/ref/#state.PluginSpec.filterTransaction) of
  plugins) along with the new state.
  */
  applyTransaction(e) {
    if (!this.filterTransaction(e))
      return { state: this, transactions: [] };
    let t = [e], n = this.applyInner(e), i = null;
    for (; ; ) {
      let s = !1;
      for (let o = 0; o < this.config.plugins.length; o++) {
        let l = this.config.plugins[o];
        if (l.spec.appendTransaction) {
          let a = i ? i[o].n : 0, c = i ? i[o].state : this, f = a < t.length && l.spec.appendTransaction.call(l, a ? t.slice(a) : t, c, n);
          if (f && n.filterTransaction(f, o)) {
            if (f.setMeta("appendedTransaction", e), !i) {
              i = [];
              for (let d = 0; d < this.config.plugins.length; d++)
                i.push(d < o ? { state: n, n: t.length } : { state: this, n: 0 });
            }
            t.push(f), n = n.applyInner(f), s = !0;
          }
          i && (i[o] = { state: n, n: t.length });
        }
      }
      if (!s)
        return { state: n, transactions: t };
    }
  }
  /**
  @internal
  */
  applyInner(e) {
    if (!e.before.eq(this.doc))
      throw new RangeError("Applying a mismatched transaction");
    let t = new He(this.config), n = this.config.fields;
    for (let i = 0; i < n.length; i++) {
      let s = n[i];
      t[s.name] = s.apply(e, this[s.name], this, t);
    }
    return t;
  }
  /**
  Start a [transaction](https://prosemirror.net/docs/ref/#state.Transaction) from this state.
  */
  get tr() {
    return new el(this);
  }
  /**
  Create a new state.
  */
  static create(e) {
    let t = new hn(e.doc ? e.doc.type.schema : e.schema, e.plugins), n = new He(t);
    for (let i = 0; i < t.fields.length; i++)
      n[t.fields[i].name] = t.fields[i].init(e, n);
    return n;
  }
  /**
  Create a new state based on this one, but with an adjusted set
  of active plugins. State fields that exist in both sets of
  plugins are kept unchanged. Those that no longer exist are
  dropped, and those that are new are initialized using their
  [`init`](https://prosemirror.net/docs/ref/#state.StateField.init) method, passing in the new
  configuration object..
  */
  reconfigure(e) {
    let t = new hn(this.schema, e.plugins), n = t.fields, i = new He(t);
    for (let s = 0; s < n.length; s++) {
      let o = n[s].name;
      i[o] = this.hasOwnProperty(o) ? this[o] : n[s].init(e, i);
    }
    return i;
  }
  /**
  Serialize this state to JSON. If you want to serialize the state
  of plugins, pass an object mapping property names to use in the
  resulting JSON object to plugin objects. The argument may also be
  a string or number, in which case it is ignored, to support the
  way `JSON.stringify` calls `toString` methods.
  */
  toJSON(e) {
    let t = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
    if (this.storedMarks && (t.storedMarks = this.storedMarks.map((n) => n.toJSON())), e && typeof e == "object")
      for (let n in e) {
        if (n == "doc" || n == "selection")
          throw new RangeError("The JSON fields `doc` and `selection` are reserved");
        let i = e[n], s = i.spec.state;
        s && s.toJSON && (t[n] = s.toJSON.call(i, this[i.key]));
      }
    return t;
  }
  /**
  Deserialize a JSON representation of a state. `config` should
  have at least a `schema` field, and should contain array of
  plugins to initialize the state with. `pluginFields` can be used
  to deserialize the state of plugins, by associating plugin
  instances with the property names they use in the JSON object.
  */
  static fromJSON(e, t, n) {
    if (!t)
      throw new RangeError("Invalid input for EditorState.fromJSON");
    if (!e.schema)
      throw new RangeError("Required config field 'schema' missing");
    let i = new hn(e.schema, e.plugins), s = new He(i);
    return i.fields.forEach((o) => {
      if (o.name == "doc")
        s.doc = xe.fromJSON(e.schema, t.doc);
      else if (o.name == "selection")
        s.selection = N.fromJSON(s.doc, t.selection);
      else if (o.name == "storedMarks")
        t.storedMarks && (s.storedMarks = t.storedMarks.map(e.schema.markFromJSON));
      else {
        if (n)
          for (let l in n) {
            let a = n[l], c = a.spec.state;
            if (a.key == o.name && c && c.fromJSON && Object.prototype.hasOwnProperty.call(t, l)) {
              s[o.name] = c.fromJSON.call(a, e, t[l], s);
              return;
            }
          }
        s[o.name] = o.init(e, s);
      }
    }), s;
  }
}
function Xi(r, e, t) {
  for (let n in r) {
    let i = r[n];
    i instanceof Function ? i = i.bind(e) : n == "handleDOMEvents" && (i = Xi(i, e, {})), t[n] = i;
  }
  return t;
}
class oe {
  /**
  Create a plugin.
  */
  constructor(e) {
    this.spec = e, this.props = {}, e.props && Xi(e.props, this, this.props), this.key = e.key ? e.key.key : Qi("plugin");
  }
  /**
  Extract the plugin's state field from an editor state.
  */
  getState(e) {
    return e[this.key];
  }
}
const pn = /* @__PURE__ */ Object.create(null);
function Qi(r) {
  return r in pn ? r + "$" + ++pn[r] : (pn[r] = 0, r + "$");
}
class We {
  /**
  Create a plugin key.
  */
  constructor(e = "key") {
    this.key = Qi(e);
  }
  /**
  Get the active plugin with this key, if any, from an editor
  state.
  */
  get(e) {
    return e.config.pluginsByKey[this.key];
  }
  /**
  Get the plugin's state from an editor state.
  */
  getState(e) {
    return e[this.key];
  }
}
const V = function(r) {
  for (var e = 0; ; e++)
    if (r = r.previousSibling, !r)
      return e;
}, ht = function(r) {
  let e = r.assignedSlot || r.parentNode;
  return e && e.nodeType == 11 ? e.host : e;
};
let In = null;
const ae = function(r, e, t) {
  let n = In || (In = document.createRange());
  return n.setEnd(r, t ?? r.nodeValue.length), n.setStart(r, e || 0), n;
}, nl = function() {
  In = null;
}, Ve = function(r, e, t, n) {
  return t && (vr(r, e, t, n, -1) || vr(r, e, t, n, 1));
}, rl = /^(img|br|input|textarea|hr)$/i;
function vr(r, e, t, n, i) {
  for (; ; ) {
    if (r == t && e == n)
      return !0;
    if (e == (i < 0 ? 0 : Q(r))) {
      let s = r.parentNode;
      if (!s || s.nodeType != 1 || kt(r) || rl.test(r.nodeName) || r.contentEditable == "false")
        return !1;
      e = V(r) + (i < 0 ? 0 : 1), r = s;
    } else if (r.nodeType == 1) {
      if (r = r.childNodes[e + (i < 0 ? -1 : 0)], r.contentEditable == "false")
        return !1;
      e = i < 0 ? Q(r) : 0;
    } else
      return !1;
  }
}
function Q(r) {
  return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function il(r, e) {
  for (; ; ) {
    if (r.nodeType == 3 && e)
      return r;
    if (r.nodeType == 1 && e > 0) {
      if (r.contentEditable == "false")
        return null;
      r = r.childNodes[e - 1], e = Q(r);
    } else if (r.parentNode && !kt(r))
      e = V(r), r = r.parentNode;
    else
      return null;
  }
}
function sl(r, e) {
  for (; ; ) {
    if (r.nodeType == 3 && e < r.nodeValue.length)
      return r;
    if (r.nodeType == 1 && e < r.childNodes.length) {
      if (r.contentEditable == "false")
        return null;
      r = r.childNodes[e], e = 0;
    } else if (r.parentNode && !kt(r))
      e = V(r) + 1, r = r.parentNode;
    else
      return null;
  }
}
function ol(r, e, t) {
  for (let n = e == 0, i = e == Q(r); n || i; ) {
    if (r == t)
      return !0;
    let s = V(r);
    if (r = r.parentNode, !r)
      return !1;
    n = n && s == 0, i = i && s == Q(r);
  }
}
function kt(r) {
  let e;
  for (let t = r; t && !(e = t.pmViewDesc); t = t.parentNode)
    ;
  return e && e.node && e.node.isBlock && (e.dom == r || e.contentDOM == r);
}
const _t = function(r) {
  return r.focusNode && Ve(r.focusNode, r.focusOffset, r.anchorNode, r.anchorOffset);
};
function De(r, e) {
  let t = document.createEvent("Event");
  return t.initEvent("keydown", !0, !0), t.keyCode = r, t.key = t.code = e, t;
}
function ll(r) {
  let e = r.activeElement;
  for (; e && e.shadowRoot; )
    e = e.shadowRoot.activeElement;
  return e;
}
function al(r, e, t) {
  if (r.caretPositionFromPoint)
    try {
      let n = r.caretPositionFromPoint(e, t);
      if (n)
        return { node: n.offsetNode, offset: Math.min(Q(n.offsetNode), n.offset) };
    } catch {
    }
  if (r.caretRangeFromPoint) {
    let n = r.caretRangeFromPoint(e, t);
    if (n)
      return { node: n.startContainer, offset: Math.min(Q(n.startContainer), n.startOffset) };
  }
}
const ie = typeof navigator < "u" ? navigator : null, Pr = typeof document < "u" ? document : null, Te = ie && ie.userAgent || "", Rn = /Edge\/(\d+)/.exec(Te), Zi = /MSIE \d/.exec(Te), vn = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(Te), G = !!(Zi || vn || Rn), Ce = Zi ? document.documentMode : vn ? +vn[1] : Rn ? +Rn[1] : 0, te = !G && /gecko\/(\d+)/i.test(Te);
te && +(/Firefox\/(\d+)/.exec(Te) || [0, 0])[1];
const Pn = !G && /Chrome\/(\d+)/.exec(Te), W = !!Pn, es = Pn ? +Pn[1] : 0, q = !G && !!ie && /Apple Computer/.test(ie.vendor), Qe = q && (/Mobile\/\w+/.test(Te) || !!ie && ie.maxTouchPoints > 2), X = Qe || (ie ? /Mac/.test(ie.platform) : !1), cl = ie ? /Win/.test(ie.platform) : !1, ce = /Android \d/.test(Te), xt = !!Pr && "webkitFontSmoothing" in Pr.documentElement.style, fl = xt ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function dl(r) {
  let e = r.defaultView && r.defaultView.visualViewport;
  return e ? {
    left: 0,
    right: e.width,
    top: 0,
    bottom: e.height
  } : {
    left: 0,
    right: r.documentElement.clientWidth,
    top: 0,
    bottom: r.documentElement.clientHeight
  };
}
function le(r, e) {
  return typeof r == "number" ? r : r[e];
}
function ul(r) {
  let e = r.getBoundingClientRect(), t = e.width / r.offsetWidth || 1, n = e.height / r.offsetHeight || 1;
  return {
    left: e.left,
    right: e.left + r.clientWidth * t,
    top: e.top,
    bottom: e.top + r.clientHeight * n
  };
}
function Br(r, e, t) {
  let n = r.someProp("scrollThreshold") || 0, i = r.someProp("scrollMargin") || 5, s = r.dom.ownerDocument;
  for (let o = t || r.dom; o; o = ht(o)) {
    if (o.nodeType != 1)
      continue;
    let l = o, a = l == s.body, c = a ? dl(s) : ul(l), f = 0, d = 0;
    if (e.top < c.top + le(n, "top") ? d = -(c.top - e.top + le(i, "top")) : e.bottom > c.bottom - le(n, "bottom") && (d = e.bottom - e.top > c.bottom - c.top ? e.top + le(i, "top") - c.top : e.bottom - c.bottom + le(i, "bottom")), e.left < c.left + le(n, "left") ? f = -(c.left - e.left + le(i, "left")) : e.right > c.right - le(n, "right") && (f = e.right - c.right + le(i, "right")), f || d)
      if (a)
        s.defaultView.scrollBy(f, d);
      else {
        let u = l.scrollLeft, h = l.scrollTop;
        d && (l.scrollTop += d), f && (l.scrollLeft += f);
        let p = l.scrollLeft - u, m = l.scrollTop - h;
        e = { left: e.left - p, top: e.top - m, right: e.right - p, bottom: e.bottom - m };
      }
    if (a || /^(fixed|sticky)$/.test(getComputedStyle(o).position))
      break;
  }
}
function hl(r) {
  let e = r.dom.getBoundingClientRect(), t = Math.max(0, e.top), n, i;
  for (let s = (e.left + e.right) / 2, o = t + 1; o < Math.min(innerHeight, e.bottom); o += 5) {
    let l = r.root.elementFromPoint(s, o);
    if (!l || l == r.dom || !r.dom.contains(l))
      continue;
    let a = l.getBoundingClientRect();
    if (a.top >= t - 20) {
      n = l, i = a.top;
      break;
    }
  }
  return { refDOM: n, refTop: i, stack: ts(r.dom) };
}
function ts(r) {
  let e = [], t = r.ownerDocument;
  for (let n = r; n && (e.push({ dom: n, top: n.scrollTop, left: n.scrollLeft }), r != t); n = ht(n))
    ;
  return e;
}
function pl({ refDOM: r, refTop: e, stack: t }) {
  let n = r ? r.getBoundingClientRect().top : 0;
  ns(t, n == 0 ? 0 : n - e);
}
function ns(r, e) {
  for (let t = 0; t < r.length; t++) {
    let { dom: n, top: i, left: s } = r[t];
    n.scrollTop != i + e && (n.scrollTop = i + e), n.scrollLeft != s && (n.scrollLeft = s);
  }
}
let Je = null;
function ml(r) {
  if (r.setActive)
    return r.setActive();
  if (Je)
    return r.focus(Je);
  let e = ts(r);
  r.focus(Je == null ? {
    get preventScroll() {
      return Je = { preventScroll: !0 }, !0;
    }
  } : void 0), Je || (Je = !1, ns(e, 0));
}
function rs(r, e) {
  let t, n = 2e8, i, s = 0, o = e.top, l = e.top, a, c;
  for (let f = r.firstChild, d = 0; f; f = f.nextSibling, d++) {
    let u;
    if (f.nodeType == 1)
      u = f.getClientRects();
    else if (f.nodeType == 3)
      u = ae(f).getClientRects();
    else
      continue;
    for (let h = 0; h < u.length; h++) {
      let p = u[h];
      if (p.top <= o && p.bottom >= l) {
        o = Math.max(p.bottom, o), l = Math.min(p.top, l);
        let m = p.left > e.left ? p.left - e.left : p.right < e.left ? e.left - p.right : 0;
        if (m < n) {
          t = f, n = m, i = m && t.nodeType == 3 ? {
            left: p.right < e.left ? p.right : p.left,
            top: e.top
          } : e, f.nodeType == 1 && m && (s = d + (e.left >= (p.left + p.right) / 2 ? 1 : 0));
          continue;
        }
      } else p.top > e.top && !a && p.left <= e.left && p.right >= e.left && (a = f, c = { left: Math.max(p.left, Math.min(p.right, e.left)), top: p.top });
      !t && (e.left >= p.right && e.top >= p.top || e.left >= p.left && e.top >= p.bottom) && (s = d + 1);
    }
  }
  return !t && a && (t = a, i = c, n = 0), t && t.nodeType == 3 ? gl(t, i) : !t || n && t.nodeType == 1 ? { node: r, offset: s } : rs(t, i);
}
function gl(r, e) {
  let t = r.nodeValue.length, n = document.createRange();
  for (let i = 0; i < t; i++) {
    n.setEnd(r, i + 1), n.setStart(r, i);
    let s = pe(n, 1);
    if (s.top != s.bottom && Yn(e, s))
      return { node: r, offset: i + (e.left >= (s.left + s.right) / 2 ? 1 : 0) };
  }
  return { node: r, offset: 0 };
}
function Yn(r, e) {
  return r.left >= e.left - 1 && r.left <= e.right + 1 && r.top >= e.top - 1 && r.top <= e.bottom + 1;
}
function yl(r, e) {
  let t = r.parentNode;
  return t && /^li$/i.test(t.nodeName) && e.left < r.getBoundingClientRect().left ? t : r;
}
function bl(r, e, t) {
  let { node: n, offset: i } = rs(e, t), s = -1;
  if (n.nodeType == 1 && !n.firstChild) {
    let o = n.getBoundingClientRect();
    s = o.left != o.right && t.left > (o.left + o.right) / 2 ? 1 : -1;
  }
  return r.docView.posFromDOM(n, i, s);
}
function kl(r, e, t, n) {
  let i = -1;
  for (let s = e, o = !1; s != r.dom; ) {
    let l = r.docView.nearestDesc(s, !0), a;
    if (!l)
      return null;
    if (l.dom.nodeType == 1 && (l.node.isBlock && l.parent || !l.contentDOM) && // Ignore elements with zero-size bounding rectangles
    ((a = l.dom.getBoundingClientRect()).width || a.height) && (l.node.isBlock && l.parent && (!o && a.left > n.left || a.top > n.top ? i = l.posBefore : (!o && a.right < n.left || a.bottom < n.top) && (i = l.posAfter), o = !0), !l.contentDOM && i < 0 && !l.node.isText))
      return (l.node.isBlock ? n.top < (a.top + a.bottom) / 2 : n.left < (a.left + a.right) / 2) ? l.posBefore : l.posAfter;
    s = l.dom.parentNode;
  }
  return i > -1 ? i : r.docView.posFromDOM(e, t, -1);
}
function is(r, e, t) {
  let n = r.childNodes.length;
  if (n && t.top < t.bottom)
    for (let i = Math.max(0, Math.min(n - 1, Math.floor(n * (e.top - t.top) / (t.bottom - t.top)) - 2)), s = i; ; ) {
      let o = r.childNodes[s];
      if (o.nodeType == 1) {
        let l = o.getClientRects();
        for (let a = 0; a < l.length; a++) {
          let c = l[a];
          if (Yn(e, c))
            return is(o, e, c);
        }
      }
      if ((s = (s + 1) % n) == i)
        break;
    }
  return r;
}
function xl(r, e) {
  let t = r.dom.ownerDocument, n, i = 0, s = al(t, e.left, e.top);
  s && ({ node: n, offset: i } = s);
  let o = (r.root.elementFromPoint ? r.root : t).elementFromPoint(e.left, e.top), l;
  if (!o || !r.dom.contains(o.nodeType != 1 ? o.parentNode : o)) {
    let c = r.dom.getBoundingClientRect();
    if (!Yn(e, c) || (o = is(r.dom, e, c), !o))
      return null;
  }
  if (q)
    for (let c = o; n && c; c = ht(c))
      c.draggable && (n = void 0);
  if (o = yl(o, e), n) {
    if (te && n.nodeType == 1 && (i = Math.min(i, n.childNodes.length), i < n.childNodes.length)) {
      let f = n.childNodes[i], d;
      f.nodeName == "IMG" && (d = f.getBoundingClientRect()).right <= e.left && d.bottom > e.top && i++;
    }
    let c;
    xt && i && n.nodeType == 1 && (c = n.childNodes[i - 1]).nodeType == 1 && c.contentEditable == "false" && c.getBoundingClientRect().top >= e.top && i--, n == r.dom && i == n.childNodes.length - 1 && n.lastChild.nodeType == 1 && e.top > n.lastChild.getBoundingClientRect().bottom ? l = r.state.doc.content.size : (i == 0 || n.nodeType != 1 || n.childNodes[i - 1].nodeName != "BR") && (l = kl(r, n, i, e));
  }
  l == null && (l = bl(r, o, e));
  let a = r.docView.nearestDesc(o, !0);
  return { pos: l, inside: a ? a.posAtStart - a.border : -1 };
}
function zr(r) {
  return r.top < r.bottom || r.left < r.right;
}
function pe(r, e) {
  let t = r.getClientRects();
  if (t.length) {
    let n = t[e < 0 ? 0 : t.length - 1];
    if (zr(n))
      return n;
  }
  return Array.prototype.find.call(t, zr) || r.getBoundingClientRect();
}
const Sl = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function ss(r, e, t) {
  let { node: n, offset: i, atom: s } = r.docView.domFromPos(e, t < 0 ? -1 : 1), o = xt || te;
  if (n.nodeType == 3)
    if (o && (Sl.test(n.nodeValue) || (t < 0 ? !i : i == n.nodeValue.length))) {
      let a = pe(ae(n, i, i), t);
      if (te && i && /\s/.test(n.nodeValue[i - 1]) && i < n.nodeValue.length) {
        let c = pe(ae(n, i - 1, i - 1), -1);
        if (c.top == a.top) {
          let f = pe(ae(n, i, i + 1), -1);
          if (f.top != a.top)
            return tt(f, f.left < c.left);
        }
      }
      return a;
    } else {
      let a = i, c = i, f = t < 0 ? 1 : -1;
      return t < 0 && !i ? (c++, f = -1) : t >= 0 && i == n.nodeValue.length ? (a--, f = 1) : t < 0 ? a-- : c++, tt(pe(ae(n, a, c), f), f < 0);
    }
  if (!r.state.doc.resolve(e - (s || 0)).parent.inlineContent) {
    if (s == null && i && (t < 0 || i == Q(n))) {
      let a = n.childNodes[i - 1];
      if (a.nodeType == 1)
        return mn(a.getBoundingClientRect(), !1);
    }
    if (s == null && i < Q(n)) {
      let a = n.childNodes[i];
      if (a.nodeType == 1)
        return mn(a.getBoundingClientRect(), !0);
    }
    return mn(n.getBoundingClientRect(), t >= 0);
  }
  if (s == null && i && (t < 0 || i == Q(n))) {
    let a = n.childNodes[i - 1], c = a.nodeType == 3 ? ae(a, Q(a) - (o ? 0 : 1)) : a.nodeType == 1 && (a.nodeName != "BR" || !a.nextSibling) ? a : null;
    if (c)
      return tt(pe(c, 1), !1);
  }
  if (s == null && i < Q(n)) {
    let a = n.childNodes[i];
    for (; a.pmViewDesc && a.pmViewDesc.ignoreForCoords; )
      a = a.nextSibling;
    let c = a ? a.nodeType == 3 ? ae(a, 0, o ? 0 : 1) : a.nodeType == 1 ? a : null : null;
    if (c)
      return tt(pe(c, -1), !0);
  }
  return tt(pe(n.nodeType == 3 ? ae(n) : n, -t), t >= 0);
}
function tt(r, e) {
  if (r.width == 0)
    return r;
  let t = e ? r.left : r.right;
  return { top: r.top, bottom: r.bottom, left: t, right: t };
}
function mn(r, e) {
  if (r.height == 0)
    return r;
  let t = e ? r.top : r.bottom;
  return { top: t, bottom: t, left: r.left, right: r.right };
}
function ls(r, e, t) {
  let n = r.state, i = r.root.activeElement;
  n != e && r.updateState(e), i != r.dom && r.focus();
  try {
    return t();
  } finally {
    n != e && r.updateState(n), i != r.dom && i && i.focus();
  }
}
function Cl(r, e, t) {
  let n = e.selection, i = t == "up" ? n.$from : n.$to;
  return ls(r, e, () => {
    let { node: s } = r.docView.domFromPos(i.pos, t == "up" ? -1 : 1);
    for (; ; ) {
      let l = r.docView.nearestDesc(s, !0);
      if (!l)
        break;
      if (l.node.isBlock) {
        s = l.contentDOM || l.dom;
        break;
      }
      s = l.dom.parentNode;
    }
    let o = ss(r, i.pos, 1);
    for (let l = s.firstChild; l; l = l.nextSibling) {
      let a;
      if (l.nodeType == 1)
        a = l.getClientRects();
      else if (l.nodeType == 3)
        a = ae(l, 0, l.nodeValue.length).getClientRects();
      else
        continue;
      for (let c = 0; c < a.length; c++) {
        let f = a[c];
        if (f.bottom > f.top + 1 && (t == "up" ? o.top - f.top > (f.bottom - o.top) * 2 : f.bottom - o.bottom > (o.bottom - f.top) * 2))
          return !1;
      }
    }
    return !0;
  });
}
const Ml = /[\u0590-\u08ac]/;
function wl(r, e, t) {
  let { $head: n } = e.selection;
  if (!n.parent.isTextblock)
    return !1;
  let i = n.parentOffset, s = !i, o = i == n.parent.content.size, l = r.domSelection();
  return l ? !Ml.test(n.parent.textContent) || !l.modify ? t == "left" || t == "backward" ? s : o : ls(r, e, () => {
    let { focusNode: a, focusOffset: c, anchorNode: f, anchorOffset: d } = r.domSelectionRange(), u = l.caretBidiLevel;
    l.modify("move", t, "character");
    let h = n.depth ? r.docView.domAfterPos(n.before()) : r.dom, { focusNode: p, focusOffset: m } = r.domSelectionRange(), g = p && !h.contains(p.nodeType == 1 ? p : p.parentNode) || a == p && c == m;
    try {
      l.collapse(f, d), a && (a != f || c != d) && l.extend && l.extend(a, c);
    } catch {
    }
    return u != null && (l.caretBidiLevel = u), g;
  }) : n.pos == n.start() || n.pos == n.end();
}
let Fr = null, Vr = null, Lr = !1;
function Ol(r, e, t) {
  return Fr == e && Vr == t ? Lr : (Fr = e, Vr = t, Lr = t == "up" || t == "down" ? Cl(r, e, t) : wl(r, e, t));
}
const Z = 0, $r = 1, Ie = 2, se = 3;
class St {
  constructor(e, t, n, i) {
    this.parent = e, this.children = t, this.dom = n, this.contentDOM = i, this.dirty = Z, n.pmViewDesc = this;
  }
  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  matchesWidget(e) {
    return !1;
  }
  matchesMark(e) {
    return !1;
  }
  matchesNode(e, t, n) {
    return !1;
  }
  matchesHack(e) {
    return !1;
  }
  // When parsing in-editor content (in domchange.js), we allow
  // descriptions to determine the parse rules that should be used to
  // parse them.
  parseRule() {
    return null;
  }
  // Used by the editor's event handler to ignore events that come
  // from certain descs.
  stopEvent(e) {
    return !1;
  }
  // The size of the content represented by this desc.
  get size() {
    let e = 0;
    for (let t = 0; t < this.children.length; t++)
      e += this.children[t].size;
    return e;
  }
  // For block nodes, this represents the space taken up by their
  // start/end tokens.
  get border() {
    return 0;
  }
  destroy() {
    this.parent = void 0, this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
    for (let e = 0; e < this.children.length; e++)
      this.children[e].destroy();
  }
  posBeforeChild(e) {
    for (let t = 0, n = this.posAtStart; ; t++) {
      let i = this.children[t];
      if (i == e)
        return n;
      n += i.size;
    }
  }
  get posBefore() {
    return this.parent.posBeforeChild(this);
  }
  get posAtStart() {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
  }
  get posAfter() {
    return this.posBefore + this.size;
  }
  get posAtEnd() {
    return this.posAtStart + this.size - 2 * this.border;
  }
  localPosFromDOM(e, t, n) {
    if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode))
      if (n < 0) {
        let s, o;
        if (e == this.contentDOM)
          s = e.childNodes[t - 1];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          s = e.previousSibling;
        }
        for (; s && !((o = s.pmViewDesc) && o.parent == this); )
          s = s.previousSibling;
        return s ? this.posBeforeChild(o) + o.size : this.posAtStart;
      } else {
        let s, o;
        if (e == this.contentDOM)
          s = e.childNodes[t];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          s = e.nextSibling;
        }
        for (; s && !((o = s.pmViewDesc) && o.parent == this); )
          s = s.nextSibling;
        return s ? this.posBeforeChild(o) : this.posAtEnd;
      }
    let i;
    if (e == this.dom && this.contentDOM)
      i = t > V(this.contentDOM);
    else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM))
      i = e.compareDocumentPosition(this.contentDOM) & 2;
    else if (this.dom.firstChild) {
      if (t == 0)
        for (let s = e; ; s = s.parentNode) {
          if (s == this.dom) {
            i = !1;
            break;
          }
          if (s.previousSibling)
            break;
        }
      if (i == null && t == e.childNodes.length)
        for (let s = e; ; s = s.parentNode) {
          if (s == this.dom) {
            i = !0;
            break;
          }
          if (s.nextSibling)
            break;
        }
    }
    return i ?? n > 0 ? this.posAtEnd : this.posAtStart;
  }
  nearestDesc(e, t = !1) {
    for (let n = !0, i = e; i; i = i.parentNode) {
      let s = this.getDesc(i), o;
      if (s && (!t || s.node))
        if (n && (o = s.nodeDOM) && !(o.nodeType == 1 ? o.contains(e.nodeType == 1 ? e : e.parentNode) : o == e))
          n = !1;
        else
          return s;
    }
  }
  getDesc(e) {
    let t = e.pmViewDesc;
    for (let n = t; n; n = n.parent)
      if (n == this)
        return t;
  }
  posFromDOM(e, t, n) {
    for (let i = e; i; i = i.parentNode) {
      let s = this.getDesc(i);
      if (s)
        return s.localPosFromDOM(e, t, n);
    }
    return -1;
  }
  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  descAt(e) {
    for (let t = 0, n = 0; t < this.children.length; t++) {
      let i = this.children[t], s = n + i.size;
      if (n == e && s != n) {
        for (; !i.border && i.children.length; )
          for (let o = 0; o < i.children.length; o++) {
            let l = i.children[o];
            if (l.size) {
              i = l;
              break;
            }
          }
        return i;
      }
      if (e < s)
        return i.descAt(e - n - i.border);
      n = s;
    }
  }
  domFromPos(e, t) {
    if (!this.contentDOM)
      return { node: this.dom, offset: 0, atom: e + 1 };
    let n = 0, i = 0;
    for (let s = 0; n < this.children.length; n++) {
      let o = this.children[n], l = s + o.size;
      if (l > e || o instanceof cs) {
        i = e - s;
        break;
      }
      s = l;
    }
    if (i)
      return this.children[n].domFromPos(i - this.children[n].border, t);
    for (let s; n && !(s = this.children[n - 1]).size && s instanceof as && s.side >= 0; n--)
      ;
    if (t <= 0) {
      let s, o = !0;
      for (; s = n ? this.children[n - 1] : null, !(!s || s.dom.parentNode == this.contentDOM); n--, o = !1)
        ;
      return s && t && o && !s.border && !s.domAtom ? s.domFromPos(s.size, t) : { node: this.contentDOM, offset: s ? V(s.dom) + 1 : 0 };
    } else {
      let s, o = !0;
      for (; s = n < this.children.length ? this.children[n] : null, !(!s || s.dom.parentNode == this.contentDOM); n++, o = !1)
        ;
      return s && o && !s.border && !s.domAtom ? s.domFromPos(0, t) : { node: this.contentDOM, offset: s ? V(s.dom) : this.contentDOM.childNodes.length };
    }
  }
  // Used to find a DOM range in a single parent for a given changed
  // range.
  parseRange(e, t, n = 0) {
    if (this.children.length == 0)
      return { node: this.contentDOM, from: e, to: t, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
    let i = -1, s = -1;
    for (let o = n, l = 0; ; l++) {
      let a = this.children[l], c = o + a.size;
      if (i == -1 && e <= c) {
        let f = o + a.border;
        if (e >= f && t <= c - a.border && a.node && a.contentDOM && this.contentDOM.contains(a.contentDOM))
          return a.parseRange(e, t, f);
        e = o;
        for (let d = l; d > 0; d--) {
          let u = this.children[d - 1];
          if (u.size && u.dom.parentNode == this.contentDOM && !u.emptyChildAt(1)) {
            i = V(u.dom) + 1;
            break;
          }
          e -= u.size;
        }
        i == -1 && (i = 0);
      }
      if (i > -1 && (c > t || l == this.children.length - 1)) {
        t = c;
        for (let f = l + 1; f < this.children.length; f++) {
          let d = this.children[f];
          if (d.size && d.dom.parentNode == this.contentDOM && !d.emptyChildAt(-1)) {
            s = V(d.dom);
            break;
          }
          t += d.size;
        }
        s == -1 && (s = this.contentDOM.childNodes.length);
        break;
      }
      o = c;
    }
    return { node: this.contentDOM, from: e, to: t, fromOffset: i, toOffset: s };
  }
  emptyChildAt(e) {
    if (this.border || !this.contentDOM || !this.children.length)
      return !1;
    let t = this.children[e < 0 ? 0 : this.children.length - 1];
    return t.size == 0 || t.emptyChildAt(e);
  }
  domAfterPos(e) {
    let { node: t, offset: n } = this.domFromPos(e, 0);
    if (t.nodeType != 1 || n == t.childNodes.length)
      throw new RangeError("No node after pos " + e);
    return t.childNodes[n];
  }
  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  setSelection(e, t, n, i = !1) {
    let s = Math.min(e, t), o = Math.max(e, t);
    for (let h = 0, p = 0; h < this.children.length; h++) {
      let m = this.children[h], g = p + m.size;
      if (s > p && o < g)
        return m.setSelection(e - p - m.border, t - p - m.border, n, i);
      p = g;
    }
    let l = this.domFromPos(e, e ? -1 : 1), a = t == e ? l : this.domFromPos(t, t ? -1 : 1), c = n.root.getSelection(), f = n.domSelectionRange(), d = !1;
    if ((te || q) && e == t) {
      let { node: h, offset: p } = l;
      if (h.nodeType == 3) {
        if (d = !!(p && h.nodeValue[p - 1] == `
`), d && p == h.nodeValue.length)
          for (let m = h, g; m; m = m.parentNode) {
            if (g = m.nextSibling) {
              g.nodeName == "BR" && (l = a = { node: g.parentNode, offset: V(g) + 1 });
              break;
            }
            let y = m.pmViewDesc;
            if (y && y.node && y.node.isBlock)
              break;
          }
      } else {
        let m = h.childNodes[p - 1];
        d = m && (m.nodeName == "BR" || m.contentEditable == "false");
      }
    }
    if (te && f.focusNode && f.focusNode != a.node && f.focusNode.nodeType == 1) {
      let h = f.focusNode.childNodes[f.focusOffset];
      h && h.contentEditable == "false" && (i = !0);
    }
    if (!(i || d && q) && Ve(l.node, l.offset, f.anchorNode, f.anchorOffset) && Ve(a.node, a.offset, f.focusNode, f.focusOffset))
      return;
    let u = !1;
    if ((c.extend || e == t) && !d) {
      c.collapse(l.node, l.offset);
      try {
        e != t && c.extend(a.node, a.offset), u = !0;
      } catch {
      }
    }
    if (!u) {
      if (e > t) {
        let p = l;
        l = a, a = p;
      }
      let h = document.createRange();
      h.setEnd(a.node, a.offset), h.setStart(l.node, l.offset), c.removeAllRanges(), c.addRange(h);
    }
  }
  ignoreMutation(e) {
    return !this.contentDOM && e.type != "selection";
  }
  get contentLost() {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
  }
  // Remove a subtree of the element tree that has been touched
  // by a DOM change, so that the next update will redraw it.
  markDirty(e, t) {
    for (let n = 0, i = 0; i < this.children.length; i++) {
      let s = this.children[i], o = n + s.size;
      if (n == o ? e <= o && t >= n : e < o && t > n) {
        let l = n + s.border, a = o - s.border;
        if (e >= l && t <= a) {
          this.dirty = e == n || t == o ? Ie : $r, e == l && t == a && (s.contentLost || s.dom.parentNode != this.contentDOM) ? s.dirty = se : s.markDirty(e - l, t - l);
          return;
        } else
          s.dirty = s.dom == s.contentDOM && s.dom.parentNode == this.contentDOM && !s.children.length ? Ie : se;
      }
      n = o;
    }
    this.dirty = Ie;
  }
  markParentsDirty() {
    let e = 1;
    for (let t = this.parent; t; t = t.parent, e++) {
      let n = e == 1 ? Ie : $r;
      t.dirty < n && (t.dirty = n);
    }
  }
  get domAtom() {
    return !1;
  }
  get ignoreForCoords() {
    return !1;
  }
  isText(e) {
    return !1;
  }
}
class as extends St {
  constructor(e, t, n, i) {
    let s, o = t.type.toDOM;
    if (typeof o == "function" && (o = o(n, () => {
      if (!s)
        return i;
      if (s.parent)
        return s.parent.posBeforeChild(s);
    })), !t.type.spec.raw) {
      if (o.nodeType != 1) {
        let l = document.createElement("span");
        l.appendChild(o), o = l;
      }
      o.contentEditable = "false", o.classList.add("ProseMirror-widget");
    }
    super(e, [], o, null), this.widget = t, this.widget = t, s = this;
  }
  matchesWidget(e) {
    return this.dirty == Z && e.type.eq(this.widget.type);
  }
  parseRule() {
    return { ignore: !0 };
  }
  stopEvent(e) {
    let t = this.widget.spec.stopEvent;
    return t ? t(e) : !1;
  }
  ignoreMutation(e) {
    return e.type != "selection" || this.widget.spec.ignoreSelection;
  }
  destroy() {
    this.widget.type.destroy(this.dom), super.destroy();
  }
  get domAtom() {
    return !0;
  }
  get side() {
    return this.widget.type.side;
  }
}
class Nl extends St {
  constructor(e, t, n, i) {
    super(e, [], t, null), this.textDOM = n, this.text = i;
  }
  get size() {
    return this.text.length;
  }
  localPosFromDOM(e, t) {
    return e != this.textDOM ? this.posAtStart + (t ? this.size : 0) : this.posAtStart + t;
  }
  domFromPos(e) {
    return { node: this.textDOM, offset: e };
  }
  ignoreMutation(e) {
    return e.type === "characterData" && e.target.nodeValue == e.oldValue;
  }
}
class Le extends St {
  constructor(e, t, n, i, s) {
    super(e, [], n, i), this.mark = t, this.spec = s;
  }
  static create(e, t, n, i) {
    let s = i.nodeViews[t.type.name], o = s && s(t, i, n);
    return (!o || !o.dom) && (o = $e.renderSpec(document, t.type.spec.toDOM(t, n), null, t.attrs)), new Le(e, t, o.dom, o.contentDOM || o.dom, o);
  }
  parseRule() {
    return this.dirty & se || this.mark.type.spec.reparseInView ? null : { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
  }
  matchesMark(e) {
    return this.dirty != se && this.mark.eq(e);
  }
  markDirty(e, t) {
    if (super.markDirty(e, t), this.dirty != Z) {
      let n = this.parent;
      for (; !n.node; )
        n = n.parent;
      n.dirty < this.dirty && (n.dirty = this.dirty), this.dirty = Z;
    }
  }
  slice(e, t, n) {
    let i = Le.create(this.parent, this.mark, !0, n), s = this.children, o = this.size;
    t < o && (s = zn(s, t, o, n)), e > 0 && (s = zn(s, 0, e, n));
    for (let l = 0; l < s.length; l++)
      s[l].parent = i;
    return i.children = s, i;
  }
  ignoreMutation(e) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
}
class Me extends St {
  constructor(e, t, n, i, s, o, l, a, c) {
    super(e, [], s, o), this.node = t, this.outerDeco = n, this.innerDeco = i, this.nodeDOM = l;
  }
  // By default, a node is rendered using the `toDOM` method from the
  // node type spec. But client code can use the `nodeViews` spec to
  // supply a custom node view, which can influence various aspects of
  // the way the node works.
  //
  // (Using subclassing for this was intentionally decided against,
  // since it'd require exposing a whole slew of finicky
  // implementation details to the user code that they probably will
  // never need.)
  static create(e, t, n, i, s, o) {
    let l = s.nodeViews[t.type.name], a, c = l && l(t, s, () => {
      if (!a)
        return o;
      if (a.parent)
        return a.parent.posBeforeChild(a);
    }, n, i), f = c && c.dom, d = c && c.contentDOM;
    if (t.isText) {
      if (!f)
        f = document.createTextNode(t.text);
      else if (f.nodeType != 3)
        throw new RangeError("Text must be rendered as a DOM text node");
    } else f || ({ dom: f, contentDOM: d } = $e.renderSpec(document, t.type.spec.toDOM(t), null, t.attrs));
    !d && !t.isText && f.nodeName != "BR" && (f.hasAttribute("contenteditable") || (f.contentEditable = "false"), t.type.spec.draggable && (f.draggable = !0));
    let u = f;
    return f = us(f, n, t), c ? a = new Tl(e, t, n, i, f, d || null, u, c, s, o + 1) : t.isText ? new Xt(e, t, n, i, f, u, s) : new Me(e, t, n, i, f, d || null, u, s, o + 1);
  }
  parseRule() {
    if (this.node.type.spec.reparseInView)
      return null;
    let e = { node: this.node.type.name, attrs: this.node.attrs };
    if (this.node.type.whitespace == "pre" && (e.preserveWhitespace = "full"), !this.contentDOM)
      e.getContent = () => this.node.content;
    else if (!this.contentLost)
      e.contentElement = this.contentDOM;
    else {
      for (let t = this.children.length - 1; t >= 0; t--) {
        let n = this.children[t];
        if (this.dom.contains(n.dom.parentNode)) {
          e.contentElement = n.dom.parentNode;
          break;
        }
      }
      e.contentElement || (e.getContent = () => b.empty);
    }
    return e;
  }
  matchesNode(e, t, n) {
    return this.dirty == Z && e.eq(this.node) && Vt(t, this.outerDeco) && n.eq(this.innerDeco);
  }
  get size() {
    return this.node.nodeSize;
  }
  get border() {
    return this.node.isLeaf ? 0 : 1;
  }
  // Syncs `this.children` to match `this.node.content` and the local
  // decorations, possibly introducing nesting for marks. Then, in a
  // separate step, syncs the DOM inside `this.contentDOM` to
  // `this.children`.
  updateChildren(e, t) {
    let n = this.node.inlineContent, i = t, s = e.composing ? this.localCompositionInfo(e, t) : null, o = s && s.pos > -1 ? s : null, l = s && s.pos < 0, a = new Dl(this, o && o.node, e);
    Rl(this.node, this.innerDeco, (c, f, d) => {
      c.spec.marks ? a.syncToMarks(c.spec.marks, n, e) : c.type.side >= 0 && !d && a.syncToMarks(f == this.node.childCount ? I.none : this.node.child(f).marks, n, e), a.placeWidget(c, e, i);
    }, (c, f, d, u) => {
      a.syncToMarks(c.marks, n, e);
      let h;
      a.findNodeMatch(c, f, d, u) || l && e.state.selection.from > i && e.state.selection.to < i + c.nodeSize && (h = a.findIndexWithChild(s.node)) > -1 && a.updateNodeAt(c, f, d, h, e) || a.updateNextNode(c, f, d, e, u, i) || a.addNode(c, f, d, e, i), i += c.nodeSize;
    }), a.syncToMarks([], n, e), this.node.isTextblock && a.addTextblockHacks(), a.destroyRest(), (a.changed || this.dirty == Ie) && (o && this.protectLocalComposition(e, o), fs(this.contentDOM, this.children, e), Qe && vl(this.dom));
  }
  localCompositionInfo(e, t) {
    let { from: n, to: i } = e.state.selection;
    if (!(e.state.selection instanceof O) || n < t || i > t + this.node.content.size)
      return null;
    let s = e.input.compositionNode;
    if (!s || !this.dom.contains(s.parentNode))
      return null;
    if (this.node.inlineContent) {
      let o = s.nodeValue, l = Pl(this.node.content, o, n - t, i - t);
      return l < 0 ? null : { node: s, pos: l, text: o };
    } else
      return { node: s, pos: -1, text: "" };
  }
  protectLocalComposition(e, { node: t, pos: n, text: i }) {
    if (this.getDesc(t))
      return;
    let s = t;
    for (; s.parentNode != this.contentDOM; s = s.parentNode) {
      for (; s.previousSibling; )
        s.parentNode.removeChild(s.previousSibling);
      for (; s.nextSibling; )
        s.parentNode.removeChild(s.nextSibling);
      s.pmViewDesc && (s.pmViewDesc = void 0);
    }
    let o = new Nl(this, s, t, i);
    e.input.compositionNodes.push(o), this.children = zn(this.children, n, n + i.length, e, o);
  }
  // If this desc must be updated to match the given node decoration,
  // do so and return true.
  update(e, t, n, i) {
    return this.dirty == se || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, i), !0);
  }
  updateInner(e, t, n, i) {
    this.updateOuterDeco(t), this.node = e, this.innerDeco = n, this.contentDOM && this.updateChildren(i, this.posAtStart), this.dirty = Z;
  }
  updateOuterDeco(e) {
    if (Vt(e, this.outerDeco))
      return;
    let t = this.nodeDOM.nodeType != 1, n = this.dom;
    this.dom = ds(this.dom, this.nodeDOM, Bn(this.outerDeco, this.node, t), Bn(e, this.node, t)), this.dom != n && (n.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e;
  }
  // Mark this node as being the selected node.
  selectNode() {
    this.nodeDOM.nodeType == 1 && this.nodeDOM.classList.add("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && (this.dom.draggable = !0);
  }
  // Remove selected node marking from this node.
  deselectNode() {
    this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.remove("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && this.dom.removeAttribute("draggable"));
  }
  get domAtom() {
    return this.node.isAtom;
  }
}
function Wr(r, e, t, n, i) {
  us(n, e, r);
  let s = new Me(void 0, r, e, t, n, n, n, i, 0);
  return s.contentDOM && s.updateChildren(i, 0), s;
}
class Xt extends Me {
  constructor(e, t, n, i, s, o, l) {
    super(e, t, n, i, s, null, o, l, 0);
  }
  parseRule() {
    let e = this.nodeDOM.parentNode;
    for (; e && e != this.dom && !e.pmIsDeco; )
      e = e.parentNode;
    return { skip: e || !0 };
  }
  update(e, t, n, i) {
    return this.dirty == se || this.dirty != Z && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t), (this.dirty != Z || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, i.trackWrites == this.nodeDOM && (i.trackWrites = null)), this.node = e, this.dirty = Z, !0);
  }
  inParent() {
    let e = this.parent.contentDOM;
    for (let t = this.nodeDOM; t; t = t.parentNode)
      if (t == e)
        return !0;
    return !1;
  }
  domFromPos(e) {
    return { node: this.nodeDOM, offset: e };
  }
  localPosFromDOM(e, t, n) {
    return e == this.nodeDOM ? this.posAtStart + Math.min(t, this.node.text.length) : super.localPosFromDOM(e, t, n);
  }
  ignoreMutation(e) {
    return e.type != "characterData" && e.type != "selection";
  }
  slice(e, t, n) {
    let i = this.node.cut(e, t), s = document.createTextNode(i.text);
    return new Xt(this.parent, i, this.outerDeco, this.innerDeco, s, s, n);
  }
  markDirty(e, t) {
    super.markDirty(e, t), this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = se);
  }
  get domAtom() {
    return !1;
  }
  isText(e) {
    return this.node.text == e;
  }
}
class cs extends St {
  parseRule() {
    return { ignore: !0 };
  }
  matchesHack(e) {
    return this.dirty == Z && this.dom.nodeName == e;
  }
  get domAtom() {
    return !0;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == "IMG";
  }
}
class Tl extends Me {
  constructor(e, t, n, i, s, o, l, a, c, f) {
    super(e, t, n, i, s, o, l, c, f), this.spec = a;
  }
  // A custom `update` method gets to decide whether the update goes
  // through. If it does, and there's a `contentDOM` node, our logic
  // updates the children.
  update(e, t, n, i) {
    if (this.dirty == se)
      return !1;
    if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
      let s = this.spec.update(e, t, n);
      return s && this.updateInner(e, t, n, i), s;
    } else return !this.contentDOM && !e.isLeaf ? !1 : super.update(e, t, n, i);
  }
  selectNode() {
    this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
  }
  deselectNode() {
    this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
  }
  setSelection(e, t, n, i) {
    this.spec.setSelection ? this.spec.setSelection(e, t, n.root) : super.setSelection(e, t, n, i);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
  stopEvent(e) {
    return this.spec.stopEvent ? this.spec.stopEvent(e) : !1;
  }
  ignoreMutation(e) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
  }
}
function fs(r, e, t) {
  let n = r.firstChild, i = !1;
  for (let s = 0; s < e.length; s++) {
    let o = e[s], l = o.dom;
    if (l.parentNode == r) {
      for (; l != n; )
        n = Jr(n), i = !0;
      n = n.nextSibling;
    } else
      i = !0, r.insertBefore(l, n);
    if (o instanceof Le) {
      let a = n ? n.previousSibling : r.lastChild;
      fs(o.contentDOM, o.children, t), n = a ? a.nextSibling : r.firstChild;
    }
  }
  for (; n; )
    n = Jr(n), i = !0;
  i && t.trackWrites == r && (t.trackWrites = null);
}
const at = function(r) {
  r && (this.nodeName = r);
};
at.prototype = /* @__PURE__ */ Object.create(null);
const Re = [new at()];
function Bn(r, e, t) {
  if (r.length == 0)
    return Re;
  let n = t ? Re[0] : new at(), i = [n];
  for (let s = 0; s < r.length; s++) {
    let o = r[s].type.attrs;
    if (o) {
      o.nodeName && i.push(n = new at(o.nodeName));
      for (let l in o) {
        let a = o[l];
        a != null && (t && i.length == 1 && i.push(n = new at(e.isInline ? "span" : "div")), l == "class" ? n.class = (n.class ? n.class + " " : "") + a : l == "style" ? n.style = (n.style ? n.style + ";" : "") + a : l != "nodeName" && (n[l] = a));
      }
    }
  }
  return i;
}
function ds(r, e, t, n) {
  if (t == Re && n == Re)
    return e;
  let i = e;
  for (let s = 0; s < n.length; s++) {
    let o = n[s], l = t[s];
    if (s) {
      let a;
      l && l.nodeName == o.nodeName && i != r && (a = i.parentNode) && a.nodeName.toLowerCase() == o.nodeName || (a = document.createElement(o.nodeName), a.pmIsDeco = !0, a.appendChild(i), l = Re[0]), i = a;
    }
    El(i, l || Re[0], o);
  }
  return i;
}
function El(r, e, t) {
  for (let n in e)
    n != "class" && n != "style" && n != "nodeName" && !(n in t) && r.removeAttribute(n);
  for (let n in t)
    n != "class" && n != "style" && n != "nodeName" && t[n] != e[n] && r.setAttribute(n, t[n]);
  if (e.class != t.class) {
    let n = e.class ? e.class.split(" ").filter(Boolean) : [], i = t.class ? t.class.split(" ").filter(Boolean) : [];
    for (let s = 0; s < n.length; s++)
      i.indexOf(n[s]) == -1 && r.classList.remove(n[s]);
    for (let s = 0; s < i.length; s++)
      n.indexOf(i[s]) == -1 && r.classList.add(i[s]);
    r.classList.length == 0 && r.removeAttribute("class");
  }
  if (e.style != t.style) {
    if (e.style) {
      let n = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, i;
      for (; i = n.exec(e.style); )
        r.style.removeProperty(i[1]);
    }
    t.style && (r.style.cssText += t.style);
  }
}
function us(r, e, t) {
  return ds(r, r, Re, Bn(e, t, r.nodeType != 1));
}
function Vt(r, e) {
  if (r.length != e.length)
    return !1;
  for (let t = 0; t < r.length; t++)
    if (!r[t].type.eq(e[t].type))
      return !1;
  return !0;
}
function Jr(r) {
  let e = r.nextSibling;
  return r.parentNode.removeChild(r), e;
}
class Dl {
  constructor(e, t, n) {
    this.lock = t, this.view = n, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = Al(e.node.content, e);
  }
  // Destroy and remove the children between the given indices in
  // `this.top`.
  destroyBetween(e, t) {
    if (e != t) {
      for (let n = e; n < t; n++)
        this.top.children[n].destroy();
      this.top.children.splice(e, t - e), this.changed = !0;
    }
  }
  // Destroy all remaining children in `this.top`.
  destroyRest() {
    this.destroyBetween(this.index, this.top.children.length);
  }
  // Sync the current stack of mark descs with the given array of
  // marks, reusing existing mark descs when possible.
  syncToMarks(e, t, n) {
    let i = 0, s = this.stack.length >> 1, o = Math.min(s, e.length);
    for (; i < o && (i == s - 1 ? this.top : this.stack[i + 1 << 1]).matchesMark(e[i]) && e[i].type.spec.spanning !== !1; )
      i++;
    for (; i < s; )
      this.destroyRest(), this.top.dirty = Z, this.index = this.stack.pop(), this.top = this.stack.pop(), s--;
    for (; s < e.length; ) {
      this.stack.push(this.top, this.index + 1);
      let l = -1;
      for (let a = this.index; a < Math.min(this.index + 3, this.top.children.length); a++) {
        let c = this.top.children[a];
        if (c.matchesMark(e[s]) && !this.isLocked(c.dom)) {
          l = a;
          break;
        }
      }
      if (l > -1)
        l > this.index && (this.changed = !0, this.destroyBetween(this.index, l)), this.top = this.top.children[this.index];
      else {
        let a = Le.create(this.top, e[s], t, n);
        this.top.children.splice(this.index, 0, a), this.top = a, this.changed = !0;
      }
      this.index = 0, s++;
    }
  }
  // Try to find a node desc matching the given data. Skip over it and
  // return true when successful.
  findNodeMatch(e, t, n, i) {
    let s = -1, o;
    if (i >= this.preMatch.index && (o = this.preMatch.matches[i - this.preMatch.index]).parent == this.top && o.matchesNode(e, t, n))
      s = this.top.children.indexOf(o, this.index);
    else
      for (let l = this.index, a = Math.min(this.top.children.length, l + 5); l < a; l++) {
        let c = this.top.children[l];
        if (c.matchesNode(e, t, n) && !this.preMatch.matched.has(c)) {
          s = l;
          break;
        }
      }
    return s < 0 ? !1 : (this.destroyBetween(this.index, s), this.index++, !0);
  }
  updateNodeAt(e, t, n, i, s) {
    let o = this.top.children[i];
    return o.dirty == se && o.dom == o.contentDOM && (o.dirty = Ie), o.update(e, t, n, s) ? (this.destroyBetween(this.index, i), this.index++, !0) : !1;
  }
  findIndexWithChild(e) {
    for (; ; ) {
      let t = e.parentNode;
      if (!t)
        return -1;
      if (t == this.top.contentDOM) {
        let n = e.pmViewDesc;
        if (n) {
          for (let i = this.index; i < this.top.children.length; i++)
            if (this.top.children[i] == n)
              return i;
        }
        return -1;
      }
      e = t;
    }
  }
  // Try to update the next node, if any, to the given data. Checks
  // pre-matches to avoid overwriting nodes that could still be used.
  updateNextNode(e, t, n, i, s, o) {
    for (let l = this.index; l < this.top.children.length; l++) {
      let a = this.top.children[l];
      if (a instanceof Me) {
        let c = this.preMatch.matched.get(a);
        if (c != null && c != s)
          return !1;
        let f = a.dom, d, u = this.isLocked(f) && !(e.isText && a.node && a.node.isText && a.nodeDOM.nodeValue == e.text && a.dirty != se && Vt(t, a.outerDeco));
        if (!u && a.update(e, t, n, i))
          return this.destroyBetween(this.index, l), a.dom != f && (this.changed = !0), this.index++, !0;
        if (!u && (d = this.recreateWrapper(a, e, t, n, i, o)))
          return this.destroyBetween(this.index, l), this.top.children[this.index] = d, d.contentDOM && (d.dirty = Ie, d.updateChildren(i, o + 1), d.dirty = Z), this.changed = !0, this.index++, !0;
        break;
      }
    }
    return !1;
  }
  // When a node with content is replaced by a different node with
  // identical content, move over its children.
  recreateWrapper(e, t, n, i, s, o) {
    if (e.dirty || t.isAtom || !e.children.length || !e.node.content.eq(t.content) || !Vt(n, e.outerDeco) || !i.eq(e.innerDeco))
      return null;
    let l = Me.create(this.top, t, n, i, s, o);
    if (l.contentDOM) {
      l.children = e.children, e.children = [];
      for (let a of l.children)
        a.parent = l;
    }
    return e.destroy(), l;
  }
  // Insert the node as a newly created node desc.
  addNode(e, t, n, i, s) {
    let o = Me.create(this.top, e, t, n, i, s);
    o.contentDOM && o.updateChildren(i, s + 1), this.top.children.splice(this.index++, 0, o), this.changed = !0;
  }
  placeWidget(e, t, n) {
    let i = this.index < this.top.children.length ? this.top.children[this.index] : null;
    if (i && i.matchesWidget(e) && (e == i.widget || !i.widget.type.toDOM.parentNode))
      this.index++;
    else {
      let s = new as(this.top, e, t, n);
      this.top.children.splice(this.index++, 0, s), this.changed = !0;
    }
  }
  // Make sure a textblock looks and behaves correctly in
  // contentEditable.
  addTextblockHacks() {
    let e = this.top.children[this.index - 1], t = this.top;
    for (; e instanceof Le; )
      t = e, e = t.children[t.children.length - 1];
    (!e || // Empty textblock
    !(e instanceof Xt) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((q || W) && e && e.dom.contentEditable == "false" && this.addHackNode("IMG", t), this.addHackNode("BR", this.top));
  }
  addHackNode(e, t) {
    if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e))
      this.index++;
    else {
      let n = document.createElement(e);
      e == "IMG" && (n.className = "ProseMirror-separator", n.alt = ""), e == "BR" && (n.className = "ProseMirror-trailingBreak");
      let i = new cs(this.top, [], n, null);
      t != this.top ? t.children.push(i) : t.children.splice(this.index++, 0, i), this.changed = !0;
    }
  }
  isLocked(e) {
    return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode));
  }
}
function Al(r, e) {
  let t = e, n = t.children.length, i = r.childCount, s = /* @__PURE__ */ new Map(), o = [];
  e: for (; i > 0; ) {
    let l;
    for (; ; )
      if (n) {
        let c = t.children[n - 1];
        if (c instanceof Le)
          t = c, n = c.children.length;
        else {
          l = c, n--;
          break;
        }
      } else {
        if (t == e)
          break e;
        n = t.parent.children.indexOf(t), t = t.parent;
      }
    let a = l.node;
    if (a) {
      if (a != r.child(i - 1))
        break;
      --i, s.set(l, i), o.push(l);
    }
  }
  return { index: i, matched: s, matches: o.reverse() };
}
function Il(r, e) {
  return r.type.side - e.type.side;
}
function Rl(r, e, t, n) {
  let i = e.locals(r), s = 0;
  if (i.length == 0) {
    for (let c = 0; c < r.childCount; c++) {
      let f = r.child(c);
      n(f, i, e.forChild(s, f), c), s += f.nodeSize;
    }
    return;
  }
  let o = 0, l = [], a = null;
  for (let c = 0; ; ) {
    let f, d;
    for (; o < i.length && i[o].to == s; ) {
      let g = i[o++];
      g.widget && (f ? (d || (d = [f])).push(g) : f = g);
    }
    if (f)
      if (d) {
        d.sort(Il);
        for (let g = 0; g < d.length; g++)
          t(d[g], c, !!a);
      } else
        t(f, c, !!a);
    let u, h;
    if (a)
      h = -1, u = a, a = null;
    else if (c < r.childCount)
      h = c, u = r.child(c++);
    else
      break;
    for (let g = 0; g < l.length; g++)
      l[g].to <= s && l.splice(g--, 1);
    for (; o < i.length && i[o].from <= s && i[o].to > s; )
      l.push(i[o++]);
    let p = s + u.nodeSize;
    if (u.isText) {
      let g = p;
      o < i.length && i[o].from < g && (g = i[o].from);
      for (let y = 0; y < l.length; y++)
        l[y].to < g && (g = l[y].to);
      g < p && (a = u.cut(g - s), u = u.cut(0, g - s), p = g, h = -1);
    } else
      for (; o < i.length && i[o].to < p; )
        o++;
    let m = u.isInline && !u.isLeaf ? l.filter((g) => !g.inline) : l.slice();
    n(u, m, e.forChild(s, u), h), s = p;
  }
}
function vl(r) {
  if (r.nodeName == "UL" || r.nodeName == "OL") {
    let e = r.style.cssText;
    r.style.cssText = e + "; list-style: square !important", window.getComputedStyle(r).listStyle, r.style.cssText = e;
  }
}
function Pl(r, e, t, n) {
  for (let i = 0, s = 0; i < r.childCount && s <= n; ) {
    let o = r.child(i++), l = s;
    if (s += o.nodeSize, !o.isText)
      continue;
    let a = o.text;
    for (; i < r.childCount; ) {
      let c = r.child(i++);
      if (s += c.nodeSize, !c.isText)
        break;
      a += c.text;
    }
    if (s >= t) {
      if (s >= n && a.slice(n - e.length - l, n - l) == e)
        return n - e.length;
      let c = l < n ? a.lastIndexOf(e, n - l - 1) : -1;
      if (c >= 0 && c + e.length + l >= t)
        return l + c;
      if (t == n && a.length >= n + e.length - l && a.slice(n - l, n - l + e.length) == e)
        return n;
    }
  }
  return -1;
}
function zn(r, e, t, n, i) {
  let s = [];
  for (let o = 0, l = 0; o < r.length; o++) {
    let a = r[o], c = l, f = l += a.size;
    c >= t || f <= e ? s.push(a) : (c < e && s.push(a.slice(0, e - c, n)), i && (s.push(i), i = void 0), f > t && s.push(a.slice(t - c, a.size, n)));
  }
  return s;
}
function _n(r, e = null) {
  let t = r.domSelectionRange(), n = r.state.doc;
  if (!t.focusNode)
    return null;
  let i = r.docView.nearestDesc(t.focusNode), s = i && i.size == 0, o = r.docView.posFromDOM(t.focusNode, t.focusOffset, 1);
  if (o < 0)
    return null;
  let l = n.resolve(o), a, c;
  if (_t(t)) {
    for (a = o; i && !i.node; )
      i = i.parent;
    let d = i.node;
    if (i && d.isAtom && S.isSelectable(d) && i.parent && !(d.isInline && ol(t.focusNode, t.focusOffset, i.dom))) {
      let u = i.posBefore;
      c = new S(o == u ? l : n.resolve(u));
    }
  } else {
    if (t instanceof r.dom.ownerDocument.defaultView.Selection && t.rangeCount > 1) {
      let d = o, u = o;
      for (let h = 0; h < t.rangeCount; h++) {
        let p = t.getRangeAt(h);
        d = Math.min(d, r.docView.posFromDOM(p.startContainer, p.startOffset, 1)), u = Math.max(u, r.docView.posFromDOM(p.endContainer, p.endOffset, -1));
      }
      if (d < 0)
        return null;
      [a, o] = u == r.state.selection.anchor ? [u, d] : [d, u], l = n.resolve(o);
    } else
      a = r.docView.posFromDOM(t.anchorNode, t.anchorOffset, 1);
    if (a < 0)
      return null;
  }
  let f = n.resolve(a);
  if (!c) {
    let d = e == "pointer" || r.state.selection.head < l.pos && !s ? 1 : -1;
    c = Xn(r, f, l, d);
  }
  return c;
}
function hs(r) {
  return r.editable ? r.hasFocus() : ms(r) && document.activeElement && document.activeElement.contains(r.dom);
}
function ue(r, e = !1) {
  let t = r.state.selection;
  if (ps(r, t), !!hs(r)) {
    if (!e && r.input.mouseDown && r.input.mouseDown.allowDefault && W) {
      let n = r.domSelectionRange(), i = r.domObserver.currentSelection;
      if (n.anchorNode && i.anchorNode && Ve(n.anchorNode, n.anchorOffset, i.anchorNode, i.anchorOffset)) {
        r.input.mouseDown.delayedSelectionSync = !0, r.domObserver.setCurSelection();
        return;
      }
    }
    if (r.domObserver.disconnectSelection(), r.cursorWrapper)
      zl(r);
    else {
      let { anchor: n, head: i } = t, s, o;
      jr && !(t instanceof O) && (t.$from.parent.inlineContent || (s = qr(r, t.from)), !t.empty && !t.$from.parent.inlineContent && (o = qr(r, t.to))), r.docView.setSelection(n, i, r, e), jr && (s && Kr(s), o && Kr(o)), t.visible ? r.dom.classList.remove("ProseMirror-hideselection") : (r.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && Bl(r));
    }
    r.domObserver.setCurSelection(), r.domObserver.connectSelection();
  }
}
const jr = q || W && es < 63;
function qr(r, e) {
  let { node: t, offset: n } = r.docView.domFromPos(e, 0), i = n < t.childNodes.length ? t.childNodes[n] : null, s = n ? t.childNodes[n - 1] : null;
  if (q && i && i.contentEditable == "false")
    return gn(i);
  if ((!i || i.contentEditable == "false") && (!s || s.contentEditable == "false")) {
    if (i)
      return gn(i);
    if (s)
      return gn(s);
  }
}
function gn(r) {
  return r.contentEditable = "true", q && r.draggable && (r.draggable = !1, r.wasDraggable = !0), r;
}
function Kr(r) {
  r.contentEditable = "false", r.wasDraggable && (r.draggable = !0, r.wasDraggable = null);
}
function Bl(r) {
  let e = r.dom.ownerDocument;
  e.removeEventListener("selectionchange", r.input.hideSelectionGuard);
  let t = r.domSelectionRange(), n = t.anchorNode, i = t.anchorOffset;
  e.addEventListener("selectionchange", r.input.hideSelectionGuard = () => {
    (t.anchorNode != n || t.anchorOffset != i) && (e.removeEventListener("selectionchange", r.input.hideSelectionGuard), setTimeout(() => {
      (!hs(r) || r.state.selection.visible) && r.dom.classList.remove("ProseMirror-hideselection");
    }, 20));
  });
}
function zl(r) {
  let e = r.domSelection(), t = document.createRange();
  if (!e)
    return;
  let n = r.cursorWrapper.dom, i = n.nodeName == "IMG";
  i ? t.setStart(n.parentNode, V(n) + 1) : t.setStart(n, 0), t.collapse(!0), e.removeAllRanges(), e.addRange(t), !i && !r.state.selection.visible && G && Ce <= 11 && (n.disabled = !0, n.disabled = !1);
}
function ps(r, e) {
  if (e instanceof S) {
    let t = r.docView.descAt(e.from);
    t != r.lastSelectedViewDesc && (Hr(r), t && t.selectNode(), r.lastSelectedViewDesc = t);
  } else
    Hr(r);
}
function Hr(r) {
  r.lastSelectedViewDesc && (r.lastSelectedViewDesc.parent && r.lastSelectedViewDesc.deselectNode(), r.lastSelectedViewDesc = void 0);
}
function Xn(r, e, t, n) {
  return r.someProp("createSelectionBetween", (i) => i(r, e, t)) || O.between(e, t, n);
}
function Ur(r) {
  return r.editable && !r.hasFocus() ? !1 : ms(r);
}
function ms(r) {
  let e = r.domSelectionRange();
  if (!e.anchorNode)
    return !1;
  try {
    return r.dom.contains(e.anchorNode.nodeType == 3 ? e.anchorNode.parentNode : e.anchorNode) && (r.editable || r.dom.contains(e.focusNode.nodeType == 3 ? e.focusNode.parentNode : e.focusNode));
  } catch {
    return !1;
  }
}
function Fl(r) {
  let e = r.docView.domFromPos(r.state.selection.anchor, 0), t = r.domSelectionRange();
  return Ve(e.node, e.offset, t.anchorNode, t.anchorOffset);
}
function Fn(r, e) {
  let { $anchor: t, $head: n } = r.selection, i = e > 0 ? t.max(n) : t.min(n), s = i.parent.inlineContent ? i.depth ? r.doc.resolve(e > 0 ? i.after() : i.before()) : null : i;
  return s && N.findFrom(s, e);
}
function me(r, e) {
  return r.dispatch(r.state.tr.setSelection(e).scrollIntoView()), !0;
}
function Gr(r, e, t) {
  let n = r.state.selection;
  if (n instanceof O)
    if (t.indexOf("s") > -1) {
      let { $head: i } = n, s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter;
      if (!s || s.isText || !s.isLeaf)
        return !1;
      let o = r.state.doc.resolve(i.pos + s.nodeSize * (e < 0 ? -1 : 1));
      return me(r, new O(n.$anchor, o));
    } else if (n.empty) {
      if (r.endOfTextblock(e > 0 ? "forward" : "backward")) {
        let i = Fn(r.state, e);
        return i && i instanceof S ? me(r, i) : !1;
      } else if (!(X && t.indexOf("m") > -1)) {
        let i = n.$head, s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter, o;
        if (!s || s.isText)
          return !1;
        let l = e < 0 ? i.pos - s.nodeSize : i.pos;
        return s.isAtom || (o = r.docView.descAt(l)) && !o.contentDOM ? S.isSelectable(s) ? me(r, new S(e < 0 ? r.state.doc.resolve(i.pos - s.nodeSize) : i)) : xt ? me(r, new O(r.state.doc.resolve(e < 0 ? l : l + s.nodeSize))) : !1 : !1;
      }
    } else return !1;
  else {
    if (n instanceof S && n.node.isInline)
      return me(r, new O(e > 0 ? n.$to : n.$from));
    {
      let i = Fn(r.state, e);
      return i ? me(r, i) : !1;
    }
  }
}
function Lt(r) {
  return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function ct(r, e) {
  let t = r.pmViewDesc;
  return t && t.size == 0 && (e < 0 || r.nextSibling || r.nodeName != "BR");
}
function je(r, e) {
  return e < 0 ? Vl(r) : Ll(r);
}
function Vl(r) {
  let e = r.domSelectionRange(), t = e.focusNode, n = e.focusOffset;
  if (!t)
    return;
  let i, s, o = !1;
  for (te && t.nodeType == 1 && n < Lt(t) && ct(t.childNodes[n], -1) && (o = !0); ; )
    if (n > 0) {
      if (t.nodeType != 1)
        break;
      {
        let l = t.childNodes[n - 1];
        if (ct(l, -1))
          i = t, s = --n;
        else if (l.nodeType == 3)
          t = l, n = t.nodeValue.length;
        else
          break;
      }
    } else {
      if (gs(t))
        break;
      {
        let l = t.previousSibling;
        for (; l && ct(l, -1); )
          i = t.parentNode, s = V(l), l = l.previousSibling;
        if (l)
          t = l, n = Lt(t);
        else {
          if (t = t.parentNode, t == r.dom)
            break;
          n = 0;
        }
      }
    }
  o ? Vn(r, t, n) : i && Vn(r, i, s);
}
function Ll(r) {
  let e = r.domSelectionRange(), t = e.focusNode, n = e.focusOffset;
  if (!t)
    return;
  let i = Lt(t), s, o;
  for (; ; )
    if (n < i) {
      if (t.nodeType != 1)
        break;
      let l = t.childNodes[n];
      if (ct(l, 1))
        s = t, o = ++n;
      else
        break;
    } else {
      if (gs(t))
        break;
      {
        let l = t.nextSibling;
        for (; l && ct(l, 1); )
          s = l.parentNode, o = V(l) + 1, l = l.nextSibling;
        if (l)
          t = l, n = 0, i = Lt(t);
        else {
          if (t = t.parentNode, t == r.dom)
            break;
          n = i = 0;
        }
      }
    }
  s && Vn(r, s, o);
}
function gs(r) {
  let e = r.pmViewDesc;
  return e && e.node && e.node.isBlock;
}
function $l(r, e) {
  for (; r && e == r.childNodes.length && !kt(r); )
    e = V(r) + 1, r = r.parentNode;
  for (; r && e < r.childNodes.length; ) {
    let t = r.childNodes[e];
    if (t.nodeType == 3)
      return t;
    if (t.nodeType == 1 && t.contentEditable == "false")
      break;
    r = t, e = 0;
  }
}
function Wl(r, e) {
  for (; r && !e && !kt(r); )
    e = V(r), r = r.parentNode;
  for (; r && e; ) {
    let t = r.childNodes[e - 1];
    if (t.nodeType == 3)
      return t;
    if (t.nodeType == 1 && t.contentEditable == "false")
      break;
    r = t, e = r.childNodes.length;
  }
}
function Vn(r, e, t) {
  if (e.nodeType != 3) {
    let s, o;
    (o = $l(e, t)) ? (e = o, t = 0) : (s = Wl(e, t)) && (e = s, t = s.nodeValue.length);
  }
  let n = r.domSelection();
  if (!n)
    return;
  if (_t(n)) {
    let s = document.createRange();
    s.setEnd(e, t), s.setStart(e, t), n.removeAllRanges(), n.addRange(s);
  } else n.extend && n.extend(e, t);
  r.domObserver.setCurSelection();
  let { state: i } = r;
  setTimeout(() => {
    r.state == i && ue(r);
  }, 50);
}
function Yr(r, e) {
  let t = r.state.doc.resolve(e);
  if (!(W || cl) && t.parent.inlineContent) {
    let i = r.coordsAtPos(e);
    if (e > t.start()) {
      let s = r.coordsAtPos(e - 1), o = (s.top + s.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1)
        return s.left < i.left ? "ltr" : "rtl";
    }
    if (e < t.end()) {
      let s = r.coordsAtPos(e + 1), o = (s.top + s.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1)
        return s.left > i.left ? "ltr" : "rtl";
    }
  }
  return getComputedStyle(r.dom).direction == "rtl" ? "rtl" : "ltr";
}
function _r(r, e, t) {
  let n = r.state.selection;
  if (n instanceof O && !n.empty || t.indexOf("s") > -1 || X && t.indexOf("m") > -1)
    return !1;
  let { $from: i, $to: s } = n;
  if (!i.parent.inlineContent || r.endOfTextblock(e < 0 ? "up" : "down")) {
    let o = Fn(r.state, e);
    if (o && o instanceof S)
      return me(r, o);
  }
  if (!i.parent.inlineContent) {
    let o = e < 0 ? i : s, l = n instanceof _ ? N.near(o, e) : N.findFrom(o, e);
    return l ? me(r, l) : !1;
  }
  return !1;
}
function Xr(r, e) {
  if (!(r.state.selection instanceof O))
    return !0;
  let { $head: t, $anchor: n, empty: i } = r.state.selection;
  if (!t.sameParent(n))
    return !0;
  if (!i)
    return !1;
  if (r.endOfTextblock(e > 0 ? "forward" : "backward"))
    return !0;
  let s = !t.textOffset && (e < 0 ? t.nodeBefore : t.nodeAfter);
  if (s && !s.isText) {
    let o = r.state.tr;
    return e < 0 ? o.delete(t.pos - s.nodeSize, t.pos) : o.delete(t.pos, t.pos + s.nodeSize), r.dispatch(o), !0;
  }
  return !1;
}
function Qr(r, e, t) {
  r.domObserver.stop(), e.contentEditable = t, r.domObserver.start();
}
function Jl(r) {
  if (!q || r.state.selection.$head.parentOffset > 0)
    return !1;
  let { focusNode: e, focusOffset: t } = r.domSelectionRange();
  if (e && e.nodeType == 1 && t == 0 && e.firstChild && e.firstChild.contentEditable == "false") {
    let n = e.firstChild;
    Qr(r, n, "true"), setTimeout(() => Qr(r, n, "false"), 20);
  }
  return !1;
}
function jl(r) {
  let e = "";
  return r.ctrlKey && (e += "c"), r.metaKey && (e += "m"), r.altKey && (e += "a"), r.shiftKey && (e += "s"), e;
}
function ql(r, e) {
  let t = e.keyCode, n = jl(e);
  if (t == 8 || X && t == 72 && n == "c")
    return Xr(r, -1) || je(r, -1);
  if (t == 46 && !e.shiftKey || X && t == 68 && n == "c")
    return Xr(r, 1) || je(r, 1);
  if (t == 13 || t == 27)
    return !0;
  if (t == 37 || X && t == 66 && n == "c") {
    let i = t == 37 ? Yr(r, r.state.selection.from) == "ltr" ? -1 : 1 : -1;
    return Gr(r, i, n) || je(r, i);
  } else if (t == 39 || X && t == 70 && n == "c") {
    let i = t == 39 ? Yr(r, r.state.selection.from) == "ltr" ? 1 : -1 : 1;
    return Gr(r, i, n) || je(r, i);
  } else {
    if (t == 38 || X && t == 80 && n == "c")
      return _r(r, -1, n) || je(r, -1);
    if (t == 40 || X && t == 78 && n == "c")
      return Jl(r) || _r(r, 1, n) || je(r, 1);
    if (n == (X ? "m" : "c") && (t == 66 || t == 73 || t == 89 || t == 90))
      return !0;
  }
  return !1;
}
function Qn(r, e) {
  r.someProp("transformCopied", (h) => {
    e = h(e, r);
  });
  let t = [], { content: n, openStart: i, openEnd: s } = e;
  for (; i > 1 && s > 1 && n.childCount == 1 && n.firstChild.childCount == 1; ) {
    i--, s--;
    let h = n.firstChild;
    t.push(h.type.name, h.attrs != h.type.defaultAttrs ? h.attrs : null), n = h.content;
  }
  let o = r.someProp("clipboardSerializer") || $e.fromSchema(r.state.schema), l = Cs(), a = l.createElement("div");
  a.appendChild(o.serializeFragment(n, { document: l }));
  let c = a.firstChild, f, d = 0;
  for (; c && c.nodeType == 1 && (f = Ss[c.nodeName.toLowerCase()]); ) {
    for (let h = f.length - 1; h >= 0; h--) {
      let p = l.createElement(f[h]);
      for (; a.firstChild; )
        p.appendChild(a.firstChild);
      a.appendChild(p), d++;
    }
    c = a.firstChild;
  }
  c && c.nodeType == 1 && c.setAttribute("data-pm-slice", `${i} ${s}${d ? ` -${d}` : ""} ${JSON.stringify(t)}`);
  let u = r.someProp("clipboardTextSerializer", (h) => h(e, r)) || e.content.textBetween(0, e.content.size, `

`);
  return { dom: a, text: u, slice: e };
}
function ys(r, e, t, n, i) {
  let s = i.parent.type.spec.code, o, l;
  if (!t && !e)
    return null;
  let a = e && (n || s || !t);
  if (a) {
    if (r.someProp("transformPastedText", (u) => {
      e = u(e, s || n, r);
    }), s)
      return e ? new k(b.from(r.state.schema.text(e.replace(/\r\n?/g, `
`))), 0, 0) : k.empty;
    let d = r.someProp("clipboardTextParser", (u) => u(e, i, n, r));
    if (d)
      l = d;
    else {
      let u = i.marks(), { schema: h } = r.state, p = $e.fromSchema(h);
      o = document.createElement("div"), e.split(/(?:\r\n?|\n)+/).forEach((m) => {
        let g = o.appendChild(document.createElement("p"));
        m && g.appendChild(p.serializeNode(h.text(m, u)));
      });
    }
  } else
    r.someProp("transformPastedHTML", (d) => {
      t = d(t, r);
    }), o = Gl(t), xt && Yl(o);
  let c = o && o.querySelector("[data-pm-slice]"), f = c && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(c.getAttribute("data-pm-slice") || "");
  if (f && f[3])
    for (let d = +f[3]; d > 0; d--) {
      let u = o.firstChild;
      for (; u && u.nodeType != 1; )
        u = u.nextSibling;
      if (!u)
        break;
      o = u;
    }
  if (l || (l = (r.someProp("clipboardParser") || r.someProp("domParser") || Se.fromSchema(r.state.schema)).parseSlice(o, {
    preserveWhitespace: !!(a || f),
    context: i,
    ruleFromNode(u) {
      return u.nodeName == "BR" && !u.nextSibling && u.parentNode && !Kl.test(u.parentNode.nodeName) ? { ignore: !0 } : null;
    }
  })), f)
    l = _l(Zr(l, +f[1], +f[2]), f[4]);
  else if (l = k.maxOpen(Hl(l.content, i), !0), l.openStart || l.openEnd) {
    let d = 0, u = 0;
    for (let h = l.content.firstChild; d < l.openStart && !h.type.spec.isolating; d++, h = h.firstChild)
      ;
    for (let h = l.content.lastChild; u < l.openEnd && !h.type.spec.isolating; u++, h = h.lastChild)
      ;
    l = Zr(l, d, u);
  }
  return r.someProp("transformPasted", (d) => {
    l = d(l, r);
  }), l;
}
const Kl = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function Hl(r, e) {
  if (r.childCount < 2)
    return r;
  for (let t = e.depth; t >= 0; t--) {
    let i = e.node(t).contentMatchAt(e.index(t)), s, o = [];
    if (r.forEach((l) => {
      if (!o)
        return;
      let a = i.findWrapping(l.type), c;
      if (!a)
        return o = null;
      if (c = o.length && s.length && ks(a, s, l, o[o.length - 1], 0))
        o[o.length - 1] = c;
      else {
        o.length && (o[o.length - 1] = xs(o[o.length - 1], s.length));
        let f = bs(l, a);
        o.push(f), i = i.matchType(f.type), s = a;
      }
    }), o)
      return b.from(o);
  }
  return r;
}
function bs(r, e, t = 0) {
  for (let n = e.length - 1; n >= t; n--)
    r = e[n].create(null, b.from(r));
  return r;
}
function ks(r, e, t, n, i) {
  if (i < r.length && i < e.length && r[i] == e[i]) {
    let s = ks(r, e, t, n.lastChild, i + 1);
    if (s)
      return n.copy(n.content.replaceChild(n.childCount - 1, s));
    if (n.contentMatchAt(n.childCount).matchType(i == r.length - 1 ? t.type : r[i + 1]))
      return n.copy(n.content.append(b.from(bs(t, r, i + 1))));
  }
}
function xs(r, e) {
  if (e == 0)
    return r;
  let t = r.content.replaceChild(r.childCount - 1, xs(r.lastChild, e - 1)), n = r.contentMatchAt(r.childCount).fillBefore(b.empty, !0);
  return r.copy(t.append(n));
}
function Ln(r, e, t, n, i, s) {
  let o = e < 0 ? r.firstChild : r.lastChild, l = o.content;
  return r.childCount > 1 && (s = 0), i < n - 1 && (l = Ln(l, e, t, n, i + 1, s)), i >= t && (l = e < 0 ? o.contentMatchAt(0).fillBefore(l, s <= i).append(l) : l.append(o.contentMatchAt(o.childCount).fillBefore(b.empty, !0))), r.replaceChild(e < 0 ? 0 : r.childCount - 1, o.copy(l));
}
function Zr(r, e, t) {
  return e < r.openStart && (r = new k(Ln(r.content, -1, e, r.openStart, 0, r.openEnd), e, r.openEnd)), t < r.openEnd && (r = new k(Ln(r.content, 1, t, r.openEnd, 0, 0), r.openStart, t)), r;
}
const Ss = {
  thead: ["table"],
  tbody: ["table"],
  tfoot: ["table"],
  caption: ["table"],
  colgroup: ["table"],
  col: ["table", "colgroup"],
  tr: ["table", "tbody"],
  td: ["table", "tbody", "tr"],
  th: ["table", "tbody", "tr"]
};
let ei = null;
function Cs() {
  return ei || (ei = document.implementation.createHTMLDocument("title"));
}
let yn = null;
function Ul(r) {
  let e = window.trustedTypes;
  return e ? (yn || (yn = e.createPolicy("ProseMirrorClipboard", { createHTML: (t) => t })), yn.createHTML(r)) : r;
}
function Gl(r) {
  let e = /^(\s*<meta [^>]*>)*/.exec(r);
  e && (r = r.slice(e[0].length));
  let t = Cs().createElement("div"), n = /<([a-z][^>\s]+)/i.exec(r), i;
  if ((i = n && Ss[n[1].toLowerCase()]) && (r = i.map((s) => "<" + s + ">").join("") + r + i.map((s) => "</" + s + ">").reverse().join("")), t.innerHTML = Ul(r), i)
    for (let s = 0; s < i.length; s++)
      t = t.querySelector(i[s]) || t;
  return t;
}
function Yl(r) {
  let e = r.querySelectorAll(W ? "span:not([class]):not([style])" : "span.Apple-converted-space");
  for (let t = 0; t < e.length; t++) {
    let n = e[t];
    n.childNodes.length == 1 && n.textContent == " " && n.parentNode && n.parentNode.replaceChild(r.ownerDocument.createTextNode(" "), n);
  }
}
function _l(r, e) {
  if (!r.size)
    return r;
  let t = r.content.firstChild.type.schema, n;
  try {
    n = JSON.parse(e);
  } catch {
    return r;
  }
  let { content: i, openStart: s, openEnd: o } = r;
  for (let l = n.length - 2; l >= 0; l -= 2) {
    let a = t.nodes[n[l]];
    if (!a || a.hasRequiredAttrs())
      break;
    i = b.from(a.create(n[l + 1], i)), s++, o++;
  }
  return new k(i, s, o);
}
const K = {}, H = {}, Xl = { touchstart: !0, touchmove: !0 };
class Ql {
  constructor() {
    this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = { time: 0, x: 0, y: 0, type: "" }, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = /* @__PURE__ */ Object.create(null), this.hideSelectionGuard = null;
  }
}
function Zl(r) {
  for (let e in K) {
    let t = K[e];
    r.dom.addEventListener(e, r.input.eventHandlers[e] = (n) => {
      ta(r, n) && !Zn(r, n) && (r.editable || !(n.type in H)) && t(r, n);
    }, Xl[e] ? { passive: !0 } : void 0);
  }
  q && r.dom.addEventListener("input", () => null), $n(r);
}
function ke(r, e) {
  r.input.lastSelectionOrigin = e, r.input.lastSelectionTime = Date.now();
}
function ea(r) {
  r.domObserver.stop();
  for (let e in r.input.eventHandlers)
    r.dom.removeEventListener(e, r.input.eventHandlers[e]);
  clearTimeout(r.input.composingTimeout), clearTimeout(r.input.lastIOSEnterFallbackTimeout);
}
function $n(r) {
  r.someProp("handleDOMEvents", (e) => {
    for (let t in e)
      r.input.eventHandlers[t] || r.dom.addEventListener(t, r.input.eventHandlers[t] = (n) => Zn(r, n));
  });
}
function Zn(r, e) {
  return r.someProp("handleDOMEvents", (t) => {
    let n = t[e.type];
    return n ? n(r, e) || e.defaultPrevented : !1;
  });
}
function ta(r, e) {
  if (!e.bubbles)
    return !0;
  if (e.defaultPrevented)
    return !1;
  for (let t = e.target; t != r.dom; t = t.parentNode)
    if (!t || t.nodeType == 11 || t.pmViewDesc && t.pmViewDesc.stopEvent(e))
      return !1;
  return !0;
}
function na(r, e) {
  !Zn(r, e) && K[e.type] && (r.editable || !(e.type in H)) && K[e.type](r, e);
}
H.keydown = (r, e) => {
  let t = e;
  if (r.input.shiftKey = t.keyCode == 16 || t.shiftKey, !ws(r, t) && (r.input.lastKeyCode = t.keyCode, r.input.lastKeyCodeTime = Date.now(), !(ce && W && t.keyCode == 13)))
    if (t.keyCode != 229 && r.domObserver.forceFlush(), Qe && t.keyCode == 13 && !t.ctrlKey && !t.altKey && !t.metaKey) {
      let n = Date.now();
      r.input.lastIOSEnter = n, r.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        r.input.lastIOSEnter == n && (r.someProp("handleKeyDown", (i) => i(r, De(13, "Enter"))), r.input.lastIOSEnter = 0);
      }, 200);
    } else r.someProp("handleKeyDown", (n) => n(r, t)) || ql(r, t) ? t.preventDefault() : ke(r, "key");
};
H.keyup = (r, e) => {
  e.keyCode == 16 && (r.input.shiftKey = !1);
};
H.keypress = (r, e) => {
  let t = e;
  if (ws(r, t) || !t.charCode || t.ctrlKey && !t.altKey || X && t.metaKey)
    return;
  if (r.someProp("handleKeyPress", (i) => i(r, t))) {
    t.preventDefault();
    return;
  }
  let n = r.state.selection;
  if (!(n instanceof O) || !n.$from.sameParent(n.$to)) {
    let i = String.fromCharCode(t.charCode);
    !/[\r\n]/.test(i) && !r.someProp("handleTextInput", (s) => s(r, n.$from.pos, n.$to.pos, i)) && r.dispatch(r.state.tr.insertText(i).scrollIntoView()), t.preventDefault();
  }
};
function Qt(r) {
  return { left: r.clientX, top: r.clientY };
}
function ra(r, e) {
  let t = e.x - r.clientX, n = e.y - r.clientY;
  return t * t + n * n < 100;
}
function er(r, e, t, n, i) {
  if (n == -1)
    return !1;
  let s = r.state.doc.resolve(n);
  for (let o = s.depth + 1; o > 0; o--)
    if (r.someProp(e, (l) => o > s.depth ? l(r, t, s.nodeAfter, s.before(o), i, !0) : l(r, t, s.node(o), s.before(o), i, !1)))
      return !0;
  return !1;
}
function Ye(r, e, t) {
  if (r.focused || r.focus(), r.state.selection.eq(e))
    return;
  let n = r.state.tr.setSelection(e);
  n.setMeta("pointer", !0), r.dispatch(n);
}
function ia(r, e) {
  if (e == -1)
    return !1;
  let t = r.state.doc.resolve(e), n = t.nodeAfter;
  return n && n.isAtom && S.isSelectable(n) ? (Ye(r, new S(t)), !0) : !1;
}
function sa(r, e) {
  if (e == -1)
    return !1;
  let t = r.state.selection, n, i;
  t instanceof S && (n = t.node);
  let s = r.state.doc.resolve(e);
  for (let o = s.depth + 1; o > 0; o--) {
    let l = o > s.depth ? s.nodeAfter : s.node(o);
    if (S.isSelectable(l)) {
      n && t.$from.depth > 0 && o >= t.$from.depth && s.before(t.$from.depth + 1) == t.$from.pos ? i = s.before(t.$from.depth) : i = s.before(o);
      break;
    }
  }
  return i != null ? (Ye(r, S.create(r.state.doc, i)), !0) : !1;
}
function oa(r, e, t, n, i) {
  return er(r, "handleClickOn", e, t, n) || r.someProp("handleClick", (s) => s(r, e, n)) || (i ? sa(r, t) : ia(r, t));
}
function la(r, e, t, n) {
  return er(r, "handleDoubleClickOn", e, t, n) || r.someProp("handleDoubleClick", (i) => i(r, e, n));
}
function aa(r, e, t, n) {
  return er(r, "handleTripleClickOn", e, t, n) || r.someProp("handleTripleClick", (i) => i(r, e, n)) || ca(r, t, n);
}
function ca(r, e, t) {
  if (t.button != 0)
    return !1;
  let n = r.state.doc;
  if (e == -1)
    return n.inlineContent ? (Ye(r, O.create(n, 0, n.content.size)), !0) : !1;
  let i = n.resolve(e);
  for (let s = i.depth + 1; s > 0; s--) {
    let o = s > i.depth ? i.nodeAfter : i.node(s), l = i.before(s);
    if (o.inlineContent)
      Ye(r, O.create(n, l + 1, l + 1 + o.content.size));
    else if (S.isSelectable(o))
      Ye(r, S.create(n, l));
    else
      continue;
    return !0;
  }
}
function tr(r) {
  return $t(r);
}
const Ms = X ? "metaKey" : "ctrlKey";
K.mousedown = (r, e) => {
  let t = e;
  r.input.shiftKey = t.shiftKey;
  let n = tr(r), i = Date.now(), s = "singleClick";
  i - r.input.lastClick.time < 500 && ra(t, r.input.lastClick) && !t[Ms] && (r.input.lastClick.type == "singleClick" ? s = "doubleClick" : r.input.lastClick.type == "doubleClick" && (s = "tripleClick")), r.input.lastClick = { time: i, x: t.clientX, y: t.clientY, type: s };
  let o = r.posAtCoords(Qt(t));
  o && (s == "singleClick" ? (r.input.mouseDown && r.input.mouseDown.done(), r.input.mouseDown = new fa(r, o, t, !!n)) : (s == "doubleClick" ? la : aa)(r, o.pos, o.inside, t) ? t.preventDefault() : ke(r, "pointer"));
};
class fa {
  constructor(e, t, n, i) {
    this.view = e, this.pos = t, this.event = n, this.flushed = i, this.delayedSelectionSync = !1, this.mightDrag = null, this.startDoc = e.state.doc, this.selectNode = !!n[Ms], this.allowDefault = n.shiftKey;
    let s, o;
    if (t.inside > -1)
      s = e.state.doc.nodeAt(t.inside), o = t.inside;
    else {
      let f = e.state.doc.resolve(t.pos);
      s = f.parent, o = f.depth ? f.before() : 0;
    }
    const l = i ? null : n.target, a = l ? e.docView.nearestDesc(l, !0) : null;
    this.target = a && a.dom.nodeType == 1 ? a.dom : null;
    let { selection: c } = e.state;
    (n.button == 0 && s.type.spec.draggable && s.type.spec.selectable !== !1 || c instanceof S && c.from <= o && c.to > o) && (this.mightDrag = {
      node: s,
      pos: o,
      addAttr: !!(this.target && !this.target.draggable),
      setUneditable: !!(this.target && te && !this.target.hasAttribute("contentEditable"))
    }), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
      this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
    }, 20), this.view.domObserver.start()), e.root.addEventListener("mouseup", this.up = this.up.bind(this)), e.root.addEventListener("mousemove", this.move = this.move.bind(this)), ke(e, "pointer");
  }
  done() {
    this.view.root.removeEventListener("mouseup", this.up), this.view.root.removeEventListener("mousemove", this.move), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => ue(this.view)), this.view.input.mouseDown = null;
  }
  up(e) {
    if (this.done(), !this.view.dom.contains(e.target))
      return;
    let t = this.pos;
    this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(Qt(e))), this.updateAllowDefault(e), this.allowDefault || !t ? ke(this.view, "pointer") : oa(this.view, t.pos, t.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || // Safari ignores clicks on draggable elements
    q && this.mightDrag && !this.mightDrag.node.isAtom || // Chrome will sometimes treat a node selection as a
    // cursor, but still report that the node is selected
    // when asked through getSelection. You'll then get a
    // situation where clicking at the point where that
    // (hidden) cursor is doesn't change the selection, and
    // thus doesn't get a reaction from ProseMirror. This
    // works around that.
    W && !this.view.state.selection.visible && Math.min(Math.abs(t.pos - this.view.state.selection.from), Math.abs(t.pos - this.view.state.selection.to)) <= 2) ? (Ye(this.view, N.near(this.view.state.doc.resolve(t.pos))), e.preventDefault()) : ke(this.view, "pointer");
  }
  move(e) {
    this.updateAllowDefault(e), ke(this.view, "pointer"), e.buttons == 0 && this.done();
  }
  updateAllowDefault(e) {
    !this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0);
  }
}
K.touchstart = (r) => {
  r.input.lastTouch = Date.now(), tr(r), ke(r, "pointer");
};
K.touchmove = (r) => {
  r.input.lastTouch = Date.now(), ke(r, "pointer");
};
K.contextmenu = (r) => tr(r);
function ws(r, e) {
  return r.composing ? !0 : q && Math.abs(e.timeStamp - r.input.compositionEndedAt) < 500 ? (r.input.compositionEndedAt = -2e8, !0) : !1;
}
const da = ce ? 5e3 : -1;
H.compositionstart = H.compositionupdate = (r) => {
  if (!r.composing) {
    r.domObserver.flush();
    let { state: e } = r, t = e.selection.$to;
    if (e.selection instanceof O && (e.storedMarks || !t.textOffset && t.parentOffset && t.nodeBefore.marks.some((n) => n.type.spec.inclusive === !1)))
      r.markCursor = r.state.storedMarks || t.marks(), $t(r, !0), r.markCursor = null;
    else if ($t(r, !e.selection.empty), te && e.selection.empty && t.parentOffset && !t.textOffset && t.nodeBefore.marks.length) {
      let n = r.domSelectionRange();
      for (let i = n.focusNode, s = n.focusOffset; i && i.nodeType == 1 && s != 0; ) {
        let o = s < 0 ? i.lastChild : i.childNodes[s - 1];
        if (!o)
          break;
        if (o.nodeType == 3) {
          let l = r.domSelection();
          l && l.collapse(o, o.nodeValue.length);
          break;
        } else
          i = o, s = -1;
      }
    }
    r.input.composing = !0;
  }
  Os(r, da);
};
H.compositionend = (r, e) => {
  r.composing && (r.input.composing = !1, r.input.compositionEndedAt = e.timeStamp, r.input.compositionPendingChanges = r.domObserver.pendingRecords().length ? r.input.compositionID : 0, r.input.compositionNode = null, r.input.compositionPendingChanges && Promise.resolve().then(() => r.domObserver.flush()), r.input.compositionID++, Os(r, 20));
};
function Os(r, e) {
  clearTimeout(r.input.composingTimeout), e > -1 && (r.input.composingTimeout = setTimeout(() => $t(r), e));
}
function Ns(r) {
  for (r.composing && (r.input.composing = !1, r.input.compositionEndedAt = ha()); r.input.compositionNodes.length > 0; )
    r.input.compositionNodes.pop().markParentsDirty();
}
function ua(r) {
  let e = r.domSelectionRange();
  if (!e.focusNode)
    return null;
  let t = il(e.focusNode, e.focusOffset), n = sl(e.focusNode, e.focusOffset);
  if (t && n && t != n) {
    let i = n.pmViewDesc, s = r.domObserver.lastChangedTextNode;
    if (t == s || n == s)
      return s;
    if (!i || !i.isText(n.nodeValue))
      return n;
    if (r.input.compositionNode == n) {
      let o = t.pmViewDesc;
      if (!(!o || !o.isText(t.nodeValue)))
        return n;
    }
  }
  return t || n;
}
function ha() {
  let r = document.createEvent("Event");
  return r.initEvent("event", !0, !0), r.timeStamp;
}
function $t(r, e = !1) {
  if (!(ce && r.domObserver.flushingSoon >= 0)) {
    if (r.domObserver.forceFlush(), Ns(r), e || r.docView && r.docView.dirty) {
      let t = _n(r);
      return t && !t.eq(r.state.selection) ? r.dispatch(r.state.tr.setSelection(t)) : (r.markCursor || e) && !r.state.selection.empty ? r.dispatch(r.state.tr.deleteSelection()) : r.updateState(r.state), !0;
    }
    return !1;
  }
}
function pa(r, e) {
  if (!r.dom.parentNode)
    return;
  let t = r.dom.parentNode.appendChild(document.createElement("div"));
  t.appendChild(e), t.style.cssText = "position: fixed; left: -10000px; top: 10px";
  let n = getSelection(), i = document.createRange();
  i.selectNodeContents(e), r.dom.blur(), n.removeAllRanges(), n.addRange(i), setTimeout(() => {
    t.parentNode && t.parentNode.removeChild(t), r.focus();
  }, 50);
}
const pt = G && Ce < 15 || Qe && fl < 604;
K.copy = H.cut = (r, e) => {
  let t = e, n = r.state.selection, i = t.type == "cut";
  if (n.empty)
    return;
  let s = pt ? null : t.clipboardData, o = n.content(), { dom: l, text: a } = Qn(r, o);
  s ? (t.preventDefault(), s.clearData(), s.setData("text/html", l.innerHTML), s.setData("text/plain", a)) : pa(r, l), i && r.dispatch(r.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function ma(r) {
  return r.openStart == 0 && r.openEnd == 0 && r.content.childCount == 1 ? r.content.firstChild : null;
}
function ga(r, e) {
  if (!r.dom.parentNode)
    return;
  let t = r.input.shiftKey || r.state.selection.$from.parent.type.spec.code, n = r.dom.parentNode.appendChild(document.createElement(t ? "textarea" : "div"));
  t || (n.contentEditable = "true"), n.style.cssText = "position: fixed; left: -10000px; top: 10px", n.focus();
  let i = r.input.shiftKey && r.input.lastKeyCode != 45;
  setTimeout(() => {
    r.focus(), n.parentNode && n.parentNode.removeChild(n), t ? mt(r, n.value, null, i, e) : mt(r, n.textContent, n.innerHTML, i, e);
  }, 50);
}
function mt(r, e, t, n, i) {
  let s = ys(r, e, t, n, r.state.selection.$from);
  if (r.someProp("handlePaste", (a) => a(r, i, s || k.empty)))
    return !0;
  if (!s)
    return !1;
  let o = ma(s), l = o ? r.state.tr.replaceSelectionWith(o, n) : r.state.tr.replaceSelection(s);
  return r.dispatch(l.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function Ts(r) {
  let e = r.getData("text/plain") || r.getData("Text");
  if (e)
    return e;
  let t = r.getData("text/uri-list");
  return t ? t.replace(/\r?\n/g, " ") : "";
}
H.paste = (r, e) => {
  let t = e;
  if (r.composing && !ce)
    return;
  let n = pt ? null : t.clipboardData, i = r.input.shiftKey && r.input.lastKeyCode != 45;
  n && mt(r, Ts(n), n.getData("text/html"), i, t) ? t.preventDefault() : ga(r, t);
};
class Es {
  constructor(e, t, n) {
    this.slice = e, this.move = t, this.node = n;
  }
}
const Ds = X ? "altKey" : "ctrlKey";
K.dragstart = (r, e) => {
  let t = e, n = r.input.mouseDown;
  if (n && n.done(), !t.dataTransfer)
    return;
  let i = r.state.selection, s = i.empty ? null : r.posAtCoords(Qt(t)), o;
  if (!(s && s.pos >= i.from && s.pos <= (i instanceof S ? i.to - 1 : i.to))) {
    if (n && n.mightDrag)
      o = S.create(r.state.doc, n.mightDrag.pos);
    else if (t.target && t.target.nodeType == 1) {
      let d = r.docView.nearestDesc(t.target, !0);
      d && d.node.type.spec.draggable && d != r.docView && (o = S.create(r.state.doc, d.posBefore));
    }
  }
  let l = (o || r.state.selection).content(), { dom: a, text: c, slice: f } = Qn(r, l);
  (!t.dataTransfer.files.length || !W || es > 120) && t.dataTransfer.clearData(), t.dataTransfer.setData(pt ? "Text" : "text/html", a.innerHTML), t.dataTransfer.effectAllowed = "copyMove", pt || t.dataTransfer.setData("text/plain", c), r.dragging = new Es(f, !t[Ds], o);
};
K.dragend = (r) => {
  let e = r.dragging;
  window.setTimeout(() => {
    r.dragging == e && (r.dragging = null);
  }, 50);
};
H.dragover = H.dragenter = (r, e) => e.preventDefault();
H.drop = (r, e) => {
  let t = e, n = r.dragging;
  if (r.dragging = null, !t.dataTransfer)
    return;
  let i = r.posAtCoords(Qt(t));
  if (!i)
    return;
  let s = r.state.doc.resolve(i.pos), o = n && n.slice;
  o ? r.someProp("transformPasted", (p) => {
    o = p(o, r);
  }) : o = ys(r, Ts(t.dataTransfer), pt ? null : t.dataTransfer.getData("text/html"), !1, s);
  let l = !!(n && !t[Ds]);
  if (r.someProp("handleDrop", (p) => p(r, t, o || k.empty, l))) {
    t.preventDefault();
    return;
  }
  if (!o)
    return;
  t.preventDefault();
  let a = o ? Ko(r.state.doc, s.pos, o) : s.pos;
  a == null && (a = s.pos);
  let c = r.state.tr;
  if (l) {
    let { node: p } = n;
    p ? p.replace(c) : c.deleteSelection();
  }
  let f = c.mapping.map(a), d = o.openStart == 0 && o.openEnd == 0 && o.content.childCount == 1, u = c.doc;
  if (d ? c.replaceRangeWith(f, f, o.content.firstChild) : c.replaceRange(f, f, o), c.doc.eq(u))
    return;
  let h = c.doc.resolve(f);
  if (d && S.isSelectable(o.content.firstChild) && h.nodeAfter && h.nodeAfter.sameMarkup(o.content.firstChild))
    c.setSelection(new S(h));
  else {
    let p = c.mapping.map(a);
    c.mapping.maps[c.mapping.maps.length - 1].forEach((m, g, y, C) => p = C), c.setSelection(Xn(r, h, c.doc.resolve(p)));
  }
  r.focus(), r.dispatch(c.setMeta("uiEvent", "drop"));
};
K.focus = (r) => {
  r.input.lastFocus = Date.now(), r.focused || (r.domObserver.stop(), r.dom.classList.add("ProseMirror-focused"), r.domObserver.start(), r.focused = !0, setTimeout(() => {
    r.docView && r.hasFocus() && !r.domObserver.currentSelection.eq(r.domSelectionRange()) && ue(r);
  }, 20));
};
K.blur = (r, e) => {
  let t = e;
  r.focused && (r.domObserver.stop(), r.dom.classList.remove("ProseMirror-focused"), r.domObserver.start(), t.relatedTarget && r.dom.contains(t.relatedTarget) && r.domObserver.currentSelection.clear(), r.focused = !1);
};
K.beforeinput = (r, e) => {
  if (W && ce && e.inputType == "deleteContentBackward") {
    r.domObserver.flushSoon();
    let { domChangeCount: n } = r.input;
    setTimeout(() => {
      if (r.input.domChangeCount != n || (r.dom.blur(), r.focus(), r.someProp("handleKeyDown", (s) => s(r, De(8, "Backspace")))))
        return;
      let { $cursor: i } = r.state.selection;
      i && i.pos > 0 && r.dispatch(r.state.tr.delete(i.pos - 1, i.pos).scrollIntoView());
    }, 50);
  }
};
for (let r in H)
  K[r] = H[r];
function gt(r, e) {
  if (r == e)
    return !0;
  for (let t in r)
    if (r[t] !== e[t])
      return !1;
  for (let t in e)
    if (!(t in r))
      return !1;
  return !0;
}
class Wt {
  constructor(e, t) {
    this.toDOM = e, this.spec = t || Be, this.side = this.spec.side || 0;
  }
  map(e, t, n, i) {
    let { pos: s, deleted: o } = e.mapResult(t.from + i, this.side < 0 ? -1 : 1);
    return o ? null : new ee(s - n, s - n, this);
  }
  valid() {
    return !0;
  }
  eq(e) {
    return this == e || e instanceof Wt && (this.spec.key && this.spec.key == e.spec.key || this.toDOM == e.toDOM && gt(this.spec, e.spec));
  }
  destroy(e) {
    this.spec.destroy && this.spec.destroy(e);
  }
}
class we {
  constructor(e, t) {
    this.attrs = e, this.spec = t || Be;
  }
  map(e, t, n, i) {
    let s = e.map(t.from + i, this.spec.inclusiveStart ? -1 : 1) - n, o = e.map(t.to + i, this.spec.inclusiveEnd ? 1 : -1) - n;
    return s >= o ? null : new ee(s, o, this);
  }
  valid(e, t) {
    return t.from < t.to;
  }
  eq(e) {
    return this == e || e instanceof we && gt(this.attrs, e.attrs) && gt(this.spec, e.spec);
  }
  static is(e) {
    return e.type instanceof we;
  }
  destroy() {
  }
}
class nr {
  constructor(e, t) {
    this.attrs = e, this.spec = t || Be;
  }
  map(e, t, n, i) {
    let s = e.mapResult(t.from + i, 1);
    if (s.deleted)
      return null;
    let o = e.mapResult(t.to + i, -1);
    return o.deleted || o.pos <= s.pos ? null : new ee(s.pos - n, o.pos - n, this);
  }
  valid(e, t) {
    let { index: n, offset: i } = e.content.findIndex(t.from), s;
    return i == t.from && !(s = e.child(n)).isText && i + s.nodeSize == t.to;
  }
  eq(e) {
    return this == e || e instanceof nr && gt(this.attrs, e.attrs) && gt(this.spec, e.spec);
  }
  destroy() {
  }
}
class ee {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.from = e, this.to = t, this.type = n;
  }
  /**
  @internal
  */
  copy(e, t) {
    return new ee(e, t, this.type);
  }
  /**
  @internal
  */
  eq(e, t = 0) {
    return this.type.eq(e.type) && this.from + t == e.from && this.to + t == e.to;
  }
  /**
  @internal
  */
  map(e, t, n) {
    return this.type.map(e, this, t, n);
  }
  /**
  Creates a widget decoration, which is a DOM node that's shown in
  the document at the given position. It is recommended that you
  delay rendering the widget by passing a function that will be
  called when the widget is actually drawn in a view, but you can
  also directly pass a DOM node. `getPos` can be used to find the
  widget's current document position.
  */
  static widget(e, t, n) {
    return new ee(e, e, new Wt(t, n));
  }
  /**
  Creates an inline decoration, which adds the given attributes to
  each inline node between `from` and `to`.
  */
  static inline(e, t, n, i) {
    return new ee(e, t, new we(n, i));
  }
  /**
  Creates a node decoration. `from` and `to` should point precisely
  before and after a node in the document. That node, and only that
  node, will receive the given attributes.
  */
  static node(e, t, n, i) {
    return new ee(e, t, new nr(n, i));
  }
  /**
  The spec provided when creating this decoration. Can be useful
  if you've stored extra information in that object.
  */
  get spec() {
    return this.type.spec;
  }
  /**
  @internal
  */
  get inline() {
    return this.type instanceof we;
  }
  /**
  @internal
  */
  get widget() {
    return this.type instanceof Wt;
  }
}
const Ke = [], Be = {};
class v {
  /**
  @internal
  */
  constructor(e, t) {
    this.local = e.length ? e : Ke, this.children = t.length ? t : Ke;
  }
  /**
  Create a set of decorations, using the structure of the given
  document. This will consume (modify) the `decorations` array, so
  you must make a copy if you want need to preserve that.
  */
  static create(e, t) {
    return t.length ? Jt(t, e, 0, Be) : $;
  }
  /**
  Find all decorations in this set which touch the given range
  (including decorations that start or end directly at the
  boundaries) and match the given predicate on their spec. When
  `start` and `end` are omitted, all decorations in the set are
  considered. When `predicate` isn't given, all decorations are
  assumed to match.
  */
  find(e, t, n) {
    let i = [];
    return this.findInner(e ?? 0, t ?? 1e9, i, 0, n), i;
  }
  findInner(e, t, n, i, s) {
    for (let o = 0; o < this.local.length; o++) {
      let l = this.local[o];
      l.from <= t && l.to >= e && (!s || s(l.spec)) && n.push(l.copy(l.from + i, l.to + i));
    }
    for (let o = 0; o < this.children.length; o += 3)
      if (this.children[o] < t && this.children[o + 1] > e) {
        let l = this.children[o] + 1;
        this.children[o + 2].findInner(e - l, t - l, n, i + l, s);
      }
  }
  /**
  Map the set of decorations in response to a change in the
  document.
  */
  map(e, t, n) {
    return this == $ || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || Be);
  }
  /**
  @internal
  */
  mapInner(e, t, n, i, s) {
    let o;
    for (let l = 0; l < this.local.length; l++) {
      let a = this.local[l].map(e, n, i);
      a && a.type.valid(t, a) ? (o || (o = [])).push(a) : s.onRemove && s.onRemove(this.local[l].spec);
    }
    return this.children.length ? ya(this.children, o || [], e, t, n, i, s) : o ? new v(o.sort(ze), Ke) : $;
  }
  /**
  Add the given array of decorations to the ones in the set,
  producing a new set. Consumes the `decorations` array. Needs
  access to the current document to create the appropriate tree
  structure.
  */
  add(e, t) {
    return t.length ? this == $ ? v.create(e, t) : this.addInner(e, t, 0) : this;
  }
  addInner(e, t, n) {
    let i, s = 0;
    e.forEach((l, a) => {
      let c = a + n, f;
      if (f = Is(t, l, c)) {
        for (i || (i = this.children.slice()); s < i.length && i[s] < a; )
          s += 3;
        i[s] == a ? i[s + 2] = i[s + 2].addInner(l, f, c + 1) : i.splice(s, 0, a, a + l.nodeSize, Jt(f, l, c + 1, Be)), s += 3;
      }
    });
    let o = As(s ? Rs(t) : t, -n);
    for (let l = 0; l < o.length; l++)
      o[l].type.valid(e, o[l]) || o.splice(l--, 1);
    return new v(o.length ? this.local.concat(o).sort(ze) : this.local, i || this.children);
  }
  /**
  Create a new set that contains the decorations in this set, minus
  the ones in the given array.
  */
  remove(e) {
    return e.length == 0 || this == $ ? this : this.removeInner(e, 0);
  }
  removeInner(e, t) {
    let n = this.children, i = this.local;
    for (let s = 0; s < n.length; s += 3) {
      let o, l = n[s] + t, a = n[s + 1] + t;
      for (let f = 0, d; f < e.length; f++)
        (d = e[f]) && d.from > l && d.to < a && (e[f] = null, (o || (o = [])).push(d));
      if (!o)
        continue;
      n == this.children && (n = this.children.slice());
      let c = n[s + 2].removeInner(o, l + 1);
      c != $ ? n[s + 2] = c : (n.splice(s, 3), s -= 3);
    }
    if (i.length) {
      for (let s = 0, o; s < e.length; s++)
        if (o = e[s])
          for (let l = 0; l < i.length; l++)
            i[l].eq(o, t) && (i == this.local && (i = this.local.slice()), i.splice(l--, 1));
    }
    return n == this.children && i == this.local ? this : i.length || n.length ? new v(i, n) : $;
  }
  forChild(e, t) {
    if (this == $)
      return this;
    if (t.isLeaf)
      return v.empty;
    let n, i;
    for (let l = 0; l < this.children.length; l += 3)
      if (this.children[l] >= e) {
        this.children[l] == e && (n = this.children[l + 2]);
        break;
      }
    let s = e + 1, o = s + t.content.size;
    for (let l = 0; l < this.local.length; l++) {
      let a = this.local[l];
      if (a.from < o && a.to > s && a.type instanceof we) {
        let c = Math.max(s, a.from) - s, f = Math.min(o, a.to) - s;
        c < f && (i || (i = [])).push(a.copy(c, f));
      }
    }
    if (i) {
      let l = new v(i.sort(ze), Ke);
      return n ? new ge([l, n]) : l;
    }
    return n || $;
  }
  /**
  @internal
  */
  eq(e) {
    if (this == e)
      return !0;
    if (!(e instanceof v) || this.local.length != e.local.length || this.children.length != e.children.length)
      return !1;
    for (let t = 0; t < this.local.length; t++)
      if (!this.local[t].eq(e.local[t]))
        return !1;
    for (let t = 0; t < this.children.length; t += 3)
      if (this.children[t] != e.children[t] || this.children[t + 1] != e.children[t + 1] || !this.children[t + 2].eq(e.children[t + 2]))
        return !1;
    return !0;
  }
  /**
  @internal
  */
  locals(e) {
    return rr(this.localsInner(e));
  }
  /**
  @internal
  */
  localsInner(e) {
    if (this == $)
      return Ke;
    if (e.inlineContent || !this.local.some(we.is))
      return this.local;
    let t = [];
    for (let n = 0; n < this.local.length; n++)
      this.local[n].type instanceof we || t.push(this.local[n]);
    return t;
  }
  forEachSet(e) {
    e(this);
  }
}
v.empty = new v([], []);
v.removeOverlap = rr;
const $ = v.empty;
class ge {
  constructor(e) {
    this.members = e;
  }
  map(e, t) {
    const n = this.members.map((i) => i.map(e, t, Be));
    return ge.from(n);
  }
  forChild(e, t) {
    if (t.isLeaf)
      return v.empty;
    let n = [];
    for (let i = 0; i < this.members.length; i++) {
      let s = this.members[i].forChild(e, t);
      s != $ && (s instanceof ge ? n = n.concat(s.members) : n.push(s));
    }
    return ge.from(n);
  }
  eq(e) {
    if (!(e instanceof ge) || e.members.length != this.members.length)
      return !1;
    for (let t = 0; t < this.members.length; t++)
      if (!this.members[t].eq(e.members[t]))
        return !1;
    return !0;
  }
  locals(e) {
    let t, n = !0;
    for (let i = 0; i < this.members.length; i++) {
      let s = this.members[i].localsInner(e);
      if (s.length)
        if (!t)
          t = s;
        else {
          n && (t = t.slice(), n = !1);
          for (let o = 0; o < s.length; o++)
            t.push(s[o]);
        }
    }
    return t ? rr(n ? t : t.sort(ze)) : Ke;
  }
  // Create a group for the given array of decoration sets, or return
  // a single set when possible.
  static from(e) {
    switch (e.length) {
      case 0:
        return $;
      case 1:
        return e[0];
      default:
        return new ge(e.every((t) => t instanceof v) ? e : e.reduce((t, n) => t.concat(n instanceof v ? n : n.members), []));
    }
  }
  forEachSet(e) {
    for (let t = 0; t < this.members.length; t++)
      this.members[t].forEachSet(e);
  }
}
function ya(r, e, t, n, i, s, o) {
  let l = r.slice();
  for (let c = 0, f = s; c < t.maps.length; c++) {
    let d = 0;
    t.maps[c].forEach((u, h, p, m) => {
      let g = m - p - (h - u);
      for (let y = 0; y < l.length; y += 3) {
        let C = l[y + 1];
        if (C < 0 || u > C + f - d)
          continue;
        let M = l[y] + f - d;
        h >= M ? l[y + 1] = u <= M ? -2 : -1 : u >= f && g && (l[y] += g, l[y + 1] += g);
      }
      d += g;
    }), f = t.maps[c].map(f, -1);
  }
  let a = !1;
  for (let c = 0; c < l.length; c += 3)
    if (l[c + 1] < 0) {
      if (l[c + 1] == -2) {
        a = !0, l[c + 1] = -1;
        continue;
      }
      let f = t.map(r[c] + s), d = f - i;
      if (d < 0 || d >= n.content.size) {
        a = !0;
        continue;
      }
      let u = t.map(r[c + 1] + s, -1), h = u - i, { index: p, offset: m } = n.content.findIndex(d), g = n.maybeChild(p);
      if (g && m == d && m + g.nodeSize == h) {
        let y = l[c + 2].mapInner(t, g, f + 1, r[c] + s + 1, o);
        y != $ ? (l[c] = d, l[c + 1] = h, l[c + 2] = y) : (l[c + 1] = -2, a = !0);
      } else
        a = !0;
    }
  if (a) {
    let c = ba(l, r, e, t, i, s, o), f = Jt(c, n, 0, o);
    e = f.local;
    for (let d = 0; d < l.length; d += 3)
      l[d + 1] < 0 && (l.splice(d, 3), d -= 3);
    for (let d = 0, u = 0; d < f.children.length; d += 3) {
      let h = f.children[d];
      for (; u < l.length && l[u] < h; )
        u += 3;
      l.splice(u, 0, f.children[d], f.children[d + 1], f.children[d + 2]);
    }
  }
  return new v(e.sort(ze), l);
}
function As(r, e) {
  if (!e || !r.length)
    return r;
  let t = [];
  for (let n = 0; n < r.length; n++) {
    let i = r[n];
    t.push(new ee(i.from + e, i.to + e, i.type));
  }
  return t;
}
function ba(r, e, t, n, i, s, o) {
  function l(a, c) {
    for (let f = 0; f < a.local.length; f++) {
      let d = a.local[f].map(n, i, c);
      d ? t.push(d) : o.onRemove && o.onRemove(a.local[f].spec);
    }
    for (let f = 0; f < a.children.length; f += 3)
      l(a.children[f + 2], a.children[f] + c + 1);
  }
  for (let a = 0; a < r.length; a += 3)
    r[a + 1] == -1 && l(r[a + 2], e[a] + s + 1);
  return t;
}
function Is(r, e, t) {
  if (e.isLeaf)
    return null;
  let n = t + e.nodeSize, i = null;
  for (let s = 0, o; s < r.length; s++)
    (o = r[s]) && o.from > t && o.to < n && ((i || (i = [])).push(o), r[s] = null);
  return i;
}
function Rs(r) {
  let e = [];
  for (let t = 0; t < r.length; t++)
    r[t] != null && e.push(r[t]);
  return e;
}
function Jt(r, e, t, n) {
  let i = [], s = !1;
  e.forEach((l, a) => {
    let c = Is(r, l, a + t);
    if (c) {
      s = !0;
      let f = Jt(c, l, t + a + 1, n);
      f != $ && i.push(a, a + l.nodeSize, f);
    }
  });
  let o = As(s ? Rs(r) : r, -t).sort(ze);
  for (let l = 0; l < o.length; l++)
    o[l].type.valid(e, o[l]) || (n.onRemove && n.onRemove(o[l].spec), o.splice(l--, 1));
  return o.length || i.length ? new v(o, i) : $;
}
function ze(r, e) {
  return r.from - e.from || r.to - e.to;
}
function rr(r) {
  let e = r;
  for (let t = 0; t < e.length - 1; t++) {
    let n = e[t];
    if (n.from != n.to)
      for (let i = t + 1; i < e.length; i++) {
        let s = e[i];
        if (s.from == n.from) {
          s.to != n.to && (e == r && (e = r.slice()), e[i] = s.copy(s.from, n.to), ti(e, i + 1, s.copy(n.to, s.to)));
          continue;
        } else {
          s.from < n.to && (e == r && (e = r.slice()), e[t] = n.copy(n.from, s.from), ti(e, i, n.copy(s.from, n.to)));
          break;
        }
      }
  }
  return e;
}
function ti(r, e, t) {
  for (; e < r.length && ze(t, r[e]) > 0; )
    e++;
  r.splice(e, 0, t);
}
function bn(r) {
  let e = [];
  return r.someProp("decorations", (t) => {
    let n = t(r.state);
    n && n != $ && e.push(n);
  }), r.cursorWrapper && e.push(v.create(r.state.doc, [r.cursorWrapper.deco])), ge.from(e);
}
const ka = {
  childList: !0,
  characterData: !0,
  characterDataOldValue: !0,
  attributes: !0,
  attributeOldValue: !0,
  subtree: !0
}, xa = G && Ce <= 11;
class Sa {
  constructor() {
    this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0;
  }
  set(e) {
    this.anchorNode = e.anchorNode, this.anchorOffset = e.anchorOffset, this.focusNode = e.focusNode, this.focusOffset = e.focusOffset;
  }
  clear() {
    this.anchorNode = this.focusNode = null;
  }
  eq(e) {
    return e.anchorNode == this.anchorNode && e.anchorOffset == this.anchorOffset && e.focusNode == this.focusNode && e.focusOffset == this.focusOffset;
  }
}
class Ca {
  constructor(e, t) {
    this.view = e, this.handleDOMChange = t, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Sa(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((n) => {
      for (let i = 0; i < n.length; i++)
        this.queue.push(n[i]);
      G && Ce <= 11 && n.some((i) => i.type == "childList" && i.removedNodes.length || i.type == "characterData" && i.oldValue.length > i.target.nodeValue.length) ? this.flushSoon() : this.flush();
    }), xa && (this.onCharData = (n) => {
      this.queue.push({ target: n.target, type: "characterData", oldValue: n.prevValue }), this.flushSoon();
    }), this.onSelectionChange = this.onSelectionChange.bind(this);
  }
  flushSoon() {
    this.flushingSoon < 0 && (this.flushingSoon = window.setTimeout(() => {
      this.flushingSoon = -1, this.flush();
    }, 20));
  }
  forceFlush() {
    this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), this.flushingSoon = -1, this.flush());
  }
  start() {
    this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, ka)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
  }
  stop() {
    if (this.observer) {
      let e = this.observer.takeRecords();
      if (e.length) {
        for (let t = 0; t < e.length; t++)
          this.queue.push(e[t]);
        window.setTimeout(() => this.flush(), 20);
      }
      this.observer.disconnect();
    }
    this.onCharData && this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData), this.disconnectSelection();
  }
  connectSelection() {
    this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
  }
  disconnectSelection() {
    this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
  }
  suppressSelectionUpdates() {
    this.suppressingSelectionUpdates = !0, setTimeout(() => this.suppressingSelectionUpdates = !1, 50);
  }
  onSelectionChange() {
    if (Ur(this.view)) {
      if (this.suppressingSelectionUpdates)
        return ue(this.view);
      if (G && Ce <= 11 && !this.view.state.selection.empty) {
        let e = this.view.domSelectionRange();
        if (e.focusNode && Ve(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset))
          return this.flushSoon();
      }
      this.flush();
    }
  }
  setCurSelection() {
    this.currentSelection.set(this.view.domSelectionRange());
  }
  ignoreSelectionChange(e) {
    if (!e.focusNode)
      return !0;
    let t = /* @__PURE__ */ new Set(), n;
    for (let s = e.focusNode; s; s = ht(s))
      t.add(s);
    for (let s = e.anchorNode; s; s = ht(s))
      if (t.has(s)) {
        n = s;
        break;
      }
    let i = n && this.view.docView.nearestDesc(n);
    if (i && i.ignoreMutation({
      type: "selection",
      target: n.nodeType == 3 ? n.parentNode : n
    }))
      return this.setCurSelection(), !0;
  }
  pendingRecords() {
    if (this.observer)
      for (let e of this.observer.takeRecords())
        this.queue.push(e);
    return this.queue;
  }
  flush() {
    let { view: e } = this;
    if (!e.docView || this.flushingSoon > -1)
      return;
    let t = this.pendingRecords();
    t.length && (this.queue = []);
    let n = e.domSelectionRange(), i = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n) && Ur(e) && !this.ignoreSelectionChange(n), s = -1, o = -1, l = !1, a = [];
    if (e.editable)
      for (let f = 0; f < t.length; f++) {
        let d = this.registerMutation(t[f], a);
        d && (s = s < 0 ? d.from : Math.min(d.from, s), o = o < 0 ? d.to : Math.max(d.to, o), d.typeOver && (l = !0));
      }
    if (te && a.length) {
      let f = a.filter((d) => d.nodeName == "BR");
      if (f.length == 2) {
        let [d, u] = f;
        d.parentNode && d.parentNode.parentNode == u.parentNode ? u.remove() : d.remove();
      } else {
        let { focusNode: d } = this.currentSelection;
        for (let u of f) {
          let h = u.parentNode;
          h && h.nodeName == "LI" && (!d || Oa(e, d) != h) && u.remove();
        }
      }
    }
    let c = null;
    s < 0 && i && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && _t(n) && (c = _n(e)) && c.eq(N.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, ue(e), this.currentSelection.set(n)) : (s > -1 || i) && (s > -1 && (e.docView.markDirty(s, o), Ma(e)), this.handleDOMChange(s, o, l, a), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || ue(e), this.currentSelection.set(n));
  }
  registerMutation(e, t) {
    if (t.indexOf(e.target) > -1)
      return null;
    let n = this.view.docView.nearestDesc(e.target);
    if (e.type == "attributes" && (n == this.view.docView || e.attributeName == "contenteditable" || // Firefox sometimes fires spurious events for null/empty styles
    e.attributeName == "style" && !e.oldValue && !e.target.getAttribute("style")) || !n || n.ignoreMutation(e))
      return null;
    if (e.type == "childList") {
      for (let f = 0; f < e.addedNodes.length; f++) {
        let d = e.addedNodes[f];
        t.push(d), d.nodeType == 3 && (this.lastChangedTextNode = d);
      }
      if (n.contentDOM && n.contentDOM != n.dom && !n.contentDOM.contains(e.target))
        return { from: n.posBefore, to: n.posAfter };
      let i = e.previousSibling, s = e.nextSibling;
      if (G && Ce <= 11 && e.addedNodes.length)
        for (let f = 0; f < e.addedNodes.length; f++) {
          let { previousSibling: d, nextSibling: u } = e.addedNodes[f];
          (!d || Array.prototype.indexOf.call(e.addedNodes, d) < 0) && (i = d), (!u || Array.prototype.indexOf.call(e.addedNodes, u) < 0) && (s = u);
        }
      let o = i && i.parentNode == e.target ? V(i) + 1 : 0, l = n.localPosFromDOM(e.target, o, -1), a = s && s.parentNode == e.target ? V(s) : e.target.childNodes.length, c = n.localPosFromDOM(e.target, a, 1);
      return { from: l, to: c };
    } else return e.type == "attributes" ? { from: n.posAtStart - n.border, to: n.posAtEnd + n.border } : (this.lastChangedTextNode = e.target, {
      from: n.posAtStart,
      to: n.posAtEnd,
      // An event was generated for a text change that didn't change
      // any text. Mark the dom change to fall back to assuming the
      // selection was typed over with an identical value if it can't
      // find another change.
      typeOver: e.target.nodeValue == e.oldValue
    });
  }
}
let ni = /* @__PURE__ */ new WeakMap(), ri = !1;
function Ma(r) {
  if (!ni.has(r) && (ni.set(r, null), ["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(r.dom).whiteSpace) !== -1)) {
    if (r.requiresGeckoHackNode = te, ri)
      return;
    console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), ri = !0;
  }
}
function ii(r, e) {
  let t = e.startContainer, n = e.startOffset, i = e.endContainer, s = e.endOffset, o = r.domAtPos(r.state.selection.anchor);
  return Ve(o.node, o.offset, i, s) && ([t, n, i, s] = [i, s, t, n]), { anchorNode: t, anchorOffset: n, focusNode: i, focusOffset: s };
}
function wa(r, e) {
  if (e.getComposedRanges) {
    let i = e.getComposedRanges(r.root)[0];
    if (i)
      return ii(r, i);
  }
  let t;
  function n(i) {
    i.preventDefault(), i.stopImmediatePropagation(), t = i.getTargetRanges()[0];
  }
  return r.dom.addEventListener("beforeinput", n, !0), document.execCommand("indent"), r.dom.removeEventListener("beforeinput", n, !0), t ? ii(r, t) : null;
}
function Oa(r, e) {
  for (let t = e.parentNode; t && t != r.dom; t = t.parentNode) {
    let n = r.docView.nearestDesc(t, !0);
    if (n && n.node.isBlock)
      return t;
  }
  return null;
}
function Na(r, e, t) {
  let { node: n, fromOffset: i, toOffset: s, from: o, to: l } = r.docView.parseRange(e, t), a = r.domSelectionRange(), c, f = a.anchorNode;
  if (f && r.dom.contains(f.nodeType == 1 ? f : f.parentNode) && (c = [{ node: f, offset: a.anchorOffset }], _t(a) || c.push({ node: a.focusNode, offset: a.focusOffset })), W && r.input.lastKeyCode === 8)
    for (let g = s; g > i; g--) {
      let y = n.childNodes[g - 1], C = y.pmViewDesc;
      if (y.nodeName == "BR" && !C) {
        s = g;
        break;
      }
      if (!C || C.size)
        break;
    }
  let d = r.state.doc, u = r.someProp("domParser") || Se.fromSchema(r.state.schema), h = d.resolve(o), p = null, m = u.parse(n, {
    topNode: h.parent,
    topMatch: h.parent.contentMatchAt(h.index()),
    topOpen: !0,
    from: i,
    to: s,
    preserveWhitespace: h.parent.type.whitespace == "pre" ? "full" : !0,
    findPositions: c,
    ruleFromNode: Ta,
    context: h
  });
  if (c && c[0].pos != null) {
    let g = c[0].pos, y = c[1] && c[1].pos;
    y == null && (y = g), p = { anchor: g + o, head: y + o };
  }
  return { doc: m, sel: p, from: o, to: l };
}
function Ta(r) {
  let e = r.pmViewDesc;
  if (e)
    return e.parseRule();
  if (r.nodeName == "BR" && r.parentNode) {
    if (q && /^(ul|ol)$/i.test(r.parentNode.nodeName)) {
      let t = document.createElement("div");
      return t.appendChild(document.createElement("li")), { skip: t };
    } else if (r.parentNode.lastChild == r || q && /^(tr|table)$/i.test(r.parentNode.nodeName))
      return { ignore: !0 };
  } else if (r.nodeName == "IMG" && r.getAttribute("mark-placeholder"))
    return { ignore: !0 };
  return null;
}
const Ea = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function Da(r, e, t, n, i) {
  let s = r.input.compositionPendingChanges || (r.composing ? r.input.compositionID : 0);
  if (r.input.compositionPendingChanges = 0, e < 0) {
    let T = r.input.lastSelectionTime > Date.now() - 50 ? r.input.lastSelectionOrigin : null, he = _n(r, T);
    if (he && !r.state.selection.eq(he)) {
      if (W && ce && r.input.lastKeyCode === 13 && Date.now() - 100 < r.input.lastKeyCodeTime && r.someProp("handleKeyDown", (io) => io(r, De(13, "Enter"))))
        return;
      let Ct = r.state.tr.setSelection(he);
      T == "pointer" ? Ct.setMeta("pointer", !0) : T == "key" && Ct.scrollIntoView(), s && Ct.setMeta("composition", s), r.dispatch(Ct);
    }
    return;
  }
  let o = r.state.doc.resolve(e), l = o.sharedDepth(t);
  e = o.before(l + 1), t = r.state.doc.resolve(t).after(l + 1);
  let a = r.state.selection, c = Na(r, e, t), f = r.state.doc, d = f.slice(c.from, c.to), u, h;
  r.input.lastKeyCode === 8 && Date.now() - 100 < r.input.lastKeyCodeTime ? (u = r.state.selection.to, h = "end") : (u = r.state.selection.from, h = "start"), r.input.lastKeyCode = null;
  let p = Ra(d.content, c.doc.content, c.from, u, h);
  if (p && r.input.domChangeCount++, (Qe && r.input.lastIOSEnter > Date.now() - 225 || ce) && i.some((T) => T.nodeType == 1 && !Ea.test(T.nodeName)) && (!p || p.endA >= p.endB) && r.someProp("handleKeyDown", (T) => T(r, De(13, "Enter")))) {
    r.input.lastIOSEnter = 0;
    return;
  }
  if (!p)
    if (n && a instanceof O && !a.empty && a.$head.sameParent(a.$anchor) && !r.composing && !(c.sel && c.sel.anchor != c.sel.head))
      p = { start: a.from, endA: a.to, endB: a.to };
    else {
      if (c.sel) {
        let T = si(r, r.state.doc, c.sel);
        if (T && !T.eq(r.state.selection)) {
          let he = r.state.tr.setSelection(T);
          s && he.setMeta("composition", s), r.dispatch(he);
        }
      }
      return;
    }
  r.state.selection.from < r.state.selection.to && p.start == p.endB && r.state.selection instanceof O && (p.start > r.state.selection.from && p.start <= r.state.selection.from + 2 && r.state.selection.from >= c.from ? p.start = r.state.selection.from : p.endA < r.state.selection.to && p.endA >= r.state.selection.to - 2 && r.state.selection.to <= c.to && (p.endB += r.state.selection.to - p.endA, p.endA = r.state.selection.to)), G && Ce <= 11 && p.endB == p.start + 1 && p.endA == p.start && p.start > c.from && c.doc.textBetween(p.start - c.from - 1, p.start - c.from + 1) == "  " && (p.start--, p.endA--, p.endB--);
  let m = c.doc.resolveNoCache(p.start - c.from), g = c.doc.resolveNoCache(p.endB - c.from), y = f.resolve(p.start), C = m.sameParent(g) && m.parent.inlineContent && y.end() >= p.endA, M;
  if ((Qe && r.input.lastIOSEnter > Date.now() - 225 && (!C || i.some((T) => T.nodeName == "DIV" || T.nodeName == "P")) || !C && m.pos < c.doc.content.size && !m.sameParent(g) && (M = N.findFrom(c.doc.resolve(m.pos + 1), 1, !0)) && M.head == g.pos) && r.someProp("handleKeyDown", (T) => T(r, De(13, "Enter")))) {
    r.input.lastIOSEnter = 0;
    return;
  }
  if (r.state.selection.anchor > p.start && Ia(f, p.start, p.endA, m, g) && r.someProp("handleKeyDown", (T) => T(r, De(8, "Backspace")))) {
    ce && W && r.domObserver.suppressSelectionUpdates();
    return;
  }
  W && p.endB == p.start && (r.input.lastChromeDelete = Date.now()), ce && !C && m.start() != g.start() && g.parentOffset == 0 && m.depth == g.depth && c.sel && c.sel.anchor == c.sel.head && c.sel.head == p.endA && (p.endB -= 2, g = c.doc.resolveNoCache(p.endB - c.from), setTimeout(() => {
    r.someProp("handleKeyDown", function(T) {
      return T(r, De(13, "Enter"));
    });
  }, 20));
  let D = p.start, E = p.endA, A, U, j;
  if (C) {
    if (m.pos == g.pos)
      G && Ce <= 11 && m.parentOffset == 0 && (r.domObserver.suppressSelectionUpdates(), setTimeout(() => ue(r), 20)), A = r.state.tr.delete(D, E), U = f.resolve(p.start).marksAcross(f.resolve(p.endA));
    else if (
      // Adding or removing a mark
      p.endA == p.endB && (j = Aa(m.parent.content.cut(m.parentOffset, g.parentOffset), y.parent.content.cut(y.parentOffset, p.endA - y.start())))
    )
      A = r.state.tr, j.type == "add" ? A.addMark(D, E, j.mark) : A.removeMark(D, E, j.mark);
    else if (m.parent.child(m.index()).isText && m.index() == g.index() - (g.textOffset ? 0 : 1)) {
      let T = m.parent.textBetween(m.parentOffset, g.parentOffset);
      if (r.someProp("handleTextInput", (he) => he(r, D, E, T)))
        return;
      A = r.state.tr.insertText(T, D, E);
    }
  }
  if (A || (A = r.state.tr.replace(D, E, c.doc.slice(p.start - c.from, p.endB - c.from))), c.sel) {
    let T = si(r, A.doc, c.sel);
    T && !(W && r.composing && T.empty && (p.start != p.endB || r.input.lastChromeDelete < Date.now() - 100) && (T.head == D || T.head == A.mapping.map(E) - 1) || G && T.empty && T.head == D) && A.setSelection(T);
  }
  U && A.ensureMarks(U), s && A.setMeta("composition", s), r.dispatch(A.scrollIntoView());
}
function si(r, e, t) {
  return Math.max(t.anchor, t.head) > e.content.size ? null : Xn(r, e.resolve(t.anchor), e.resolve(t.head));
}
function Aa(r, e) {
  let t = r.firstChild.marks, n = e.firstChild.marks, i = t, s = n, o, l, a;
  for (let f = 0; f < n.length; f++)
    i = n[f].removeFromSet(i);
  for (let f = 0; f < t.length; f++)
    s = t[f].removeFromSet(s);
  if (i.length == 1 && s.length == 0)
    l = i[0], o = "add", a = (f) => f.mark(l.addToSet(f.marks));
  else if (i.length == 0 && s.length == 1)
    l = s[0], o = "remove", a = (f) => f.mark(l.removeFromSet(f.marks));
  else
    return null;
  let c = [];
  for (let f = 0; f < e.childCount; f++)
    c.push(a(e.child(f)));
  if (b.from(c).eq(r))
    return { mark: l, type: o };
}
function Ia(r, e, t, n, i) {
  if (
    // The content must have shrunk
    t - e <= i.pos - n.pos || // newEnd must point directly at or after the end of the block that newStart points into
    kn(n, !0, !1) < i.pos
  )
    return !1;
  let s = r.resolve(e);
  if (!n.parent.isTextblock) {
    let l = s.nodeAfter;
    return l != null && t == e + l.nodeSize;
  }
  if (s.parentOffset < s.parent.content.size || !s.parent.isTextblock)
    return !1;
  let o = r.resolve(kn(s, !0, !0));
  return !o.parent.isTextblock || o.pos > t || kn(o, !0, !1) < t ? !1 : n.parent.content.cut(n.parentOffset).eq(o.parent.content);
}
function kn(r, e, t) {
  let n = r.depth, i = e ? r.end() : r.pos;
  for (; n > 0 && (e || r.indexAfter(n) == r.node(n).childCount); )
    n--, i++, e = !1;
  if (t) {
    let s = r.node(n).maybeChild(r.indexAfter(n));
    for (; s && !s.isLeaf; )
      s = s.firstChild, i++;
  }
  return i;
}
function Ra(r, e, t, n, i) {
  let s = r.findDiffStart(e, t);
  if (s == null)
    return null;
  let { a: o, b: l } = r.findDiffEnd(e, t + r.size, t + e.size);
  if (i == "end") {
    let a = Math.max(0, s - Math.min(o, l));
    n -= o + a - s;
  }
  if (o < s && r.size < e.size) {
    let a = n <= s && n >= o ? s - n : 0;
    s -= a, s && s < e.size && oi(e.textBetween(s - 1, s + 1)) && (s += a ? 1 : -1), l = s + (l - o), o = s;
  } else if (l < s) {
    let a = n <= s && n >= l ? s - n : 0;
    s -= a, s && s < r.size && oi(r.textBetween(s - 1, s + 1)) && (s += a ? 1 : -1), o = s + (o - l), l = s;
  }
  return { start: s, endA: o, endB: l };
}
function oi(r) {
  if (r.length != 2)
    return !1;
  let e = r.charCodeAt(0), t = r.charCodeAt(1);
  return e >= 56320 && e <= 57343 && t >= 55296 && t <= 56319;
}
class va {
  /**
  Create a view. `place` may be a DOM node that the editor should
  be appended to, a function that will place it into the document,
  or an object whose `mount` property holds the node to use as the
  document container. If it is `null`, the editor will not be
  added to the document.
  */
  constructor(e, t) {
    this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new Ql(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t, this.state = t.state, this.directPlugins = t.plugins || [], this.directPlugins.forEach(di), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement("div"), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == "function" ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = ci(this), ai(this), this.nodeViews = fi(this), this.docView = Wr(this.state.doc, li(this), bn(this), this.dom, this), this.domObserver = new Ca(this, (n, i, s, o) => Da(this, n, i, s, o)), this.domObserver.start(), Zl(this), this.updatePluginViews();
  }
  /**
  Holds `true` when a
  [composition](https://w3c.github.io/uievents/#events-compositionevents)
  is active.
  */
  get composing() {
    return this.input.composing;
  }
  /**
  The view's current [props](https://prosemirror.net/docs/ref/#view.EditorProps).
  */
  get props() {
    if (this._props.state != this.state) {
      let e = this._props;
      this._props = {};
      for (let t in e)
        this._props[t] = e[t];
      this._props.state = this.state;
    }
    return this._props;
  }
  /**
  Update the view's props. Will immediately cause an update to
  the DOM.
  */
  update(e) {
    e.handleDOMEvents != this._props.handleDOMEvents && $n(this);
    let t = this._props;
    this._props = e, e.plugins && (e.plugins.forEach(di), this.directPlugins = e.plugins), this.updateStateInner(e.state, t);
  }
  /**
  Update the view by updating existing props object with the object
  given as argument. Equivalent to `view.update(Object.assign({},
  view.props, props))`.
  */
  setProps(e) {
    let t = {};
    for (let n in this._props)
      t[n] = this._props[n];
    t.state = this.state;
    for (let n in e)
      t[n] = e[n];
    this.update(t);
  }
  /**
  Update the editor's `state` prop, without touching any of the
  other props.
  */
  updateState(e) {
    this.updateStateInner(e, this._props);
  }
  updateStateInner(e, t) {
    var n;
    let i = this.state, s = !1, o = !1;
    e.storedMarks && this.composing && (Ns(this), o = !0), this.state = e;
    let l = i.plugins != e.plugins || this._props.plugins != t.plugins;
    if (l || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
      let h = fi(this);
      Ba(h, this.nodeViews) && (this.nodeViews = h, s = !0);
    }
    (l || t.handleDOMEvents != this._props.handleDOMEvents) && $n(this), this.editable = ci(this), ai(this);
    let a = bn(this), c = li(this), f = i.plugins != e.plugins && !i.doc.eq(e.doc) ? "reset" : e.scrollToSelection > i.scrollToSelection ? "to selection" : "preserve", d = s || !this.docView.matchesNode(e.doc, c, a);
    (d || !e.selection.eq(i.selection)) && (o = !0);
    let u = f == "preserve" && o && this.dom.style.overflowAnchor == null && hl(this);
    if (o) {
      this.domObserver.stop();
      let h = d && (G || W) && !this.composing && !i.selection.empty && !e.selection.empty && Pa(i.selection, e.selection);
      if (d) {
        let p = W ? this.trackWrites = this.domSelectionRange().focusNode : null;
        this.composing && (this.input.compositionNode = ua(this)), (s || !this.docView.update(e.doc, c, a, this)) && (this.docView.updateOuterDeco(c), this.docView.destroy(), this.docView = Wr(e.doc, c, a, this.dom, this)), p && !this.trackWrites && (h = !0);
      }
      h || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && Fl(this)) ? ue(this, h) : (ps(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start();
    }
    this.updatePluginViews(i), !((n = this.dragging) === null || n === void 0) && n.node && !i.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, i), f == "reset" ? this.dom.scrollTop = 0 : f == "to selection" ? this.scrollToSelection() : u && pl(u);
  }
  /**
  @internal
  */
  scrollToSelection() {
    let e = this.domSelectionRange().focusNode;
    if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode))) {
      if (!this.someProp("handleScrollToSelection", (t) => t(this))) if (this.state.selection instanceof S) {
        let t = this.docView.domAfterPos(this.state.selection.from);
        t.nodeType == 1 && Br(this, t.getBoundingClientRect(), e);
      } else
        Br(this, this.coordsAtPos(this.state.selection.head, 1), e);
    }
  }
  destroyPluginViews() {
    let e;
    for (; e = this.pluginViews.pop(); )
      e.destroy && e.destroy();
  }
  updatePluginViews(e) {
    if (!e || e.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
      this.prevDirectPlugins = this.directPlugins, this.destroyPluginViews();
      for (let t = 0; t < this.directPlugins.length; t++) {
        let n = this.directPlugins[t];
        n.spec.view && this.pluginViews.push(n.spec.view(this));
      }
      for (let t = 0; t < this.state.plugins.length; t++) {
        let n = this.state.plugins[t];
        n.spec.view && this.pluginViews.push(n.spec.view(this));
      }
    } else
      for (let t = 0; t < this.pluginViews.length; t++) {
        let n = this.pluginViews[t];
        n.update && n.update(this, e);
      }
  }
  updateDraggedNode(e, t) {
    let n = e.node, i = -1;
    if (this.state.doc.nodeAt(n.from) == n.node)
      i = n.from;
    else {
      let s = n.from + (this.state.doc.content.size - t.doc.content.size);
      (s > 0 && this.state.doc.nodeAt(s)) == n.node && (i = s);
    }
    this.dragging = new Es(e.slice, e.move, i < 0 ? void 0 : S.create(this.state.doc, i));
  }
  someProp(e, t) {
    let n = this._props && this._props[e], i;
    if (n != null && (i = t ? t(n) : n))
      return i;
    for (let o = 0; o < this.directPlugins.length; o++) {
      let l = this.directPlugins[o].props[e];
      if (l != null && (i = t ? t(l) : l))
        return i;
    }
    let s = this.state.plugins;
    if (s)
      for (let o = 0; o < s.length; o++) {
        let l = s[o].props[e];
        if (l != null && (i = t ? t(l) : l))
          return i;
      }
  }
  /**
  Query whether the view has focus.
  */
  hasFocus() {
    if (G) {
      let e = this.root.activeElement;
      if (e == this.dom)
        return !0;
      if (!e || !this.dom.contains(e))
        return !1;
      for (; e && this.dom != e && this.dom.contains(e); ) {
        if (e.contentEditable == "false")
          return !1;
        e = e.parentElement;
      }
      return !0;
    }
    return this.root.activeElement == this.dom;
  }
  /**
  Focus the editor.
  */
  focus() {
    this.domObserver.stop(), this.editable && ml(this.dom), ue(this), this.domObserver.start();
  }
  /**
  Get the document root in which the editor exists. This will
  usually be the top-level `document`, but might be a [shadow
  DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM)
  root if the editor is inside one.
  */
  get root() {
    let e = this._root;
    if (e == null) {
      for (let t = this.dom.parentNode; t; t = t.parentNode)
        if (t.nodeType == 9 || t.nodeType == 11 && t.host)
          return t.getSelection || (Object.getPrototypeOf(t).getSelection = () => t.ownerDocument.getSelection()), this._root = t;
    }
    return e || document;
  }
  /**
  When an existing editor view is moved to a new document or
  shadow tree, call this to make it recompute its root.
  */
  updateRoot() {
    this._root = null;
  }
  /**
  Given a pair of viewport coordinates, return the document
  position that corresponds to them. May return null if the given
  coordinates aren't inside of the editor. When an object is
  returned, its `pos` property is the position nearest to the
  coordinates, and its `inside` property holds the position of the
  inner node that the position falls inside of, or -1 if it is at
  the top level, not in any node.
  */
  posAtCoords(e) {
    return xl(this, e);
  }
  /**
  Returns the viewport rectangle at a given document position.
  `left` and `right` will be the same number, as this returns a
  flat cursor-ish rectangle. If the position is between two things
  that aren't directly adjacent, `side` determines which element
  is used. When < 0, the element before the position is used,
  otherwise the element after.
  */
  coordsAtPos(e, t = 1) {
    return ss(this, e, t);
  }
  /**
  Find the DOM position that corresponds to the given document
  position. When `side` is negative, find the position as close as
  possible to the content before the position. When positive,
  prefer positions close to the content after the position. When
  zero, prefer as shallow a position as possible.
  
  Note that you should **not** mutate the editor's internal DOM,
  only inspect it (and even that is usually not necessary).
  */
  domAtPos(e, t = 0) {
    return this.docView.domFromPos(e, t);
  }
  /**
  Find the DOM node that represents the document node after the
  given position. May return `null` when the position doesn't point
  in front of a node or if the node is inside an opaque node view.
  
  This is intended to be able to call things like
  `getBoundingClientRect` on that DOM node. Do **not** mutate the
  editor DOM directly, or add styling this way, since that will be
  immediately overriden by the editor as it redraws the node.
  */
  nodeDOM(e) {
    let t = this.docView.descAt(e);
    return t ? t.nodeDOM : null;
  }
  /**
  Find the document position that corresponds to a given DOM
  position. (Whenever possible, it is preferable to inspect the
  document structure directly, rather than poking around in the
  DOM, but sometimes—for example when interpreting an event
  target—you don't have a choice.)
  
  The `bias` parameter can be used to influence which side of a DOM
  node to use when the position is inside a leaf node.
  */
  posAtDOM(e, t, n = -1) {
    let i = this.docView.posFromDOM(e, t, n);
    if (i == null)
      throw new RangeError("DOM position not inside the editor");
    return i;
  }
  /**
  Find out whether the selection is at the end of a textblock when
  moving in a given direction. When, for example, given `"left"`,
  it will return true if moving left from the current cursor
  position would leave that position's parent textblock. Will apply
  to the view's current state by default, but it is possible to
  pass a different state.
  */
  endOfTextblock(e, t) {
    return Ol(this, t || this.state, e);
  }
  /**
  Run the editor's paste logic with the given HTML string. The
  `event`, if given, will be passed to the
  [`handlePaste`](https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste) hook.
  */
  pasteHTML(e, t) {
    return mt(this, "", e, !1, t || new ClipboardEvent("paste"));
  }
  /**
  Run the editor's paste logic with the given plain-text input.
  */
  pasteText(e, t) {
    return mt(this, e, null, !0, t || new ClipboardEvent("paste"));
  }
  /**
  Serialize the given slice as it would be if it was copied from
  this editor. Returns a DOM element that contains a
  representation of the slice as its children, a textual
  representation, and the transformed slice (which can be
  different from the given input due to hooks like
  [`transformCopied`](https://prosemirror.net/docs/ref/#view.EditorProps.transformCopied)).
  */
  serializeForClipboard(e) {
    return Qn(this, e);
  }
  /**
  Removes the editor from the DOM and destroys all [node
  views](https://prosemirror.net/docs/ref/#view.NodeView).
  */
  destroy() {
    this.docView && (ea(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], bn(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, nl());
  }
  /**
  This is true when the view has been
  [destroyed](https://prosemirror.net/docs/ref/#view.EditorView.destroy) (and thus should not be
  used anymore).
  */
  get isDestroyed() {
    return this.docView == null;
  }
  /**
  Used for testing.
  */
  dispatchEvent(e) {
    return na(this, e);
  }
  /**
  Dispatch a transaction. Will call
  [`dispatchTransaction`](https://prosemirror.net/docs/ref/#view.DirectEditorProps.dispatchTransaction)
  when given, and otherwise defaults to applying the transaction to
  the current state and calling
  [`updateState`](https://prosemirror.net/docs/ref/#view.EditorView.updateState) with the result.
  This method is bound to the view instance, so that it can be
  easily passed around.
  */
  dispatch(e) {
    let t = this._props.dispatchTransaction;
    t ? t.call(this, e) : this.updateState(this.state.apply(e));
  }
  /**
  @internal
  */
  domSelectionRange() {
    let e = this.domSelection();
    return e ? q && this.root.nodeType === 11 && ll(this.dom.ownerDocument) == this.dom && wa(this, e) || e : { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
  }
  /**
  @internal
  */
  domSelection() {
    return this.root.getSelection();
  }
}
function li(r) {
  let e = /* @__PURE__ */ Object.create(null);
  return e.class = "ProseMirror", e.contenteditable = String(r.editable), r.someProp("attributes", (t) => {
    if (typeof t == "function" && (t = t(r.state)), t)
      for (let n in t)
        n == "class" ? e.class += " " + t[n] : n == "style" ? e.style = (e.style ? e.style + ";" : "") + t[n] : !e[n] && n != "contenteditable" && n != "nodeName" && (e[n] = String(t[n]));
  }), e.translate || (e.translate = "no"), [ee.node(0, r.state.doc.content.size, e)];
}
function ai(r) {
  if (r.markCursor) {
    let e = document.createElement("img");
    e.className = "ProseMirror-separator", e.setAttribute("mark-placeholder", "true"), e.setAttribute("alt", ""), r.cursorWrapper = { dom: e, deco: ee.widget(r.state.selection.from, e, { raw: !0, marks: r.markCursor }) };
  } else
    r.cursorWrapper = null;
}
function ci(r) {
  return !r.someProp("editable", (e) => e(r.state) === !1);
}
function Pa(r, e) {
  let t = Math.min(r.$anchor.sharedDepth(r.head), e.$anchor.sharedDepth(e.head));
  return r.$anchor.start(t) != e.$anchor.start(t);
}
function fi(r) {
  let e = /* @__PURE__ */ Object.create(null);
  function t(n) {
    for (let i in n)
      Object.prototype.hasOwnProperty.call(e, i) || (e[i] = n[i]);
  }
  return r.someProp("nodeViews", t), r.someProp("markViews", t), e;
}
function Ba(r, e) {
  let t = 0, n = 0;
  for (let i in r) {
    if (r[i] != e[i])
      return !0;
    t++;
  }
  for (let i in e)
    n++;
  return t != n;
}
function di(r) {
  if (r.spec.state || r.spec.filterTransaction || r.spec.appendTransaction)
    throw new RangeError("Plugins passed directly to the view must not have a state component");
}
var Oe = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
}, jt = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: '"'
}, za = typeof navigator < "u" && /Mac/.test(navigator.platform), Fa = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (var L = 0; L < 10; L++) Oe[48 + L] = Oe[96 + L] = String(L);
for (var L = 1; L <= 24; L++) Oe[L + 111] = "F" + L;
for (var L = 65; L <= 90; L++)
  Oe[L] = String.fromCharCode(L + 32), jt[L] = String.fromCharCode(L);
for (var xn in Oe) jt.hasOwnProperty(xn) || (jt[xn] = Oe[xn]);
function Va(r) {
  var e = za && r.metaKey && r.shiftKey && !r.ctrlKey && !r.altKey || Fa && r.shiftKey && r.key && r.key.length == 1 || r.key == "Unidentified", t = !e && r.key || (r.shiftKey ? jt : Oe)[r.keyCode] || r.key || "Unidentified";
  return t == "Esc" && (t = "Escape"), t == "Del" && (t = "Delete"), t == "Left" && (t = "ArrowLeft"), t == "Up" && (t = "ArrowUp"), t == "Right" && (t = "ArrowRight"), t == "Down" && (t = "ArrowDown"), t;
}
const La = typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : !1;
function $a(r) {
  let e = r.split(/-(?!$)/), t = e[e.length - 1];
  t == "Space" && (t = " ");
  let n, i, s, o;
  for (let l = 0; l < e.length - 1; l++) {
    let a = e[l];
    if (/^(cmd|meta|m)$/i.test(a))
      o = !0;
    else if (/^a(lt)?$/i.test(a))
      n = !0;
    else if (/^(c|ctrl|control)$/i.test(a))
      i = !0;
    else if (/^s(hift)?$/i.test(a))
      s = !0;
    else if (/^mod$/i.test(a))
      La ? o = !0 : i = !0;
    else
      throw new Error("Unrecognized modifier name: " + a);
  }
  return n && (t = "Alt-" + t), i && (t = "Ctrl-" + t), o && (t = "Meta-" + t), s && (t = "Shift-" + t), t;
}
function Wa(r) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let t in r)
    e[$a(t)] = r[t];
  return e;
}
function Sn(r, e, t = !0) {
  return e.altKey && (r = "Alt-" + r), e.ctrlKey && (r = "Ctrl-" + r), e.metaKey && (r = "Meta-" + r), t && e.shiftKey && (r = "Shift-" + r), r;
}
function Ja(r) {
  return new oe({ props: { handleKeyDown: ja(r) } });
}
function ja(r) {
  let e = Wa(r);
  return function(t, n) {
    let i = Va(n), s, o = e[Sn(i, n)];
    if (o && o(t.state, t.dispatch, t))
      return !0;
    if (i.length == 1 && i != " ") {
      if (n.shiftKey) {
        let l = e[Sn(i, n, !1)];
        if (l && l(t.state, t.dispatch, t))
          return !0;
      }
      if ((n.shiftKey || n.altKey || n.metaKey || i.charCodeAt(0) > 127) && (s = Oe[n.keyCode]) && s != i) {
        let l = e[Sn(s, n)];
        if (l && l(t.state, t.dispatch, t))
          return !0;
      }
    }
    return !1;
  };
}
const ir = (r, e) => r.selection.empty ? !1 : (e && e(r.tr.deleteSelection().scrollIntoView()), !0);
function vs(r, e) {
  let { $cursor: t } = r.selection;
  return !t || (e ? !e.endOfTextblock("backward", r) : t.parentOffset > 0) ? null : t;
}
const Ps = (r, e, t) => {
  let n = vs(r, t);
  if (!n)
    return !1;
  let i = sr(n);
  if (!i) {
    let o = n.blockRange(), l = o && et(o);
    return l == null ? !1 : (e && e(r.tr.lift(o, l).scrollIntoView()), !0);
  }
  let s = i.nodeBefore;
  if (js(r, i, e, -1))
    return !0;
  if (n.parent.content.size == 0 && (Ze(s, "end") || S.isSelectable(s)))
    for (let o = n.depth; ; o--) {
      let l = Gt(r.doc, n.before(o), n.after(o), k.empty);
      if (l && l.slice.size < l.to - l.from) {
        if (e) {
          let a = r.tr.step(l);
          a.setSelection(Ze(s, "end") ? N.findFrom(a.doc.resolve(a.mapping.map(i.pos, -1)), -1) : S.create(a.doc, i.pos - s.nodeSize)), e(a.scrollIntoView());
        }
        return !0;
      }
      if (o == 1 || n.node(o - 1).childCount > 1)
        break;
    }
  return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos - s.nodeSize, i.pos).scrollIntoView()), !0) : !1;
}, qa = (r, e, t) => {
  let n = vs(r, t);
  if (!n)
    return !1;
  let i = sr(n);
  return i ? Bs(r, i, e) : !1;
}, Ka = (r, e, t) => {
  let n = Fs(r, t);
  if (!n)
    return !1;
  let i = or(n);
  return i ? Bs(r, i, e) : !1;
};
function Bs(r, e, t) {
  let n = e.nodeBefore, i = n, s = e.pos - 1;
  for (; !i.isTextblock; s--) {
    if (i.type.spec.isolating)
      return !1;
    let f = i.lastChild;
    if (!f)
      return !1;
    i = f;
  }
  let o = e.nodeAfter, l = o, a = e.pos + 1;
  for (; !l.isTextblock; a++) {
    if (l.type.spec.isolating)
      return !1;
    let f = l.firstChild;
    if (!f)
      return !1;
    l = f;
  }
  let c = Gt(r.doc, s, a, k.empty);
  if (!c || c.from != s || c instanceof P && c.slice.size >= a - s)
    return !1;
  if (t) {
    let f = r.tr.step(c);
    f.setSelection(O.create(f.doc, s)), t(f.scrollIntoView());
  }
  return !0;
}
function Ze(r, e, t = !1) {
  for (let n = r; n; n = e == "start" ? n.firstChild : n.lastChild) {
    if (n.isTextblock)
      return !0;
    if (t && n.childCount != 1)
      return !1;
  }
  return !1;
}
const zs = (r, e, t) => {
  let { $head: n, empty: i } = r.selection, s = n;
  if (!i)
    return !1;
  if (n.parent.isTextblock) {
    if (t ? !t.endOfTextblock("backward", r) : n.parentOffset > 0)
      return !1;
    s = sr(n);
  }
  let o = s && s.nodeBefore;
  return !o || !S.isSelectable(o) ? !1 : (e && e(r.tr.setSelection(S.create(r.doc, s.pos - o.nodeSize)).scrollIntoView()), !0);
};
function sr(r) {
  if (!r.parent.type.spec.isolating)
    for (let e = r.depth - 1; e >= 0; e--) {
      if (r.index(e) > 0)
        return r.doc.resolve(r.before(e + 1));
      if (r.node(e).type.spec.isolating)
        break;
    }
  return null;
}
function Fs(r, e) {
  let { $cursor: t } = r.selection;
  return !t || (e ? !e.endOfTextblock("forward", r) : t.parentOffset < t.parent.content.size) ? null : t;
}
const Vs = (r, e, t) => {
  let n = Fs(r, t);
  if (!n)
    return !1;
  let i = or(n);
  if (!i)
    return !1;
  let s = i.nodeAfter;
  if (js(r, i, e, 1))
    return !0;
  if (n.parent.content.size == 0 && (Ze(s, "start") || S.isSelectable(s))) {
    let o = Gt(r.doc, n.before(), n.after(), k.empty);
    if (o && o.slice.size < o.to - o.from) {
      if (e) {
        let l = r.tr.step(o);
        l.setSelection(Ze(s, "start") ? N.findFrom(l.doc.resolve(l.mapping.map(i.pos)), 1) : S.create(l.doc, l.mapping.map(i.pos))), e(l.scrollIntoView());
      }
      return !0;
    }
  }
  return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos, i.pos + s.nodeSize).scrollIntoView()), !0) : !1;
}, Ls = (r, e, t) => {
  let { $head: n, empty: i } = r.selection, s = n;
  if (!i)
    return !1;
  if (n.parent.isTextblock) {
    if (t ? !t.endOfTextblock("forward", r) : n.parentOffset < n.parent.content.size)
      return !1;
    s = or(n);
  }
  let o = s && s.nodeAfter;
  return !o || !S.isSelectable(o) ? !1 : (e && e(r.tr.setSelection(S.create(r.doc, s.pos)).scrollIntoView()), !0);
};
function or(r) {
  if (!r.parent.type.spec.isolating)
    for (let e = r.depth - 1; e >= 0; e--) {
      let t = r.node(e);
      if (r.index(e) + 1 < t.childCount)
        return r.doc.resolve(r.after(e + 1));
      if (t.type.spec.isolating)
        break;
    }
  return null;
}
const Ha = (r, e) => {
  let t = r.selection, n = t instanceof S, i;
  if (n) {
    if (t.node.isTextblock || !Ne(r.doc, t.from))
      return !1;
    i = t.from;
  } else if (i = Ut(r.doc, t.from, -1), i == null)
    return !1;
  if (e) {
    let s = r.tr.join(i);
    n && s.setSelection(S.create(s.doc, i - r.doc.resolve(i).nodeBefore.nodeSize)), e(s.scrollIntoView());
  }
  return !0;
}, Ua = (r, e) => {
  let t = r.selection, n;
  if (t instanceof S) {
    if (t.node.isTextblock || !Ne(r.doc, t.to))
      return !1;
    n = t.to;
  } else if (n = Ut(r.doc, t.to, 1), n == null)
    return !1;
  return e && e(r.tr.join(n).scrollIntoView()), !0;
}, Ga = (r, e) => {
  let { $from: t, $to: n } = r.selection, i = t.blockRange(n), s = i && et(i);
  return s == null ? !1 : (e && e(r.tr.lift(i, s).scrollIntoView()), !0);
}, $s = (r, e) => {
  let { $head: t, $anchor: n } = r.selection;
  return !t.parent.type.spec.code || !t.sameParent(n) ? !1 : (e && e(r.tr.insertText(`
`).scrollIntoView()), !0);
};
function lr(r) {
  for (let e = 0; e < r.edgeCount; e++) {
    let { type: t } = r.edge(e);
    if (t.isTextblock && !t.hasRequiredAttrs())
      return t;
  }
  return null;
}
const Ya = (r, e) => {
  let { $head: t, $anchor: n } = r.selection;
  if (!t.parent.type.spec.code || !t.sameParent(n))
    return !1;
  let i = t.node(-1), s = t.indexAfter(-1), o = lr(i.contentMatchAt(s));
  if (!o || !i.canReplaceWith(s, s, o))
    return !1;
  if (e) {
    let l = t.after(), a = r.tr.replaceWith(l, l, o.createAndFill());
    a.setSelection(N.near(a.doc.resolve(l), 1)), e(a.scrollIntoView());
  }
  return !0;
}, Ws = (r, e) => {
  let t = r.selection, { $from: n, $to: i } = t;
  if (t instanceof _ || n.parent.inlineContent || i.parent.inlineContent)
    return !1;
  let s = lr(i.parent.contentMatchAt(i.indexAfter()));
  if (!s || !s.isTextblock)
    return !1;
  if (e) {
    let o = (!n.parentOffset && i.index() < i.parent.childCount ? n : i).pos, l = r.tr.insert(o, s.createAndFill());
    l.setSelection(O.create(l.doc, o + 1)), e(l.scrollIntoView());
  }
  return !0;
}, Js = (r, e) => {
  let { $cursor: t } = r.selection;
  if (!t || t.parent.content.size)
    return !1;
  if (t.depth > 1 && t.after() != t.end(-1)) {
    let s = t.before();
    if (de(r.doc, s))
      return e && e(r.tr.split(s).scrollIntoView()), !0;
  }
  let n = t.blockRange(), i = n && et(n);
  return i == null ? !1 : (e && e(r.tr.lift(n, i).scrollIntoView()), !0);
};
function _a(r) {
  return (e, t) => {
    let { $from: n, $to: i } = e.selection;
    if (e.selection instanceof S && e.selection.node.isBlock)
      return !n.parentOffset || !de(e.doc, n.pos) ? !1 : (t && t(e.tr.split(n.pos).scrollIntoView()), !0);
    if (!n.depth)
      return !1;
    let s = [], o, l, a = !1, c = !1;
    for (let h = n.depth; ; h--)
      if (n.node(h).isBlock) {
        a = n.end(h) == n.pos + (n.depth - h), c = n.start(h) == n.pos - (n.depth - h), l = lr(n.node(h - 1).contentMatchAt(n.indexAfter(h - 1))), s.unshift(a && l ? { type: l } : null), o = h;
        break;
      } else {
        if (h == 1)
          return !1;
        s.unshift(null);
      }
    let f = e.tr;
    (e.selection instanceof O || e.selection instanceof _) && f.deleteSelection();
    let d = f.mapping.map(n.pos), u = de(f.doc, d, s.length, s);
    if (u || (s[0] = l ? { type: l } : null, u = de(f.doc, d, s.length, s)), f.split(d, s.length, s), !a && c && n.node(o).type != l) {
      let h = f.mapping.map(n.before(o)), p = f.doc.resolve(h);
      l && n.node(o - 1).canReplaceWith(p.index(), p.index() + 1, l) && f.setNodeMarkup(f.mapping.map(n.before(o)), l);
    }
    return t && t(f.scrollIntoView()), !0;
  };
}
const Xa = _a(), Qa = (r, e) => {
  let { $from: t, to: n } = r.selection, i, s = t.sharedDepth(n);
  return s == 0 ? !1 : (i = t.before(s), e && e(r.tr.setSelection(S.create(r.doc, i))), !0);
};
function Za(r, e, t) {
  let n = e.nodeBefore, i = e.nodeAfter, s = e.index();
  return !n || !i || !n.type.compatibleContent(i.type) ? !1 : !n.content.size && e.parent.canReplace(s - 1, s) ? (t && t(r.tr.delete(e.pos - n.nodeSize, e.pos).scrollIntoView()), !0) : !e.parent.canReplace(s, s + 1) || !(i.isTextblock || Ne(r.doc, e.pos)) ? !1 : (t && t(r.tr.join(e.pos).scrollIntoView()), !0);
}
function js(r, e, t, n) {
  let i = e.nodeBefore, s = e.nodeAfter, o, l, a = i.type.spec.isolating || s.type.spec.isolating;
  if (!a && Za(r, e, t))
    return !0;
  let c = !a && e.parent.canReplace(e.index(), e.index() + 1);
  if (c && (o = (l = i.contentMatchAt(i.childCount)).findWrapping(s.type)) && l.matchType(o[0] || s.type).validEnd) {
    if (t) {
      let h = e.pos + s.nodeSize, p = b.empty;
      for (let y = o.length - 1; y >= 0; y--)
        p = b.from(o[y].create(null, p));
      p = b.from(i.copy(p));
      let m = r.tr.step(new B(e.pos - 1, h, e.pos, h, new k(p, 1, 0), o.length, !0)), g = m.doc.resolve(h + 2 * o.length);
      g.nodeAfter && g.nodeAfter.type == i.type && Ne(m.doc, g.pos) && m.join(g.pos), t(m.scrollIntoView());
    }
    return !0;
  }
  let f = s.type.spec.isolating || n > 0 && a ? null : N.findFrom(e, 1), d = f && f.$from.blockRange(f.$to), u = d && et(d);
  if (u != null && u >= e.depth)
    return t && t(r.tr.lift(d, u).scrollIntoView()), !0;
  if (c && Ze(s, "start", !0) && Ze(i, "end")) {
    let h = i, p = [];
    for (; p.push(h), !h.isTextblock; )
      h = h.lastChild;
    let m = s, g = 1;
    for (; !m.isTextblock; m = m.firstChild)
      g++;
    if (h.canReplace(h.childCount, h.childCount, m.content)) {
      if (t) {
        let y = b.empty;
        for (let M = p.length - 1; M >= 0; M--)
          y = b.from(p[M].copy(y));
        let C = r.tr.step(new B(e.pos - p.length, e.pos + s.nodeSize, e.pos + g, e.pos + s.nodeSize - g, new k(y, p.length, 0), 0, !0));
        t(C.scrollIntoView());
      }
      return !0;
    }
  }
  return !1;
}
function qs(r) {
  return function(e, t) {
    let n = e.selection, i = r < 0 ? n.$from : n.$to, s = i.depth;
    for (; i.node(s).isInline; ) {
      if (!s)
        return !1;
      s--;
    }
    return i.node(s).isTextblock ? (t && t(e.tr.setSelection(O.create(e.doc, r < 0 ? i.start(s) : i.end(s)))), !0) : !1;
  };
}
const ec = qs(-1), tc = qs(1);
function nc(r, e = null) {
  return function(t, n) {
    let { $from: i, $to: s } = t.selection, o = i.blockRange(s), l = o && Un(o, r, e);
    return l ? (n && n(t.tr.wrap(o, l).scrollIntoView()), !0) : !1;
  };
}
function ui(r, e = null) {
  return function(t, n) {
    let i = !1;
    for (let s = 0; s < t.selection.ranges.length && !i; s++) {
      let { $from: { pos: o }, $to: { pos: l } } = t.selection.ranges[s];
      t.doc.nodesBetween(o, l, (a, c) => {
        if (i)
          return !1;
        if (!(!a.isTextblock || a.hasMarkup(r, e)))
          if (a.type == r)
            i = !0;
          else {
            let f = t.doc.resolve(c), d = f.index();
            i = f.parent.canReplaceWith(d, d + 1, r);
          }
      });
    }
    if (!i)
      return !1;
    if (n) {
      let s = t.tr;
      for (let o = 0; o < t.selection.ranges.length; o++) {
        let { $from: { pos: l }, $to: { pos: a } } = t.selection.ranges[o];
        s.setBlockType(l, a, r, e);
      }
      n(s.scrollIntoView());
    }
    return !0;
  };
}
function ar(...r) {
  return function(e, t, n) {
    for (let i = 0; i < r.length; i++)
      if (r[i](e, t, n))
        return !0;
    return !1;
  };
}
ar(ir, Ps, zs);
ar(ir, Vs, Ls);
ar($s, Ws, Js, Xa);
typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < "u" && os.platform && os.platform() == "darwin";
function rc(r, e = null) {
  return function(t, n) {
    let { $from: i, $to: s } = t.selection, o = i.blockRange(s);
    if (!o)
      return !1;
    let l = n ? t.tr : null;
    return ic(l, o, r, e) ? (n && n(l.scrollIntoView()), !0) : !1;
  };
}
function ic(r, e, t, n = null) {
  let i = !1, s = e, o = e.$from.doc;
  if (e.depth >= 2 && e.$from.node(e.depth - 1).type.compatibleContent(t) && e.startIndex == 0) {
    if (e.$from.index(e.depth - 1) == 0)
      return !1;
    let a = o.resolve(e.start - 2);
    s = new zt(a, a, e.depth), e.endIndex < e.parent.childCount && (e = new zt(e.$from, o.resolve(e.$to.end(e.depth)), e.depth)), i = !0;
  }
  let l = Un(s, t, n, e);
  return l ? (r && sc(r, e, l, i, t), !0) : !1;
}
function sc(r, e, t, n, i) {
  let s = b.empty;
  for (let f = t.length - 1; f >= 0; f--)
    s = b.from(t[f].type.create(t[f].attrs, s));
  r.step(new B(e.start - (n ? 2 : 0), e.end, e.start, e.end, new k(s, 0, 0), t.length, !0));
  let o = 0;
  for (let f = 0; f < t.length; f++)
    t[f].type == i && (o = f + 1);
  let l = t.length - o, a = e.start + t.length - (n ? 2 : 0), c = e.parent;
  for (let f = e.startIndex, d = e.endIndex, u = !0; f < d; f++, u = !1)
    !u && de(r.doc, a, l) && (r.split(a, l), a += 2 * l), a += c.child(f).nodeSize;
  return r;
}
function oc(r) {
  return function(e, t) {
    let { $from: n, $to: i } = e.selection, s = n.blockRange(i, (o) => o.childCount > 0 && o.firstChild.type == r);
    return s ? t ? n.node(s.depth - 1).type == r ? lc(e, t, r, s) : ac(e, t, s) : !0 : !1;
  };
}
function lc(r, e, t, n) {
  let i = r.tr, s = n.end, o = n.$to.end(n.depth);
  s < o && (i.step(new B(s - 1, o, s, o, new k(b.from(t.create(null, n.parent.copy())), 1, 0), 1, !0)), n = new zt(i.doc.resolve(n.$from.pos), i.doc.resolve(o), n.depth));
  const l = et(n);
  if (l == null)
    return !1;
  i.lift(n, l);
  let a = i.mapping.map(s, -1) - 1;
  return Ne(i.doc, a) && i.join(a), e(i.scrollIntoView()), !0;
}
function ac(r, e, t) {
  let n = r.tr, i = t.parent;
  for (let h = t.end, p = t.endIndex - 1, m = t.startIndex; p > m; p--)
    h -= i.child(p).nodeSize, n.delete(h - 1, h + 1);
  let s = n.doc.resolve(t.start), o = s.nodeAfter;
  if (n.mapping.map(t.end) != t.start + s.nodeAfter.nodeSize)
    return !1;
  let l = t.startIndex == 0, a = t.endIndex == i.childCount, c = s.node(-1), f = s.index(-1);
  if (!c.canReplace(f + (l ? 0 : 1), f + 1, o.content.append(a ? b.empty : b.from(i))))
    return !1;
  let d = s.pos, u = d + o.nodeSize;
  return n.step(new B(d - (l ? 1 : 0), u + (a ? 1 : 0), d + 1, u - 1, new k((l ? b.empty : b.from(i.copy(b.empty))).append(a ? b.empty : b.from(i.copy(b.empty))), l ? 0 : 1, a ? 0 : 1), l ? 0 : 1)), e(n.scrollIntoView()), !0;
}
function cc(r) {
  return function(e, t) {
    let { $from: n, $to: i } = e.selection, s = n.blockRange(i, (c) => c.childCount > 0 && c.firstChild.type == r);
    if (!s)
      return !1;
    let o = s.startIndex;
    if (o == 0)
      return !1;
    let l = s.parent, a = l.child(o - 1);
    if (a.type != r)
      return !1;
    if (t) {
      let c = a.lastChild && a.lastChild.type == l.type, f = b.from(c ? r.create() : null), d = new k(b.from(r.create(null, b.from(l.type.create(null, f)))), c ? 3 : 1, 0), u = s.start, h = s.end;
      t(e.tr.step(new B(u - (c ? 3 : 1), h, u, h, d, 1, !0)).scrollIntoView());
    }
    return !0;
  };
}
function Zt(r) {
  const { state: e, transaction: t } = r;
  let { selection: n } = t, { doc: i } = t, { storedMarks: s } = t;
  return {
    ...e,
    apply: e.apply.bind(e),
    applyTransaction: e.applyTransaction.bind(e),
    plugins: e.plugins,
    schema: e.schema,
    reconfigure: e.reconfigure.bind(e),
    toJSON: e.toJSON.bind(e),
    get storedMarks() {
      return s;
    },
    get selection() {
      return n;
    },
    get doc() {
      return i;
    },
    get tr() {
      return n = t.selection, i = t.doc, s = t.storedMarks, t;
    }
  };
}
class en {
  constructor(e) {
    this.editor = e.editor, this.rawCommands = this.editor.extensionManager.commands, this.customState = e.state;
  }
  get hasCustomState() {
    return !!this.customState;
  }
  get state() {
    return this.customState || this.editor.state;
  }
  get commands() {
    const { rawCommands: e, editor: t, state: n } = this, { view: i } = t, { tr: s } = n, o = this.buildProps(s);
    return Object.fromEntries(Object.entries(e).map(([l, a]) => [l, (...f) => {
      const d = a(...f)(o);
      return !s.getMeta("preventDispatch") && !this.hasCustomState && i.dispatch(s), d;
    }]));
  }
  get chain() {
    return () => this.createChain();
  }
  get can() {
    return () => this.createCan();
  }
  createChain(e, t = !0) {
    const { rawCommands: n, editor: i, state: s } = this, { view: o } = i, l = [], a = !!e, c = e || s.tr, f = () => (!a && t && !c.getMeta("preventDispatch") && !this.hasCustomState && o.dispatch(c), l.every((u) => u === !0)), d = {
      ...Object.fromEntries(Object.entries(n).map(([u, h]) => [u, (...m) => {
        const g = this.buildProps(c, t), y = h(...m)(g);
        return l.push(y), d;
      }])),
      run: f
    };
    return d;
  }
  createCan(e) {
    const { rawCommands: t, state: n } = this, i = !1, s = e || n.tr, o = this.buildProps(s, i);
    return {
      ...Object.fromEntries(Object.entries(t).map(([a, c]) => [a, (...f) => c(...f)({ ...o, dispatch: void 0 })])),
      chain: () => this.createChain(s, i)
    };
  }
  buildProps(e, t = !0) {
    const { rawCommands: n, editor: i, state: s } = this, { view: o } = i, l = {
      tr: e,
      editor: i,
      view: o,
      state: Zt({
        state: s,
        transaction: e
      }),
      dispatch: t ? () => {
      } : void 0,
      chain: () => this.createChain(e, t),
      can: () => this.createCan(e),
      get commands() {
        return Object.fromEntries(Object.entries(n).map(([a, c]) => [a, (...f) => c(...f)(l)]));
      }
    };
    return l;
  }
}
class fc {
  constructor() {
    this.callbacks = {};
  }
  on(e, t) {
    return this.callbacks[e] || (this.callbacks[e] = []), this.callbacks[e].push(t), this;
  }
  emit(e, ...t) {
    const n = this.callbacks[e];
    return n && n.forEach((i) => i.apply(this, t)), this;
  }
  off(e, t) {
    const n = this.callbacks[e];
    return n && (t ? this.callbacks[e] = n.filter((i) => i !== t) : delete this.callbacks[e]), this;
  }
  once(e, t) {
    const n = (...i) => {
      this.off(e, n), t.apply(this, i);
    };
    return this.on(e, n);
  }
  removeAllListeners() {
    this.callbacks = {};
  }
}
function x(r, e, t) {
  return r.config[e] === void 0 && r.parent ? x(r.parent, e, t) : typeof r.config[e] == "function" ? r.config[e].bind({
    ...t,
    parent: r.parent ? x(r.parent, e, t) : null
  }) : r.config[e];
}
function tn(r) {
  const e = r.filter((i) => i.type === "extension"), t = r.filter((i) => i.type === "node"), n = r.filter((i) => i.type === "mark");
  return {
    baseExtensions: e,
    nodeExtensions: t,
    markExtensions: n
  };
}
function Ks(r) {
  const e = [], { nodeExtensions: t, markExtensions: n } = tn(r), i = [...t, ...n], s = {
    default: null,
    rendered: !0,
    renderHTML: null,
    parseHTML: null,
    keepOnSplit: !0,
    isRequired: !1
  };
  return r.forEach((o) => {
    const l = {
      name: o.name,
      options: o.options,
      storage: o.storage,
      extensions: i
    }, a = x(o, "addGlobalAttributes", l);
    if (!a)
      return;
    a().forEach((f) => {
      f.types.forEach((d) => {
        Object.entries(f.attributes).forEach(([u, h]) => {
          e.push({
            type: d,
            name: u,
            attribute: {
              ...s,
              ...h
            }
          });
        });
      });
    });
  }), i.forEach((o) => {
    const l = {
      name: o.name,
      options: o.options,
      storage: o.storage
    }, a = x(o, "addAttributes", l);
    if (!a)
      return;
    const c = a();
    Object.entries(c).forEach(([f, d]) => {
      const u = {
        ...s,
        ...d
      };
      typeof (u == null ? void 0 : u.default) == "function" && (u.default = u.default()), u != null && u.isRequired && (u == null ? void 0 : u.default) === void 0 && delete u.default, e.push({
        type: o.name,
        name: f,
        attribute: u
      });
    });
  }), e;
}
function z(r, e) {
  if (typeof r == "string") {
    if (!e.nodes[r])
      throw Error(`There is no node type named '${r}'. Maybe you forgot to add the extension?`);
    return e.nodes[r];
  }
  return r;
}
function dc(...r) {
  return r.filter((e) => !!e).reduce((e, t) => {
    const n = { ...e };
    return Object.entries(t).forEach(([i, s]) => {
      if (!n[i]) {
        n[i] = s;
        return;
      }
      if (i === "class") {
        const l = s ? String(s).split(" ") : [], a = n[i] ? n[i].split(" ") : [], c = l.filter((f) => !a.includes(f));
        n[i] = [...a, ...c].join(" ");
      } else if (i === "style") {
        const l = s ? s.split(";").map((f) => f.trim()).filter(Boolean) : [], a = n[i] ? n[i].split(";").map((f) => f.trim()).filter(Boolean) : [], c = /* @__PURE__ */ new Map();
        a.forEach((f) => {
          const [d, u] = f.split(":").map((h) => h.trim());
          c.set(d, u);
        }), l.forEach((f) => {
          const [d, u] = f.split(":").map((h) => h.trim());
          c.set(d, u);
        }), n[i] = Array.from(c.entries()).map(([f, d]) => `${f}: ${d}`).join("; ");
      } else
        n[i] = s;
    }), n;
  }, {});
}
function Wn(r, e) {
  return e.filter((t) => t.type === r.type.name).filter((t) => t.attribute.rendered).map((t) => t.attribute.renderHTML ? t.attribute.renderHTML(r.attrs) || {} : {
    [t.name]: r.attrs[t.name]
  }).reduce((t, n) => dc(t, n), {});
}
function Hs(r) {
  return typeof r == "function";
}
function w(r, e = void 0, ...t) {
  return Hs(r) ? e ? r.bind(e)(...t) : r(...t) : r;
}
function uc(r = {}) {
  return Object.keys(r).length === 0 && r.constructor === Object;
}
function hc(r) {
  return typeof r != "string" ? r : r.match(/^[+-]?(?:\d*\.)?\d+$/) ? Number(r) : r === "true" ? !0 : r === "false" ? !1 : r;
}
function hi(r, e) {
  return "style" in r ? r : {
    ...r,
    getAttrs: (t) => {
      const n = r.getAttrs ? r.getAttrs(t) : r.attrs;
      if (n === !1)
        return !1;
      const i = e.reduce((s, o) => {
        const l = o.attribute.parseHTML ? o.attribute.parseHTML(t) : hc(t.getAttribute(o.name));
        return l == null ? s : {
          ...s,
          [o.name]: l
        };
      }, {});
      return { ...n, ...i };
    }
  };
}
function pi(r) {
  return Object.fromEntries(
    // @ts-ignore
    Object.entries(r).filter(([e, t]) => e === "attrs" && uc(t) ? !1 : t != null)
  );
}
function pc(r, e) {
  var t;
  const n = Ks(r), { nodeExtensions: i, markExtensions: s } = tn(r), o = (t = i.find((c) => x(c, "topNode"))) === null || t === void 0 ? void 0 : t.name, l = Object.fromEntries(i.map((c) => {
    const f = n.filter((y) => y.type === c.name), d = {
      name: c.name,
      options: c.options,
      storage: c.storage,
      editor: e
    }, u = r.reduce((y, C) => {
      const M = x(C, "extendNodeSchema", d);
      return {
        ...y,
        ...M ? M(c) : {}
      };
    }, {}), h = pi({
      ...u,
      content: w(x(c, "content", d)),
      marks: w(x(c, "marks", d)),
      group: w(x(c, "group", d)),
      inline: w(x(c, "inline", d)),
      atom: w(x(c, "atom", d)),
      selectable: w(x(c, "selectable", d)),
      draggable: w(x(c, "draggable", d)),
      code: w(x(c, "code", d)),
      whitespace: w(x(c, "whitespace", d)),
      linebreakReplacement: w(x(c, "linebreakReplacement", d)),
      defining: w(x(c, "defining", d)),
      isolating: w(x(c, "isolating", d)),
      attrs: Object.fromEntries(f.map((y) => {
        var C;
        return [y.name, { default: (C = y == null ? void 0 : y.attribute) === null || C === void 0 ? void 0 : C.default }];
      }))
    }), p = w(x(c, "parseHTML", d));
    p && (h.parseDOM = p.map((y) => hi(y, f)));
    const m = x(c, "renderHTML", d);
    m && (h.toDOM = (y) => m({
      node: y,
      HTMLAttributes: Wn(y, f)
    }));
    const g = x(c, "renderText", d);
    return g && (h.toText = g), [c.name, h];
  })), a = Object.fromEntries(s.map((c) => {
    const f = n.filter((g) => g.type === c.name), d = {
      name: c.name,
      options: c.options,
      storage: c.storage,
      editor: e
    }, u = r.reduce((g, y) => {
      const C = x(y, "extendMarkSchema", d);
      return {
        ...g,
        ...C ? C(c) : {}
      };
    }, {}), h = pi({
      ...u,
      inclusive: w(x(c, "inclusive", d)),
      excludes: w(x(c, "excludes", d)),
      group: w(x(c, "group", d)),
      spanning: w(x(c, "spanning", d)),
      code: w(x(c, "code", d)),
      attrs: Object.fromEntries(f.map((g) => {
        var y;
        return [g.name, { default: (y = g == null ? void 0 : g.attribute) === null || y === void 0 ? void 0 : y.default }];
      }))
    }), p = w(x(c, "parseHTML", d));
    p && (h.parseDOM = p.map((g) => hi(g, f)));
    const m = x(c, "renderHTML", d);
    return m && (h.toDOM = (g) => m({
      mark: g,
      HTMLAttributes: Wn(g, f)
    })), [c.name, h];
  }));
  return new Bi({
    topNode: o,
    nodes: l,
    marks: a
  });
}
function Cn(r, e) {
  return e.nodes[r] || e.marks[r] || null;
}
function mi(r, e) {
  return Array.isArray(e) ? e.some((t) => (typeof t == "string" ? t : t.name) === r.name) : e;
}
function cr(r, e) {
  const t = $e.fromSchema(e).serializeFragment(r), i = document.implementation.createHTMLDocument().createElement("div");
  return i.appendChild(t), i.innerHTML;
}
const mc = (r, e = 500) => {
  let t = "";
  const n = r.parentOffset;
  return r.parent.nodesBetween(Math.max(0, n - e), n, (i, s, o, l) => {
    var a, c;
    const f = ((c = (a = i.type.spec).toText) === null || c === void 0 ? void 0 : c.call(a, {
      node: i,
      pos: s,
      parent: o,
      index: l
    })) || i.textContent || "%leaf%";
    t += i.isAtom && !i.isText ? f : f.slice(0, Math.max(0, n - s));
  }), t;
};
function fr(r) {
  return Object.prototype.toString.call(r) === "[object RegExp]";
}
class nn {
  constructor(e) {
    this.find = e.find, this.handler = e.handler;
  }
}
const gc = (r, e) => {
  if (fr(e))
    return e.exec(r);
  const t = e(r);
  if (!t)
    return null;
  const n = [t.text];
  return n.index = t.index, n.input = r, n.data = t.data, t.replaceWith && (t.text.includes(t.replaceWith) || console.warn('[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".'), n.push(t.replaceWith)), n;
};
function Nt(r) {
  var e;
  const { editor: t, from: n, to: i, text: s, rules: o, plugin: l } = r, { view: a } = t;
  if (a.composing)
    return !1;
  const c = a.state.doc.resolve(n);
  if (
    // check for code node
    c.parent.type.spec.code || !((e = c.nodeBefore || c.nodeAfter) === null || e === void 0) && e.marks.find((u) => u.type.spec.code)
  )
    return !1;
  let f = !1;
  const d = mc(c) + s;
  return o.forEach((u) => {
    if (f)
      return;
    const h = gc(d, u.find);
    if (!h)
      return;
    const p = a.state.tr, m = Zt({
      state: a.state,
      transaction: p
    }), g = {
      from: n - (h[0].length - s.length),
      to: i
    }, { commands: y, chain: C, can: M } = new en({
      editor: t,
      state: m
    });
    u.handler({
      state: m,
      range: g,
      match: h,
      commands: y,
      chain: C,
      can: M
    }) === null || !p.steps.length || (p.setMeta(l, {
      transform: p,
      from: n,
      to: i,
      text: s
    }), a.dispatch(p), f = !0);
  }), f;
}
function yc(r) {
  const { editor: e, rules: t } = r, n = new oe({
    state: {
      init() {
        return null;
      },
      apply(i, s, o) {
        const l = i.getMeta(n);
        if (l)
          return l;
        const a = i.getMeta("applyInputRules");
        return !!a && setTimeout(() => {
          let { text: f } = a;
          typeof f == "string" ? f = f : f = cr(b.from(f), o.schema);
          const { from: d } = a, u = d + f.length;
          Nt({
            editor: e,
            from: d,
            to: u,
            text: f,
            rules: t,
            plugin: n
          });
        }), i.selectionSet || i.docChanged ? null : s;
      }
    },
    props: {
      handleTextInput(i, s, o, l) {
        return Nt({
          editor: e,
          from: s,
          to: o,
          text: l,
          rules: t,
          plugin: n
        });
      },
      handleDOMEvents: {
        compositionend: (i) => (setTimeout(() => {
          const { $cursor: s } = i.state.selection;
          s && Nt({
            editor: e,
            from: s.pos,
            to: s.pos,
            text: "",
            rules: t,
            plugin: n
          });
        }), !1)
      },
      // add support for input rules to trigger on enter
      // this is useful for example for code blocks
      handleKeyDown(i, s) {
        if (s.key !== "Enter")
          return !1;
        const { $cursor: o } = i.state.selection;
        return o ? Nt({
          editor: e,
          from: o.pos,
          to: o.pos,
          text: `
`,
          rules: t,
          plugin: n
        }) : !1;
      }
    },
    // @ts-ignore
    isInputRules: !0
  });
  return n;
}
function bc(r) {
  return Object.prototype.toString.call(r).slice(8, -1);
}
function Tt(r) {
  return bc(r) !== "Object" ? !1 : r.constructor === Object && Object.getPrototypeOf(r) === Object.prototype;
}
function rn(r, e) {
  const t = { ...r };
  return Tt(r) && Tt(e) && Object.keys(e).forEach((n) => {
    Tt(e[n]) && Tt(r[n]) ? t[n] = rn(r[n], e[n]) : t[n] = e[n];
  }), t;
}
class qt {
  constructor(e = {}) {
    this.type = "mark", this.name = "mark", this.parent = null, this.child = null, this.config = {
      name: this.name,
      defaultOptions: {}
    }, this.config = {
      ...this.config,
      ...e
    }, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = w(x(this, "addOptions", {
      name: this.name
    }))), this.storage = w(x(this, "addStorage", {
      name: this.name,
      options: this.options
    })) || {};
  }
  static create(e = {}) {
    return new qt(e);
  }
  configure(e = {}) {
    const t = this.extend({
      ...this.config,
      addOptions: () => rn(this.options, e)
    });
    return t.name = this.name, t.parent = this.parent, t;
  }
  extend(e = {}) {
    const t = new qt(e);
    return t.parent = this, this.child = t, t.name = e.name ? e.name : t.parent.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${t.name}".`), t.options = w(x(t, "addOptions", {
      name: t.name
    })), t.storage = w(x(t, "addStorage", {
      name: t.name,
      options: t.options
    })), t;
  }
  static handleExit({ editor: e, mark: t }) {
    const { tr: n } = e.state, i = e.state.selection.$from;
    if (i.pos === i.end()) {
      const o = i.marks();
      if (!!!o.find((c) => (c == null ? void 0 : c.type.name) === t.name))
        return !1;
      const a = o.find((c) => (c == null ? void 0 : c.type.name) === t.name);
      return a && n.removeStoredMark(a), n.insertText(" ", i.pos), e.view.dispatch(n), !0;
    }
    return !1;
  }
}
function kc(r) {
  return typeof r == "number";
}
class Us {
  constructor(e) {
    this.find = e.find, this.handler = e.handler;
  }
}
const xc = (r, e, t) => {
  if (fr(e))
    return [...r.matchAll(e)];
  const n = e(r, t);
  return n ? n.map((i) => {
    const s = [i.text];
    return s.index = i.index, s.input = r, s.data = i.data, i.replaceWith && (i.text.includes(i.replaceWith) || console.warn('[tiptap warn]: "pasteRuleMatch.replaceWith" must be part of "pasteRuleMatch.text".'), s.push(i.replaceWith)), s;
  }) : [];
};
function Sc(r) {
  const { editor: e, state: t, from: n, to: i, rule: s, pasteEvent: o, dropEvent: l } = r, { commands: a, chain: c, can: f } = new en({
    editor: e,
    state: t
  }), d = [];
  return t.doc.nodesBetween(n, i, (h, p) => {
    if (!h.isTextblock || h.type.spec.code)
      return;
    const m = Math.max(n, p), g = Math.min(i, p + h.content.size), y = h.textBetween(m - p, g - p, void 0, "￼");
    xc(y, s.find, o).forEach((M) => {
      if (M.index === void 0)
        return;
      const D = m + M.index + 1, E = D + M[0].length, A = {
        from: t.tr.mapping.map(D),
        to: t.tr.mapping.map(E)
      }, U = s.handler({
        state: t,
        range: A,
        match: M,
        commands: a,
        chain: c,
        can: f,
        pasteEvent: o,
        dropEvent: l
      });
      d.push(U);
    });
  }), d.every((h) => h !== null);
}
let Et = null;
const Cc = (r) => {
  var e;
  const t = new ClipboardEvent("paste", {
    clipboardData: new DataTransfer()
  });
  return (e = t.clipboardData) === null || e === void 0 || e.setData("text/html", r), t;
};
function Mc(r) {
  const { editor: e, rules: t } = r;
  let n = null, i = !1, s = !1, o = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, l;
  try {
    l = typeof DragEvent < "u" ? new DragEvent("drop") : null;
  } catch {
    l = null;
  }
  const a = ({ state: f, from: d, to: u, rule: h, pasteEvt: p }) => {
    const m = f.tr, g = Zt({
      state: f,
      transaction: m
    });
    if (!(!Sc({
      editor: e,
      state: g,
      from: Math.max(d - 1, 0),
      to: u.b - 1,
      rule: h,
      pasteEvent: p,
      dropEvent: l
    }) || !m.steps.length)) {
      try {
        l = typeof DragEvent < "u" ? new DragEvent("drop") : null;
      } catch {
        l = null;
      }
      return o = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, m;
    }
  };
  return t.map((f) => new oe({
    // we register a global drag handler to track the current drag source element
    view(d) {
      const u = (p) => {
        var m;
        n = !((m = d.dom.parentElement) === null || m === void 0) && m.contains(p.target) ? d.dom.parentElement : null, n && (Et = e);
      }, h = () => {
        Et && (Et = null);
      };
      return window.addEventListener("dragstart", u), window.addEventListener("dragend", h), {
        destroy() {
          window.removeEventListener("dragstart", u), window.removeEventListener("dragend", h);
        }
      };
    },
    props: {
      handleDOMEvents: {
        drop: (d, u) => {
          if (s = n === d.dom.parentElement, l = u, !s) {
            const h = Et;
            h && setTimeout(() => {
              const p = h.state.selection;
              p && h.commands.deleteRange({ from: p.from, to: p.to });
            }, 10);
          }
          return !1;
        },
        paste: (d, u) => {
          var h;
          const p = (h = u.clipboardData) === null || h === void 0 ? void 0 : h.getData("text/html");
          return o = u, i = !!(p != null && p.includes("data-pm-slice")), !1;
        }
      }
    },
    appendTransaction: (d, u, h) => {
      const p = d[0], m = p.getMeta("uiEvent") === "paste" && !i, g = p.getMeta("uiEvent") === "drop" && !s, y = p.getMeta("applyPasteRules"), C = !!y;
      if (!m && !g && !C)
        return;
      if (C) {
        let { text: E } = y;
        typeof E == "string" ? E = E : E = cr(b.from(E), h.schema);
        const { from: A } = y, U = A + E.length, j = Cc(E);
        return a({
          rule: f,
          state: h,
          from: A,
          to: { b: U },
          pasteEvt: j
        });
      }
      const M = u.doc.content.findDiffStart(h.doc.content), D = u.doc.content.findDiffEnd(h.doc.content);
      if (!(!kc(M) || !D || M === D.b))
        return a({
          rule: f,
          state: h,
          from: M,
          to: D,
          pasteEvt: o
        });
    }
  }));
}
function wc(r) {
  const e = r.filter((t, n) => r.indexOf(t) !== n);
  return Array.from(new Set(e));
}
class Ue {
  constructor(e, t) {
    this.splittableMarks = [], this.editor = t, this.extensions = Ue.resolve(e), this.schema = pc(this.extensions, t), this.setupExtensions();
  }
  /**
   * Returns a flattened and sorted extension list while
   * also checking for duplicated extensions and warns the user.
   * @param extensions An array of Tiptap extensions
   * @returns An flattened and sorted array of Tiptap extensions
   */
  static resolve(e) {
    const t = Ue.sort(Ue.flatten(e)), n = wc(t.map((i) => i.name));
    return n.length && console.warn(`[tiptap warn]: Duplicate extension names found: [${n.map((i) => `'${i}'`).join(", ")}]. This can lead to issues.`), t;
  }
  /**
   * Create a flattened array of extensions by traversing the `addExtensions` field.
   * @param extensions An array of Tiptap extensions
   * @returns A flattened array of Tiptap extensions
   */
  static flatten(e) {
    return e.map((t) => {
      const n = {
        name: t.name,
        options: t.options,
        storage: t.storage
      }, i = x(t, "addExtensions", n);
      return i ? [t, ...this.flatten(i())] : t;
    }).flat(10);
  }
  /**
   * Sort extensions by priority.
   * @param extensions An array of Tiptap extensions
   * @returns A sorted array of Tiptap extensions by priority
   */
  static sort(e) {
    return e.sort((n, i) => {
      const s = x(n, "priority") || 100, o = x(i, "priority") || 100;
      return s > o ? -1 : s < o ? 1 : 0;
    });
  }
  /**
   * Get all commands from the extensions.
   * @returns An object with all commands where the key is the command name and the value is the command function
   */
  get commands() {
    return this.extensions.reduce((e, t) => {
      const n = {
        name: t.name,
        options: t.options,
        storage: t.storage,
        editor: this.editor,
        type: Cn(t.name, this.schema)
      }, i = x(t, "addCommands", n);
      return i ? {
        ...e,
        ...i()
      } : e;
    }, {});
  }
  /**
   * Get all registered Prosemirror plugins from the extensions.
   * @returns An array of Prosemirror plugins
   */
  get plugins() {
    const { editor: e } = this, t = Ue.sort([...this.extensions].reverse()), n = [], i = [], s = t.map((o) => {
      const l = {
        name: o.name,
        options: o.options,
        storage: o.storage,
        editor: e,
        type: Cn(o.name, this.schema)
      }, a = [], c = x(o, "addKeyboardShortcuts", l);
      let f = {};
      if (o.type === "mark" && x(o, "exitable", l) && (f.ArrowRight = () => qt.handleExit({ editor: e, mark: o })), c) {
        const m = Object.fromEntries(Object.entries(c()).map(([g, y]) => [g, () => y({ editor: e })]));
        f = { ...f, ...m };
      }
      const d = Ja(f);
      a.push(d);
      const u = x(o, "addInputRules", l);
      mi(o, e.options.enableInputRules) && u && n.push(...u());
      const h = x(o, "addPasteRules", l);
      mi(o, e.options.enablePasteRules) && h && i.push(...h());
      const p = x(o, "addProseMirrorPlugins", l);
      if (p) {
        const m = p();
        a.push(...m);
      }
      return a;
    }).flat();
    return [
      yc({
        editor: e,
        rules: n
      }),
      ...Mc({
        editor: e,
        rules: i
      }),
      ...s
    ];
  }
  /**
   * Get all attributes from the extensions.
   * @returns An array of attributes
   */
  get attributes() {
    return Ks(this.extensions);
  }
  /**
   * Get all node views from the extensions.
   * @returns An object with all node views where the key is the node name and the value is the node view function
   */
  get nodeViews() {
    const { editor: e } = this, { nodeExtensions: t } = tn(this.extensions);
    return Object.fromEntries(t.filter((n) => !!x(n, "addNodeView")).map((n) => {
      const i = this.attributes.filter((a) => a.type === n.name), s = {
        name: n.name,
        options: n.options,
        storage: n.storage,
        editor: e,
        type: z(n.name, this.schema)
      }, o = x(n, "addNodeView", s);
      if (!o)
        return [];
      const l = (a, c, f, d, u) => {
        const h = Wn(a, i);
        return o()({
          // pass-through
          node: a,
          view: c,
          getPos: f,
          decorations: d,
          innerDecorations: u,
          // tiptap-specific
          editor: e,
          extension: n,
          HTMLAttributes: h
        });
      };
      return [n.name, l];
    }));
  }
  /**
   * Go through all extensions, create extension storages & setup marks
   * & bind editor event listener.
   */
  setupExtensions() {
    this.extensions.forEach((e) => {
      var t;
      this.editor.extensionStorage[e.name] = e.storage;
      const n = {
        name: e.name,
        options: e.options,
        storage: e.storage,
        editor: this.editor,
        type: Cn(e.name, this.schema)
      };
      e.type === "mark" && (!((t = w(x(e, "keepOnSplit", n))) !== null && t !== void 0) || t) && this.splittableMarks.push(e.name);
      const i = x(e, "onBeforeCreate", n), s = x(e, "onCreate", n), o = x(e, "onUpdate", n), l = x(e, "onSelectionUpdate", n), a = x(e, "onTransaction", n), c = x(e, "onFocus", n), f = x(e, "onBlur", n), d = x(e, "onDestroy", n);
      i && this.editor.on("beforeCreate", i), s && this.editor.on("create", s), o && this.editor.on("update", o), l && this.editor.on("selectionUpdate", l), a && this.editor.on("transaction", a), c && this.editor.on("focus", c), f && this.editor.on("blur", f), d && this.editor.on("destroy", d);
    });
  }
}
class ne {
  constructor(e = {}) {
    this.type = "extension", this.name = "extension", this.parent = null, this.child = null, this.config = {
      name: this.name,
      defaultOptions: {}
    }, this.config = {
      ...this.config,
      ...e
    }, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = w(x(this, "addOptions", {
      name: this.name
    }))), this.storage = w(x(this, "addStorage", {
      name: this.name,
      options: this.options
    })) || {};
  }
  static create(e = {}) {
    return new ne(e);
  }
  configure(e = {}) {
    const t = this.extend({
      ...this.config,
      addOptions: () => rn(this.options, e)
    });
    return t.name = this.name, t.parent = this.parent, t;
  }
  extend(e = {}) {
    const t = new ne({ ...this.config, ...e });
    return t.parent = this, this.child = t, t.name = e.name ? e.name : t.parent.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${t.name}".`), t.options = w(x(t, "addOptions", {
      name: t.name
    })), t.storage = w(x(t, "addStorage", {
      name: t.name,
      options: t.options
    })), t;
  }
}
function Gs(r, e, t) {
  const { from: n, to: i } = e, { blockSeparator: s = `

`, textSerializers: o = {} } = t || {};
  let l = "";
  return r.nodesBetween(n, i, (a, c, f, d) => {
    var u;
    a.isBlock && c > n && (l += s);
    const h = o == null ? void 0 : o[a.type.name];
    if (h)
      return f && (l += h({
        node: a,
        pos: c,
        parent: f,
        index: d,
        range: e
      })), !1;
    a.isText && (l += (u = a == null ? void 0 : a.text) === null || u === void 0 ? void 0 : u.slice(Math.max(n, c) - c, i - c));
  }), l;
}
function Ys(r) {
  return Object.fromEntries(Object.entries(r.nodes).filter(([, e]) => e.spec.toText).map(([e, t]) => [e, t.spec.toText]));
}
const Oc = ne.create({
  name: "clipboardTextSerializer",
  addOptions() {
    return {
      blockSeparator: void 0
    };
  },
  addProseMirrorPlugins() {
    return [
      new oe({
        key: new We("clipboardTextSerializer"),
        props: {
          clipboardTextSerializer: () => {
            const { editor: r } = this, { state: e, schema: t } = r, { doc: n, selection: i } = e, { ranges: s } = i, o = Math.min(...s.map((f) => f.$from.pos)), l = Math.max(...s.map((f) => f.$to.pos)), a = Ys(t);
            return Gs(n, { from: o, to: l }, {
              ...this.options.blockSeparator !== void 0 ? { blockSeparator: this.options.blockSeparator } : {},
              textSerializers: a
            });
          }
        }
      })
    ];
  }
}), Nc = () => ({ editor: r, view: e }) => (requestAnimationFrame(() => {
  var t;
  r.isDestroyed || (e.dom.blur(), (t = window == null ? void 0 : window.getSelection()) === null || t === void 0 || t.removeAllRanges());
}), !0), Tc = (r = !1) => ({ commands: e }) => e.setContent("", r), Ec = () => ({ state: r, tr: e, dispatch: t }) => {
  const { selection: n } = e, { ranges: i } = n;
  return t && i.forEach(({ $from: s, $to: o }) => {
    r.doc.nodesBetween(s.pos, o.pos, (l, a) => {
      if (l.type.isText)
        return;
      const { doc: c, mapping: f } = e, d = c.resolve(f.map(a)), u = c.resolve(f.map(a + l.nodeSize)), h = d.blockRange(u);
      if (!h)
        return;
      const p = et(h);
      if (l.type.isTextblock) {
        const { defaultType: m } = d.parent.contentMatchAt(d.index());
        e.setNodeMarkup(h.start, m);
      }
      (p || p === 0) && e.lift(h, p);
    });
  }), !0;
}, Dc = (r) => (e) => r(e), Ac = () => ({ state: r, dispatch: e }) => Ws(r, e), Ic = (r, e) => ({ editor: t, tr: n }) => {
  const { state: i } = t, s = i.doc.slice(r.from, r.to);
  n.deleteRange(r.from, r.to);
  const o = n.mapping.map(e);
  return n.insert(o, s.content), n.setSelection(new O(n.doc.resolve(o - 1))), !0;
}, Rc = () => ({ tr: r, dispatch: e }) => {
  const { selection: t } = r, n = t.$anchor.node();
  if (n.content.size > 0)
    return !1;
  const i = r.selection.$anchor;
  for (let s = i.depth; s > 0; s -= 1)
    if (i.node(s).type === n.type) {
      if (e) {
        const l = i.before(s), a = i.after(s);
        r.delete(l, a).scrollIntoView();
      }
      return !0;
    }
  return !1;
}, vc = (r) => ({ tr: e, state: t, dispatch: n }) => {
  const i = z(r, t.schema), s = e.selection.$anchor;
  for (let o = s.depth; o > 0; o -= 1)
    if (s.node(o).type === i) {
      if (n) {
        const a = s.before(o), c = s.after(o);
        e.delete(a, c).scrollIntoView();
      }
      return !0;
    }
  return !1;
}, Pc = (r) => ({ tr: e, dispatch: t }) => {
  const { from: n, to: i } = r;
  return t && e.delete(n, i), !0;
}, Bc = () => ({ state: r, dispatch: e }) => ir(r, e), zc = () => ({ commands: r }) => r.keyboardShortcut("Enter"), Fc = () => ({ state: r, dispatch: e }) => Ya(r, e);
function Kt(r, e, t = { strict: !0 }) {
  const n = Object.keys(e);
  return n.length ? n.every((i) => t.strict ? e[i] === r[i] : fr(e[i]) ? e[i].test(r[i]) : e[i] === r[i]) : !0;
}
function _s(r, e, t = {}) {
  return r.find((n) => n.type === e && Kt(
    // Only check equality for the attributes that are provided
    Object.fromEntries(Object.keys(t).map((i) => [i, n.attrs[i]])),
    t
  ));
}
function gi(r, e, t = {}) {
  return !!_s(r, e, t);
}
function dr(r, e, t) {
  var n;
  if (!r || !e)
    return;
  let i = r.parent.childAfter(r.parentOffset);
  if ((!i.node || !i.node.marks.some((f) => f.type === e)) && (i = r.parent.childBefore(r.parentOffset)), !i.node || !i.node.marks.some((f) => f.type === e) || (t = t || ((n = i.node.marks[0]) === null || n === void 0 ? void 0 : n.attrs), !_s([...i.node.marks], e, t)))
    return;
  let o = i.index, l = r.start() + i.offset, a = o + 1, c = l + i.node.nodeSize;
  for (; o > 0 && gi([...r.parent.child(o - 1).marks], e, t); )
    o -= 1, l -= r.parent.child(o).nodeSize;
  for (; a < r.parent.childCount && gi([...r.parent.child(a).marks], e, t); )
    c += r.parent.child(a).nodeSize, a += 1;
  return {
    from: l,
    to: c
  };
}
function Ee(r, e) {
  if (typeof r == "string") {
    if (!e.marks[r])
      throw Error(`There is no mark type named '${r}'. Maybe you forgot to add the extension?`);
    return e.marks[r];
  }
  return r;
}
const Vc = (r, e = {}) => ({ tr: t, state: n, dispatch: i }) => {
  const s = Ee(r, n.schema), { doc: o, selection: l } = t, { $from: a, from: c, to: f } = l;
  if (i) {
    const d = dr(a, s, e);
    if (d && d.from <= c && d.to >= f) {
      const u = O.create(o, d.from, d.to);
      t.setSelection(u);
    }
  }
  return !0;
}, Lc = (r) => (e) => {
  const t = typeof r == "function" ? r(e) : r;
  for (let n = 0; n < t.length; n += 1)
    if (t[n](e))
      return !0;
  return !1;
};
function Xs(r) {
  return r instanceof O;
}
function fe(r = 0, e = 0, t = 0) {
  return Math.min(Math.max(r, e), t);
}
function Qs(r, e = null) {
  if (!e)
    return null;
  const t = N.atStart(r), n = N.atEnd(r);
  if (e === "start" || e === !0)
    return t;
  if (e === "end")
    return n;
  const i = t.from, s = n.to;
  return e === "all" ? O.create(r, fe(0, i, s), fe(r.content.size, i, s)) : O.create(r, fe(e, i, s), fe(e, i, s));
}
function Zs() {
  return navigator.platform === "Android" || /android/i.test(navigator.userAgent);
}
function sn() {
  return [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod"
  ].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
}
const $c = (r = null, e = {}) => ({ editor: t, view: n, tr: i, dispatch: s }) => {
  e = {
    scrollIntoView: !0,
    ...e
  };
  const o = () => {
    (sn() || Zs()) && n.dom.focus(), requestAnimationFrame(() => {
      t.isDestroyed || (n.focus(), e != null && e.scrollIntoView && t.commands.scrollIntoView());
    });
  };
  if (n.hasFocus() && r === null || r === !1)
    return !0;
  if (s && r === null && !Xs(t.state.selection))
    return o(), !0;
  const l = Qs(i.doc, r) || t.state.selection, a = t.state.selection.eq(l);
  return s && (a || i.setSelection(l), a && i.storedMarks && i.setStoredMarks(i.storedMarks), o()), !0;
}, Wc = (r, e) => (t) => r.every((n, i) => e(n, { ...t, index: i })), Jc = (r, e) => ({ tr: t, commands: n }) => n.insertContentAt({ from: t.selection.from, to: t.selection.to }, r, e), eo = (r) => {
  const e = r.childNodes;
  for (let t = e.length - 1; t >= 0; t -= 1) {
    const n = e[t];
    n.nodeType === 3 && n.nodeValue && /^(\n\s\s|\n)$/.test(n.nodeValue) ? r.removeChild(n) : n.nodeType === 1 && eo(n);
  }
  return r;
};
function Dt(r) {
  const e = `<body>${r}</body>`, t = new window.DOMParser().parseFromString(e, "text/html").body;
  return eo(t);
}
function yt(r, e, t) {
  if (r instanceof xe || r instanceof b)
    return r;
  t = {
    slice: !0,
    parseOptions: {},
    ...t
  };
  const n = typeof r == "object" && r !== null, i = typeof r == "string";
  if (n)
    try {
      if (Array.isArray(r) && r.length > 0)
        return b.fromArray(r.map((l) => e.nodeFromJSON(l)));
      const o = e.nodeFromJSON(r);
      return t.errorOnInvalidContent && o.check(), o;
    } catch (s) {
      if (t.errorOnInvalidContent)
        throw new Error("[tiptap error]: Invalid JSON content", { cause: s });
      return console.warn("[tiptap warn]: Invalid content.", "Passed value:", r, "Error:", s), yt("", e, t);
    }
  if (i) {
    if (t.errorOnInvalidContent) {
      let o = !1, l = "";
      const a = new Bi({
        topNode: e.spec.topNode,
        marks: e.spec.marks,
        // Prosemirror's schemas are executed such that: the last to execute, matches last
        // This means that we can add a catch-all node at the end of the schema to catch any content that we don't know how to handle
        nodes: e.spec.nodes.append({
          __tiptap__private__unknown__catch__all__node: {
            content: "inline*",
            group: "block",
            parseDOM: [
              {
                tag: "*",
                getAttrs: (c) => (o = !0, l = typeof c == "string" ? c : c.outerHTML, null)
              }
            ]
          }
        })
      });
      if (t.slice ? Se.fromSchema(a).parseSlice(Dt(r), t.parseOptions) : Se.fromSchema(a).parse(Dt(r), t.parseOptions), t.errorOnInvalidContent && o)
        throw new Error("[tiptap error]: Invalid HTML content", { cause: new Error(`Invalid element found: ${l}`) });
    }
    const s = Se.fromSchema(e);
    return t.slice ? s.parseSlice(Dt(r), t.parseOptions).content : s.parse(Dt(r), t.parseOptions);
  }
  return yt("", e, t);
}
function jc(r, e, t) {
  const n = r.steps.length - 1;
  if (n < e)
    return;
  const i = r.steps[n];
  if (!(i instanceof P || i instanceof B))
    return;
  const s = r.mapping.maps[n];
  let o = 0;
  s.forEach((l, a, c, f) => {
    o === 0 && (o = f);
  }), r.setSelection(N.near(r.doc.resolve(o), t));
}
const qc = (r) => !("type" in r), Kc = (r, e, t) => ({ tr: n, dispatch: i, editor: s }) => {
  var o;
  if (i) {
    t = {
      parseOptions: s.options.parseOptions,
      updateSelection: !0,
      applyInputRules: !1,
      applyPasteRules: !1,
      ...t
    };
    let l;
    const a = (g) => {
      s.emit("contentError", {
        editor: s,
        error: g,
        disableCollaboration: () => {
          s.storage.collaboration && (s.storage.collaboration.isDisabled = !0);
        }
      });
    }, c = {
      preserveWhitespace: "full",
      ...t.parseOptions
    };
    if (!t.errorOnInvalidContent && !s.options.enableContentCheck && s.options.emitContentError)
      try {
        yt(e, s.schema, {
          parseOptions: c,
          errorOnInvalidContent: !0
        });
      } catch (g) {
        a(g);
      }
    try {
      l = yt(e, s.schema, {
        parseOptions: c,
        errorOnInvalidContent: (o = t.errorOnInvalidContent) !== null && o !== void 0 ? o : s.options.enableContentCheck
      });
    } catch (g) {
      return a(g), !1;
    }
    let { from: f, to: d } = typeof r == "number" ? { from: r, to: r } : { from: r.from, to: r.to }, u = !0, h = !0;
    if ((qc(l) ? l : [l]).forEach((g) => {
      g.check(), u = u ? g.isText && g.marks.length === 0 : !1, h = h ? g.isBlock : !1;
    }), f === d && h) {
      const { parent: g } = n.doc.resolve(f);
      g.isTextblock && !g.type.spec.code && !g.childCount && (f -= 1, d += 1);
    }
    let m;
    if (u) {
      if (Array.isArray(e))
        m = e.map((g) => g.text || "").join("");
      else if (e instanceof b) {
        let g = "";
        e.forEach((y) => {
          y.text && (g += y.text);
        }), m = g;
      } else typeof e == "object" && e && e.text ? m = e.text : m = e;
      n.insertText(m, f, d);
    } else
      m = l, n.replaceWith(f, d, m);
    t.updateSelection && jc(n, n.steps.length - 1, -1), t.applyInputRules && n.setMeta("applyInputRules", { from: f, text: m }), t.applyPasteRules && n.setMeta("applyPasteRules", { from: f, text: m });
  }
  return !0;
}, Hc = () => ({ state: r, dispatch: e }) => Ha(r, e), Uc = () => ({ state: r, dispatch: e }) => Ua(r, e), Gc = () => ({ state: r, dispatch: e }) => Ps(r, e), Yc = () => ({ state: r, dispatch: e }) => Vs(r, e), _c = () => ({ state: r, dispatch: e, tr: t }) => {
  try {
    const n = Ut(r.doc, r.selection.$from.pos, -1);
    return n == null ? !1 : (t.join(n, 2), e && e(t), !0);
  } catch {
    return !1;
  }
}, Xc = () => ({ state: r, dispatch: e, tr: t }) => {
  try {
    const n = Ut(r.doc, r.selection.$from.pos, 1);
    return n == null ? !1 : (t.join(n, 2), e && e(t), !0);
  } catch {
    return !1;
  }
}, Qc = () => ({ state: r, dispatch: e }) => qa(r, e), Zc = () => ({ state: r, dispatch: e }) => Ka(r, e);
function to() {
  return typeof navigator < "u" ? /Mac/.test(navigator.platform) : !1;
}
function ef(r) {
  const e = r.split(/-(?!$)/);
  let t = e[e.length - 1];
  t === "Space" && (t = " ");
  let n, i, s, o;
  for (let l = 0; l < e.length - 1; l += 1) {
    const a = e[l];
    if (/^(cmd|meta|m)$/i.test(a))
      o = !0;
    else if (/^a(lt)?$/i.test(a))
      n = !0;
    else if (/^(c|ctrl|control)$/i.test(a))
      i = !0;
    else if (/^s(hift)?$/i.test(a))
      s = !0;
    else if (/^mod$/i.test(a))
      sn() || to() ? o = !0 : i = !0;
    else
      throw new Error(`Unrecognized modifier name: ${a}`);
  }
  return n && (t = `Alt-${t}`), i && (t = `Ctrl-${t}`), o && (t = `Meta-${t}`), s && (t = `Shift-${t}`), t;
}
const tf = (r) => ({ editor: e, view: t, tr: n, dispatch: i }) => {
  const s = ef(r).split(/-(?!$)/), o = s.find((c) => !["Alt", "Ctrl", "Meta", "Shift"].includes(c)), l = new KeyboardEvent("keydown", {
    key: o === "Space" ? " " : o,
    altKey: s.includes("Alt"),
    ctrlKey: s.includes("Ctrl"),
    metaKey: s.includes("Meta"),
    shiftKey: s.includes("Shift"),
    bubbles: !0,
    cancelable: !0
  }), a = e.captureTransaction(() => {
    t.someProp("handleKeyDown", (c) => c(t, l));
  });
  return a == null || a.steps.forEach((c) => {
    const f = c.map(n.mapping);
    f && i && n.maybeStep(f);
  }), !0;
};
function bt(r, e, t = {}) {
  const { from: n, to: i, empty: s } = r.selection, o = e ? z(e, r.schema) : null, l = [];
  r.doc.nodesBetween(n, i, (d, u) => {
    if (d.isText)
      return;
    const h = Math.max(n, u), p = Math.min(i, u + d.nodeSize);
    l.push({
      node: d,
      from: h,
      to: p
    });
  });
  const a = i - n, c = l.filter((d) => o ? o.name === d.node.type.name : !0).filter((d) => Kt(d.node.attrs, t, { strict: !1 }));
  return s ? !!c.length : c.reduce((d, u) => d + u.to - u.from, 0) >= a;
}
const nf = (r, e = {}) => ({ state: t, dispatch: n }) => {
  const i = z(r, t.schema);
  return bt(t, i, e) ? Ga(t, n) : !1;
}, rf = () => ({ state: r, dispatch: e }) => Js(r, e), sf = (r) => ({ state: e, dispatch: t }) => {
  const n = z(r, e.schema);
  return oc(n)(e, t);
}, of = () => ({ state: r, dispatch: e }) => $s(r, e);
function on(r, e) {
  return e.nodes[r] ? "node" : e.marks[r] ? "mark" : null;
}
function yi(r, e) {
  const t = typeof e == "string" ? [e] : e;
  return Object.keys(r).reduce((n, i) => (t.includes(i) || (n[i] = r[i]), n), {});
}
const lf = (r, e) => ({ tr: t, state: n, dispatch: i }) => {
  let s = null, o = null;
  const l = on(typeof r == "string" ? r : r.name, n.schema);
  return l ? (l === "node" && (s = z(r, n.schema)), l === "mark" && (o = Ee(r, n.schema)), i && t.selection.ranges.forEach((a) => {
    n.doc.nodesBetween(a.$from.pos, a.$to.pos, (c, f) => {
      s && s === c.type && t.setNodeMarkup(f, void 0, yi(c.attrs, e)), o && c.marks.length && c.marks.forEach((d) => {
        o === d.type && t.addMark(f, f + c.nodeSize, o.create(yi(d.attrs, e)));
      });
    });
  }), !0) : !1;
}, af = () => ({ tr: r, dispatch: e }) => (e && r.scrollIntoView(), !0), cf = () => ({ tr: r, dispatch: e }) => {
  if (e) {
    const t = new _(r.doc);
    r.setSelection(t);
  }
  return !0;
}, ff = () => ({ state: r, dispatch: e }) => zs(r, e), df = () => ({ state: r, dispatch: e }) => Ls(r, e), uf = () => ({ state: r, dispatch: e }) => Qa(r, e), hf = () => ({ state: r, dispatch: e }) => tc(r, e), pf = () => ({ state: r, dispatch: e }) => ec(r, e);
function Jn(r, e, t = {}, n = {}) {
  return yt(r, e, {
    slice: !1,
    parseOptions: t,
    errorOnInvalidContent: n.errorOnInvalidContent
  });
}
const mf = (r, e = !1, t = {}, n = {}) => ({ editor: i, tr: s, dispatch: o, commands: l }) => {
  var a, c;
  const { doc: f } = s;
  if (t.preserveWhitespace !== "full") {
    const d = Jn(r, i.schema, t, {
      errorOnInvalidContent: (a = n.errorOnInvalidContent) !== null && a !== void 0 ? a : i.options.enableContentCheck
    });
    return o && s.replaceWith(0, f.content.size, d).setMeta("preventUpdate", !e), !0;
  }
  return o && s.setMeta("preventUpdate", !e), l.insertContentAt({ from: 0, to: f.content.size }, r, {
    parseOptions: t,
    errorOnInvalidContent: (c = n.errorOnInvalidContent) !== null && c !== void 0 ? c : i.options.enableContentCheck
  });
};
function no(r, e) {
  const t = Ee(e, r.schema), { from: n, to: i, empty: s } = r.selection, o = [];
  s ? (r.storedMarks && o.push(...r.storedMarks), o.push(...r.selection.$head.marks())) : r.doc.nodesBetween(n, i, (a) => {
    o.push(...a.marks);
  });
  const l = o.find((a) => a.type.name === t.name);
  return l ? { ...l.attrs } : {};
}
function ed(r, e) {
  const t = new _i(r);
  return e.forEach((n) => {
    n.steps.forEach((i) => {
      t.step(i);
    });
  }), t;
}
function gf(r) {
  for (let e = 0; e < r.edgeCount; e += 1) {
    const { type: t } = r.edge(e);
    if (t.isTextblock && !t.hasRequiredAttrs())
      return t;
  }
  return null;
}
function td(r, e, t) {
  const n = [];
  return r.nodesBetween(e.from, e.to, (i, s) => {
    t(i) && n.push({
      node: i,
      pos: s
    });
  }), n;
}
function yf(r, e) {
  for (let t = r.depth; t > 0; t -= 1) {
    const n = r.node(t);
    if (e(n))
      return {
        pos: t > 0 ? r.before(t) : 0,
        start: r.start(t),
        depth: t,
        node: n
      };
  }
}
function ur(r) {
  return (e) => yf(e.$from, r);
}
function bf(r, e) {
  const t = {
    from: 0,
    to: r.content.size
  };
  return Gs(r, t, e);
}
function kf(r, e) {
  const t = z(e, r.schema), { from: n, to: i } = r.selection, s = [];
  r.doc.nodesBetween(n, i, (l) => {
    s.push(l);
  });
  const o = s.reverse().find((l) => l.type.name === t.name);
  return o ? { ...o.attrs } : {};
}
function xf(r, e) {
  const t = on(typeof e == "string" ? e : e.name, r.schema);
  return t === "node" ? kf(r, e) : t === "mark" ? no(r, e) : {};
}
function Sf(r, e = JSON.stringify) {
  const t = {};
  return r.filter((n) => {
    const i = e(n);
    return Object.prototype.hasOwnProperty.call(t, i) ? !1 : t[i] = !0;
  });
}
function Cf(r) {
  const e = Sf(r);
  return e.length === 1 ? e : e.filter((t, n) => !e.filter((s, o) => o !== n).some((s) => t.oldRange.from >= s.oldRange.from && t.oldRange.to <= s.oldRange.to && t.newRange.from >= s.newRange.from && t.newRange.to <= s.newRange.to));
}
function nd(r) {
  const { mapping: e, steps: t } = r, n = [];
  return e.maps.forEach((i, s) => {
    const o = [];
    if (i.ranges.length)
      i.forEach((l, a) => {
        o.push({ from: l, to: a });
      });
    else {
      const { from: l, to: a } = t[s];
      if (l === void 0 || a === void 0)
        return;
      o.push({ from: l, to: a });
    }
    o.forEach(({ from: l, to: a }) => {
      const c = e.slice(s).map(l, -1), f = e.slice(s).map(a), d = e.invert().map(c, -1), u = e.invert().map(f);
      n.push({
        oldRange: {
          from: d,
          to: u
        },
        newRange: {
          from: c,
          to: f
        }
      });
    });
  }), Cf(n);
}
function ro(r, e, t) {
  const n = [];
  return r === e ? t.resolve(r).marks().forEach((i) => {
    const s = t.resolve(r), o = dr(s, i.type);
    o && n.push({
      mark: i,
      ...o
    });
  }) : t.nodesBetween(r, e, (i, s) => {
    !i || (i == null ? void 0 : i.nodeSize) === void 0 || n.push(...i.marks.map((o) => ({
      from: s,
      to: s + i.nodeSize,
      mark: o
    })));
  }), n;
}
function Rt(r, e, t) {
  return Object.fromEntries(Object.entries(t).filter(([n]) => {
    const i = r.find((s) => s.type === e && s.name === n);
    return i ? i.attribute.keepOnSplit : !1;
  }));
}
function jn(r, e, t = {}) {
  const { empty: n, ranges: i } = r.selection, s = e ? Ee(e, r.schema) : null;
  if (n)
    return !!(r.storedMarks || r.selection.$from.marks()).filter((d) => s ? s.name === d.type.name : !0).find((d) => Kt(d.attrs, t, { strict: !1 }));
  let o = 0;
  const l = [];
  if (i.forEach(({ $from: d, $to: u }) => {
    const h = d.pos, p = u.pos;
    r.doc.nodesBetween(h, p, (m, g) => {
      if (!m.isText && !m.marks.length)
        return;
      const y = Math.max(h, g), C = Math.min(p, g + m.nodeSize), M = C - y;
      o += M, l.push(...m.marks.map((D) => ({
        mark: D,
        from: y,
        to: C
      })));
    });
  }), o === 0)
    return !1;
  const a = l.filter((d) => s ? s.name === d.mark.type.name : !0).filter((d) => Kt(d.mark.attrs, t, { strict: !1 })).reduce((d, u) => d + u.to - u.from, 0), c = l.filter((d) => s ? d.mark.type !== s && d.mark.type.excludes(s) : !0).reduce((d, u) => d + u.to - u.from, 0);
  return (a > 0 ? a + c : a) >= o;
}
function Mf(r, e, t = {}) {
  if (!e)
    return bt(r, null, t) || jn(r, null, t);
  const n = on(e, r.schema);
  return n === "node" ? bt(r, e, t) : n === "mark" ? jn(r, e, t) : !1;
}
function bi(r, e) {
  const { nodeExtensions: t } = tn(e), n = t.find((o) => o.name === r);
  if (!n)
    return !1;
  const i = {
    name: n.name,
    options: n.options,
    storage: n.storage
  }, s = w(x(n, "group", i));
  return typeof s != "string" ? !1 : s.split(" ").includes("list");
}
function hr(r, { checkChildren: e = !0, ignoreWhitespace: t = !1 } = {}) {
  var n;
  if (t) {
    if (r.type.name === "hardBreak")
      return !0;
    if (r.isText)
      return /^\s*$/m.test((n = r.text) !== null && n !== void 0 ? n : "");
  }
  if (r.isText)
    return !r.text;
  if (r.isAtom || r.isLeaf)
    return !1;
  if (r.content.childCount === 0)
    return !0;
  if (e) {
    let i = !0;
    return r.content.forEach((s) => {
      i !== !1 && (hr(s, { ignoreWhitespace: t, checkChildren: e }) || (i = !1));
    }), i;
  }
  return !1;
}
function rd(r) {
  return r instanceof S;
}
function id(r, e, t) {
  const i = r.state.doc.content.size, s = fe(e, 0, i), o = fe(t, 0, i), l = r.coordsAtPos(s), a = r.coordsAtPos(o, -1), c = Math.min(l.top, a.top), f = Math.max(l.bottom, a.bottom), d = Math.min(l.left, a.left), u = Math.max(l.right, a.right), h = u - d, p = f - c, y = {
    top: c,
    bottom: f,
    left: d,
    right: u,
    width: h,
    height: p,
    x: d,
    y: c
  };
  return {
    ...y,
    toJSON: () => y
  };
}
function wf(r, e, t) {
  var n;
  const { selection: i } = e;
  let s = null;
  if (Xs(i) && (s = i.$cursor), s) {
    const l = (n = r.storedMarks) !== null && n !== void 0 ? n : s.marks();
    return !!t.isInSet(l) || !l.some((a) => a.type.excludes(t));
  }
  const { ranges: o } = i;
  return o.some(({ $from: l, $to: a }) => {
    let c = l.depth === 0 ? r.doc.inlineContent && r.doc.type.allowsMarkType(t) : !1;
    return r.doc.nodesBetween(l.pos, a.pos, (f, d, u) => {
      if (c)
        return !1;
      if (f.isInline) {
        const h = !u || u.type.allowsMarkType(t), p = !!t.isInSet(f.marks) || !f.marks.some((m) => m.type.excludes(t));
        c = h && p;
      }
      return !c;
    }), c;
  });
}
const Of = (r, e = {}) => ({ tr: t, state: n, dispatch: i }) => {
  const { selection: s } = t, { empty: o, ranges: l } = s, a = Ee(r, n.schema);
  if (i)
    if (o) {
      const c = no(n, a);
      t.addStoredMark(a.create({
        ...c,
        ...e
      }));
    } else
      l.forEach((c) => {
        const f = c.$from.pos, d = c.$to.pos;
        n.doc.nodesBetween(f, d, (u, h) => {
          const p = Math.max(h, f), m = Math.min(h + u.nodeSize, d);
          u.marks.find((y) => y.type === a) ? u.marks.forEach((y) => {
            a === y.type && t.addMark(p, m, a.create({
              ...y.attrs,
              ...e
            }));
          }) : t.addMark(p, m, a.create(e));
        });
      });
  return wf(n, t, a);
}, Nf = (r, e) => ({ tr: t }) => (t.setMeta(r, e), !0), Tf = (r, e = {}) => ({ state: t, dispatch: n, chain: i }) => {
  const s = z(r, t.schema);
  let o;
  return t.selection.$anchor.sameParent(t.selection.$head) && (o = t.selection.$anchor.parent.attrs), s.isTextblock ? i().command(({ commands: l }) => ui(s, { ...o, ...e })(t) ? !0 : l.clearNodes()).command(({ state: l }) => ui(s, { ...o, ...e })(l, n)).run() : (console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.'), !1);
}, Ef = (r) => ({ tr: e, dispatch: t }) => {
  if (t) {
    const { doc: n } = e, i = fe(r, 0, n.content.size), s = S.create(n, i);
    e.setSelection(s);
  }
  return !0;
}, Df = (r) => ({ tr: e, dispatch: t }) => {
  if (t) {
    const { doc: n } = e, { from: i, to: s } = typeof r == "number" ? { from: r, to: r } : r, o = O.atStart(n).from, l = O.atEnd(n).to, a = fe(i, o, l), c = fe(s, o, l), f = O.create(n, a, c);
    e.setSelection(f);
  }
  return !0;
}, Af = (r) => ({ state: e, dispatch: t }) => {
  const n = z(r, e.schema);
  return cc(n)(e, t);
};
function ki(r, e) {
  const t = r.storedMarks || r.selection.$to.parentOffset && r.selection.$from.marks();
  if (t) {
    const n = t.filter((i) => e == null ? void 0 : e.includes(i.type.name));
    r.tr.ensureMarks(n);
  }
}
const If = ({ keepMarks: r = !0 } = {}) => ({ tr: e, state: t, dispatch: n, editor: i }) => {
  const { selection: s, doc: o } = e, { $from: l, $to: a } = s, c = i.extensionManager.attributes, f = Rt(c, l.node().type.name, l.node().attrs);
  if (s instanceof S && s.node.isBlock)
    return !l.parentOffset || !de(o, l.pos) ? !1 : (n && (r && ki(t, i.extensionManager.splittableMarks), e.split(l.pos).scrollIntoView()), !0);
  if (!l.parent.isBlock)
    return !1;
  const d = a.parentOffset === a.parent.content.size, u = l.depth === 0 ? void 0 : gf(l.node(-1).contentMatchAt(l.indexAfter(-1)));
  let h = d && u ? [
    {
      type: u,
      attrs: f
    }
  ] : void 0, p = de(e.doc, e.mapping.map(l.pos), 1, h);
  if (!h && !p && de(e.doc, e.mapping.map(l.pos), 1, u ? [{ type: u }] : void 0) && (p = !0, h = u ? [
    {
      type: u,
      attrs: f
    }
  ] : void 0), n) {
    if (p && (s instanceof O && e.deleteSelection(), e.split(e.mapping.map(l.pos), 1, h), u && !d && !l.parentOffset && l.parent.type !== u)) {
      const m = e.mapping.map(l.before()), g = e.doc.resolve(m);
      l.node(-1).canReplaceWith(g.index(), g.index() + 1, u) && e.setNodeMarkup(e.mapping.map(l.before()), u);
    }
    r && ki(t, i.extensionManager.splittableMarks), e.scrollIntoView();
  }
  return p;
}, Rf = (r, e = {}) => ({ tr: t, state: n, dispatch: i, editor: s }) => {
  var o;
  const l = z(r, n.schema), { $from: a, $to: c } = n.selection, f = n.selection.node;
  if (f && f.isBlock || a.depth < 2 || !a.sameParent(c))
    return !1;
  const d = a.node(-1);
  if (d.type !== l)
    return !1;
  const u = s.extensionManager.attributes;
  if (a.parent.content.size === 0 && a.node(-1).childCount === a.indexAfter(-1)) {
    if (a.depth === 2 || a.node(-3).type !== l || a.index(-2) !== a.node(-2).childCount - 1)
      return !1;
    if (i) {
      let y = b.empty;
      const C = a.index(-1) ? 1 : a.index(-2) ? 2 : 3;
      for (let j = a.depth - C; j >= a.depth - 3; j -= 1)
        y = b.from(a.node(j).copy(y));
      const M = a.indexAfter(-1) < a.node(-2).childCount ? 1 : a.indexAfter(-2) < a.node(-3).childCount ? 2 : 3, D = {
        ...Rt(u, a.node().type.name, a.node().attrs),
        ...e
      }, E = ((o = l.contentMatch.defaultType) === null || o === void 0 ? void 0 : o.createAndFill(D)) || void 0;
      y = y.append(b.from(l.createAndFill(null, E) || void 0));
      const A = a.before(a.depth - (C - 1));
      t.replace(A, a.after(-M), new k(y, 4 - C, 0));
      let U = -1;
      t.doc.nodesBetween(A, t.doc.content.size, (j, T) => {
        if (U > -1)
          return !1;
        j.isTextblock && j.content.size === 0 && (U = T + 1);
      }), U > -1 && t.setSelection(O.near(t.doc.resolve(U))), t.scrollIntoView();
    }
    return !0;
  }
  const h = c.pos === a.end() ? d.contentMatchAt(0).defaultType : null, p = {
    ...Rt(u, d.type.name, d.attrs),
    ...e
  }, m = {
    ...Rt(u, a.node().type.name, a.node().attrs),
    ...e
  };
  t.delete(a.pos, c.pos);
  const g = h ? [
    { type: l, attrs: p },
    { type: h, attrs: m }
  ] : [{ type: l, attrs: p }];
  if (!de(t.doc, a.pos, 2))
    return !1;
  if (i) {
    const { selection: y, storedMarks: C } = n, { splittableMarks: M } = s.extensionManager, D = C || y.$to.parentOffset && y.$from.marks();
    if (t.split(a.pos, 2, g).scrollIntoView(), !D || !i)
      return !0;
    const E = D.filter((A) => M.includes(A.type.name));
    t.ensureMarks(E);
  }
  return !0;
}, Mn = (r, e) => {
  const t = ur((o) => o.type === e)(r.selection);
  if (!t)
    return !0;
  const n = r.doc.resolve(Math.max(0, t.pos - 1)).before(t.depth);
  if (n === void 0)
    return !0;
  const i = r.doc.nodeAt(n);
  return t.node.type === (i == null ? void 0 : i.type) && Ne(r.doc, t.pos) && r.join(t.pos), !0;
}, wn = (r, e) => {
  const t = ur((o) => o.type === e)(r.selection);
  if (!t)
    return !0;
  const n = r.doc.resolve(t.start).after(t.depth);
  if (n === void 0)
    return !0;
  const i = r.doc.nodeAt(n);
  return t.node.type === (i == null ? void 0 : i.type) && Ne(r.doc, n) && r.join(n), !0;
}, vf = (r, e, t, n = {}) => ({ editor: i, tr: s, state: o, dispatch: l, chain: a, commands: c, can: f }) => {
  const { extensions: d, splittableMarks: u } = i.extensionManager, h = z(r, o.schema), p = z(e, o.schema), { selection: m, storedMarks: g } = o, { $from: y, $to: C } = m, M = y.blockRange(C), D = g || m.$to.parentOffset && m.$from.marks();
  if (!M)
    return !1;
  const E = ur((A) => bi(A.type.name, d))(m);
  if (M.depth >= 1 && E && M.depth - E.depth <= 1) {
    if (E.node.type === h)
      return c.liftListItem(p);
    if (bi(E.node.type.name, d) && h.validContent(E.node.content) && l)
      return a().command(() => (s.setNodeMarkup(E.pos, h), !0)).command(() => Mn(s, h)).command(() => wn(s, h)).run();
  }
  return !t || !D || !l ? a().command(() => f().wrapInList(h, n) ? !0 : c.clearNodes()).wrapInList(h, n).command(() => Mn(s, h)).command(() => wn(s, h)).run() : a().command(() => {
    const A = f().wrapInList(h, n), U = D.filter((j) => u.includes(j.type.name));
    return s.ensureMarks(U), A ? !0 : c.clearNodes();
  }).wrapInList(h, n).command(() => Mn(s, h)).command(() => wn(s, h)).run();
}, Pf = (r, e = {}, t = {}) => ({ state: n, commands: i }) => {
  const { extendEmptyMarkRange: s = !1 } = t, o = Ee(r, n.schema);
  return jn(n, o, e) ? i.unsetMark(o, { extendEmptyMarkRange: s }) : i.setMark(o, e);
}, Bf = (r, e, t = {}) => ({ state: n, commands: i }) => {
  const s = z(r, n.schema), o = z(e, n.schema), l = bt(n, s, t);
  let a;
  return n.selection.$anchor.sameParent(n.selection.$head) && (a = n.selection.$anchor.parent.attrs), l ? i.setNode(o, a) : i.setNode(s, { ...a, ...t });
}, zf = (r, e = {}) => ({ state: t, commands: n }) => {
  const i = z(r, t.schema);
  return bt(t, i, e) ? n.lift(i) : n.wrapIn(i, e);
}, Ff = () => ({ state: r, dispatch: e }) => {
  const t = r.plugins;
  for (let n = 0; n < t.length; n += 1) {
    const i = t[n];
    let s;
    if (i.spec.isInputRules && (s = i.getState(r))) {
      if (e) {
        const o = r.tr, l = s.transform;
        for (let a = l.steps.length - 1; a >= 0; a -= 1)
          o.step(l.steps[a].invert(l.docs[a]));
        if (s.text) {
          const a = o.doc.resolve(s.from).marks();
          o.replaceWith(s.from, s.to, r.schema.text(s.text, a));
        } else
          o.delete(s.from, s.to);
      }
      return !0;
    }
  }
  return !1;
}, Vf = () => ({ tr: r, dispatch: e }) => {
  const { selection: t } = r, { empty: n, ranges: i } = t;
  return n || e && i.forEach((s) => {
    r.removeMark(s.$from.pos, s.$to.pos);
  }), !0;
}, Lf = (r, e = {}) => ({ tr: t, state: n, dispatch: i }) => {
  var s;
  const { extendEmptyMarkRange: o = !1 } = e, { selection: l } = t, a = Ee(r, n.schema), { $from: c, empty: f, ranges: d } = l;
  if (!i)
    return !0;
  if (f && o) {
    let { from: u, to: h } = l;
    const p = (s = c.marks().find((g) => g.type === a)) === null || s === void 0 ? void 0 : s.attrs, m = dr(c, a, p);
    m && (u = m.from, h = m.to), t.removeMark(u, h, a);
  } else
    d.forEach((u) => {
      t.removeMark(u.$from.pos, u.$to.pos, a);
    });
  return t.removeStoredMark(a), !0;
}, $f = (r, e = {}) => ({ tr: t, state: n, dispatch: i }) => {
  let s = null, o = null;
  const l = on(typeof r == "string" ? r : r.name, n.schema);
  return l ? (l === "node" && (s = z(r, n.schema)), l === "mark" && (o = Ee(r, n.schema)), i && t.selection.ranges.forEach((a) => {
    const c = a.$from.pos, f = a.$to.pos;
    let d, u, h, p;
    t.selection.empty ? n.doc.nodesBetween(c, f, (m, g) => {
      s && s === m.type && (h = Math.max(g, c), p = Math.min(g + m.nodeSize, f), d = g, u = m);
    }) : n.doc.nodesBetween(c, f, (m, g) => {
      g < c && s && s === m.type && (h = Math.max(g, c), p = Math.min(g + m.nodeSize, f), d = g, u = m), g >= c && g <= f && (s && s === m.type && t.setNodeMarkup(g, void 0, {
        ...m.attrs,
        ...e
      }), o && m.marks.length && m.marks.forEach((y) => {
        if (o === y.type) {
          const C = Math.max(g, c), M = Math.min(g + m.nodeSize, f);
          t.addMark(C, M, o.create({
            ...y.attrs,
            ...e
          }));
        }
      }));
    }), u && (d !== void 0 && t.setNodeMarkup(d, void 0, {
      ...u.attrs,
      ...e
    }), o && u.marks.length && u.marks.forEach((m) => {
      o === m.type && t.addMark(h, p, o.create({
        ...m.attrs,
        ...e
      }));
    }));
  }), !0) : !1;
}, Wf = (r, e = {}) => ({ state: t, dispatch: n }) => {
  const i = z(r, t.schema);
  return nc(i, e)(t, n);
}, Jf = (r, e = {}) => ({ state: t, dispatch: n }) => {
  const i = z(r, t.schema);
  return rc(i, e)(t, n);
};
var jf = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  blur: Nc,
  clearContent: Tc,
  clearNodes: Ec,
  command: Dc,
  createParagraphNear: Ac,
  cut: Ic,
  deleteCurrentNode: Rc,
  deleteNode: vc,
  deleteRange: Pc,
  deleteSelection: Bc,
  enter: zc,
  exitCode: Fc,
  extendMarkRange: Vc,
  first: Lc,
  focus: $c,
  forEach: Wc,
  insertContent: Jc,
  insertContentAt: Kc,
  joinBackward: Gc,
  joinDown: Uc,
  joinForward: Yc,
  joinItemBackward: _c,
  joinItemForward: Xc,
  joinTextblockBackward: Qc,
  joinTextblockForward: Zc,
  joinUp: Hc,
  keyboardShortcut: tf,
  lift: nf,
  liftEmptyBlock: rf,
  liftListItem: sf,
  newlineInCode: of,
  resetAttributes: lf,
  scrollIntoView: af,
  selectAll: cf,
  selectNodeBackward: ff,
  selectNodeForward: df,
  selectParentNode: uf,
  selectTextblockEnd: hf,
  selectTextblockStart: pf,
  setContent: mf,
  setMark: Of,
  setMeta: Nf,
  setNode: Tf,
  setNodeSelection: Ef,
  setTextSelection: Df,
  sinkListItem: Af,
  splitBlock: If,
  splitListItem: Rf,
  toggleList: vf,
  toggleMark: Pf,
  toggleNode: Bf,
  toggleWrap: zf,
  undoInputRule: Ff,
  unsetAllMarks: Vf,
  unsetMark: Lf,
  updateAttributes: $f,
  wrapIn: Wf,
  wrapInList: Jf
});
const qf = ne.create({
  name: "commands",
  addCommands() {
    return {
      ...jf
    };
  }
}), Kf = ne.create({
  name: "drop",
  addProseMirrorPlugins() {
    return [
      new oe({
        key: new We("tiptapDrop"),
        props: {
          handleDrop: (r, e, t, n) => {
            this.editor.emit("drop", {
              editor: this.editor,
              event: e,
              slice: t,
              moved: n
            });
          }
        }
      })
    ];
  }
}), Hf = ne.create({
  name: "editable",
  addProseMirrorPlugins() {
    return [
      new oe({
        key: new We("editable"),
        props: {
          editable: () => this.editor.options.editable
        }
      })
    ];
  }
}), Uf = new We("focusEvents"), Gf = ne.create({
  name: "focusEvents",
  addProseMirrorPlugins() {
    const { editor: r } = this;
    return [
      new oe({
        key: Uf,
        props: {
          handleDOMEvents: {
            focus: (e, t) => {
              r.isFocused = !0;
              const n = r.state.tr.setMeta("focus", { event: t }).setMeta("addToHistory", !1);
              return e.dispatch(n), !1;
            },
            blur: (e, t) => {
              r.isFocused = !1;
              const n = r.state.tr.setMeta("blur", { event: t }).setMeta("addToHistory", !1);
              return e.dispatch(n), !1;
            }
          }
        }
      })
    ];
  }
}), Yf = ne.create({
  name: "keymap",
  addKeyboardShortcuts() {
    const r = () => this.editor.commands.first(({ commands: o }) => [
      () => o.undoInputRule(),
      // maybe convert first text block node to default node
      () => o.command(({ tr: l }) => {
        const { selection: a, doc: c } = l, { empty: f, $anchor: d } = a, { pos: u, parent: h } = d, p = d.parent.isTextblock && u > 0 ? l.doc.resolve(u - 1) : d, m = p.parent.type.spec.isolating, g = d.pos - d.parentOffset, y = m && p.parent.childCount === 1 ? g === d.pos : N.atStart(c).from === u;
        return !f || !h.type.isTextblock || h.textContent.length || !y || y && d.parent.type.name === "paragraph" ? !1 : o.clearNodes();
      }),
      () => o.deleteSelection(),
      () => o.joinBackward(),
      () => o.selectNodeBackward()
    ]), e = () => this.editor.commands.first(({ commands: o }) => [
      () => o.deleteSelection(),
      () => o.deleteCurrentNode(),
      () => o.joinForward(),
      () => o.selectNodeForward()
    ]), n = {
      Enter: () => this.editor.commands.first(({ commands: o }) => [
        () => o.newlineInCode(),
        () => o.createParagraphNear(),
        () => o.liftEmptyBlock(),
        () => o.splitBlock()
      ]),
      "Mod-Enter": () => this.editor.commands.exitCode(),
      Backspace: r,
      "Mod-Backspace": r,
      "Shift-Backspace": r,
      Delete: e,
      "Mod-Delete": e,
      "Mod-a": () => this.editor.commands.selectAll()
    }, i = {
      ...n
    }, s = {
      ...n,
      "Ctrl-h": r,
      "Alt-Backspace": r,
      "Ctrl-d": e,
      "Ctrl-Alt-Backspace": e,
      "Alt-Delete": e,
      "Alt-d": e,
      "Ctrl-a": () => this.editor.commands.selectTextblockStart(),
      "Ctrl-e": () => this.editor.commands.selectTextblockEnd()
    };
    return sn() || to() ? s : i;
  },
  addProseMirrorPlugins() {
    return [
      // With this plugin we check if the whole document was selected and deleted.
      // In this case we will additionally call `clearNodes()` to convert e.g. a heading
      // to a paragraph if necessary.
      // This is an alternative to ProseMirror's `AllSelection`, which doesn’t work well
      // with many other commands.
      new oe({
        key: new We("clearDocument"),
        appendTransaction: (r, e, t) => {
          if (r.some((m) => m.getMeta("composition")))
            return;
          const n = r.some((m) => m.docChanged) && !e.doc.eq(t.doc), i = r.some((m) => m.getMeta("preventClearDocument"));
          if (!n || i)
            return;
          const { empty: s, from: o, to: l } = e.selection, a = N.atStart(e.doc).from, c = N.atEnd(e.doc).to;
          if (s || !(o === a && l === c) || !hr(t.doc))
            return;
          const u = t.tr, h = Zt({
            state: t,
            transaction: u
          }), { commands: p } = new en({
            editor: this.editor,
            state: h
          });
          if (p.clearNodes(), !!u.steps.length)
            return u;
        }
      })
    ];
  }
}), _f = ne.create({
  name: "paste",
  addProseMirrorPlugins() {
    return [
      new oe({
        key: new We("tiptapPaste"),
        props: {
          handlePaste: (r, e, t) => {
            this.editor.emit("paste", {
              editor: this.editor,
              event: e,
              slice: t
            });
          }
        }
      })
    ];
  }
}), Xf = ne.create({
  name: "tabindex",
  addProseMirrorPlugins() {
    return [
      new oe({
        key: new We("tabindex"),
        props: {
          attributes: () => this.editor.isEditable ? { tabindex: "0" } : {}
        }
      })
    ];
  }
});
class Ae {
  get name() {
    return this.node.type.name;
  }
  constructor(e, t, n = !1, i = null) {
    this.currentNode = null, this.actualDepth = null, this.isBlock = n, this.resolvedPos = e, this.editor = t, this.currentNode = i;
  }
  get node() {
    return this.currentNode || this.resolvedPos.node();
  }
  get element() {
    return this.editor.view.domAtPos(this.pos).node;
  }
  get depth() {
    var e;
    return (e = this.actualDepth) !== null && e !== void 0 ? e : this.resolvedPos.depth;
  }
  get pos() {
    return this.resolvedPos.pos;
  }
  get content() {
    return this.node.content;
  }
  set content(e) {
    let t = this.from, n = this.to;
    if (this.isBlock) {
      if (this.content.size === 0) {
        console.error(`You can’t set content on a block node. Tried to set content on ${this.name} at ${this.pos}`);
        return;
      }
      t = this.from + 1, n = this.to - 1;
    }
    this.editor.commands.insertContentAt({ from: t, to: n }, e);
  }
  get attributes() {
    return this.node.attrs;
  }
  get textContent() {
    return this.node.textContent;
  }
  get size() {
    return this.node.nodeSize;
  }
  get from() {
    return this.isBlock ? this.pos : this.resolvedPos.start(this.resolvedPos.depth);
  }
  get range() {
    return {
      from: this.from,
      to: this.to
    };
  }
  get to() {
    return this.isBlock ? this.pos + this.size : this.resolvedPos.end(this.resolvedPos.depth) + (this.node.isText ? 0 : 1);
  }
  get parent() {
    if (this.depth === 0)
      return null;
    const e = this.resolvedPos.start(this.resolvedPos.depth - 1), t = this.resolvedPos.doc.resolve(e);
    return new Ae(t, this.editor);
  }
  get before() {
    let e = this.resolvedPos.doc.resolve(this.from - (this.isBlock ? 1 : 2));
    return e.depth !== this.depth && (e = this.resolvedPos.doc.resolve(this.from - 3)), new Ae(e, this.editor);
  }
  get after() {
    let e = this.resolvedPos.doc.resolve(this.to + (this.isBlock ? 2 : 1));
    return e.depth !== this.depth && (e = this.resolvedPos.doc.resolve(this.to + 3)), new Ae(e, this.editor);
  }
  get children() {
    const e = [];
    return this.node.content.forEach((t, n) => {
      const i = t.isBlock && !t.isTextblock, s = t.isAtom && !t.isText, o = this.pos + n + (s ? 0 : 1);
      if (o < 0 || o > this.resolvedPos.doc.nodeSize - 2)
        return;
      const l = this.resolvedPos.doc.resolve(o);
      if (!i && l.depth <= this.depth)
        return;
      const a = new Ae(l, this.editor, i, i ? t : null);
      i && (a.actualDepth = this.depth + 1), e.push(new Ae(l, this.editor, i, i ? t : null));
    }), e;
  }
  get firstChild() {
    return this.children[0] || null;
  }
  get lastChild() {
    const e = this.children;
    return e[e.length - 1] || null;
  }
  closest(e, t = {}) {
    let n = null, i = this.parent;
    for (; i && !n; ) {
      if (i.node.type.name === e)
        if (Object.keys(t).length > 0) {
          const s = i.node.attrs, o = Object.keys(t);
          for (let l = 0; l < o.length; l += 1) {
            const a = o[l];
            if (s[a] !== t[a])
              break;
          }
        } else
          n = i;
      i = i.parent;
    }
    return n;
  }
  querySelector(e, t = {}) {
    return this.querySelectorAll(e, t, !0)[0] || null;
  }
  querySelectorAll(e, t = {}, n = !1) {
    let i = [];
    if (!this.children || this.children.length === 0)
      return i;
    const s = Object.keys(t);
    return this.children.forEach((o) => {
      n && i.length > 0 || (o.node.type.name === e && s.every((a) => t[a] === o.node.attrs[a]) && i.push(o), !(n && i.length > 0) && (i = i.concat(o.querySelectorAll(e, t, n))));
    }), i;
  }
  setAttribute(e) {
    const { tr: t } = this.editor.state;
    t.setNodeMarkup(this.from, void 0, {
      ...this.node.attrs,
      ...e
    }), this.editor.view.dispatch(t);
  }
}
const Qf = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror [contenteditable="false"] {
  white-space: normal;
}

.ProseMirror [contenteditable="false"] [contenteditable="true"] {
  white-space: pre-wrap;
}

.ProseMirror pre {
  white-space: pre-wrap;
}

img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
  width: 0 !important;
  height: 0 !important;
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
  margin: 0;
}

.ProseMirror-gapcursor:after {
  content: "";
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

.tippy-box[data-animation=fade][data-state=hidden] {
  opacity: 0
}`;
function Zf(r, e, t) {
  const n = document.querySelector("style[data-tiptap-style]");
  if (n !== null)
    return n;
  const i = document.createElement("style");
  return e && i.setAttribute("nonce", e), i.setAttribute("data-tiptap-style", ""), i.innerHTML = r, document.getElementsByTagName("head")[0].appendChild(i), i;
}
class sd extends fc {
  constructor(e = {}) {
    super(), this.isFocused = !1, this.isInitialized = !1, this.extensionStorage = {}, this.options = {
      element: document.createElement("div"),
      content: "",
      injectCSS: !0,
      injectNonce: void 0,
      extensions: [],
      autofocus: !1,
      editable: !0,
      editorProps: {},
      parseOptions: {},
      coreExtensionOptions: {},
      enableInputRules: !0,
      enablePasteRules: !0,
      enableCoreExtensions: !0,
      enableContentCheck: !1,
      emitContentError: !1,
      onBeforeCreate: () => null,
      onCreate: () => null,
      onUpdate: () => null,
      onSelectionUpdate: () => null,
      onTransaction: () => null,
      onFocus: () => null,
      onBlur: () => null,
      onDestroy: () => null,
      onContentError: ({ error: t }) => {
        throw t;
      },
      onPaste: () => null,
      onDrop: () => null
    }, this.isCapturingTransaction = !1, this.capturedTransaction = null, this.setOptions(e), this.createExtensionManager(), this.createCommandManager(), this.createSchema(), this.on("beforeCreate", this.options.onBeforeCreate), this.emit("beforeCreate", { editor: this }), this.on("contentError", this.options.onContentError), this.createView(), this.injectCSS(), this.on("create", this.options.onCreate), this.on("update", this.options.onUpdate), this.on("selectionUpdate", this.options.onSelectionUpdate), this.on("transaction", this.options.onTransaction), this.on("focus", this.options.onFocus), this.on("blur", this.options.onBlur), this.on("destroy", this.options.onDestroy), this.on("drop", ({ event: t, slice: n, moved: i }) => this.options.onDrop(t, n, i)), this.on("paste", ({ event: t, slice: n }) => this.options.onPaste(t, n)), window.setTimeout(() => {
      this.isDestroyed || (this.commands.focus(this.options.autofocus), this.emit("create", { editor: this }), this.isInitialized = !0);
    }, 0);
  }
  /**
   * Returns the editor storage.
   */
  get storage() {
    return this.extensionStorage;
  }
  /**
   * An object of all registered commands.
   */
  get commands() {
    return this.commandManager.commands;
  }
  /**
   * Create a command chain to call multiple commands at once.
   */
  chain() {
    return this.commandManager.chain();
  }
  /**
   * Check if a command or a command chain can be executed. Without executing it.
   */
  can() {
    return this.commandManager.can();
  }
  /**
   * Inject CSS styles.
   */
  injectCSS() {
    this.options.injectCSS && document && (this.css = Zf(Qf, this.options.injectNonce));
  }
  /**
   * Update editor options.
   *
   * @param options A list of options
   */
  setOptions(e = {}) {
    this.options = {
      ...this.options,
      ...e
    }, !(!this.view || !this.state || this.isDestroyed) && (this.options.editorProps && this.view.setProps(this.options.editorProps), this.view.updateState(this.state));
  }
  /**
   * Update editable state of the editor.
   */
  setEditable(e, t = !0) {
    this.setOptions({ editable: e }), t && this.emit("update", { editor: this, transaction: this.state.tr });
  }
  /**
   * Returns whether the editor is editable.
   */
  get isEditable() {
    return this.options.editable && this.view && this.view.editable;
  }
  /**
   * Returns the editor state.
   */
  get state() {
    return this.view.state;
  }
  /**
   * Register a ProseMirror plugin.
   *
   * @param plugin A ProseMirror plugin
   * @param handlePlugins Control how to merge the plugin into the existing plugins.
   * @returns The new editor state
   */
  registerPlugin(e, t) {
    const n = Hs(t) ? t(e, [...this.state.plugins]) : [...this.state.plugins, e], i = this.state.reconfigure({ plugins: n });
    return this.view.updateState(i), i;
  }
  /**
   * Unregister a ProseMirror plugin.
   *
   * @param nameOrPluginKeyToRemove The plugins name
   * @returns The new editor state or undefined if the editor is destroyed
   */
  unregisterPlugin(e) {
    if (this.isDestroyed)
      return;
    const t = this.state.plugins;
    let n = t;
    if ([].concat(e).forEach((s) => {
      const o = typeof s == "string" ? `${s}$` : s.key;
      n = n.filter((l) => !l.key.startsWith(o));
    }), t.length === n.length)
      return;
    const i = this.state.reconfigure({
      plugins: n
    });
    return this.view.updateState(i), i;
  }
  /**
   * Creates an extension manager.
   */
  createExtensionManager() {
    var e, t;
    const i = [...this.options.enableCoreExtensions ? [
      Hf,
      Oc.configure({
        blockSeparator: (t = (e = this.options.coreExtensionOptions) === null || e === void 0 ? void 0 : e.clipboardTextSerializer) === null || t === void 0 ? void 0 : t.blockSeparator
      }),
      qf,
      Gf,
      Yf,
      Xf,
      Kf,
      _f
    ].filter((s) => typeof this.options.enableCoreExtensions == "object" ? this.options.enableCoreExtensions[s.name] !== !1 : !0) : [], ...this.options.extensions].filter((s) => ["extension", "node", "mark"].includes(s == null ? void 0 : s.type));
    this.extensionManager = new Ue(i, this);
  }
  /**
   * Creates an command manager.
   */
  createCommandManager() {
    this.commandManager = new en({
      editor: this
    });
  }
  /**
   * Creates a ProseMirror schema.
   */
  createSchema() {
    this.schema = this.extensionManager.schema;
  }
  /**
   * Creates a ProseMirror view.
   */
  createView() {
    var e;
    let t;
    try {
      t = Jn(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: this.options.enableContentCheck });
    } catch (o) {
      if (!(o instanceof Error) || !["[tiptap error]: Invalid JSON content", "[tiptap error]: Invalid HTML content"].includes(o.message))
        throw o;
      this.emit("contentError", {
        editor: this,
        error: o,
        disableCollaboration: () => {
          this.storage.collaboration && (this.storage.collaboration.isDisabled = !0), this.options.extensions = this.options.extensions.filter((l) => l.name !== "collaboration"), this.createExtensionManager();
        }
      }), t = Jn(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: !1 });
    }
    const n = Qs(t, this.options.autofocus);
    this.view = new va(this.options.element, {
      ...this.options.editorProps,
      attributes: {
        // add `role="textbox"` to the editor element
        role: "textbox",
        ...(e = this.options.editorProps) === null || e === void 0 ? void 0 : e.attributes
      },
      dispatchTransaction: this.dispatchTransaction.bind(this),
      state: He.create({
        doc: t,
        selection: n || void 0
      })
    });
    const i = this.state.reconfigure({
      plugins: this.extensionManager.plugins
    });
    this.view.updateState(i), this.createNodeViews(), this.prependClass();
    const s = this.view.dom;
    s.editor = this;
  }
  /**
   * Creates all node views.
   */
  createNodeViews() {
    this.view.isDestroyed || this.view.setProps({
      nodeViews: this.extensionManager.nodeViews
    });
  }
  /**
   * Prepend class name to element.
   */
  prependClass() {
    this.view.dom.className = `tiptap ${this.view.dom.className}`;
  }
  captureTransaction(e) {
    this.isCapturingTransaction = !0, e(), this.isCapturingTransaction = !1;
    const t = this.capturedTransaction;
    return this.capturedTransaction = null, t;
  }
  /**
   * The callback over which to send transactions (state updates) produced by the view.
   *
   * @param transaction An editor state transaction
   */
  dispatchTransaction(e) {
    if (this.view.isDestroyed)
      return;
    if (this.isCapturingTransaction) {
      if (!this.capturedTransaction) {
        this.capturedTransaction = e;
        return;
      }
      e.steps.forEach((o) => {
        var l;
        return (l = this.capturedTransaction) === null || l === void 0 ? void 0 : l.step(o);
      });
      return;
    }
    const t = this.state.apply(e), n = !this.state.selection.eq(t.selection);
    this.emit("beforeTransaction", {
      editor: this,
      transaction: e,
      nextState: t
    }), this.view.updateState(t), this.emit("transaction", {
      editor: this,
      transaction: e
    }), n && this.emit("selectionUpdate", {
      editor: this,
      transaction: e
    });
    const i = e.getMeta("focus"), s = e.getMeta("blur");
    i && this.emit("focus", {
      editor: this,
      event: i.event,
      transaction: e
    }), s && this.emit("blur", {
      editor: this,
      event: s.event,
      transaction: e
    }), !(!e.docChanged || e.getMeta("preventUpdate")) && this.emit("update", {
      editor: this,
      transaction: e
    });
  }
  /**
   * Get attributes of the currently selected node or mark.
   */
  getAttributes(e) {
    return xf(this.state, e);
  }
  isActive(e, t) {
    const n = typeof e == "string" ? e : null, i = typeof e == "string" ? t : e;
    return Mf(this.state, n, i);
  }
  /**
   * Get the document as JSON.
   */
  getJSON() {
    return this.state.doc.toJSON();
  }
  /**
   * Get the document as HTML.
   */
  getHTML() {
    return cr(this.state.doc.content, this.schema);
  }
  /**
   * Get the document as text.
   */
  getText(e) {
    const { blockSeparator: t = `

`, textSerializers: n = {} } = e || {};
    return bf(this.state.doc, {
      blockSeparator: t,
      textSerializers: {
        ...Ys(this.schema),
        ...n
      }
    });
  }
  /**
   * Check if there is no content.
   */
  get isEmpty() {
    return hr(this.state.doc);
  }
  /**
   * Get the number of characters for the current document.
   *
   * @deprecated
   */
  getCharacterCount() {
    return console.warn('[tiptap warn]: "editor.getCharacterCount()" is deprecated. Please use "editor.storage.characterCount.characters()" instead.'), this.state.doc.content.size - 2;
  }
  /**
   * Destroy the editor.
   */
  destroy() {
    if (this.emit("destroy"), this.view) {
      const e = this.view.dom;
      e && e.editor && delete e.editor, this.view.destroy();
    }
    this.removeAllListeners();
  }
  /**
   * Check if the editor is already destroyed.
   */
  get isDestroyed() {
    var e;
    return !(!((e = this.view) === null || e === void 0) && e.docView);
  }
  $node(e, t) {
    var n;
    return ((n = this.$doc) === null || n === void 0 ? void 0 : n.querySelector(e, t)) || null;
  }
  $nodes(e, t) {
    var n;
    return ((n = this.$doc) === null || n === void 0 ? void 0 : n.querySelectorAll(e, t)) || null;
  }
  $pos(e) {
    const t = this.state.doc.resolve(e);
    return new Ae(t, this);
  }
  get $doc() {
    return this.$pos(0);
  }
}
function od(r) {
  return new nn({
    find: r.find,
    handler: ({ state: e, range: t, match: n }) => {
      const i = w(r.getAttributes, void 0, n);
      if (i === !1 || i === null)
        return null;
      const { tr: s } = e, o = n[n.length - 1], l = n[0];
      if (o) {
        const a = l.search(/\S/), c = t.from + l.indexOf(o), f = c + o.length;
        if (ro(t.from, t.to, e.doc).filter((h) => h.mark.type.excluded.find((m) => m === r.type && m !== h.mark.type)).filter((h) => h.to > c).length)
          return null;
        f < t.to && s.delete(f, t.to), c > t.from && s.delete(t.from + a, c);
        const u = t.from + a + o.length;
        s.addMark(t.from + a, u, r.type.create(i || {})), s.removeStoredMark(r.type);
      }
    }
  });
}
function ld(r) {
  return new nn({
    find: r.find,
    handler: ({ state: e, range: t, match: n }) => {
      const i = w(r.getAttributes, void 0, n) || {}, { tr: s } = e, o = t.from;
      let l = t.to;
      const a = r.type.create(i);
      if (n[1]) {
        const c = n[0].lastIndexOf(n[1]);
        let f = o + c;
        f > l ? f = l : l = f + n[1].length;
        const d = n[0][n[0].length - 1];
        s.insertText(d, o + n[0].length - 1), s.replaceWith(f, l, a);
      } else if (n[0]) {
        const c = r.type.isInline ? o : o - 1;
        s.insert(c, r.type.create(i)).delete(s.mapping.map(o), s.mapping.map(l));
      }
      s.scrollIntoView();
    }
  });
}
function ad(r) {
  return new nn({
    find: r.find,
    handler: ({ state: e, range: t, match: n }) => {
      const i = e.doc.resolve(t.from), s = w(r.getAttributes, void 0, n) || {};
      if (!i.node(-1).canReplaceWith(i.index(-1), i.indexAfter(-1), r.type))
        return null;
      e.tr.delete(t.from, t.to).setBlockType(t.from, t.from, r.type, s);
    }
  });
}
function cd(r) {
  return new nn({
    find: r.find,
    handler: ({ state: e, range: t, match: n, chain: i }) => {
      const s = w(r.getAttributes, void 0, n) || {}, o = e.tr.delete(t.from, t.to), a = o.doc.resolve(t.from).blockRange(), c = a && Un(a, r.type, s);
      if (!c)
        return null;
      if (o.wrap(a, c), r.keepMarks && r.editor) {
        const { selection: d, storedMarks: u } = e, { splittableMarks: h } = r.editor.extensionManager, p = u || d.$to.parentOffset && d.$from.marks();
        if (p) {
          const m = p.filter((g) => h.includes(g.type.name));
          o.ensureMarks(m);
        }
      }
      if (r.keepAttributes) {
        const d = r.type.name === "bulletList" || r.type.name === "orderedList" ? "listItem" : "taskList";
        i().updateAttributes(d, s).run();
      }
      const f = o.doc.resolve(t.from - 1).nodeBefore;
      f && f.type === r.type && Ne(o.doc, t.from - 1) && (!r.joinPredicate || r.joinPredicate(n, f)) && o.join(t.from - 1);
    }
  });
}
class qn {
  constructor(e = {}) {
    this.type = "node", this.name = "node", this.parent = null, this.child = null, this.config = {
      name: this.name,
      defaultOptions: {}
    }, this.config = {
      ...this.config,
      ...e
    }, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = w(x(this, "addOptions", {
      name: this.name
    }))), this.storage = w(x(this, "addStorage", {
      name: this.name,
      options: this.options
    })) || {};
  }
  static create(e = {}) {
    return new qn(e);
  }
  configure(e = {}) {
    const t = this.extend({
      ...this.config,
      addOptions: () => rn(this.options, e)
    });
    return t.name = this.name, t.parent = this.parent, t;
  }
  extend(e = {}) {
    const t = new qn(e);
    return t.parent = this, this.child = t, t.name = e.name ? e.name : t.parent.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${t.name}".`), t.options = w(x(t, "addOptions", {
      name: t.name
    })), t.storage = w(x(t, "addStorage", {
      name: t.name,
      options: t.options
    })), t;
  }
}
class fd {
  constructor(e, t, n) {
    this.isDragging = !1, this.component = e, this.editor = t.editor, this.options = {
      stopEvent: null,
      ignoreMutation: null,
      ...n
    }, this.extension = t.extension, this.node = t.node, this.decorations = t.decorations, this.innerDecorations = t.innerDecorations, this.view = t.view, this.HTMLAttributes = t.HTMLAttributes, this.getPos = t.getPos, this.mount();
  }
  mount() {
  }
  get dom() {
    return this.editor.view.dom;
  }
  get contentDOM() {
    return null;
  }
  onDragStart(e) {
    var t, n, i, s, o, l, a;
    const { view: c } = this.editor, f = e.target, d = f.nodeType === 3 ? (t = f.parentElement) === null || t === void 0 ? void 0 : t.closest("[data-drag-handle]") : f.closest("[data-drag-handle]");
    if (!this.dom || !((n = this.contentDOM) === null || n === void 0) && n.contains(f) || !d)
      return;
    let u = 0, h = 0;
    if (this.dom !== d) {
      const C = this.dom.getBoundingClientRect(), M = d.getBoundingClientRect(), D = (i = e.offsetX) !== null && i !== void 0 ? i : (s = e.nativeEvent) === null || s === void 0 ? void 0 : s.offsetX, E = (o = e.offsetY) !== null && o !== void 0 ? o : (l = e.nativeEvent) === null || l === void 0 ? void 0 : l.offsetY;
      u = M.x - C.x + D, h = M.y - C.y + E;
    }
    const p = this.dom.cloneNode(!0);
    (a = e.dataTransfer) === null || a === void 0 || a.setDragImage(p, u, h);
    const m = this.getPos();
    if (typeof m != "number")
      return;
    const g = S.create(c.state.doc, m), y = c.state.tr.setSelection(g);
    c.dispatch(y);
  }
  stopEvent(e) {
    var t;
    if (!this.dom)
      return !1;
    if (typeof this.options.stopEvent == "function")
      return this.options.stopEvent({ event: e });
    const n = e.target;
    if (!(this.dom.contains(n) && !(!((t = this.contentDOM) === null || t === void 0) && t.contains(n))))
      return !1;
    const s = e.type.startsWith("drag"), o = e.type === "drop";
    if ((["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(n.tagName) || n.isContentEditable) && !o && !s)
      return !0;
    const { isEditable: a } = this.editor, { isDragging: c } = this, f = !!this.node.type.spec.draggable, d = S.isSelectable(this.node), u = e.type === "copy", h = e.type === "paste", p = e.type === "cut", m = e.type === "mousedown";
    if (!f && d && s && e.target === this.dom && e.preventDefault(), f && s && !c && e.target === this.dom)
      return e.preventDefault(), !1;
    if (f && a && !c && m) {
      const g = n.closest("[data-drag-handle]");
      g && (this.dom === g || this.dom.contains(g)) && (this.isDragging = !0, document.addEventListener("dragend", () => {
        this.isDragging = !1;
      }, { once: !0 }), document.addEventListener("drop", () => {
        this.isDragging = !1;
      }, { once: !0 }), document.addEventListener("mouseup", () => {
        this.isDragging = !1;
      }, { once: !0 }));
    }
    return !(c || o || u || h || p || m && d);
  }
  /**
   * Called when a DOM [mutation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) or a selection change happens within the view.
   * @return `false` if the editor should re-read the selection or re-parse the range around the mutation
   * @return `true` if it can safely be ignored.
   */
  ignoreMutation(e) {
    return !this.dom || !this.contentDOM ? !0 : typeof this.options.ignoreMutation == "function" ? this.options.ignoreMutation({ mutation: e }) : this.node.isLeaf || this.node.isAtom ? !0 : e.type === "selection" || this.dom.contains(e.target) && e.type === "childList" && (sn() || Zs()) && this.editor.isFocused && [
      ...Array.from(e.addedNodes),
      ...Array.from(e.removedNodes)
    ].every((n) => n.isContentEditable) ? !1 : this.contentDOM === e.target && e.type === "attributes" ? !0 : !this.contentDOM.contains(e.target);
  }
  /**
   * Update the attributes of the prosemirror node.
   */
  updateAttributes(e) {
    this.editor.commands.command(({ tr: t }) => {
      const n = this.getPos();
      return typeof n != "number" ? !1 : (t.setNodeMarkup(n, void 0, {
        ...this.node.attrs,
        ...e
      }), !0);
    });
  }
  /**
   * Delete the node.
   */
  deleteNode() {
    const e = this.getPos();
    if (typeof e != "number")
      return;
    const t = e + this.node.nodeSize;
    this.editor.commands.deleteRange({ from: e, to: t });
  }
}
function dd(r) {
  return new Us({
    find: r.find,
    handler: ({ state: e, range: t, match: n, pasteEvent: i }) => {
      const s = w(r.getAttributes, void 0, n, i);
      if (s === !1 || s === null)
        return null;
      const { tr: o } = e, l = n[n.length - 1], a = n[0];
      let c = t.to;
      if (l) {
        const f = a.search(/\S/), d = t.from + a.indexOf(l), u = d + l.length;
        if (ro(t.from, t.to, e.doc).filter((p) => p.mark.type.excluded.find((g) => g === r.type && g !== p.mark.type)).filter((p) => p.to > d).length)
          return null;
        u < t.to && o.delete(u, t.to), d > t.from && o.delete(t.from + f, d), c = t.from + f + l.length, o.addMark(t.from + f, c, r.type.create(s || {})), o.removeStoredMark(r.type);
      }
    }
  });
}
function ud(r, e) {
  const { selection: t } = r, { $from: n } = t;
  if (t instanceof S) {
    const s = n.index();
    return n.parent.canReplaceWith(s, s + 1, e);
  }
  let i = n.depth;
  for (; i >= 0; ) {
    const s = n.index(i);
    if (n.node(i).contentMatchAt(s).matchType(e))
      return !0;
    i -= 1;
  }
  return !1;
}
function hd(r) {
  return r.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
function pd(r) {
  return new Us({
    find: r.find,
    handler({ match: e, chain: t, range: n, pasteEvent: i }) {
      const s = w(r.getAttributes, void 0, e, i), o = w(r.getContent, void 0, s);
      if (s === !1 || s === null)
        return null;
      const l = { type: r.type.name, attrs: s };
      o && (l.content = o), e.input && t().deleteRange(n).insertContentAt(n.from, l);
    }
  });
}
export {
  _ as A,
  _i as B,
  yf as C,
  v as D,
  ne as E,
  b as F,
  pd as G,
  ir as H,
  zt as I,
  bi as J,
  Mf as K,
  ed as L,
  qt as M,
  qn as N,
  nd as O,
  oe as P,
  td as Q,
  ro as R,
  k as S,
  O as T,
  xf as U,
  dr as V,
  ur as W,
  xe as X,
  We as a,
  ee as b,
  dd as c,
  od as d,
  hd as e,
  ud as f,
  S as g,
  kc as h,
  rd as i,
  Xs as j,
  sd as k,
  fd as l,
  dc as m,
  ld as n,
  Wn as o,
  id as p,
  lt as q,
  Ko as r,
  ja as s,
  ad as t,
  N as u,
  w as v,
  cd as w,
  x,
  hr as y,
  Qo as z
};
