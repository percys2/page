const alimentos = [
  {
    name: "Engordina",
    image: "./assets/engordina.png",
    description: "Alimento para aves en etapa de engorde"
  },
  {
    name: "iniciarina",
    image: "./assets/engordina.jpg",
    description: "Alimento para pollos de engorde"
  },
  {
    name: "Novagallos",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Pre iniciarina",
    image: "./assets/preiniciarina.png",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Cavalleria Forte",
    image: "./assets/cavalleria.png",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Omalina 100",
    image: "./assets/omalina100.png",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Omalina 200",
    image: "./assets/omalina200.png",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Omalina 300",
    image: "./assets/omalina300.png",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Conejos",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Pollo Criollo",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Ponedora criolla",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Mimado Adulto 50 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Mimado cachorro 50 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Dogui carne 1 lb",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Dogui carne 40 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Dogui carne y vegetales 40 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
   {
    name: "Dogui parrillada 40 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Dogui pollo 40 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Dogui cachorro 1 lb",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "dogui cachorro 40 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "don gato adulto 1 lb",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "don gato 17.6 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "gaty gatitos",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Gaty mar y tierra 1lb",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Gaty mar y tierra 17.6 lbs",
    image: "./assets/posturina.jpg",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "forrajina",
    image: "./assets/forrajina.png",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Neopigg 2",
    image: "./assets/neoppigg2.png",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Neopigg 1",
    image: "./assets/neopig1.png",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "desarrollina",
    image: "./assets/desarrollina.png",
    description: "Alimento para gallos de pelea"
  },
    {
    name: "Jamonina",
    image: "./assets/jamonina.png",
    description: "Alimento para cerdos de engorde"
  },
   {
    name: "Criacerdina",
    image: "./assets/criacerdina.png",
    description: "Alimento para cerdas en gestacion"
  },
  {
    name: "Pignova 6",
    image: "./assets/pignova6.png",
    description: "Alimento para cerdas en gestacion"
  }
];

const medicinas = [
  {
    name: "Chicken Vit",
    image: "./assets/chicken-vit.jpg",
    description: "Vitaminas para aves"
  },
  {
    name: "Electrowell",
    image: "./assets/electrowell.jpg",
    description: "Electrolitos veterinarios"
  }
];

const herramientas = [
  {
    name: "Machetes IMACASA",
    image: "./assets/machete.jpg",
    description: "Herramientas resistentes para el campo"
  },
  {
    name: "Fumigadoras",
    image: "./assets/fumigadora.jpg",
    description: "Equipos para aplicación agrícola"
  }
];

function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = products
    .map(product => `
      <div class="product-card">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <h4>${product.name}</h4>
        <p>${product.description}</p>
      </div>
    `)
    .join("");
}


// RENDER
renderProducts(alimentos, "alimentos-grid");
renderProducts(medicinas, "medicinas-grid");
renderProducts(herramientas, "herramientas-grid");
