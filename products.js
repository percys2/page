const productos = [
  // ========== ALIMENTOS - AVES ==========
  {
    id: 1,
    name: "Engordina",
    image: "./assets/engordina.png",
    description: "Alimento para aves en etapa de engorde",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento completo para pollos de engorde. Suministrar a libre acceso asegurando agua fresca y limpia disponible en todo momento.",
    feedingPlan: [
      { etapa: "Semana 1-2", cantidad: "25-50g/ave/dia", frecuencia: "Libre acceso" },
      { etapa: "Semana 3-4", cantidad: "80-120g/ave/dia", frecuencia: "Libre acceso" },
      { etapa: "Semana 5-6", cantidad: "150-180g/ave/dia", frecuencia: "Libre acceso" }
    ]
  },
  {
    id: 2,
    name: "Iniciarina",
    image: "./assets/iniciarina.JPG",
    description: "Alimento para pollos de engorde",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento de inicio para pollos. Ideal para las primeras semanas de vida. Mantener comederos limpios y agua fresca.",
    feedingPlan: [
      { etapa: "Dia 1-7", cantidad: "15-25g/ave/dia", frecuencia: "Libre acceso" },
      { etapa: "Dia 8-14", cantidad: "30-45g/ave/dia", frecuencia: "Libre acceso" },
      { etapa: "Dia 15-21", cantidad: "50-70g/ave/dia", frecuencia: "Libre acceso" }
    ]
  },
  {
    id: 3,
    name: "Novagallos",
    image: "./assets/novagallos.JPG",
    description: "Alimento para gallos de pelea",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento especializado para gallos de pelea. Alto contenido proteico para desarrollo muscular optimo.",
    feedingPlan: [
      { etapa: "Mantenimiento", cantidad: "80-100g/ave/dia", frecuencia: "2 veces al dia" },
      { etapa: "Entrenamiento", cantidad: "100-120g/ave/dia", frecuencia: "2 veces al dia" },
      { etapa: "Competencia", cantidad: "120-150g/ave/dia", frecuencia: "3 veces al dia" }
    ]
  },
  {
    id: 4,
    name: "Pre iniciarina",
    image: "./assets/preiniciarina.png",
    description: "Alimento para pollos en etapa inicial",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento pre-iniciador para pollitos recien nacidos. Textura fina para facil consumo.",
    feedingPlan: [
      { etapa: "Dia 1-3", cantidad: "10-15g/ave/dia", frecuencia: "Libre acceso" },
      { etapa: "Dia 4-7", cantidad: "15-25g/ave/dia", frecuencia: "Libre acceso" }
    ]
  },
  {
    id: 10,
    name: "Pollo Criollo",
    image: "./assets/pollocriollo.JPG",
    description: "Alimento para pollos criollos",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento balanceado para pollos criollos de patio. Complementar con pastoreo natural.",
    feedingPlan: [
      { etapa: "Crecimiento", cantidad: "60-80g/ave/dia", frecuencia: "2 veces al dia" },
      { etapa: "Adulto", cantidad: "100-120g/ave/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 11,
    name: "Ponedora Criolla",
    image: "./assets/ponedoracriolla.jpg",
    description: "Alimento para gallinas ponedoras criollas",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento para gallinas ponedoras. Rico en calcio para produccion de huevos de calidad.",
    feedingPlan: [
      { etapa: "Pre-postura", cantidad: "100-110g/ave/dia", frecuencia: "2 veces al dia" },
      { etapa: "Postura", cantidad: "120-130g/ave/dia", frecuencia: "2 veces al dia" }
    ]
  },

  // ========== ALIMENTOS - EQUINOS ==========
  {
    id: 5,
    name: "Cavalleria Forte",
    image: "./assets/cavalleria.png",
    description: "Alimento para caballos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento premium para caballos de trabajo y deporte. Suministrar junto con forraje de calidad.",
    feedingPlan: [
      { etapa: "Mantenimiento", cantidad: "2-3 kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Trabajo ligero", cantidad: "3-4 kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Trabajo intenso", cantidad: "4-6 kg/dia", frecuencia: "3 veces al dia" }
    ]
  },
  {
    id: 6,
    name: "Omalina 100",
    image: "./assets/omalina100.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento balanceado para equinos en etapa de crecimiento. Complementar con heno o pasto.",
    feedingPlan: [
      { etapa: "Potros 6-12 meses", cantidad: "1.5-2 kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Potros 12-24 meses", cantidad: "2-3 kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 7,
    name: "Omalina 200",
    image: "./assets/omalina200.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento para equinos adultos en mantenimiento. Ideal para caballos de paseo.",
    feedingPlan: [
      { etapa: "Mantenimiento", cantidad: "2-2.5 kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Actividad moderada", cantidad: "2.5-3.5 kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 8,
    name: "Omalina 300",
    image: "./assets/omalina300.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento de alto rendimiento para caballos de competencia y trabajo pesado.",
    feedingPlan: [
      { etapa: "Trabajo pesado", cantidad: "4-5 kg/dia", frecuencia: "3 veces al dia" },
      { etapa: "Competencia", cantidad: "5-6 kg/dia", frecuencia: "3 veces al dia" }
    ]
  },

  // ========== ALIMENTOS - PERROS ==========
  {
    id: 12,
    name: "Mimado Adulto 50 lbs",
    image: "./assets/mimadoadullto.JPG",
    description: "Alimento para perros adultos",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento completo para perros adultos. Servir en plato limpio con agua fresca disponible.",
    feedingPlan: [
      { etapa: "Perro pequeno (1-10kg)", cantidad: "80-180g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro mediano (10-25kg)", cantidad: "180-320g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro grande (25-45kg)", cantidad: "320-480g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 13,
    name: "Mimado Cachorro 50 lbs",
    image: "./assets/mimadocachorro.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento para cachorros en crecimiento. Rico en proteinas y calcio para desarrollo oseo.",
    feedingPlan: [
      { etapa: "2-4 meses", cantidad: "55-110g/dia", frecuencia: "3-4 veces al dia" },
      { etapa: "4-6 meses", cantidad: "110-180g/dia", frecuencia: "3 veces al dia" },
      { etapa: "6-12 meses", cantidad: "180-280g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 14,
    name: "Dogui Carne 1 lb",
    image: "./assets/doguicarne1lb.jpg",
    description: "Alimento para perros sabor carne",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento sabor carne para perros adultos. Presentacion practica de 1 libra.",
    feedingPlan: [
      { etapa: "Perro pequeno", cantidad: "80-150g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro mediano", cantidad: "150-280g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 15,
    name: "Dogui Carne y Vegetales",
    image: "./assets/doguicarneyvegetales.JPG",
    description: "Alimento para perros sabor carne y vegetales",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento balanceado con carne y vegetales. Nutricion completa para tu mascota.",
    feedingPlan: [
      { etapa: "Perro pequeno", cantidad: "80-150g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro mediano", cantidad: "150-280g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro grande", cantidad: "280-400g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 16,
    name: "Dogui Cachorro 1 lb",
    image: "./assets/doguicachorro1lb.jpg",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento especial para cachorros. Croquetas pequenas para facil masticacion.",
    feedingPlan: [
      { etapa: "2-4 meses", cantidad: "50-100g/dia", frecuencia: "3-4 veces al dia" },
      { etapa: "4-8 meses", cantidad: "100-180g/dia", frecuencia: "3 veces al dia" }
    ]
  },
  {
    id: 17,
    name: "Dogui Cachorros",
    image: "./assets/doguicachorros1lb.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento nutritivo para cachorros en desarrollo. Fortalece huesos y musculos.",
    feedingPlan: [
      { etapa: "2-4 meses", cantidad: "50-100g/dia", frecuencia: "3-4 veces al dia" },
      { etapa: "4-8 meses", cantidad: "100-180g/dia", frecuencia: "3 veces al dia" }
    ]
  },
  {
    id: 33,
    name: "Petmaster",
    image: "./assets/petmaster.JPG",
    description: "Alimento premium para mascotas",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium de alta digestibilidad. Ideal para perros con estomago sensible.",
    feedingPlan: [
      { etapa: "Perro pequeno", cantidad: "70-140g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro mediano", cantidad: "140-260g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro grande", cantidad: "260-380g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 34,
    name: "Petmaster Adulto 1 lb",
    image: "./assets/petmasteradulto1lb.jpg",
    description: "Alimento para perros adultos",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium para perros adultos. Presentacion de 1 libra.",
    feedingPlan: [
      { etapa: "Perro pequeno", cantidad: "70-140g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Perro mediano", cantidad: "140-260g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 35,
    name: "Petmaster Cachorro 1 lb",
    image: "./assets/petmastercachorro1lb.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium para cachorros. Alto contenido de DHA para desarrollo cerebral.",
    feedingPlan: [
      { etapa: "2-4 meses", cantidad: "45-90g/dia", frecuencia: "3-4 veces al dia" },
      { etapa: "4-8 meses", cantidad: "90-160g/dia", frecuencia: "3 veces al dia" }
    ]
  },

  // ========== ALIMENTOS - GATOS ==========
  {
    id: 18,
    name: "Don Gato 1 lb",
    image: "./assets/dongato1lb.jpg",
    description: "Alimento para gatos adultos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento completo para gatos adultos. Mantener agua fresca disponible siempre.",
    feedingPlan: [
      { etapa: "Gato adulto (3-5kg)", cantidad: "40-60g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Gato grande (5-7kg)", cantidad: "60-80g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 19,
    name: "Don Gato 17.6 lbs",
    image: "./assets/dongato.JPG",
    description: "Alimento para gatos adultos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento para gatos adultos. Presentacion economica de 17.6 libras.",
    feedingPlan: [
      { etapa: "Gato adulto (3-5kg)", cantidad: "40-60g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Gato grande (5-7kg)", cantidad: "60-80g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 20,
    name: "Gaty 1 lb",
    image: "./assets/gaty1lb.jpg",
    description: "Alimento para gatos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento balanceado para gatos de todas las edades.",
    feedingPlan: [
      { etapa: "Gatito (hasta 1 ano)", cantidad: "30-50g/dia", frecuencia: "3 veces al dia" },
      { etapa: "Gato adulto", cantidad: "40-65g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 21,
    name: "Gaty 17.6 lbs",
    image: "./assets/gaty17.JPG",
    description: "Alimento para gatos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento para gatos. Presentacion familiar de 17.6 libras.",
    feedingPlan: [
      { etapa: "Gatito (hasta 1 ano)", cantidad: "30-50g/dia", frecuencia: "3 veces al dia" },
      { etapa: "Gato adulto", cantidad: "40-65g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 22,
    name: "Gaty Pescado",
    image: "./assets/gatypescado.png",
    description: "Alimento para gatos sabor pescado",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento sabor pescado que encanta a los gatos. Rico en Omega 3.",
    feedingPlan: [
      { etapa: "Gato adulto (3-5kg)", cantidad: "40-60g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Gato grande (5-7kg)", cantidad: "60-80g/dia", frecuencia: "2 veces al dia" }
    ]
  },

  // ========== ALIMENTOS - CERDOS ==========
  {
    id: 24,
    name: "Neopigg 1",
    image: "./assets/nepigg1.png",
    description: "Alimento para cerdos etapa 1",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de inicio para lechones recien destetados. Alta palatabilidad.",
    feedingPlan: [
      { etapa: "Destete (7-12kg)", cantidad: "200-400g/dia", frecuencia: "4-5 veces al dia" },
      { etapa: "Post-destete (12-18kg)", cantidad: "400-600g/dia", frecuencia: "3-4 veces al dia" }
    ]
  },
  {
    id: 25,
    name: "Neopigg 2",
    image: "./assets/neopigg2.png",
    description: "Alimento para cerdos etapa 2",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de crecimiento para cerdos jovenes. Transicion desde Neopigg 1.",
    feedingPlan: [
      { etapa: "Crecimiento (18-30kg)", cantidad: "800-1200g/dia", frecuencia: "3 veces al dia" },
      { etapa: "Desarrollo (30-50kg)", cantidad: "1200-1800g/dia", frecuencia: "2-3 veces al dia" }
    ]
  },
  {
    id: 26,
    name: "Neopigg 4",
    image: "./assets/neopigg4.jpg",
    description: "Alimento para cerdos etapa 4",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de finalizacion para cerdos de engorde. Maximiza ganancia de peso.",
    feedingPlan: [
      { etapa: "Engorde (50-80kg)", cantidad: "2-2.5kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Finalizacion (80-100kg)", cantidad: "2.5-3kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 27,
    name: "Desarrollina",
    image: "./assets/desarrollina.png",
    description: "Alimento para cerdos en desarrollo",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdos en etapa de desarrollo. Promueve crecimiento uniforme.",
    feedingPlan: [
      { etapa: "Desarrollo (25-50kg)", cantidad: "1.2-1.8kg/dia", frecuencia: "2-3 veces al dia" },
      { etapa: "Pre-engorde (50-70kg)", cantidad: "1.8-2.2kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 28,
    name: "Jamonina",
    image: "./assets/jamonina.png",
    description: "Alimento para cerdos de engorde",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de engorde para cerdos. Optima conversion alimenticia.",
    feedingPlan: [
      { etapa: "Engorde (60-90kg)", cantidad: "2.2-2.8kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Finalizacion (90-110kg)", cantidad: "2.8-3.2kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 29,
    name: "Criacerdina",
    image: "./assets/criacerdina.png",
    description: "Alimento para cerdas en gestacion",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdas gestantes. Nutricion para desarrollo fetal optimo.",
    feedingPlan: [
      { etapa: "Gestacion temprana", cantidad: "1.8-2.2kg/dia", frecuencia: "2 veces al dia" },
      { etapa: "Gestacion tardia", cantidad: "2.5-3kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 30,
    name: "Lacticerdina",
    image: "./assets/lacticerdina.jpg",
    description: "Alimento para cerdas en lactancia",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdas lactantes. Alta energia para produccion de leche.",
    feedingPlan: [
      { etapa: "Lactancia (segun lechones)", cantidad: "4-7kg/dia", frecuencia: "3 veces al dia" }
    ]
  },
  {
    id: 31,
    name: "Pignova 5",
    image: "./assets/pignova5.png",
    description: "Alimento para cerdos Pignova fase 5",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento fase 5 del programa Pignova. Para cerdos en crecimiento.",
    feedingPlan: [
      { etapa: "Crecimiento", cantidad: "1.5-2kg/dia", frecuencia: "2-3 veces al dia" }
    ]
  },
  {
    id: 32,
    name: "Pignova 6",
    image: "./assets/pignova6.png",
    description: "Alimento para cerdos Pignova fase 6",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento fase 6 del programa Pignova. Para cerdos en finalizacion.",
    feedingPlan: [
      { etapa: "Finalizacion", cantidad: "2.5-3kg/dia", frecuencia: "2 veces al dia" }
    ]
  },

  // ========== ALIMENTOS - OTROS ==========
  {
    id: 9,
    name: "Conejos",
    image: "./assets/conejos.JPG",
    description: "Alimento para conejos",
    category: "otros",
    type: "alimentos",
    instructions: "Alimento peletizado para conejos. Complementar con heno y vegetales frescos.",
    feedingPlan: [
      { etapa: "Conejo joven", cantidad: "50-80g/dia", frecuencia: "2 veces al dia" },
      { etapa: "Conejo adulto", cantidad: "80-120g/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 23,
    name: "Forrajina",
    image: "./assets/forrajina.png",
    description: "Alimento forrajero para ganado",
    category: "otros",
    type: "alimentos",
    instructions: "Suplemento forrajero para ganado bovino. Complementa el pastoreo.",
    feedingPlan: [
      { etapa: "Ganado en pastoreo", cantidad: "2-4kg/dia", frecuencia: "1-2 veces al dia" },
      { etapa: "Ganado estabulado", cantidad: "4-6kg/dia", frecuencia: "2 veces al dia" }
    ]
  },
  {
    id: 36,
    name: "Puralean",
    image: "./assets/puralean.jpg",
    description: "Alimento balanceado premium",
    category: "otros",
    type: "alimentos",
    instructions: "Alimento premium multiproposito. Consultar dosis segun especie.",
    feedingPlan: [
      { etapa: "Consultar etiqueta", cantidad: "Segun especie", frecuencia: "Segun especie" }
    ]
  }
];

function getCategoryLabel(category) {
  const labels = {
    aves: 'Aves',
    perros: 'Perros',
    gatos: 'Gatos',
    cerdos: 'Cerdos',
    equinos: 'Equinos',
    otros: 'Otros'
  };
  return labels[category] || category;
}

function getTypeLabel(type) {
  const labels = {
    alimentos: 'Alimentos',
    medicinas: 'Medicinas',
    herramientas: 'Herramientas',
    accesorios: 'Accesorios'
  };
  return labels[type] || type;
}

function openProductModal(productId) {
  const product = productos.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('modal-product-content');

  let feedingPlanHTML = '';
  if (product.feedingPlan && product.feedingPlan.length > 0) {
    feedingPlanHTML = `
      <div class="modal-feeding-plan">
        <h4>Plan de Alimentacion</h4>
        <table class="feeding-table">
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Cantidad</th>
              <th>Frecuencia</th>
            </tr>
          </thead>
          <tbody>
            ${product.feedingPlan.map(plan => `
              <tr>
                <td>${plan.etapa}</td>
                <td>${plan.cantidad}</td>
                <td>${plan.frecuencia}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="modal-product-image">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="modal-product-details">
      <div class="modal-tags">
        <span class="modal-category">${getCategoryLabel(product.category)}</span>
        <span class="modal-type">${getTypeLabel(product.type)}</span>
      </div>
      <h2>${product.name}</h2>
      <p class="modal-description">${product.description}</p>
      
      <div class="modal-instructions">
        <h4>Instrucciones de Uso</h4>
        <p>${product.instructions || 'Consultar etiqueta del producto para instrucciones detalladas.'}</p>
      </div>

      ${feedingPlanHTML}

      <a href="https://wa.me/50582403490?text=Hola! Me interesa el producto: ${encodeURIComponent(product.name)}" target="_blank" class="modal-whatsapp-btn">
        Consultar por WhatsApp
      </a>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function renderProducts(productsToRender) {
  const container = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  
  countEl.textContent = `Mostrando ${productsToRender.length} producto${productsToRender.length !== 1 ? 's' : ''}`;
  
  if (productsToRender.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <h3>No se encontraron productos</h3>
        <p>Intenta con otra busqueda o categoria</p>
      </div>
    `;
    return;
  }

  container.innerHTML = productsToRender
    .map(product => `
      <div class="product-card" onclick="openProductModal(${product.id})">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <div class="product-tags">
            <span class="product-category">${getCategoryLabel(product.category)}</span>
            <span class="product-type">${getTypeLabel(product.type)}</span>
          </div>
          <h4 class="product-name">${product.name}</h4>
          <p class="product-description">${product.description}</p>
          <span class="product-view-more">Ver instrucciones</span>
        </div>
      </div>
    `)
    .join("");
}

let currentCategory = 'all';
let currentType = 'all';
let searchTerm = '';

function filterProducts() {
  let filtered = productos;

  if (currentType !== 'all') {
    filtered = filtered.filter(p => p.type === currentType);
  }

  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term)
    );
  }

  renderProducts(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts(productos);

  // Filtro por tipo de producto
  const typeBtns = document.querySelectorAll('.type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      filterProducts();
    });
  });

  // Filtro por animal/categoria
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      filterProducts();
    });
  });

  // Busqueda
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    filterProducts();
  });

  // Cerrar modal con click fuera
  const modal = document.getElementById('product-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProductModal();
    }
  });

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
    }
  });
});