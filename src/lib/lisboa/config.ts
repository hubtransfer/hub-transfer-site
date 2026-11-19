/* Configuração da página «Lisboa à sua mesa» (CONFIG do protótipo validado). */

import type { Lingua } from "./tipos";

/** WhatsApp da página: o da assistente Roberta HUB. Para mudar, basta a variável NEXT_PUBLIC_LISBOA_WHATSAPP
    na Vercel (só dígitos, com o indicativo, sem + nem espaços) — ou esta linha. */
const WHATSAPP = (process.env.NEXT_PUBLIC_LISBOA_WHATSAPP || "351928283652").replace(/\D/g, "");

export const CONFIG_LISBOA = {
  whatsapp: WHATSAPP,
  /** ponto de partida e de regresso do dia (hotel de referência no centro de Lisboa) */
  hotel: { lat: 38.7167, lng: -9.142 },
  /** Nota do Google: só valores reais. Vazio = a linha não aparece no rodapé. */
  googleRating: "",
  googleReviews: "",
} as const;

/** Código no início de cada mensagem: diz à equipa de que botão veio o pedido e em que língua.
    Ex.: #MESA · PT, #MESA-LIVRE · EN, #MESA-P05 · ES, #ROTA 3·7·14 · PT */
export type OrigemWhats = { tipo: "MESA" } | { tipo: "MESA-LIVRE" } | { tipo: "PRATO"; prato: number } | { tipo: "ROTA"; lugares: number[] };

export function codigoWhats(origem: OrigemWhats, lingua: Lingua): string {
  const l = lingua.toUpperCase();
  switch (origem.tipo) {
    case "PRATO":
      return `#MESA-P${String(origem.prato).padStart(2, "0")} · ${l}`;
    case "ROTA":
      return `#ROTA${origem.lugares.length ? " " + origem.lugares.join("·") : ""} · ${l}`;
    default:
      return `#${origem.tipo} · ${l}`;
  }
}

export function linkWhatsapp(texto: string, origem: OrigemWhats, lingua: Lingua): string {
  return `https://wa.me/${CONFIG_LISBOA.whatsapp}?text=${encodeURIComponent(`${codigoWhats(origem, lingua)}\n${texto}`)}`;
}
