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
  const topics = { aves: "Aves", cerdos: "Cerdos", mascotas: "Perros y gatos", equinos: "Caballos", conejos: "Conejos y ganado", veterinaria: "Veterinaria", manejo: "Manejo del alimento" };
  const VET = Object.entries(window.AGROCENTRO_VETERINARY || {}).map(([id, entry]) => ({ id: Number(id), ...entry })).filter(entry => product(entry.id));
  const vetCategories = { antiparasitarios: "Antiparasitarios", vitaminas: "Vitaminas", suplementos: "Suplementos y electrolitos", antibioticos: "Antibióticos", respiratorios: "Respiratorios", antiinflamatorios: "Antiinflamatorios", dermatologicos: "Dermatológicos", antisepticos: "Antisépticos", hormonales: "Hormonales" };
  function vetList(filter) {
    const items = VET.filter(filter).sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!items.length) return "<p>Consultanos por WhatsApp la disponibilidad actual.</p>";
    return `<ul class="guide-product-list">${items.map(v => `<li>${link(v.id)}<span>${escape(v.summary || "")}${v.species?.length ? ` <em>Especies: ${escape(v.species.join(", "))}.</em>` : ""}</span></li>`).join("")}</ul>`;
  }
  const bySpecies = species => v => (v.species || []).includes(species);
  const vetNote = `<p class="guide-source"><strong>Importante:</strong> la selección de estos productos, su dosis y sus precauciones requieren valoración del médico veterinario y la revisión de la etiqueta de la presentación exacta. Esta guía no incluye pautas de tratamiento.</p>`;
  function periods(ids, caption) {
    return `<div class="guide-table-wrap" role="region" aria-label="${escape(caption)}" tabindex="0"><table><caption>${escape(caption)}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Etapa y uso</th></tr></thead><tbody>${ids.map(id => `<tr><th scope="row">${link(id)}</th><td><strong>${escape(guide(id).stage)}</strong><span>${escape(guide(id).period)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function uses(ids) {
    return `<ul class="guide-product-list">${ids.map(id => `<li>${link(id)}<span>${escape(guide(id).use)}</span></li>`).join("")}</ul>`;
  }
  // Base comercial redondeada a 10 lb por ave hasta 42 días.
  // Los períodos corresponden al catálogo FY26 de Cargill Nicaragua, pág. 8.
  // Como contraste técnico, los objetivos 2022 para lotes mixtos Ross 308 y Cobb500
  // sitúan el consumo acumulado a 42 días entre 10.11 y 11.26 lb por ave viva.
  const broilerReference = [
    { period: "Días 1–7", feed: "Preiniciarina Plus LA", pounds: "0.4 lb" },
    { period: "Días 8–21", feed: "Iniciarina", pounds: "2.2 lb" },
    { period: "Días 22–42", feed: "Engordina", pounds: "7.4 lb" }
  ];
  function broilerConsumptionTable() {
    const rows = broilerReference.map(item => `<tr><th scope="row">${item.period}</th><td>${item.feed}</td><td>${item.pounds}</td></tr>`).join("");
    return `<div class="guide-table-wrap" role="region" aria-label="Consumo base por pollo" tabindex="0"><table><caption>Plan base por pollo hasta 42 días</caption><thead><tr><th scope="col">Período</th><th scope="col">Alimento de la etapa</th><th scope="col">Consumo base</th></tr></thead><tbody>${rows}<tr class="guide-total"><th scope="row" colspan="2">Total por pollo</th><td>10 lb</td></tr></tbody></table></div>`;
  }
  const questions = [
    { id: "pollos-engorde", topic: "aves", question: "¿Qué alimento le toca a mi pollo según su edad?", keywords: "pollitos preinicio inicio engorde preiniciarina iniciarina engordina", answer: `<p>Para pollos de engorde, el programa avanza en tres etapas. Contá la edad del pollo desde su nacimiento:</p>${periods([4, 2, 1], "Etapas del pollo de engorde")}<p>Entrá a la ficha del saco para ver su presentación y sus características.</p>` },
    { id: "consumo-pollos", topic: "aves", question: "¿Cuánto alimento consume un pollo de engorde?", keywords: "consumo racion libras sacos lote 42 dias calculadora", answer: `<p>Para planificar de forma sencilla, esta tabla usa una base redondeada de <strong>10 lb de alimento por pollo hasta 42 días</strong>.</p>${broilerConsumptionTable()}<p><strong>Usala para planificar, no para limitar el alimento.</strong> El consumo real puede superar las 10 lb según la genética, el clima, la salud, el manejo y el tiempo de salida. Sumá aparte cualquier desperdicio.</p><div data-calc="broiler"></div>` },
    { id: "postura", topic: "aves", question: "¿Cuál es la diferencia entre Posturina Fase 1 y Posturina HP?", keywords: "gallinas ponedoras huevos postura patio granja calculadora sacos consumo", answer: `${uses([38, 39])}${periods([38, 39], "Uso de los alimentos de postura")}<p>Para gallinas criollas también tenés ${link(11)}, durante todo el ciclo de postura.</p><a class="guide-inline-link" href="products.html?type=alimentos&amp;category=aves&amp;stage=produccion">Ver alimentos de postura →</a><div data-calc="layers"></div>` },
    { id: "pollo-criollo", topic: "aves", question: "¿Para qué se usa Pollo Criollo?", keywords: "patio crecimiento engorde", answer: `${uses([10])}<p>Se usa durante el crecimiento y engorde de pollos criollos. Si tu gallina está produciendo huevos, revisá ${link(11)}.</p>` },
    { id: "novagallos", topic: "aves", question: "¿En qué etapa se usa Novagallos?", keywords: "gallos crecimiento adulto actividad", answer: `${uses([3])}<p><strong>Etapa:</strong> ${escape(guide(3).period)}.</p><p>Contanos la etapa y la actividad del gallo para orientarte sobre el alimento.</p>` },
    { id: "neopigg", topic: "cerdos", question: "¿A qué edad se usan NeoPigg 1, 2, 3 y 4?", keywords: "lechon lechones destete optimo plus dias fases", answer: `<p>Las edades se cuentan <strong>desde el nacimiento</strong>. Elegí un programa y seguí sus cuatro fases en orden.</p><div class="guide-table-wrap" role="region" aria-label="Edades de los programas NeoPigg" tabindex="0"><table><caption>Edad del lechón en días de vida</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Óptimo</th><th scope="col">Plus</th></tr></thead><tbody>${[24,25,37,26].map(id => `<tr><th scope="row">${link(id)}</th>${guide(id).agePrograms.map(program => `<td>${escape(program.days)} días</td>`).join("")}</tr>`).join("")}</tbody></table></div><p>Si no sabés qué programa lleva tu lote, contanos su edad y el alimento que está consumiendo antes de elegir la siguiente fase.</p>` },
    { id: "lineas-cerdos", topic: "cerdos", question: "¿Cómo elijo entre la línea estándar y la premium para cerdos?", keywords: "desarrollina jamonina pig nova pignova pignora 5 6 puralean pur a lean engorde", answer: `<p>Después de NeoPigg 4 tenés estas dos rutas. Cada una tiene sus propias etapas:</p><h3>Línea estándar</h3>${periods([27,28], "Desarrollina → Jamonina")}<h3>Línea premium</h3>${periods([31,32], "Pig-Nova 5 → Pig-Nova 6")}<p>En el programa tecnificado, ${link(36)} corresponde a la finalización después de Pig-Nova 6 (días 120–154). También se puede cerrar la línea estándar con Pur-A-Lean: Desarrollina días 71–98, Jamonina 99–126 y Pur-A-Lean 127–154. El consumo por cerdo y el peso esperado de cada línea están en <a href="#consumo-cerdos">¿Cuánto alimento consume un cerdo?</a>.</p><p>Contanos la edad del lote, qué alimento usás y tu presupuesto para comparar las opciones.</p><div class="guide-related-links"><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=estandar">Ver línea estándar →</a><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=premium">Ver línea premium →</a></div>` },
    { id: "consumo-cerdos", topic: "cerdos", question: "¿Cuánto alimento consume un cerdo hasta el peso de mercado?", keywords: "consumo cerdos sacos libras lote calculadora calendario 154 dias peso mercado neopigg desarrollina jamonina pig nova puralean", answer: `<p>Según los resultados esperados del catálogo, un cerdo consume <strong>85 lb</strong> de NeoPigg hasta los 70 días (más 0.3–0.4 lb de creep feeding desde el día 5) y <strong>442 lb</strong> del día 71 al 154 con cualquiera de las tres líneas, unas 527 lb en total.</p><div class="guide-table-wrap" role="region" aria-label="Consumo por línea" tabindex="0"><table><caption>Del día 71 al 154: consumo por cerdo y peso esperado</caption><thead><tr><th scope="col">Línea</th><th scope="col">Alimento por cerdo</th><th scope="col">Peso a los 154 días</th></tr></thead><tbody><tr><th scope="row">Estándar</th><td>${link(27)} 228 lb (días 71–119) · ${link(28)} 214 lb (días 120–154)</td><td>224 lb</td></tr><tr><th scope="row">Estándar + Pur-A-Lean</th><td>${link(27)} 120 lb (71–98) · ${link(28)} 150 lb (99–126) · ${link(36)} 172 lb (127–154)</td><td>232 lb</td></tr><tr><th scope="row">Premium</th><td>${link(31)} 90 lb (71–91) · ${link(32)} 130 lb (92–119) · ${link(36)} 222 lb (120–154)</td><td>245 lb</td></tr></tbody></table></div><p>Pur-A-Lean se usa entre 4 y 6 semanas; en los últimos 7 días antes del beneficio el catálogo indica la versión Pur-A-Lean LA. Los pesos parten de un lechón de 66 lb a los 71 días y pueden ser mayores si se usó el programa NeoPigg completo.</p><div data-calc="pigs"></div>` },
    { id: "cerdas", topic: "cerdos", question: "¿Se usa el mismo alimento durante gestación y lactancia?", keywords: "cerda criacerdina lacticerdina parto destete reproductoras", answer: `<p>Son dos etapas con productos distintos:</p>${periods([29,30], "Alimentos para cerdas reproductoras")}<p>Abrí cada ficha para consultar su uso y presentación.</p>` },
    { id: "pet-master", topic: "mascotas", question: "¿Cuándo se usa Pet Master Cachorros y cuándo Adultos?", keywords: "perro perros petmaster cachorro adulto meses", answer: `${periods([40,34], "Etapas de Pet Master")}<p>La ficha de cada producto te permite elegir entre la presentación pequeña y el saco.</p>` },
    { id: "mimados", topic: "mascotas", question: "¿Cuál Mimados elijo para mi perro?", keywords: "mimado cachorro cachorros adulto adultos", answer: `${uses([13,12])}<p>Elegí según la etapa de tu perro. Para ajustar la cantidad diaria, revisá la tabla de alimentación del empaque según su peso.</p>` },
    { id: "gatos", topic: "mascotas", question: "¿Don Gato y Gati Mar y Tierra son para gatos adultos?", keywords: "gaty gato gatito edad meses", answer: `${periods([18,20], "Alimentos para gatos adultos")}<p>Si buscás alimento para un gatito, contanos su edad para consultar una opción adecuada.</p>` },
    { id: "omalina", topic: "equinos", question: "¿Qué diferencia hay entre Omalina 100, 200 y 300?", keywords: "caballo caballeria caballería yegua potro trabajo mantenimiento", answer: `${uses([6,7,8])}${periods([8], "Etapas de Omalina 300")}<p>La cantidad se define con la tabla de la etiqueta. Al consultar, indicá la edad, el peso aproximado y el trabajo que hace tu caballo.</p>` },
    { id: "suplementos-caballos", topic: "equinos", question: "¿Para qué sirven Forrajina y Caballería Forte?", keywords: "forraje fibra suplemento caballeria proteico calculadora racion peso", answer: `${uses([23,5])}<p>Cada producto cumple una función distinta en la alimentación. Revisá las indicaciones de su ficha y la tabla del saco para definir cómo incorporarlo.</p><div data-calc="horse"></div>` },
    { id: "guardar-alimento", topic: "manejo", question: "¿Cómo debo guardar los sacos de alimento?", keywords: "guardar almacenar bodega humedad plagas piso pared fecha lote", answer: `<ul><li>Mantenelos cerrados, bajo techo y protegidos de humedad, filtraciones y sol directo.</li><li>Dejá espacio alrededor de los sacos para facilitar la limpieza y la revisión de plagas.</li><li>Separá el alimento de químicos, medicamentos, combustibles y materiales que puedan contaminarlo.</li><li>Conservá visible el lote y la fecha, y usá primero el alimento que ingresó primero.</li></ul><p>Revisá periódicamente el estado de los sacos y del área de almacenamiento.</p>` },
    { id: "alimento-deteriorado", topic: "manejo", question: "¿Cómo reconozco alimento que no debo suministrar?", keywords: "moho olor rancio humedad grumos insectos roedores contaminado deteriorado", answer: `<p>Separá el saco si encontrás humedad, moho, olor anormal o rancio, grumos húmedos, insectos, daño de roedores o contaminación con químicos.</p><p>No lo mezclés con alimento en buen estado. Conservá el número de lote y consultá al proveedor antes de usarlo.</p>` },
    { id: "mezclar-alimento", topic: "manejo", question: "¿Puedo mezclar el alimento balanceado con maíz u otros ingredientes?", keywords: "mezclar maiz sorgo concentrado alimento completo suplemento diluir", answer: `<p>Primero revisá cómo está identificado el producto. Un <strong>alimento completo</strong> está formulado para cubrir la alimentación de la especie y etapa indicadas; agregar otros ingredientes cambia esa concentración nutricional.</p><p>Un <strong>suplemento o concentrado</strong> puede requerir mezcla, pero solamente según su tabla o fórmula de uso. No usés la misma regla para productos distintos.</p>` },

    { id: "conejos", topic: "conejos", question: "¿Qué alimento le doy a mis conejos?", keywords: "conejo coneja gazapos engorde", answer: `${uses([9])}<p>${escape(guide(9).feeding)} Sirve para todas las razas y edades, en presentación de ${escape(guide(9).presentation)}.</p><a class="guide-inline-link" href="products.html?type=alimentos&amp;category=conejos">Ver alimento para conejos →</a>` },
    { id: "ganado", topic: "conejos", question: "¿Qué tienen para ganado bovino, ovejas y cabras?", keywords: "vacas toros terneros bovinos ovinos caprinos ganado", answer: `<p>Por ahora el catálogo de alimentos balanceados no incluye una línea específica para ganado; consultanos por WhatsApp qué podemos conseguirte. En veterinaria sí tenemos productos indicados para bovinos, ovinos y caprinos:</p>${vetList(v => ["Bovinos", "Ovinos", "Caprinos"].some(sp => (v.species || []).includes(sp)))}${vetNote}` },
    { id: "vet-aves", topic: "veterinaria", question: "¿Qué vitaminas, electrolitos y antiparasitarios hay para aves?", keywords: "pollos gallinas vitaminas electrolitos desparasitante estres calor", answer: `<h3>Vitaminas, suplementos y electrolitos</h3>${vetList(v => bySpecies("Aves")(v) && ["vitaminas", "suplementos"].includes(v.category))}<h3>Antiparasitarios</h3>${vetList(v => bySpecies("Aves")(v) && v.category === "antiparasitarios")}${vetNote}<a class="guide-inline-link" href="products.html?type=medicinas">Ver toda la veterinaria →</a>` },
    { id: "vet-cerdos", topic: "veterinaria", question: "¿Qué productos veterinarios hay para cerdos?", keywords: "cerdos lechones desparasitante vitaminas antibiotico", answer: `${vetList(bySpecies("Cerdos"))}${vetNote}` },
    { id: "vet-mascotas", topic: "veterinaria", question: "¿Qué tienen para desparasitar y cuidar la piel de perros y gatos?", keywords: "pulgas garrapatas desparasitante shampoo piel perros gatos", answer: `<h3>Antiparasitarios internos y externos</h3>${vetList(v => (bySpecies("Perros")(v) || bySpecies("Gatos")(v)) && v.category === "antiparasitarios")}<h3>Cuidado de la piel</h3>${vetList(v => v.category === "dermatologicos")}${vetNote}` },
    { id: "vet-categorias", topic: "veterinaria", question: "¿Qué tipos de productos veterinarios manejan?", keywords: "antibioticos antiinflamatorios hormonales antisepticos categorias medicinas", answer: `<p>La sección de veterinaria se agrupa así (la cantidad puede variar según disponibilidad):</p><ul>${Object.entries(vetCategories).map(([key, label]) => { const n = VET.filter(v => v.category === key).length; return n ? `<li><a href="products.html?type=medicinas&amp;vet=${key}">${escape(label)}</a> · ${n} ${n === 1 ? "producto" : "productos"}</li>` : ""; }).join("")}</ul><p>Los antibióticos, antiinflamatorios y hormonales se entregan para uso bajo indicación del médico veterinario. Si tenés un animal enfermo, escribinos con la especie, la edad y los síntomas y te orientamos con quién consultar.</p>${vetNote}` },
    { id: "cambio-alimento", topic: "manejo", question: "¿Cómo hago el cambio de una etapa de alimento a la siguiente?", keywords: "transicion cambio etapa mezclar dias diarrea rechazo", answer: `<p>Las edades de cambio de cada programa están en las fichas de la tienda y en las preguntas de cada animal. Como <strong>recomendación general de manejo</strong> (no es una indicación del catálogo), muchos productores hacen la transición de forma gradual durante 3 a 5 días, mezclando el alimento nuevo con el anterior en proporciones crecientes, para que los animales no rechacen el alimento ni tengan trastornos digestivos.</p><p>Si el cambio coincide con otro manejo estresante (vacunación, traslado, destete), conviene separarlos unos días. Ante cualquier duda, consultanos indicando la especie, la edad y el alimento actual.</p>` },
    { id: "cuanto-dura-saco", topic: "manejo", question: "¿Cuánto tiempo me dura un saco de 100 lb?", keywords: "rendimiento saco dias calcular sacos cuantos necesito", answer: `<p>Depende de cuántos animales tenés y de su etapa. Las calculadoras de esta guía te dan la respuesta con tus propios números:</p><ul><li><a href="#consumo-pollos">Pollos de engorde</a>: alimento por etapa, total del lote y calendario de cambios.</li><li><a href="#postura">Gallinas ponedoras</a>: sacos por mes según la cantidad de gallinas.</li><li><a href="#consumo-cerdos">Cerdos</a>: sacos por etapa según programa y línea, con calendario.</li><li><a href="#suplementos-caballos">Caballos</a>: ración diaria de Forrajina según el peso.</li></ul>` },
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
  applyFilters();
  openHash();
})();
