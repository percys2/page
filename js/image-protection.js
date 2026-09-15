(function () {
  "use strict";

  // Disuade el guardado desde la interfaz; las imágenes públicas siguen siendo accesibles.
  const imageAreas = ".home-product-image, .product-image, .modal-product-image, .cart-item-image";

  function preventImageSave(event) {
    const target = event.target;
    if (target instanceof Element && target.closest(imageAreas)) {
      event.preventDefault();
    }
  }

  document.addEventListener("contextmenu", preventImageSave);
  document.addEventListener("dragstart", preventImageSave);
})();
