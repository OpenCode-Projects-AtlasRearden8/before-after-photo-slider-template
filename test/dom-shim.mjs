/*
 * Tiny DOM shim, just big enough to render the slider template in Node
 * with zero dependencies. Supports only what slider.js needs on load.
 */

class ShimNode {
  constructor(tag) {
    this.nodeType = 1;
    this.tagName = String(tag || "").toUpperCase();
    this.childNodes = [];
    this.parentNode = null;
    this.className = "";
    this.id = "";
    this.innerHTML = "";
    this.dataset = {};
    this.style = {
      // store the css properties set by the slider
      props: {},
      setProperty(key, value) {
        this.props[key] = value;
      },
      getPropertyValue(key) {
        return this.props[key];
      }
    };
    this._attrs = {};
  }

  get classes() {
    return this.className ? this.className.split(/\s+/) : [];
  }

  setAttribute(key, value) {
    this._attrs[key] = String(value);
  }

  getAttribute(key) {
    return this._attrs[key];
  }

  get textContent() {
    let out = "";
    for (const child of this.childNodes) {
      if (typeof child.textContent === "string") out += child.textContent;
      else out += String(child);
    }
    return out;
  }

  set textContent(value) {
    // text nodes own their value directly; elements replace children with one text node
    if (this.nodeType === 3) {
      Object.defineProperty(this, "textContent", {
        value: String(value),
        writable: true,
        enumerable: true,
        configurable: true
      });
      return;
    }
    this.childNodes.length = 0;
    if (value !== undefined && value !== "") {
      const text = new ShimNode("#text");
      text.nodeType = 3;
      text.textContent = String(value);
      text.parentNode = this;
      this.childNodes.push(text);
    }
  }

  get src() {
    return this._attrs.src || "";
  }

  set src(value) {
    this._attrs.src = String(value); // browsers reflect .src onto the attribute
  }

  get alt() {
    return this._attrs.alt || "";
  }

  set alt(value) {
    this._attrs.alt = String(value);
  }

  appendChild(child) {
    if (child instanceof ShimFragment) {
      for (const node of child.childNodes.slice()) {
        this.appendChild(node);
      }
      return child;
    }
    if (child && typeof child === "object" && child.nodeType) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    // plain text
    const text = new ShimNode("#text");
    text.textContent = String(child);
    text.parentNode = this;
    this.childNodes.push(text);
    return text;
  }

  addEventListener(type, fn) {
    this._listeners = this._listeners || {};
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }

  fire(type, event) {
    for (const fn of this._listeners && this._listeners[type] ? this._listeners[type] : []) {
      fn(event);
    }
  }
}

ShimNode.prototype.fire = ShimNode.prototype.fire;

ShimNode.prototype.matches = function (selector) {
  if (!selector) return false;
  if (selector.startsWith(".")) return this.tagName !== "#TEXT" && this.classes.includes(selector.slice(1));
  return false;
};

ShimNode.prototype.querySelector = function (selector) {
  return this.querySelectorAll(selector)[0] || null;
};

ShimNode.prototype.querySelectorAll = function (selector, out = []) {
  for (const child of this.childNodes) {
    if (child.matches(selector)) out.push(child);
    child.querySelectorAll(selector, out);
  }
  return out;
};

ShimNode.prototype.closest = function (selector) {
  let node = this;
  while (node && !node.matches(selector)) node = node.parentNode;
  return node || null;
};

class ShimFragment {
  constructor() {
    this.nodeType = 11;
    this.childNodes = [];
  }
  appendChild(child) {
    this.childNodes.push(child);
    return child;
  }
}

// keep the helper types happy

const document = {
  createElement: (tag) => new ShimNode(tag),
  createTextNode: (text) => {
    const n = new ShimNode("#text");
    n.nodeType = 3;
    n.textContent = text;
    return n;
  },
  createDocumentFragment: () => new ShimFragment()
};

export { ShimNode, document };
