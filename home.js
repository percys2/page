const alimentos = [
  {
    name: "Engordina",
    image: "./assets/engordina.png",
    description: "Alimento para aves en etapa de engorde"
  },
  {
    name: "Iniciarina",
    image: "./assets/iniciarina.JPG",
    description: "Alimento para pollos de engorde"
  },
  {
    name: "Novagallos",
    image: "./assets/novagallos.JPG",
    description: "Alimento para gallos de pelea"
  },
  {
    name: "Pre iniciarina",
    image: "./assets/preiniciarina.png",
    description: "Alimento para pollos en etapa inicial"
  },
  {
    name: "Cavalleria Forte",
    image: "./assets/cavalleria.png",
    description: "Alimento para caballos"
  },
  {
    name: "Omalina 100",
    image: "./assets/omalina100.png",
    description: "Alimento balanceado para aves"
  },
  {
    name: "Omalina 200",
    image: "./assets/omalina200.png",
    description: "Alimento balanceado para aves"
  },
  {
    name: "Omalina 300",
    image: "./assets/omalina300.png",
    description: "Alimento balanceado para aves"
  },
  {
    name: "Conejos",
    image: "./assets/conejos.JPG",
    description: "Alimento para conejos"
  },
  {
    name: "Pollo Criollo",
    image: "./assets/pollocriollo.JPG",
    description: "Alimento para pollos criollos"
  },
  {
    name: "Ponedora Criolla",
    image: "./assets/ponedoracriolla.jpg",
    description: "Alimento para gallinas ponedoras criollas"
  },
  {
    name: "Mimado Adulto 50 lbs",
    image: "./assets/mimadoadullto.JPG",
    description: "Alimento para perros adultos"
  },
  {
    name: "Mimado Cachorro 50 lbs",
    image: "./assets/mimadocachorro.JPG",
    description: "Alimento para cachorros"
  },
  {
    name: "Dogui Carne 1 lb",
    image: "./assets/doguicarne1lb.jpg",
    description: "Alimento para perros sabor carne"
  },
  {
    name: "Dogui Carne y Vegetales",
    image: "./assets/doguicarneyvegetales.JPG",
    description: "Alimento para perros sabor carne y vegetales"
  },
  {
    name: "Dogui Cachorro 1 lb",
    image: "./assets/doguicachorro1lb.jpg",
    description: "Alimento para cachorros"
  },
  {
    name: "Dogui Cachorros",
    image: "./assets/doguicachorros1lb.JPG",
    description: "Alimento para cachorros"
  },
  {
    name: "Don Gato 1 lb",
    image: "./assets/dongato1lb.jpg",
    description: "Alimento para gatos adultos"
  },
  {
    name: "Don Gato 17.6 lbs",
    image: "./assets/dongato.JPG",
    description: "Alimento para gatos adultos"
  },
  {
    name: "Gaty 1 lb",
    image: "./assets/gaty1lb.jpg",
    description: "Alimento para gatos"
  },
  {
    name: "Gaty 17.6 lbs",
    image: "./assets/gaty17.JPG",
    description: "Alimento para gatos"
  },
  {
    name: "Gaty Pescado",
    image: "./assets/gatypescado.png",
    description: "Alimento para gatos sabor pescado"
  },
  {
    name: "Forrajina",
    image: "./assets/forrajina.png",
    description: "Alimento forrajero para ganado"
  },
  {
    name: "Neopigg 1",
    image: "./assets/nepigg1.png",
    description: "Alimento para cerdos etapa 1"
  },
  {
    name: "Neopigg 2",
    image: "./assets/neopigg2.png",
    description: "Alimento para cerdos etapa 2"
  },
  {
    name: "Neopigg 4",
    image: "./assets/neopigg4.jpg",
    description: "Alimento para cerdos etapa 4"
  },
  {
    name: "Desarrollina",
    image: "./assets/desarrollina.png",
    description: "Alimento para cerdos en desarrollo"
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
    name: "Lacticerdina",
    image: "./assets/lacticerdina.jpg",
    description: "Alimento para cerdas en lactancia"
  },
  {
    name: "Pignova 5",
    image: "./assets/pignova5.png",
    description: "Alimento para cerdos Pignova fase 5"
  },
  {
    name: "Pignova 6",
    image: "./assets/pignova6.png",
    description: "Alimento para cerdos Pignova fase 6"
  },
  {
    name: "Petmaster",
    image: "./assets/petmaster.JPG",
    description: "Alimento premium para mascotas"
  },
  {
    name: "Petmaster Adulto 1 lb",
    image: "./assets/petmasteradulto1lb.jpg",
    description: "Alimento para perros adultos"
  },
  {
    name: "Petmaster Cachorro 1 lb",
    image: "./assets/petmastercachorro1lb.JPG",
    description: "Alimento para cachorros"
  },
  {
    name: "Puralean",
    image: "./assets/puralean.jpg",
    description: "Alimento balanceado premium"
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