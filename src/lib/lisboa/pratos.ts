/* «O que se come em Portugal»: os 8 pratos (constante DISHES do protótipo validado, 19/11/2026;
   pratos 05, 07 e 08 trocados no pedido E6). Nomes e frases aprovados pelo Junior: não reescrever sem o pedido dele.
   n = número do prato (imagens public/lisboa/pratos/prato-0n-a.jpg … -d.jpg).
   slug = endereço da página do prato (/lisboa/prato/{slug}), igual nas três línguas.
   sobre = as linhas da página do prato: só factos, sem preços nem promessas. */

import type { EstiloJantar, Prato } from "./tipos";

export const PRATOS: Prato[] = [
  {
    n: 1,
    slug: "arroz-de-marisco",
    pt: ["Arroz de marisco", "Arroz com caldo, cheio de marisco. Costuma pedir-se para dois."],
    en: ["Seafood rice", "Brothy rice packed with seafood. Usually ordered for two."],
    es: ["Arroz de marisco", "Arroz caldoso, lleno de marisco. Suele pedirse para dos."],
    sobre: {
      pt: [
        "Arroz cozinhado num caldo de marisco e tomate, com amêijoa, camarão e, muitas vezes, sapateira ou lagosta.",
        "Chega à mesa no tacho, ainda a fumegar, e come-se logo, enquanto o arroz está húmido e bem quente.",
        "Pede-se quase sempre para duas pessoas ou mais e acompanha bem com um vinho branco fresco.",
      ],
      en: [
        "Rice cooked in a seafood and tomato broth, with clams, prawns and often crab or lobster.",
        "It comes to the table in the pot, still steaming, and is eaten straight away, while the rice is moist and hot.",
        "It is almost always ordered for two or more, and goes well with a chilled white wine.",
      ],
      es: [
        "Arroz cocinado en un caldo de marisco y tomate, con almejas, gambas y, muchas veces, buey de mar o bogavante.",
        "Llega a la mesa en la olla, aún humeante, y se come enseguida, mientras el arroz está jugoso y bien caliente.",
        "Casi siempre se pide para dos personas o más, y va muy bien con un vino blanco fresco.",
      ],
    },
  },
  {
    n: 2,
    slug: "polvo-a-lagareiro",
    pt: ["Polvo à lagareiro", "Polvo assado com azeite, alho e batatas a murro."],
    en: ["Roast octopus", "Octopus roasted with olive oil, garlic and crushed potatoes."],
    es: ["Pulpo a la lagareira", "Pulpo asado con aceite, ajo y patatas aplastadas."],
    sobre: {
      pt: [
        "O polvo é cozido até ficar macio e depois vai ao forno, regado com muito azeite e alho.",
        "«Lagareiro» era quem trabalhava no lagar de azeite: o nome vem desse azeite generoso.",
        "Vem com batatas a murro, pequenas, assadas com a pele e abertas com um soco. Molhe-as no azeite do tabuleiro.",
      ],
      en: [
        "The octopus is boiled until tender, then roasted in the oven with plenty of olive oil and garlic.",
        "A «lagareiro» was the man who worked the olive press: the name comes from all that olive oil.",
        "It comes with small potatoes roasted in their skins and punched open. Dip them in the oil from the tray.",
      ],
      es: [
        "El pulpo se cuece hasta quedar tierno y después va al horno, regado con mucho aceite y ajo.",
        "El «lagareiro» era quien trabajaba en la almazara: el nombre viene de ese aceite generoso.",
        "Viene con patatas pequeñas, asadas con piel y abiertas de un puñetazo. Mójelas en el aceite de la bandeja.",
      ],
    },
  },
  {
    n: 3,
    slug: "bacalhau-a-bras",
    pt: ["Bacalhau à Brás", "Bacalhau desfiado, batata palha e ovo. Diz-se que há mais de 365 receitas de bacalhau."],
    en: ["Bacalhau à Brás", "Shredded salt cod, crispy potatoes and egg. They say there are over 365 cod recipes."],
    es: ["Bacalao a la Brás", "Bacalao desmigado, patata paja y huevo. Se dice que hay más de 365 recetas de bacalao."],
    sobre: {
      pt: [
        "Bacalhau desfiado, salteado com cebola e batata palha e envolvido em ovo mexido.",
        "Acaba com salsa picada e azeitonas pretas. O ovo deve ficar cremoso, nunca seco.",
        "Diz-se que nasceu numa tasca do Bairro Alto. Hoje é dos pratos de bacalhau mais pedidos em Lisboa, ao almoço e ao jantar.",
      ],
      en: [
        "Shredded salt cod, sautéed with onion and matchstick potatoes and folded into scrambled egg.",
        "It is finished with chopped parsley and black olives. The egg should be creamy, never dry.",
        "It is said to have been born in a tavern in Bairro Alto. Today it is one of the most ordered cod dishes in Lisbon, at lunch and dinner.",
      ],
      es: [
        "Bacalao desmigado, salteado con cebolla y patata paja y envuelto en huevo revuelto.",
        "Se termina con perejil picado y aceitunas negras. El huevo debe quedar cremoso, nunca seco.",
        "Se dice que nació en una tasca del Bairro Alto. Hoy es uno de los platos de bacalao más pedidos en Lisboa, a mediodía y por la noche.",
      ],
    },
  },
  {
    n: 4,
    slug: "cataplana-de-marisco",
    pt: ["Cataplana de marisco", "Cozinhada numa panela de cobre que fecha como uma concha."],
    en: ["Seafood cataplana", "Cooked in a copper pan that closes like a shell."],
    es: ["Cataplana de marisco", "Cocinada en una olla de cobre que se cierra como una concha."],
    sobre: {
      pt: [
        "A cataplana é uma panela de cobre, vinda do Algarve, com duas metades que fecham como uma concha.",
        "Lá dentro, o marisco coze no próprio vapor, com tomate, cebola, pimento e vinho branco.",
        "Abre-se à mesa, à frente de quem vai comer, e é feita para partilhar. Guarde pão para o molho.",
      ],
      en: [
        "The cataplana is a copper pan from the Algarve, with two halves that close like a shell.",
        "Inside, the seafood cooks in its own steam, with tomato, onion, pepper and white wine.",
        "It is opened at the table, in front of the people eating, and is made for sharing. Save some bread for the sauce.",
      ],
      es: [
        "La cataplana es una olla de cobre, venida del Algarve, con dos mitades que se cierran como una concha.",
        "Dentro, el marisco se cuece en su propio vapor, con tomate, cebolla, pimiento y vino blanco.",
        "Se abre en la mesa, delante de quien va a comer, y está hecha para compartir. Guarde pan para la salsa.",
      ],
    },
  },
  {
    n: 5,
    slug: "mariscada",
    pt: ["Mariscada", "Marisco da nossa costa, para partilhar à mesa. A refeição de festa dos lisboetas."],
    en: ["Seafood platter", "Fresh shellfish from our coast, made for sharing. Lisbon's way to celebrate."],
    es: ["Mariscada", "Marisco de nuestra costa, para compartir. La comida de fiesta de los lisboetas."],
    sobre: {
      pt: [
        "Uma travessa com o marisco do dia: camarão, amêijoa, sapateira, percebes e o que a época trouxer.",
        "Come-se à mão e sem pressa, a partir as cascas com o martelo de madeira e a barrar pão na sapateira.",
        "Pede-se para várias pessoas, com cerveja fresca ou vinho branco. Em Lisboa, há quem acabe com um prego no pão.",
      ],
      en: [
        "A platter of the day's shellfish: prawns, clams, crab, goose barnacles and whatever the season brings.",
        "It is eaten by hand and at an easy pace, cracking shells with a wooden mallet and spreading the crab on bread.",
        "It is ordered for several people, with a cold beer or white wine. In Lisbon, some finish with a steak sandwich, the «prego».",
      ],
      es: [
        "Una bandeja con el marisco del día: gambas, almejas, buey de mar, percebes y lo que traiga la temporada.",
        "Se come con las manos y sin prisa, partiendo las cáscaras con el mazo de madera y untando el buey de mar en pan.",
        "Se pide para varias personas, con cerveza fría o vino blanco. En Lisboa, hay quien termina con un «prego», un bocadillo de filete.",
      ],
    },
  },
  {
    n: 6,
    slug: "ameijoas-a-bulhao-pato",
    pt: ["Amêijoas à Bulhão Pato", "Com alho, coentros e limão. O molho pede pão."],
    en: ["Clams Bulhão Pato", "With garlic, coriander and lemon. The sauce calls for bread."],
    es: ["Almejas a la Bulhão Pato", "Con ajo, cilantro y limón. La salsa pide pan."],
    sobre: {
      pt: [
        "Amêijoas abertas ao lume em azeite e alho, com coentros frescos e umas gotas de limão.",
        "O nome homenageia Raimundo Bulhão Pato, poeta lisboeta do século XIX.",
        "Servem-se como entrada ou petisco, a meio da mesa. O molho que fica no fundo é para o pão.",
      ],
      en: [
        "Clams opened over the heat in olive oil and garlic, with fresh coriander and a squeeze of lemon.",
        "The name honours Raimundo Bulhão Pato, a 19th-century Lisbon poet.",
        "They are served as a starter or snack, in the middle of the table. The sauce left at the bottom is for the bread.",
      ],
      es: [
        "Almejas abiertas al fuego en aceite y ajo, con cilantro fresco y unas gotas de limón.",
        "El nombre homenajea a Raimundo Bulhão Pato, poeta lisboeta del siglo XIX.",
        "Se sirven como entrante o tapa, en el centro de la mesa. La salsa que queda en el fondo es para el pan.",
      ],
    },
  },
  {
    n: 7,
    slug: "bife-a-portuguesa",
    pt: ["Bife à portuguesa", "Bife com molho de alho, ovo a cavalo e batata frita. O conforto à portuguesa."],
    en: ["Portuguese steak", "Steak in garlic sauce, a fried egg on top and crispy fries. Portuguese comfort food."],
    es: ["Bistec a la portuguesa", "Bistec en salsa de ajo, huevo frito encima y patatas fritas. El confort portugués."],
    sobre: {
      pt: [
        "Bife de vaca frito com alho e louro, servido no molho em que foi cozinhado.",
        "Leva por cima um ovo estrelado, o «ovo a cavalo», e muitas vezes uma fatia de presunto.",
        "Vem com batata frita e chega muitas vezes num prato de barro. Rompa a gema e misture-a no molho.",
      ],
      en: [
        "Beef steak fried with garlic and bay leaf, served in the sauce it was cooked in.",
        "It is topped with a fried egg, the «ovo a cavalo» (egg on horseback), and often a slice of cured ham.",
        "It comes with fries and is often served in a clay dish. Break the yolk and stir it into the sauce.",
      ],
      es: [
        "Filete de ternera frito con ajo y laurel, servido en la salsa en la que se cocinó.",
        "Lleva encima un huevo frito, el «ovo a cavalo» (huevo a caballo), y muchas veces una loncha de jamón.",
        "Viene con patatas fritas y muchas veces llega en un plato de barro. Rompa la yema y mézclela con la salsa.",
      ],
    },
  },
  {
    n: 8,
    slug: "jantar-com-fado",
    pt: ["Jantar com fado", "Jantar à luz das velas enquanto a guitarra portuguesa toca. Lisboa à noite, no seu melhor."],
    en: ["Dinner with fado", "Candlelit dinner while the Portuguese guitar plays. Lisbon at night, at its best."],
    es: ["Cena con fado", "Cena a la luz de las velas mientras suena la guitarra portuguesa. Lisboa de noche, en su mejor versión."],
    sobre: {
      pt: [
        "O fado é a canção de Lisboa e, desde 2011, Património Cultural Imaterial da Humanidade pela UNESCO.",
        "Canta-se ao vivo, com a guitarra portuguesa e a viola, em casas pequenas de Alfama, da Mouraria e do Bairro Alto.",
        "Janta-se entre as voltas de fado. Quando a música começa, as luzes baixam e a sala fica em silêncio.",
      ],
      en: [
        "Fado is Lisbon's song and, since 2011, part of UNESCO's Intangible Cultural Heritage of Humanity.",
        "It is sung live, with the Portuguese guitar and the classical guitar, in small houses in Alfama, Mouraria and Bairro Alto.",
        "Dinner is served between the sets. When the music starts, the lights go down and the room falls silent.",
      ],
      es: [
        "El fado es la canción de Lisboa y, desde 2011, Patrimonio Cultural Inmaterial de la Humanidad de la UNESCO.",
        "Se canta en directo, con la guitarra portuguesa y la guitarra clásica, en casas pequeñas de Alfama, la Mouraria y el Bairro Alto.",
        "Se cena entre las tandas de fado. Cuando empieza la música, se bajan las luces y la sala se queda en silencio.",
      ],
    },
  },
];

/** Prato pelo endereço (ou undefined). */
export const pratoPorSlug = (slug: string) => PRATOS.find((p) => p.slug === slug);

/* «Acabe o dia à mesa»: estilos de restaurante (constante RESTS do protótipo). */
export const ESTILOS_JANTAR: EstiloJantar[] = [
  {
    id: "equipa",
    pt: ["Deixe connosco", "Sugerimos o restaurante certo para o seu gosto."],
    en: ["Leave it to us", "We suggest the right restaurant for your taste."],
    es: ["Déjelo en nuestras manos", "Le sugerimos el restaurante ideal para su gusto."],
  },
  {
    id: "peixe",
    pt: ["Peixe e marisco", "Arroz de marisco, polvo, amêijoas."],
    en: ["Fish and seafood", "Seafood rice, octopus, clams."],
    es: ["Pescado y marisco", "Arroz de marisco, pulpo, almejas."],
  },
  {
    id: "tradicional",
    pt: ["Cozinha tradicional", "Bacalhau, carne de porco, tascas."],
    en: ["Traditional food", "Salt cod, pork, local taverns."],
    es: ["Cocina tradicional", "Bacalao, cerdo, tascas."],
  },
  {
    id: "fado",
    pt: ["Jantar com fado", "Fado ao vivo, em Alfama ou no Bairro Alto."],
    en: ["Dinner with fado", "Live fado in Alfama or Bairro Alto."],
    es: ["Cena con fado", "Fado en directo, en Alfama o el Bairro Alto."],
  },
];
