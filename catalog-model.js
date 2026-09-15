(function () {
  "use strict";

  const products = window.AGROCENTRO_PRODUCTS || [];
  const guides = window.AGROCENTRO_FEED_GUIDES || {};
  const images = window.AGROCENTRO_IMAGE_OVERRIDES || {};
  const types = { alimentos: "Alimentos balanceados", medicinas: "Productos veterinarios", herramientas: "Herramientas" };
  const categories = { aves: "Aves", cerdos: "Cerdos", equinos: "Caballos", conejos: "Conejos", perros: "Perros", gatos: "Gatos", otros: "Uso general" };
  const vetCategories = {
    vitaminas: "Vitaminas y minerales", suplementos: "Suplementos y electrolitos",
    antibioticos: "Antibióticos", antiparasitarios: "Antiparasitarios",
    antiinflamatorios: "Antiinflamatorios y analgésicos", respiratorios: "Productos respiratorios",
    antisepticos: "Antisépticos", dermatologicos: "Cuidado de la piel",
    hormonales: "Productos hormonales", "por-confirmar": "Categoría por confirmar"
  };
  function getVetInfo(product) {
    return product?.type === "medicinas" ? (window.AGROCENTRO_VETERINARY || {})[product.id] || null : null;
  }
  function getVetCategory(product) { return getVetInfo(product)?.category || "por-confirmar"; }
  function getAvailableVetCategories() {
    return Object.keys(vetCategories).filter(key => products.some(p => p.type === "medicinas" && getVetCategory(p) === key));
  }
  function getAvailableVetSpecies(category = "all") {
    return [...new Set(products.filter(p => p.type === "medicinas" && (category === "all" || getVetCategory(p) === category))
      .flatMap(p => getVetInfo(p)?.species || []))].sort((a,b) => a.localeCompare(b,"es"));
  }
  const stages = {
    preinicio: "Preinicio", inicio: "Inicio / crianza", desarrollo: "Crecimiento / desarrollo",
    engorde: "Engorde / finalización", produccion: "Producción / postura", gestacion: "Gestación",
    lactancia: "Lactancia", mantenimiento: "Adulto / mantenimiento / trabajo"
  };
  // Solo se agrupan presentaciones de la misma identidad comercial.
  const families = [
    { key: "dogui-cachorros", name: "Dogui Cachorros", ids: [16, 17] },
    { key: "don-gato-adultos", name: "Don Gato Adultos", ids: [18, 19] },
    { key: "gati-mar-tierra", name: "Gati Mar y Tierra", ids: [20, 21] },
    { key: "pet-master-adultos", name: "Pet Master Adultos", ids: [34, 33] },
    { key: "pet-master-cachorros", name: "Pet Master Cachorros", ids: [40, 35] }
  ];
  const familyById = new Map(families.flatMap((family) => family.ids.map((id) => [id, family])));
  // Secuencia de exhibición; no constituye un programa ni una ración recomendada.
  const feedOrder = [4, 2, 1, 38, 39, 11, 10, 3, 24, 25, 37, 26, 27, 28, 31, 32, 36, 29, 30, 8, 6, 7, 5, 23, 9, 13, 16, 17, 40, 35, 12, 14, 15, 34, 33, 18, 19, 20, 21];
  const feedRank = new Map(feedOrder.map((id, index) => [id, index]));
  const pigLines = { estandar: "Línea estándar", premium: "Línea Pig-Nova" };
  function getPigLine(product) {
    return [27,28].includes(product.id) ? "estandar" : ([31,32].includes(product.id) ? "premium" : "");
  }

  function getGuide(product) {
    const guide = product && product.type === "alimentos" ? guides[product.id] : null;
    if (!guide) return null;
    return { ...guide, presentation: (guide.presentation || "").split(/\s*·\s*línea/i)[0] };
  }
  function getImage(product) { return images[product.id] || product.image || "./assets/logo.png"; }
  // Keep the original src: the existing cutout masks identify products by that path.
  // Browsers select the appropriately sized download from srcset instead.
  function getResponsiveAttributes(source, sizes) {
    const image = (window.AGROCENTRO_RESPONSIVE_IMAGES || {})[source];
    if (!image || !image.variants?.length) return "";
    const escapeAttribute = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
    const srcset = image.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
    return `srcset="${escapeAttribute(srcset)}" sizes="${escapeAttribute(sizes)}" width="${image.width}" height="${image.height}"`;
  }
  function setResponsiveSource(element, source, sizes) {
    const image = (window.AGROCENTRO_RESPONSIVE_IMAGES || {})[source];
    if (image?.variants?.length) {
      element.setAttribute("sizes", sizes);
      element.setAttribute("srcset", image.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "));
      element.setAttribute("width", image.width);
      element.setAttribute("height", image.height);
    } else {
      element.removeAttribute("srcset");
      element.removeAttribute("sizes");
      element.removeAttribute("width");
      element.removeAttribute("height");
    }
    element.src = source;
  }
  function getFallbackImage(product) {
    return ({
      33: "./assets/petmaster-catalog-v10.webp",
      35: "./assets/petmaster-cachorro-1lb-catalog-v3.webp",
      38: "./assets/posturina-fase1-original-v31.png",
      39: "./assets/posturina-hp-original-v31.png"
    })[product.id] || "";
  }
  function getName(product) { return getVetInfo(product)?.name || familyById.get(product.id)?.name || product.name; }
  function getOrderName(product) {
    const presentation = getGuide(product)?.presentation;
    return familyById.has(product.id) && presentation ? `${getName(product)} — ${presentation}` : getName(product);
  }
  function getVariants(product) {
    const ids = familyById.get(product.id)?.ids || [product.id];
    return ids.map((id) => products.find((entry) => entry.id === id)).filter(Boolean);
  }
  function getAvailableCategories() {
    return Object.keys(categories).filter((category) => products.some((product) => product.type === "alimentos" && product.category === category));
  }
  function getAvailableStages(category, pigLine = "all") {
    return Object.keys(stages).filter((stage) => products.some((product) =>
      product.type === "alimentos" && (category === "all" || product.category === category) &&
      (pigLine === "all" || getPigLine(product) === pigLine) && getGuide(product)?.stages?.includes(stage)
    ));
  }
  function normalizeFilters(state) {
    if (!["all", ...Object.keys(types)].includes(state.type)) state.type = "all";
    if (state.type !== "medicinas") { state.vetCategory = "all"; state.vetSpecies = "all"; }
    else {
      if (!["all", ...getAvailableVetCategories()].includes(state.vetCategory)) state.vetCategory = "all";
      if (!["all", ...getAvailableVetSpecies(state.vetCategory)].includes(state.vetSpecies)) state.vetSpecies = "all";
    }
    if (state.type !== "alimentos" || state.category !== "cerdos" || !pigLines[state.pigLine]) state.pigLine = "all";
    if (state.type !== "alimentos") {
      state.category = "all";
      state.stage = "all";
    } else {
      if (!["all", ...getAvailableCategories()].includes(state.category)) state.category = "all";
      if (!["all", ...getAvailableStages(state.category, state.pigLine)].includes(state.stage)) state.stage = "all";
    }
    return state;
  }
  function compareProducts(a, b) {
    const typeOrder = Object.keys(types);
    const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    if (typeDiff) return typeDiff;
    if (a.type === "alimentos") {
      const difference = (feedRank.get(a.id) ?? 999) - (feedRank.get(b.id) ?? 999);
      if (difference) return difference;
    }
    if (a.type === "medicinas") {
      const order = Object.keys(vetCategories);
      const difference = order.indexOf(getVetCategory(a)) - order.indexOf(getVetCategory(b));
      if (difference) return difference;
    }
    return getName(a).localeCompare(getName(b), "es", { numeric: true });
  }
  function groupProducts(entries, prefer = () => false) {
    const positions = new Map();
    const grouped = [];
    entries.forEach((product) => {
      const key = familyById.get(product.id)?.key || product.id;
      if (positions.has(key)) {
        const index = positions.get(key);
        if (prefer(product) && !prefer(grouped[index])) grouped[index] = product;
      } else {
        positions.set(key, grouped.length);
        grouped.push(product);
      }
    });
    return grouped;
  }
  function sectionName(product) {
    const type = types[product.type] || "Productos";
    if (product.type === "medicinas") return vetCategories[getVetCategory(product)];
    if (product.type === "alimentos" && product.category === "cerdos") {
      const group = pigLines[getPigLine(product)] || ([24,25,37,26].includes(product.id) ? "Lechones · NeoPigg" : (product.id === 36 ? "Finalización · Pur-A-Lean" : "Cerdas reproductoras"));
      return `Cerdos · ${group}`;
    }
    if (product.type === "alimentos" && product.category === "aves") {
      const group = [4,2,1].includes(product.id) ? "Pollos de engorde" : ([38,39,11].includes(product.id) ? "Postura" : "Aves de patio y gallos");
      return `Aves · ${group}`;
    }
    return product.type === "alimentos" ? `${type} · ${categories[product.category] || "Otros"}` : type;
  }
  window.AGROCENTRO_CATALOG = {
    vetCategories, getVetInfo, getVetCategory, getAvailableVetCategories, getAvailableVetSpecies,
    products, types, categories, stages, pigLines, getPigLine, getGuide, getImage, getResponsiveAttributes, setResponsiveSource, getFallbackImage, getName, getOrderName, getVariants,
    getAvailableCategories, getAvailableStages, normalizeFilters, compareProducts, groupProducts, sectionName
  };
})();
