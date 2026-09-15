# AgroCentro Nica

Tienda estática para consultar el catálogo, armar un pedido y enviarlo al WhatsApp **8240 3490**. Los precios y la disponibilidad se confirman antes de preparar el pedido.

**¿Querés entender cómo funciona el código?** Leé la [Guía del código](docs/GUIA-DEL-CODIGO.md): explica cada
archivo, el recorrido de un pedido y los conceptos de JavaScript que se usan, con ejemplos del propio sitio.

## Carpetas

| Carpeta | Contenido |
|---|---|
| raíz | Las páginas (`index.html`, `products.html`, `guia-de-uso.html`, `contact.html`), `vercel.json`, `robots.txt` y `sitemap.xml` |
| `js/` | Comportamiento: tienda, guía, calculadoras, menú y formularios |
| `data/` | Catálogo, fichas de alimentos y de veterinaria, fotos de reemplazo y tamaños de fotos |
| `css/` | Estilos que se editan; `css/dist/` tiene los estilos compilados que cargan las páginas |
| `assets/` | Fotos, logos y fuentes |
| `productos/` | Una página por producto (generadas) |
| `scripts/` | Herramientas para generar estilos, páginas de productos y fotos |
| `tests/` | Pruebas automáticas |
| `docs/` | Guía del código |

## Cambiar la fotografía de un producto

1. Guardá la nueva fotografía dentro de `assets/`. Es preferible usar WebP o PNG con fondo limpio.
2. Buscá el ID del producto en `data/catalog-data.js`.
3. Agregá el ID y la nueva ruta en `data/image-overrides.js`.

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

- Después de cambiar una fotografía, ejecutá `python3 scripts/generate-responsive-images.py`
  con Pillow instalado para regenerar `data/responsive-images.js` y las variantes activas.
- Después de editar un archivo de `css/`, ejecutá `python3 scripts/build-styles.py`: crea los estilos
  compilados en `css/dist/`, cambia el enlace de cada página al archivo nuevo y borra los anteriores.
  Después ejecutá `node scripts/build-product-pages.cjs`, porque las páginas de productos usan los estilos de la tienda.
- Los estilos compilados conservan el orden de los originales. Dentro de `css/`, las rutas a imágenes y
  fuentes empiezan con `/assets/`. Manrope se sirve desde `assets/fonts` con su licencia OFL.
  `--download-fonts` permite renovar las fuentes; no se necesita red para compilar.
- Los recursos con hash tienen caché prolongada. HTML y scripts conservan
  revalidación; al cambiar un script, actualizá su parámetro de versión (`?v=`) en las páginas.

## Páginas de productos

Cada producto tiene su propia página en `productos/`, con título, descripción y foto para buscadores y para compartir.
Las páginas se generan desde el catálogo, las fichas y las imágenes; no se editan a mano. Después de cambiar un
producto, una ficha, una foto o el encabezado del sitio, ejecutá `node scripts/build-product-pages.cjs`: vuelve a
crear las páginas, borra las de productos que ya no existen y actualiza `sitemap.xml`.

## Pruebas

Antes de publicar, ejecutá:

- `node --test tests/product-pages.test.cjs`: falla si las páginas de productos o el sitemap quedaron desactualizados.
- `node --test tests/security-policy.test.cjs`
- `node --test tests/form-security.test.cjs`
- `node --test tests/guide-mobile.test.cjs`: abre la guía en Chrome sin ventana a 360 y 390 px de
  ancho, con todas las preguntas y calculadoras desplegadas, y falla si una tabla o un campo se sale
  de la pantalla. También revisa que el texto de la guía no cite de dónde vienen los datos. Si Chrome
  no está instalado, la parte del navegador se omite; con `CHROME_PATH` se puede usar otro navegador
  basado en Chromium.

## Fichas de veterinaria

`data/veterinary-data.js` guarda los datos descriptivos y las fuentes de los 27 productos veterinarios. La categoría del producto y las especies se filtran por separado. Un valor `null` o una lista vacía identifica información pendiente; no debe completarse deduciendo una fórmula por el nombre comercial.

Antes de actualizar una ficha, contrastar el envase exacto y su fuente. Mantener nombre, descripción y precauciones de `data/catalog-data.js` coherentes con la ficha. Las presentaciones corresponden a las fotografías y no certifican existencias. No se incluyen pautas de tratamiento. Al modificar JavaScript, actualizar su versión en el HTML; al modificar estilos, volver a compilarlos con `scripts/build-styles.py`.
