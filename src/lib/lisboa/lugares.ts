/* «Monte a sua Lisboa»: os 21 lugares (dados do protótipo validado, places.json de 19/11/2026).
   Factos das histórias aprovados pelo Junior: não reescrever nem acrescentar sem o pedido dele.
   n = número do lugar (os guias em PDF apontam para #p-1 … #p-21; não renumerar).
   min = tempo sugerido no local, em minutos. promptImagem = descrição usada para criar as imagens (nunca vai para a página). */

import { LUGARES_FR_IT } from "./lugares-fr-it";
import type { Lugar, SemFrIt } from "./tipos";

const BASE: SemFrIt<Lugar>[] = [
  {
    "n": 1,
    "id": "praca-comercio",
    "zona": "Baixa",
    "lat": 38.7076,
    "lng": -9.1365,
    "min": 30,
    "pt": {
      "nome": "Praça do Comércio",
      "txt": "A grande praça aberta ao rio.",
      "hist": "Aqui ficava o palácio real, até o terramoto de 1755 o destruir. A praça que vê hoje nasceu da reconstrução do Marquês de Pombal, uma das primeiras cidades planeadas da Europa."
    },
    "en": {
      "nome": "Praça do Comércio",
      "txt": "The grand square that opens onto the river.",
      "hist": "The royal palace stood here until the 1755 earthquake destroyed it. The square you see today was born from the Marquis of Pombal's rebuild, one of Europe's first planned cities."
    },
    "es": {
      "nome": "Praça do Comércio",
      "txt": "La gran plaza abierta al río.",
      "hist": "Aquí estaba el palacio real hasta que el terremoto de 1755 lo destruyó. La plaza que ve hoy nació de la reconstrucción del Marqués de Pombal, una de las primeras ciudades planificadas de Europa."
    },
    "promptImagem": "Wide golden-hour view of Praça do Comércio in Lisbon, yellow arcaded buildings, triumphal arch, Tagus river, few people, editorial travel photography"
  },
  {
    "n": 2,
    "id": "arco-augusta",
    "zona": "Baixa",
    "lat": 38.7081,
    "lng": -9.1368,
    "min": 30,
    "pt": {
      "nome": "Arco da Rua Augusta",
      "txt": "Suba ao topo do arco: a Baixa inteira a seus pés.",
      "hist": "O arco levou mais de cem anos a ficar pronto: começou depois do terramoto e só foi concluído em 1875. Lá em cima, o miradouro fica mesmo ao lado do relógio."
    },
    "en": {
      "nome": "Rua Augusta Arch",
      "txt": "Climb to the top: all of downtown at your feet.",
      "hist": "The arch took over a hundred years to finish: begun after the earthquake, it was only completed in 1875. Up top, the viewpoint sits right next to the clock."
    },
    "es": {
      "nome": "Arco de la Rua Augusta",
      "txt": "Suba a lo alto: toda la Baixa a sus pies.",
      "hist": "El arco tardó más de cien años en terminarse: empezó tras el terremoto y se concluyó en 1875. Arriba, el mirador está junto al reloj."
    },
    "promptImagem": "Rua Augusta triumphal arch in Lisbon seen from the pedestrian street, warm afternoon light, wavy Portuguese cobblestones, travel photography"
  },
  {
    "n": 3,
    "id": "santa-justa",
    "zona": "Baixa",
    "lat": 38.7121,
    "lng": -9.1394,
    "min": 20,
    "pt": {
      "nome": "Elevador de Santa Justa",
      "txt": "Ferro forjado e uma vista sobre a Baixa.",
      "hist": "Muitos juram que é obra de Eiffel, mas o autor foi um discípulo dele, Raoul Mesnier du Ponsard. Funciona desde 1902 e liga a Baixa ao Largo do Carmo."
    },
    "en": {
      "nome": "Santa Justa Lift",
      "txt": "Wrought iron and a view over downtown.",
      "hist": "Many swear it's by Eiffel, but it was designed by one of his disciples, Raoul Mesnier du Ponsard. It has run since 1902, linking downtown to Largo do Carmo."
    },
    "es": {
      "nome": "Elevador de Santa Justa",
      "txt": "Hierro forjado y vistas sobre la Baixa.",
      "hist": "Muchos juran que es obra de Eiffel, pero lo diseñó un discípulo suyo, Raoul Mesnier du Ponsard. Funciona desde 1902 y une la Baixa con el Largo do Carmo."
    },
    "promptImagem": "Neo-gothic wrought iron Santa Justa elevator in Lisbon against blue sky, low angle, editorial travel photography"
  },
  {
    "n": 4,
    "id": "se",
    "zona": "Alfama",
    "lat": 38.7099,
    "lng": -9.1334,
    "min": 20,
    "pt": {
      "nome": "Sé de Lisboa",
      "txt": "A igreja mais antiga da cidade.",
      "hist": "Começou a ser construída logo depois de 1147, quando D. Afonso Henriques conquistou Lisboa. À porta passa o elétrico 28, na fotografia mais clássica da cidade."
    },
    "en": {
      "nome": "Lisbon Cathedral",
      "txt": "The city's oldest church.",
      "hist": "Building began soon after 1147, when King Afonso Henriques took Lisbon. Tram 28 passes right by its door, in the city's most classic photo."
    },
    "es": {
      "nome": "Catedral de Lisboa",
      "txt": "La iglesia más antigua de la ciudad.",
      "hist": "Se empezó a construir poco después de 1147, cuando el rey Afonso Henriques conquistó Lisboa. El tranvía 28 pasa por delante, en la foto más clásica de la ciudad."
    },
    "promptImagem": "Lisbon Cathedral Sé romanesque facade with a yellow vintage tram passing in front, morning light, travel photography"
  },
  {
    "n": 5,
    "id": "santa-luzia",
    "zona": "Alfama",
    "lat": 38.7118,
    "lng": -9.1302,
    "min": 20,
    "pt": {
      "nome": "Miradouro de Santa Luzia",
      "txt": "Azulejos, buganvílias e os telhados de Alfama.",
      "hist": "Repare nos painéis de azulejo do muro: um deles mostra a Praça do Comércio tal como era antes do terramoto de 1755."
    },
    "en": {
      "nome": "Santa Luzia Viewpoint",
      "txt": "Tiles, bougainvillea and the rooftops of Alfama.",
      "hist": "Look at the tile panels on the wall: one of them shows Praça do Comércio as it was before the 1755 earthquake."
    },
    "es": {
      "nome": "Mirador de Santa Luzia",
      "txt": "Azulejos, buganvillas y los tejados de Alfama.",
      "hist": "Fíjese en los paneles de azulejos del muro: uno muestra la Praça do Comércio tal como era antes del terremoto de 1755."
    },
    "promptImagem": "Miradouro de Santa Luzia in Lisbon, blue and white azulejo tiles, bougainvillea pergola, terracotta rooftops of Alfama and the river, sunset"
  },
  {
    "n": 6,
    "id": "castelo",
    "zona": "Alfama",
    "lat": 38.7139,
    "lng": -9.1335,
    "min": 75,
    "pt": {
      "nome": "Castelo de São Jorge",
      "txt": "Muralhas mouras e a melhor vista sobre o rio.",
      "hist": "Foi conquistado aos mouros em 1147. Hoje, quem manda nos jardins são os pavões, que passeiam à vontade entre os visitantes."
    },
    "en": {
      "nome": "São Jorge Castle",
      "txt": "Moorish walls and the best view over the river.",
      "hist": "It was taken from the Moors in 1147. Today the gardens belong to the peacocks, who stroll freely among the visitors."
    },
    "es": {
      "nome": "Castillo de San Jorge",
      "txt": "Murallas moriscas y la mejor vista del río.",
      "hist": "Fue conquistado a los moros en 1147. Hoy los jardines son de los pavos reales, que pasean a sus anchas entre los visitantes."
    },
    "promptImagem": "Stone battlements of São Jorge Castle in Lisbon with a peacock in the foreground and the city and river below, soft light"
  },
  {
    "n": 7,
    "id": "senhora-monte",
    "zona": "Graça",
    "lat": 38.7193,
    "lng": -9.1327,
    "min": 20,
    "pt": {
      "nome": "Miradouro da Senhora do Monte",
      "txt": "O miradouro mais alto de Lisboa.",
      "hist": "É o ponto mais alto entre os miradouros da cidade. Ao pôr do sol vê-se o castelo, a Baixa e a ponte 25 de Abril de uma só vez."
    },
    "en": {
      "nome": "Senhora do Monte Viewpoint",
      "txt": "Lisbon's highest viewpoint.",
      "hist": "It's the highest of the city's viewpoints. At sunset you can see the castle, downtown and the 25 de Abril bridge all at once."
    },
    "es": {
      "nome": "Mirador de la Senhora do Monte",
      "txt": "El mirador más alto de Lisboa.",
      "hist": "Es el más alto de los miradores de la ciudad. Al atardecer se ven el castillo, la Baixa y el puente 25 de Abril a la vez."
    },
    "promptImagem": "Panoramic sunset view of Lisbon from Miradouro da Senhora do Monte, castle on the hill, red rooftops, bridge in the distance, pine tree silhouette"
  },
  {
    "n": 8,
    "id": "chiado",
    "zona": "Chiado",
    "lat": 38.7107,
    "lng": -9.1424,
    "min": 45,
    "pt": {
      "nome": "Chiado e A Brasileira",
      "txt": "Livrarias, cafés antigos e um poeta à porta.",
      "hist": "À porta do café A Brasileira está sentado, em bronze, Fernando Pessoa, o maior poeta português, que escrevia por ali. Há sempre uma cadeira livre ao lado dele para a fotografia."
    },
    "en": {
      "nome": "Chiado and A Brasileira",
      "txt": "Bookshops, old cafés and a poet at the door.",
      "hist": "Outside the café A Brasileira sits a bronze Fernando Pessoa, Portugal's greatest poet, who used to write nearby. There's always an empty chair beside him for your photo."
    },
    "es": {
      "nome": "Chiado y A Brasileira",
      "txt": "Librerías, cafés antiguos y un poeta en la puerta.",
      "hist": "En la puerta del café A Brasileira está sentado, en bronce, Fernando Pessoa, el mayor poeta portugués, que escribía por allí. Siempre hay una silla libre a su lado para la foto."
    },
    "promptImagem": "Art deco facade of an old Lisbon café in Chiado with outdoor tables and a bronze statue of a seated man in a hat, morning light"
  },
  {
    "n": 9,
    "id": "sao-pedro",
    "zona": "Bairro Alto",
    "lat": 38.7155,
    "lng": -9.1446,
    "min": 20,
    "pt": {
      "nome": "Miradouro de São Pedro de Alcântara",
      "txt": "O castelo do outro lado do vale.",
      "hist": "Mesmo ao lado sobe e desce o Ascensor da Glória, um dos funiculares que ajudam os lisboetas a vencer as sete colinas desde o século XIX."
    },
    "en": {
      "nome": "São Pedro de Alcântara Viewpoint",
      "txt": "The castle across the valley.",
      "hist": "Right next to it, the Glória funicular climbs up and down, one of the lifts that have helped locals beat the seven hills since the 19th century."
    },
    "es": {
      "nome": "Mirador de São Pedro de Alcântara",
      "txt": "El castillo al otro lado del valle.",
      "hist": "Justo al lado sube y baja el Ascensor da Glória, uno de los funiculares que ayudan a los lisboetas a vencer las siete colinas desde el siglo XIX."
    },
    "promptImagem": "Garden terrace viewpoint in Lisbon with view of the castle across the valley, yellow funicular on a steep street nearby, late afternoon"
  },
  {
    "n": 10,
    "id": "time-out",
    "zona": "Cais do Sodré",
    "lat": 38.7069,
    "lng": -9.1459,
    "min": 60,
    "pt": {
      "nome": "Time Out Market",
      "txt": "Muitos chefes sob o mesmo teto.",
      "hist": "Funciona dentro do Mercado da Ribeira, que vende peixe e legumes há mais de um século. De manhã ainda há bancas tradicionais ao lado."
    },
    "en": {
      "nome": "Time Out Market",
      "txt": "Many chefs under one roof.",
      "hist": "It sits inside Mercado da Ribeira, which has sold fish and vegetables for over a century. In the morning, traditional stalls still trade next door."
    },
    "es": {
      "nome": "Time Out Market",
      "txt": "Muchos chefs bajo el mismo techo.",
      "hist": "Está dentro del Mercado da Ribeira, que vende pescado y verdura desde hace más de un siglo. Por la mañana aún hay puestos tradicionales al lado."
    },
    "promptImagem": "Bright busy food hall interior with long communal tables and food stalls, Lisbon market, warm light, editorial food photography"
  },
  {
    "n": 11,
    "id": "lx-factory",
    "zona": "Alcântara",
    "lat": 38.7033,
    "lng": -9.1787,
    "min": 60,
    "pt": {
      "nome": "LX Factory",
      "txt": "Uma fábrica antiga cheia de vida.",
      "hist": "Era um complexo industrial do século XIX. Hoje tem lojas, restaurantes e a livraria Ler Devagar, com estantes até ao teto e uma bicicleta voadora."
    },
    "en": {
      "nome": "LX Factory",
      "txt": "An old factory full of life.",
      "hist": "It was a 19th-century industrial complex. Today it holds shops, restaurants and the Ler Devagar bookshop, with shelves to the ceiling and a flying bicycle."
    },
    "es": {
      "nome": "LX Factory",
      "txt": "Una antigua fábrica llena de vida.",
      "hist": "Era un complejo industrial del siglo XIX. Hoy tiene tiendas, restaurantes y la librería Ler Devagar, con estanterías hasta el techo y una bicicleta voladora."
    },
    "promptImagem": "Huge bookshop inside an old printing factory, floor-to-ceiling shelves, an artistic bicycle sculpture hanging from the ceiling, warm light"
  },
  {
    "n": 12,
    "id": "cristo-rei",
    "zona": "Almada",
    "lat": 38.6785,
    "lng": -9.1712,
    "min": 40,
    "pt": {
      "nome": "Cristo Rei",
      "txt": "Lisboa inteira vista da outra margem.",
      "hist": "Inaugurado em 1959, foi inspirado no Cristo Redentor do Rio de Janeiro. É uma promessa de agradecimento por Portugal não ter entrado na Segunda Guerra Mundial."
    },
    "en": {
      "nome": "Cristo Rei",
      "txt": "All of Lisbon from across the river.",
      "hist": "Opened in 1959 and inspired by Rio de Janeiro's Christ the Redeemer, it was built in thanks for Portugal staying out of the Second World War."
    },
    "es": {
      "nome": "Cristo Rei",
      "txt": "Toda Lisboa desde la otra orilla.",
      "hist": "Inaugurado en 1959 e inspirado en el Cristo Redentor de Río de Janeiro, se levantó en agradecimiento por que Portugal no entrara en la Segunda Guerra Mundial."
    },
    "promptImagem": "Tall Christ the King statue on a pedestal above the Tagus river with the red suspension bridge and Lisbon skyline, golden hour"
  },
  {
    "n": 13,
    "id": "jeronimos",
    "zona": "Belém",
    "lat": 38.6979,
    "lng": -9.2068,
    "min": 60,
    "pt": {
      "nome": "Mosteiro dos Jerónimos",
      "txt": "O manuelino no seu esplendor.",
      "hist": "Foi pago com o comércio das especiarias que chegavam da Índia. Lá dentro está o túmulo de Vasco da Gama. Fechado às segundas."
    },
    "en": {
      "nome": "Jerónimos Monastery",
      "txt": "Manueline style at its finest.",
      "hist": "It was paid for by the spice trade arriving from India. Inside lies the tomb of Vasco da Gama. Closed on Mondays."
    },
    "es": {
      "nome": "Monasterio de los Jerónimos",
      "txt": "El estilo manuelino en todo su esplendor.",
      "hist": "Se pagó con el comercio de las especias que llegaban de la India. Dentro está la tumba de Vasco da Gama. Cerrado los lunes."
    },
    "promptImagem": "Ornate white limestone cloister of Jerónimos Monastery in Lisbon, intricate Manueline carvings, soft light, no people"
  },
  {
    "n": 14,
    "id": "pasteis-belem",
    "zona": "Belém",
    "lat": 38.6975,
    "lng": -9.2032,
    "min": 30,
    "pt": {
      "nome": "Pastéis de Belém",
      "txt": "O pastel de nata onde ele nasceu.",
      "hist": "A receita veio dos monges do mosteiro vizinho e vende-se aqui desde 1837. Ainda hoje é segredo, guardado por poucos mestres pasteleiros."
    },
    "en": {
      "nome": "Pastéis de Belém",
      "txt": "The custard tart where it was born.",
      "hist": "The recipe came from the monks of the monastery next door and has been sold here since 1837. It is still a secret, kept by a handful of master bakers."
    },
    "es": {
      "nome": "Pastéis de Belém",
      "txt": "El pastel de nata donde nació.",
      "hist": "La receta vino de los monjes del monasterio vecino y se vende aquí desde 1837. Hoy sigue siendo secreta, guardada por unos pocos maestros pasteleros."
    },
    "promptImagem": "Close-up of warm Portuguese custard tarts with caramelized tops, cinnamon and powdered sugar, blue and white tiles in background, food photography"
  },
  {
    "n": 15,
    "id": "padrao",
    "zona": "Belém",
    "lat": 38.6936,
    "lng": -9.2057,
    "min": 20,
    "pt": {
      "nome": "Padrão dos Descobrimentos",
      "txt": "Os navegadores de pedra sobre o rio.",
      "hist": "No chão, à frente, há uma enorme rosa dos ventos com um mapa-múndi, oferecido pela África do Sul, que mostra as rotas dos navegadores portugueses."
    },
    "en": {
      "nome": "Monument to the Discoveries",
      "txt": "Stone navigators facing the river.",
      "hist": "On the ground in front lies a giant compass rose with a world map, a gift from South Africa, tracing the routes of the Portuguese navigators."
    },
    "es": {
      "nome": "Monumento a los Descubrimientos",
      "txt": "Los navegantes de piedra frente al río.",
      "hist": "En el suelo, delante, hay una enorme rosa de los vientos con un mapamundi, regalo de Sudáfrica, que muestra las rutas de los navegantes portugueses."
    },
    "promptImagem": "Monument to the Discoveries in Belém, stone caravel-shaped monument with carved navigators by the river, blue sky"
  },
  {
    "n": 16,
    "id": "torre-belem",
    "zona": "Belém",
    "lat": 38.6916,
    "lng": -9.216,
    "min": 30,
    "pt": {
      "nome": "Torre de Belém",
      "txt": "A sentinela do Tejo.",
      "hist": "Construída no início do século XVI para defender a entrada do rio. Procure, numa das paredes, a cabeça de um rinoceronte esculpida em pedra: lembra o rinoceronte que chegou a Lisboa em 1515."
    },
    "en": {
      "nome": "Belém Tower",
      "txt": "The sentinel of the Tagus.",
      "hist": "Built in the early 16th century to guard the river mouth. Look for a rhinoceros head carved in stone on one wall: it recalls the rhino that arrived in Lisbon in 1515."
    },
    "es": {
      "nome": "Torre de Belém",
      "txt": "El centinela del Tajo.",
      "hist": "Construida a principios del siglo XVI para defender la entrada del río. Busque en una pared la cabeza de un rinoceronte tallada en piedra: recuerda al rinoceronte que llegó a Lisboa en 1515."
    },
    "promptImagem": "Belém Tower, white limestone fortress on the water's edge of the Tagus, golden hour reflection, travel photography"
  },
  {
    "n": 17,
    "id": "oceanario",
    "zona": "Parque das Nações",
    "lat": 38.7636,
    "lng": -9.0937,
    "min": 120,
    "pt": {
      "nome": "Oceanário de Lisboa",
      "txt": "Um oceano inteiro num só tanque.",
      "hist": "Foi construído para a Expo 98 e tem um enorme tanque central que se vê de vários pisos, como se o oceano estivesse à sua volta. Ótimo com crianças e em dias de chuva."
    },
    "en": {
      "nome": "Lisbon Oceanarium",
      "txt": "A whole ocean in one tank.",
      "hist": "Built for Expo 98, it has a huge central tank you see from several levels, as if the ocean surrounded you. Great with children and on rainy days."
    },
    "es": {
      "nome": "Oceanario de Lisboa",
      "txt": "Todo un océano en un solo tanque.",
      "hist": "Se construyó para la Expo 98 y tiene un enorme tanque central que se ve desde varios pisos, como si el océano le rodeara. Ideal con niños y en días de lluvia."
    },
    "promptImagem": "Large aquarium tank with rays and schools of fish, silhouettes of a family watching, blue light"
  },
  {
    "n": 18,
    "id": "pena",
    "zona": "Sintra",
    "lat": 38.7876,
    "lng": -9.3906,
    "min": 120,
    "pt": {
      "nome": "Palácio da Pena",
      "txt": "O palácio de conto de fadas, em Sintra.",
      "hist": "Mandado construir no século XIX pelo rei D. Fernando II, mistura estilos como num sonho romântico. Os bilhetes têm hora marcada: compre-os online antes."
    },
    "en": {
      "nome": "Pena Palace",
      "txt": "The fairy-tale palace in Sintra.",
      "hist": "Built in the 19th century for King Ferdinand II, it mixes styles like a romantic dream. Tickets have a time slot: buy them online in advance."
    },
    "es": {
      "nome": "Palacio da Pena",
      "txt": "El palacio de cuento de hadas, en Sintra.",
      "hist": "Mandado construir en el siglo XIX por el rey Fernando II, mezcla estilos como un sueño romántico. Las entradas tienen hora: cómprelas online antes."
    },
    "promptImagem": "Colorful romantic Pena Palace in Sintra with red and yellow towers on a misty forested hilltop, travel photography"
  },
  {
    "n": 19,
    "id": "regaleira",
    "zona": "Sintra",
    "lat": 38.7963,
    "lng": -9.3962,
    "min": 90,
    "pt": {
      "nome": "Quinta da Regaleira",
      "txt": "Jardins, grutas e um poço misterioso.",
      "hist": "O famoso Poço Iniciático desce cerca de 27 metros em espiral pela terra adentro, ligado a túneis e grutas. Ninguém sabe ao certo tudo o que o construtor quis dizer com ele."
    },
    "en": {
      "nome": "Quinta da Regaleira",
      "txt": "Gardens, grottoes and a mysterious well.",
      "hist": "The famous Initiation Well spirals about 27 metres down into the earth, linked to tunnels and grottoes. No one knows for sure everything its builder meant by it."
    },
    "es": {
      "nome": "Quinta da Regaleira",
      "txt": "Jardines, grutas y un pozo misterioso.",
      "hist": "El famoso Pozo Iniciático desciende en espiral unos 27 metros bajo tierra, unido a túneles y grutas. Nadie sabe con certeza todo lo que su constructor quiso decir con él."
    },
    "promptImagem": "Looking down into a spiral stone initiation well covered in moss, Quinta da Regaleira, Sintra, dramatic light"
  },
  {
    "n": 20,
    "id": "cabo-roca",
    "zona": "Sintra",
    "lat": 38.7804,
    "lng": -9.4989,
    "min": 30,
    "pt": {
      "nome": "Cabo da Roca",
      "txt": "Onde a Europa acaba.",
      "hist": "É o ponto mais ocidental da Europa continental. Um monumento cita Camões: «Onde a terra se acaba e o mar começa»."
    },
    "en": {
      "nome": "Cabo da Roca",
      "txt": "Where Europe ends.",
      "hist": "It is the westernmost point of mainland Europe. A monument quotes the poet Camões: \"Where the land ends and the sea begins\"."
    },
    "es": {
      "nome": "Cabo da Roca",
      "txt": "Donde termina Europa.",
      "hist": "Es el punto más occidental de la Europa continental. Un monumento cita a Camões: «Donde la tierra se acaba y el mar comienza»."
    },
    "promptImagem": "Dramatic Atlantic cliffs at Cabo da Roca with a red-roofed lighthouse at sunset, waves crashing below"
  },
  {
    "n": 21,
    "id": "cascais",
    "zona": "Cascais",
    "lat": 38.6979,
    "lng": -9.4215,
    "min": 90,
    "pt": {
      "nome": "Cascais",
      "txt": "A vila de praia dos reis.",
      "hist": "No fim do século XIX, a família real passou a ir para Cascais no verão e a vila de pescadores tornou-se a praia elegante que é hoje."
    },
    "en": {
      "nome": "Cascais",
      "txt": "The seaside town of kings.",
      "hist": "In the late 19th century the royal family began summering in Cascais, and the fishing village became the elegant seaside town it is today."
    },
    "es": {
      "nome": "Cascais",
      "txt": "La villa de playa de los reyes.",
      "hist": "A finales del siglo XIX la familia real empezó a veranear en Cascais, y el pueblo de pescadores se convirtió en la elegante villa de playa que es hoy."
    },
    "promptImagem": "Cascais bay with colorful fishing boats, sandy beach and white houses, sunny morning, travel photography"
  }
];

/** Os 21 lugares nas cinco línguas (francês e italiano: tradução por rever, em lugares-fr-it.ts). */
export const LUGARES: Lugar[] = BASE.map((l) => ({ ...l, ...LUGARES_FR_IT[l.n] }));
