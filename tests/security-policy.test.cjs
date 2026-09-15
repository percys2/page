"use strict";

// Run with node --test tests/security-policy.test.cjs. This checks the static
// deployment contract; browser checks still cover real CSP enforcement and UI.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readdirSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { root, pages, inlineScripts } = require("../scripts/csp-hashes.cjs");
const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const origin = "https://www.agrocentronica.com";
const globalRules = config.headers.filter(rule => rule.source === "/(.*)");
assert.equal(globalRules.length, 1, "Exactly one global security header rule is required");
const headers = new Map(globalRules[0].headers.map(header => [header.key.toLowerCase(), header.value]));
const policy = new Map((headers.get("content-security-policy") || "").split(";").filter(part => part.trim()).map(part => {
  const [name, ...sources] = part.trim().split(/\s+/);
  return [name, sources];
}));

function attributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([^\s=<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = (match[2] ?? match[3] ?? match[4]).replace(/&amp;/g, "&");
  }
  return attrs;
}

// This is deliberately limited to the exact source tokens used by this site.
// New scheme/wildcard/path policies need an explicit review, not silent acceptance.
function assertSource(directive, resource, page) {
  const sources = policy.get(directive) || policy.get("default-src");
  const url = new URL(resource, `${origin}/${page}`);
  const allowed = sources.some(source => source === "'self'" ? url.origin === origin : source === url.origin);
  assert.ok(allowed, `${page}: ${directive} blocks ${resource}`);
}

test("security directives disallow unreviewed scripts, embeds and parent frames", () => {
  for (const name of ["default-src", "style-src", "img-src", "font-src", "connect-src", "form-action"]) {
    assert.deepEqual(policy.get(name), ["'self'"], `${name} must stay same-origin`);
  }
  for (const name of ["script-src-attr", "style-src-attr", "frame-ancestors", "object-src", "base-uri"]) {
    assert.deepEqual(policy.get(name), ["'none'"], `${name} must stay blocked`);
  }
  assert.deepEqual(policy.get("frame-src"), ["https://www.openstreetmap.org"]);
  assert.ok(policy.has("upgrade-insecure-requests"));
  const scripts = policy.get("script-src");
  assert.ok(scripts.includes("'self'"));
  assert.ok(scripts.every(source => source === "'self'" || /^'sha256-[A-Za-z0-9+/]{43}='$/.test(source)));
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("referrer-policy"), "no-referrer");
  assert.ok(!headers.has("cross-origin-embedder-policy"), "OSM embeds do not use cross-origin isolation");
});

test("inline script hashes cover exact code and contain no stale allowlist entries", () => {
  const expected = [...new Set(inlineScripts().map(script => script.hash))].sort();
  const actual = policy.get("script-src").filter(source => source.startsWith("'sha256-")).sort();
  assert.deepEqual(actual, expected, "Review inline changes, then run node scripts/csp-hashes.cjs and update vercel.json");
});

test("sharing remains available while unused device capabilities are denied", () => {
  const permissions = new Map((headers.get("permissions-policy") || "").split(",").map(part => {
    const equal = part.indexOf("=");
    return [part.slice(0, equal).trim(), part.slice(equal + 1).trim()];
  }));
  for (const capability of ["camera", "microphone", "geolocation", "payment"]) {
    assert.equal(permissions.get(capability), "()", capability);
  }
  for (const capability of ["web-share", "clipboard-write"]) {
    assert.equal(permissions.get(capability), "(self)", capability);
  }
});

test("every published page loads only permitted scripts, images, fonts and maps", () => {
  const cssFiles = new Set();
  let maps = 0;
  for (const page of pages) {
    const html = readFileSync(resolve(root, page), "utf8");
    for (const match of html.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
      const name = match[1].toLowerCase();
      const attrs = attributes(match[0]);
      assert.ok(!Object.keys(attrs).some(attr => /^on[a-z]+$/.test(attr)), `${page}: inline event handler`);
      assert.ok(!("style" in attrs), `${page}: inline style attribute`);
      assert.notEqual(name, "style", `${page}: stylesheet must be external`);
      if (name === "script" && attrs.src) assertSource("script-src", attrs.src, page);
      if (name === "iframe") {
        assertSource("frame-src", attrs.src, page);
        maps += 1;
      }
      if (name === "img" && attrs.src) assertSource("img-src", attrs.src, page);
      if (["img", "source", "link"].includes(name)) {
        for (const candidate of (attrs.srcset || attrs.imagesrcset || "").split(",").filter(Boolean)) {
          assertSource("img-src", candidate.trim().split(/\s+/)[0], page);
        }
      }
      if (name === "link" && attrs.href) {
        if (attrs.rel === "stylesheet") {
          assertSource("style-src", attrs.href, page);
          cssFiles.add(new URL(attrs.href, `${origin}/${page}`).pathname.slice(1));
        } else if (["icon", "apple-touch-icon"].includes(attrs.rel) || attrs.as === "image") {
          assertSource("img-src", attrs.href, page);
        } else if (attrs.as === "font") {
          assertSource("font-src", attrs.href, page);
        }
      }
    }
  }
  assert.equal(maps, 2, "Both branch maps must remain permitted");
  for (const file of cssFiles) {
    const css = readFileSync(resolve(root, file), "utf8");
    assert.ok(!/@import\b/i.test(css), `${file}: review new stylesheet imports`);
    for (const match of css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)) {
      assertSource(/\.woff2?(?:[?#]|$)/i.test(match[1]) ? "font-src" : "img-src", match[1], file);
    }
  }
});

test("same-origin search forms remain usable under form-action", () => {
  let searches = 0;
  for (const page of pages) {
    const html = readFileSync(resolve(root, page), "utf8");
    for (const match of html.matchAll(/<form\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      assertSource("form-action", attrs.action || page, page);
      if (attrs.role === "search") {
        assert.equal(attrs.method?.toLowerCase(), "get");
        assert.equal(new URL(attrs.action, `${origin}/${page}`).pathname, "/products.html");
        searches += 1;
      }
    }
  }
  assert.equal(searches, 5, "Four header searches and the home search must remain usable");
});

test("security headers preserve long-lived asset and stylesheet caching", () => {
  const cached = config.headers.filter(rule => rule.headers.some(header => header.key.toLowerCase() === "cache-control"));
  assert.ok(cached.some(rule => rule.source === "/assets/responsive/(.*)"));
  assert.ok(cached.some(rule => rule.source === "/assets/fonts/(.*).woff2"));
  for (const rule of cached) {
    assert.equal(rule.headers.find(header => header.key.toLowerCase() === "cache-control").value, "public, max-age=31536000, immutable");
  }
  const manifest = JSON.parse(readFileSync(resolve(root, "css/dist/styles-manifest.json"), "utf8"));
  assert.ok(cached.some(rule => rule.source === "/css/dist/(.*).css"), "compiled stylesheets must stay cached");
  const bundles = Object.values(manifest.pages).map(page => page.bundle).sort();
  const onDisk = readdirSync(resolve(root, "css/dist")).filter(file => file.endsWith(".css")).map(file => `css/dist/${file}`).sort();
  assert.deepEqual(onDisk, bundles, "css/dist must contain only the current bundles: run python3 scripts/build-styles.py");
  for (const page of pages) {
    const html = readFileSync(resolve(root, page), "utf8");
    for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      if (attrs.rel === "stylesheet") {
        assert.equal(attrs.href, manifest.pages[page]?.bundle, `${page}: stylesheet must be its current bundle in css/dist`);
      }
    }
  }
});
