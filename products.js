function readStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

let cart = readStoredList('agrocentro_cart');
let favorites = readStoredList('agrocentro_favorites');
let currentSort = 'default';
let currentView = 'grid';

function saveFavorites() {
  try {
    localStorage.setItem('agrocentro_favorites', JSON.stringify(favorites));
  } catch (error) {
    // Los favoritos siguen disponibles durante esta visita.
  }
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
  try {
    localStorage.setItem('agrocentro_cart', JSON.stringify(cart));
  } catch (error) {
    // El pedido sigue disponible durante esta visita.
  }
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

const productos = window.AGROCENTRO_PRODUCTS || [];

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

if (!window.AGROCENTRO_USE_NEW_STORE) {
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
}
