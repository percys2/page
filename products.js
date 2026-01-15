let cart = JSON.parse(localStorage.getItem('agrocentro_cart')) || [];
let favorites = JSON.parse(localStorage.getItem('agrocentro_favorites')) || [];
let currentSort = 'default';
let currentView = 'grid';

function saveFavorites() {
  localStorage.setItem('agrocentro_favorites', JSON.stringify(favorites));
  updateFavoriteButtons();
}

function toggleFavorite(productId, event) {
  if (event) {
    event.stopPropagation();
  }
  const index = favorites.indexOf(productId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(productId);
  }
  saveFavorites();
}

function isFavorite(productId) {
  return favorites.includes(productId);
}

function updateFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const productId = parseInt(btn.dataset.favorite);
    if (isFavorite(productId)) {
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', '#ff6b35');
    } else {
      btn.classList.remove('active');
      btn.querySelector('svg').setAttribute('fill', 'none');
    }
  });
}

function saveCart() {
  localStorage.setItem('agrocentro_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = totalItems;
  if (totalItems === 0) {
    countEl.classList.add('hidden');
  } else {
    countEl.classList.remove('hidden');
  }
}

function addToCart(productId, event) {
  if (event) {
    event.stopPropagation();
  }
  const product = productos.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      type: product.type,
      qty: 1
    });
  }
  saveCart();
  
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.classList.add('pulse');
    setTimeout(() => cartBtn.classList.remove('pulse'), 300);
  }
  
  const btn = document.querySelector(`[data-add-cart="${productId}"]`);
  if (btn) {
    btn.classList.add('added');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Agregado';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> Agregar';
    }, 1500);
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function updateCartQty(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;
  
  item.qty += change;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
  }
}

function clearCart() {
  cart = [];
  saveCart();
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  
  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Tu carrito esta vacio</p>';
    footer.classList.add('hidden');
    return;
  }
  
  footer.classList.remove('hidden');
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-category">${getCategoryLabel(item.category)} - ${getTypeLabel(item.type)}</div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="cart-qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openCart() {
  const modal = document.getElementById('cart-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCart() {
  const modal = document.getElementById('cart-modal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function sendWhatsAppOrder() {
  if (cart.length === 0) return;
  
  let message = '¡Hola! Me gustaria hacer el siguiente pedido:\n\n';
  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - Cantidad: ${item.qty}\n`;
  });
  message += '\n¿Me pueden dar el precio total y disponibilidad?';
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/50582403490?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

const productos = [
  // ========== ALIMENTOS - AVES ==========
  {
    id: 1,
    name: "Engordina",
    image: "./assets/engordina.png",
    description: "Alimento para aves en etapa de engorde",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento completo para pollos de engorde. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 2,
    name: "Iniciarina",
    image: "./assets/iniciarina.JPG",
    description: "Alimento para pollos de engorde",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento de inicio para pollos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 3,
    name: "Novagallos",
    image: "./assets/novagallos.JPG",
    description: "Alimento para gallos de pelea",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento especializado para gallos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 4,
    name: "Pre iniciarina",
    image: "./assets/preiniciarina.png",
    description: "Alimento para pollos en etapa inicial",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento pre-iniciador para pollitos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 10,
    name: "Pollo Criollo",
    image: "./assets/pollocriollo.JPG",
    description: "Alimento para pollos criollos",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento balanceado para pollos criollos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 11,
    name: "Ponedora Criolla",
    image: "./assets/ponedoracriolla.jpg",
    description: "Alimento para gallinas ponedoras criollas",
    category: "aves",
    type: "alimentos",
    instructions: "Alimento para gallinas ponedoras. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== ALIMENTOS - EQUINOS ==========
  {
    id: 5,
    name: "Cavalleria Forte",
    image: "./assets/cavalleria.png",
    description: "Alimento para caballos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento premium para caballos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 6,
    name: "Omalina 100",
    image: "./assets/omalina100.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento para equinos en crecimiento. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 7,
    name: "Omalina 200",
    image: "./assets/omalina200.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento para equinos adultos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 8,
    name: "Omalina 300",
    image: "./assets/omalina300.png",
    description: "Alimento balanceado para equinos",
    category: "equinos",
    type: "alimentos",
    instructions: "Alimento de alto rendimiento para caballos. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== ALIMENTOS - PERROS ==========
  {
    id: 12,
    name: "Mimado Adulto 50 lbs",
    image: "./assets/mimadoadullto.JPG",
    description: "Alimento para perros adultos",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento completo para perros adultos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 13,
    name: "Mimado Cachorro 50 lbs",
    image: "./assets/mimadocachorro.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento para cachorros en crecimiento. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 14,
    name: "Dogui Carne 1 lb",
    image: "./assets/doguicarne1lb.jpg",
    description: "Alimento para perros sabor carne",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento sabor carne para perros. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 15,
    name: "Dogui Carne y Vegetales",
    image: "./assets/doguicarneyvegetales.JPG",
    description: "Alimento para perros sabor carne y vegetales",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento balanceado con carne y vegetales. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 16,
    name: "Dogui Cachorro 1 lb",
    image: "./assets/doguicachorro1lb.jpg",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento especial para cachorros. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 17,
    name: "Dogui Cachorros",
    image: "./assets/doguicachorros1lb.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento nutritivo para cachorros. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 33,
    name: "Petmaster",
    image: "./assets/petmaster.JPG",
    description: "Alimento premium para mascotas",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium de alta digestibilidad. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 34,
    name: "Petmaster Adulto 1 lb",
    image: "./assets/petmasteradulto1lb.jpg",
    description: "Alimento para perros adultos",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium para perros adultos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 35,
    name: "Petmaster Cachorro 1 lb",
    image: "./assets/petmastercachorro1lb.JPG",
    description: "Alimento para cachorros",
    category: "perros",
    type: "alimentos",
    instructions: "Alimento premium para cachorros. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== ALIMENTOS - GATOS ==========
  {
    id: 18,
    name: "Don Gato 1 lb",
    image: "./assets/dongato1lb.jpg",
    description: "Alimento para gatos adultos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento completo para gatos adultos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 19,
    name: "Don Gato 17.6 lbs",
    image: "./assets/dongato.JPG",
    description: "Alimento para gatos adultos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento para gatos adultos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 20,
    name: "Gaty 1 lb",
    image: "./assets/gaty1lb.jpg",
    description: "Alimento para gatos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento balanceado para gatos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 21,
    name: "Gaty 17.6 lbs",
    image: "./assets/gaty17.JPG",
    description: "Alimento para gatos",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento para gatos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 22,
    name: "Gaty Pescado",
    image: "./assets/gatypescado.png",
    description: "Alimento para gatos sabor pescado",
    category: "gatos",
    type: "alimentos",
    instructions: "Alimento sabor pescado para gatos. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== ALIMENTOS - CERDOS ==========
  {
    id: 24,
    name: "Neopigg 1",
    image: "./assets/nepigg1.png",
    description: "Alimento para cerdos etapa 1",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de inicio para lechones. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 25,
    name: "Neopigg 2",
    image: "./assets/neopigg2.png",
    description: "Alimento para cerdos etapa 2",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de crecimiento para cerdos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 26,
    name: "Neopigg 4",
    image: "./assets/neopigg4.jpg",
    description: "Alimento para cerdos etapa 4",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de finalizacion para cerdos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 27,
    name: "Desarrollina",
    image: "./assets/desarrollina.png",
    description: "Alimento para cerdos en desarrollo",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdos en desarrollo. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 28,
    name: "Jamonina",
    image: "./assets/jamonina.png",
    description: "Alimento para cerdos de engorde",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento de engorde para cerdos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 29,
    name: "Criacerdina",
    image: "./assets/criacerdina.png",
    description: "Alimento para cerdas en gestacion",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdas gestantes. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 30,
    name: "Lacticerdina",
    image: "./assets/lacticerdina.jpg",
    description: "Alimento para cerdas en lactancia",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento para cerdas lactantes. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 31,
    name: "Pignova 5",
    image: "./assets/pignova5.png",
    description: "Alimento para cerdos Pignova fase 5",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento fase 5 del programa Pignova. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 32,
    name: "Pignova 6",
    image: "./assets/pignova6.png",
    description: "Alimento para cerdos Pignova fase 6",
    category: "cerdos",
    type: "alimentos",
    instructions: "Alimento fase 6 del programa Pignova. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== ALIMENTOS - OTROS ==========
  {
    id: 9,
    name: "Conejos",
    image: "./assets/conejos.JPG",
    description: "Alimento para conejos",
    category: "otros",
    type: "alimentos",
    instructions: "Alimento peletizado para conejos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 23,
    name: "Forrajina",
    image: "./assets/forrajina.png",
    description: "Alimento forrajero para ganado",
    category: "otros",
    type: "alimentos",
    instructions: "Suplemento forrajero para ganado. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 36,
    name: "Puralean",
    image: "./assets/puralean.jpg",
    description: "Alimento balanceado premium",
    category: "otros",
    type: "alimentos",
    instructions: "Alimento premium multiproposito. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 37,
    name: "Neopigg 3",
    image: "./assets/neopigg3.png",
    description: "Alimento balanceado premium",
    category: "otros",
    type: "alimentos",
    instructions: "Alimento premium para lechones en crecimiento. Consultar etiqueta del producto para dosis exactas."
  },


  // ========== HERRAMIENTAS ==========
  {
    id: 100,
    name: "Almadana Fibra de Vidrio",
    image: "./assets/almadanafibradevidrio.png",
    description: "Almadana con mango de fibra de vidrio resistente",
    category: "otros",
    type: "herramientas",
    instructions: "Herramienta de impacto para trabajos pesados. Mango de fibra de vidrio para mayor durabilidad."
  },
  {
    id: 101,
    name: "Almadana Mango de Madera",
    image: "./assets/almadanamangodemadera.png",
    description: "Almadana con mango tradicional de madera",
    category: "otros",
    type: "herramientas",
    instructions: "Almadana clasica con mango de madera. Ideal para demolicion y construccion."
  },
  {
    id: 102,
    name: "Atomizador 1 Litro",
    image: "./assets/atomizador1litro.png",
    description: "Atomizador manual de 1 litro de capacidad",
    category: "otros",
    type: "herramientas",
    instructions: "Atomizador portatil para aplicacion de liquidos. Ideal para pequenas areas."
  },
  {
    id: 103,
    name: "Azadon CA",
    image: "./assets/azadonCA.png",
    description: "Azadon de alta calidad para trabajo agricola",
    category: "otros",
    type: "herramientas",
    instructions: "Azadon resistente para labores de labranza y preparacion de suelos."
  },
  {
    id: 104,
    name: "Bieldo de Heno",
    image: "./assets/bieldoheno.jpg",
    description: "Bieldo para manejo de heno y forraje",
    category: "otros",
    type: "herramientas",
    instructions: "Herramienta esencial para mover heno, paja y forraje."
  },
  {
    id: 105,
    name: "Bomba Fumigadora 16 Litros",
    image: "./assets/bomba16litros.png.webp",
    description: "Bomba fumigadora de mochila 16 litros",
    category: "otros",
    type: "herramientas",
    instructions: "Bomba de mochila para fumigacion. Capacidad de 16 litros."
  },
  {
    id: 106,
    name: "Bomba Fumigar 5 Litros",
    image: "./assets/bombafumigar5litros.png.webp",
    description: "Bomba fumigadora portatil de 5 litros",
    category: "otros",
    type: "herramientas",
    instructions: "Bomba fumigadora compacta de 5 litros. Perfecta para jardines."
  },
  {
    id: 107,
    name: "Bomba Manual de Aire",
    image: "./assets/bombamanuaaldedaaire.png",
    description: "Bomba manual para inflar",
    category: "otros",
    type: "herramientas",
    instructions: "Bomba de aire manual multiusos. Util para inflar neumaticos y balones."
  },
  {
    id: 108,
    name: "Candado Laton Pulido",
    image: "./assets/candadolatonpulido.png",
    description: "Candado de laton pulido de alta seguridad",
    category: "otros",
    type: "herramientas",
    instructions: "Candado resistente de laton pulido. Ideal para asegurar portones y bodegas."
  },
  {
    id: 109,
    name: "Carretilla IMACASA",
    image: "./assets/carretilla-IMACASA.png",
    description: "Carretilla de construccion marca IMACASA",
    category: "otros",
    type: "herramientas",
    instructions: "Carretilla robusta para transporte de materiales. Rueda neumatica."
  },
  {
    id: 110,
    name: "Chuzo Forjado",
    image: "./assets/chuzoforjado.jpg",
    description: "Chuzo de acero forjado para excavacion",
    category: "otros",
    type: "herramientas",
    instructions: "Chuzo de acero forjado para romper suelos duros y rocas."
  },
  {
    id: 111,
    name: "Cinta Metrica Industrial 5m",
    image: "./assets/cintametricaindustrial5m.png",
    description: "Cinta metrica industrial de 5 metros",
    category: "otros",
    type: "herramientas",
    instructions: "Cinta metrica de uso industrial. 5 metros de longitud."
  },
  {
    id: 112,
    name: "Cinta Metrica Profesional 3m",
    image: "./assets/cintametricaprofesional3m.png",
    description: "Cinta metrica profesional de 3 metros",
    category: "otros",
    type: "herramientas",
    instructions: "Cinta metrica compacta de 3 metros."
  },
  {
    id: 113,
    name: "Cinta Sella Roscas",
    image: "./assets/cintasellaroscas.png",
    description: "Cinta de teflon para sellar roscas",
    category: "otros",
    type: "herramientas",
    instructions: "Cinta de teflon para sellar conexiones roscadas."
  },
  {
    id: 114,
    name: "Dispensador Cinta Empaque",
    image: "./assets/dispensadorcintaempaque.png",
    description: "Dispensador de cinta de empaque",
    category: "otros",
    type: "herramientas",
    instructions: "Dispensador ergonomico para cinta de empaque."
  },
  {
    id: 115,
    name: "Escoba Amarilla 30 Dientes",
    image: "./assets/escobaamarilla30dientes.png",
    description: "Escoba de jardin con 30 dientes",
    category: "otros",
    type: "herramientas",
    instructions: "Escoba de jardin para recoger hojas y residuos."
  },
  {
    id: 116,
    name: "Escoba Recta",
    image: "./assets/escobarecta.webp",
    description: "Escoba recta para limpieza",
    category: "otros",
    type: "herramientas",
    instructions: "Escoba recta multiusos para limpieza de pisos."
  },
  {
    id: 117,
    name: "Extension Electrica",
    image: "./assets/extensionelectrica.png",
    description: "Extension electrica multiusos",
    category: "otros",
    type: "herramientas",
    instructions: "Extension electrica para conectar equipos a distancia."
  },
  {
    id: 118,
    name: "Gato Hidraulico",
    image: "./assets/gatohidraulico.png",
    description: "Gato hidraulico para vehiculos",
    category: "otros",
    type: "herramientas",
    instructions: "Gato hidraulico de botella para levantar vehiculos."
  },
  {
    id: 119,
    name: "Juego de Destornilladores",
    image: "./assets/juegodestornilladores.png",
    description: "Set de destornilladores variados",
    category: "otros",
    type: "herramientas",
    instructions: "Juego completo de destornilladores con diferentes puntas."
  },
  {
    id: 120,
    name: "Juego Punta Taladro",
    image: "./assets/juegopuntaladro.png",
    description: "Set de brocas para taladro",
    category: "otros",
    type: "herramientas",
    instructions: "Juego de brocas para taladro. Varios tamanos."
  },
  {
    id: 121,
    name: "Lentes Ajustables",
    image: "./assets/lentesajustables.jpeg",
    description: "Lentes de seguridad ajustables",
    category: "otros",
    type: "herramientas",
    instructions: "Lentes de proteccion con patillas ajustables."
  },
  {
    id: 122,
    name: "Lentes Negros de Seguridad",
    image: "./assets/lentesnegros.jpg",
    description: "Lentes de seguridad oscuros",
    category: "otros",
    type: "herramientas",
    instructions: "Lentes de seguridad con filtro oscuro."
  },
  {
    id: 123,
    name: "Lima Cuadrada Bastarda",
    image: "./assets/limacuadradabastarda.png",
    description: "Lima cuadrada de corte bastardo",
    category: "otros",
    type: "herramientas",
    instructions: "Lima cuadrada para desbaste de metales."
  },
  {
    id: 124,
    name: "Lima Cuchillo Bastarda",
    image: "./assets/limacuchillobastarda.webp",
    description: "Lima tipo cuchillo de corte bastardo",
    category: "otros",
    type: "herramientas",
    instructions: "Lima tipo cuchillo para afilar y dar forma."
  },
  {
    id: 125,
    name: "Lima Cuchillo con Mango",
    image: "./assets/limacuchilloconmango.webp",
    description: "Lima tipo cuchillo con mango ergonomico",
    category: "otros",
    type: "herramientas",
    instructions: "Lima tipo cuchillo con mango de madera."
  },
  {
    id: 126,
    name: "Lima Motosierra",
    image: "./assets/limamotosierra.jpg",
    description: "Lima redonda para afilar motosierra",
    category: "otros",
    type: "herramientas",
    instructions: "Lima redonda especial para afilar cadenas de motosierra."
  },
  {
    id: 127,
    name: "Linterna 1 LED",
    image: "./assets/linterna1led.jpeg",
    description: "Linterna compacta de 1 LED",
    category: "otros",
    type: "herramientas",
    instructions: "Linterna portatil de 1 LED de alta potencia."
  },
  {
    id: 128,
    name: "Linterna 3 Cabezas",
    image: "./assets/linterna3cabezas.jpeg",
    description: "Linterna de 3 cabezas LED",
    category: "otros",
    type: "herramientas",
    instructions: "Linterna con 3 cabezas LED para iluminacion amplia."
  },
  {
    id: 129,
    name: "Linterna COB",
    image: "./assets/linternacob.jpeg",
    description: "Linterna con tecnologia COB",
    category: "otros",
    type: "herramientas",
    instructions: "Linterna con LED COB de alta luminosidad."
  },
  {
    id: 130,
    name: "Llave Ajustable",
    image: "./assets/llaveajustable.png",
    description: "Llave ajustable multiusos",
    category: "otros",
    type: "herramientas",
    instructions: "Llave ajustable de acero. Se adapta a diferentes tamanos."
  },
  {
    id: 131,
    name: "Llave de Laton",
    image: "./assets/llavedelaton.png",
    description: "Llave de paso de laton",
    category: "otros",
    type: "herramientas",
    instructions: "Llave de paso de laton para control de flujo de agua."
  },
  {
    id: 132,
    name: "Machete",
    image: "./assets/machete.webp",
    description: "Machete de uso agricola",
    category: "otros",
    type: "herramientas",
    instructions: "Machete de acero para labores agricolas."
  },
  {
    id: 133,
    name: "Machete 26 Pulgadas",
    image: "./assets/machete26pulgadas.webp",
    description: "Machete de 26 pulgadas",
    category: "otros",
    type: "herramientas",
    instructions: "Machete largo de 26 pulgadas. Mayor alcance."
  },
  {
    id: 134,
    name: "Machete 28 Pulgadas",
    image: "./assets/machete28pulgada.jpeg",
    description: "Machete de 28 pulgadas",
    category: "otros",
    type: "herramientas",
    instructions: "Machete extra largo de 28 pulgadas."
  },
  {
    id: 135,
    name: "Machete Cutacha",
    image: "./assets/machetecutacha.jpeg",
    description: "Machete tipo cutacha",
    category: "otros",
    type: "herramientas",
    instructions: "Machete cutacha tradicional. Hoja ancha."
  },
  {
    id: 136,
    name: "Machete Sierra",
    image: "./assets/machetesierra.png",
    description: "Machete con filo de sierra",
    category: "otros",
    type: "herramientas",
    instructions: "Machete con borde aserrado. Doble funcion."
  },
  {
    id: 137,
    name: "Stilson",
    image: "./assets/stilson.jpeg",
    description: "Llave Stilson para plomeria",
    category: "otros",
    type: "herramientas",
    instructions: "Llave Stilson de mordaza ajustable."
  },

  // ========== MEDICINAS ==========
  {
    id: 200,
    name: "Amoxi LH500",
    image: "./assets/Amoxi Lh500.jpg",
    description: "Antibiotico Amoxicilina LH500",
    category: "otros",
    type: "medicinas",
    instructions: "Antibiotico de amplio espectro. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 201,
    name: "Bolos Uterinos",
    image: "./assets/Bolos Uterinos.jpg",
    description: "Bolos uterinos para ganado",
    category: "otros",
    type: "medicinas",
    instructions: "Tratamiento intrauterino para ganado. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 202,
    name: "Bromexhina",
    image: "./assets/Broomexihina.jpg",
    description: "Expectorante veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Expectorante y mucolitico. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 203,
    name: "Calfstonic",
    image: "./assets/Calfstonic.jpg",
    description: "Suplemento vitaminico para terneros",
    category: "otros",
    type: "medicinas",
    instructions: "Tonico vitaminico para terneros. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 204,
    name: "Chicken Vit Plus",
    image: "./assets/Chicken vit plus.jpg",
    description: "Vitaminas para aves",
    category: "aves",
    type: "medicinas",
    instructions: "Complejo vitaminico para aves. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 205,
    name: "Dolfen",
    image: "./assets/dolfen.jpg",
    description: "Antiinflamatorio veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Antiinflamatorio y analgesico. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 206,
    name: "Doxiclina LH500",
    image: "./assets/Doxiclina Lh500.jpg",
    description: "Antibiotico Doxiciclina LH500",
    category: "otros",
    type: "medicinas",
    instructions: "Antibiotico de amplio espectro. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 207,
    name: "Electrolitos y Aminoacidos",
    image: "./assets/electrolitos.jpg",
    description: "Suplemento de electrolitos y minerales",
    category: "otros",
    type: "medicinas",
    instructions: "Rehidratante con electrolitos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 208,
    name: "Eritromicina Avicola",
    image: "./assets/eritroomicina avicola.jpg",
    description: "Antibiotico para aves",
    category: "aves",
    type: "medicinas",
    instructions: "Antibiotico especifico para aves. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 209,
    name: "Fenbendazol",
    image: "./assets/fenbendazol.jpg",
    description: "Desparasitante de amplio espectro",
    category: "otros",
    type: "medicinas",
    instructions: "Antiparasitario interno. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 210,
    name: "Ivermectina Oral",
    image: "./assets/livermectina oral.jpg",
    description: "Antiparasitario oral",
    category: "otros",
    type: "medicinas",
    instructions: "Ivermectina de administracion oral. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 211,
    name: "Oxitolac",
    image: "./assets/oxitolac.jpg",
    description: "Oxitocina veterinaria",
    category: "otros",
    type: "medicinas",
    instructions: "Oxitocina para uso veterinario. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 212,
    name: "Selevit E",
    image: "./assets/selevit e.jpg",
    description: "Selenio y Vitamina E",
    category: "otros",
    type: "medicinas",
    instructions: "Suplemento de selenio y vitamina E. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 213,
    name: "Vitamina K",
    image: "./assets/vitamina k.jpg",
    description: "Vitamina K inyectable",
    category: "otros",
    type: "medicinas",
    instructions: "Vitamina K para uso veterinario. Consultar etiqueta del producto para dosis exactas."
  },

  // ========== HERRAMIENTAS NUEVAS ==========
  {
    id: 214,
    name: "Tenaza de Presion",
    image: "./assets/tenazaddepreesion.jpeg",
    description: "Tenaza de presion para sujecion firme",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza de presion con mordaza ajustable. Ideal para trabajos de soldadura y mecanica."
  },
  {
    id: 215,
    name: "Tenaza de Electricista",
    image: "./assets/tenazaaddeeectricistaa.png",
    description: "Tenaza profesional para electricistas",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza aislada para trabajos electricos. Corte y pelado de cables."
  },
  {
    id: 216,
    name: "Tenaza de Chofer",
    image: "./assets/tenazadechofer.png",
    description: "Tenaza multiusos tipo chofer",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza versatil para multiples usos. Agarre firme y duradero."
  },
  {
    id: 217,
    name: "Tenaza para Podar",
    image: "./assets/tenazaparapodar.png",
    description: "Tenaza de poda para jardineria",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza de poda con filo de acero. Ideal para ramas pequenas y medianas."
  },
  {
    id: 218,
    name: "Tenaza Finquera",
    image: "./assets/tenzafinquera.jpg",
    description: "Tenaza finquera para trabajo agricola",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza resistente para labores de finca. Corte de alambre y cercas."
  },
  {
    id: 219,
    name: "Tenaza Armador",
    image: "./assets/enazarmaor.jpeg",
    description: "Tenaza de armador para construccion",
    category: "otros",
    type: "herramientas",
    instructions: "Tenaza de armador para doblar y cortar varilla. Uso en construccion."
  },
  {
    id: 220,
    name: "Pala Cuadrada",
    image: "./assets/palacuadrada.png",
    description: "Pala cuadrada para construccion",
    category: "otros",
    type: "herramientas",
    instructions: "Pala cuadrada de acero. Ideal para mezclar y cargar materiales."
  },
  {
    id: 221,
    name: "Pala Redonda",
    image: "./assets/palaredonda.webp",
    description: "Pala redonda para excavacion",
    category: "otros",
    type: "herramientas",
    instructions: "Pala redonda para cavar y excavar. Mango ergonomico."
  },
  {
    id: 222,
    name: "Pala Mango Metalico",
    image: "./assets/palamangometalico.webp",
    description: "Pala con mango metalico reforzado",
    category: "otros",
    type: "herramientas",
    instructions: "Pala con mango de metal resistente. Mayor durabilidad."
  },
  {
    id: 223,
    name: "Pala Plegable",
    image: "./assets/palaplegable.png",
    description: "Pala plegable portatil",
    category: "otros",
    type: "herramientas",
    instructions: "Pala compacta y plegable. Facil de transportar."
  },
  {
    id: 224,
    name: "Pala Acova Hoyos",
    image: "./assets/palaacovahoyos.jpeg",
    description: "Pala especial para hacer hoyos",
    category: "otros",
    type: "herramientas",
    instructions: "Pala para cavar hoyos profundos. Ideal para postes y arboles."
  },
  {
    id: 225,
    name: "Piocha",
    image: "./assets/piocha.png",
    description: "Piocha para trabajo pesado",
    category: "otros",
    type: "herramientas",
    instructions: "Piocha de acero forjado. Para romper suelos duros."
  },
  {
    id: 226,
    name: "Rastrillo 16 Dientes",
    image: "./assets/rastrillo16ddientes.jpg",
    description: "Rastrillo de 16 dientes",
    category: "otros",
    type: "herramientas",
    instructions: "Rastrillo metalico de 16 dientes. Para nivelar y limpiar terrenos."
  },
  {
    id: 227,
    name: "Rastrillo Jardinero 16 Dientes",
    image: "./assets/rastrillojardinero16ddientes.jpeg",
    description: "Rastrillo de jardinero con 16 dientes",
    category: "otros",
    type: "herramientas",
    instructions: "Rastrillo para jardineria. Recoleccion de hojas y residuos."
  },
  {
    id: 228,
    name: "Rastrillo Uso Pesado",
    image: "./assets/rastrillousopesado.png",
    description: "Rastrillo de uso pesado industrial",
    category: "otros",
    type: "herramientas",
    instructions: "Rastrillo reforzado para trabajos pesados. Alta resistencia."
  },
  {
    id: 229,
    name: "Mazo de Hule",
    image: "./assets/mazodehule.png",
    description: "Mazo de hule para golpes suaves",
    category: "otros",
    type: "herramientas",
    instructions: "Mazo de goma para trabajos delicados. No dana superficies."
  },
  {
    id: 230,
    name: "Mini Bomba de Aire",
    image: "./assets/minibombadeaire.png",
    description: "Mini bomba de aire portatil",
    category: "otros",
    type: "herramientas",
    instructions: "Bomba de aire compacta. Ideal para bicicletas y balones."
  },
  {
    id: 231,
    name: "Pistola Plastica Jardineria",
    image: "./assets/pistolaaplaticajrdineria.png",
    description: "Pistola de riego para jardineria",
    category: "otros",
    type: "herramientas",
    instructions: "Pistola de riego con multiples patrones. Para manguera de jardin."
  },
  {
    id: 232,
    name: "Porta Herramientas",
    image: "./assets/portaaherramientas.png",
    description: "Porta herramientas de cinturon",
    category: "otros",
    type: "herramientas",
    instructions: "Porta herramientas para cinturon. Organiza tus herramientas."
  },
  {
    id: 233,
    name: "Portalampara",
    image: "./assets/portalampara.jpeg",
    description: "Portalampara electrico",
    category: "otros",
    type: "herramientas",
    instructions: "Portalampara para instalacion electrica. Facil instalacion."
  },
  {
    id: 234,
    name: "Regleta Electrica",
    image: "./assets/regleta.webp",
    description: "Regleta electrica multicontacto",
    category: "otros",
    type: "herramientas",
    instructions: "Regleta con multiples tomas. Proteccion contra sobrecarga."
  },
  {
    id: 235,
    name: "Regleta con USB",
    image: "./assets/regletaconusb.jpg",
    description: "Regleta electrica con puertos USB",
    category: "otros",
    type: "herramientas",
    instructions: "Regleta con tomas electricas y puertos USB integrados."
  },
  {
    id: 236,
    name: "Rociadora de Presion",
    image: "./assets/rociadoradepresion.jpeg",
    description: "Rociadora de presion manual",
    category: "otros",
    type: "herramientas",
    instructions: "Rociadora de presion para aplicacion de liquidos. Uso agricola."
  },
  {
    id: 237,
    name: "Valvula Esfera de Laton",
    image: "./assets/valvulaaesferadedlaton.jpeg",
    description: "Valvula de esfera de laton",
    category: "otros",
    type: "herramientas",
    instructions: "Valvula de paso tipo esfera. Control de flujo de agua."
  },

  // ========== MEDICINAS NUEVAS ==========
  {
    id: 238,
    name: "Antitermico AleBet",
    image: "./assets/antitermico-AleBet.jpg",
    description: "Antitermico y analgesico veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Reduce fiebre y alivia dolor. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 239,
    name: "Ascorbol",
    image: "./assets/ascorbol.webp",
    description: "Vitamina C veterinaria",
    category: "otros",
    type: "medicinas",
    instructions: "Suplemento de vitamina C. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 240,
    name: "Azul Piotanico",
    image: "./assets/azulpiotanico.webp",
    description: "Desinfectante azul de metileno",
    category: "otros",
    type: "medicinas",
    instructions: "Antiseptico y desinfectante. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 241,
    name: "Bronccowell",
    image: "./assets/bronccowell.webp",
    description: "Tratamiento respiratorio veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Para problemas respiratorios. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 242,
    name: "Dermacalm",
    image: "./assets/dermacalm.jpeg",
    description: "Tratamiento dermatologico veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Para problemas de piel. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 243,
    name: "Dermatryl",
    image: "./assets/dermatryl.png",
    description: "Spray dermatologico veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Tratamiento topico para heridas y piel. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 244,
    name: "Desparasitante",
    image: "./assets/desparasitante.jpg",
    description: "Desparasitante de amplio espectro",
    category: "otros",
    type: "medicinas",
    instructions: "Elimina parasitos internos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 245,
    name: "Electrowell",
    image: "./assets/electrowell.jpeg",
    description: "Electrolitos veterinarios",
    category: "otros",
    type: "medicinas",
    instructions: "Rehidratante con electrolitos. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 246,
    name: "Endal Plus",
    image: "./assets/endalplus.jpeg",
    description: "Desparasitante interno",
    category: "otros",
    type: "medicinas",
    instructions: "Antiparasitario de amplio espectro. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 247,
    name: "Enrozol",
    image: "./assets/enrozol.jpeg",
    description: "Antibiotico veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Antibiotico de uso veterinario. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 248,
    name: "Eriprin",
    image: "./assets/eriprin.jpeg",
    description: "Antibiotico eritromicina",
    category: "otros",
    type: "medicinas",
    instructions: "Antibiotico de amplio espectro. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 249,
    name: "Fibronex",
    image: "./assets/fibronex.png",
    description: "Suplemento de fibra veterinario",
    category: "otros",
    type: "medicinas",
    instructions: "Suplemento digestivo. Consultar etiqueta del producto para dosis exactas."
  },
  {
    id: 250,
    name: "Fortalizador",
    image: "./assets/fortalizador.jpeg",
    description: "Vitaminas y minerales fortalecedores",
    category: "otros",
    type: "medicinas",
    instructions: "Suplemento vitaminico fortalecedor. Consultar etiqueta del producto para dosis exactas."
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
        <p>${product.instructions}</p>
      </div>

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
      <div class="product-card">
        <div class="product-image" onclick="openProductModal(${product.id})">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-tags">
            <span class="product-category">${getCategoryLabel(product.category)}</span>
            <span class="product-type">${getTypeLabel(product.type)}</span>
          </div>
          <h4 class="product-name" onclick="openProductModal(${product.id})">${product.name}</h4>
          <p class="product-description">${product.description}</p>
          <div class="product-actions">
            <button class="favorite-btn" data-favorite="${product.id}" onclick="toggleFavorite(${product.id}, event)" aria-label="Agregar a favoritos">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            <button class="add-to-cart-btn" data-add-cart="${product.id}" onclick="addToCart(${product.id}, event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Agregar
            </button>
          </div>
        </div>
      </div>
    `)
    .join("");
}

let currentCategory = 'all';
let currentType = 'all';
let searchTerm = '';
let currentSortOrder = 'default';
let currentViewMode = 'grid';
let currentPage = 1;
const productsPerPage = 12;
let filteredProducts = [];

function sortProducts(products, order) {
  const sorted = [...products];
  switch(order) {
    case 'az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'recent':
      return sorted.sort((a, b) => b.id - a.id);
    default:
      return sorted;
  }
}

function renderPagination(totalProducts) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="pagination-dots">...</span>`;
    }
  }
  
  html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
  
  paginationContainer.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProductsWithPagination();
  window.scrollTo({ top: document.querySelector('.products-section').offsetTop - 100, behavior: 'smooth' });
}

function renderProductsWithPagination() {
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);
  renderProducts(productsToShow);
  renderPagination(filteredProducts.length);
  
  const countEl = document.getElementById('products-count');
  countEl.textContent = `Mostrando ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} de ${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`;
}

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

  filtered = sortProducts(filtered, currentSortOrder);
  filteredProducts = filtered;
  currentPage = 1;
  renderProductsWithPagination();
  updateFavoriteButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  filteredProducts = productos;
  renderProductsWithPagination();
  updateFavoriteButtons();

  const typeBtns = document.querySelectorAll('.type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      filterProducts();
    });
  });

  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      filterProducts();
    });
  });

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    filterProducts();
  });

  const modal = document.getElementById('product-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
    }
  });

  const filtersToggle = document.getElementById('filters-toggle');
  const filtersContent = document.getElementById('filters-content');
  
  if (filtersToggle && filtersContent) {
    filtersToggle.addEventListener('click', () => {
      filtersToggle.classList.toggle('active');
      filtersContent.classList.toggle('active');
    });
  }

  // Sort functionality
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSortOrder = e.target.value;
      filterProducts();
    });
  }

  // View toggle functionality
  const viewBtns = document.querySelectorAll('.view-btn');
  const productsGrid = document.getElementById('products-grid');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentViewMode = btn.dataset.view;
      if (currentViewMode === 'list') {
        productsGrid.classList.add('list-view');
      } else {
        productsGrid.classList.remove('list-view');
      }
    });
  });

  // Cart functionality
  updateCartCount();
  
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', openCart);
  }
  
  const cartClose = document.getElementById('cart-close');
  if (cartClose) {
    cartClose.addEventListener('click', closeCart);
  }
  
  const cartClear = document.getElementById('cart-clear');
  if (cartClear) {
    cartClear.addEventListener('click', clearCart);
  }
  
  const cartWhatsapp = document.getElementById('cart-whatsapp');
  if (cartWhatsapp) {
    cartWhatsapp.addEventListener('click', sendWhatsAppOrder);
  }
  
  const cartModal = document.getElementById('cart-modal');
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) {
        closeCart();
      }
    });
  }

  // Carousel functionality
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  let currentSlide = 0;
  let carouselInterval;

  function showSlide(index) {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startCarousel() {
    carouselInterval = setInterval(nextSlide, 5000);
  }

  function stopCarousel() {
    clearInterval(carouselInterval);
  }

  if (slides.length > 0) {
    if (prevBtn) prevBtn.addEventListener('click', () => { stopCarousel(); prevSlide(); startCarousel(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopCarousel(); nextSlide(); startCarousel(); });
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopCarousel();
        showSlide(index);
        startCarousel();
      });
    });

    startCarousel();
  }
});
