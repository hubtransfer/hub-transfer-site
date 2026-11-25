/* Guia em PDF «Lisboa à sua mesa» (pedido E9, Fase B): a página /guia/[lingua] só para imprimir,
   de onde o comando «npm run guias» faz os PDF em public/guia/HUB-Transfer-Lisboa-XX.pdf.
   Todas as ligações do guia são absolutas (https://hubtransfer.pt/…), na língua do guia e com os UTM da campanha.
   Sem preços. Francês e italiano: tradução por rever. */

import { codigoWhats, CONFIG_LISBOA } from "./config";
import { ROTAS, TEXTOS, rotaPrato } from "./textos";
import type { Lingua } from "./tipos";

export const SITE = "https://hubtransfer.pt";
export const UTM_GUIA = "utm_source=guia_pdf&utm_medium=whatsapp&utm_campaign=lisboa";

/** Endereço absoluto no site, com os UTM do guia (a âncora vai no fim: …?utm…#p-3). */
export const ligacaoGuia = (caminho: string, ancora = "") => `${SITE}${caminho}?${UTM_GUIA}${ancora}`;

export const ligacoesGuia = (l: Lingua) => ({
  pagina: ligacaoGuia(ROTAS[l]),
  pratos: ligacaoGuia(ROTAS[l], "#pratos"),
  prato: (slug: string) => ligacaoGuia(rotaPrato(l, slug)),
  lugar: (n: number) => ligacaoGuia(ROTAS[l], `#p-${n}`),
  /** WhatsApp direto, com o código #MESA · XX e a frase da mesa na língua do guia */
  whatsapp: `https://wa.me/${CONFIG_LISBOA.whatsapp}?text=${encodeURIComponent(`${codigoWhats({ tipo: "MESA" }, l)}\n${TEXTOS[l].msgMesa}`)}`,
});

/** O WhatsApp escrito para quem o lê: +351 928 121 564 */
export const whatsappEscrito = () => {
  const n = CONFIG_LISBOA.whatsapp;
  return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
};

/** Ficheiro de cada língua (o comando npm run guias grava-os sempre no mesmo endereço). */
export const ficheiroGuia = (l: Lingua) => `HUB-Transfer-Lisboa-${l.toUpperCase()}.pdf`;

export type TextosGuia = {
  boasVindas: string;
  comoT: string;
  como: [string, string, string];
  indice: string;
  ondeProvar: string;
  verJuntar: string;
  mesaT: string;
  mesaS: string;
  mesaTxt: string;
  botaoSite: string;
  botaoWhats: string;
  codigo: string;
  contraTxt: string;
  pagina: string;
};

export const TEXTOS_GUIA: Record<Lingua, TextosGuia> = {
  pt: {
    boasVindas: "Bem-vindo a Lisboa. Neste guia estão os pratos que vale a pena provar e os 21 lugares que valem a viagem. Quando quiser jantar, reservamos a sua mesa sem custo.",
    comoT: "Como usar este guia",
    como: [
      "Cada número e cada fotografia abrem a página no nosso site, na sua língua.",
      "Junte ao seu dia os lugares de que gostar: vemos consigo o caminho e os tempos.",
      "Quando quiser jantar, diga-nos onde, ou deixe-nos sugerir. Reservamos a sua mesa sem custo.",
    ],
    indice: "Neste guia",
    ondeProvar: "Onde provar",
    verJuntar: "Ver e juntar ao meu dia",
    mesaT: "Uma mesa à sua espera",
    mesaS: "Reservamos sem custo",
    mesaTxt: "Diga-nos o restaurante, ou deixe-nos sugerir. Tratamos da reserva por si e, se quiser, o nosso motorista leva-o e traz-o de volta.",
    botaoSite: "Abrir «Lisboa à sua mesa»",
    botaoWhats: "Pedir a minha mesa pelo WhatsApp",
    codigo: "Ao escrever-nos, a mensagem já leva o código",
    contraTxt: "Transfers, passeios e a sua mesa em Lisboa.",
    pagina: "Página",
  },
  en: {
    boasVindas: "Welcome to Lisbon. In this guide you'll find the dishes worth trying and 21 places worth the trip. Whenever you'd like dinner, we book your table free of charge.",
    comoT: "How to use this guide",
    como: [
      "Every number and every photo opens the page on our website, in your language.",
      "Add the places you like to your day: we'll plan the route and the timings with you.",
      "When you'd like dinner, tell us where, or let us suggest. We book your table free of charge.",
    ],
    indice: "In this guide",
    ondeProvar: "Where to try it",
    verJuntar: "See it and add to my day",
    mesaT: "A table waiting for you",
    mesaS: "We book it free of charge",
    mesaTxt: "Tell us the restaurant, or let us suggest one. We handle the booking for you and, if you like, our driver takes you there and brings you back.",
    botaoSite: "Open «Lisbon at your table»",
    botaoWhats: "Book my table on WhatsApp",
    codigo: "When you write to us, the message already carries the code",
    contraTxt: "Transfers, tours and your table in Lisbon.",
    pagina: "Page",
  },
  es: {
    boasVindas: "Bienvenido a Lisboa. En esta guía están los platos que vale la pena probar y los 21 lugares que valen el viaje. Cuando quiera cenar, le reservamos la mesa sin coste.",
    comoT: "Cómo usar esta guía",
    como: [
      "Cada número y cada fotografía abren la página en nuestra web, en su idioma.",
      "Añada a su día los lugares que le gusten: vemos con usted el camino y los tiempos.",
      "Cuando quiera cenar, díganos dónde, o deje que le sugiramos. Le reservamos la mesa sin coste.",
    ],
    indice: "En esta guía",
    ondeProvar: "Dónde probarlo",
    verJuntar: "Ver y añadir a mi día",
    mesaT: "Una mesa le espera",
    mesaS: "La reservamos sin coste",
    mesaTxt: "Díganos el restaurante, o deje que le sugiramos uno. Nos encargamos de la reserva y, si quiere, nuestro conductor le lleva y le trae de vuelta.",
    botaoSite: "Abrir «Lisboa en su mesa»",
    botaoWhats: "Pedir mi mesa por WhatsApp",
    codigo: "Al escribirnos, el mensaje ya lleva el código",
    contraTxt: "Traslados, paseos y su mesa en Lisboa.",
    pagina: "Página",
  },
  // tradução por rever
  fr: {
    boasVindas: "Bienvenue à Lisbonne. Dans ce guide, les plats qui valent la peine d’être goûtés et 21 lieux qui valent le voyage. Quand vous voulez dîner, nous réservons votre table sans frais.",
    comoT: "Comment utiliser ce guide",
    como: [
      "Chaque numéro et chaque photo ouvrent la page sur notre site, dans votre langue.",
      "Ajoutez à votre journée les lieux qui vous plaisent : nous voyons avec vous le trajet et les horaires.",
      "Quand vous voulez dîner, dites-nous où, ou laissez-nous vous conseiller. Nous réservons votre table sans frais.",
    ],
    indice: "Dans ce guide",
    ondeProvar: "Où le goûter",
    verJuntar: "Voir et ajouter à ma journée",
    mesaT: "Une table vous attend",
    mesaS: "Nous la réservons sans frais",
    mesaTxt: "Dites-nous le restaurant, ou laissez-nous vous en suggérer un. Nous nous occupons de la réservation et, si vous le souhaitez, notre chauffeur vous y emmène et vous ramène.",
    botaoSite: "Ouvrir « Lisbonne à votre table »",
    botaoWhats: "Réserver ma table sur WhatsApp",
    codigo: "Quand vous nous écrivez, le message contient déjà le code",
    contraTxt: "Transferts, visites et votre table à Lisbonne.",
    pagina: "Page",
  },
  // tradução por rever
  it: {
    boasVindas: "Benvenuto a Lisbona. In questa guida trova i piatti da assaggiare e 21 luoghi che valgono il viaggio. Quando vuole cenare, le prenotiamo il tavolo senza costi.",
    comoT: "Come usare questa guida",
    como: [
      "Ogni numero e ogni fotografia aprono la pagina sul nostro sito, nella sua lingua.",
      "Aggiunga alla sua giornata i luoghi che preferisce: vediamo con lei il percorso e i tempi.",
      "Quando vuole cenare, ci dica dove, oppure lasci che le suggeriamo noi. Le prenotiamo il tavolo senza costi.",
    ],
    indice: "In questa guida",
    ondeProvar: "Dove assaggiarlo",
    verJuntar: "Vedi e aggiungi alla mia giornata",
    mesaT: "Un tavolo la aspetta",
    mesaS: "Lo prenotiamo senza costi",
    mesaTxt: "Ci dica il ristorante, oppure lasci che gliene suggeriamo uno. Ci occupiamo noi della prenotazione e, se vuole, il nostro autista la accompagna e la riporta indietro.",
    botaoSite: "Apri «Lisbona a tavola»",
    botaoWhats: "Prenota il mio tavolo su WhatsApp",
    codigo: "Quando ci scrive, il messaggio contiene già il codice",
    contraTxt: "Transfer, escursioni e il suo tavolo a Lisbona.",
    pagina: "Pagina",
  },
};
