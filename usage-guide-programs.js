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
  // ---------- Comparador de líneas de postura ----------
  // Metas por gallina en postura: % de postura, huevos acumulados por gallina alojada, peso del huevo (g) y consumo (g/día).
  const LAYER_AGES = [20, 24, 26, 30, 40, 50, 60, 70, 80, 90];
  const layerLines = {
    hylineBrown: { label: "Hy-Line Brown", shell: "marrón", lay: [[52,55],[92,97],[94,98],[93,98],[92,97],[90,96],[87,93],[84,90],[80,86],[75,82]], eggs: [6,[30,31],[43,45],[69,72],[133,140],[196,206],[256,271],[314,333],[368,391],[419,446]], egg: [[48,50],[53,56],[55,59],[58,62],[60,64],[60,64],[61,65],[61,65],[62,65],[62,66]], feed: [[91,98],[107,114],[109,117],[110,118],[110,118],[110,118],[110,118],[110,118],[110,118],[110,118]] },
    lohmannBrown: { label: "Lohmann Brown-Classic", shell: "marrón", lay: [36,88,93,95,95,92,88,84,79,73], eggs: [3,24,37,63,129,193,254,313,367,416], egg: [46,55,58,62,65,66,66,67,68,68], feed: [null,null,null,null,null,null,null,null,null,null] },
    isaBrown: { label: "ISA Brown", shell: "marrón", lay: [31,90,95,96,95,93,89,86,82,77], eggs: [3,23,36,63,129,192,254,314,371,426], egg: [50,58,60,62,64,64,64,64,65,65], feed: [102,114,117,119,119,119,118,118,118,118] },
    dekalbWhite: { label: "Dekalb White", shell: "blanco", lay: [20,95,96,98,97,96,96,95,94,90], eggs: [2,23,37,64,131,198,263,328,391,452], egg: [47,55,58,60,62,63,64,64,64,64], feed: [97,109,112,112,112,112,112,112,112,112] },
    lohmannLsl: { label: "Lohmann LSL-Classic", shell: "blanco", lay: [37,88,93,95,96,94,91,87,82,75], eggs: [3,24,37,63,130,195,258,318,374,425], egg: [45,54,57,60,63,64,65,66,66,66], feed: [null,null,null,null,null,null,null,null,null,null] },
    hylineW36: { label: "Hy-Line W-36", shell: "blanco", lay: [[35,50],[91,94],[94,96],[95,97],[93,94],[89,91],[86,88],[82,84],[77,80],[72,75]], eggs: [[4,5],[26,29],[39,42],[65,69],[130,135],[193,199],[252,260],[309,318],[362,373],[411,424]], egg: [48,55,57,59,61,62,62,63,63,63], feed: [[73,80],[89,96],[94,101],[97,103],[98,105],[99,105],[99,105],[99,105],[99,105],[99,105]] },
    hylineW80: { label: "Hy-Line W-80", shell: "blanco", lay: [[42,44],[90,94],[92,96],[94,98],[93,97],[91,95],[90,93],[88,92],[85,89],[82,85]], eggs: [[3,4],[26,28],[39,41],[65,68],[129,134],[191,199],[252,262],[311,323],[367,382],[421,438]], egg: [[47,49],[54,55],[56,58],[59,61],[62,64],[63,65],[63,65],[64,66],[64,66],[64,66]], feed: [[83,86],[94,97],[97,101],[101,105],[107,111],[107,111],[107,111],[107,111],[107,111],[107,111]] }
  };
  const layerMetrics = {
    lay: { label: "Postura", unit: " %" },
    eggs: { label: "Huevos por gallina (acumulados)", unit: "" },
    egg: { label: "Peso del huevo", unit: " g" },
    feed: { label: "Consumo por gallina al día", unit: " g" }
  };
  const layerValue = (value, unit) => value == null ? "Sin dato por edad"
    : Array.isArray(value) ? (value[0] === value[1] ? `${value[0]}${unit}` : `${value[0]}–${value[1]}${unit}`) : `${value}${unit}`;
  const layerMid = value => value == null ? null : Array.isArray(value) ? (value[0] + value[1]) / 2 : value;
  function layerSummary(metric, a, b) {
    const unit = layerMetrics[metric].unit;
    const at = (line, age) => line[metric][LAYER_AGES.indexOf(age)];
    if (a === b) return `${a.label}: huevo ${a.shell}. Elegí una línea distinta en «Línea 2» para compararlas.`;
    const shells = `${a.label}: huevo ${a.shell}. ${b.label}: huevo ${b.shell}.`;
    if (metric === "eggs") {
      const gap = Math.round(Math.abs(layerMid(at(a, 90)) - layerMid(at(b, 90))));
      return `${shells} A las 90 semanas, ${a.label} lleva ${layerValue(at(a, 90), "")} huevos por gallina y ${b.label}, ${layerValue(at(b, 90), "")}${gap ? `: unos ${gap} huevos de diferencia` : ""}.`;
    }
    if (metric === "lay") {
      const peak = line => LAYER_AGES.reduce((best, age, i) => layerMid(line.lay[i]) > layerMid(line.lay[best]) ? i : best, 0);
      const [pa, pb] = [peak(a), peak(b)];
      return `${shells} Pico de postura: ${a.label} ${layerValue(a.lay[pa], unit)} a las ${LAYER_AGES[pa]} semanas; ${b.label} ${layerValue(b.lay[pb], unit)} a las ${LAYER_AGES[pb]} semanas. A las 90 semanas: ${layerValue(at(a, 90), unit)} y ${layerValue(at(b, 90), unit)}.`;
    }
    if (metric === "egg") return `${shells} A las 50 semanas el huevo pesa ${layerValue(at(a, 50), unit)} en ${a.label} y ${layerValue(at(b, 50), unit)} en ${b.label}.`;
    const eats = line => at(line, 50) == null ? `${line.label} no tiene dato de consumo por edad` : `${line.label} come ${layerValue(at(line, 50), unit)} al día`;
    return `${shells} En plena postura (50 semanas), ${eats(a)} y ${eats(b)}. El consumo real sube con el frío y baja con el calor.`;
  }

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
      html: `<div class="guide-ration-fields">${field("prog-broiler-count", "Cantidad de pollos", 'type="number" min="1" max="100000" step="1" value="100" inputmode="numeric"')}${dateInput("prog-broiler-date", "Fecha de nacimiento (opcional)")}</div><div class="guide-ration-result" id="prog-broiler-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Base para planificar: 10 lb por pollo hasta 42 días (0.4 + 2.2 + 7.4 lb por etapa) y sacos de 100 lb. No es un límite de alimento.</p>`,
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
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-layer-count", "Cantidad de gallinas", 'type="number" min="1" max="100000" step="1" value="50" inputmode="numeric"')}${select("prog-layer-line", "Línea", [[112, "Hy-Line Brown (112 g/día)"], [0, "Lohmann Brown-Classic: escribir consumo"], [116, "ISA Brown (116 g/día)"], [110, "Dekalb White (110 g/día)"], [0, "Lohmann LSL-Classic: escribir consumo"], [0, "Otra: escribir el consumo"]])}${field("prog-layer-grams", "Consumo por gallina al día (g)", 'type="number" min="50" max="250" step="1" value="112" inputmode="numeric"')}</div><div class="guide-ration-fields">${field("prog-layer-days", "Días a cubrir", 'type="number" min="1" max="365" step="1" value="30" inputmode="numeric"')}${select("prog-layer-product", "Alimento", [[38, `${name(38)} (gallinas de patio)`], [39, `${name(39)} (gallinas de granja)`], [11, `${name(11)} (gallinas criollas)`]])}</div><div class="guide-ration-result" id="prog-layer-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Consumo diario promedio en postura: Hy-Line Brown 109–117 g, ISA Brown 114–119 g, Dekalb White 109–112 g. Para Lohmann u otra línea, escribí el consumo de tu lote. Sacos de 100 lb. El consumo real sube con el frío y baja con el calor.</p>`,
      bind() {
        const ids = ["prog-layer-count", "prog-layer-grams", "prog-layer-days"].map(id => document.getElementById(id));
        const out = document.getElementById("prog-layer-result");
        const run = () => {
          if (!ids[1].value) { out.textContent = "Escribí el consumo por gallina al día (g) para calcular los sacos."; return; }
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
        lineSelect.addEventListener("change", () => { ids[1].value = Number(lineSelect.value) > 0 ? lineSelect.value : ""; run(); if (!ids[1].value) ids[1].focus(); });
        [...ids, productSelect].forEach(el => el.addEventListener("input", run)); run();
      }
    },
    pigs: {
      title: "Calculá los sacos y las fechas de tu lote de cerdos",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-pig-count", "Cantidad de cerdos", 'type="number" min="1" max="10000" step="1" value="10" inputmode="numeric"')}${select("prog-pig-program", "Programa NeoPigg", [["optimo", "Óptimo"], ["plus", "Plus"]])}${select("prog-pig-line", "Línea del día 71 al 154", Object.entries(pigLines).map(([key, l]) => [key, l.label]))}</div><div class="guide-ration-fields guide-ration-fields--single">${dateInput("prog-pig-date", "Fecha de nacimiento del lote (opcional)")}</div><div class="guide-ration-result" id="prog-pig-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Consumos por fase hasta los 154 días. NeoPigg 1 se ofrece desde el día 5, mientras el lechón sigue con la cerda, en pocas cantidades varias veces al día; esas 0.3–0.4 lb ya están incluidas. El consumo real varía con la genética, la sanidad y el manejo; sumá aparte el desperdicio. Sacos según la presentación de cada alimento: NeoPigg 1, 44 lb; NeoPigg 2 y 3, 55.1 lb; los demás, 100 lb.</p>`,
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
    layerCompare: {
      title: "Compará dos líneas de gallinas",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${select("prog-curve-a", "Línea 1", Object.entries(layerLines).map(([key, line]) => [key, line.label]))}${select("prog-curve-b", "Línea 2", Object.entries(layerLines).map(([key, line]) => [key, line.label]))}${select("prog-curve-metric", "Comparar", Object.entries(layerMetrics).map(([key, metric]) => [key, metric.label]))}</div><div class="guide-ration-result" id="prog-curve-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Metas por gallina con buen manejo, alimento de postura, agua a libre acceso y programa de luz. Los huevos acumulados cuentan desde que el lote entra a postura.</p>`,
      bind() {
        const [lineA, lineB, metric] = ["prog-curve-a", "prog-curve-b", "prog-curve-metric"].map(id => document.getElementById(id));
        const out = document.getElementById("prog-curve-result");
        const keys = Object.keys(layerLines);
        lineB.value = keys.includes("dekalbWhite") ? "dekalbWhite" : keys[keys.length - 1];
        // En cada opción solo aparecen las líneas que tienen ese dato por edad.
        let listedFor = "";
        const listLines = () => {
          if (listedFor === metric.value) return;
          listedFor = metric.value;
          const available = keys.filter(key => layerLines[key][metric.value].some(value => value != null));
          [[lineA, lineA.value], [lineB, lineB.value]].forEach(([select, wanted], index) => {
            select.innerHTML = available.map(key => `<option value="${key}">${escape(layerLines[key].label)}</option>`).join("");
            select.value = available.includes(wanted) ? wanted : available.find(key => index === 0 || key !== lineA.value) || available[0];
          });
        };
        const run = () => {
          listLines();
          const a = layerLines[lineA.value], b = layerLines[lineB.value], m = layerMetrics[metric.value];
          const rows = LAYER_AGES.map((age, i) => `<tr><th scope="row">${age} semanas</th><td>${escape(layerValue(a[metric.value][i], m.unit))}</td><td>${escape(layerValue(b[metric.value][i], m.unit))}</td></tr>`).join("");
          out.innerHTML = `<div class="guide-table-wrap guide-table--compare" role="region" aria-label="${escape(m.label)} por edad" tabindex="0"><table><caption>${escape(m.label)} por edad</caption><thead><tr><th scope="col">Edad</th><th scope="col">${escape(a.label)}</th><th scope="col">${escape(b.label)}</th></tr></thead><tbody>${rows}</tbody></table></div><span>${escape(layerSummary(metric.value, a, b))}</span>`;
        };
        [lineA, lineB, metric].forEach(el => el.addEventListener("input", run));
        run();
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
