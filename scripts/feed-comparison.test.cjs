"use strict";

// Run: node --test scripts/feed-comparison.test.cjs
// Uses the published catalog, model and comparison code in a Node VM.
// These checks validate data/behavior; they do not simulate visual browser layout.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { createContext, runInContext } = require("node:vm");
const root = resolve(__dirname, "..");
const read = file => readFileSync(resolve(root, file), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));
const unavailable = "No disponible en esta ficha";

function load(overrides = {}) {
  const window = {
    location: { href: "https://www.agrocentronica.com/comparar-alimentos.html", search: "" },
    addEventListener() {},
    ...overrides.window
  };
  const document = overrides.document || {
    readyState: "complete", querySelector: () => null, getElementById: () => null,
    addEventListener() {}
  };
  const context = createContext({
    window, document, URL, URLSearchParams, console,
    navigator: {}, setTimeout, clearTimeout,
    ...overrides.globals
  });
  for (const file of ["catalog-data.js", "image-overrides.js", "feed-guides-v12.js",
    "responsive-images.js", "veterinary-data.js", "catalog-model.js", "feed-comparison.js"]) {
    runInContext(read(file), context, { filename: file });
  }
  return { api: window.AGROCENTRO_FEED_COMPARISON, model: window.AGROCENTRO_CATALOG, window, document, context };
}

const { api, model } = load();
const product = id => {
  const entry = model.products.find(candidate => candidate.id === id);
  assert.ok(entry, `catalog product ${id}`);
  return entry;
};
function row(rows, expression) {
  const matches = rows.filter(candidate => expression.test(candidate.label));
  assert.equal(matches.length, 1, `one row matching ${expression}`);
  return matches[0];
}

test("all 39 food presentations are selectable without veterinary products or tools", () => {
  const feeds = api.getFeeds();
  assert.equal(feeds.length, 39);
  assert.ok(feeds.every(entry => entry.type === "alimentos"));
  assert.equal(new Set(feeds.map(entry => entry.id)).size, 39);
  const expected = model.products.filter(entry => entry.type === "alimentos").map(entry => entry.id).sort((a,b) => a-b);
  assert.deepEqual(plain(feeds.map(entry => entry.id).sort((a,b) => a-b)), plain(expected));
  assert.ok(feeds.some(entry => entry.id === 16) && feeds.some(entry => entry.id === 17), "different package sizes remain selectable");
});

test("selection limits comparisons to three distinct products for the chosen animal", () => {
  const result = api.parseSelection("?animal=cerdos&productos=24,24,25,2,37,26");
  assert.equal(result.animal, "cerdos");
  assert.deepEqual(plain(result.ids), [24, 25, 37]);
  assert.ok(result.notice, "discarded choices must be explained");
  assert.deepEqual(plain(api.parseSelection("?animal=aves&productos=2,24,1").ids), [2, 1]);
});

test("shared selections infer the animal from the first valid food and reject hostile or malformed IDs", () => {
  const nonFood = model.products.find(entry => entry.type !== "alimentos").id;
  const query = new URLSearchParams({ productos: `${nonFood},999999,NaN,Infinity,2x,2.1,-2,0,<img src=x onerror=alert(1)>,16,17,2` });
  const selection = api.parseSelection(`?${query}`);
  assert.equal(selection.animal, "perros");
  assert.deepEqual(plain(selection.ids), [16, 17]);
  assert.ok(selection.notice);
  assert.ok(!selection.notice.includes("<img"), "query payload must not be echoed into a notice");
  const empty = api.parseSelection("");
  assert.equal(empty.animal, "aves");
  assert.deepEqual(plain(empty.ids), []);
});

test("each valid animal selection has an exact canonical URL round trip including presentation IDs", () => {
  for (const [animal, ids] of [["aves", [4,2,1]], ["cerdos", [24,25,37]], ["equinos", [6,7,23]],
    ["conejos", [9]], ["perros", [16,17,40]], ["gatos", [18,19,21]]]) {
    const url = new URL(api.buildComparisonUrl(ids, animal));
    assert.equal(url.origin, "https://www.agrocentronica.com");
    assert.equal(url.pathname, "/comparar-alimentos.html");
    assert.equal(url.searchParams.get("animal"), animal);
    assert.equal(url.searchParams.get("productos"), ids.join(","));
    assert.deepEqual(plain(api.parseSelection(url.search).ids), ids);
    assert.equal(api.parseSelection(url.search).animal, animal);
  }
  const sanitized = new URL(api.buildComparisonUrl([16, 16, 17, 2, 40, 35, 999999], "perros"));
  assert.equal(sanitized.searchParams.get("productos"), "16,17,40");
});

test("package labels distinguish real Dogui, Don Gato and Pet Master variants", () => {
  for (const [id, name, presentation] of [[16, "Dogui Cachorros", "454 g / 1 lb"],
    [17, "Dogui Cachorros", "18 kg / 39.6 lb"], [18, "Don Gato Adultos", "454 g / 1 lb"],
    [19, "Don Gato Adultos", "8 kg / 17.6 lb"], [40, "Pet Master Cachorros", "454 g / 1 lb"],
    [35, "Pet Master Cachorros", "20 kg / 44.1 lb"]]) {
    assert.equal(api.getProductLabel(product(id)), `${name} — ${presentation}`);
  }
  const rows = api.getEssentialRows([product(16), product(17)]);
  assert.deepEqual(plain(row(rows, /presentaci[oó]n/i).values), ["454 g / 1 lb", "18 kg / 39.6 lb"]);
  assert.ok(!JSON.stringify(rows).includes("línea Cachorros:"), "the selected presentation must not be replaced by the entire product line");
});

test("NeoPigg age programs retain distinct days and their program labels", () => {
  const expected = { 24: ["5–27", "5–30"], 25: ["28–34", "31–39"],
    37: ["35–43", "40–48"], 26: ["44–70", "49–70"] };
  for (const [id, [optimo, plus]] of Object.entries(expected)) {
    const rows = api.getEssentialRows([product(Number(id))]);
    const text = rows.map(entry => `${entry.label}: ${entry.values[0]}`).join("\n");
    assert.ok(text.includes(`Óptimo: ${optimo} días`), `Óptimo age for NeoPigg ${id}`);
    assert.ok(text.includes(`Plus: ${plus} días`), `Plus age for NeoPigg ${id}`);
  }
});

test("broiler and laying-hen age ranges keep their exact product-specific stages", () => {
  for (const [id, period] of [[4, "Días 1–7 de edad"], [2, "Días 8–21 de edad"],
    [1, "Desde el día 22 hasta el peso de mercado"],
    [38, "Desde las 18 semanas, durante todo el ciclo de postura"],
    [39, "Desde las 19–21 semanas hasta las 59 semanas"]]) {
    const values = api.getEssentialRows([product(id)]).flatMap(entry => entry.values);
    assert.ok(values.includes(period), `exact age or period for product ${id}`);
    assert.ok(values.includes(model.getGuide(product(id)).stage));
  }
});

test("nutrition retains minimum, maximum and range qualifiers with exact units", () => {
  const rows = api.getNutritionRows([product(2), product(1)]);
  assert.deepEqual(plain(row(rows, /^Proteína cruda \(Mínimo\)$/).values), ["22.00%", "19.00%"]);
  assert.deepEqual(plain(row(rows, /^Humedad \(Máximo\)$/).values), ["13.00%", "13.00%"]);
  assert.deepEqual(plain(row(rows, /^Calcio \(Mín.–máx\.\)$/).values), ["0.80–1.20%", "0.60–1.00%"]);
  assert.deepEqual(plain(row(rows, /^Energía metabolizable \(Mínimo\)$/).values), ["2,900 Kcal/Kg", "2,950 Kcal/Kg"]);
});

test("digestible energy and metabolizable energy remain separate within the pig comparison", () => {
  const rows = api.getNutritionRows([product(31), product(32), product(36)]);
  assert.deepEqual(plain(row(rows, /^Energía digestible \(Mínimo\)$/).values), ["2,390 Kcal/Kg", "2,345 Kcal/Kg", unavailable]);
  assert.deepEqual(plain(row(rows, /^Energía metabolizable \(Mínimo\)$/).values), [unavailable, unavailable, "3,100 Kcal/Kg"]);
});

test("Forrajina's inconsistent energy and salt are marked unconfirmed, never presented as confirmed numbers", () => {
  const rows = api.getNutritionRows([product(23), product(6)]);
  assert.deepEqual(plain(row(rows, /^Energía digestible \(Mínimo\)$/).values), ["Por confirmar en etiqueta vigente", "2,900 Kcal/Kg"]);
  assert.deepEqual(plain(row(rows, /^Sal \(Mín.–máx\.\)$/).values), ["Por confirmar en etiqueta vigente", "0.50–1.00%"]);
  assert.deepEqual(plain(row(rows, /^Proteína cruda \(Mínimo\)$/).values), ["10.00%", "13.00%"]);
  assert.ok(!JSON.stringify(rows).includes("2,660"));
  assert.ok(!JSON.stringify(rows).includes("050%"));
});

test("all 14 pet presentations with no analysis stay unavailable rather than receiving zero or borrowed nutrients", () => {
  const missing = api.getFeeds().filter(entry => !model.getGuide(entry)?.analysis);
  assert.equal(missing.length, 14);
  assert.ok(missing.every(entry => ["perros", "gatos"].includes(entry.category)));
  for (const entry of missing) {
    // Mixed species are rejected by selection; using one here isolates the data renderer's missing-data behavior.
    const rows = api.getNutritionRows([product(2), entry]);
    assert.ok(rows.length >= 8);
    assert.ok(rows.every(item => item.values[1] === unavailable), `no fabricated nutrient for ${entry.id}`);
    assert.ok(api.getNutritionRows([entry]).every(item => item.values.every(value => value === unavailable)));
  }
});

test("details use the verified feeding instructions and explain when instructions are unavailable", () => {
  const rows = api.getDetailRows([product(27), product(31), product(1)]);
  const values = rows.flatMap(entry => entry.values);
  assert.ok(values.includes("Línea estándar después de NeoPigg 4: Desarrollina → Jamonina."));
  assert.ok(values.includes(model.getGuide(product(31)).feeding));
  assert.ok(rows.some(entry => entry.values[2] === unavailable), "Engordina must not receive invented ration instructions");
  const benefits = model.getGuide(product(27)).benefits;
  assert.ok(values.some(value => benefits.every(benefit => value.includes(benefit))));
});

test("HTML text and attribute metacharacters are escaped before rendering", () => {
  assert.equal(api.escapeHtml('<img src="x" onerror=\'alert(1)\'> &'), "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt; &amp;");
  assert.equal(api.escapeHtml("0.80–1.20%"), "0.80–1.20%");
});

test("showing only differences cannot conceal unavailable or unconfirmed nutrition", () => {
  const rows = api.getNutritionRows([product(23), product(23)]);
  const visible = api.rowsForDisplay(rows, true);
  assert.equal(visible.length, 2);
  assert.ok(visible.every(entry => entry.values.every(value => value === "Por confirmar en etiqueta vigente")));
  const missingRows = [{ key: "protein", label: "Proteína cruda", values: [unavailable, unavailable] }];
  assert.equal(api.rowsForDisplay(missingRows, true).length, 1);
});

// The fixture records element identity, focus and bound delegated handlers.
// It intentionally does not implement browser rendering, CSS or clipboard permissions.
function uiFixture({ search = "?animal=perros&productos=16,17", failBinding = false, denyClipboard = false } = {}) {
  const copied = [];
  const history = [];
  const document = { readyState: "loading", activeElement: null, listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; } };
  function element(tag, attrs = {}) {
    const node = {
      tag, attrs, dataset: Object.fromEntries(Object.entries(attrs).filter(([name]) => name.startsWith("data-"))
        .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()), value])),
      children: [], listeners: {}, value: "", hidden: Object.hasOwn(attrs, "hidden"), checked: false,
      textContent: "", disabled: false, writes: 0, selected: false,
      matches(selector) {
        if (selector === "button") return this.tag === "button";
        const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
        return Boolean(match && Object.hasOwn(this.attrs, match[1]) && (match[2] === undefined || this.attrs[match[1]] === match[2]));
      },
      closest(selector) { return this.matches(selector) ? this : null; },
      contains(candidate) { return this === candidate || this.children.some(child => child.contains(candidate)); },
      querySelector(selector) { return this.children.find(child => child.matches(selector)) || null; },
      querySelectorAll(selector) { return this.children.filter(child => child.matches(selector)); },
      setAttribute(name, value) { this.attrs[name] = value; },
      focus() { document.activeElement = this; },
      select() { this.selected = true; },
      addEventListener(type, handler) {
        if (attrs.id === "feed-comparison" && failBinding) throw new Error("simulated handler binding failure");
        this.listeners[type] = handler;
      }
    };
    let markup = "";
    Object.defineProperty(node, "innerHTML", {
      get: () => markup,
      set(value) {
        if (node.children.some(child => child.contains(document.activeElement))) document.activeElement = null;
        markup = value;
        node.writes++;
        node.children = [...value.matchAll(/<([a-z]+)\b([^>]*)>/gi)].map(([, childTag, attributeSource]) => {
          const attributes = Object.fromEntries([...attributeSource.matchAll(/([^\s=<>"']+)(?:="([^"]*)")?/g)]
            .map(([, name, text]) => [name, text ?? ""]));
          return element(childTag, attributes);
        });
      }
    });
    return node;
  }
  const rootNode = element("div", { id: "feed-comparison", "aria-busy": "true" });
  const fallback = element("p", { id: "comparison-fallback" });
  document.getElementById = id => id === "feed-comparison" ? rootNode : id === "comparison-fallback" ? fallback : null;
  const runtime = load({ document, window: {
    location: { search, pathname: "/comparar-alimentos.html", href: `https://www.agrocentronica.com/comparar-alimentos.html${search}` },
    history: { replaceState: (...args) => history.push(args) },
    navigator: { clipboard: { async writeText(value) { if (denyClipboard) throw new Error("Clipboard denied"); copied.push(value); } } },
    open() { throw new Error("comparison must not send or open external messages"); }
  } });
  const get = name => rootNode.querySelector(`[data-comparison-${name}]`);
  return { ...runtime, rootNode, fallback, copied, history, get,
    start: () => document.listeners.DOMContentLoaded(),
    change: target => rootNode.listeners.change({ target }),
    click: target => rootNode.listeners.click({ target }) };
}

test("changing a presentation preserves the selected control and focus, updates exact product links and shares only a URL", async () => {
  const fixture = uiFixture();
  fixture.start();
  assert.equal(fixture.fallback.hidden, true);
  assert.equal(fixture.rootNode.attrs["aria-busy"], "false");
  const first = fixture.rootNode.querySelector('[data-comparison-product="0"]');
  first.focus();
  first.value = "40";
  fixture.change(first);
  assert.equal(fixture.document.activeElement, first, "select remains focused after changes");
  assert.equal(fixture.rootNode.querySelector('[data-comparison-product="0"]'), first, "select identity survives rerender");
  assert.equal(fixture.rootNode.writes, 1, "comparison controls must not be replaced after initialization");
  const results = fixture.get("results").innerHTML;
  assert.match(results, /href="products\.html\?product=40"/);
  assert.match(results, /href="products\.html\?product=17"/);
  assert.match(results, /No disponible en esta ficha/);
  assert.ok(!results.includes("0.00%"));
  const shareUrl = new URL(fixture.get("url").value);
  assert.equal(shareUrl.searchParams.get("productos"), "40,17");
  await fixture.click(fixture.get("copy"));
  assert.deepEqual(fixture.copied, [shareUrl.href]);
  assert.equal(fixture.history.length, 1);
  assert.match(fixture.history[0][2], /^\/comparar-alimentos\.html\?animal=perros&productos=40%2C17$/);
});

test("clipboard denial keeps the complete comparison URL available for manual copying", async () => {
  const fixture = uiFixture({ denyClipboard: true });
  fixture.start();
  await fixture.click(fixture.get("copy"));
  assert.equal(fixture.document.activeElement, fixture.get("url"));
  assert.equal(fixture.get("url").selected, true);
  assert.equal(new URL(fixture.get("url").value).searchParams.get("productos"), "16,17");
  assert.equal(fixture.copied.length, 0);
  assert.match(fixture.get("copy-status").textContent, /copiá el enlace/);
});

test("a pending clipboard result cannot report an obsolete selection or steal focus after the comparison changes", async () => {
  for (const outcome of ["resolve", "reject"]) {
    const fixture = uiFixture();
    fixture.start();
    let settle;
    fixture.window.navigator.clipboard.writeText = () => new Promise((resolve, reject) => {
      settle = outcome === "resolve" ? resolve : () => reject(new Error("delayed clipboard denial"));
    });
    const copying = fixture.click(fixture.get("copy"));
    const first = fixture.rootNode.querySelector('[data-comparison-product="0"]');
    first.focus();
    first.value = outcome === "resolve" ? "40" : "";
    fixture.change(first);
    settle();
    await copying;
    assert.equal(fixture.get("copy-status").textContent, "", `${outcome}: no stale completion status`);
    assert.equal(fixture.document.activeElement, first, `${outcome}: pending copy must not steal focus`);
    assert.equal(fixture.get("url").selected, false, `${outcome}: new selection must not be selected for an obsolete copy`);
    assert.equal(new URL(fixture.get("url").value).searchParams.get("productos"), outcome === "resolve" ? "40,17" : "17");
  }
});

test("initialization failure leaves the original catalog fallback visible", () => {
  const html = read("comparar-alimentos.html");
  assert.match(html, /<p\b(?![^>]*\bhidden)[^>]*id="comparison-fallback"[^>]*>[\s\S]*?href="products\.html\?type=alimentos"/);
  const fixture = uiFixture({ failBinding: true });
  assert.throws(fixture.start, /simulated handler binding failure/);
  assert.equal(fixture.fallback.hidden, false);
  assert.notEqual(fixture.rootNode.dataset.comparisonReady, "true");
});
