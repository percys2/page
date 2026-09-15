"use strict";

// Run: node --test tests/form-security.test.cjs
// Executes the real application closures in a Node VM with a small DOM fixture.
// This verifies fail-closed setup and submission logic, not browser behavior/CSP.
// window.open is a recording stub: no request or WhatsApp message is sent.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");
const root = resolve(__dirname, "..");
const read = file => readFileSync(resolve(root, file), "utf8");

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=<>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ""]));
}

function formSource(file, id) {
  const html = read(file);
  const match = [...html.matchAll(/(<form\b[^>]*>)([\s\S]*?)<\/form>/gi)]
    .find(entry => attributes(entry[1]).id === id);
  assert.ok(match, `${file}: ${id} exists`);
  const external = [...html.matchAll(/<(?:input|button|select|textarea)\b[^>]*>/gi)]
    .map(entry => entry[0]).filter(tag => attributes(tag).form === id);
  return {
    attrs: attributes(match[1]), body: match[2],
    controls: [...match[2].matchAll(/<(?:input|button|select|textarea)\b[^>]*>/gi)]
      .map(entry => entry[0]).concat(external).map(attributes)
  };
}

const forms = [
  { file: "contact.html", id: "contact-form", script: "js/site.js" },
  { file: "products.html", id: "order-form", script: "js/store.js" }
];

function fixture(spec, { failSubmitBinding = false } = {}) {
  const source = formSource(spec.file, spec.id);
  const nodes = new Map();
  const popups = [];
  const order = spec.id === "order-form";
  function node(id, attrs = {}) {
    const classes = new Set();
    const result = {
      id, attrs, listeners: {}, value: "", hidden: false, textContent: "",
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle(name, force) {
          const enabled = force ?? !classes.has(name);
          if (enabled) classes.add(name); else classes.delete(name);
          return enabled;
        }
      },
      hasAttribute: name => Object.hasOwn(attrs, name),
      querySelector: () => null, querySelectorAll: () => [],
      setAttribute() {}, focus() {}, scrollIntoView() {},
      addEventListener(type, handler) {
        if (id === spec.id && type === "submit" && failSubmitBinding) throw new Error("simulated binding failure");
        result.listeners[type] = handler;
      }
    };
    nodes.set(id, result);
    return result;
  }
  const form = node(spec.id, source.attrs);
  const fallback = node("fallback");
  form.querySelector = selector => selector === "[data-form-fallback]" ? fallback : null;
  form.elements = source.controls.map((attrs, index) => {
    const control = node(attrs.id || `${spec.id}-${index}`, attrs);
    let disabled = Object.hasOwn(attrs, "disabled");
    Object.defineProperty(control, "disabled", {
      get: () => disabled,
      set(value) {
        if (!value) assert.equal(typeof form.listeners.submit, "function", "submit handler must precede activation");
        disabled = value;
      }
    });
    return control;
  });
  const getNode = id => nodes.get(id) || node(id);
  const originalUrl = `https://www.agrocentronica.com/${spec.file}`;
  const location = Object.freeze({ href: originalUrl, search: "", pathname: `/${spec.file}` });
  const product = { id: 2, name: "Iniciarina", type: "alimentos", category: "aves" };
  const model = {
    products: [product], types: { alimentos: "Alimentos" }, categories: { aves: "Aves" }, stages: {},
    getName: entry => entry.name, getOrderName: entry => `${entry.name} 100 lb`,
    getImage: () => "assets/test-feed.png", getGuide: () => ({ presentation: "100 lb" }),
    compareProducts: () => 0
  };
  const window = {
    AGROCENTRO_CATALOG: model,
    open: (...args) => { popups.push(args); return null; },
    addEventListener() {}, setTimeout: () => 0, clearTimeout() {},
    history: { replaceState() { throw new Error("unexpected URL write"); } }
  };
  Object.defineProperty(window, "location", { get: () => location, set() { throw new Error("unexpected navigation"); } });
  const context = {
    window, URL, URLSearchParams,
    document: { readyState: "loading", getElementById: getNode, querySelectorAll: () => [], addEventListener() {} },
    localStorage: { getItem: () => "[]", setItem() { throw new Error("unexpected data persistence"); } },
    FormData: class {
      constructor(currentForm) {
        this.values = new Map(currentForm.elements.filter(control => !control.disabled && control.attrs.name)
          .map(control => [control.attrs.name, control.value]));
      }
      get(name) { return this.values.get(name) ?? null; }
    }
  };
  const exported = order
    ? "window.__test = { setup() { cacheElements(); bindEvents(); }, setOrder(items) { order = items; } };"
    : "window.__test = { setup: setupContactForm };";
  const code = read(spec.script);
  assert.match(code, /\n\}\)\(\);\s*$/);
  runInNewContext(code.replace(/\n\}\)\(\);\s*$/, `\n${exported}\n})();`), context, { filename: spec.script });
  return {
    form, fallback, popups, nodes, window, originalUrl,
    setup: window.__test.setup,
    setOrder: window.__test.setOrder,
    fill(values) {
      for (const [name, value] of Object.entries(values)) {
        const control = form.elements.find(entry => entry.attrs.name === name);
        assert.ok(control, `missing ${name}`);
        control.value = value;
      }
    },
    submit() {
      let prevented = false;
      form.listeners.submit({ preventDefault() { prevented = true; } });
      assert.ok(prevented, "native submit must always be cancelled");
      assert.equal(window.location.href, originalUrl, "personal data must not enter the page URL");
    }
  };
}

for (const spec of forms) {
  test(`${spec.id}: without JS, personal controls are disabled and native method is POST`, () => {
    const source = formSource(spec.file, spec.id);
    assert.equal(source.attrs.method.toLowerCase(), "post");
    assert.ok(!source.attrs.action.includes("?"));
    for (const attrs of source.controls) {
      assert.ok(Object.hasOwn(attrs, "disabled"), `disabled missing: ${attrs.id || attrs.name || attrs.type}`);
      assert.ok(Object.hasOwn(attrs, "data-enable-with-js"));
    }
    if (spec.id === "order-form") {
      assert.ok(source.controls.some(attrs => attrs.id === "send-order" && attrs.form === "order-form"), "external submit participates");
    }
    assert.match(source.body, /<p\b[^>]*data-form-fallback[^>]*>[^<]*<a\b[^>]*href="https:\/\/wa\.me\/50582403490"/);
    assert.doesNotMatch(source.body.match(/<p\b[^>]*data-form-fallback[^>]*>/)[0], /\bhidden\b/);
  });

  test(`${spec.id}: setup only activates after submit binding; binding failure leaves fallback usable`, () => {
    const working = fixture(spec);
    working.setup();
    assert.ok(working.form.elements.every(control => !control.disabled));
    assert.equal(working.fallback.hidden, true);
    const failed = fixture(spec, { failSubmitBinding: true });
    assert.throws(failed.setup, /simulated binding failure/);
    assert.ok(failed.form.elements.every(control => control.disabled));
    assert.equal(failed.fallback.hidden, false);
    assert.equal(failed.popups.length, 0);
  });
}

function assertPopup(f, expected) {
  assert.equal(f.popups.length, 1);
  const [href, target, features] = f.popups[0];
  const url = new URL(href);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/50582403490");
  assert.deepEqual([...url.searchParams.keys()], ["text"], "reserved characters must not create extra query parameters");
  for (const text of expected) assert.ok(url.searchParams.get("text").includes(text), text);
  assert.equal(target, "_blank");
  assert.equal(features, "noopener,noreferrer");
}

test("contact: valid encoded content opens only the simulated WhatsApp popup", () => {
  const f = fixture(forms[0]);
  f.setup();
  f.fill({ name: "Cliente Prueba & Familia", phone: "8888 0000", topic: "Producto o precio", message: "Iniciarina 100 lb? A&B #consulta + entrega" });
  f.submit();
  assertPopup(f, ["Cliente Prueba & Familia", "8888 0000", "Iniciarina 100 lb? A&B #consulta + entrega"]);
});

test("contact: missing fields and invalid phones cancel submission without opening a popup", () => {
  for (const invalid of [{ name: " " }, { phone: "123" }, { phone: "123456789012" }, { message: " " }]) {
    const f = fixture(forms[0]);
    f.setup();
    f.fill({ name: "Cliente Prueba", phone: "88880000", message: "Consultar alimento", ...invalid });
    f.submit();
    assert.equal(f.popups.length, 0);
    assert.equal(f.nodes.get("contact-form-message").hidden, false);
  }
});

test("order: valid feed order opens encoded content only in the simulated WhatsApp popup", () => {
  const f = fixture(forms[1]);
  f.setup();
  f.setOrder([{ id: 2, qty: 2 }]);
  f.fill({ name: "Cliente Prueba & Familia", phone: "88880000", delivery: "Solicitar entrega", location: "Barrio Prueba", notes: "Referencia A&B #consulta + entrega" });
  f.submit();
  assertPopup(f, ["Cliente Prueba & Familia", "2 × Iniciarina", "100 lb", "Barrio Prueba", "Referencia A&B #consulta + entrega"]);
});

test("order: empty cart, invalid identity and missing delivery location cancel native submission", () => {
  for (const invalid of [null, { name: " " }, { phone: "123" }, { delivery: "" }, { location: " " }]) {
    const f = fixture(forms[1]);
    f.setup();
    f.setOrder(invalid === null ? [] : [{ id: 2, qty: 1 }]);
    f.fill({ name: "Cliente Prueba", phone: "88880000", delivery: "Solicitar entrega", location: "Barrio Prueba", ...(invalid || {}) });
    f.submit();
    assert.equal(f.popups.length, 0);
    if (invalid !== null) assert.equal(f.nodes.get("form-error").hidden, false);
  }
});

test("GET searches retain ordinary URL navigation and have no personal data fields", () => {
  let count = 0;
  for (const file of ["index.html", "products.html", "contact.html", "guia-de-uso.html"]) {
    for (const match of read(file).matchAll(/(<form\b[^>]*>)([\s\S]*?)<\/form>/gi)) {
      const attrs = attributes(match[1]);
      if (attrs.role !== "search") continue;
      assert.equal(attrs.method.toLowerCase(), "get");
      assert.equal(attrs.action, "products.html");
      assert.doesNotMatch(match[2], /\bname="(?:name|phone|location|message|notes)"/);
      assert.doesNotMatch(match[2], /<(?:input|button)\b[^>]*\bdisabled\b/);
      count++;
    }
  }
  assert.equal(count, 5);
});
