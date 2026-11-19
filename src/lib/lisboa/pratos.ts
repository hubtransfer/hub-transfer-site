/* «O que se come em Portugal»: os 8 pratos (constante DISHES do protótipo validado, 19/11/2026).
   Textos aprovados pelo Junior: não reescrever sem o pedido dele.
   n = número do prato (imagens public/lisboa/pratos/prato-0n-a.jpg … -d.jpg). */

import type { EstiloJantar, Prato } from "./tipos";

export const PRATOS: Prato[] = [
  {
    n: 1,
    pt: ["Arroz de marisco", "Arroz com caldo, cheio de marisco. Costuma pedir-se para dois."],
    en: ["Seafood rice", "Brothy rice packed with seafood. Usually ordered for two."],
    es: ["Arroz de marisco", "Arroz caldoso, lleno de marisco. Suele pedirse para dos."],
  },
  {
    n: 2,
    pt: ["Polvo à lagareiro", "Polvo assado com azeite, alho e batatas a murro."],
    en: ["Roast octopus", "Octopus roasted with olive oil, garlic and crushed potatoes."],
    es: ["Pulpo a la lagareira", "Pulpo asado con aceite, ajo y patatas aplastadas."],
  },
  {
    n: 3,
    pt: ["Bacalhau à Brás", "Bacalhau desfiado, batata palha e ovo. Diz-se que há mais de 365 receitas de bacalhau."],
    en: ["Bacalhau à Brás", "Shredded salt cod, crispy potatoes and egg. They say there are over 365 cod recipes."],
    es: ["Bacalao a la Brás", "Bacalao desmigado, patata paja y huevo. Se dice que hay más de 365 recetas de bacalao."],
  },
  {
    n: 4,
    pt: ["Cataplana de marisco", "Cozinhada numa panela de cobre que fecha como uma concha."],
    en: ["Seafood cataplana", "Cooked in a copper pan that closes like a shell."],
    es: ["Cataplana de marisco", "Cocinada en una olla de cobre que se cierra como una concha."],
  },
  {
    n: 5,
    pt: ["Pastel de nata", "Estaladiço por fora, cremoso por dentro. Come-se quente, com canela."],
    en: ["Custard tart", "Crisp outside, creamy inside. Eat it warm, with cinnamon."],
    es: ["Pastel de nata", "Crujiente por fuera, cremoso por dentro. Se come caliente, con canela."],
  },
  {
    n: 6,
    pt: ["Amêijoas à Bulhão Pato", "Com alho, coentros e limão. O molho pede pão."],
    en: ["Clams Bulhão Pato", "With garlic, coriander and lemon. The sauce calls for bread."],
    es: ["Almejas a la Bulhão Pato", "Con ajo, cilantro y limón. La salsa pide pan."],
  },
  {
    n: 7,
    pt: ["Bifana", "Sandes de porco marinado: o petisco de balcão dos lisboetas."],
    en: ["Bifana", "Marinated pork sandwich: the locals' favourite counter snack."],
    es: ["Bifana", "Bocadillo de cerdo marinado: el aperitivo de barra de los lisboetas."],
  },
  {
    n: 8,
    pt: ["Caldo verde", "Sopa de couve com uma rodela de chouriço. Perfeita para dias de chuva."],
    en: ["Caldo verde", "Kale soup with a slice of chouriço. Perfect for rainy days."],
    es: ["Caldo verde", "Sopa de col con una rodaja de chorizo. Perfecta para días de lluvia."],
  },
];

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
