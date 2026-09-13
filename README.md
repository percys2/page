# AgroCentro Nica

Tienda estática para consultar el catálogo, armar un pedido y enviarlo al WhatsApp **8240 3490**. Los precios y la disponibilidad se confirman antes de preparar el pedido.

## Cambiar la fotografía de un producto

1. Guardá la nueva fotografía dentro de `assets/`. Es preferible usar WebP o PNG con fondo limpio.
2. Buscá el ID del producto en `products.js`.
3. Agregá el ID y la nueva ruta en `image-overrides.js`.

Ejemplo:

```js
window.AGROCENTRO_IMAGE_OVERRIDES = {
  1: "./assets/engordina-nueva.webp",
  28: "./assets/jamonina-nueva.webp"
};
```

Así se pueden cambiar imágenes sin modificar la información del catálogo. Si una imagen no carga, la tienda muestra el logo en su lugar.

## Flujo del pedido

El cliente puede buscar y filtrar productos, agregarlos al pedido, indicar cantidades, completar sus datos y elegir retiro o entrega. Al finalizar, la página prepara un mensaje de WhatsApp con número de pedido, datos del cliente, productos y notas.
