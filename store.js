(function () {
  "use strict";

  const WHATSAPP_NUMBER = "50582403490";
  const CART_KEY = "agrocentro_cart";
  const PAGE_SIZE = 16;
  const MODEL = window.AGROCENTRO_CATALOG;
  const PRODUCT_VIEWS = window.AGROCENTRO_PRODUCT_VIEWS || {};
  const catalog = MODEL.products;

  const typeLabels = MODEL.types;
  const categoryLabels = MODEL.categories;
  const stageLabels = MODEL.stages;
  const stageSearchTerms = {
    preinicio: "preinicio pre iniciador",
    inicio: "inicio iniciador crianza",
    desarrollo: "crecimiento desarrollo",
    engorde: "engorde engorda finalización acabado",
    produccion: "producción postura ponedora",
    gestacion: "gestación gestante",
    lactancia: "lactancia lactación lactante",
    mantenimiento: "adulto mantenimiento trabajo rendimiento"
  };

  const state = {
    type: "all",
    category: "all",
    stage: "all",
    pigLine: "all",
    vetCategory: "all",
    vetSpecies: "all",
    query: "",
    sort: "default",
    visible: PAGE_SIZE,
    filtered: []
  };

  let order = readCart();
  let lastFocusedElement = null;
  let toastTimer = null;
  let activeProductViews = [];
  let activeProductViewIndex = 0;
  let productViewSwapTimer = null;
  let productViewPointerStart = null;
  let productViewWasDragged = false;
  let activeModalProductId = null;

  const elements = {};

  function readCart() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(stored)) return [];

      return stored
        .map((item) => {
          const product = catalog.find((entry) => entry.id === Number(item.id));
          if (!product) return null;
          return {
            id: product.id,
            name: MODEL.getOrderName(product),
            image: getProductImage(product),
            category: product.category,
            type: product.type,
            qty: clampQuantity(item.qty)
          };
        })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(order));
    } catch (error) {
      // El pedido sigue funcionando durante esta visita si el navegador bloquea el almacenamiento.
    }
    renderCart();
  }

  function syncCartFromStorage() {
    order = readCart();
    renderCart();
  }

  function clampQuantity(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(999, Math.max(1, parsed));
  }

  function getProductImage(product) {
    return MODEL.getImage(product);
  }

  function getCatalogImageClass(imageSource) {
    return " is-cutout-catalog";
  }

  function getProductViews(product) {
    const configuredViews = PRODUCT_VIEWS[product.id];
    if (!Array.isArray(configuredViews) || configuredViews.length === 0) {
      return [{ src: getProductImage(product), label: "Frente" }];
    }

    const validViews = configuredViews
      .filter((view) => view && typeof view.src === "string" && view.src.trim())
      .map((view, index) => ({
        src: view.src,
        label: typeof view.label === "string" && view.label.trim() ? view.label.trim() : `Vista ${index + 1}`
      }));

    return validViews.length ? validViews : [{ src: getProductImage(product), label: "Frente" }];
  }

  function getFeedGuide(product) {
    return MODEL.getGuide(product);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[–—−]/g, "-")
      .toLowerCase()
      .trim();
  }

  function matchesSearch(searchable, query) {
    if (!query) return true;
    if (!/\d/.test(query)) return searchable.includes(query);

    const numbers = query.match(/\d+/g) || [];
    const words = query.replace(/\d+/g, " ").split(/[^a-z]+/).filter(Boolean);
    const numbersMatch = numbers.every((number) => new RegExp(`(^|[^0-9])${number}(?=$|[^0-9])`).test(searchable));
    const wordsMatch = words.every((word) => searchable.includes(word));
    return numbersMatch && wordsMatch;
  }

  function searchRank(product, query) {
    if (!query) return 0;
    const guide = getFeedGuide(product);
    const names = [product.name, MODEL.getName(product), guide?.officialName, ...(guide?.aliases || [])]
      .filter(Boolean).map(normalizeText);
    if (names.includes(query)) return 0;
    return names.some((name) => matchesSearch(name, query)) ? 1 : 2;
  }

  function labelType(type) {
    return typeLabels[type] || "Producto";
  }

  function labelCategory(category) {
    return categoryLabels[category] || "Uso general";
  }

  function productCategoryLabel(product) {
    return product.type === "medicinas" ? MODEL.vetCategories[MODEL.getVetCategory(product)] : labelCategory(product.category);
  }

  function labelStage(stage) {
    return stageLabels[stage] || "Etapa productiva";
  }

  function showToast(message) {
    if (!elements.toast) return;
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2300);
  }

  function filterCatalog() {
    syncFilterOptions();
    const query = normalizeText(state.query);

    let filtered = catalog.filter((product) => {
      const guide = getFeedGuide(product);
      const vet = MODEL.getVetInfo(product);
      const matchesType = state.type === "all" || product.type === state.type;
      const matchesCategory = state.category === "all" || product.category === state.category;
      const matchesStage = state.stage === "all" || Boolean(guide && Array.isArray(guide.stages) && guide.stages.includes(state.stage));
      const matchesLine = state.pigLine === "all" || MODEL.getPigLine(product) === state.pigLine;
      const matchesVetCategory = state.vetCategory === "all" || (product.type === "medicinas" && MODEL.getVetCategory(product) === state.vetCategory);
      const matchesVetSpecies = state.vetSpecies === "all" || Boolean(vet?.species?.includes(state.vetSpecies));
      const searchable = normalizeText([
        product.name,
        MODEL.getName(product),
        MODEL.pigLines[MODEL.getPigLine(product)] || "",
        guide ? "" : (vet?.summary || product.description),
        guide || vet ? "" : product.instructions,
        labelType(product.type),
        productCategoryLabel(product),
        vet?.species?.join(" "), vet?.composition, vet?.manufacturer, vet?.form, vet?.presentation,
        guide && guide.stage,
        guide && guide.period,
        guide && guide.use,
        guide && guide.form,
        guide && guide.presentation,
        guide && guide.feeding,
        guide && guide.officialName,
        guide && Array.isArray(guide.aliases) ? guide.aliases.join(" ") : "",
        guide && Array.isArray(guide.benefits) ? guide.benefits.join(" ") : "",
        guide && Array.isArray(guide.analysis) ? guide.analysis.flat().join(" ") : "",
        guide && Array.isArray(guide.stages) ? guide.stages.map(labelStage).join(" ") : "",
        guide && Array.isArray(guide.stages) ? guide.stages.map((stage) => stageSearchTerms[stage] || "").join(" ") : ""
      ].join(" "));
      const matchesQuery = matchesSearch(searchable, query);
      return matchesType && matchesCategory && matchesStage && matchesLine && matchesVetCategory && matchesVetSpecies && matchesQuery;
    });

    if (state.sort === "az") {
      filtered.sort((a, b) => MODEL.getName(a).localeCompare(MODEL.getName(b), "es"));
    } else if (state.sort === "za") {
      filtered.sort((a, b) => MODEL.getName(b).localeCompare(MODEL.getName(a), "es"));
    } else {
      filtered.sort((a, b) => searchRank(a, query) - searchRank(b, query) || MODEL.compareProducts(a, b));
    }

    state.filtered = MODEL.groupProducts(filtered, (product) => Boolean(query) && matchesSearch(normalizeText([
      product.name, MODEL.getName(product), getFeedGuide(product)?.presentation
    ].join(" ")), query));
    renderCatalog();
    syncUrl();
  }

  function productCard(product) {
    const imageSource = getProductImage(product);
    const image = escapeHtml(imageSource);
    const cleanImageClass = getCatalogImageClass(imageSource);
    const name = escapeHtml(MODEL.getName(product));
    const variants = MODEL.getVariants(product);
    const hasVariants = variants.length > 1;
    const guide = getFeedGuide(product);
    const vet = MODEL.getVetInfo(product);
    const description = escapeHtml(guide?.use || vet?.summary || product.description || "Consultá presentación y disponibilidad.");
    const type = escapeHtml(labelType(product.type));
    const category = escapeHtml(productCategoryLabel(product));
    const stage = guide ? escapeHtml(guide.stage) : "";
    const period = guide ? escapeHtml(guide.period) : "";
    const presentation = escapeHtml(guide?.presentation || vet?.presentation || "");
    const line = MODEL.pigLines[MODEL.getPigLine(product)];

    return `
      <article class="product-card" data-product-card="${product.id}">
        <button class="product-image${cleanImageClass}" type="button" data-detail="${product.id}" aria-label="Ver detalles de ${name}">
          <span class="product-badge">${type}</span>
          <img src="${image}" ${MODEL.getResponsiveAttributes(imageSource, "(max-width: 760px) 29vw, (max-width: 1100px) 40vw, 280px")} alt="${name}" loading="lazy" decoding="async" data-catalog-image data-image-fallback="${escapeHtml(MODEL.getFallbackImage(product))}">
        </button>
        <div class="product-body">
          <p class="product-category">${category}</p>
          <button class="product-name" type="button" data-detail="${product.id}">${name}</button>
          <p class="product-description">${description}</p>
          ${vet ? `<p class="vet-card-species"><span>Especies</span> ${escapeHtml(vet.species?.join(" · ") || "Por confirmar en etiqueta")}</p>` : ""}
          ${line ? `<p class="feed-line">${escapeHtml(line)}</p>` : ""}
          ${guide ? `<p class="feed-stage${guide.agePrograms ? " has-age-programs" : ""}"><span>${stage}</span>${guide.agePrograms ? "" : `<strong>${period}</strong>`}</p>${ageProgramsMarkup(guide)}` : ""}
          ${hasVariants ? `<p class="product-package"><span>Tamaños</span><strong>${variants.length} presentaciones</strong></p>` : (presentation ? `<p class="product-package"><span>Presentación</span><strong>${presentation}</strong></p>` : "")}
          <div class="product-actions">
            <button class="add-cart-btn" type="button" ${hasVariants ? `data-detail="${product.id}"` : `data-add="${product.id}"`} aria-label="${hasVariants ? "Elegir presentación de" : "Agregar al pedido"} ${name}">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
              ${hasVariants ? "Elegir tamaño" : "Agregar"}
            </button>
            <button class="product-detail-btn" type="button" data-detail="${product.id}" aria-label="Información de ${name}">
              <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path></svg>
              <span>Ver ficha</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderCatalog() {
    const visibleProducts = state.filtered.slice(0, state.visible);
    let previousSection = "";
    elements.productsGrid.innerHTML = visibleProducts.map((product) => {
      const section = MODEL.sectionName(product);
      const heading = state.sort === "default" && section !== previousSection
        ? `<h3 class="catalog-section-label">${escapeHtml(section)}</h3>` : "";
      previousSection = section;
      return heading + productCard(product);
    }).join("");

    const count = state.filtered.length;
    if (count === 0) {
      elements.productsCount.textContent = "0 productos encontrados";
    } else if (state.visible < count) {
      elements.productsCount.textContent = `Mostrando ${visibleProducts.length} de ${count} productos`;
    } else {
      elements.productsCount.textContent = `${count} producto${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"}`;
    }

    elements.emptyState.hidden = count !== 0;
    elements.loadMoreWrap.hidden = state.visible >= count || count === 0;
    elements.resetFilters.classList.toggle("visible", Boolean(state.query) || state.type !== "all" || state.category !== "all" || state.stage !== "all" || state.vetCategory !== "all" || state.vetSpecies !== "all");
    elements.searchClear.classList.toggle("visible", Boolean(state.query));
    attachImageFallbacks(elements.productsGrid);
  }

  function attachImageFallbacks(container) {
    container.querySelectorAll("[data-catalog-image]").forEach((image) => {
      image.addEventListener("error", () => {
        // Retry the original before using an alternate image or the logo.
        if (image.hasAttribute("srcset")) {
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          return;
        }
        if (image.dataset.imageFallback && !image.dataset.alternateTried) {
          image.dataset.alternateTried = "1";
          image.src = image.dataset.imageFallback;
          return;
        }
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = "./assets/logo.png";
        image.alt = "Imagen próximamente disponible";
      });
    });
  }

  function setFilter(group, value) {
    if (group === "vetCategory") { state.type = "medicinas"; state.vetCategory = value; state.vetSpecies = "all"; }
    if (group === "vetSpecies") { state.type = "medicinas"; state.vetSpecies = value; }
    if (group === "type") state.type = value;
    if (group === "category") state.category = value;
    if (group === "stage") state.stage = value;
    if (group === "pigLine") {
      state.pigLine = value;
      state.type = "alimentos";
      state.category = "cerdos";
      state.stage = "all";
    }

    if (group === "stage" && value !== "all") {
      state.type = "alimentos";
      if (elements.typeFilterSelect) elements.typeFilterSelect.value = "alimentos";
    }

    if (group === "type" && value !== "alimentos") {
      state.stage = "all";
      if (elements.stageFilterSelect) elements.stageFilterSelect.value = "all";
    }
    state.visible = PAGE_SIZE;

    document.querySelectorAll(`.${group}-btn`).forEach((button) => {
      const buttonValue = button.dataset[group];
      button.classList.toggle("active", buttonValue === value);
    });

    if (group === "type" && elements.typeFilterSelect) elements.typeFilterSelect.value = value;
    if (group === "category" && elements.categoryFilterSelect) elements.categoryFilterSelect.value = value;
    if (group === "stage" && elements.stageFilterSelect) elements.stageFilterSelect.value = value;

    filterCatalog();
  }

  function syncFilterOptions() {
    MODEL.normalizeFilters(state);
    const food = state.type === "alimentos";
    const option = (value, label) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    elements.categoryFilterSelect.innerHTML = option("all", "Todos los animales") + MODEL.getAvailableCategories().map((category) => option(category, MODEL.categories[category])).join("");
    elements.stageFilterSelect.innerHTML = option("all", "Todas las etapas") + MODEL.getAvailableStages(state.category, state.pigLine).map((stage) => option(stage, MODEL.stages[stage])).join("");
    elements.categoryFilterSelect.value = state.category;
    elements.stageFilterSelect.value = state.stage;
    elements.typeFilterSelect.value = state.type;
    elements.typeFilterSelect.closest("label").hidden = true;
    elements.categoryFilterSelect.closest(".filter-block").hidden = !food;
    elements.vetFilters.hidden = state.type !== "medicinas";
    elements.vetCategorySelect.innerHTML = option("all", "Todos los tipos") + MODEL.getAvailableVetCategories().map(key => option(key, MODEL.vetCategories[key])).join("");
    elements.vetSpeciesSelect.innerHTML = option("all", "Todas las especies") + MODEL.getAvailableVetSpecies(state.vetCategory).map(value => option(value, value)).join("");
    elements.vetCategorySelect.value = state.vetCategory;
    elements.vetSpeciesSelect.value = state.vetSpecies;
    elements.sortSelect.querySelector('option[value="default"]').textContent = food ? "Categoría y etapa" : state.type === "medicinas" ? "Tipo de producto" : "Categoría";
    const lines = document.getElementById("pig-lines");
    if (lines) lines.hidden = !food || state.category !== "cerdos";
    document.querySelectorAll("[data-pig-line]").forEach((button) => {
      const active = button.dataset.pigLine === state.pigLine;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("active", active);
    });
    document.querySelectorAll(".type-btn").forEach((button) => {
      const active = button.dataset.type === state.type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const title = document.getElementById("catalog-title");
    if (title) title.textContent = MODEL.types[state.type] || "Nuestro catálogo";
  }

  function resetFilters() {
    state.vetCategory = "all";
    state.vetSpecies = "all";
    state.type = "all";
    state.category = "all";
    state.stage = "all";
    state.pigLine = "all";
    state.query = "";
    state.sort = "default";
    state.visible = PAGE_SIZE;
    elements.searchInput.value = "";
    elements.sortSelect.value = "default";
    if (elements.typeFilterSelect) elements.typeFilterSelect.value = "all";
    if (elements.categoryFilterSelect) elements.categoryFilterSelect.value = "all";
    if (elements.stageFilterSelect) elements.stageFilterSelect.value = "all";

    document.querySelectorAll(".type-btn").forEach((button) => button.classList.toggle("active", button.dataset.type === "all"));
    document.querySelectorAll(".category-btn").forEach((button) => button.classList.toggle("active", button.dataset.category === "all"));
    filterCatalog();
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.category !== "all") params.set("category", state.category);
    if (state.type !== "all") params.set("type", state.type);
    if (state.stage !== "all") params.set("stage", state.stage);
    if (state.pigLine !== "all") params.set("line", state.pigLine);
    if (state.vetCategory !== "all") params.set("vet", state.vetCategory);
    if (state.vetSpecies !== "all") params.set("especie", state.vetSpecies);
    if (state.query) params.set("q", state.query);
    if (state.sort !== "default") params.set("sort", state.sort);
    if (activeModalProductId !== null) params.set("product", activeModalProductId);
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function readUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const validTypes = ["all", ...Object.keys(typeLabels)];
    const validCategories = ["all", ...Object.keys(categoryLabels)];
    const validStages = ["all", ...Object.keys(stageLabels)];
    const type = params.get("type") || "all";
    const category = params.get("category") || "all";
    const stage = params.get("stage") || "all";
    const query = params.get("q") || "";

    state.type = validTypes.includes(type) ? type : "all";
    state.vetCategory = params.get("vet") || "all";
    state.vetSpecies = params.get("especie") || "all";
    if (state.type === "all" && (state.vetCategory !== "all" || state.vetSpecies !== "all")) state.type = "medicinas";
    state.category = validCategories.includes(category) ? category : "all";
    state.stage = validStages.includes(stage) ? stage : "all";
    state.pigLine = MODEL.pigLines[params.get("line")] ? params.get("line") : "all";
    if (state.pigLine !== "all") { state.type = "alimentos"; state.category = "cerdos"; }
    if (state.stage !== "all" || (state.type === "all" && state.category !== "all")) state.type = "alimentos";
    state.sort = ["az", "za"].includes(params.get("sort")) ? params.get("sort") : "default";
    elements.sortSelect.value = state.sort;
    state.query = query.slice(0, 80);
    elements.searchInput.value = state.query;
    if (elements.typeFilterSelect) elements.typeFilterSelect.value = state.type;
    if (elements.categoryFilterSelect) elements.categoryFilterSelect.value = state.category;
    if (elements.stageFilterSelect) elements.stageFilterSelect.value = state.stage;

    document.querySelectorAll(".type-btn").forEach((button) => button.classList.toggle("active", button.dataset.type === state.type));
    document.querySelectorAll(".category-btn").forEach((button) => button.classList.toggle("active", button.dataset.category === state.category));
  }

  function addToOrder(productId, quantity = 1) {
    const product = catalog.find((entry) => entry.id === productId);
    if (!product) return;

    const amount = clampQuantity(quantity);
    const existing = order.find((item) => item.id === productId);
    if (existing) {
      existing.qty = clampQuantity(existing.qty + amount);
    } else {
      order.push({
        id: product.id,
        name: MODEL.getOrderName(product),
        image: getProductImage(product),
        category: product.category,
        type: product.type,
        qty: amount
      });
    }

    saveCart();
    showToast(`${MODEL.getOrderName(product)} agregado a tu pedido`);

    const buttons = document.querySelectorAll(`[data-add="${productId}"]`);
    buttons.forEach((button) => {
      const original = button.innerHTML;
      button.classList.add("added");
      button.textContent = "Agregado ✓";
      window.setTimeout(() => {
        button.classList.remove("added");
        button.innerHTML = original;
      }, 1200);
    });
  }

  function removeFromOrder(productId) {
    order = order.filter((item) => item.id !== productId);
    saveCart();
  }

  function updateOrderQuantity(productId, quantity) {
    const item = order.find((entry) => entry.id === productId);
    if (!item) return;
    item.qty = clampQuantity(quantity);
    saveCart();
  }

  function cartItem(item) {
    const name = escapeHtml(item.name);
    const image = escapeHtml(item.image || "./assets/logo.png");
    const product = catalog.find((entry) => entry.id === item.id);
    const fallback = product ? MODEL.getFallbackImage(product) : "";
    return `
      <div class="cart-item" data-cart-item="${item.id}">
        <div class="cart-item-image"><img src="${image}" ${MODEL.getResponsiveAttributes(item.image, "64px")} alt="" loading="lazy" decoding="async" data-catalog-image data-image-fallback="${escapeHtml(fallback)}"></div>
        <div class="cart-item-info">
          <div class="cart-item-top">
            <span class="cart-item-name">${name}</span>
            <button class="cart-item-remove" type="button" data-remove="${item.id}">Quitar</button>
          </div>
          <p class="cart-item-meta">${escapeHtml(labelType(item.type))} · ${escapeHtml(product ? productCategoryLabel(product) : labelCategory(item.category))}</p>
          <div class="quantity-control" aria-label="Cantidad de ${name}">
            <button type="button" data-decrease="${item.id}" aria-label="Disminuir cantidad">−</button>
            <input type="number" min="1" max="999" value="${item.qty}" data-quantity="${item.id}" aria-label="Cantidad">
            <button type="button" data-increase="${item.id}" aria-label="Aumentar cantidad">+</button>
          </div>
        </div>
      </div>`;
  }

  function renderCart() {
    const totalItems = order.reduce((total, item) => total + item.qty, 0);
    const distinctProducts = order.length;

    elements.cartCount.textContent = totalItems;
    elements.cartCount.classList.remove("bump");
    window.requestAnimationFrame(() => elements.cartCount.classList.add("bump"));
    elements.mobileCartCount.textContent = `${totalItems} ${totalItems === 1 ? "producto" : "productos"}`;
    elements.orderTotalItems.textContent = `${distinctProducts} ${distinctProducts === 1 ? "producto" : "productos"} · ${totalItems} ${totalItems === 1 ? "unidad" : "unidades"}`;

    elements.cartItems.innerHTML = order.map(cartItem).join("");
    elements.cartEmpty.hidden = order.length !== 0;
    elements.orderForm.hidden = order.length === 0;
    elements.cartFooter.hidden = order.length === 0;
    elements.mobileCart.classList.toggle("visible", order.length > 0);
    document.body.classList.toggle("has-cart-items", order.length > 0);
    attachImageFallbacks(elements.cartItems);
  }

  function openCart() {
    if (elements.cartDrawer.classList.contains("open")) return;
    lastFocusedElement = document.activeElement;
    elements.drawerOverlay.hidden = false;
    elements.cartDrawer.inert = false;
    elements.cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    window.requestAnimationFrame(() => {
      elements.drawerOverlay.classList.add("visible");
      elements.cartDrawer.classList.add("open");
      elements.orderClose.focus();
    });
  }

  function closeCart() {
    if (!elements.cartDrawer.classList.contains("open")) return;
    elements.drawerOverlay.classList.remove("visible");
    elements.cartDrawer.classList.remove("open");
    elements.cartDrawer.setAttribute("aria-hidden", "true");
    elements.cartDrawer.inert = true;
    document.body.classList.remove("no-scroll");
    window.setTimeout(() => {
      elements.drawerOverlay.hidden = true;
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
    }, 260);
  }

  function ageProgramsMarkup(guide, withSource = false) {
    if (!Array.isArray(guide?.agePrograms)) return "";
    return `<div class="age-programs"><p>Edad del lechón</p><dl>${guide.agePrograms.map((program) => `<div><dt>${escapeHtml(program.label)}</dt><dd>${escapeHtml(program.days)} días</dd></div>`).join("")}</dl>${withSource ? `<p class="age-program-note">Días de vida desde el nacimiento. Usá las fases del mismo programa.</p><a class="age-program-source" href="${escapeHtml(guide.ageSource)}" target="_blank" rel="noopener noreferrer">Consultar programa NeoPigg</a>` : ""}</div>`;
  }

  function openProductModal(productId, changingVariant = false) {
    const product = catalog.find((entry) => entry.id === productId);
    if (!product) return;

    const previousQuantity = changingVariant ? getModalQuantity() : 1;
    const previousScroll = elements.productModal.querySelector('.product-modal-card')?.scrollTop || 0;
    window.clearTimeout(productViewSwapTimer);
    productViewPointerStart = null;
    productViewWasDragged = false;
    activeModalProductId = product.id;
    activeProductViews = getProductViews(product);
    activeProductViewIndex = 0;
    const image = escapeHtml(activeProductViews[0].src);
    const name = escapeHtml(MODEL.getName(product));
    const variants = MODEL.getVariants(product);
    const guide = getFeedGuide(product);
    const vet = MODEL.getVetInfo(product);
    const initialViewLabel = escapeHtml(activeProductViews[0].label.toLowerCase());
    const nextViewLabel = activeProductViews[1] ? escapeHtml(activeProductViews[1].label.toLowerCase()) : '';
    const guideRow = (label, value) => value ? `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` : '';
    const useHeading = product.type === 'herramientas' ? 'Características y uso' : product.type === 'medicinas' ? 'Información del producto' : 'Uso y etapa recomendada';
    const presentation = guide?.presentation || vet?.presentation || product.presentation || 'Presentación por confirmar';
    const shareUrl = getProductShareUrl(product);
    const shareText = `${MODEL.getName(product)} · ${presentation}\nAgroCentro Nica`;
    const quantityLabel = product.type === 'alimentos' && /(?:100|55)\s*lb\b/.test(presentation) ? 'Cantidad de sacos' : 'Cantidad de unidades';
    const category = vet ? productCategoryLabel(product) : product.category === 'otros' ? labelType(product.type) : `${labelType(product.type)} · ${labelCategory(product.category)}`;
    const variantMarkup = variants.length > 1
      ? `<label class="product-variant-label" for="product-presentation-select"><span>Elegí la presentación</span><select id="product-presentation-select" data-product-variant>${variants.map(variant => `<option value="${variant.id}"${variant.id === product.id ? ' selected' : ''}>${escapeHtml(getFeedGuide(variant)?.presentation || variant.name)}</option>`).join('')}</select></label>`
      : `<div class="product-presentation-fixed"><span>Presentación</span><strong>${escapeHtml(presentation)}</strong></div>`;
    const benefitsMarkup = guide?.benefits?.length ? `<details class="product-information-section"><summary>Beneficios principales</summary><div class="product-information-body"><ul>${guide.benefits.map(benefit => `<li>${escapeHtml(benefit)}</li>`).join('')}</ul></div></details>` : '';
    const analysisMarkup = guide?.analysis?.length ? `<details class="product-information-section catalog-analysis"><summary>Análisis garantizado</summary><dl>${guide.analysis.map(entry => {
      const nutrient = Array.isArray(entry) ? entry[0] : entry.nutrient;
      const qualifier = Array.isArray(entry) ? entry[1] : entry.qualifier;
      const value = Array.isArray(entry) ? entry[2] : entry.value;
      return `<div><dt>${escapeHtml(nutrient)}</dt><dd><span>${escapeHtml(qualifier)}</span><strong>${escapeHtml(value)}</strong></dd></div>`;
    }).join('')}</dl></details>` : '';
    const vetRow = (label, value) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || 'Por confirmar en etiqueta')}</dd></div>`;
    const vetFacts = vet ? `<dl class="vet-facts">
      ${vetRow('Tipo de producto', productCategoryLabel(product))}
      ${vetRow('Especies indicadas', vet.species?.join(' · '))}
      ${vetRow('Composición', vet.composition)}
      ${vetRow('Forma del producto', vet.form)}
      ${vetRow('Fabricante / marca', vet.manufacturer)}
      </dl>${vet.identityNote ? `<p class="vet-identity-note">${escapeHtml(vet.identityNote)}</p>` : ''}` : '';
    const vetPrecautions = vet ? `<details class="product-information-section"><summary>Precauciones</summary><div class="product-information-body"><ul>${(vet.precautions?.length ? vet.precautions : ['Confirmá las precauciones de la presentación exacta en su etiqueta y con el médico veterinario.']).map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul></div></details>` : '';
    const useMarkup = vet ? vetFacts : guide ? `<div class="feed-guide" aria-label="Guía de uso de ${name}">
      ${guideRow('Nombre en catálogo', guide.officialName && guide.officialName !== product.name ? guide.officialName : '')}
      ${guideRow('Animal', labelCategory(product.category))}
      ${guideRow('Etapa productiva', guide.stage)}
      ${guide.agePrograms ? '' : guideRow('Edad / período', guide.period)}
      ${guideRow('Línea', MODEL.pigLines[MODEL.getPigLine(product)])}
      ${guideRow('Forma', guide.form)}
      ${guideRow('Presentación', guide.presentation)}
      ${guideRow('Programa de uso', guide.feeding)}
      </div>
      ${guide.agePrograms ? `<p class="age-program-note">Días de vida desde el nacimiento. Usá las fases del mismo programa.</p><a class="age-program-source" href="${escapeHtml(guide.ageSource)}" target="_blank" rel="noopener noreferrer">Consultar programa NeoPigg</a>` : ''}
      ${guide.catalogNote ? `<p class="catalog-data-note"><strong>Nota de revisión:</strong> ${escapeHtml(guide.catalogNote)}</p>` : ''}
      <p class="feed-guide-note">Los resultados y consumos pueden variar según manejo, instalaciones, clima, sanidad y genética. Seguí la etiqueta del saco o la indicación de un técnico para ajustar la ración.</p>`
      : `<p>${escapeHtml(product.instructions || product.description || 'Consultanos las características y la presentación de este producto.')}</p>`;
    const viewControlsMarkup = activeProductViews.length > 1 ? `<div class="product-view-controls" role="group" aria-label="Fotografías disponibles del producto"><button class="product-view-toggle" type="button" data-view-toggle aria-label="Mostrar ${nextViewLabel} de ${name}"><span data-view-toggle-label>Ver ${nextViewLabel}</span></button><span class="product-view-status" data-view-status aria-live="polite">Vista ${initialViewLabel}</span><span class="sr-only">Podés deslizar sobre la foto para cambiar de vista.</span></div>` : '';

    elements.modalContent.innerHTML = `<div class="modal-product-grid product-detail-layout" data-detail-layout>
      <div class="modal-product-media">
        <button class="product-photo-toggle" type="button" data-photo-zoom aria-expanded="false" aria-controls="modal-product-photo" aria-label="Ampliar foto de ${name}">
          <span id="modal-product-photo" class="modal-product-image is-cutout-catalog${activeProductViews.length > 1 ? ' has-product-views' : ''}" data-product-viewer>
            <img src="${image}" ${MODEL.getResponsiveAttributes(activeProductViews[0].src, "(max-width: 760px) 90vw, 480px")} alt="${name} — ${initialViewLabel}" decoding="async" draggable="false" data-catalog-image data-product-view-image data-image-fallback="${escapeHtml(MODEL.getFallbackImage(product))}">
          </span><span class="product-photo-caption" data-photo-caption>Ampliar foto</span>
        </button>
        ${viewControlsMarkup}
      </div>
      <div class="modal-product-info">
        <p class="product-category">${escapeHtml(category)}</p>
        <h2 id="modal-product-name">${name}</h2>
        ${guide?.stage ? `<p class="product-stage-label">${escapeHtml(guide.stage)}</p>` : ''}
        ${guide?.agePrograms ? ageProgramsMarkup(guide) : guide?.period ? `<p class="product-period">${escapeHtml(guide.period)}</p>` : ''}
        <p class="modal-description">${escapeHtml(guide?.use || vet?.summary || product.description || 'Consultá las características de este producto.')}</p>
        ${MODEL.getPigLine(product) ? `<p class="feed-line">${escapeHtml(MODEL.pigLines[MODEL.getPigLine(product)])}</p>` : ''}
      </div>
      <div class="modal-product-selection">
        ${variantMarkup}
        <div class="modal-quantity-field"><label for="modal-product-quantity">${quantityLabel}</label><div class="modal-quantity-control"><button type="button" data-modal-quantity-step="-1" aria-label="Reducir cantidad"${previousQuantity === 1 ? ' disabled' : ''}>−</button><input id="modal-product-quantity" data-modal-quantity type="number" inputmode="numeric" min="1" max="999" step="1" value="${previousQuantity}"><button type="button" data-modal-quantity-step="1" aria-label="Aumentar cantidad"${previousQuantity === 999 ? ' disabled' : ''}>+</button></div></div>
      </div>
      <div class="modal-actions">
        <button class="modal-add" type="button" data-add="${product.id}" data-modal-add>Agregar al pedido</button>
        <a class="modal-whatsapp" data-modal-consult href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quisiera confirmar precio y disponibilidad de ${previousQuantity} × ${MODEL.getOrderName(product)}.`)}" target="_blank" rel="noopener noreferrer">Consultar</a>
        <p class="modal-price-note">Precio y disponibilidad por confirmar.</p>
        <p class="modal-order-feedback" data-modal-order-feedback role="status" aria-live="polite" hidden></p>
        <button class="modal-share" type="button" data-share-product="${product.id}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>Compartir ficha</button>
        <div class="product-share-fallback" data-share-fallback hidden>
          <label for="product-share-url">Enlace de esta ficha</label>
          <input id="product-share-url" type="url" value="${escapeHtml(shareUrl)}" readonly aria-describedby="product-share-help">
          <p id="product-share-help">Copiá este enlace o compartilo por WhatsApp.</p>
          <a href="https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}" target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
        </div>
      </div>
      <div class="modal-product-details">
        <details class="product-information-section"${vet ? ' open' : ''}><summary>${useHeading}</summary><div class="product-information-body">${useMarkup}</div></details>
        ${benefitsMarkup}${analysisMarkup}${vetPrecautions}
        ${guide ? `<a class="product-guide-link" href="guia-de-uso.html?tema=${({ aves: 'aves', cerdos: 'cerdos', equinos: 'equinos', perros: 'mascotas', gatos: 'mascotas' })[product.category] || 'compra'}">Guía de uso y preguntas frecuentes →</a>` : ''}
      </div>
    </div>`;

    const modalCard = elements.productModal.querySelector('.product-modal-card');
    if (modalCard) modalCard.scrollTop = changingVariant ? previousScroll : 0;
    attachImageFallbacks(elements.modalContent);
    activeProductViews.slice(1).forEach(view => { const preload = new Image(); preload.src = view.src; });
    if (!changingVariant) lastFocusedElement = document.activeElement;
    elements.productModal.inert = false;
    elements.productModal.classList.add('open');
    elements.productModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    syncUrl();
    if (changingVariant) elements.modalContent.querySelector('[data-product-variant]')?.focus({ preventScroll: true });
    else elements.modalClose.focus();
  }

  function getModalQuantity() {
    return clampQuantity(elements.modalContent.querySelector('[data-modal-quantity]')?.value || 1);
  }

  function getProductShareUrl(product) {
    const url = new URL('https://www.agrocentronica.com/products.html');
    url.searchParams.set('product', product.id);
    return url.href;
  }

  async function shareProduct(button) {
    const product = catalog.find(entry => entry.id === Number(button.dataset.shareProduct));
    if (!product || button.disabled) return;
    const url = getProductShareUrl(product);
    const presentation = getFeedGuide(product)?.presentation || MODEL.getVetInfo(product)?.presentation || product.presentation;
    const name = MODEL.getName(product);
    const text = `${name}${presentation ? ` · ${presentation}` : ''}\nAgroCentro Nica`;
    button.disabled = true;
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: `${name} | AgroCentro Nica`, text, url });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      if (!button.isConnected || activeModalProductId !== product.id) return;
      try {
        await navigator.clipboard.writeText(url);
        if (button.isConnected && activeModalProductId === product.id) showToast('Enlace copiado. Ya podés compartir la ficha.');
      } catch (error) {
        if (!button.isConnected || activeModalProductId !== product.id) return;
        const fallback = elements.modalContent.querySelector('[data-share-fallback]');
        const input = elements.modalContent.querySelector('#product-share-url');
        if (fallback && input) {
          fallback.hidden = false;
          input.focus();
          input.select();
        }
      }
    } finally {
      button.disabled = false;
    }
  }

  function updateModalQuantity(value = getModalQuantity()) {
    const quantity = clampQuantity(value);
    const input = elements.modalContent.querySelector('[data-modal-quantity]');
    if (input) input.value = String(quantity);
    const minus = elements.modalContent.querySelector('[data-modal-quantity-step="-1"]');
    const plus = elements.modalContent.querySelector('[data-modal-quantity-step="1"]');
    if (minus) minus.disabled = quantity === 1;
    if (plus) plus.disabled = quantity === 999;
    const product = catalog.find(entry => entry.id === activeModalProductId);
    const consult = elements.modalContent.querySelector('[data-modal-consult]');
    if (product && consult) consult.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quisiera confirmar precio y disponibilidad de ${quantity} × ${MODEL.getOrderName(product)}.`)}`;
    return quantity;
  }

  function toggleProductPhoto(force) {
    const layout = elements.modalContent.querySelector('[data-detail-layout]');
    const button = elements.modalContent.querySelector('[data-photo-zoom]');
    if (!layout || !button) return;
    const expanded = typeof force === 'boolean' ? force : !layout.classList.contains('is-photo-expanded');
    layout.classList.toggle('is-photo-expanded', expanded);
    const image = elements.modalContent.querySelector('[data-product-view-image]');
    if (image && image.hasAttribute('srcset')) image.sizes = expanded ? '(max-width: 760px) 94vw, 900px' : '(max-width: 760px) 90vw, 480px';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Reducir' : 'Ampliar'} foto del producto`);
    const caption = elements.modalContent.querySelector('[data-photo-caption]');
    if (caption) caption.textContent = expanded ? 'Reducir foto' : 'Ampliar foto';
  }

  function closeProductModal() {
    if (!elements.productModal.classList.contains("open")) return;
    elements.productModal.classList.remove("open");
    elements.productModal.setAttribute("aria-hidden", "true");
    elements.productModal.inert = true;
    document.body.classList.remove("no-scroll");
    window.clearTimeout(productViewSwapTimer);
    activeProductViews = [];
    activeModalProductId = null;
    syncUrl();
    productViewWasDragged = false;
    activeProductViewIndex = 0;
    productViewPointerStart = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
  }

  function showProductView(nextIndex) {
    if (activeProductViews.length < 2) return;
    const image = elements.modalContent.querySelector("[data-product-view-image]");
    const toggleLabel = elements.modalContent.querySelector("[data-view-toggle-label]");
    const toggleButton = elements.modalContent.querySelector("[data-view-toggle]");
    const status = elements.modalContent.querySelector("[data-view-status]");
    if (!image || !toggleButton) return;

    const normalizedIndex = (nextIndex + activeProductViews.length) % activeProductViews.length;
    const nextView = activeProductViews[normalizedIndex];
    const followingView = activeProductViews[(normalizedIndex + 1) % activeProductViews.length];
    activeProductViewIndex = normalizedIndex;
    image.classList.add("is-changing-view");
    window.clearTimeout(productViewSwapTimer);
    productViewSwapTimer = window.setTimeout(() => {
      delete image.dataset.fallbackApplied;
      delete image.dataset.alternateTried;
      const expanded = elements.modalContent.querySelector('[data-detail-layout]')?.classList.contains('is-photo-expanded');
      MODEL.setResponsiveSource(image, nextView.src, expanded ? '(max-width: 760px) 94vw, 900px' : '(max-width: 760px) 90vw, 480px');
      image.alt = `${document.getElementById("modal-product-name")?.textContent || "Saco"} — ${nextView.label.toLowerCase()}`;
      if (toggleLabel) toggleLabel.textContent = `Ver ${followingView.label.toLowerCase()}`;
      toggleButton.setAttribute("aria-label", `Mostrar ${followingView.label.toLowerCase()} del saco`);
      if (status) status.textContent = `Vista ${nextView.label.toLowerCase()}`;
      window.requestAnimationFrame(() => image.classList.remove("is-changing-view"));
    }, 90);
  }

  function startProductViewGesture(event) {
    const viewer = event.target.closest("[data-product-viewer]");
    productViewWasDragged = false;
    if (!viewer || activeProductViews.length < 2) return;
    productViewPointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (typeof viewer.setPointerCapture === "function") {
      try {
        viewer.setPointerCapture(event.pointerId);
      } catch (error) {
        // Algunos WebViews cancelan el puntero antes de que pueda capturarse.
      }
    }
  }

  function endProductViewGesture(event) {
    if (!productViewPointerStart || event.pointerId !== productViewPointerStart.id) return;
    const deltaX = event.clientX - productViewPointerStart.x;
    const deltaY = event.clientY - productViewPointerStart.y;
    productViewPointerStart = null;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    productViewWasDragged = true;
    showProductView(activeProductViewIndex + (deltaX < 0 ? 1 : -1));
  }

  function validateOrderForm() {
    const name = elements.customerName.value.trim();
    const phone = elements.customerPhone.value.trim();
    const delivery = elements.deliveryMethod.value;
    const location = elements.customerLocation.value.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    elements.customerName.classList.toggle("invalid", name.length < 2);
    elements.customerPhone.classList.toggle("invalid", phoneDigits.length < 7);
    elements.deliveryMethod.classList.toggle("invalid", !delivery);
    elements.customerLocation.classList.toggle("invalid", delivery === "Solicitar entrega" && location.length < 3);

    if (name.length < 2 || phoneDigits.length < 7 || !delivery) {
      elements.formError.textContent = "Completá tu nombre, teléfono y forma de entrega.";
      elements.formError.hidden = false;
      return false;
    }

    if (delivery === "Solicitar entrega" && location.length < 3) {
      elements.formError.textContent = "Indicá el municipio, barrio o comunidad para solicitar entrega.";
      elements.formError.hidden = false;
      return false;
    }

    elements.formError.hidden = true;
    return true;
  }

  function createOrderNumber() {
    const now = new Date();
    const date = [now.getFullYear().toString().slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
    const time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0")].join("");
    return `AG-${date}-${time}`;
  }

  function buildOrderMessage(items, customer, reference) {
    const oneLine = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const phone = oneLine(customer.phone);
    const digits = phone.replace(/\D/g, "");
    const formattedPhone = digits.length === 8 ? `${digits.slice(0, 4)} ${digits.slice(4)}`
      : (digits.length === 11 && digits.startsWith("505") ? `+505 ${digits.slice(3, 7)} ${digits.slice(7)}` : phone);
    const deliveryRequested = customer.delivery === "Solicitar entrega";
    const delivery = deliveryRequested ? "Entrega a domicilio" : oneLine(customer.delivery);
    const entries = items.map((item) => ({ item, product: catalog.find((product) => product.id === item.id) }))
      .filter((entry) => entry.product)
      .sort((a, b) => MODEL.compareProducts(a.product, b.product));
    const groups = new Map();
    entries.forEach((entry) => {
      const { product } = entry;
      const group = product.type === "alimentos" ? `ALIMENTOS · ${labelCategory(product.category).toUpperCase()}`
        : labelType(product.type).toUpperCase();
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(entry);
    });

    const lines = [
      "🌿 *AGROCENTRO NICA*",
      "*Solicitud de pedido*",
      `Referencia: ${oneLine(reference)}`,
      "",
      "*DATOS DEL CLIENTE*",
      `Nombre: ${oneLine(customer.name)}`,
      `Teléfono: ${formattedPhone}`,
      "",
      "*ENTREGA O RETIRO*",
      delivery
    ];
    if (oneLine(customer.location)) lines.push(`Ubicación: ${oneLine(customer.location)}`);

    groups.forEach((entries, group) => {
      lines.push("", `*${group}*`);
      entries.forEach(({ item, product }, index) => {
        if (index > 0) lines.push("");
        lines.push(`• *${clampQuantity(item.qty)} × ${MODEL.getName(product)}*`);
        const presentation = MODEL.getGuide(product)?.presentation;
        if (presentation) lines.push(`  Presentación: ${presentation}`);
      });
    });

    const units = entries.reduce((total, { item }) => total + clampQuantity(item.qty), 0);
    lines.push("", "📦 *RESUMEN DEL PEDIDO*", `${entries.length} ${entries.length === 1 ? "producto" : "productos"} · ${units} ${units === 1 ? "unidad" : "unidades"}`);
    const notes = String(customer.notes || "").trim();
    if (notes) lines.push("", "*INDICACIONES ADICIONALES*", notes);
    lines.push("", "*PENDIENTE DE CONFIRMACIÓN*", deliveryRequested
      ? "Por favor confirmar disponibilidad, precios, cobertura, costo de entrega y total antes de preparar mi pedido."
      : "Por favor confirmar disponibilidad, precios y total antes de preparar mi pedido.");
    return lines.join("\n");
  }

  function sendOrder(event) {
    event.preventDefault();
    if (order.length === 0) return;
    if (!validateOrderForm()) {
      elements.formError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const orderNumber = createOrderNumber();
    const message = buildOrderMessage(order, {
      name: elements.customerName.value,
      phone: elements.customerPhone.value,
      delivery: elements.deliveryMethod.value,
      location: elements.customerLocation.value,
      notes: elements.orderNotes.value
    }, orderNumber);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    showToast("Revisá el mensaje y pulsá Enviar en WhatsApp");
  }

  function handleCatalogClick(event) {
    const shareButton = event.target.closest('[data-share-product]');
    if (shareButton) {
      void shareProduct(shareButton);
      return;
    }
    const step = event.target.closest('[data-modal-quantity-step]');
    if (step) {
      updateModalQuantity(getModalQuantity() + Number(step.dataset.modalQuantityStep));
      return;
    }
    const zoom = event.target.closest('[data-photo-zoom]');
    if (zoom) {
      if (productViewWasDragged) { productViewWasDragged = false; return; }
      toggleProductPhoto();
      return;
    }
    if (event.target.closest('[data-modal-consult]')) updateModalQuantity();
    const viewToggle = event.target.closest("[data-view-toggle]");
    if (viewToggle) {
      showProductView(activeProductViewIndex + 1);
      return;
    }

    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      const fromModal = addButton.hasAttribute('data-modal-add');
      const quantity = fromModal ? updateModalQuantity() : 1;
      const id = Number(addButton.dataset.add);
      addToOrder(id, quantity);
      if (fromModal) {
        const feedback = elements.modalContent.querySelector('[data-modal-order-feedback]');
        const item = order.find(entry => entry.id === id);
        if (feedback && item) {
          feedback.hidden = false;
          feedback.textContent = `En tu pedido: ${item.qty} × ${MODEL.getOrderName(catalog.find(entry => entry.id === id))}.`;
        }
      }
      return;
    }

    const detailButton = event.target.closest("[data-detail]");
    if (detailButton) openProductModal(Number(detailButton.dataset.detail));
  }

  function handleCartClick(event) {
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      removeFromOrder(Number(removeButton.dataset.remove));
      return;
    }

    const decreaseButton = event.target.closest("[data-decrease]");
    if (decreaseButton) {
      const item = order.find((entry) => entry.id === Number(decreaseButton.dataset.decrease));
      if (!item) return;
      if (item.qty === 1) removeFromOrder(item.id);
      else updateOrderQuantity(item.id, item.qty - 1);
      return;
    }

    const increaseButton = event.target.closest("[data-increase]");
    if (increaseButton) {
      const item = order.find((entry) => entry.id === Number(increaseButton.dataset.increase));
      if (item) updateOrderQuantity(item.id, item.qty + 1);
    }
  }

  function cacheElements() {
    Object.assign(elements, {
      productsGrid: document.getElementById("products-grid"),
      productsCount: document.getElementById("products-count"),
      emptyState: document.getElementById("empty-state"),
      loadMoreWrap: document.getElementById("load-more-wrap"),
      loadMore: document.getElementById("load-more"),
      resetFilters: document.getElementById("reset-filters"),
      searchInput: document.getElementById("search-input"),
      searchClear: document.getElementById("search-clear"),
      sortSelect: document.getElementById("sort-select"),
      typeFilterSelect: document.getElementById("type-filter-select"),
      categoryFilterSelect: document.getElementById("category-filter-select"),
      stageFilterSelect: document.getElementById("stage-filter-select"),
      vetFilters: document.getElementById("vet-filters"),
      vetCategorySelect: document.getElementById("vet-category-select"),
      vetSpeciesSelect: document.getElementById("vet-species-select"),
      orderButton: document.getElementById("order-btn"),
      cartCount: document.getElementById("cart-count"),
      mobileCart: document.getElementById("mobile-cart"),
      mobileCartCount: document.getElementById("mobile-cart-count"),
      cartDrawer: document.getElementById("cart-drawer"),
      drawerOverlay: document.getElementById("drawer-overlay"),
      orderClose: document.getElementById("order-close"),
      cartItems: document.getElementById("cart-items"),
      cartEmpty: document.getElementById("cart-empty"),
      continueShopping: document.getElementById("continue-shopping"),
      orderForm: document.getElementById("order-form"),
      cartFooter: document.getElementById("cart-footer"),
      orderTotalItems: document.getElementById("order-total-items"),
      customerName: document.getElementById("customer-name"),
      customerPhone: document.getElementById("customer-phone"),
      deliveryMethod: document.getElementById("delivery-method"),
      customerLocation: document.getElementById("customer-location"),
      orderNotes: document.getElementById("order-notes"),
      formError: document.getElementById("form-error"),
      productModal: document.getElementById("product-modal"),
      modalContent: document.getElementById("modal-product-content"),
      modalClose: document.getElementById("modal-close"),
      menuToggle: document.getElementById("menu-toggle"),
      mainNav: document.getElementById("main-nav"),
      toast: document.getElementById("toast")
    });
  }

  function bindEvents() {
    elements.vetCategorySelect.addEventListener("change", event => setFilter("vetCategory", event.target.value));
    elements.vetSpeciesSelect.addEventListener("change", event => setFilter("vetSpecies", event.target.value));
    document.querySelectorAll("[data-pig-line]").forEach((button) => {
      button.addEventListener("click", () => setFilter("pigLine", button.dataset.pigLine));
    });
    document.querySelectorAll(".type-btn").forEach((button) => {
      button.addEventListener("click", () => setFilter("type", button.dataset.type));
    });

    document.querySelectorAll(".category-btn").forEach((button) => {
      button.addEventListener("click", () => setFilter("category", button.dataset.category));
    });

    if (elements.typeFilterSelect) {
      elements.typeFilterSelect.addEventListener("change", (event) => setFilter("type", event.target.value));
    }

    if (elements.categoryFilterSelect) {
      elements.categoryFilterSelect.addEventListener("change", (event) => setFilter("category", event.target.value));
    }

    if (elements.stageFilterSelect) {
      elements.stageFilterSelect.addEventListener("change", (event) => setFilter("stage", event.target.value));
    }

    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value.slice(0, 80);
      state.visible = PAGE_SIZE;
      filterCatalog();
    });

    elements.searchClear.addEventListener("click", () => {
      state.query = "";
      elements.searchInput.value = "";
      elements.searchInput.focus();
      filterCatalog();
    });

    elements.sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.visible = PAGE_SIZE;
      filterCatalog();
    });

    elements.resetFilters.addEventListener("click", resetFilters);
    elements.loadMore.addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      renderCatalog();
    });

    elements.productsGrid.addEventListener("click", handleCatalogClick);
    elements.modalContent.addEventListener("click", handleCatalogClick);
    elements.modalContent.addEventListener("change", (event) => {
      const select = event.target.closest('[data-product-variant]');
      if (select) { openProductModal(Number(select.value), true); return; }
      const quantity = event.target.closest('[data-modal-quantity]');
      if (quantity) updateModalQuantity(quantity.value);
    });
    elements.modalContent.addEventListener("pointerdown", startProductViewGesture);
    elements.modalContent.addEventListener("pointerup", endProductViewGesture);
    elements.modalContent.addEventListener("pointercancel", () => { productViewPointerStart = null; });
    elements.cartItems.addEventListener("click", handleCartClick);
    elements.cartItems.addEventListener("change", (event) => {
      const input = event.target.closest("[data-quantity]");
      if (input) updateOrderQuantity(Number(input.dataset.quantity), input.value);
    });

    elements.orderButton.addEventListener("click", openCart);
    elements.mobileCart.addEventListener("click", openCart);
    elements.orderClose.addEventListener("click", closeCart);
    elements.drawerOverlay.addEventListener("click", closeCart);
    elements.continueShopping.addEventListener("click", closeCart);
    elements.orderForm.addEventListener("submit", sendOrder);
    elements.modalClose.addEventListener("click", closeProductModal);
    elements.productModal.addEventListener("click", (event) => {
      if (event.target === elements.productModal) closeProductModal();
    });

    elements.menuToggle.addEventListener("click", () => {
      const open = elements.mainNav.classList.toggle("open");
      elements.menuToggle.setAttribute("aria-expanded", String(open));
      elements.menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        const activeDialog = elements.productModal.classList.contains("open")
          ? elements.productModal
          : (elements.cartDrawer.classList.contains("open") ? elements.cartDrawer : null);
        if (!activeDialog) return;

        const focusable = Array.from(activeDialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'))
          .filter((element) => !element.inert && element.getClientRects().length > 0);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      const editingField = event.target?.closest?.('input, select, textarea, [contenteditable="true"]');
      if (!editingField && elements.productModal.classList.contains("open") && activeProductViews.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        showProductView(activeProductViewIndex + (event.key === "ArrowRight" ? 1 : -1));
        return;
      }

      if (event.key !== "Escape") return;
      if (elements.productModal.classList.contains('open')) {
        const layout = elements.modalContent.querySelector('[data-detail-layout]');
        if (layout?.classList.contains('is-photo-expanded')) {
          toggleProductPhoto(false);
          elements.modalContent.querySelector('[data-photo-zoom]')?.focus();
        } else closeProductModal();
      }
      else if (elements.cartDrawer.classList.contains("open")) closeCart();
    });
  }

  function init() {
    cacheElements();
    const openCartOnLoad = new URLSearchParams(window.location.search).get("cart") === "open";
    const openProductOnLoad = Number(new URLSearchParams(window.location.search).get("product"));

    if (!catalog.length) {
      elements.productsCount.textContent = "No fue posible cargar el catálogo";
      elements.emptyState.hidden = false;
      elements.loadMoreWrap.hidden = true;
      return;
    }

    readUrlFilters();
    bindEvents();
    filterCatalog();
    renderCart();
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(order));
    } catch (error) {
      // El catálogo sigue funcionando si el navegador bloquea el almacenamiento.
    }
    window.addEventListener("storage", syncCartFromStorage);
    window.addEventListener("pageshow", syncCartFromStorage);
    if (openCartOnLoad) window.requestAnimationFrame(openCart);
    else if (openProductOnLoad) window.requestAnimationFrame(() => openProductModal(openProductOnLoad));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
