(function () {
  "use strict";

  const CART_KEY = "agrocentro_cart";
  const WHATSAPP_NUMBER = "50582403490";
  const MODEL = window.AGROCENTRO_CATALOG;

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function renderHomeProducts() {
    const container = document.getElementById("home-featured-products");
    if (!container || !MODEL) return;
    container.innerHTML = [2, 1, 24, 28].map((id) => {
      const product = MODEL.products.find((entry) => entry.id === id);
      if (!product) return "";
      const guide = MODEL.getGuide(product);
      const name = escapeHtml(MODEL.getName(product));
      const href = `products.html?product=${id}`;
      return `<article class="home-product">
        <a class="home-product-image is-cutout-catalog" draggable="false" href="${href}"><img draggable="false" src="${escapeHtml(MODEL.getImage(product))}" ${MODEL.getResponsiveAttributes(MODEL.getImage(product), "(max-width: 760px) 29vw, (max-width: 1100px) 40vw, 280px")} alt="${name}" loading="lazy" decoding="async"></a>
        <div class="home-product-body">
          <span class="home-product-meta">${escapeHtml(MODEL.categories[product.category])} · ${escapeHtml(guide?.stage || "")}</span>
          <h3><a href="${href}">${name}</a></h3>
          <p>${escapeHtml(guide?.use || product.description)}</p>
          ${guide ? `<dl><div><dt>Edad / período</dt><dd>${escapeHtml(guide.period)}</dd></div><div><dt>Presentación</dt><dd>${escapeHtml(guide.presentation)}</dd></div></dl>` : ""}
          <div class="home-product-actions"><button type="button" data-home-add="${id}">Agregar</button><a href="${href}">Ver ficha</a></div>
        </div>
      </article>`;
    }).join("");
  }

  function getCartCount() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(stored)) return 0;
      return stored.reduce((total, item) => {
        const id = Number.parseInt(item && item.id, 10);
        if (MODEL && !MODEL.products.some((product) => product.id === id)) return total;
        const qty = Number.parseInt(item && item.qty, 10);
        if (!Number.isFinite(id) || id < 1) return total;
        const normalizedQty = Number.isFinite(qty) ? Math.min(999, Math.max(1, qty)) : 1;
        return total + normalizedQty;
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  function updateCartCount() {
    const count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = String(count);
      element.setAttribute("aria-label", `${count} productos en el pedido`);
    });
  }

  function showHomeToast(message) {
    const toast = document.getElementById("home-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showHomeToast.timer);
    showHomeToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
  }

  function setupHomeFinder() {
    const form = document.getElementById("home-finder");
    const animal = document.getElementById("home-animal");
    const stage = document.getElementById("home-stage");
    if (!form || !animal || !stage) return;

    if (MODEL) {
      animal.innerHTML = '<option value="all">Todos los animales</option>' + MODEL.getAvailableCategories().map((value) => `<option value="${value}">${escapeHtml(MODEL.categories[value])}</option>`).join("");
      function updateStages() {
        const previous = stage.value;
        const available = MODEL.getAvailableStages(animal.value);
        stage.innerHTML = '<option value="all">Todas las etapas</option>' + available.map((value) => `<option value="${value}">${escapeHtml(MODEL.stages[value])}</option>`).join("");
        stage.value = available.includes(previous) ? previous : "all";
      }
      updateStages();
      animal.addEventListener("change", updateStages);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const params = new URLSearchParams({ type: "alimentos" });
      if (animal.value !== "all") params.set("category", animal.value);
      if (stage.value !== "all") params.set("stage", stage.value);
      window.location.href = `products.html?${params.toString()}`;
    });
  }

  function setupHomeProductButtons() {
    document.querySelectorAll("[data-home-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number.parseInt(button.dataset.homeAdd, 10);
        if (!Number.isFinite(id)) return;

        let order = [];
        try {
          const stored = JSON.parse(localStorage.getItem(CART_KEY));
          if (Array.isArray(stored)) order = stored;
        } catch (error) {
          order = [];
        }

        const existing = order.find((item) => Number(item && item.id) === id);
        if (existing) existing.qty = Math.min(999, Math.max(1, Number(existing.qty) || 1) + 1);
        else order.push({ id, qty: 1 });

        try {
          localStorage.setItem(CART_KEY, JSON.stringify(order));
          updateCartCount();
          const original = button.textContent;
          button.textContent = "Agregado ✓";
          button.classList.add("added");
          showHomeToast("Producto agregado a tu pedido");
          window.setTimeout(() => {
            button.textContent = original;
            button.classList.remove("added");
          }, 1300);
        } catch (error) {
          window.location.href = "products.html?cart=open";
        }
      });
    });
  }

  function setupMenu() {
    const toggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
    }

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const feedback = document.getElementById("contact-form-message");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const phone = String(data.get("phone") || "").trim();
      const topic = String(data.get("topic") || "Consulta de producto").trim();
      const message = String(data.get("message") || "").trim();
      const phoneDigits = phone.replace(/\D/g, "");

      if (!name || phoneDigits.length < 7 || phoneDigits.length > 11 || !message) {
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = "Completá tu nombre, un teléfono válido y el mensaje.";
        }
        return;
      }

      if (feedback) feedback.hidden = true;

      const whatsappMessage = [
        "Hola, AgroCentro Nica.",
        "",
        `Nombre: ${name}`,
        `Teléfono: ${phone}`,
        `Consulta: ${topic}`,
        "",
        message
      ].join("\n");

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener,noreferrer");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupMenu();
    updateCartCount();
    setupContactForm();
    setupHomeFinder();
    renderHomeProducts();
    setupHomeProductButtons();
  });

  window.addEventListener("pageshow", updateCartCount);
  window.addEventListener("storage", updateCartCount);
})();
