#!/usr/bin/env node
"use strict";

// After reviewing an intentional inline-script edit, run:
//   node scripts/csp-hashes.cjs
// Replace only the sha256 tokens in vercel.json's script-src with this output,
// then run: node --test tests/security-policy.test.cjs
// Whitespace inside <script> is significant; never trim before hashing.
const { createHash } = require("node:crypto");
const { readdirSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
const pages = readdirSync(root).filter(file => file.endsWith(".html")).sort();
const scriptHash = code => `'sha256-${createHash("sha256").update(code, "utf8").digest("base64")}'`;

function inlineScripts() {
  return pages.flatMap(file => {
    const html = readFileSync(resolve(root, file), "utf8");
    return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
      .filter(match => !/\bsrc\s*=/i.test(match[1]) && match[2].trim())
      .map(match => ({ file, code: match[2], hash: scriptHash(match[2]) }));
  });
}

module.exports = { root, pages, inlineScripts, scriptHash };
if (require.main === module) {
  console.log([...new Set(inlineScripts().map(script => script.hash))].sort().join(" "));
}
