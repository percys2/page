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
  const topics = { aves: "Aves", cerdos: "Cerdos", mascotas: "Perros y gatos", equinos: "Caballos", compra: "Presentaciones y pedidos" };
  function periods(ids, caption) {
    return `<div class="guide-table-wrap" role="region" aria-label="${escape(caption)}" tabindex="0"><table><caption>${escape(caption)}</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Etapa y uso</th></tr></thead><tbody>${ids.map(id => `<tr><th scope="row">${link(id)}</th><td><strong>${escape(guide(id).stage)}</strong><span>${escape(guide(id).period)}</span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function uses(ids) {
    return `<ul class="guide-product-list">${ids.map(id => `<li>${link(id)}<span>${escape(guide(id).use)}</span></li>`).join("")}</ul>`;
  }
  const questions = [
    { id: "pollos-engorde", topic: "aves", question: "¿Qué alimento le toca a mi pollo según su edad?", keywords: "pollitos preinicio inicio engorde preiniciarina iniciarina engordina", answer: `<p>Para pollos de engorde, el programa avanza en tres etapas. Contá la edad del pollo desde su nacimiento:</p>${periods([4, 2, 1], "Etapas del pollo de engorde")}<p>Entrá a la ficha del saco para ver su presentación y sus características.</p>` },
    { id: "postura", topic: "aves", question: "¿Cuál es la diferencia entre Posturina Fase 1 y Posturina HP?", keywords: "gallinas ponedoras huevos postura patio granja", answer: `${uses([38, 39])}${periods([38, 39], "Uso de los alimentos de postura")}<p>Para gallinas criollas también tenés ${link(11)}, durante todo el ciclo de postura.</p><a class="guide-inline-link" href="products.html?type=alimentos&amp;category=aves&amp;stage=produccion">Ver alimentos de postura →</a>` },
    { id: "pollo-criollo", topic: "aves", question: "¿Para qué se usa Pollo Criollo?", keywords: "patio crecimiento engorde", answer: `${uses([10])}<p>Se usa durante el crecimiento y engorde de pollos criollos. Si tu gallina está produciendo huevos, revisá ${link(11)}.</p>` },
    { id: "novagallos", topic: "aves", question: "¿En qué etapa se usa Novagallos?", keywords: "gallos crecimiento adulto actividad", answer: `${uses([3])}<p><strong>Etapa:</strong> ${escape(guide(3).period)}.</p><p>Contanos la etapa y la actividad del gallo para orientarte sobre el alimento.</p>` },
    { id: "neopigg", topic: "cerdos", question: "¿A qué edad se usan NeoPigg 1, 2, 3 y 4?", keywords: "lechon lechones destete optimo plus dias fases", answer: `<p>Las edades se cuentan <strong>desde el nacimiento</strong>. Elegí un programa y seguí sus cuatro fases en orden.</p><div class="guide-table-wrap" role="region" aria-label="Edades de los programas NeoPigg" tabindex="0"><table><caption>Edad del lechón en días de vida</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Óptimo</th><th scope="col">Plus</th></tr></thead><tbody>${[24,25,37,26].map(id => `<tr><th scope="row">${link(id)}</th>${guide(id).agePrograms.map(program => `<td>${escape(program.days)} días</td>`).join("")}</tr>`).join("")}</tbody></table></div><p>Si no sabés qué programa lleva tu lote, contanos su edad y el alimento que está consumiendo antes de elegir la siguiente fase.</p>` },
    { id: "lineas-cerdos", topic: "cerdos", question: "¿Cómo elijo entre la línea estándar y la premium para cerdos?", keywords: "desarrollina jamonina pig nova pignova pignora 5 6 puralean pur a lean engorde", answer: `<p>Después de NeoPigg 4 tenés estas dos rutas. Cada una tiene sus propias etapas:</p><h3>Línea estándar</h3>${periods([27,28], "Desarrollina → Jamonina")}<h3>Línea premium</h3>${periods([31,32], "Pig-Nova 5 → Pig-Nova 6")}<p>En el programa tecnificado, ${link(36)} corresponde a la finalización después de Pig-Nova 6. Revisá su ficha para ver el período de uso.</p><p>Contanos la edad del lote, qué alimento usás y tu presupuesto para comparar las opciones.</p><div class="guide-related-links"><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=estandar">Ver línea estándar →</a><a href="products.html?type=alimentos&amp;category=cerdos&amp;line=premium">Ver línea premium →</a></div>` },
    { id: "cerdas", topic: "cerdos", question: "¿Se usa el mismo alimento durante gestación y lactancia?", keywords: "cerda criacerdina lacticerdina parto destete reproductoras", answer: `<p>Son dos etapas con productos distintos:</p>${periods([29,30], "Alimentos para cerdas reproductoras")}<p>Abrí cada ficha para consultar su uso y presentación.</p>` },
    { id: "pet-master", topic: "mascotas", question: "¿Cuándo se usa Pet Master Cachorros y cuándo Adultos?", keywords: "perro perros petmaster cachorro adulto meses", answer: `${periods([40,34], "Etapas de Pet Master")}<p>La ficha de cada producto te permite elegir entre la presentación pequeña y el saco.</p>` },
    { id: "mimados", topic: "mascotas", question: "¿Cuál Mimados elijo para mi perro?", keywords: "mimado cachorro cachorros adulto adultos", answer: `${uses([13,12])}<p>Elegí según la etapa de tu perro. Para ajustar la cantidad diaria, revisá la tabla de alimentación del empaque según su peso.</p>` },
    { id: "gatos", topic: "mascotas", question: "¿Don Gato y Gati Mar y Tierra son para gatos adultos?", keywords: "gaty gato gatito edad meses", answer: `${periods([18,20], "Alimentos para gatos adultos")}<p>Si buscás alimento para un gatito, contanos su edad para consultar una opción adecuada.</p>` },
    { id: "omalina", topic: "equinos", question: "¿Qué diferencia hay entre Omalina 100, 200 y 300?", keywords: "caballo caballeria caballería yegua potro trabajo mantenimiento", answer: `${uses([6,7,8])}${periods([8], "Etapas de Omalina 300")}<p>La cantidad se define con la tabla de la etiqueta. Al consultar, indicá la edad, el peso aproximado y el trabajo que hace tu caballo.</p>` },
    { id: "suplementos-caballos", topic: "equinos", question: "¿Para qué sirven Forrajina y Caballería Forte?", keywords: "forraje fibra suplemento caballeria proteico", answer: `${uses([23,5])}<p>Cada producto cumple una función distinta en la alimentación. Revisá las indicaciones de su ficha y la tabla del saco para definir cómo incorporarlo.</p>` },
    { id: "presentaciones", topic: "compra", question: "¿Cómo elijo entre una bolsa pequeña y un saco?", keywords: "libra libras 1 44 peso kilos kg pet master presentacion tamaño", answer: `<p>Abrí la ficha del producto y buscá <strong>“Elegí la presentación”</strong>. Seleccioná el tamaño antes de agregarlo al pedido; esa opción queda incluida en tu lista.</p><p>Por ejemplo, ${link(40)} tiene estas opciones:</p><ul>${MODEL.getVariants(product(40)).map(item => `<li><a href="products.html?product=${item.id}">${escape(MODEL.getGuide(item).presentation)}</a></li>`).join("")}</ul><p>Cuando el producto tiene una sola presentación, aparece directamente en su ficha. La disponibilidad se confirma por WhatsApp.</p>` },
    { id: "cantidad-diaria", topic: "compra", question: "¿Cuánto alimento debo dar al día?", keywords: "racion cantidad consumo peso dosis alimentar uso etiqueta", answer: `<p>La cantidad depende del producto, el animal, su peso y su etapa. Revisá la tabla de alimentación del saco que estás usando.</p><p>Para ayudarte a revisar la indicación, enviá una foto clara de la etiqueta y contanos el animal, su edad, su peso aproximado y qué alimento consume.</p>` },
    { id: "consulta-producto", topic: "compra", question: "¿Qué datos debo enviar para que me ayuden a elegir?", keywords: "asesoria ayuda consulta uso ganado vaca ternero vacas herramientas producto", answer: `<p>Enviá el nombre o una foto del producto y explicanos para qué lo necesitás. Si es alimento, agregá:</p><ul><li>Tipo de animal y cantidad de animales.</li><li>Edad, peso aproximado y etapa de producción.</li><li>Alimento que consumen actualmente.</li><li>Presentación que buscás y tu ubicación.</li></ul><p>Con esos datos podemos revisar las opciones y confirmar disponibilidad.</p>` },
    { id: "pedido-whatsapp", topic: "compra", question: "¿Qué pasa después de agregar productos a Mi pedido?", keywords: "carrito comprar pago precio precios whatsapp entrega delivery retiro disponibilidad", answer: `<ol><li><strong>Armá tu lista:</strong> elegí presentaciones y cantidades.</li><li><strong>Abrí Mi pedido:</strong> completá tus datos y la forma de entrega.</li><li><strong>Continuá por WhatsApp:</strong> revisá el mensaje y pulsá <strong>Enviar</strong>.</li><li><strong>Recibí la confirmación:</strong> te respondemos con disponibilidad, precios, opciones de entrega y total.</li></ol><p>Agregar al carrito guarda tu lista en este navegador. El pedido nos llega cuando enviás el mensaje por WhatsApp. La web no realiza cobros ni reserva productos automáticamente.</p><a class="guide-inline-link" href="products.html?cart=open">Revisar mi pedido →</a>` }
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
