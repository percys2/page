/*
 * Fichas basadas en el catálogo Nicaragua FY26 aportado por el usuario.
 * Edades NeoPigg complementadas con sus tablas Óptimo / Plus; ver docs/catalog-corrections-v31.md.
 */
(function () {
  "use strict";

  const analysis = (energyType, values) => {
    const [moisture, protein, fat, fiber, energy, calcium, salt, phosphorus] = values;
    return [
      ["Humedad", "Máximo", moisture],
      ["Proteína cruda", "Mínimo", protein],
      ["Grasa cruda", "Mínimo", fat],
      ["Fibra cruda", "Máximo", fiber],
      [energyType, "Mínimo", energy],
      ["Calcio", "Mín.–máx.", calcium],
      ["Sal", "Mín.–máx.", salt],
      ["Fósforo", "Mínimo", phosphorus]
    ];
  };

  const ficha = (use, stage, period, stages, form, presentation, benefits, guaranteed, sourcePage, extra = {}) => ({
    use, stage, period, stages, form, presentation, benefits, analysis: guaranteed, sourcePage, ...extra
  });

  const doguiAdult = [
    "Apoya una digestión diaria saludable y una condición corporal adecuada.",
    "Contribuye al sistema inmune, la función ocular y la salud de piel y pelo."
  ];
  const doguiPuppy = [
    "Apoya la digestión y el desarrollo del cerebro y la visión.",
    "Contribuye al crecimiento de huesos y dientes, al sistema inmune y al corazón.",
    "Favorece una piel saludable y un pelo brillante."
  ];
  const gatiAdult = [
    "Aporta 25 vitaminas y minerales esenciales.",
    "Apoya piel y pelo, digestión, tracto urinario, corazón y visión.",
    "Ayuda a reducir la formación de bolas de pelo."
  ];
  const mimadosAdult = [
    "Ayuda a mantener una condición corporal saludable.",
    "Apoya piel y pelo y ayuda a reducir el olor de las heces."
  ];
  const mimadosPuppy = [
    "Apoya el sistema digestivo.",
    "Contribuye a dientes y huesos fuertes y a una piel saludable."
  ];
  const petMasterAdult = [
    "Alimento completo y balanceado con sabor natural a hígado.",
    "Contribuye a la digestión, la salud ocular y heces más firmes y con menos olor."
  ];
  const petMasterPuppy = [
    "Alimento completo y balanceado, suave para el estómago.",
    "Contribuye al desarrollo óseo y a heces más firmes y con menos olor."
  ];

  const neoAgeSource = "https://es.scribd.com/document/912812556/Brochure-Porcicultura-Nica-Neopigg-final";
  const neoAges = (optimo, plus) => ({
    agePrograms: [{ label: "Óptimo", days: optimo }, { label: "Plus", days: plus }],
    ageSource: neoAgeSource,
    feeding: "Edades contadas desde el nacimiento. Seguí las fases de un mismo programa: NeoPigg 1 → 2 → 3 → 4."
  });
  const donGato = [
    "Receta multisabores con croquetas crujientes.",
    "Contiene taurina para apoyar visión y corazón, y calcio para el mantenimiento de huesos fuertes."
  ];

  window.AGROCENTRO_FEED_GUIDES = {
    1: ficha(
      "Alimento para apoyar el desempeño de pollos de engorde durante la finalización.",
      "Engorde · fase 2", "Desde el día 22 hasta el peso de mercado", ["engorde"], "Pellet", "45.4 kg / 100 lb",
      ["Favorece la conversión alimenticia y la ganancia diaria de peso.", "Apoya la absorción de nutrientes y el rendimiento de carne por área."],
      analysis("Energía metabolizable", ["13.00%", "19.00%", "4.00%", "5.00%", "2,950 Kcal/Kg", "0.60–1.00%", "0.10–0.45%", "0.50%"]), "págs. 7–8"
    ),
    2: ficha(
      "Alimento de inicio para que los pollos de engorde tengan un buen arranque.",
      "Inicio · fase 1", "Días 8–21 de edad", ["inicio"], "Crumble", "45.4 kg / 100 lb",
      ["Estimula el consumo de alimento.", "Apoya las funciones inmune y digestiva, la ganancia diaria de peso y la uniformidad del lote."],
      analysis("Energía metabolizable", ["13.00%", "22.00%", "4.00%", "5.00%", "2,900 Kcal/Kg", "0.80–1.20%", "0.10–0.45%", "0.45%"]), "págs. 6 y 8"
    ),
    3: ficha(
      "Alimento para gallos en crecimiento o con actividad física frecuente.",
      "Crecimiento y actividad física", "Durante el crecimiento y la etapa adulta", ["desarrollo", "mantenimiento"], "Pellet", "45.4 kg / 100 lb",
      ["Ayuda a aumentar las reservas de energía.", "Apoya el tono muscular y unas plumas más fuertes y flexibles."],
      analysis("Energía metabolizable", ["13.00%", "19.00%", "3.50%", "5.00%", "3,000 Kcal/Kg", "0.80–1.00%", "0.10–0.45%", "0.35%"]), "págs. 64–65",
      { feeding: "Suministrar a libre acceso; reducir la ración si el gallo no está creciendo ni tiene actividad física frecuente.", aliases: ["Novagallos", "Nova Gallos"] }
    ),
    4: ficha(
      "Alimento para el desarrollo y rápido crecimiento de pollitos en sus primeros días.",
      "Preinicio · fase 0", "Días 1–7 de edad", ["preinicio"], "Crumble", "45.4 kg / 100 lb",
      ["Favorece la ganancia de peso.", "Apoya la integridad intestinal y el desarrollo corporal."],
      analysis("Energía metabolizable", ["13.00%", "21.00%", "3.00%", "5.50%", "2,850 Kcal/Kg", "0.80–1.10%", "0.10–0.45%", "0.50%"]), "págs. 5 y 8",
      { aliases: ["Pre iniciarina", "Preiniciarina"] }
    ),
    10: ficha(
      "Alimento formulado para pollos criollos durante crecimiento y engorde.",
      "Crecimiento y engorde", "Durante el crecimiento y engorde de pollos criollos", ["desarrollo", "engorde"], "Pellet", "45.4 kg / 100 lb",
      ["Cubre los requerimientos nutricionales de pollos criollos en crecimiento y engorde.", "Brinda alimentación eficiente y ayuda a conservar la salud intestinal."],
      analysis("Energía metabolizable", ["13.00%", "16.00%", "3.00%", "5.50%", "2,500 Kcal/Kg", "0.90–1.20%", "0.10–0.45%", "0.45%"]), "págs. 4 y 8"
    ),
    11: ficha(
      "Alimento especialmente formulado para gallinas criollas en postura.",
      "Producción / postura", "Durante todo el ciclo de postura", ["produccion"], "Harina", "45.4 kg / 100 lb",
      ["Favorece un consumo alimenticio óptimo.", "Apoya la persistencia de postura y la rentabilidad por huevo."],
      analysis("Energía metabolizable", ["13.00%", "12.50%", "3.00%", "6.50%", "2,400 Kcal/Kg", "4.00–4.90%", "0.10–0.45%", "0.45%"]), "págs. 14 y 21",
      { aliases: ["Ponedora Criolla"] }
    ),

    5: ficha(
      "Suplemento proteico para caballos en cualquier etapa fisiológica.",
      "Todas las edades y etapas", "Potros, crecimiento, recuperación, competencia y reproductores", ["desarrollo", "gestacion", "lactancia", "mantenimiento"], "Peletizado (checker)", "25 kg / 55.11 lb",
      ["Favorece el desarrollo de masa muscular y la salud intestinal.", "Apoya la recuperación y es apropiado para yeguas de cría y potros."],
      analysis("Energía digestible", ["12.00%", "30.00%", "3.00%", "8.00%", "2,610 Kcal/Kg", "1.40–2.35%", "1.00–1.50%", "1.45%"]), "págs. 57–58",
      { feeding: "Al día: potros, 200–250 g · caballos en crecimiento y recuperación, 500–750 g · caballos en competencia, 500 g–1 kg · yeguas y sementales, 750 g–1 kg. Con agua limpia y fresca siempre disponible." }
    ),
    6: ficha(
      "Alimento para recreación, trabajo ligero y mantenimiento; también para reproductores en descanso.",
      "Mantenimiento / trabajo ligero", "Recreación, trabajo ligero, mantenimiento o descanso reproductivo", ["mantenimiento"], "Peletizado (checker)", "45.4 kg / 100 lb",
      ["Ayuda a reducir riesgos nutricionales asociados a cólicos y laminitis.", "Apoya la salud intestinal y aporta 13% de proteína cruda."],
      analysis("Energía digestible", ["13.00%", "13.00%", "2.50%", "10.00%", "2,900 Kcal/Kg", "0.80–1.30%", "0.50–1.00%", "0.50%"]), "págs. 54 y 58",
      { feeding: "Ración diaria según el peso del caballo: 270 kg, 2.45–2.70 kg · 360 kg, 3.05–3.60 kg · 450 kg, 4.00–4.50 kg · 545 kg, 4.95–5.45 kg · 635 kg, 5.77–6.35 kg, además del heno. Repartir en al menos 3 comidas y ajustar hasta 10% según la condición corporal." }
    ),
    7: ficha(
      "Alimento para caballos deportivos y de trabajo intenso: polo, equitación, salto, endurance y preparación de exposiciones.",
      "Alto rendimiento / trabajo intenso", "Deporte y trabajo intenso · potros desde 24 meses · yeguas del mes 1 al 9 de gestación · garañones en reproducción", ["mantenimiento", "gestacion"], "Peletizado (checker)", "45.4 kg / 100 lb",
      ["Ayuda a reducir riesgos nutricionales asociados a cólicos y laminitis.", "Apoya la salud intestinal y aporta 14% de proteína cruda para alto rendimiento."],
      analysis("Energía digestible", ["13.00%", "14.00%", "4.00%", "15.00%", "3,000 Kcal/Kg", "0.80–1.40%", "0.50–1.00%", "0.40%"]), "págs. 55 y 58",
      { feeding: "Repartir en al menos 3 comidas al día. La ración depende del peso del caballo y de la intensidad del trabajo." }
    ),
    8: ficha(
      "Alimento para yeguas de cría y potros en crecimiento.",
      "Gestación, lactancia y crecimiento", "Yeguas: mes 9 de gestación al fin de lactancia · potros: 2–18 meses", ["desarrollo", "gestacion", "lactancia"], "Peletizado (checker)", "45.4 kg / 100 lb",
      ["Ayuda a reducir riesgos nutricionales asociados a cólicos y laminitis.", "Apoya la salud intestinal; aporta 16% de proteína y nutrientes para yeguas y potros."],
      analysis("Energía digestible", ["13.00%", "16.00%", "5.00%", "10.00%", "3,100 Kcal/Kg", "1.10–1.40%", "0.50–1.00%", "0.60%"]), "págs. 56 y 58",
      { feeding: "Yegua con potro, ración diaria según el peso del potro: 100 kg, 7.5 kg + 5 kg de heno · 150 kg, 8 kg + 6 kg · 200 kg, 9 kg + 6.5 kg · 250 kg, 8 kg + 7 kg · 300 kg, 7 kg + 7.5 kg. Repartir en al menos 3 comidas y ajustar hasta 10% según la condición corporal." }
    ),
    23: ficha(
      "Suplemento fuente de fibra que mejora el tránsito intestinal de caballos de todas las edades.",
      "Todas las edades / aporte de fibra", "Caballos de cualquier edad", ["desarrollo", "gestacion", "lactancia", "mantenimiento"], "Peletizado (checker)", "45.4 kg / 100 lb",
      ["Se usa como fuente única de fibra o como complemento del pasto y el heno.", "Ayuda a mantener un aporte fibroso uniforme y un nivel energético adecuado."],
      analysis("Energía digestible", ["13.00%", "10.00%", "2.00%", "15.00%", "2,660 Kcal/Kg", "0.40–1.40%", "0.50–1.00%", "0.20%"]), "págs. 53 y 58",
      { feeding: "0.5–1.5 kg por cada 100 kg de peso vivo al día, repartidos en varias tomas. Como fuente única de fibra: 300 kg, 4.5 kg · 450 kg, 5 kg · 500 kg, 5.5 kg · 550 kg, 6 kg. Como complemento de la fibra: 1.5 · 2 · 2.5 · 3 kg." }
    ),
    9: ficha(
      "Alimento completo para conejos de todas las razas y edades.",
      "Crecimiento, desarrollo y engorde", "Todas las edades", ["desarrollo", "engorde"], "Pellet", "45.4 kg / 100 lb",
      ["Ofrece nutrición completa y apoya la salud digestiva e intestinal.", "Contribuye a un pelo sano y brillante."],
      analysis("Energía digestible", ["13.00%", "17.00%", "2.00%", "10.00%", "3,000 Kcal/Kg", "0.70–1.50%", "0.50–1.00%", "0.50%"]), "págs. 63 y 65",
      { feeding: "Suministrar a libre acceso como única ración.", aliases: ["Conejos"] }
    ),

    24: ficha(
      "Primera dieta sólida para lechones antes y después del destete.",
      "Preinicio · fase 1", "Óptimo: 5–27 días · Plus: 5–30 días", ["preinicio"], "Pellet", "20 kg / 44 lb",
      ["Usa ingredientes digestibles para apoyar el crecimiento.", "Favorece la salud intestinal, la conversión alimenticia y la respuesta inmune."],
      analysis("Energía digestible", ["12.50%", "19.00%", "2.50%", "3.50%", "3,300 Kcal/Kg", "0.60–1.00%", "0.15–0.50%", "0.50%"]), "págs. 29 y 40",
      neoAges("5–27", "5–30")
    ),
    25: ficha(
      "Segunda fase para consolidar el alimento sólido y continuar el desarrollo gastrointestinal.",
      "Preinicio · fase 2", "Óptimo: 28–34 días · Plus: 31–39 días", ["preinicio"], "Pellet", "25 kg / 55.1 lb",
      ["Usa ingredientes digestibles para apoyar el crecimiento.", "Favorece la salud intestinal, la conversión alimenticia y la respuesta inmune."],
      analysis("Energía digestible", ["12.50%", "19.00%", "2.50%", "3.50%", "3,250 Kcal/Kg", "0.60–1.00%", "0.15–0.50%", "0.50%"]), "págs. 30 y 40",
      neoAges("28–34", "31–39")
    ),
    37: ficha(
      "Tercera fase para completar la maduración gastrointestinal y preparar la siguiente etapa.",
      "Preinicio · fase 3", "Óptimo: 35–43 días · Plus: 40–48 días", ["preinicio"], "Pellet", "25 kg / 55.1 lb",
      ["Usa ingredientes digestibles para apoyar el crecimiento.", "Favorece la salud intestinal, la conversión alimenticia y la respuesta inmune."],
      analysis("Energía digestible", ["13.00%", "18.50%", "2.50%", "3.50%", "3,200 Kcal/Kg", "0.60–1.00%", "0.15–0.50%", "0.45%"]), "págs. 31 y 40",
      neoAges("35–43", "40–48")
    ),
    26: ficha(
      "Última fase NeoPigg para maximizar el crecimiento antes del engorde.",
      "Inicio · fase 4", "Óptimo: 44–70 días · Plus: 49–70 días", ["inicio"], "Pellet", "45.4 kg / 100 lb",
      ["Usa ingredientes digestibles para apoyar el crecimiento.", "Favorece la salud intestinal, la conversión alimenticia y la respuesta inmune."],
      analysis("Energía digestible", ["13.00%", "18.00%", "2.50%", "4.00%", "3,150 Kcal/Kg", "0.60–1.00%", "0.15–0.50%", "0.43%"]), "págs. 32 y 40",
      neoAges("44–70", "49–70")
    ),
    27: ficha(
      "Alimento para cerdos en etapa de desarrollo.",
      "Desarrollo · fase 5", "Días 71–119 de edad", ["desarrollo"], "Pellet", "45.4 kg / 100 lb",
      ["Favorece la absorción de nutrientes y una ganancia de peso adecuada.", "Orienta el programa hacia un mejor retorno de inversión."],
      analysis("Energía digestible", ["13.00%", "16.00%", "4.50%", "6.00%", "3,100 Kcal/Kg", "0.59–1.09%", "0.20–0.60%", "0.21%"]), "págs. 34 y 40",
      { feeding: "Línea estándar después de NeoPigg 4: Desarrollina → Jamonina." }
    ),
    28: ficha(
      "Alimento para cerdos en la etapa final de engorde.",
      "Finalización · fase 6", "Desde el día 120 hasta el peso de mercado", ["engorde"], "Pellet", "45.4 kg / 100 lb",
      ["Favorece la absorción de nutrientes y una ganancia de peso adecuada.", "Orienta el programa hacia un mejor retorno de inversión."],
      analysis("Energía digestible", ["13.00%", "14.00%", "4.00%", "6.00%", "3,130 Kcal/Kg", "0.59–1.00%", "0.20–0.60%", "0.23%"]), "págs. 35 y 40",
      { feeding: "Línea estándar después de NeoPigg 4: Desarrollina → Jamonina." }
    ),
    29: ficha(
      "Alimento para preparar nutricionalmente a las cerdas durante la gestación.",
      "Gestación", "Desde la monta o servicio hasta el parto", ["gestacion"], "Pellet", "45.4 kg / 100 lb",
      ["Apoya el número de lechones nacidos vivos y su peso al nacimiento.", "Ayuda a mantener la condición corporal de la cerda."],
      analysis("Energía digestible", ["13.00%", "13.00%", "3.00%", "10.00%", "3,100 Kcal/Kg", "0.80–1.05%", "0.20–0.60%", "0.30%"]), "págs. 25 y 39"
    ),
    30: ficha(
      "Alimento para cubrir las exigencias nutricionales de cerdas lactantes.",
      "Lactancia", "Desde el parto hasta el destete y/o nueva monta", ["lactancia"], "Pellet", "45.4 kg / 100 lb",
      ["Apoya el número y peso de los lechones al destete.", "Contribuye a más partos por año y a una condición corporal adecuada."],
      analysis("Energía digestible", ["13.00%", "15.00%", "5.00%", "7.00%", "3,200 Kcal/Kg", "0.96–1.23%", "0.30–1.10%", "0.33%"]), "págs. 26 y 39"
    ),
    31: ficha(
      "Alimento de crecimiento orientado a producir más carne por unidad de alimento.",
      "Crecimiento · fase 5", "Días 71–91 de edad", ["desarrollo"], "Pellet", "45.4 kg / 100 lb",
      ["Alta digestibilidad y ganancia diaria de peso.", "Favorece una conversión alimenticia eficiente."],
      analysis("Energía digestible", ["13.00%", "16.50%", "3.00%", "6.00%", "2,390 Kcal/Kg", "0.10–1.50%", "0.10–1.00%", "0.10%"]), "págs. 36 y 40",
      { feeding: "Línea Pig-Nova después de NeoPigg 4: Pig-Nova 5 → Pig-Nova 6. Pur-A-Lean corresponde a la finalización del programa tecnificado.", aliases: ["Pignova 5", "Pignova premium"] }
    ),
    32: ficha(
      "Alimento para mejorar el aprovechamiento de nutrientes y el desempeño durante el desarrollo.",
      "Desarrollo · fase 6", "Días 92–119 de edad", ["desarrollo"], "Pellet", "45.4 kg / 100 lb",
      ["Alta digestibilidad y ganancia diaria de peso.", "Favorece una conversión alimenticia eficiente."],
      analysis("Energía digestible", ["13.00%", "16.00%", "2.00%", "6.50%", "2,345 Kcal/Kg", "0.10–1.50%", "0.10–1.00%", "0.10%"]), "págs. 37 y 40",
      { feeding: "Línea Pig-Nova: Pig-Nova 5 → Pig-Nova 6. Pur-A-Lean corresponde a la finalización del programa tecnificado.", aliases: ["Pignova 6", "Pignova premium"] }
    ),
    36: ficha(
      "Alimento para el acabado final del cerdo y su desempeño productivo.",
      "Finalización · fase 7", "Desde el día 120 al peso de mercado · últimos 28–42 días", ["engorde"], "Pellet", "45.4 kg / 100 lb",
      ["Favorece la digestibilidad y la conversión alimenticia.", "Apoya una buena calidad de carne."],
      analysis("Energía metabolizable", ["13.00%", "16.00%", "2.80%", "6.00%", "3,100 Kcal/Kg", "0.40–0.80%", "0.05–0.50%", "0.25%"]), "págs. 38 y 40",
      { feeding: "Programa tecnificado: Pig-Nova 5 → Pig-Nova 6 → Pur-A-Lean.", aliases: ["Puralean"] }
    ),

    12: ficha("Alimento de la línea Mimados para perros adultos.", "Adulto / mantenimiento", "Durante la etapa adulta", ["mantenimiento"], "Alimento seco", "22.7 kg / 50 lb · línea: 0.454, 1, 2, 4 y 22.7 kg", mimadosAdult, null, "pág. 70", { aliases: ["Mimado Adulto"] }),
    13: ficha("Alimento de la línea Mimados para cachorros.", "Cachorro / crecimiento", "Durante la etapa de cachorro y crecimiento", ["desarrollo"], "Alimento seco", "22.7 kg / 50 lb · línea: 1, 2, 4, 9, 18 y 22.7 kg", mimadosPuppy, null, "pág. 70", { aliases: ["Mimado Cachorro"] }),
    14: ficha("Alimento Dogui sabor carne para perros adultos de razas medianas y grandes.", "Adulto / mantenimiento", "Desde los 18 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "454 g / 1 lb · línea Adultos: 0.45, 2, 4 y 18 kg", doguiAdult, null, "pág. 67", { aliases: ["Dogui Carne 1 lb"] }),
    15: ficha("Alimento Dogui con carnes y vegetales para perros adultos de razas medianas y grandes.", "Adulto / mantenimiento", "Desde los 18 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "18 kg / 39.6 lb · línea Adultos: 0.45, 2, 4 y 18 kg", doguiAdult, null, "pág. 67", { aliases: ["Dogui Carne y Vegetales"] }),
    16: ficha("Alimento Dogui para cachorros de razas medianas y grandes.", "Cachorro / crecimiento", "Desde los 2 meses, según la etiqueta del saco", ["desarrollo"], "Alimento seco", "454 g / 1 lb · línea Cachorros: 0.45, 2, 4, 7 y 18 kg", doguiPuppy, null, "pág. 67", { aliases: ["Dogui Cachorro 1 lb"] }),
    17: ficha("Alimento Dogui para cachorros de razas medianas y grandes.", "Cachorro / crecimiento", "Desde los 2 meses, según la etiqueta del saco", ["desarrollo"], "Alimento seco", "18 kg / 39.6 lb · línea Cachorros: 0.45, 2, 4, 7 y 18 kg", doguiPuppy, null, "pág. 67"),
    18: ficha("Alimento Don Gato para gatos adultos.", "Adulto / mantenimiento", "Desde los 12 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "454 g / 1 lb · línea: 0.454, 1, 8 y 20 kg", donGato, null, "pág. 72", { aliases: ["Don Gato 1 lb"] }),
    19: ficha("Alimento Don Gato para gatos adultos.", "Adulto / mantenimiento", "Desde los 12 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "8 kg / 17.6 lb · línea: 0.454, 1, 8 y 20 kg", donGato, null, "pág. 72", { aliases: ["Don Gato 17.6 lbs"] }),
    20: ficha("Alimento Gati Mar y Tierra para gatos adultos.", "Adulto / mantenimiento", "Desde los 12 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "454 g / 1 lb · línea Adultos: 0.45, 1, 3 y 8 kg", gatiAdult, null, "pág. 68", { aliases: ["Gaty 1 lb", "Gati 1 lb"] }),
    21: ficha("Alimento Gati Mar y Tierra para gatos adultos.", "Adulto / mantenimiento", "Desde los 12 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "8 kg / 17.6 lb · línea Adultos: 0.45, 1, 3 y 8 kg", gatiAdult, null, "pág. 68", { aliases: ["Gaty 17.6 lbs", "Gati 17.6 lbs"] }),
    33: ficha("Alimento completo y balanceado Pet Master para perros adultos.", "Adulto / mantenimiento", "Desde los 18 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "20 kg / 44.1 lb · línea Adultos: 0.454, 1, 2, 4, 9, 18, 20 y 22 kg", petMasterAdult, null, "pág. 71", { aliases: ["Petmaster", "Pet Master"] }),
    34: ficha("Alimento completo y balanceado Pet Master para perros adultos.", "Adulto / mantenimiento", "Desde los 18 meses, según la etiqueta del saco", ["mantenimiento"], "Alimento seco", "454 g / 1 lb · línea Adultos: 0.454, 1, 2, 4, 9, 18, 20 y 22 kg", petMasterAdult, null, "pág. 71", { aliases: ["Petmaster Adulto 1 lb"] }),
    35: ficha("Alimento completo y balanceado Pet Master para cachorros.", "Cachorro / crecimiento", "De 2 a 18 meses, según la etiqueta del saco", ["desarrollo"], "Alimento seco", "20 kg / 44.1 lb", petMasterPuppy, null, "pág. 71", { aliases: ["Petmaster Cachorro 44 lb", "Pet Master Cachorro"] }),
    40: ficha("Alimento completo y balanceado Pet Master para cachorros.", "Cachorro / crecimiento", "De 2 a 18 meses, según la etiqueta del saco", ["desarrollo"], "Alimento seco", "454 g / 1 lb", petMasterPuppy, null, "pág. 71", { aliases: ["Petmaster Cachorro 1 lb", "Pet Master Cachorro"] }),
    38: ficha(
      "Alimento para gallinas de patio durante la producción de huevos.",
      "Postura · fase 1", "Desde las 18 semanas, durante todo el ciclo de postura", ["produccion"], "Harina", "45.4 kg / 100 lb",
      ["Aporta nutrientes para sostener la postura y la condición corporal de la gallina."],
      analysis("Energía metabolizable", ["13.00%", "18.00%", "5.00%", "5.00%", "2,750 kcal/kg", "4.00–5.00%", "0.01–0.50%", "0.60%"]), "págs. 15 y 21",
      { aliases: ["Posturina Fase1", "Posturina 1", "Ponedoras"] }
    ),
    39: ficha(
      "Alimento para gallinas de granja en la primera fase de postura.",
      "Postura · fase 1", "Desde las 19–21 semanas hasta las 59 semanas", ["produccion"], "Harina", "45.4 kg / 100 lb",
      ["Apoya la producción y el peso del huevo, así como la pigmentación de la yema."],
      analysis("Energía metabolizable", ["13.00%", "18.50%", "3.50%", "5.00%", "2,800 kcal/kg", "4.00–4.50%", "0.10–0.40%", "0.45%"]), "págs. 16 y 21",
      { aliases: ["PosturinaHP", "Posturina HP", "Ponedoras"] }
    )
  };
})();
