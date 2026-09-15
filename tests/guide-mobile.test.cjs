"use strict";

// Run with node --test tests/guide-mobile.test.cjs. Opens the usage guide in headless
// Chrome at phone widths with every question and calculator expanded, and fails when a
// table, card or field does not fit the screen. It also keeps source citations out of
// the visible guide text. Set CHROME_PATH to use another Chromium-based browser; the
// browser check is skipped when none is installed.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { spawn } = require("node:child_process");
const { createServer } = require("node:http");
const { existsSync, mkdtempSync, readFileSync, rmSync, statSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { extname, join, resolve, sep } = require("node:path");
const { root } = require("../scripts/csp-hashes.cjs");

const PHONE_WIDTHS = [360, 390];
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].find(path => path && existsSync(path));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon"
};

// Phrases that justify data by naming where it comes from. The store's own catalog
// ("el catálogo de alimentos balanceados no incluye…") is allowed.
const CITATIONS = [
  /según (la|el|las|los|su|sus) (guías?|catálogo|fichas?|estudios?|ensayos?|fuentes?)\b/i,
  /guías? oficial/i,
  /casa genética/i,
  /universidad/i,
  /\b(estudio|ensayo) de\b/i,
  /catálogo (Purina|Cargill|FY)/i,
  /resultados esperados/i,
  /(base|indicación|datos) del catálogo/i,
  /objetivos 20\d\d/i
];

test("guide text states data without citing where it comes from", () => {
  for (const file of ["js/usage-guide.js", "js/usage-guide-programs.js"]) {
    readFileSync(resolve(root, file), "utf8").split("\n").forEach((line, index) => {
      const code = line.trim();
      if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*")) return;
      for (const pattern of CITATIONS) assert.doesNotMatch(line, pattern, `${file}:${index + 1} cites a source`);
    });
  }
});

function serve() {
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream" });
    response.end(readFileSync(file));
  });
  return new Promise(done => server.listen(0, "127.0.0.1", () => done(server)));
}

// Chrome DevTools Protocol over --remote-debugging-pipe: JSON messages separated by NUL.
function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "guide-mobile-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
    "--disable-gpu", "--disable-extensions", `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const pending = new Map();
  const listeners = [];
  let nextId = 0;
  let buffer = "";
  chrome.stdio[4].setEncoding("utf8");
  chrome.stdio[4].on("data", chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\0")) !== -1) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (message.id && pending.has(message.id)) {
        const { resolve: ok, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else ok(message.result);
      } else if (message.method) {
        listeners.filter(entry => entry.method === message.method).forEach(entry => {
          listeners.splice(listeners.indexOf(entry), 1);
          entry.done(message.params);
        });
      }
    }
  });
  chrome.once("exit", () => pending.forEach(({ reject }) => reject(new Error("Chrome se cerró antes de responder"))));
  return {
    send(method, params = {}, sessionId) {
      return new Promise((ok, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve: ok, reject });
        chrome.stdio[3].write(`${JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) })}\0`);
      });
    },
    once(method) {
      return new Promise(done => listeners.push({ method, done }));
    },
    async close() {
      if (chrome.exitCode === null) {
        const exited = new Promise(done => chrome.once("exit", done));
        chrome.kill();
        await exited;
      }
      rmSync(profile, { recursive: true, force: true });
    }
  };
}

// Runs inside the page: expands everything, fills the calculator dates and reports what does not fit.
const AUDIT = `(async () => {
  const wait = ms => new Promise(done => setTimeout(done, ms));
  for (let i = 0; i < 50 && !document.querySelector("#guide-questions details"); i++) await wait(100);
  await document.fonts.ready;
  document.querySelectorAll("[data-guide-group], #guide-questions details").forEach(element => { element.hidden = false; });
  const questions = [...document.querySelectorAll("#guide-questions details")];
  questions.forEach(question => { question.open = true; });
  document.querySelectorAll("#guide-questions input[type=date]").forEach(input => {
    input.value = "2026-01-15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  document.querySelectorAll("#guide-questions input[type=number]").forEach(input => {
    if (input.value) return;
    input.value = String(Math.min(Number(input.max) || 12345.67, 12345.67));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await wait(150);
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  const screen = document.documentElement.clientWidth;
  const label = element => {
    const question = element.closest("details");
    const caption = element.querySelector("caption");
    return (question ? "#" + question.id : "página") + (caption ? " · " + caption.textContent.trim() : "");
  };
  const problems = [];
  const tables = [...document.querySelectorAll("#guide-questions .guide-table-wrap")];
  tables.forEach(wrap => {
    if (wrap.scrollWidth > wrap.clientWidth + 1) problems.push(label(wrap) + ": la tabla se sale " + (wrap.scrollWidth - wrap.clientWidth) + " px de su cuadro");
    if (wrap.getBoundingClientRect().right > screen + 1) problems.push(label(wrap) + ": la tabla pasa el borde de la pantalla");
    if (wrap.classList.contains("guide-table--stack")) {
      wrap.querySelectorAll("td").forEach(cell => { if (!cell.dataset.label) problems.push(label(wrap) + ": una tarjeta tiene un dato sin nombre"); });
    }
  });
  document.querySelectorAll("#guide-questions input, #guide-questions select").forEach(field => {
    const box = field.closest(".guide-ration-tool, .guide-answer");
    if (box && field.getBoundingClientRect().right > box.getBoundingClientRect().right + 1) problems.push("#" + field.id + ": el campo se sale de su cuadro");
  });
  if (document.documentElement.scrollWidth > screen + 1) problems.push("la página se desplaza de lado " + (document.documentElement.scrollWidth - screen) + " px");
  return { questions: questions.length, tables: tables.length, problems };
})()`;

test("guide tables, cards and calculators fit phone screens", { skip: !CHROME && "Chrome no está instalado (definí CHROME_PATH)", timeout: 90000 }, async () => {
  const server = await serve();
  const browser = launchChrome();
  try {
    const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
    await browser.send("Page.enable", {}, sessionId);
    const url = `http://127.0.0.1:${server.address().port}/guia-de-uso.html`;
    for (const width of PHONE_WIDTHS) {
      await browser.send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 2, mobile: true }, sessionId);
      const loaded = browser.once("Page.loadEventFired");
      await browser.send("Page.navigate", { url }, sessionId);
      await loaded;
      const { result, exceptionDetails } = await browser.send("Runtime.evaluate", { expression: AUDIT, awaitPromise: true, returnByValue: true }, sessionId);
      assert.equal(exceptionDetails, undefined, exceptionDetails && (exceptionDetails.exception?.description || exceptionDetails.text));
      const { questions, tables, problems } = result.value;
      assert.ok(questions > 10 && tables > 10, `${width} px: the guide did not render (${questions} questions, ${tables} tables)`);
      assert.deepEqual(problems, [], `${width} px: content does not fit the screen`);
    }
  } finally {
    await browser.close();
    server.close();
  }
});

// Product pages from scripts/build-product-pages.cjs: one of each kind of product.
const PRODUCT_SAMPLES = [31, 200, 16];
const PRODUCT_AUDIT = `(async () => {
  await document.fonts.ready;
  const image = document.querySelector("main img");
  if (image && !image.complete) await new Promise(done => { image.addEventListener("load", done); image.addEventListener("error", done); setTimeout(done, 4000); });
  const screen = document.documentElement.clientWidth;
  const problems = [];
  if (!document.querySelector("main h1")) problems.push("falta el título");
  if (!image || !image.naturalWidth) problems.push("la foto no cargó");
  if (document.documentElement.scrollWidth > screen + 1) problems.push("la página se desplaza de lado " + (document.documentElement.scrollWidth - screen) + " px");
  document.querySelectorAll("main *").forEach(element => {
    const box = element.getBoundingClientRect();
    if (box.width && box.right > screen + 1) problems.push((element.className || element.tagName) + " pasa el borde de la pantalla");
  });
  return { title: document.title, problems: [...new Set(problems)].slice(0, 10) };
})()`;

test("product pages fit phone screens", { skip: !CHROME && "Chrome no está instalado (definí CHROME_PATH)", timeout: 90000 }, async () => {
  const { buildSite } = require("../scripts/build-product-pages.cjs");
  const { pages } = buildSite();
  const samples = PRODUCT_SAMPLES.map(id => pages.find(page => page.id === id) || pages.find(page => page.html.includes(`product=${id}"`)));
  const tool = pages.find(page => page.html.includes('type=herramientas"'));
  if (tool) samples.push(tool);
  assert.ok(samples.every(Boolean), "sample product pages were not generated");
  const server = await serve();
  const browser = launchChrome();
  try {
    const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
    await browser.send("Page.enable", {}, sessionId);
    for (const width of PHONE_WIDTHS) {
      await browser.send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 2, mobile: true }, sessionId);
      for (const page of samples) {
        const loaded = browser.once("Page.loadEventFired");
        await browser.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/${page.path}` }, sessionId);
        await loaded;
        const { result, exceptionDetails } = await browser.send("Runtime.evaluate", { expression: PRODUCT_AUDIT, awaitPromise: true, returnByValue: true }, sessionId);
        assert.equal(exceptionDetails, undefined, exceptionDetails && (exceptionDetails.exception?.description || exceptionDetails.text));
        assert.deepEqual(result.value.problems, [], `${width} px · ${page.path}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
});
