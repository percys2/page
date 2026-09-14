/*
 * Guías por animal y calculadoras de la página "Guía de uso".
 * Las etapas, edades y productos salen de las fichas (feed-guides) y del catálogo FY26.
 * Los consumos diarios marcados como "referencia" NO provienen del catálogo: son valores
 * generales editables por el usuario para estimar sacos; siempre se indica en pantalla.
 */
(function () {
  "use strict";

  const MODEL = window.AGROCENTRO_CATALOG;
  const root = document.getElementById("guide-programs");
  if (!MODEL || !root) return;

  const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const product = id => MODEL.products.find(entry => entry.id === id);
  const guide = id => MODEL.getGuide(product(id)) || {};
  const name = id => MODEL.getName(product(id));
  const link = (id, label) => `<a href="products.html?product=${id}">${escape(label || name(id))}</a>`;
  const fmt = (value, digits = 1) => Number(value).toLocaleString("es-NI", { maximumFractionDigits: digits });
  const SACK_LB = 100;
  const WA = text => `https://wa.me/50582403490?text=${encodeURIComponent(text)}`;
  const DAY = 86400000;

  const productRow = id => {
    const g = guide(id);
    return `<li>${link(id)}<span>${escape(g.use || "")} ${escape(g.presentation ? `Presentación: ${g.presentation}.` : "")}</span></li>`;
  };
  const productList = ids => `<ul class="guide-product-list">${ids.map(productRow).join("")}</ul>`;

  // ---------- Programas de alimentación (etapas oficiales) ----------
  const broiler = [
    { id: 4, from: 1, to: 7, lb: 0.4 },
    { id: 2, from: 8, to: 21, lb: 2.2 },
    { id: 1, from: 22, to: 42, lb: 7.4, open: true }
  ];
  const neopigg = {
    optimo: [{ id: 24, from: 5, to: 27 }, { id: 25, from: 28, to: 34 }, { id: 37, from: 35, to: 43 }, { id: 26, from: 44, to: 70 }],
    plus: [{ id: 24, from: 5, to: 30 }, { id: 25, from: 31, to: 39 }, { id: 37, from: 40, to: 48 }, { id: 26, from: 49, to: 70 }]
  };
  const pigLines = {
    estandar: [{ id: 27, from: 71, to: 119 }, { id: 28, from: 120, to: 160, open: true }],
    premium: [{ id: 31, from: 71, to: 91 }, { id: 32, from: 92, to: 119 }, { id: 36, from: 120, to: 160, open: true }]
  };
  // Consumo diario de referencia (lb por animal y día). No es dato del catálogo.
  const pigReference = { 24: 0.4, 25: 0.9, 37: 1.3, 26: 2.2, 27: 4.0, 31: 4.0, 32: 5.0, 28: 6.0, 36: 6.0 };
  // Tamaño del saco según la presentación de la ficha (lb).
  const sackSize = { 24: 44, 25: 55.1, 37: 55.1 };
  const sacksFor = (id, lb) => lb / (sackSize[id] || SACK_LB);

  function stageRange(s) { return s.open ? `Día ${s.from} → peso de mercado` : `Días ${s.from}–${s.to}`; }
  function stageDays(s) { return s.to - s.from + 1; }

  function programTable(stages, caption) {
    return `<div class="guide-table-wrap" role="region" aria-label="${escape(caption)}" tabindex="0"><table><caption>${escape(caption)}</caption><thead><tr><th scope="col">Edad</th><th scope="col">Alimento</th><th scope="col">Uso</th></tr></thead><tbody>${stages.map(s => {
      const g = guide(s.id);
      return `<tr><th scope="row">${escape(stageRange(s))}</th><td>${link(s.id)}<span>${escape(g.form || "")}${g.presentation ? ` · ${escape(g.presentation)}` : ""}</span></td><td>${escape(g.use || "")}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  const feedingNote = ids => { const note = ids.map(id => guide(id).feeding).find(Boolean); return note ? `<p>${escape(note)}</p>` : ""; };

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
          out.innerHTML = html;
        };
        count.addEventListener("input", run); date.addEventListener("input", run); run();
      }
    },
    layers: {
      title: "Calculá cuántos sacos necesitás para tus gallinas",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-layer-count", "Cantidad de gallinas", 'type="number" min="1" max="100000" step="1" value="50" inputmode="numeric"')}${field("prog-layer-grams", "Consumo por gallina al día (g)", 'type="number" min="50" max="250" step="5" value="115" inputmode="numeric"')}${field("prog-layer-days", "Días a cubrir", 'type="number" min="1" max="365" step="1" value="30" inputmode="numeric"')}</div><div class="guide-ration-result" id="prog-layer-result" role="status" aria-live="polite"></div><p class="guide-ration-note">El consumo de 115 g es una <strong>referencia general</strong> para gallinas en postura, no un dato del catálogo: ajustalo según la etiqueta del saco, la raza y el clima. Sacos de 100 lb.</p>`,
      bind() {
        const ids = ["prog-layer-count", "prog-layer-grams", "prog-layer-days"].map(id => document.getElementById(id));
        const out = document.getElementById("prog-layer-result");
        const run = () => {
          if (ids.some(el => !el.checkValidity() || !el.value)) { out.textContent = "Revisá los valores: gallinas (1–100,000), consumo (50–250 g) y días (1–365)."; return; }
          const [hens, grams, days] = ids.map(el => Number(el.value));
          const lbPerDay = hens * grams / 453.592;
          const total = lbPerDay * days;
          const sackDays = SACK_LB / lbPerDay;
          out.innerHTML = `<strong>${hens.toLocaleString("es-NI")} gallinas × ${days} días:</strong> ${fmt(total)} lb · ${fmt(total / SACK_LB)} sacos de 100 lb<br><span>Consumo del lote: ${fmt(lbPerDay)} lb por día · un saco de 100 lb dura aproximadamente ${fmt(sackDays, sackDays < 10 ? 1 : 0)} días.</span>`;
        };
        ids.forEach(el => el.addEventListener("input", run)); run();
      }
    },
    pigs: {
      title: "Planificá las etapas y los sacos de tus cerdos",
      html: `<div class="guide-ration-fields guide-ration-fields--three">${field("prog-pig-count", "Cantidad de cerdos", 'type="number" min="1" max="10000" step="1" value="10" inputmode="numeric"')}${select("prog-pig-program", "Programa NeoPigg", [["optimo", "Óptimo"], ["plus", "Plus"]])}${select("prog-pig-line", "Línea después de NeoPigg 4", [["estandar", "Estándar (Desarrollina → Jamonina)"], ["premium", "Premium (Pig-Nova 5 → 6 → Pur-A-Lean)"]])}</div><div class="guide-ration-fields guide-ration-fields--three">${dateInput("prog-pig-date", "Fecha de nacimiento (opcional)")}${field("prog-pig-market", "Edad de salida (días)", 'type="number" min="121" max="240" step="1" value="160" inputmode="numeric"')}</div><div class="guide-ration-result" id="prog-pig-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Las edades de cada etapa son las del catálogo. El consumo diario por etapa es una <strong>referencia general editable</strong> (no del catálogo): cambiá los valores de la tabla con el consumo real de tu granja. Los sacos se calculan con la presentación de cada alimento (NeoPigg 1: 44 lb; NeoPigg 2 y 3: 55.1 lb; el resto: 100 lb).</p>`,
      bind() {
        const count = document.getElementById("prog-pig-count");
        const program = document.getElementById("prog-pig-program");
        const line = document.getElementById("prog-pig-line");
        const date = document.getElementById("prog-pig-date");
        const market = document.getElementById("prog-pig-market");
        const out = document.getElementById("prog-pig-result");
        const custom = {};
        const run = () => {
          if (!count.checkValidity() || !count.value || !market.checkValidity() || !market.value) { out.textContent = "Ingresá entre 1 y 10,000 cerdos y una edad de salida entre 121 y 240 días."; return; }
          const pigs = Number(count.value);
          const exit = Number(market.value);
          const stages = [...neopigg[program.value], ...pigLines[line.value]].map(s => s.open ? { ...s, to: exit, open: false, market: true } : s);
          let totalLb = 0;
          const rows = stages.map(s => {
            const daily = custom[s.id] ?? pigReference[s.id];
            const lb = pigs * daily * stageDays(s);
            totalLb += lb;
            return `<tr><th scope="row">${escape(name(s.id))}</th><td>${s.market ? `Días ${s.from}–${s.to}` : escape(stageRange(s))}<span>${stageDays(s)} días</span></td><td><input class="guide-inline-input" type="number" min="0.1" max="15" step="0.1" value="${daily}" data-pig-daily="${s.id}" aria-label="Consumo diario por cerdo en ${escape(name(s.id))}"></td><td>${fmt(lb, 0)} lb<span>${fmt(sacksFor(s.id, lb))} sacos de ${sackSize[s.id] || SACK_LB} lb</span></td></tr>`;
          }).join("");
          let html = `<div class="guide-table-wrap" role="region" aria-label="Alimento por etapa" tabindex="0"><table><caption>${pigs.toLocaleString("es-NI")} cerdos · programa ${program.value === "optimo" ? "Óptimo" : "Plus"} · línea ${line.value === "estandar" ? "estándar" : "premium"}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Edad</th><th scope="col">lb/cerdo/día (editable)</th><th scope="col">Total</th></tr></thead><tbody>${rows}<tr class="guide-total"><th scope="row" colspan="3">Total estimado hasta los ${exit} días</th><td>${fmt(totalLb, 0)} lb</td></tr></tbody></table></div>`;
          const birth = parseDate(date.value);
          if (birth) html += scheduleTable(stages.map(s => (s.market ? { ...s, open: true } : s)), birth);
          out.innerHTML = html;
          out.querySelectorAll("[data-pig-daily]").forEach(input => input.addEventListener("change", () => {
            const value = Number(input.value);
            if (value > 0 && value <= 15) { custom[input.dataset.pigDaily] = value; run(); }
          }));
        };
        [count, program, line, date, market].forEach(el => el.addEventListener("input", run)); run();
      }
    },
    horse: {
      title: "Calculá la Forrajina de tu caballo",
      html: `<div class="guide-ration-fields">${field("prog-horse-weight", "Peso del caballo (kg)", 'type="number" min="100" max="1000" step="10" value="400" inputmode="numeric"')}</div><div class="guide-ration-result" id="prog-horse-result" role="status" aria-live="polite"></div><p class="guide-ration-note">Según la ficha de Forrajina: 0.5–1.5 kg por cada 100 kg de peso vivo, repartidos en 2 o más raciones al día. Para Omalina y Cavalleria Forte usá la tabla de la etiqueta.</p>`,
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

  function calculator(key) {
    const c = calculators[key];
    return `<div class="guide-ration-tool" data-calculator="${key}"><h3>${escape(c.title)}</h3>${c.html}</div>`;
  }

  // ---------- Guías ----------
  const programs = [
    {
      key: "pollos", label: "Pollos de engorde",
      summary: "Tres alimentos según la edad, del día 1 al peso de mercado.",
      body: () => `${programTable(broiler, "Programa para pollos de engorde")}${calculator("broiler")}`,
      links: [["products.html?type=alimentos&category=aves", "Ver alimentos para aves"], ["#consumo-pollos", "¿Cuánto consume un pollo?"]]
    },
    {
      key: "ponedoras", label: "Gallinas ponedoras",
      summary: "El alimento depende del tipo de gallina: de patio, de granja o criolla.",
      body: () => `<div class="guide-table-wrap" role="region" aria-label="Alimentos de postura" tabindex="0"><table><caption>Alimentos de postura</caption><thead><tr><th scope="col">Tipo de gallina</th><th scope="col">Alimento</th><th scope="col">Cuándo</th></tr></thead><tbody><tr><th scope="row">Gallinas de patio</th><td>${link(38)}</td><td>${escape(guide(38).period)}</td></tr><tr><th scope="row">Gallinas de granja</th><td>${link(39)}</td><td>${escape(guide(39).period)}</td></tr><tr><th scope="row">Gallinas criollas</th><td>${link(11)}</td><td>${escape(guide(11).period)}</td></tr></tbody></table></div>${calculator("layers")}`,
      links: [["products.html?type=alimentos&category=aves&stage=produccion", "Ver alimentos de postura"], ["#postura", "Posturina Fase 1 y Posturina HP"]]
    },
    {
      key: "cerdos", label: "Cerdos",
      summary: "NeoPigg 1 al 4 para lechones; después, línea estándar o premium hasta el peso de mercado.",
      body: () => `${programTable(neopigg.optimo, "Lechones: NeoPigg, programa Óptimo")}<p>Programa Plus: ${neopigg.plus.map(s => `${escape(name(s.id))} días ${s.from}–${s.to}`).join(" · ")}. ${escape(guide(24).feeding)}</p>${programTable(pigLines.estandar, "Desarrollo y engorde: línea estándar")}${programTable(pigLines.premium, "Desarrollo y engorde: línea premium")}<p>${escape(guide(36).feeding)} ${escape(guide(36).period)}.</p><div class="guide-table-wrap" role="region" aria-label="Cerdas reproductoras" tabindex="0"><table><caption>Cerdas reproductoras</caption><thead><tr><th scope="col">Etapa</th><th scope="col">Alimento</th><th scope="col">Cuándo</th></tr></thead><tbody><tr><th scope="row">Gestación</th><td>${link(29)}</td><td>${escape(guide(29).period)}</td></tr><tr><th scope="row">Lactancia</th><td>${link(30)}</td><td>${escape(guide(30).period)}</td></tr></tbody></table></div>${calculator("pigs")}`,
      links: [["products.html?type=alimentos&category=cerdos", "Ver alimentos para cerdos"], ["#lineas-cerdos", "¿Línea estándar o premium?"], ["#neopigg-optimo-plus", "¿Óptimo o Plus?"]]
    },
    {
      key: "mascotas", label: "Perros y gatos",
      summary: "La edad del animal define el alimento: cachorro o adulto.",
      body: () => `<div class="guide-table-wrap" role="region" aria-label="Alimentos para perros y gatos" tabindex="0"><table><caption>Alimentos para perros y gatos</caption><thead><tr><th scope="col">Animal</th><th scope="col">Alimentos</th><th scope="col">Edad</th></tr></thead><tbody><tr><th scope="row">Perros cachorros</th><td>${link(35)} · ${link(17)} · ${link(13)}</td><td>${escape(guide(35).period)}</td></tr><tr><th scope="row">Perros adultos</th><td>${link(33)} · ${link(15)} · ${link(12)}</td><td>${escape(guide(33).period)}</td></tr><tr><th scope="row">Gatos adultos</th><td>${link(19)} · ${link(21)}</td><td>${escape(guide(19).period)}</td></tr></tbody></table></div><p>Cada marca indica en la etiqueta la ración diaria según el peso del animal. La presentación de 454 g sirve para probar antes de comprar el saco.</p>`,
      links: [["products.html?type=alimentos&category=perros", "Ver alimentos para perros"], ["products.html?type=alimentos&category=gatos", "Ver alimentos para gatos"], ["#pet-master", "¿Pet Master Cachorros o Adultos?"]]
    },
    {
      key: "caballos", label: "Caballos",
      summary: "Omalina según el trabajo del caballo; Forrajina y Cavalleria Forte como suplementos.",
      body: () => `<div class="guide-table-wrap" role="region" aria-label="Alimentos para caballos" tabindex="0"><table><caption>Alimentos para caballos</caption><thead><tr><th scope="col">Situación</th><th scope="col">Alimento</th><th scope="col">Cuándo</th></tr></thead><tbody><tr><th scope="row">Recreación y trabajo ligero</th><td>${link(6)}</td><td>${escape(guide(6).period)}</td></tr><tr><th scope="row">Trabajo intenso o deporte</th><td>${link(7)}</td><td>${escape(guide(7).period)}</td></tr><tr><th scope="row">Yeguas de cría y potros</th><td>${link(8)}</td><td>${escape(guide(8).period)}</td></tr></tbody></table></div>${productList([23, 5])}${calculator("horse")}`,
      links: [["products.html?type=alimentos&category=equinos", "Ver alimentos para caballos"], ["#omalina", "¿Omalina 100, 200 o 300?"]]
    },
    {
      key: "conejos", label: "Conejos",
      summary: "Un solo alimento completo para todas las razas y edades.",
      body: () => `${productList([9])}<p>${escape(guide(9).feeding)}</p>`,
      links: [["products.html?type=alimentos&category=conejos", "Ver alimento para conejos"]]
    }
  ];

  root.innerHTML = `<aside class="guide-sidebar guide-programs-nav"><h2>Elegí tu animal</h2><div class="guide-topic-list" role="tablist" aria-label="Elegí un animal">${programs.map((p, i) => `<button type="button" role="tab" id="tab-${p.key}" aria-pressed="${i === 0}" aria-selected="${i === 0}" aria-controls="panel-${p.key}" data-program="${p.key}">${escape(p.label)}</button>`).join("")}</div></aside><div class="guide-programs-content">${programs.map((p, i) => `<section class="guide-program" role="tabpanel" id="panel-${p.key}" aria-labelledby="tab-${p.key}"${i === 0 ? "" : " hidden"}><div class="guide-program__head"><h3>${escape(p.label)}</h3><p>${escape(p.summary)}</p></div>${p.body()}<div class="guide-answer-footer">${p.links.map(([href, label]) => `<a href="${href}">${escape(label)} →</a>`).join("")}<a href="${WA(`Hola, AgroCentro Nica. Tengo una consulta sobre alimentación de ${p.label.toLowerCase()}.\n\nMi caso: `)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a></div></section>`).join("")}</div>`;

  const tabs = [...root.querySelectorAll("[data-program]")];
  const panels = [...root.querySelectorAll(".guide-program")];
  function show(key, focus) {
    tabs.forEach(tab => { const on = String(tab.dataset.program === key); tab.setAttribute("aria-selected", on); tab.setAttribute("aria-pressed", on); });
    panels.forEach(panel => { panel.hidden = panel.id !== `panel-${key}`; });
    if (focus) root.querySelector(`#panel-${key}`).scrollIntoView({ block: "start", behavior: "smooth" });
  }
  tabs.forEach(tab => tab.addEventListener("click", () => { show(tab.dataset.program, false); history.replaceState(null, "", `#guia-${tab.dataset.program}`); }));
  Object.values(calculators).forEach(c => c.bind());
  function openFromHash() {
    const match = /^#guia-([a-z]+)$/.exec(location.hash);
    if (match && programs.some(p => p.key === match[1])) show(match[1], true);
  }
  window.addEventListener("hashchange", openFromHash);
  document.querySelectorAll('a[href^="#guia-"]').forEach(anchor => anchor.addEventListener("click", () => {
    if (anchor.getAttribute("href") === location.hash) openFromHash();
  }));
  openFromHash();
  root.hidden = false;
})();
