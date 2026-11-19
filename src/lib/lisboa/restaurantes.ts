/* Restaurantes que a HUB recomenda (pedido E6, 19/11/2026).
   Para acrescentar ou tirar um restaurante, basta uma linha. Campos:
     codigo   R01, R02… (vai na mensagem do WhatsApp: #MESA-P05-R07). Não reaproveitar códigos de restaurantes tirados.
     nome     como aparece na página e na mensagem
     bairro   aparece no cartão
     pratos   números dos pratos onde o recomendamos (1–8); "vista" = bloco «Uma mesa com vista» da /lisboa
     tipo     "típico" ou "especial"
     ambiente uma frase por língua
     reserva  como a equipa reserva: SÓ PARA USO INTERNO, nunca aparece na página
   Na página: etiqueta sempre «Recomendado pela HUB» (nunca «parceiro»), sem notas do Google, sem preços
   e sem fotografias dos restaurantes (o cartão usa a fotografia do prato). */

import type { Lingua } from "./tipos";

export type Restaurante = {
  codigo: string;
  nome: string;
  bairro: string;
  pratos: (number | "vista")[];
  tipo: "típico" | "especial";
  ambiente: Record<Lingua, string>;
  reserva: string;
};

// prettier-ignore
export const RESTAURANTES: Restaurante[] = [
  { codigo: "R01", nome: "Marisqueira Uma", bairro: "Baixa", pratos: [1, 6], tipo: "típico", reserva: "Google", ambiente: { pt: "Casa pequena e sempre cheia, dedicada ao arroz de marisco.", en: "A small, always busy place devoted to seafood rice.", es: "Casa pequeña y siempre llena, dedicada al arroz de marisco." } },
  { codigo: "R02", nome: "Azul Seafood", bairro: "Praça do Comércio", pratos: [1, 5], tipo: "especial", reserva: "Google", ambiente: { pt: "Esplanada na maior praça de Lisboa, com marisco fresco.", en: "A terrace on Lisbon's largest square, with fresh seafood.", es: "Terraza en la plaza más grande de Lisboa, con marisco fresco." } },
  { codigo: "R03", nome: "Frade dos Mares", bairro: "Santos", pratos: [2], tipo: "especial", reserva: "Google/TheFork", ambiente: { pt: "Sala acolhedora, conhecida pelo polvo.", en: "A cosy dining room, known for its octopus.", es: "Sala acogedora, conocida por el pulpo." } },
  { codigo: "R04", nome: "Adega das Gravatas", bairro: "Carnide", pratos: [2], tipo: "típico", reserva: "telefone", ambiente: { pt: "Tasca antiga onde os clientes deixam a gravata no teto, famosa pelo polvo à lagareiro.", en: "An old tavern where guests leave their ties on the ceiling, famous for its roast octopus.", es: "Tasca antigua donde los clientes dejan la corbata en el techo, famosa por el pulpo a la lagareira." } },
  { codigo: "R05", nome: "A Casa do Bacalhau", bairro: "Beato", pratos: [3], tipo: "especial", reserva: "Google", ambiente: { pt: "Espaço bonito, dedicado ao bacalhau e às suas muitas receitas.", en: "A beautiful space devoted to salt cod and its many recipes.", es: "Un espacio bonito, dedicado al bacalao y a sus muchas recetas." } },
  { codigo: "R06", nome: "Cataplana LX", bairro: "Baixa", pratos: [4], tipo: "típico", reserva: "Google", ambiente: { pt: "Cataplanas para partilhar, no centro da Baixa.", en: "Cataplanas for sharing, in the heart of the Baixa.", es: "Cataplanas para compartir, en el centro de la Baixa." } },
  { codigo: "R07", nome: "Cervejaria Ramiro", bairro: "Intendente", pratos: [5, 6], tipo: "típico", reserva: "TheFork", ambiente: { pt: "A marisqueira mais famosa de Lisboa.", en: "Lisbon's most famous seafood house.", es: "La marisquería más famosa de Lisboa." } },
  { codigo: "R08", nome: "Fado ao Carmo – Alfama", bairro: "Alfama", pratos: [8], tipo: "especial", reserva: "Zenchef", ambiente: { pt: "Sala pequena, com fado ao vivo ao jantar.", en: "A small room with live fado over dinner.", es: "Sala pequeña, con fado en directo durante la cena." } },
  { codigo: "R09", nome: "Maria da Mouraria", bairro: "Mouraria", pratos: [8], tipo: "especial", reserva: "Google/site", ambiente: { pt: "Fado ao vivo na Mouraria, um dos berços do fado.", en: "Live fado in Mouraria, one of the birthplaces of fado.", es: "Fado en directo en la Mouraria, una de las cunas del fado." } },
  { codigo: "R10", nome: "Via Graça", bairro: "Graça", pratos: ["vista"], tipo: "especial", reserva: "Google/TheFork", ambiente: { pt: "Terraço com vista para o castelo, o rio e Alfama.", en: "A terrace overlooking the castle, the river and Alfama.", es: "Terraza con vistas al castillo, el río y Alfama." } },
  { codigo: "R11", nome: "SUD Lisboa", bairro: "Belém", pratos: ["vista"], tipo: "especial", reserva: "Google", ambiente: { pt: "Terraço junto ao rio, com o pôr do sol e a ponte.", en: "A riverside terrace, with the sunset and the bridge.", es: "Terraza junto al río, con la puesta de sol y el puente." } },
];

export const restaurantesDoPrato = (n: number) => RESTAURANTES.filter((r) => r.pratos.includes(n));
export const restaurantesComVista = () => RESTAURANTES.filter((r) => r.pratos.includes("vista"));
export const restaurantePorCodigo = (codigo: string) => RESTAURANTES.find((r) => r.codigo === codigo);

/** O que a página (cliente) recebe: sem a forma de reservar. */
export type RestauranteVista = { codigo: string; nome: string; bairro: string; ambiente: string };
export const paraVista = (r: Restaurante, lingua: Lingua): RestauranteVista => ({
  codigo: r.codigo,
  nome: r.nome,
  bairro: r.bairro,
  ambiente: r.ambiente[lingua],
});
