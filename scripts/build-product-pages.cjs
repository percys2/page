#!/usr/bin/env node
"use strict";

// Genera una página estática por producto en productos/ y la lista de esas páginas en sitemap.xml.
// Después de cambiar el catálogo, las fichas, las imágenes o el encabezado del sitio, ejecutá:
//   node scripts/build-product-pages.cjs
// La prueba tests/product-pages.test.cjs falla si las páginas quedaron desactualizadas.
const { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");
const vm = require("node:vm");

const root = resolve(__dirname, "..");
const ORIGIN = "https://www.agrocentronica.com";
const OUTPUT_DIR = "productos";
const WHATSAPP_NUMBER = "50582403490";
const DATA_FILES = ["data/catalog-data.js", "data/image-overrides.js", "data/feed-guides.js", "data/responsive-images.js", "data/veterinary-data.js", "js/catalog-model.js"];
const SITEMAP_START = "  <!-- Páginas de productos: generadas por scripts/build-product-pages.cjs -->";
const SITEMAP_END = "  <!-- Fin de páginas de productos -->";
const GUIDE_TOPICS = { aves: "aves", cerdos: "cerdos", equinos: "equinos", perros: "mascotas", gatos: "mascotas", conejos: "conejos" };

const read = file => readFileSync(resolve(root, file), "utf8");
const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function loadModel() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of DATA_FILES) vm.runInContext(read(file), context, { filename: file });
  return context.window.AGROCENTRO_CATALOG;
}

function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " y ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Las páginas viven en /productos/: todas las rutas locales pasan a ser absolutas.
function absolutize(html) {
  return html
    .replace(/\b(href|src|action)="\.\/([^"]*)"/g, '$1="/$2"')
    .replace(/\b(href|action)="([a-z0-9-]+\.html(?:[?#][^"]*)?)"/g, '$1="/$2"')
    .replace(/(srcset|imagesrcset)="([^"]*)"/g, (match, attr, value) => `${attr}="${value.replace(/(^|,\s*)\.\//g, "$1/")}"`);
}

function siteChrome() {
  const contact = read("contact.html");
  const store = read("products.html");
  const header = contact.match(/  <div class="utility-bar">[\s\S]*?<\/header>/);
  const footer = store.match(/  <footer class="footer-first"[\s\S]*?<\/footer>/);
  const siteScript = contact.match(/<script src="js\/site\.js\?v=\d+" defer><\/script>/);
  const protection = store.match(/<script src="js\/image-protection\.js\?v=\d+" defer><\/script>/);
  if (!header || !footer || !siteScript || !protection) throw new Error("No encontré el encabezado, el pie o los scripts del sitio");
  const nav = header[0]
    .replace(/ class="active"/g, "").replace(/ aria-current="page"/g, "")
    .replace('<a href="products.html">Tienda</a>', '<a class="active" href="products.html">Tienda</a>');
  return {
    header: absolutize(nav),
    footer: absolutize(footer[0]),
    scripts: [protection[0], siteScript[0]].map(tag => tag.replace('src="', 'src="/')).join("\n  ")
  };
}

let questionsCache;
function guideQuestions() {
  if (!questionsCache) {
    const match = read("js/store.js").match(/const GUIDE_QUESTIONS = (\[[\s\S]*?\n  \]);/);
    if (!match) throw new Error("No encontré GUIDE_QUESTIONS en js/store.js");
    questionsCache = vm.runInNewContext(`(${match[1]})`);
  }
  return questionsCache;
}

function styles() {
  const manifest = JSON.parse(read("css/dist/styles-manifest.json"));
  return { bundle: manifest.pages["products.html"].bundle, font: manifest.preload_latin };
}

// Arma la descripción con partes completas: si no cabe, se quitan detalles del medio y se conserva el cierre.
function describe(lead, details, closing, limit = 158) {
  const clean = part => String(part).trim().replace(/\.$/, "");
  const join = parts => parts.filter(Boolean).map(clean).join(". ") + ".";
  const kept = [];
  for (const detail of details.filter(Boolean)) {
    if (join([lead, ...kept, detail, closing]).length <= limit) kept.push(detail);
  }
  const text = join([lead, ...kept, closing]);
  if (text.length <= limit) return text;
  const short = join([lead, ...kept]);
  if (short.length <= limit) return short;
  const cut = clean(lead).slice(0, limit - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:·\s]+$/, "") + "…";
}

function productPage(model, product, slug, chrome, css) {
  const name = model.getName(product);
  const guide = model.getGuide(product);
  const vet = model.getVetInfo(product);
  const variants = model.getVariants(product);
  const typeLabel = model.types[product.type] || "Producto";
  const categoryLabel = vet ? model.vetCategories[model.getVetCategory(product)] : model.categories[product.category] || "Uso general";
  const category = product.type === "alimentos" ? `${typeLabel} · ${categoryLabel}` : vet ? `${typeLabel} · ${categoryLabel}` : typeLabel;
  const summary = guide?.use || vet?.summary || product.instructions || product.description || "Consultá las características de este producto.";
  const presentations = [...new Set(variants.map(variant => model.getGuide(variant)?.presentation || model.getVetInfo(variant)?.presentation || variant.presentation).filter(Boolean))];
  const presentation = presentations.join(" · ") || "Presentación por confirmar";
  const image = model.getImage(product).replace(/^\.\//, "/");
  const responsive = absolutize(model.getResponsiveAttributes(model.getImage(product), "(max-width: 760px) 90vw, 480px"));
  const url = `${ORIGIN}/${OUTPUT_DIR}/${slug}.html`;
  const title = `${name} | AgroCentro Nica`;
  const description = describe(
    `${name}: ${summary.replace(/\.$/, "")}`,
    [guide?.stage, guide?.period, presentations.length ? `Presentación ${presentation}` : ""],
    "Pedilo por WhatsApp en AgroCentro Nica"
  );
  const storeHref = `/products.html?product=${product.id}`;
  const listHref = product.type === "alimentos" ? `/products.html?type=alimentos&amp;category=${product.category}`
    : vet ? `/products.html?type=medicinas&amp;vet=${model.getVetCategory(product)}` : `/products.html?type=${product.type}`;
  const consult = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quisiera confirmar precio y disponibilidad de ${name}.`)}`;
  const row = (label, value) => value ? `<div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>` : "";
  const vetRow = (label, value) => `<div><dt>${escape(label)}</dt><dd>${escape(value || "Por confirmar en etiqueta")}</dd></div>`;
  const pigLine = model.pigLines[model.getPigLine(product)];
  const agePrograms = Array.isArray(guide?.agePrograms)
    ? `<div class="age-programs"><p>Edad del lechón</p><dl>${guide.agePrograms.map(program => `<div><dt>${escape(program.label)}</dt><dd>${escape(program.days)} días</dd></div>`).join("")}</dl></div>`
    : guide?.period ? `<p class="product-period">${escape(guide.period)}</p>` : "";
  const useHeading = product.type === "herramientas" ? "Características y uso" : vet ? "Información del producto" : "Uso y etapa recomendada";
  const useBody = vet
    ? `<dl class="vet-facts">${vetRow("Tipo de producto", categoryLabel)}${vetRow("Especies indicadas", vet.species?.join(" · "))}${vetRow("Composición", vet.composition)}${vetRow("Forma del producto", vet.form)}${vetRow("Fabricante / marca", vet.manufacturer)}</dl>${vet.identityNote ? `<p class="vet-identity-note">${escape(vet.identityNote)}</p>` : ""}`
    : guide
      ? `<div class="feed-guide">${row("Animal", model.categories[product.category])}${row("Etapa productiva", guide.stage)}${guide.agePrograms ? "" : row("Edad / período", guide.period)}${row("Línea", pigLine)}${row("Forma", guide.form)}${row("Presentación", presentation)}${row("Programa de uso", guide.feeding)}</div>`
        + (guide.agePrograms ? `<p class="age-program-note">Días de vida desde el nacimiento. Usá las fases del mismo programa.</p>` : "")
        + `<p class="feed-guide-note">Los resultados y consumos pueden variar según manejo, instalaciones, clima, sanidad y genética. Seguí la etiqueta del saco o la indicación de un técnico para ajustar la ración.</p>`
      : `<p>${escape(product.instructions || product.description || "Consultanos las características y la presentación de este producto.")}</p>`;
  const benefits = guide?.benefits?.length
    ? `<details class="product-information-section"><summary>Beneficios principales</summary><div class="product-information-body"><ul>${guide.benefits.map(item => `<li>${escape(item)}</li>`).join("")}</ul></div></details>` : "";
  const analysis = guide?.analysis?.length
    ? `<details class="product-information-section catalog-analysis"><summary>Análisis garantizado</summary><dl>${guide.analysis.map(([nutrient, qualifier, value]) => `<div><dt>${escape(nutrient)}</dt><dd><span>${escape(qualifier)}</span><strong>${escape(value)}</strong></dd></div>`).join("")}</dl></details>` : "";
  const precautions = vet
    ? `<details class="product-information-section"><summary>Precauciones</summary><div class="product-information-body"><ul>${(vet.precautions?.length ? vet.precautions : ["Confirmá las precauciones de uso en la etiqueta y con un médico veterinario."]).map(item => `<li>${escape(item)}</li>`).join("")}</ul></div></details>` : "";
  const topic = GUIDE_TOPICS[product.category];
  const question = guideQuestions().find(entry => entry.ids.includes(product.id));
  const guideLink = !guide ? "" : question
    ? `<a class="product-guide-link" href="/guia-de-uso.html#${question.hash}">Guía de uso: ${escape(question.label)} →</a>`
    : `<a class="product-guide-link" href="/guia-de-uso.html${topic ? `?tema=${topic}` : ""}">Guía de uso y preguntas frecuentes →</a>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#073a29">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="AgroCentro Nica">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="es_NI">
  <meta property="og:image" content="${ORIGIN}${escape(image)}">
  <meta property="og:image:alt" content="${escape(name)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${ORIGIN}${escape(image)}">
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-ac-v48.png">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon-ac-v47.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon-v48.png">
  <link rel="preload" href="/${css.font}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/${css.bundle}">
</head>
<body class="store-page product-page" id="page-top">
  <a class="skip-link" href="#producto">Ir al producto</a>

${chrome.header}

  <main id="producto">
    <div class="shell product-page-shell">
      <p class="breadcrumb"><a href="/index.html">Inicio</a> / <a href="/products.html">Tienda</a> / <a href="${listHref}">${escape(category)}</a></p>
      <div class="store-heading"><h1>${escape(name)}</h1></div>
      <article class="modal-product-grid product-detail-layout">
        <div class="modal-product-media">
          <span class="modal-product-image is-cutout-catalog"><img src="${escape(image)}" ${responsive} alt="${escape(name)}" decoding="async" fetchpriority="high"></span>
        </div>
        <div class="modal-product-info">
          <p class="product-category">${escape(category)}</p>
          ${guide?.stage ? `<p class="product-stage-label">${escape(guide.stage)}</p>` : ""}
          ${agePrograms}
          <p class="modal-description">${escape(summary)}</p>
          ${pigLine ? `<p class="feed-line">${escape(pigLine)}</p>` : ""}
        </div>
        ${presentations.length ? `<div class="modal-product-selection">
          <div class="product-presentation-fixed"><span>${presentations.length > 1 ? "Presentaciones" : "Presentación"}</span><strong>${escape(presentation)}</strong></div>
        </div>` : ""}
        <div class="modal-actions">
          <a class="modal-add" href="${storeHref}">Agregar al pedido</a>
          <a class="modal-whatsapp" href="${consult}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
          <p class="modal-price-note">Precio y disponibilidad por confirmar.</p>
        </div>
        <div class="modal-product-details">
          ${useBody === `<p>${escape(summary)}</p>` ? "" : `<details class="product-information-section" open><summary>${useHeading}</summary><div class="product-information-body">${useBody}</div></details>`}
          ${benefits}${analysis}${precautions}
          ${guideLink}
          <a class="product-guide-link" href="${listHref}">Ver más en la tienda: ${escape(category)} →</a>
        </div>
      </article>
    </div>
  </main>

${chrome.footer}

  ${chrome.scripts}
</body>
</html>
`;
}

function buildSite() {
  const model = loadModel();
  const chrome = siteChrome();
  const css = styles();
  const seenFamilies = new Set();
  const usedSlugs = new Set();
  const pages = [];
  for (const product of [...model.products].sort(model.compareProducts)) {
    const variants = model.getVariants(product);
    if (variants.length > 1) {
      const familyKey = variants.map(variant => variant.id).join("-");
      if (seenFamilies.has(familyKey)) continue;
      seenFamilies.add(familyKey);
    }
    let slug = slugify(model.getName(product)) || `producto-${product.id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${product.id}`;
    usedSlugs.add(slug);
    pages.push({ id: product.id, slug, path: `${OUTPUT_DIR}/${slug}.html`, html: productPage(model, product, slug, chrome, css) });
  }

  const sitemap = read("sitemap.xml");
  const withoutBlock = sitemap.replace(new RegExp(`\\n?${SITEMAP_START}[\\s\\S]*?${SITEMAP_END}`), "");
  const entries = pages.map(page => `  <url><loc>${ORIGIN}/${page.path}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
  const nextSitemap = withoutBlock.replace("</urlset>", `${SITEMAP_START}\n${entries}\n${SITEMAP_END}\n</urlset>`);
  return { pages, sitemap: nextSitemap };
}

module.exports = { buildSite, slugify, OUTPUT_DIR, ORIGIN };

if (require.main === module) {
  const { pages, sitemap } = buildSite();
  const dir = join(root, OUTPUT_DIR);
  mkdirSync(dir, { recursive: true });
  const keep = new Set(pages.map(page => `${page.slug}.html`));
  for (const file of existsSync(dir) ? readdirSync(dir) : []) {
    if (file.endsWith(".html") && !keep.has(file)) rmSync(join(dir, file));
  }
  for (const page of pages) writeFileSync(join(root, page.path), page.html);
  writeFileSync(join(root, "sitemap.xml"), sitemap);
  console.log(`${pages.length} páginas de productos en ${OUTPUT_DIR}/ y sitemap.xml actualizado.`);
}
