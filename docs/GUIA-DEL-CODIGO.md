# Guía del código de AgroCentro Nica

Esta guía explica **cómo está hecho el sitio** agrocentronica.com, archivo por archivo, y **los conceptos de
JavaScript** que usa. Está pensada para aprender leyendo el código real de tu tienda: cada idea viene con un
ejemplo sacado de estos archivos.

> Consejo: tené abiertos el archivo que se explica y esta guía lado a lado. Leé primero la sección, después
> buscá la función en el archivo (Cmd+F) y compará.

## Índice

1. [Qué es este sitio](#1-qué-es-este-sitio)
2. [Cómo llega a internet](#2-cómo-llega-a-internet)
3. [Mapa de carpetas](#3-mapa-de-carpetas)
4. [Qué pasa cuando alguien abre una página](#4-qué-pasa-cuando-alguien-abre-una-página)
5. [Los datos: `data/`](#5-los-datos-data)
6. [El modelo del catálogo: `js/catalog-model.js`](#6-el-modelo-del-catálogo-jscatalog-modeljs)
7. [La tienda: `js/store.js`](#7-la-tienda-jsstorejs)
8. [La guía de uso: `js/usage-guide.js`](#8-la-guía-de-uso-jsusage-guidejs)
9. [Las calculadoras: `js/usage-guide-programs.js`](#9-las-calculadoras-jsusage-guide-programsjs)
10. [Los scripts pequeños: `site.js`, `splash.js`, `image-protection.js`](#10-los-scripts-pequeños)
11. [Los estilos: `css/` y `css/dist/`](#11-los-estilos-css-y-cssdist)
12. [Seguridad](#12-seguridad)
13. [Velocidad](#13-velocidad)
14. [Páginas de productos y Google](#14-páginas-de-productos-y-google)
15. [Las pruebas: `tests/`](#15-las-pruebas-tests)
16. [Conceptos de JavaScript](#16-conceptos-de-javascript)
17. [Recetas: cómo hacer cambios comunes](#17-recetas-cómo-hacer-cambios-comunes)
18. [Ejercicios para practicar](#18-ejercicios-para-practicar)
19. [Glosario](#19-glosario)

---

## 1. Qué es este sitio

agrocentronica.com es un **sitio estático**: no hay una base de datos ni un programa corriendo en un servidor
propio. Son archivos (HTML, CSS, JavaScript e imágenes) que el navegador descarga y ejecuta.

- **HTML** es la estructura: títulos, botones, formularios.
- **CSS** es la apariencia: colores, tamaños, cómo se acomoda en el celular.
- **JavaScript (JS)** es el comportamiento: filtrar productos, armar el pedido, calcular sacos.

Todo lo "inteligente" pasa **en el teléfono o la computadora del cliente**. Por ejemplo, el carrito se guarda
en el propio navegador (en `localStorage`) y el pedido se envía abriendo WhatsApp con un mensaje ya escrito.
No hay pagos en línea ni cuentas de usuario, y por eso el sitio es simple, barato de mantener y difícil de
atacar.

## 2. Cómo llega a internet

```
Tu computadora ──► GitHub ──► Vercel ──► agrocentronica.com
 (se edita)        (se guarda)  (se publica)  (lo ve la gente)
```

| Pieza | Qué hace |
|---|---|
| **Git** | Programa que guarda el historial de cambios de la carpeta. Cada cambio guardado es un **commit**. |
| **GitHub** | Guarda la copia oficial en internet (`percys2/page`) y los **PR** (propuestas de cambio). |
| **Rama (branch)** | Una línea de trabajo separada. `main` es la oficial; los cambios nuevos se hacen en otra rama. |
| **PR (pull request)** | Pide juntar una rama con `main`. Ahí se revisa y se prueba antes de publicar. |
| **Merge** | Aceptar el PR: los cambios pasan a `main`. |
| **Vercel** | Está conectado a GitHub. Cada vez que `main` cambia, publica la carpeta en agrocentronica.com. Para cada PR crea una **vista previa** privada. |

`vercel.json` le dice a Vercel cosas extra: cabeceras de seguridad, cuánto tiempo guardar archivos en caché y
redirecciones (por ejemplo, `/animals.html` → `/products.html`).

`.vercelignore` lista lo que **no** se publica: `docs/`, `scripts/`, `tests/`, el README y los CSS sin compilar.
Esos archivos solo sirven para trabajar en el código; el sitio no los necesita.

Las visitas se cuentan con **Vercel Web Analytics**: cada página carga `/_vercel/insights/script.js`, un
archivo que Vercel sirve solo en el sitio publicado (en tu computadora da "no encontrado", y está bien). No usa
cookies. Los números se ven en Vercel → proyecto `page` → **Analytics**.

## 3. Mapa de carpetas

```
page/
├── index.html            Portada
├── products.html         Tienda (catálogo, ficha, carrito, pedido)
├── guia-de-uso.html      Guía de uso y preguntas frecuentes
├── contact.html          Contacto y sucursales
├── google….html          Archivo que Google usa para confirmar que el sitio es tuyo
├── robots.txt            Instrucciones para los buscadores
├── sitemap.xml           Lista de páginas para Google (incluye las de productos)
├── vercel.json           Configuración de publicación: seguridad, caché, redirecciones
├── README.md             Instrucciones cortas de mantenimiento
│
├── css/                  Estilos que SE EDITAN
│   ├── site.css            Base de todo el sitio
│   ├── products.css        Tienda
│   ├── product-detail.css  Ficha del producto
│   ├── usage-guide.css     Guía de uso y calculadoras
│   ├── mobile.css          Ajustes para celular
│   ├── …                   (marca, marketing, recortes de fotos, fuentes)
│   └── dist/               Estilos COMPILADOS (no se editan; los genera scripts/build-styles.py)
│       ├── styles-index-<hash>.css
│       ├── styles-products-<hash>.css
│       ├── styles-contact-<hash>.css
│       ├── styles-guia-de-uso-<hash>.css
│       └── styles-manifest.json   Qué archivo compilado usa cada página
│
├── js/                   Comportamiento
│   ├── catalog-model.js        Funciones para consultar el catálogo (lo usan todos)
│   ├── store.js                La tienda completa
│   ├── usage-guide.js          Las preguntas de la guía
│   ├── usage-guide-programs.js Las calculadoras y el comparador de gallinas
│   ├── site.js                 Menú, contador del carrito, portada y formulario de contacto
│   ├── splash.js               Animación de entrada
│   └── image-protection.js     Evita guardar fotos con clic derecho
│
├── data/                 Información (sin lógica)
│   ├── catalog-data.js         Los productos: nombre, foto, tipo, categoría
│   ├── feed-guides.js          Fichas de alimentos: etapa, edad, presentación, análisis
│   ├── veterinary-data.js      Fichas de productos veterinarios
│   ├── image-overrides.js      Fotos que reemplazan a las del catálogo
│   └── responsive-images.js    Tamaños reducidos de cada foto (generado)
│
├── assets/               Fotos, logos y fuentes
│   ├── responsive/            Fotos en 320, 640 y 960 px (generadas)
│   ├── cutouts/               Siluetas para recortar sacos
│   └── fonts/                 Letra Manrope
│
├── productos/            Una página por producto (GENERADAS, no se editan a mano)
├── scripts/              Herramientas que se corren en la computadora (no en el sitio)
│   ├── build-styles.py            Compila css/ → css/dist/
│   ├── build-product-pages.cjs    Genera productos/ y actualiza sitemap.xml
│   ├── generate-responsive-images.py  Crea los tamaños reducidos de las fotos
│   ├── audit-unused-assets.py     Busca fotos que nadie usa (solo informa)
│   └── csp-hashes.cjs             Calcula permisos de seguridad para scripts dentro del HTML
├── tests/                Pruebas automáticas
└── docs/                 Esta guía
```

**Regla de oro:** si un archivo dice "generado", no se edita a mano. Se edita su fuente y se corre el script.

| Generado | Se edita en | Se regenera con |
|---|---|---|
| `css/dist/*.css` | `css/*.css` | `python3 scripts/build-styles.py` |
| `productos/*.html`, `sitemap.xml` (bloque de productos) | `data/`, `js/catalog-model.js`, `GUIDE_QUESTIONS` en `js/store.js`, encabezado de `contact.html`, pie de `products.html` y estilos de la tienda | `node scripts/build-product-pages.cjs` |
| `data/responsive-images.js`, `assets/responsive/` | fotos en `assets/`, `data/image-overrides.js` | `python3 scripts/generate-responsive-images.py` |

## 4. Qué pasa cuando alguien abre una página

Tomemos `products.html`, la tienda. El navegador:

1. **Descarga el HTML** y empieza a leerlo de arriba hacia abajo.
2. Encuentra un `<script>` pequeño dentro del `<head>` (el de la animación de entrada) y lo ejecuta ya.
3. Encuentra `<link rel="stylesheet" href="css/dist/styles-products-….css">` y descarga los estilos.
4. Dibuja la página con el HTML y el CSS (todavía sin productos).
5. Al final del `<body>` hay varios scripts con `defer`:

   ```html
   <script src="js/image-protection.js?v=1" defer></script>
   <script src="data/catalog-data.js?v=50" defer></script>
   <script src="data/image-overrides.js?v=40" defer></script>
   <script src="data/feed-guides.js?v=32" defer></script>
   <script src="data/responsive-images.js?v=49" defer></script>
   <script src="data/veterinary-data.js?v=51" defer></script>
   <script src="js/catalog-model.js?v=51" defer></script>
   <script src="js/store.js?v=62" defer></script>
   ```

   - `defer` significa: "descargalo mientras tanto, pero ejecutalo **cuando termine de leer el HTML**, y **en
     este orden**". El orden importa: los datos primero, después el modelo que los usa, al final la tienda.
   - `?v=62` es un número de versión. Cuando cambia un script se sube el número, así el navegador no usa una
     copia vieja guardada.

6. Cada archivo de `data/` guarda su información en una variable global de la ventana, por ejemplo
   `window.AGROCENTRO_PRODUCTS`.
7. `js/catalog-model.js` lee esas variables y publica funciones útiles en `window.AGROCENTRO_CATALOG`.
8. `js/store.js` usa `window.AGROCENTRO_CATALOG`, dibuja las tarjetas de productos, conecta los botones y lee
   el carrito guardado.

## 5. Los datos: `data/`

Los archivos de `data/` casi no tienen lógica: son **listas y objetos** con información.

### `data/catalog-data.js`

Un **arreglo** (lista) de productos. Cada producto es un **objeto** (conjunto de pares nombre: valor):

```js
window.AGROCENTRO_PRODUCTS = [
  {
    id: 31,
    name: "Pig-Nova 5",
    image: "./assets/pignova-5-catalog-v11.webp",
    description: "Alimento para cerdos Pig-Nova fase 5",
    category: "cerdos",        // aves, cerdos, perros, gatos, equinos, conejos, otros
    type: "alimentos",         // alimentos, medicinas, herramientas
    instructions: "Alimento de crecimiento, fase 5 del programa Pig-Nova."
  },
  // …
];
```

El `id` es la llave: el resto de los archivos se refieren al producto por ese número.

### `data/feed-guides.js`

La ficha de cada alimento, indexada por `id`. Así queda la de Pig-Nova 5 **cuando el navegador ya la leyó**:

```js
window.AGROCENTRO_FEED_GUIDES = {
  31: {
    use: "Alimento de crecimiento orientado a producir más carne por unidad de alimento.",
    stage: "Crecimiento · fase 5",
    period: "Días 71–91 de edad",
    stages: ["desarrollo"],          // se usa para el filtro "etapa" de la tienda
    form: "Pellet",
    presentation: "45.4 kg / 100 lb",
    benefits: ["Alta digestibilidad y ganancia diaria de peso.", "…"],
    analysis: [["Proteína cruda", "Mínimo", "16.50%"], ["Grasa cruda", "Mínimo", "3.00%"]],
    feeding: "Línea Pig-Nova después de NeoPigg 4: Pig-Nova 5 → Pig-Nova 6. …",
    aliases: ["Pignova 5", "Pignova premium"]   // otras formas de buscarlo
  }
};
```

`analysis` es un **arreglo de arreglos**: cada fila es `[nutriente, calificador, valor]`.

Ojo: si buscás `use:` en el archivo no lo vas a encontrar. Para no repetir los nombres de los campos 90 veces,
cada ficha se escribe llamando a una función ayudante, `ficha(…)`, que recibe los datos **en orden** y devuelve
el objeto de arriba:

```js
const ficha = (use, stage, period, stages, form, presentation, benefits, guaranteed, sourcePage, extra = {}) => ({ … });

31: ficha(
  "Alimento de crecimiento orientado a producir más carne por unidad de alimento.",
  "Crecimiento · fase 5", "Días 71–91 de edad", ["desarrollo"], "Pellet", "45.4 kg / 100 lb",
  ["Alta digestibilidad y ganancia diaria de peso.", "…"],
  analysis("Energía digestible", ["13.00%", "16.50%", …]), "págs. 36 y 40",
  { feeding: "Línea Pig-Nova después de NeoPigg 4: …", aliases: ["Pignova 5", "Pignova premium"] }
),
```

Es un buen ejemplo de **parámetros por posición** y de un **valor por defecto** (`extra = {}`): los campos poco
comunes (`feeding`, `aliases`) van juntos en un objeto al final.

### `data/veterinary-data.js`

Lo mismo para medicinas: nombre, fabricante, categoría (`antibioticos`, `vitaminas`…), especies, composición,
presentación y precauciones. Un valor `null` significa "dato pendiente": nunca se inventa.

### `data/image-overrides.js`

Qué foto usar para cada `id` cuando es distinta a la del catálogo:

```js
window.AGROCENTRO_IMAGE_OVERRIDES = {
  1: "./assets/engordina-clean-v26.webp",
  2: "./assets/iniciarina-reference-v28.webp",
  // …
};
```

### `data/responsive-images.js`

Generado. Para cada foto dice qué versiones reducidas existen (320, 640 y 960 px de ancho) y su tamaño. La
tienda lo usa para que el celular descargue la foto chica y la computadora la grande (ver [Velocidad](#13-velocidad)).

## 6. El modelo del catálogo: `js/catalog-model.js`

Este archivo **no dibuja nada**. Junta los datos y ofrece funciones para preguntarles cosas. Así la tienda, la
portada, la guía y el generador de páginas usan exactamente la misma lógica.

Empieza así:

```js
(function () {
  "use strict";

  const products = window.AGROCENTRO_PRODUCTS || [];
  const guides = window.AGROCENTRO_FEED_GUIDES || {};
  const images = window.AGROCENTRO_IMAGE_OVERRIDES || {};
  // …
})();
```

- `(function () { … })();` es una **IIFE** (función que se ejecuta inmediatamente). Todo lo que se declara
  adentro queda **privado** y no choca con variables de otros archivos. Ver [16.4](#164-funciones-alcance-y-iife).
- `"use strict"` activa el modo estricto: el navegador marca como error cosas peligrosas, como usar una
  variable que no existe.
- `window.AGROCENTRO_PRODUCTS || []`: si no hay productos, usa una lista vacía en vez de romperse.

Funciones importantes:

| Función | Qué devuelve |
|---|---|
| `getName(product)` | El nombre a mostrar (en familias, el nombre común: "Dogui Cachorros") |
| `getGuide(product)` | La ficha del alimento, o `null` si no es alimento |
| `getVetInfo(product)` | La ficha veterinaria, o `null` |
| `getImage(product)` | La foto correcta (reemplazo o la del catálogo) |
| `getResponsiveAttributes(src, sizes)` | El texto `srcset="…" sizes="…" width="…" height="…"` para `<img>`, o `""` si la foto no tiene tamaños reducidos |
| `getVariants(product)` | Las presentaciones de la misma familia |
| `getPigLine(product)` | `"estandar"`, `"premium"` (Pig-Nova) o `""` |
| `compareProducts(a, b)` | Orden de exhibición en la tienda |

Ejemplo real, corto y muy útil para aprender:

```js
function getImage(product) { return images[product.id] || product.image || "./assets/logo.png"; }
```

Se lee: "si hay una foto de reemplazo para este id, usala; si no, la del producto; si tampoco, el logo". El
operador `||` devuelve el primer valor que "sirve" (ver [16.7](#167-verdadero-falso--y-)).

Al final publica todo en un solo objeto:

```js
window.AGROCENTRO_CATALOG = {
  products, types, categories, stages, pigLines, getPigLine, getGuide, getImage, /* … */
};
```

`{ products, types }` es la forma corta de `{ products: products, types: types }`.

## 7. La tienda: `js/store.js`

Es el archivo más grande. Conviene leerlo por partes.

### 7.1 Constantes y estado

```js
const WHATSAPP_NUMBER = "50582403490";
const CART_KEY = "agrocentro_cart";
const PAGE_SIZE = 16;
const MODEL = window.AGROCENTRO_CATALOG;
const catalog = MODEL.products;

const state = {
  type: "all", category: "all", stage: "all", pigLine: "all",
  vetCategory: "all", vetSpecies: "all", query: "", sort: "default",
  visible: PAGE_SIZE, filtered: []
};

let order = readCart();
```

- `const` para lo que no se reasigna; `let` para lo que cambia (`order` se reemplaza al quitar productos).
- **`state`** es la "memoria" de la tienda: qué filtros eligió el cliente y qué productos se ven. La idea
  central es: **cambia el estado → se vuelve a dibujar**. Nunca se modifica la pantalla "a mano" por un lado y
  el estado por otro.

### 7.2 Filtrar el catálogo

`filterCatalog()` recorre todos los productos y se queda con los que cumplen todos los filtros:

```js
let filtered = catalog.filter((product) => {
  const matchesType = state.type === "all" || product.type === state.type;
  const matchesCategory = state.category === "all" || product.category === state.category;
  // … más condiciones …
  return matchesType && matchesCategory && matchesStage && matchesLine
    && matchesVetCategory && matchesVetSpecies && matchesQuery;
});
```

- `.filter(función)` crea una **lista nueva** solo con los elementos para los que la función devuelve `true`.
- Cada filtro "all" deja pasar todo; si no, compara.
- Después ordena (`.sort`), agrupa familias de presentaciones, dibuja (`renderCatalog()`) y actualiza la
  dirección del navegador (`syncUrl()`).

**Búsqueda tolerante a errores.** Para buscar, junta en un solo texto el nombre, la ficha, los alias, las
etapas, etc., y lo "normaliza": minúsculas y sin tildes, así "Crecimiento" y "crecimiento" o "gestación" y
"gestacion" son iguales. Además usa una **distancia de edición** (`editDistance`): cuántas letras hay que
cambiar para pasar de una palabra a otra. Si alguien escribe "engordna", está a 1 letra de "engordina" y
igual lo encuentra.

### 7.3 Dibujar con plantillas de texto

Las tarjetas y la ficha se arman como **texto HTML** con plantillas (comillas invertidas `` ` ``):

```js
return `
  <div class="cart-item" data-cart-item="${item.id}">
    <span class="cart-item-name">${name}</span>
    <button class="cart-item-remove" type="button" data-remove="${item.id}">Quitar</button>
  </div>`;
```

y se insertan con `elemento.innerHTML = texto`.

**Muy importante:** todo dato que se mete en ese HTML pasa antes por `escapeHtml(…)`, que convierte `<` en
`&lt;`, etc. Si un nombre tuviera `<script>`, se mostraría como texto y no se ejecutaría. Ver
[Seguridad](#12-seguridad).

Los atributos `data-…` (como `data-remove="31"`) guardan información en el HTML para leerla después con
`elemento.dataset.remove`.

### 7.4 Un solo "escuchador" para muchos botones (delegación)

En vez de conectar cada botón por separado, la tienda escucha los clics en un contenedor y averigua qué se tocó:

```js
function handleCatalogClick(event) {
  // … antes revisa compartir, cantidad, zoom de la foto y vista de lista …
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToOrder(Number(addButton.dataset.add), 1); // (en la ficha abierta usa la cantidad elegida)
    return;
  }
  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) openProductModal(Number(detailButton.dataset.detail));
}
```

- `event.target` es el elemento exacto que se tocó (puede ser un ícono dentro del botón).
- `.closest("[data-add]")` sube por los "padres" hasta encontrar un elemento con ese atributo, o devuelve `null`.
- Ventaja: aunque las tarjetas se vuelvan a dibujar mil veces, el escuchador sigue funcionando.

### 7.5 La dirección del navegador

Cuando cambian los filtros, la dirección se actualiza sin recargar:

```js
function syncUrl() {
  const params = new URLSearchParams();
  if (state.category !== "all") params.set("category", state.category);
  if (state.type !== "all") params.set("type", state.type);
  // …
  if (activeModalProductId !== null) params.set("product", activeModalProductId);
  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}
```

Así un enlace como `products.html?type=alimentos&category=cerdos&line=premium` abre la tienda ya filtrada, y
`products.html?product=31` abre directo la ficha de Pig-Nova 5 (eso lo lee `init()` al cargar).

- `URLSearchParams` arma y lee la parte `?a=1&b=2` sin errores de formato.
- `history.replaceState` cambia la dirección visible **sin** recargar ni agregar un paso al botón "atrás".

### 7.6 El carrito vive en el navegador

```js
function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(stored)) return [];
    return stored
      .map((item) => {
        const product = catalog.find((entry) => entry.id === Number(item.id));
        if (!product) return null;
        return { id: product.id, name: MODEL.getOrderName(product), /* … */ qty: clampQuantity(item.qty) };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(order));
  } catch (error) {
    // El pedido sigue funcionando durante esta visita si el navegador bloquea el almacenamiento.
  }
  renderCart();
}
```

- **`localStorage`** es una pequeña memoria del navegador que sobrevive al cerrar la página. Solo guarda
  **texto**.
- **`JSON.stringify`** convierte la lista a texto; **`JSON.parse`** la vuelve a lista.
- **`try … catch`**: si algo falla (por ejemplo, el navegador en modo privado bloquea `localStorage`, o el
  texto guardado está roto), en vez de romper la página se toma el camino de `catch`.
- `.map` transforma cada elemento; `.filter(Boolean)` quita los `null` (productos que ya no existen).
- `clampQuantity` asegura que la cantidad sea un número entero entre 1 y 999, aunque alguien manipule los datos.

La portada (`site.js`) y las calculadoras (`usage-guide-programs.js`) escriben en **la misma llave**
`agrocentro_cart`. Por eso "Agregar estos sacos a mi pedido" en la guía aparece después en la tienda.

### 7.7 Enviar el pedido por WhatsApp

```js
function sendOrder(event) {
  event.preventDefault();
  if (order.length === 0) return;
  if (!validateOrderForm()) { /* muestra el error */ return; }

  const orderNumber = createOrderNumber();          // "AG-260915-0930"
  const message = buildOrderMessage(order, { name: …, phone: …, delivery: … }, orderNumber);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}
```

- `event.preventDefault()` evita que el formulario haga su envío normal (recargar la página).
- `buildOrderMessage` arma el texto línea por línea en un arreglo y lo une con saltos de línea:
  `lines.join("\n")`. Agrupa por tipo de producto, formatea el teléfono y agrega el resumen.
- `encodeURIComponent` convierte espacios, tildes y saltos de línea a un formato válido dentro de una dirección web.
- `wa.me/<número>?text=<mensaje>` es la dirección oficial de WhatsApp para abrir un chat con texto listo.
- `"noopener,noreferrer"` impide que la pestaña nueva pueda controlar la página de la tienda.

### 7.8 Arranque

```js
function init() {
  cacheElements();
  const openCartOnLoad = new URLSearchParams(window.location.search).get("cart") === "open";
  const openProductOnLoad = Number(new URLSearchParams(window.location.search).get("product"));
  // …
  readUrlFilters();
  bindEvents();
  filterCatalog();
  renderCart();
  window.addEventListener("storage", syncCartFromStorage);
  window.addEventListener("pageshow", syncCartFromStorage);
  if (openCartOnLoad) window.requestAnimationFrame(openCart);
  else if (openProductOnLoad) window.requestAnimationFrame(() => openProductModal(openProductOnLoad));
}
```

- `cacheElements()` busca una sola vez los elementos del HTML (`document.getElementById(…)`) y los guarda.
- El evento **`storage`** avisa si el carrito cambió en **otra pestaña**; `pageshow` cuando se vuelve a la
  página con el botón "atrás". En los dos casos se relee el carrito.
- `requestAnimationFrame` espera al próximo "cuadro" que dibuja el navegador antes de abrir la ficha.

## 8. La guía de uso: `js/usage-guide.js`

Todas las preguntas son **datos** en un arreglo:

```js
const questions = [
  { id: "consumo-cerdos", topic: "cerdos",
    question: "¿Cuánto alimento consume un cerdo hasta el peso de mercado?",
    keywords: "consumo cerdos sacos libras …",
    answer: `<p>Un cerdo come unas <strong>527 lb de alimento</strong> …</p>…` },
  // …
];
```

El archivo:

1. Dibuja todas las preguntas como elementos `<details>` (se abren y cierran solos, sin JavaScript).
2. Conecta el **buscador**: normaliza el texto (sin tildes) y muestra solo las preguntas que contienen todas
   las palabras.
3. Conecta los **botones de tema** (Cerdos, Gallinas…).
4. Si la dirección trae `#consumo-cerdos` (un **hash**), abre esa pregunta y la lleva a la vista.

Ayudantes que se usan dentro de las respuestas:

```js
const product = id => MODEL.products.find(entry => entry.id === id);
const guide = id => MODEL.getGuide(product(id));
const link = id => `<a href="products.html?product=${id}">${escape(MODEL.getName(product(id)))}</a>`;
```

Así una respuesta escribe `${link(31)}` y aparece un enlace a Pig-Nova 5 con el nombre correcto. Si el nombre
cambia en el catálogo, cambia en todas las respuestas.

### Tablas que se vuelven tarjetas en el celular

`labelTables()` revisa cada tabla: a cada celda le pone el nombre de su columna en `data-label`, y **mide** si
la tabla cabe (`wrap.scrollWidth > wrap.clientWidth + 1`; el `+ 1` tolera medio píxel de redondeo). Las preguntas
cerradas se saltan porque su ancho medido es 0. Además envuelve el contenido de cada celda en
`<span class="guide-cell-value">`, para que en la tarjeta la etiqueta y el valor no se encimen. Si no cabe y la pantalla es angosta, le agrega la clase
`guide-table--stack` y el CSS la muestra como tarjetas. Dos herramientas del navegador lo hacen posible:

- **`window.matchMedia("(max-width: 620px)")`**: pregunta desde JS si la pantalla es angosta.
- **`MutationObserver`**: avisa cuando el contenido cambia (por ejemplo, una calculadora dibujó una tabla nueva)
  para volver a revisar.

## 9. Las calculadoras: `js/usage-guide-programs.js`

En las respuestas hay marcadores vacíos: `<div data-calc="pigs"></div>`. Este archivo busca esos marcadores y
los reemplaza por calculadoras. Cada calculadora es un objeto con la misma forma:

```js
const calculators = {
  pigs: {
    title: "Calculá los sacos y las fechas de tu lote de cerdos",
    html: `<div class="guide-ration-fields">…campos…</div><div id="prog-pig-result"></div>`,
    bind() {
      const count = document.getElementById("prog-pig-count");
      const out = document.getElementById("prog-pig-result");
      const run = () => { /* lee los campos, calcula y escribe en out */ };
      [count /* , … */].forEach(el => el.addEventListener("input", run));
      run();
    }
  },
  // broiler, layers, layerCompare, horse …
};

slots.forEach(slot => {
  const c = calculators[slot.dataset.calc];
  if (!c) { slot.remove(); return; }
  slot.innerHTML = `<h3>${escape(c.title)}</h3>${c.html}`;
  c.bind();
});
```

- **Patrón**: `html` dibuja, `bind()` conecta los eventos. Agregar una calculadora nueva es agregar un objeto.
- El evento **`input`** se dispara con cada tecla o cambio: por eso los resultados se actualizan en vivo.
- Los programas de alimentación son datos:

  ```js
  const broiler = [
    { id: 4, from: 1, to: 7, lb: 0.4 },
    { id: 2, from: 8, to: 21, lb: 2.2 },
    { id: 1, from: 22, to: 42, lb: 7.4, open: true }
  ];
  ```

  Con eso la calculadora multiplica libras por cantidad de animales y divide por el tamaño del saco. La tabla
  muestra sacos con decimales (`2.6`); al tocar "Agregar estos sacos a mi pedido" se redondea hacia arriba con
  `Math.ceil` para no quedarse corto. No todos los sacos pesan 100 lb: `sackSize = { 24: 44, 25: 55.1, 37: 55.1 }`
  (NeoPigg 1 viene en 44 lb; NeoPigg 2 y 3, en 55.1 lb).
- **Fechas**: suma días a la fecha de nacimiento con `new Date(fecha.getTime() + días * 86400000)`
  (86,400,000 milisegundos = 1 día) y las muestra con `toLocaleDateString("es-NI", …)`.
- **Comparador de gallinas** (`layerLines`): cada línea guarda 10 valores por edad (20 a 90 semanas). Un valor
  puede ser un número (`96`) o un rango (`[92, 97]`); `layerValue` los muestra como "96 %" o "92–97 %".
  Cuando no hay dato (consumo de Lohmann) cada valor es `null` (`feed: [null, null, …]`) y esas líneas no se
  ofrecen en "Consumo".

## 10. Los scripts pequeños

### `js/site.js`

Se carga en la portada, contacto, la guía y las páginas de `productos/`. **En `products.html` no**: ahí `store.js`
maneja su propio menú, el contador del carrito y el formulario del pedido. Lo que hace:

- **Menú del celular** (`setupMenu`): al tocar el botón alterna la clase `open` y actualiza `aria-expanded`
  para lectores de pantalla. Se cierra con la tecla Escape.
- **Contador del carrito** (`updateCartCount`): lee `localStorage` y escribe el número en cada elemento con
  `data-cart-count`.
- **Portada**: dibuja productos destacados y el buscador por animal y etapa.
- **Formulario de contacto**: valida nombre, teléfono y mensaje, y abre WhatsApp con el texto armado.

Los campos del formulario empiezan **deshabilitados** (`disabled data-enable-with-js`) y el script los habilita
recién después de conectar la validación. Si el JavaScript no carga, nadie puede enviar datos personales por
un camino sin validar.

### `js/splash.js`

La animación con el logo al entrar, solo en la portada, la tienda y contacto (la guía no la tiene). Un script
corto dentro del `<head>` decide si mostrarla: solo la primera vez por visita, anotándolo en `sessionStorage`
con la llave `agrocentro_intro_shown`. Ese script también pone el límite de 2.5 s por si algo falla.
`splash.js` la deja como mínimo 240 ms y empieza a desvanecerla apenas la página está lista (o a los 2.2 s).

### `js/image-protection.js`

Cancela el menú del clic derecho y el arrastre sobre las fotos del catálogo. No es una protección real (las
fotos siguen siendo públicas), solo desanima copiarlas.

## 11. Los estilos: `css/` y `css/dist/`

Los estilos están divididos por tema en `css/` para poder editarlos cómodamente. Pero descargar 10 archivos
por página es lento, así que `scripts/build-styles.py` los **junta en un solo archivo por página**:

```
css/font-manrope.css + css/site.css + css/usage-guide.css + … ─► css/dist/styles-guia-de-uso-a1b2c3d4e5f6.css
```

- El orden se respeta siempre: en CSS, **la última regla gana** cuando dos dicen cosas distintas.
- El nombre lleva un **hash**: 12 caracteres calculados a partir del contenido. Si el contenido cambia, el nombre
  cambia. Por eso Vercel puede decirle al navegador "guardalo un año" (`max-age=31536000, immutable`): cuando
  haya cambios será otro archivo con otro nombre.
- `css/dist/styles-manifest.json` anota qué archivo compilado corresponde a cada página.

Después de editar CSS:

```bash
python3 scripts/build-styles.py
```

El script crea los compilados nuevos, **cambia solo** el `<link>` de cada página al nombre nuevo y borra los
compilados viejos. `vercel.json` tiene una sola regla para toda la carpeta (`/css/dist/(.*).css`), así que no
hay que tocarlo.

Como los compilados viven en `css/dist/`, dentro de los CSS las rutas a imágenes y fuentes se escriben
**absolutas**: `url("/assets/…")`. Una ruta relativa como `./assets/…` apuntaría a `css/dist/assets/`, que no
existe; el script se detiene si encuentra una.

Conceptos de CSS que aparecen mucho:

- **Clases** (`.store-page .product-detail-layout h2`): se aplican a elementos con esa clase dentro de otra.
- **Variables CSS** (`var(--green-950)`): colores de la marca definidos una sola vez.
- **`@media (max-width: 620px) { … }`**: reglas solo para pantallas angostas (celular).
- **Grid y flex**: formas de acomodar columnas y filas.

## 12. Seguridad

### Content Security Policy (CSP)

En `vercel.json` hay una cabecera `Content-Security-Policy`. Es una lista de reglas que el navegador obedece:

```
default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self'; img-src 'self'; form-action 'self'; …
```

- `'self'` = solo archivos del mismo sitio. Aunque alguien lograra inyectar un `<script src="https://malo.com">`,
  el navegador no lo cargaría.
- Los scripts escritos **dentro** del HTML están prohibidos salvo que su contenido exacto esté aprobado con su
  huella `sha256-…`. `scripts/csp-hashes.cjs` calcula esas huellas; la prueba de seguridad falla si no coinciden.
- Tampoco se permiten estilos dentro del HTML (`style="…"`) ni atributos como `onclick="…"`. Por eso todo el
  comportamiento está en archivos `.js`.

### Escapar HTML (evitar XSS)

**XSS** es cuando un atacante logra meter código en la página. Cada vez que se arma HTML con datos se usa:

```js
const escape = value => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
```

En `js/usage-guide.js`, `js/usage-guide-programs.js` y el generador de páginas se llama `escape`; en `js/store.js`
y `js/site.js` la misma idea se llama `escapeHtml`.

Regla práctica: **`textContent`** para poner texto (es seguro siempre); **`innerHTML`** solo con plantillas donde
todo dato pasó por `escape`.

### Otras cabeceras

- `X-Frame-Options: DENY`: nadie puede meter tu tienda dentro de otra página para engañar.
- `X-Content-Type-Options: nosniff`: el navegador no "adivina" el tipo de archivo.
- `Referrer-Policy: no-referrer`: al salir hacia otro sitio no se le cuenta desde qué página venías.
- `Permissions-Policy`: se niegan cámara, micrófono, ubicación y pagos. Se permiten a propósito `web-share` y
  `clipboard-write` en el propio sitio, porque el botón "Compartir" de la ficha los usa (una prueba lo revisa).
- En la CSP, `frame-src https://www.openstreetmap.org` es la única excepción: permite los mapas de las sucursales
  en contacto. `frame-ancestors 'none'` es la versión moderna de `X-Frame-Options`.

**Si cambiás un script dentro del `<head>`** (por ejemplo el que decide la animación), su huella cambia y el
navegador lo bloquea. Hay que correr `node scripts/csp-hashes.cjs`, pegar las huellas nuevas en la CSP de
`vercel.json` y correr `node --test tests/security-policy.test.cjs`.

## 13. Velocidad

- **Fotos responsive**: `<img src="foto.webp" srcset="foto-320w.webp 320w, foto-640w.webp 640w, foto-960w.webp 960w" sizes="(max-width: 760px) 90vw, 480px">`.
  El navegador elige la más chica que se vea bien en esa pantalla.
- **WebP**: formato de imagen más liviano que PNG/JPG con la misma calidad.
- **`defer`** en los scripts: no bloquean el dibujo de la página.
- **Caché larga** para archivos con hash (estilos compilados, fotos responsive, fuentes), definida en `vercel.json`.
  HTML y scripts no tienen regla: usan lo normal de Vercel, que es preguntar si hay versión nueva. El `?v=` en
  los scripts asegura que el navegador no use una copia vieja.
- **Fuente local con `preload`**: la letra Manrope se sirve desde tu propio sitio y se pide temprano.

## 14. Páginas de productos y Google

`scripts/build-product-pages.cjs` es un programa de **Node.js** (JavaScript que corre en la computadora, no en el
navegador). Hace esto:

1. Carga los archivos de `data/` y `js/catalog-model.js` dentro de una "caja" aislada con `vm` (módulo de Node
   que ejecuta código con un `window` falso).
2. Toma el encabezado de `contact.html` y el pie de `products.html` para que las páginas se vean igual.
3. Para cada producto (las presentaciones de una misma familia, como Dogui Cachorros de 1 lb y de saco,
   comparten una sola página) arma un HTML completo con plantillas: título, descripción, dirección canónica, vista previa
   para redes (Open Graph), foto, ficha y botones.
4. Escribe `productos/<nombre>.html`, borra páginas de productos que ya no existen y actualiza `sitemap.xml`.

Conceptos de buscadores:

| Término | Qué es |
|---|---|
| `<title>` | El título azul que aparece en Google |
| `meta description` | El texto gris debajo del título |
| `rel="canonical"` | "Esta es la dirección oficial de esta página" |
| `sitemap.xml` | Lista de páginas para que Google las descubra |
| `robots.txt` | Qué puede leer Google y dónde está el sitemap |
| Open Graph (`og:`) | Título, texto y foto que muestran WhatsApp o Facebook al compartir un enlace |

## 15. Las pruebas: `tests/`

Se corren con Node, sin instalar paquetes. `guide-mobile` además necesita Google Chrome (o `CHROME_PATH` con la
ruta de otro navegador Chromium); si no lo encuentra, **salta** las pruebas de pantalla en vez de fallar:

```bash
node --test tests/security-policy.test.cjs
node --test tests/form-security.test.cjs
node --test tests/product-pages.test.cjs
node --test tests/guide-mobile.test.cjs
```

| Prueba | Qué verifica |
|---|---|
| `security-policy` | Reglas CSP, huellas de scripts, que las páginas solo carguen archivos permitidos, caché de estilos |
| `form-security` | Que los formularios no envíen datos sin validar y que las búsquedas funcionen |
| `product-pages` | Que `productos/` y `sitemap.xml` estén al día, sin títulos repetidos ni archivos faltantes |
| `guide-mobile` | Abre la guía y páginas de productos en Chrome **sin ventana** a 360 y 390 px y falla si algo se sale de la pantalla; también que el texto no cite fuentes |

Estructura de una prueba:

```js
const assert = require("node:assert/strict");
const { test } = require("node:test");

test("every product page has its own title, description and canonical URL", () => {
  assert.ok(pages.length > 100, `only ${pages.length} product pages`);
  assert.equal(canonical, `${ORIGIN}/${page.path}`, `${page.path}: canonical URL`);
});
```

- `test(nombre, función)` define una prueba.
- `assert.ok(condición, mensaje)` falla si la condición es falsa; `assert.equal(a, b)` falla si son distintos.

La prueba de celular controla Chrome con el **Chrome DevTools Protocol**: le envía mensajes como
"abrí esta página", "simulá una pantalla de 360 px" y "ejecutá este código y devolveme el resultado".

## 16. Conceptos de JavaScript

### 16.1 Variables: `const` y `let`

```js
const PAGE_SIZE = 16;      // no se reasigna
let order = readCart();    // se reasigna: order = order.filter(…)
```

Usá `const` por defecto y `let` solo si la variable cambia de valor. (`var` es la forma vieja; no se usa aquí.)
Ojo: `const` impide **reasignar**, no modificar por dentro: `state.type = "alimentos"` es válido aunque `state`
sea `const`.

### 16.2 Tipos de datos

| Tipo | Ejemplo en el código |
|---|---|
| Texto (string) | `"Pig-Nova 5"` |
| Número | `31`, `45.4` |
| Booleano | `true`, `false` |
| `null` | "no hay valor, a propósito" (`feed: [null, null, …]` en Lohmann) |
| `undefined` | "no se asignó" |
| Arreglo | `[27, 28, 31]` |
| Objeto | `{ id: 31, name: "Pig-Nova 5" }` |

`Number(texto)` convierte a número; `String(valor)` a texto; `Number.parseInt("12", 10)` a entero.

### 16.3 Objetos y arreglos

```js
product.name            // leer una propiedad
state.type = "all"      // cambiar una propiedad
guides[product.id]      // leer con una llave variable
order.push(item)        // agregar al final de un arreglo
order.length            // cantidad de elementos
```

### 16.4 Funciones, alcance y IIFE

```js
function clampQuantity(value) { … }              // declaración
const product = id => MODEL.products.find(…);    // función flecha
function addToOrder(productId, quantity = 1) {}  // parámetro con valor por defecto
```

- **Función flecha** `(a, b) => a + b`: forma corta. Con un solo parámetro no hacen falta paréntesis.
- **Alcance (scope)**: una variable declarada dentro de `{ }` solo existe ahí adentro.
- **IIFE**: `(function () { … })();` crea un alcance privado para todo el archivo.
- **Closure (cierre)**: una función "recuerda" las variables del lugar donde se creó. En las calculadoras,
  `run` usa `count` y `out` aunque se ejecute mucho después, cuando alguien escribe.

### 16.5 Métodos de arreglos (los más usados aquí)

```js
catalog.find(p => p.id === 31)              // el primero que cumple, o undefined
catalog.filter(p => p.type === "alimentos") // todos los que cumplen (lista nueva)
order.map(cartItem)                         // transforma cada uno (lista nueva)
ids.some(el => !el.checkValidity() || !el.value)            // ¿alguno cumple? → true/false (¿falta un campo?)
terms.every(term => item.searchText.includes(term))        // ¿todos cumplen? (¿están todas las palabras?)
order.reduce((total, item) => total + item.qty, 0)  // acumula un solo resultado
filtered.sort((a, b) => searchRank(a, query) - searchRank(b, query) || MODEL.compareProducts(a, b)) // ordena
["aves", "cerdos"].includes("cerdos")       // ¿contiene? → true
[1, [2, 3]].flat()                          // aplana → [1, 2, 3]
lines.join("\n")                            // une en un texto
```

En `sort`, la función devuelve un número: negativo si `a` va antes, positivo si va después. El `||` usa el
segundo criterio solo cuando el primero empata (da `0`).

`reduce` cuesta al principio. En `order.reduce((total, item) => total + item.qty, 0)`: empieza con `total = 0` y
por cada producto suma su cantidad.

### 16.6 Plantillas de texto

```js
`${pigs.toLocaleString("es-NI")} cerdos · NeoPigg ${program.value === "optimo" ? "Óptimo" : "Plus"}`
```

- Van entre comillas invertidas `` ` ``.
- `${ … }` inserta el resultado de cualquier expresión.
- Pueden ocupar varias líneas.

### 16.7 Verdadero, falso, `||` y `??`

- Valores "falsos" (falsy): `false`, `0`, `""`, `null`, `undefined`, `NaN`. Todo lo demás es "verdadero".
- `a || b`: si `a` es verdadero devuelve `a`; si no, `b`. Útil para valores por defecto.
- `a ?? b`: devuelve `b` **solo** si `a` es `null` o `undefined` (un `0` o `""` se respetan).
  Ejemplo: `String(value ?? "")`.
- Operador ternario: `condición ? siEsVerdad : siEsFalso`.

### 16.8 Encadenamiento opcional `?.`

```js
guide?.presentation                     // undefined si guide es null, en vez de un error
vet?.species?.join(" · ")
document.getElementById("x")?.textContent
```

Sin `?.`, leer `.presentation` de `null` rompe todo el script.

### 16.9 Desestructuración y `...`

```js
const [hens, grams, days] = ids.map(el => Number(el.value)); // toma 1.º, 2.º y 3.º elemento (calculadora de gallinas)
const { buildSite, OUTPUT_DIR } = require(…);   // toma propiedades por nombre
const copia = { ...guide, presentation: "…" };  // copia un objeto cambiando un campo
[...ids, productSelect].forEach(…)              // junta arreglos
value.append(...cell.childNodes)                // pasa una lista como argumentos sueltos (usage-guide.js)
```

### 16.10 El DOM: leer y cambiar la página

El **DOM** es la página convertida en objetos que JavaScript puede tocar.

```js
document.getElementById("cart-count")              // un elemento por id
document.querySelector(".guide-table-wrap")        // el primero que coincide con un selector CSS
document.querySelectorAll("[data-pig-line]")       // todos (se recorre con forEach)

elemento.textContent = "3";                        // texto seguro
elemento.innerHTML = `<strong>…</strong>`;         // HTML (¡escapar los datos!)
elemento.classList.add("open");                    // agregar clase
elemento.classList.toggle("visible", condición);   // poner/quitar según condición
elemento.setAttribute("aria-expanded", "true");
elemento.hidden = true;                            // ocultar
elemento.dataset.label                             // lee data-label
input.value                                        // lo escrito en un campo
```

### 16.11 Eventos

```js
boton.addEventListener("click", () => { … });
form.addEventListener("submit", (event) => { event.preventDefault(); … });
input.addEventListener("input", run);        // cada tecla
select.addEventListener("change", run);      // al elegir
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
document.addEventListener("DOMContentLoaded", init); // cuando el HTML terminó de leerse
window.addEventListener("storage", syncCartFromStorage); // otra pestaña cambió localStorage
```

- `event.target`: el elemento exacto que recibió el evento.
- `event.preventDefault()`: cancela lo que el navegador haría normalmente.
- **Delegación**: un escuchador en el contenedor y `event.target.closest(…)` para saber qué se tocó (ver 7.4).

### 16.12 JSON y `localStorage`

```js
localStorage.setItem("agrocentro_cart", JSON.stringify([{ id: 31, qty: 2 }]));
const carrito = JSON.parse(localStorage.getItem("agrocentro_cart"));
```

Siempre dentro de `try … catch`: el almacenamiento puede estar bloqueado o el texto puede estar dañado.

### 16.13 Direcciones: `URL`, `URLSearchParams`, `encodeURIComponent`

```js
new URLSearchParams(window.location.search).get("product")  // lee ?product=31
const url = new URL("https://www.agrocentronica.com/products.html");
url.searchParams.set("product", 31);                        // arma la dirección
encodeURIComponent("Hola, ¿precio?")                        // "Hola%2C%20%C2%BFprecio%3F"
location.hash                                               // "#consumo-cerdos"
```

### 16.14 Tiempo: `setTimeout` y `requestAnimationFrame`

```js
const timer = window.setTimeout(() => button.classList.remove("added"), 1200); // en 1.2 s
window.clearTimeout(timer);                                                   // cancelarlo
window.requestAnimationFrame(() => …);   // antes del próximo dibujo de pantalla
```

### 16.15 Promesas y `async/await`

Algunas cosas tardan (compartir una ficha, esperar a Chrome en las pruebas). Una **Promesa** representa un
resultado que llegará después:

```js
async function shareProduct(button) {
  // … arma title, text y url …
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text, url });   // espera a que el usuario comparta
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;       // el usuario canceló: no se hace nada
  }
  // si no se pudo compartir: copia el enlace con navigator.clipboard.writeText(url)
  // y si tampoco se puede copiar, muestra el enlace para copiarlo a mano
}
```

`await` solo se puede usar dentro de funciones `async` y "pausa" la función hasta que la promesa termine, sin
congelar la página.

### 16.16 Texto: normalizar, expresiones regulares y formatos

```js
texto.normalize("NFD")                 // separa letras y tildes: "é" → "e" + tilde
     .replace(/[̀-ͯ]/g, "")  // (en el código se escribe con códigos \u…) quita las tildes
     .toLowerCase();
phone.replace(/\D/g, "")               // quita todo lo que no sea dígito
(1234.5).toLocaleString("es-NI")       // "1,234.5"
```

Una **expresión regular** (`/…/`) describe un patrón de texto: `\D` = "no dígito", `\s+` = "uno o más espacios",
`g` = "todas las veces".

### 16.17 `Map` y `Set`

```js
const groups = new Map();                     // pares llave → valor con cualquier tipo de llave
groups.set("ALIMENTOS · CERDOS", []);
groups.get("ALIMENTOS · CERDOS").push(entry);

const vistos = new Set();                      // valores sin repetir
vistos.add("pig-nova-5"); vistos.has("pig-nova-5"); // true
```

### 16.18 `MutationObserver` y `matchMedia`

```js
new MutationObserver(() => labelTables(container))
  .observe(container, { childList: true, subtree: true });   // "avisame si cambia el contenido"

const narrowScreen = window.matchMedia("(max-width: 620px)");
narrowScreen.matches;                                          // true en celular
```

### 16.19 JavaScript en el navegador y en Node

| Navegador (`js/`) | Node (`scripts/`, `tests/`) |
|---|---|
| Tiene `window`, `document`, `localStorage` | No tiene página: tiene archivos y procesos |
| Los archivos se comparten con `window.ALGO` | Se importan con `require("./archivo.cjs")` |
| Corre en el teléfono del cliente | Corre en tu computadora |

Módulos de Node que aparecen: `fs` (leer y escribir archivos), `path` (armar rutas), `vm` (ejecutar código
aislado), `child_process` (abrir Chrome), `http` (servidor local para las pruebas), `node:test` y `node:assert`.

## 17. Recetas: cómo hacer cambios comunes

### Cambiar la foto de un producto

1. Guardá la foto en `assets/` (mejor WebP o PNG con fondo limpio).
2. Buscá el `id` del producto en `data/catalog-data.js`.
3. En `data/image-overrides.js` agregá `id: "./assets/nombre-nuevo.webp"`.
4. `python3 scripts/generate-responsive-images.py` (necesita Pillow).
5. `node scripts/build-product-pages.cjs`.
6. Subí el número `?v=` de los scripts de datos que cambiaron en las páginas.
7. Corré las pruebas.

### Corregir la ficha de un alimento

1. Editá la entrada del `id` en `data/feed-guides.js`.
2. `node scripts/build-product-pages.cjs`.
3. Subí `?v=` de `data/feed-guides.js` en las páginas.
4. Corré las pruebas.

### Agregar una pregunta a la guía

1. En `js/usage-guide.js`, agregá un objeto al arreglo `questions` con `id`, `topic`, `question`, `keywords` y
   `answer`.
2. Usá `${link(id)}` para enlazar productos.
3. Si la pregunta debe aparecer en la ficha de un producto, agregala también a `GUIDE_QUESTIONS` en
   `js/store.js` (con `ids`, `hash` igual al `id` de la pregunta y `label`) y corré
   `node scripts/build-product-pages.cjs`: el generador lee esa lista desde `store.js`.
4. Subí `?v=` de `js/usage-guide.js` en `guia-de-uso.html` (y de `js/store.js` en `products.html` si lo tocaste).
5. Corré las pruebas.

Tip: `guia-de-uso.html?tema=cerdos` abre la guía con ese tema elegido y `#consumo-cerdos` abre esa pregunta.

### Cambiar un color o un espacio

1. Editá el archivo de `css/` que corresponde.
2. `python3 scripts/build-styles.py` (actualiza solo los enlaces de las páginas).
3. `node scripts/build-product-pages.cjs` (las páginas de productos usan los estilos de la tienda).
4. Corré las pruebas.

### Publicar

Cambios en una rama → PR → revisar la vista previa → merge → Vercel publica solo.

## 18. Ejercicios para practicar

Hacelos en la consola del navegador (clic derecho → Inspeccionar → Consola) sobre agrocentronica.com. No
cambian nada del sitio real.

1. En la tienda, escribí `AGROCENTRO_CATALOG.products.length`. ¿Cuántos productos hay?
2. `AGROCENTRO_CATALOG.products.filter(p => p.category === "cerdos").map(p => p.name)` → la lista de cerdos.
3. `AGROCENTRO_CATALOG.getGuide(AGROCENTRO_CATALOG.products.find(p => p.id === 31))` → la ficha de Pig-Nova 5.
4. Agregá algo al pedido y escribí `JSON.parse(localStorage.getItem("agrocentro_cart"))`.
5. Contá cuántos alimentos hay por animal con `reduce`:
   `AGROCENTRO_CATALOG.products.filter(p => p.type === "alimentos").reduce((cuenta, p) => { cuenta[p.category] = (cuenta[p.category] || 0) + 1; return cuenta; }, {})`
6. En `js/store.js`, leé `buildOrderMessage` y escribí en un papel cómo quedaría el mensaje para 2 sacos de
   Engordina con retiro en Diriomo.
7. En `js/usage-guide-programs.js`, buscá la calculadora `horse` (la más corta) y explicá con tus palabras qué
   hace `run`.

## 19. Glosario

| Palabra | Significado |
|---|---|
| **Bundle / compilado** | Archivo que junta varios (aquí, CSS) para descargar menos |
| **Caché** | Copia guardada de un archivo para no descargarlo de nuevo |
| **Canonical** | La dirección oficial de una página para los buscadores |
| **Commit** | Un cambio guardado en el historial de Git |
| **CSP** | Reglas de seguridad que dicen qué puede cargar la página |
| **DOM** | La página como objetos que JavaScript puede leer y cambiar |
| **Escapar** | Convertir `<`, `>`, `&` y comillas para que se muestren como texto |
| **Evento** | Algo que pasa (clic, tecla, envío) y que el código puede escuchar |
| **Hash** | Huella corta calculada a partir del contenido de un archivo |
| **IIFE** | Función que se ejecuta al instante y crea un alcance privado |
| **JSON** | Formato de texto para guardar listas y objetos |
| **localStorage** | Memoria del navegador que sobrevive al cerrar la página |
| **Merge** | Juntar una rama con `main` |
| **Node.js** | JavaScript fuera del navegador (en tu computadora) |
| **PR** | Propuesta de cambio en GitHub |
| **Rama** | Línea de trabajo separada en Git |
| **SEO** | Todo lo que ayuda a aparecer en buscadores |
| **Sitemap** | Lista de páginas del sitio para Google |
| **Sitio estático** | Sitio hecho de archivos, sin servidor con lógica propia |
| **Vista previa** | Copia privada del sitio con los cambios de un PR |
| **XSS** | Ataque que mete código en una página a través de datos |
