"use strict";

// Run with node --test scripts/product-pages.test.cjs. Checks that productos/ and sitemap.xml
// match scripts/build-product-pages.cjs and that every product page is safe to publish:
// no inline code, only local files that exist, a cached stylesheet and links to order.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { existsSync, readdirSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { buildSite, OUTPUT_DIR, ORIGIN } = require("./build-product-pages.cjs");

const root = resolve(__dirname, "..");
const { pages, sitemap } = buildSite();
const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const cachedSources = new Set(config.headers
  .filter(rule => rule.headers.some(header => header.key.toLowerCase() === "cache-control"))
  .map(rule => rule.source));

function attributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([^\s=<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = (match[2] ?? match[3] ?? match[4]).replace(/&amp;/g, "&");
  }
  return attrs;
}

const localFile = url => resolve(root, `.${decodeURIComponent(url.split(/[?#]/)[0])}`);

test("product pages and sitemap match the generator", () => {
  const dir = resolve(root, OUTPUT_DIR);
  const onDisk = existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith(".html")).sort() : [];
  assert.deepEqual(onDisk, pages.map(page => `${page.slug}.html`).sort(), "Run node scripts/build-product-pages.cjs");
  for (const page of pages) {
    assert.equal(readFileSync(resolve(root, page.path), "utf8"), page.html, `${page.path} is stale: run node scripts/build-product-pages.cjs`);
  }
  assert.equal(readFileSync(resolve(root, "sitemap.xml"), "utf8"), sitemap, "sitemap.xml is stale: run node scripts/build-product-pages.cjs");
});

test("every product page has its own title, description and canonical URL", () => {
  assert.ok(pages.length > 100, `only ${pages.length} product pages`);
  const titles = new Set();
  const ids = new Set();
  for (const page of pages) {
    const html = page.html;
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = attributes(html.match(/<meta name="description"[^>]*>/)?.[0] || "").content || "";
    const canonical = attributes(html.match(/<link rel="canonical"[^>]*>/)?.[0] || "").href;
    assert.ok(title && !titles.has(title), `${page.path}: missing or repeated title "${title}"`);
    assert.ok(!ids.has(page.id), `${page.path}: product ${page.id} has two pages`);
    titles.add(title);
    ids.add(page.id);
    assert.ok(description.length >= 60 && description.length <= 160, `${page.path}: description has ${description.length} characters`);
    assert.equal(canonical, `${ORIGIN}/${page.path}`, `${page.path}: canonical URL`);
    assert.match(html, /<main id="producto">[\s\S]*<h1>[^<]+<\/h1>/, `${page.path}: visible h1`);
    assert.ok(sitemap.includes(`<loc>${ORIGIN}/${page.path}</loc>`), `${page.path}: missing from sitemap`);
  }
});

test("product pages load only existing local files and contain no inline code", () => {
  for (const page of pages) {
    for (const match of page.html.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
      const name = match[1].toLowerCase();
      const attrs = attributes(match[0]);
      assert.ok(!Object.keys(attrs).some(attr => /^on[a-z]+$/.test(attr)), `${page.path}: inline event handler`);
      assert.ok(!("style" in attrs), `${page.path}: inline style attribute`);
      assert.notEqual(name, "style", `${page.path}: stylesheet must be external`);
      if (name === "script") assert.ok(attrs.src, `${page.path}: inline script`);
      const urls = [attrs.src, name === "a" ? null : attrs.href, ...(attrs.srcset || "").split(",").map(item => item.trim().split(/\s+/)[0])].filter(Boolean);
      for (const url of urls) {
        if (/^https?:|^tel:/.test(url)) continue;
        assert.ok(url.startsWith("/") && !url.startsWith("//"), `${page.path}: relative or protocol-less URL ${url}`);
        assert.ok(existsSync(localFile(url)), `${page.path}: ${url} does not exist`);
      }
      if (name === "link" && attrs.rel === "stylesheet") {
        assert.ok(cachedSources.has(attrs.href), `${page.path}: ${attrs.href} must be a cached stylesheet bundle`);
      }
      if (name === "a" && attrs.href?.startsWith("/")) {
        assert.ok(existsSync(localFile(attrs.href)), `${page.path}: link to missing ${attrs.href}`);
      }
      if (name === "a" && /^https?:/.test(attrs.href || "")) {
        assert.match(attrs.href, /^https:\/\/wa\.me\//, `${page.path}: unexpected external link ${attrs.href}`);
      }
    }
  }
});

test("product pages lead to the store order and to WhatsApp", () => {
  for (const page of pages) {
    assert.ok(page.html.includes(`href="/products.html?product=${page.id}"`), `${page.path}: add-to-order link`);
    assert.ok(page.html.includes("https://wa.me/50582403490?text="), `${page.path}: WhatsApp consult link`);
  }
});
