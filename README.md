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

## Imágenes y estilos optimizados

Los archivos originales se conservan. `srcset` entrega versiones de 320, 640 o
960 píxeles según la pantalla; `src` mantiene la ruta original porque las máscaras
de los sacos dependen de ella. Las imágenes nuevas sin variantes siguen funcionando.

- Después de cambiar una fotografía, ejecutá `python scripts/generate-responsive-images.py`
  con Pillow instalado para regenerar `responsive-images.js` y las variantes activas.
- Después de editar CSS, ejecutá `python scripts/build-styles.py` y actualizá el
  enlace de cada página con el nombre indicado en `styles-manifest.json`. Actualizá
  también las rutas de los bundles en `vercel.json`.
- Los bundles conservan el orden de los estilos originales. Manrope se sirve
  desde `assets/fonts` con su licencia OFL. `--download-fonts` permite renovar
  las fuentes; no se necesita red para reconstruir los bundles existentes.
- Los recursos con hash tienen caché prolongada. HTML y scripts conservan
  revalidación; al cambiar los scripts, actualizá su parámetro de versión.
# Fichas de veterinaria

`veterinary-data.js` guarda los datos descriptivos y las fuentes de los 27 productos veterinarios. La categoría del producto y las especies se filtran por separado. Un valor `null` o una lista vacía identifica información pendiente; no debe completarse deduciendo una fórmula por el nombre comercial.

Antes de actualizar una ficha, contrastar el envase exacto y su fuente. Mantener nombre, descripción y precauciones de `catalog-data.js` coherentes con la ficha. Las presentaciones corresponden a las fotografías y no certifican existencias. No se incluyen pautas de tratamiento. Al modificar JavaScript, actualizar su versión en el HTML; al modificar estilos, regenerar el bundle y su referencia de caché.
