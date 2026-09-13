(function () {
  "use strict";

  const catalog = window.AGROCENTRO_CATALOG || {};
  const products = window.AGROCENTRO_PRODUCTS || [];
  const missing = "No disponible en esta ficha";
  const unconfirmed = "Por confirmar en etiqueta vigente";
  const categories = catalog.categories || {};
  const guideFor = product => catalog.getGuide ? catalog.getGuide(product) || {} : {};
  const nameFor = product => catalog.getName ? catalog.getName(product) : product.name;
  const present = value => typeof value === "string" && value.trim() ? value : missing;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function getFeeds() {
    const feeds = products.filter(product => product.type === "alimentos");
    return catalog.compareProducts ? feeds.sort(catalog.compareProducts) : feeds;
  }

  function getAnimalKeys() {
    const available = new Set(getFeeds().map(product => product.category));
    return [...Object.keys(categories).filter(key => available.has(key)), ...[...available].filter(key => !Object.prototype.hasOwnProperty.call(categories, key))];
  }

  function getProductLabel(product) {
    return `${nameFor(product)} — ${present(guideFor(product).presentation)}`;
  }

  function parseSelection(search) {
    const params = new URLSearchParams(String(search || "").slice(0, 4096));
    const animals = getAnimalKeys();
    const requestedAnimal = params.get("animal") || "";
    let animal = animals.includes(requestedAnimal) ? requestedAnimal : "";
    let ignored = Boolean(requestedAnimal && !animal) || params.getAll("animal").length > 1 || params.getAll("productos").length > 1;
    const feeds = new Map(getFeeds().map(product => [product.id, product]));
    const ids = [];
    const source = params.get("productos") || "";
    if (String(search || "").length > 4096) ignored = true;
    if (source) source.split(",").forEach(value => {
      const product = /^\d+$/.test(value) ? feeds.get(Number(value)) : null;
      if (!product || ids.includes(product.id) || ids.length >= 3 || (animal && product.category !== animal)) {
        ignored = true;
        return;
      }
      animal = animal || product.category;
      ids.push(product.id);
    });
    return {
      animal: animal || animals[0] || "",
      ids,
      notice: ignored ? "Se omitieron selecciones no válidas. Compará hasta tres alimentos del mismo animal." : ""
    };
  }

  function buildComparisonUrl(ids, animal) {
    const requested = new URLSearchParams();
    if (animal) requested.set("animal", animal);
    if (Array.isArray(ids) && ids.length) requested.set("productos", ids.join(","));
    const selected = parseSelection(requested.toString());
    const url = new URL("https://www.agrocentronica.com/comparar-alimentos.html");
    if (selected.animal) url.searchParams.set("animal", selected.animal);
    if (selected.ids.length) url.searchParams.set("productos", selected.ids.join(","));
    return url.href;
  }

  function getEssentialRows(entries) {
    const row = (key, label, read) => ({ key, label, values: entries.map(product => present(read(guideFor(product), product))) });
    const rows = [
      row("use", "Uso", guide => guide.use),
      row("stage", "Etapa", guide => guide.stage),
      row("period", "Edad / período", guide => guide.agePrograms?.length
        ? guide.agePrograms.map(program => `${program.label}: ${program.days} días`).join("\n") + "\nDías de vida desde el nacimiento."
        : guide.period),
      row("presentation", "Presentación", guide => guide.presentation),
      row("form", "Forma del alimento", guide => guide.form)
    ];
    if (entries.some(product => catalog.getPigLine?.(product))) {
      rows.push(row("line", "Línea", (_guide, product) => catalog.pigLines?.[catalog.getPigLine(product)]));
    }
    return rows;
  }

  function getNutritionRows(entries) {
    const nutrients = new Map();
    entries.forEach(product => {
      (guideFor(product).analysis || []).forEach(entry => {
        if (!Array.isArray(entry) || !entry[0]) return;
        const [name, qualifier] = entry;
        const key = `${name}\u0000${qualifier || ""}`;
        if (!nutrients.has(key)) nutrients.set(key, { key, label: qualifier ? `${name} (${qualifier})` : name, name, qualifier });
      });
    });
    return [...nutrients.values()].map(nutrient => ({
      key: nutrient.key,
      label: nutrient.label,
      values: entries.map(product => {
        const entry = (guideFor(product).analysis || []).find(item => item[0] === nutrient.name && item[1] === nutrient.qualifier);
        const value = present(entry?.[2]);
        return value.includes("*") ? unconfirmed : value;
      })
    }));
  }

  function getDetailRows(entries) {
    return [
      { key: "benefits", label: "Beneficios descritos", values: entries.map(product => present((guideFor(product).benefits || []).join("\n"))) },
      { key: "feeding", label: "Indicaciones de uso", values: entries.map(product => present(guideFor(product).feeding)) }
    ];
  }

  function rowsForDisplay(rows, onlyDifferences) {
    return !onlyDifferences ? rows : rows.filter(row => row.values.some(value => value === missing || value === unconfirmed) || new Set(row.values).size > 1);
  }

  window.AGROCENTRO_FEED_COMPARISON = {
    getFeeds, parseSelection, buildComparisonUrl, getEssentialRows, getNutritionRows, getDetailRows, getProductLabel, escapeHtml, rowsForDisplay
  };

  function init() {
    const root = document.getElementById("feed-comparison");
    if (!root || !getFeeds().length || !catalog.getGuide || root.dataset.comparisonReady) return;

    const initial = parseSelection(window.location.search);
    const state = { animal: initial.animal, slots: [initial.ids[0] || null, initial.ids[1] || null, initial.ids[2] || null], third: initial.ids.length === 3, onlyDifferences: false, notice: initial.notice };
    const fallback = document.getElementById("comparison-fallback");
    const animalOptions = getAnimalKeys().map(key => `<option value="${escapeHtml(key)}">${escapeHtml(categories[key] || key)}</option>`).join("");
    root.innerHTML = `
      <section class="comparison-selection" aria-labelledby="comparison-selection-title">
        <h2 id="comparison-selection-title">Elegí los alimentos</h2>
        <div class="comparison-animal"><label for="comparison-animal">Animal</label><select id="comparison-animal" data-comparison-animal>${animalOptions}</select></div>
        <fieldset class="comparison-pickers"><legend class="sr-only">Alimentos para comparar</legend>${[0, 1, 2].map(index => `<div class="comparison-picker" data-comparison-slot="${index}"${index === 2 ? " hidden" : ""}><label for="comparison-product-${index}">Alimento ${index + 1}${index === 2 ? " · opcional" : ""}</label><select id="comparison-product-${index}" data-comparison-product="${index}"><option value="">Elegí un alimento</option></select></div>`).join("")}</fieldset>
        <div class="comparison-selection-actions"><button type="button" class="comparison-text-button" data-comparison-add>+ Agregar un tercer alimento</button><button type="button" class="comparison-text-button" data-comparison-reset>Limpiar selección</button></div>
      </section>
      <p class="comparison-notice" data-comparison-notice role="status" aria-live="polite"></p>
      <div class="comparison-toolbar" data-comparison-toolbar hidden><label class="comparison-differences"><input type="checkbox" data-comparison-differences> Solo diferencias</label><p data-comparison-count></p></div>
      <div data-comparison-results></div>
      <section class="comparison-share" data-comparison-share hidden aria-labelledby="comparison-share-title"><h2 id="comparison-share-title">Compartí esta comparación</h2><label for="comparison-url">Enlace de los alimentos seleccionados</label><div class="comparison-share-controls"><input id="comparison-url" type="text" readonly spellcheck="false" autocapitalize="off" data-comparison-url><button type="button" class="comparison-copy-button" data-comparison-copy>Copiar enlace</button></div><p data-comparison-copy-status role="status" aria-live="polite"></p></section>`;

    const animalSelect = root.querySelector("[data-comparison-animal]");
    const selects = [...root.querySelectorAll("[data-comparison-product]")];
    const results = root.querySelector("[data-comparison-results]");
    const notice = root.querySelector("[data-comparison-notice]");
    const toolbar = root.querySelector("[data-comparison-toolbar]");
    const share = root.querySelector("[data-comparison-share]");
    const urlField = root.querySelector("[data-comparison-url]");
    const copyStatus = root.querySelector("[data-comparison-copy-status]");
    const selectedProducts = () => state.slots.filter(Boolean).map(id => products.find(product => product.id === id && product.type === "alimentos")).filter(Boolean);

    function renderOptions() {
      animalSelect.value = state.animal;
      const options = getFeeds().filter(product => product.category === state.animal);
      selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Elegí un alimento</option>' + options.map(product => `<option value="${product.id}"${state.slots.some((id, slot) => slot !== index && id === product.id) ? " disabled" : ""}>${escapeHtml(getProductLabel(product))}</option>`).join("");
        select.value = state.slots[index] || "";
      });
      root.querySelector('[data-comparison-slot="2"]').hidden = !state.third;
      root.querySelector("[data-comparison-add]").hidden = state.third;
      root.querySelector("[data-comparison-reset]").disabled = !state.slots.some(Boolean);
    }

    function headerMarkup(product, thumbnails) {
      const name = escapeHtml(nameFor(product));
      const presentation = escapeHtml(present(guideFor(product).presentation));
      const source = catalog.getImage(product);
      const attributes = catalog.getResponsiveAttributes ? catalog.getResponsiveAttributes(source, "(max-width: 600px) 112px, 140px") : "";
      return `<th scope="col">${thumbnails ? `<div class="product-image comparison-product-image"><img src="${escapeHtml(source)}" ${attributes} alt="" loading="lazy" decoding="async" draggable="false"></div>` : ""}<a class="comparison-product-name" href="products.html?product=${product.id}">${name}</a><span class="comparison-presentation">${presentation}</span></th>`;
    }

    function tableMarkup(entries, rows, key, title, thumbnails) {
      const visible = rowsForDisplay(rows, state.onlyDifferences);
      if (!rows.length) return `<p class="comparison-empty-section">${missing}.</p>`;
      if (!visible.length) return '<p class="comparison-empty-section">No hay diferencias en esta sección. Desmarcá «Solo diferencias» para ver todos los datos.</p>';
      return `<div class="comparison-table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(title)}" aria-describedby="comparison-scroll-help"><table class="comparison-table" data-count="${entries.length}"><caption class="sr-only">${escapeHtml(title)}</caption><thead><tr><th scope="col">${thumbnails ? "Qué necesitás saber" : "Detalle"}</th>${entries.map(product => headerMarkup(product, thumbnails)).join("")}</tr></thead><tbody>${visible.map((row, index) => `<tr><th scope="row" id="comparison-${key}-row-${index}">${escapeHtml(row.label)}</th>${row.values.map(value => `<td${value === missing || value === unconfirmed ? ' class="comparison-data-missing"' : ""}>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }

    function renderResults(updateUrl) {
      const entries = selectedProducts();
      const nutritionOpen = Boolean(results.querySelector('[data-comparison-section="nutrition"]')?.open);
      const detailsOpen = Boolean(results.querySelector('[data-comparison-section="details"]')?.open);
      const enough = entries.length >= 2;
      notice.textContent = state.notice;
      notice.hidden = !state.notice;
      toolbar.hidden = !enough;
      share.hidden = !enough;
      copyStatus.textContent = "";
      root.querySelector("[data-comparison-count]").textContent = `${entries.length} alimentos seleccionados`;
      if (!enough) {
        results.innerHTML = `<div class="comparison-empty"><h2>${entries.length ? "Elegí otro alimento para comparar" : "Dos alimentos, los detalles frente a frente"}</h2><p>Compará su etapa, presentación y composición. Podés agregar hasta tres alimentos del mismo animal.</p></div>`;
      } else {
        results.innerHTML = `<p class="comparison-stage-note">Revisá la etapa y la etiqueta de cada alimento antes de cambiarlo.</p><p id="comparison-scroll-help" class="comparison-scroll-help">En pantallas pequeñas, deslizá la tabla hacia los lados. Con teclado, enfocá la tabla y usá las flechas.</p>${tableMarkup(entries, getEssentialRows(entries), "essential", "Información principal de los alimentos", true)}<details class="comparison-details" data-comparison-section="nutrition"${nutritionOpen ? " open" : ""}><summary>Análisis garantizado</summary><p class="comparison-section-intro">Los mínimos, máximos, rangos y unidades se muestran como figuran en cada ficha. Las cifras mayores no significan que un alimento sea más adecuado.</p>${tableMarkup(entries, getNutritionRows(entries), "nutrition", "Análisis garantizado de los alimentos", false)}</details><details class="comparison-details" data-comparison-section="details"${detailsOpen ? " open" : ""}><summary>Beneficios e indicaciones</summary>${tableMarkup(entries, getDetailRows(entries), "details", "Beneficios e indicaciones de los alimentos", false)}</details>`;
      }
      const comparisonUrl = buildComparisonUrl(state.slots.filter(Boolean), state.animal);
      urlField.value = comparisonUrl;
      if (updateUrl && window.history?.replaceState) {
        const canonical = new URL(comparisonUrl);
        try { window.history.replaceState(null, "", `${window.location.pathname}${canonical.search}`); } catch (_error) { /* El enlace sigue disponible aunque el navegador restrinja el historial. */ }
      }
    }

    function refresh(updateUrl = true) {
      renderOptions();
      renderResults(updateUrl);
    }

    root.addEventListener("change", event => {
      const target = event.target;
      state.notice = "";
      if (target.matches("[data-comparison-animal]")) {
        if (!getAnimalKeys().includes(target.value)) return;
        state.animal = target.value;
        state.slots = [null, null, null];
        state.third = false;
        refresh();
      } else if (target.matches("[data-comparison-product]")) {
        const index = Number(target.dataset.comparisonProduct);
        const id = Number(target.value) || null;
        const valid = !id || getFeeds().some(product => product.id === id && product.category === state.animal);
        if (!Number.isInteger(index) || index < 0 || index > 2 || !valid || (id && state.slots.some((other, slot) => slot !== index && other === id))) {
          state.notice = "Elegí alimentos distintos del mismo animal.";
        } else state.slots[index] = id;
        refresh();
      } else if (target.matches("[data-comparison-differences]")) {
        state.onlyDifferences = target.checked;
        renderResults(false);
      }
    });

    root.addEventListener("click", async event => {
      const button = event.target.closest("button");
      if (!button || !root.contains(button)) return;
      if (button.matches("[data-comparison-add]")) {
        state.third = true;
        renderOptions();
        selects[2].focus();
      } else if (button.matches("[data-comparison-reset]")) {
        state.slots = [null, null, null];
        state.third = false;
        state.notice = "";
        refresh();
        selects[0].focus();
      } else if (button.matches("[data-comparison-copy]")) {
        if (selectedProducts().length < 2) return;
        const url = urlField.value;
        try {
          if (!window.navigator?.clipboard?.writeText) throw new Error("Clipboard unavailable");
          await window.navigator.clipboard.writeText(url);
          if (urlField.value !== url || selectedProducts().length < 2) return;
          copyStatus.textContent = "Enlace copiado. Ya podés compartirlo.";
        } catch (_error) {
          if (urlField.value !== url || selectedProducts().length < 2) return;
          urlField.focus();
          urlField.select();
          copyStatus.textContent = "Seleccioná y copiá el enlace para compartir esta comparación.";
        }
      }
    });

    window.addEventListener("popstate", () => {
      const current = parseSelection(window.location.search);
      state.animal = current.animal;
      state.slots = [current.ids[0] || null, current.ids[1] || null, current.ids[2] || null];
      state.third = current.ids.length === 3;
      state.notice = current.notice;
      refresh(false);
    });

    refresh(false);
    root.dataset.comparisonReady = "true";
    root.setAttribute("aria-busy", "false");
    if (fallback) fallback.hidden = true;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  }
})();
