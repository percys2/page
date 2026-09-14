(function () {
  "use strict";

  const MODEL = window.AGROCENTRO_CATALOG;
  const container = document.getElementById("guide-questions");
  if (!MODEL || !container) return;
  const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const product = id => MODEL.products.find(entry => entry.id === id);
  const guide = id => MODEL.getGuide(product(id));
  const link = id => `<a href="products.html?product=${id}">${escape(MODEL.getName(product(id)))}</a>`;
  const topics = { aves: "Aves", cerdos: "Cerdos", mascotas: "Perros y gatos", equinos: "Caballos", manejo: "Manejo del alimento" };
  function periods(ids, caption) {
    return `<div class="guide-table-wrap" role="region" aria-label="${escape(caption)}" tabindex="0"><table><caption>${escape(caption)}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Etapa y uso</th></tr></thead><tbody>${ids.map(id => `<tr><th scope="row">${link(id)}</th><td><strong>${escape(guide(id).stage)}</strong><span>${escape(guide(id).period)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function uses(ids) {
    return `<ul class="guide-product-list">${ids.map(id => `<li>${link(id)}<span>${escape(guide(id).use)}</span></li>`).join("")}</ul>`;
  }
  // Rangos calculados con los objetivos 2022 para lotes mixtos Ross 308 y Cobb500.
  // Fuentes técnicas: Aviagen Ross 308/308 FF Broiler Performance Objectives, pág. 3;
  // Cobb500 Broiler Performance & Nutrition Supplement, págs. 2 y 5.
  // Los períodos de los alimentos corresponden al catálogo FY26 de Cargill Nicaragua, pág. 8.
  const broilerReference = [
    { period: "Días 1–7", feed: "Preiniciarina Plus LA", pounds: "0.37–0.40 lb" },
    { period: "Días 8–21", feed: "Iniciarina", pounds: "2.18–2.53 lb" },
    { period: "Días 22–42", feed: "Engordina", pounds: "7.56–8.33 lb" },
    { period: "Días 43–45", feed: "Engordina", pounds: "1.41–1.50 lb" }
  ];
  function broilerConsumptionTable() {
    const rows = broilerReference.map(item => `<tr><th scope="row">${item.period}</th><td>${item.feed}</td><td>${item.pounds}</td></tr>`).join("");
    return `<div class="guide-table-wrap" role="region" aria-label="Rango de consumo de referencia por ave" tabindex="0"><table><caption>Objetivos 2022 Ross 308–Cobb500 por ave viva</caption><thead><tr><th scope="col">Período</th><th scope="col">Alimento de la etapa</th><th scope="col">Rango de consumo</th></tr></thead><tbody>${rows}<tr class="guide-total"><th scope="row" colspan="2">Total hasta 42 días</th><td>10.11–11.26 lb</td></tr><tr class="guide-total"><th scope="row" colspan="2">Total hasta 45 días</th><td>11.52–12.76 lb</td></tr></tbody></table></div>`;
  }
  const questions = [
    { id: "pollos-engorde", topic: "aves", question: "¿Qué alimento le toca a mi pollo según su edad?", keywords: "pollitos preinicio inicio engorde preiniciarina iniciarina engordina", answer: `<p>Para pollos de engorde, el programa avanza en tres etapas. Contá la edad del pollo desde su nacimiento:</p>${periods([4, 2, 1], "Etapas del pollo de engorde")}<p>Entrá a la ficha del saco para ver su presentación y sus características.</p>` },
    { id: "consumo-pollos", topic: "aves", question: "¿Cuánto alimento consume un pollo de engorde?", keywords: "consumo racion libras gramos sacos lote 42 45 dias calculadora ross cobb", answer: `<p>Esta referencia sirve para planificar compras y revisar el consumo del lote. Combina las etapas del programa Purina Nicaragua con objetivos productivos oficiales para lotes mixtos Ross 308 y Cobb500.</p>${broilerConsumptionTable()}<p><strong>Es un rango de consumo esperado, no una cantidad que debás limitar.</strong> El consumo real cambia con la genética, el clima, la salud, el manejo y la disponibilidad de agua y alimento. Tampoco incluye alimento desperdiciado.</p><div class="guide-ration-tool" data-broiler-calculator><h3>Calculá el alimento para tu lote</h3><div class="guide-ration-fields"><label for="broiler-count">Cantidad de pollos<input id="broiler-count" type="number" min="1" max="100000" step="1" value="100" inputmode="numeric" required></label><label for="broiler-days">Duración<select id="broiler-days"><option value="42">Hasta 42 días</option><option value="45">Hasta 45 días</option></select></label></div><p class="guide-ration-result" id="broiler-result" role="status" aria-live="polite"></p><p class="guide-ration-note">El resultado expresa un rango en libras y sacos equivalentes de 100 lb. Redondeá la compra según la presentación disponible y revisá el consumo real durante el ciclo.</p></div>` },
    { id: "cambio-pollos", topic: "aves", question: "¿Cuándo cambio de Preiniciarina a Iniciarina y Engordina?", keywords: "cambio transicion preiniciarina iniciarina engordina dia 7 8 21 22", answer: `<p>El programa de Cargill Nicaragua marca estos cambios por edad:</p>${periods([4, 2, 1], "Cambio de alimento por edad")}<ul><li>Al terminar el día 7, continuá con ${link(2)} desde el día 8.</li><li>Al terminar el día 21, continuá con ${link(1)} desde el día 22 hasta el peso de mercado.</li><li>Anotá diariamente cuánto alimento servís y cuánto queda para detectar cambios inesperados en el consumo.</li></ul>` },
    { id: "postura", topic: "aves", question: "¿Cuál es la diferencia entre Posturina Fase 1 y Posturina HP?", keywords: "gallinas ponedoras huevos postura patio granja", answer: `${uses([38, 39])}${periods([38, 39], "Uso de los alimentos de postura")}<p>Para gallinas criollas también tenés ${link(11)}, durante todo el ciclo de postura.</p><a class="guide-inline-link" href="products.html?type=alimentos&amp;category=aves&amp;stage=produccion">Ver alimentos de postura →</a>` },
    { id: "pollo-criollo", topic: "aves", question: "¿Para qué se usa Pollo Criollo?", keywords: "patio crecimiento engorde", answer: `${uses([10])}<p>Se usa durante el crecimiento y engorde de pollos criollos. Si tu gallina está produciendo huevos, revisá ${link(11)}.</p>` },
    { id: "novagallos", topic: "aves", question: "¿En qué etapa se usa Novagallos?", keywords: "gallos crecimiento adulto actividad", answer: `${uses([3])}<p><strong>Etapa:</strong> ${escape(guide(3).period)}.</p><p>Contanos la etapa y la actividad del gallo para orientarte sobre el alimento.</p>` },
    { id: "neopigg", topic: "cerdos", question: "¿A qué edad se usan NeoPigg 1, 2, 3 y 4?", keywords: "lechon lechones destete optimo plus dias fases", answer: `<p>Las edades se cuentan <strong>desde el nacimiento</strong>. Elegí un programa y seguí sus cuatro fases en orden.</p><div class="guide-table-wrap" role="region" aria-label="Edades de los programas NeoPigg" tabindex="0"><table><caption>Edad del lechón en días de vida</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Óptimo</th><th scope="col">Plus</th></tr></thead><tbody>${[24,25,37,26].map(id => `<tr><th scope="row">${link(id)}</th>${guide(id).agePrograms.map(program => `<td>${escape(program.days)} días</td>`).join("")}</tr>`).join("")}</tbody></table></div><p>Si no sabés qué programa lleva tu lote, contanos su edad y el alimento que está consumiendo antes de elegir la siguiente fase.</p>` },
    { id: "lineas-cerdos", topic: "cerdos", question: "¿Cómo elijo entre la línea estándar y la premium para cerdos?", keywords: "desarrollina jamonina pig nova pignova pignora 5 6 puralean pur a lean engorde", answer: `<p>Después de NeoPigg 4 tenés estas dos rutas. Cada una tiene sus propias etapas:</p><h3>Línea estándar</h3>${periods([27,28], "Desarrollina → Jamonina")}<h3>Línea premium</h3>${periods([31,32], "Pig-Nova 5 → Pig-Nova 6")}<p>En el programa tecnificado, ${link(36)} corresponde a la finalización después de Pig-Nova 6. Revisá su ficha para ver el período de uso.</p><p>Contanos la edad del lote, qué alimento usás y tu presupuesto para comparar las opciones.</p><div class="guide-related-links"><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=estandar">Ver línea estándar →</a><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=premium">Ver línea premium →</a></div>` },
    { id: "cerdas", topic: "cerdos", question: "¿Se usa el mismo alimento durante gestación y lactancia?", keywords: "cerda criacerdina lacticerdina parto destete reproductoras", answer: `<p>Son dos etapas con productos distintos:</p>${periods([29,30], "Alimentos para cerdas reproductoras")}<p>Abrí cada ficha para consultar su uso y presentación.</p>` },
    { id: "consumo-real-cerdos", topic: "cerdos", question: "¿Cómo calculo el consumo real de mis cerdos?", keywords: "consumo real diario cerdo lote libras servido sobrante desperdicio animales dias", answer: `<p>El catálogo de Nicaragua define las edades de cada alimento, pero remite las cantidades a tablas de recomendación específicas. Para controlar tu granja, medí primero el consumo real:</p><p class="guide-formula"><strong>Alimento servido − sobrante − alimento derramado = consumo del lote</strong></p><p>Si la cantidad de cerdos no cambió, dividí el consumo entre los animales y los días medidos. Como ejemplo de cálculo, si 20 cerdos consumen 920 lb en 14 días, el promedio es <strong>3.29 lb por cerdo al día</strong>. Ese ejemplo no es una ración recomendada.</p><p>Si entraron o salieron animales, anotá cuántos estuvieron presentes cada día y dividí el consumo entre la suma de esos “animales-día”. Compará períodos con la misma edad, producto y programa.</p>` },
    { id: "pet-master", topic: "mascotas", question: "¿Cuándo se usa Pet Master Cachorros y cuándo Adultos?", keywords: "perro perros petmaster cachorro adulto meses", answer: `${periods([40,34], "Etapas de Pet Master")}<p>La ficha de cada producto te permite elegir entre la presentación pequeña y el saco.</p>` },
    { id: "mimados", topic: "mascotas", question: "¿Cuál Mimados elijo para mi perro?", keywords: "mimado cachorro cachorros adulto adultos", answer: `${uses([13,12])}<p>Elegí según la etapa de tu perro. Para ajustar la cantidad diaria, revisá la tabla de alimentación del empaque según su peso.</p>` },
    { id: "gatos", topic: "mascotas", question: "¿Don Gato y Gati Mar y Tierra son para gatos adultos?", keywords: "gaty gato gatito edad meses", answer: `${periods([18,20], "Alimentos para gatos adultos")}<p>Si buscás alimento para un gatito, contanos su edad para consultar una opción adecuada.</p>` },
    { id: "omalina", topic: "equinos", question: "¿Qué diferencia hay entre Omalina 100, 200 y 300?", keywords: "caballo caballeria caballería yegua potro trabajo mantenimiento", answer: `${uses([6,7,8])}${periods([8], "Etapas de Omalina 300")}<p>La cantidad se define con la tabla de la etiqueta. Al consultar, indicá la edad, el peso aproximado y el trabajo que hace tu caballo.</p>` },
    { id: "suplementos-caballos", topic: "equinos", question: "¿Para qué sirven Forrajina y Caballería Forte?", keywords: "forraje fibra suplemento caballeria proteico", answer: `${uses([23,5])}<p>Cada producto cumple una función distinta en la alimentación. Revisá las indicaciones de su ficha y la tabla del saco para definir cómo incorporarlo.</p>` },
    { id: "guardar-alimento", topic: "manejo", question: "¿Cómo debo guardar los sacos de alimento?", keywords: "guardar almacenar bodega humedad plagas piso pared fecha lote", answer: `<ul><li>Mantenelos cerrados, bajo techo y protegidos de humedad, filtraciones y sol directo.</li><li>Dejá espacio alrededor de los sacos para facilitar la limpieza y la revisión de plagas.</li><li>Separá el alimento de químicos, medicamentos, combustibles y materiales que puedan contaminarlo.</li><li>Conservá visible el lote y la fecha, y usá primero el alimento que ingresó primero.</li></ul><p>Revisá periódicamente el estado de los sacos y del área de almacenamiento.</p>` },
    { id: "alimento-deteriorado", topic: "manejo", question: "¿Cómo reconozco alimento que no debo suministrar?", keywords: "moho olor rancio humedad grumos insectos roedores contaminado deteriorado", answer: `<p>Separá el saco si encontrás humedad, moho, olor anormal o rancio, grumos húmedos, insectos, daño de roedores o contaminación con químicos.</p><p>No lo mezclés con alimento en buen estado. Conservá el número de lote y consultá al proveedor antes de usarlo.</p>` },
    { id: "mezclar-alimento", topic: "manejo", question: "¿Puedo mezclar el alimento balanceado con maíz u otros ingredientes?", keywords: "mezclar maiz sorgo concentrado alimento completo suplemento diluir", answer: `<p>Primero revisá cómo está identificado el producto. Un <strong>alimento completo</strong> está formulado para cubrir la alimentación de la especie y etapa indicadas; agregar otros ingredientes cambia esa concentración nutricional.</p><p>Un <strong>suplemento o concentrado</strong> puede requerir mezcla, pero solamente según su tabla o fórmula de uso. No usés la misma regla para productos distintos.</p>` },
  ];

  container.innerHTML = Object.entries(topics).map(([key, label]) => `<section class="guide-group" data-guide-group="${key}" aria-labelledby="group-${key}"><div class="guide-group-heading"><h2 id="group-${key}">${label}</h2></div>${questions.filter(item => item.topic === key).map(item => `<details class="guide-question" id="${item.id}" data-guide-question><summary>${escape(item.question)}<span aria-hidden="true">+</span></summary><div class="guide-answer">${item.answer}<div class="guide-answer-footer"><a href="https://wa.me/50582403490?text=${encodeURIComponent(`Hola, AgroCentro Nica. Tengo una consulta sobre: ${item.question}\n\nMi caso: `)}" target="_blank" rel="noopener noreferrer">Consultar mi caso por WhatsApp ↗</a></div></div></details>`).join("")}</section>`).join("");
  const search = document.getElementById("guide-search");
  const filters = [...document.querySelectorAll("[data-guide-topic]")];
  const cards = questions.map(item => ({ ...item, element: document.getElementById(item.id) }));
  cards.forEach(item => { item.searchText = normalize(`${item.question} ${item.keywords} ${item.element.textContent}`); });
  const requestedTopic = new URLSearchParams(location.search).get("tema");
  let selected = Object.hasOwn(topics, requestedTopic) ? requestedTopic : "all";
  function applyFilters() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(item => {
      const visible = (selected === "all" || selected === item.topic) && terms.every(term => item.searchText.includes(term));
      item.element.hidden = !visible;
      if (visible) count++;
    });
    document.querySelectorAll("[data-guide-group]").forEach(group => {
      group.hidden = !cards.some(item => item.topic === group.dataset.guideGroup && !item.element.hidden);
    });
    filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.guideTopic === selected)));
    document.getElementById("guide-result-count").textContent = `${count} ${count === 1 ? "pregunta" : "preguntas"}${selected === "all" ? "" : ` · ${topics[selected]}`}`;
    document.getElementById("guide-empty").hidden = count !== 0;
  }
  function openHash() {
    const id = location.hash.slice(1);
    const item = cards.find(entry => entry.id === id);
    if (!item) return;
    selected = item.topic;
    search.value = "";
    applyFilters();
    item.element.open = true;
    item.element.scrollIntoView({ block: "start" });
  }
  filters.forEach(button => button.addEventListener("click", () => {
    selected = button.dataset.guideTopic;
    applyFilters();
  }));
  search.addEventListener("input", applyFilters);
  document.getElementById("guide-reset").addEventListener("click", () => {
    search.value = "";
    selected = "all";
    applyFilters();
    search.focus();
  });
  window.addEventListener("hashchange", openHash);
  document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener("click", () => {
    if (anchor.getAttribute("href") === location.hash) openHash();
  }));
  document.getElementById("guide-controls").hidden = false;
  document.getElementById("guide-result-count").hidden = false;
  const broilerCount = document.getElementById("broiler-count");
  const broilerDays = document.getElementById("broiler-days");
  const broilerResult = document.getElementById("broiler-result");
  function updateBroilerCalculation() {
    if (!broilerCount || !broilerDays || !broilerResult) return;
    if (!broilerCount.checkValidity()) {
      broilerResult.textContent = "Ingresá una cantidad entera entre 1 y 100,000 pollos.";
      return;
    }
    const birds = Number(broilerCount.value);
    const range = broilerDays.value === "45" ? [11.52, 12.76] : [10.11, 11.26];
    const totalPounds = range.map(value => birds * value);
    const sacks = totalPounds.map(value => value / 100);
    const format = value => value.toLocaleString("es-NI", { maximumFractionDigits: 1 });
    broilerResult.innerHTML = `<strong>${birds.toLocaleString("es-NI")} pollos:</strong> ${format(totalPounds[0])}–${format(totalPounds[1])} lb · ${format(sacks[0])}–${format(sacks[1])} sacos equivalentes`;
  }
  [broilerCount, broilerDays].forEach(control => control?.addEventListener("input", updateBroilerCalculation));
  updateBroilerCalculation();
  applyFilters();
  openHash();
})();
