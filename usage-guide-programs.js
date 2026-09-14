/*
 * Calculadoras de la página "Guía de uso"; se insertan en las respuestas con <div data-calc="…">.
 * Las etapas, edades y productos salen de las fichas (feed-guides) y del catálogo FY26.
 * Cerdos: consumos por fase y pesos esperados del catálogo Purina/Cargill (fotos del usuario, sep. 2026).
 * Gallinas: consumos diarios por línea según las guías oficiales (Hy-Line, Lohmann, ISA, Dekalb); editable.
 */
(function () {
  "use strict";

  const MODEL = window.AGROCENTRO_CATALOG;
  const slots = [...document.querySelectorAll("#guide-questions [data-calc]")];
  if (!MODEL || !slots.length) return;

  const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const product = id => MODEL.products.find(entry => entry.id === id);
  const guide = id => MODEL.getGuide(product(id)) || {};
  const name = id => MODEL.getName(product(id));
  const link = (id, label) => `<a href="products.html?product=${id}">${escape(label || name(id))}</a>`;
  const fmt = (value, digits = 1) => Number(value).toLocaleString("es-NI", { maximumFractionDigits: digits });
  const SACK_LB = 100;
  const DAY = 86400000;

  // ---------- Programas de alimentación (etapas oficiales) ----------
  const broiler = [
    { id: 4, from: 1, to: 7, lb: 0.4 },
    { id: 2, from: 8, to: 21, lb: 2.2 },
    { id: 1, from: 22, to: 42, lb: 7.4, open: true }
  ];
  // Consumo por fase (lb por cerdo) y edades según el catálogo Purina/Cargill, "Resultados esperados".
  // NeoPigg 1 incluye el creep feeding desde el día 5 (0.3–0.4 lb por lechón, a voluntad).
  const neopigg = {
    optimo: [{ id: 24, from: 5, to: 27, lb: 3.0, creep: true }, { id: 25, from: 28, to: 34, lb: 6.0 }, { id: 37, from: 35, to: 43, lb: 12.0 }, { id: 26, from: 44, to: 70, lb: 64.0 }],
    plus: [{ id: 24, from: 5, to: 30, lb: 5.0, creep: true }, { id: 25, from: 31, to: 39, lb: 10.0 }, { id: 37, from: 40, to: 48, lb: 15.0 }, { id: 26, from: 49, to: 70, lb: 55.0 }]
  };
  const pigLines = {
    estandar: { label: "Estándar: Desarrollina → Jamonina", weight: 224, stages: [{ id: 27, from: 71, to: 119, lb: 228 }, { id: 28, from: 120, to: 154, lb: 214 }] },
    estandarLean: { label: "Estándar + Pur-A-Lean: Desarrollina → Jamonina → Pur-A-Lean", weight: 232, stages: [{ id: 27, from: 71, to: 98, lb: 120 }, { id: 28, from: 99, to: 126, lb: 150 }, { id: 36, from: 127, to: 154, lb: 172 }] },
    premium: { label: "Premium: Pig-Nova 5 → Pig-Nova 6 → Pur-A-Lean", weight: 245, stages: [{ id: 31, from: 71, to: 91, lb: 90 }, { id: 32, from: 92, to: 119, lb: 130 }, { id: 36, from: 120, to: 154, lb: 222 }] }
  };
  // Tamaño del saco según la presentación de la ficha (lb).
  const sackSize = { 24: 44, 25: 55.1, 37: 55.1 };
  const sacksFor = (id, lb) => lb / (sackSize[id] || SACK_LB);

  // Pedido: mismo almacenamiento que la tienda (store.js lee id y cantidad y completa el resto).
  const CART_KEY = "agrocentro_cart";
  function addSacksToOrder(items) {
    let cart = [];
    try { const stored = JSON.parse(localStorage.getItem(CART_KEY)); if (Array.isArray(stored)) cart = stored; } catch (error) { cart = []; }
    items.forEach(({ id, qty }) => {
      const existing = cart.find(entry => Number(entry.id) === id);
      if (existing) existing.qty = Math.min(999, Number(existing.qty || 0) + qty);
      else cart.push({ id, qty: Math.min(999, qty) });
    });
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (error) { /* sin almacenamiento: la tienda abrirá vacía */ }
    location.href = "products.html?cart=open";
  }
  // Sacos completos por producto a partir de las libras de cada etapa.
  function sackPlan(stages, multiplier) {
    const plan = new Map();
    stages.forEach(s => {
      const lb = multiplier * s.lb;
      const qty = Math.ceil(sacksFor(s.id, lb) - 1e-9);
      if (qty > 0) plan.set(s.id, (plan.get(s.id) || 0) + qty);
    });
    return [...plan.entries()].map(([id, qty]) => ({ id, qty }));
  }
  function orderBlock(key, plan) {
    const total = plan.reduce((sum, item) => sum + item.qty, 0);
    return `<div class="guide-ration-actions"><button type="button" data-order="${key}">Agregar estos sacos a mi pedido</button><span>${total} ${total === 1 ? "saco" : "sacos"} en total: ${plan.map(item => `${item.qty} ${escape(name(item.id))}`).join(", ")}. Redondeado a sacos completos.</span></div>`;
  }
  function bindOrder(out, getPlan) {
    out.querySelector("[data-order]")?.addEventListener("click", () => addSacksToOrder(getPlan()));
  }

  function stageRange(s) { return s.open ? `Día ${s.from} → peso de mercado` : `Días ${s.from}–${s.to}`; }
  function stageDays(s) { return s.to - s.from + 1; }

  // ---------- Calculadoras ----------
  function field(id, label, attrs) { return `<label for="${id}">${escape(label)}<input id="${id}" ${attrs}></label>`; }
  function select(id, label, options) { return `<label for="${id}">${escape(label)}<select id="${id}">${options.map(([v, l]) => `<option value="${v}">${escape(l)}</option>`).join("")}</select></label>`; }
  const dateInput = (id, label) => field(id, label, 'type="date"');
  const addDays = (date, days) => new Date(date.getTime() + days * DAY);
  const fmtDate = date => date.toLocaleDateString("es-NI", { day: "numeric", month: "short", year: "numeric" });
  const parseDate = value => { const d = value ? new Date(`${value}T12:00:00`) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
  const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const ageDays = birth => Math.floor((today() - birth) / DAY) + 1;

  function scheduleTable(stages, birth) {
    const age = ageDays(birth);
    return `<div class="guide-table-wrap" role="region" aria-label="Calendario de cambios" tabindex="0"><table><caption>Calendario de cambios de alimento</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Desde</th><th scope="col">Hasta</th></tr></thead><tbody>${stages.map(s => {
      const current = age >= s.from && (s.open || age <= s.to);
      return `<tr${current ? ' class="guide-total"' : ""}><th scope="row">${escape(name(s.id))}${current ? " · hoy" : ""}</th><td>${fmtDate(addDays(birth, s.from - 1))}</td><td>${s.open ? "Peso de mercado" : fmtDate(addDays(birth, s.to - 1))}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  const calculators = {
    broiler: {
      title: "Calculá el alimento y las fechas de tu lote de pollos",
      html: `<div class="guide-ration-fields">${field("prog-broiler-count", "Cantidad de pollos", 'type="number" min="1" max="100000" step="1" value="100" inputmode="numeric"')}${dateInput("prog-broiler-date", "Fecha de nacimiento (opcional)")}</div><div class="guide-ration-result" id="prog-broiler-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Base del catálogo: 10 lb por pollo hasta 42 días (0.4 + 2.2 + 7.4 lb por etapa) y sacos de 100 lb. Es una base para planificar, no para limitar el alimento.</p>`,
      bind() {
        const count = document.getElementById("prog-broiler-count");
        const date = document.getElementById("prog-broiler-date");
        const out = document.getElementById("prog-broiler-result");
        const run = () => {
          if (!count.checkValidity() || !count.value) { out.textContent = "Ingresá una cantidad entre 1 y 100,000 pollos."; return; }
          const birds = Number(count.value);
          const rows = broiler.map(s => `<tr><th scope="row">${escape(name(s.id))}</th><td>${escape(stageRange(s))}</td><td>${fmt(birds * s.lb)} lb</td><td>${fmt(birds * s.lb / SACK_LB)}</td></tr>`).join("");
          const total = birds * 10;
          let html = `<div class="guide-table-wrap" role="region" aria-label="Alimento por etapa" tabindex="0"><table><caption>${birds.toLocaleString("es-NI")} pollos · alimento por etapa</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Período</th><th scope="col">Libras</th><th scope="col">Sacos</th></tr></thead><tbody>${rows}<tr class="guide-total"><th scope="row" colspan="2">Total del lote</th><td>${fmt(total)} lb</td><td>${fmt(total / SACK_LB)}</td></tr></tbody></table></div>`;
          const birth = parseDate(date.value);
          if (birth) html += scheduleTable(broiler, birth);
          out.innerHTML = html + orderBlock("broiler", sackPlan(broiler, birds));
          bindOrder(out, () => sackPlan(broiler, Number(count.value)));
        };
        count.addEventListener("input", run); date.addEventListener("input", run); run();
      }
    },
    layers: {
      title: "Calculá cuántos sacos necesitás para tus gallinas",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-layer-count", "Cantidad de gallinas", 'type="number" min="1" max="100000" step="1" value="50" inputmode="numeric"')}${select("prog-layer-line", "Línea", [[112, "Hy-Line Brown (112 g/día)"], [115, "Lohmann Brown-Classic (115 g/día)"], [112, "ISA Brown (112 g/día)"], [110, "Dekalb White (110 g/día)"], [110, "Lohmann LSL-Classic (110 g/día)"], [0, "Otra: escribir el consumo"]])}${field("prog-layer-grams", "Consumo por gallina al día (g)", 'type="number" min="50" max="250" step="1" value="112" inputmode="numeric"')}</div><div class="guide-ration-fields">${field("prog-layer-days", "Días a cubrir", 'type="number" min="1" max="365" step="1" value="30" inputmode="numeric"')}${select("prog-layer-product", "Alimento", [[38, `${name(38)} (gallinas de patio)`], [39, `${name(39)} (gallinas de granja)`], [11, `${name(11)} (gallinas criollas)`]])}</div><div class="guide-ration-result" id="prog-layer-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Consumo diario promedio en postura: Hy-Line Brown 109–117 g, Lohmann Brown 110–120 g, ISA Brown 112 g, Dekalb White 110 g, LSL 105–115 g. Sacos de 100 lb. El consumo real sube con el frío y baja con el calor.</p>`,
      bind() {
        const ids = ["prog-layer-count", "prog-layer-grams", "prog-layer-days"].map(id => document.getElementById(id));
        const out = document.getElementById("prog-layer-result");
        const run = () => {
          if (ids.some(el => !el.checkValidity() || !el.value)) { out.textContent = "Revisá los valores: gallinas (1–100,000), consumo (50–250 g) y días (1–365)."; return; }
          const [hens, grams, days] = ids.map(el => Number(el.value));
          const lbPerDay = hens * grams / 453.592;
          const total = lbPerDay * days;
          const sackDays = SACK_LB / lbPerDay;
          const plan = () => [{ id: Number(productSelect.value), qty: Math.max(1, Math.ceil(total / SACK_LB - 1e-9)) }];
          out.innerHTML = `<strong>${hens.toLocaleString("es-NI")} gallinas × ${days} días:</strong> ${fmt(total)} lb · ${fmt(total / SACK_LB)} sacos de 100 lb<br><span>Consumo del lote: ${fmt(lbPerDay)} lb por día · un saco de 100 lb dura aproximadamente ${fmt(sackDays, sackDays < 10 ? 1 : 0)} días.</span>${orderBlock("layers", plan())}`;
          bindOrder(out, plan);
        };
        const productSelect = document.getElementById("prog-layer-product");
        const lineSelect = document.getElementById("prog-layer-line");
        lineSelect.addEventListener("change", () => { if (Number(lineSelect.value) > 0) { ids[1].value = lineSelect.value; run(); } else { ids[1].focus(); } });
        [...ids, productSelect].forEach(el => el.addEventListener("input", run)); run();
      }
    },
    pigs: {
      title: "Calculá los sacos y las fechas de tu lote de cerdos",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-pig-count", "Cantidad de cerdos", 'type="number" min="1" max="10000" step="1" value="10" inputmode="numeric"')}${select("prog-pig-program", "Programa NeoPigg", [["optimo", "Óptimo"], ["plus", "Plus"]])}${select("prog-pig-line", "Línea del día 71 al 154", Object.entries(pigLines).map(([key, l]) => [key, l.label]))}</div><div class="guide-ration-fields guide-ration-fields--single">${dateInput("prog-pig-date", "Fecha de nacimiento del lote (opcional)")}</div><div class="guide-ration-result" id="prog-pig-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Consumos por fase y edades del catálogo Purina/Cargill (resultados esperados hasta los 154 días). NeoPigg 1 incluye el creep feeding desde el día 5: 0.3–0.4 lb por lechón, a voluntad y en pocas cantidades varias veces al día. El consumo real varía con la genética, la sanidad y el manejo; sumá aparte el desperdicio. Sacos según la presentación de cada alimento: NeoPigg 1, 44 lb; NeoPigg 2 y 3, 55.1 lb; los demás, 100 lb.</p>`,
      bind() {
        const count = document.getElementById("prog-pig-count");
        const program = document.getElementById("prog-pig-program");
        const line = document.getElementById("prog-pig-line");
        const date = document.getElementById("prog-pig-date");
        const out = document.getElementById("prog-pig-result");
        const run = () => {
          if (!count.checkValidity() || !count.value) { out.textContent = "Ingresá entre 1 y 10,000 cerdos."; return; }
          const pigs = Number(count.value);
          const chosen = pigLines[line.value];
          const stages = [...neopigg[program.value], ...chosen.stages];
          let totalLb = 0;
          const rows = stages.map(s => {
            const lb = pigs * s.lb;
            totalLb += lb;
            return `<tr><th scope="row">${escape(name(s.id))}</th><td>${escape(stageRange(s))}<span>${stageDays(s)} días</span></td><td>${fmt(s.lb)} lb</td><td>${fmt(lb, 0)} lb<span>${fmt(sacksFor(s.id, lb))} sacos de ${sackSize[s.id] || SACK_LB} lb</span></td></tr>`;
          }).join("");
          let html = `<div class="guide-table-wrap" role="region" aria-label="Alimento por etapa" tabindex="0"><table><caption>${pigs.toLocaleString("es-NI")} cerdos · NeoPigg ${program.value === "optimo" ? "Óptimo" : "Plus"} · ${escape(chosen.label.split(":")[0])}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Edad</th><th scope="col">Por cerdo</th><th scope="col">Lote</th></tr></thead><tbody>${rows}<tr class="guide-total"><th scope="row" colspan="2">Total hasta los 154 días · peso esperado ${chosen.weight} lb por cerdo</th><td>${fmt(totalLb / pigs, 0)} lb</td><td>${fmt(totalLb, 0)} lb</td></tr></tbody></table></div>`;
          const birth = parseDate(date.value);
          if (birth) html += scheduleTable(stages, birth);
          out.innerHTML = html + orderBlock("pigs", sackPlan(stages, pigs));
          bindOrder(out, () => sackPlan(stages, Number(count.value)));
        };
        [count, program, line, date].forEach(el => el.addEventListener("input", run)); run();
      }
    },
    horse: {
      title: "Calculá la Forrajina de tu caballo",
      html: `<div class="guide-ration-fields">${field("prog-horse-weight", "Peso del caballo (kg)", 'type="number" min="100" max="1000" step="10" value="400" inputmode="numeric"')}</div><div class="guide-ration-result" id="prog-horse-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Forrajina: 0.5–1.5 kg por cada 100 kg de peso vivo, repartidos en 2 o más raciones al día. Para Omalina y Cavalleria Forte usá la tabla de la etiqueta.</p>`,
      bind() {
        const weight = document.getElementById("prog-horse-weight");
        const out = document.getElementById("prog-horse-result");
        const run = () => {
          if (!weight.checkValidity() || !weight.value) { out.textContent = "Ingresá un peso entre 100 y 1,000 kg."; return; }
          const kg = Number(weight.value);
          const min = kg / 100 * 0.5, max = kg / 100 * 1.5;
          out.innerHTML = `<strong>Caballo de ${fmt(kg, 0)} kg:</strong> entre ${fmt(min)} y ${fmt(max)} kg de Forrajina al día (${fmt(min * 2.2046)}–${fmt(max * 2.2046)} lb), repartidos en 2 o más raciones.<br><span>Un saco de 100 lb (45.4 kg) rinde entre ${fmt(45.4 / max, 0)} y ${fmt(45.4 / min, 0)} días.</span>`;
        };
        weight.addEventListener("input", run); run();
      }
    }
  };

  slots.forEach(slot => {
    const c = calculators[slot.dataset.calc];
    if (!c) { slot.remove(); return; }
    slot.className = "guide-ration-tool";
    slot.innerHTML = `<h3>${escape(c.title)}</h3>${c.html}`;
    c.bind();
  });
})();
