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
    Mesa (formulário):
      #MESA-P05-R07 · PT   prato 05, restaurante R07 escolhido em «Escolher este»
      #MESA-P05-LIVRE · PT prato 05, restaurante escrito pelo cliente (ou em branco: «escolham por mim»)
      #MESA-R10 · PT       restaurante escolhido sem prato (bloco «Uma mesa com vista»)
      #MESA · PT           formulário aberto no topo ou na barra, sem prato
    Dia montado: #ROTA 3·7·14 · PT */
export type OrigemWhats = { tipo: "MESA"; prato?: number; restaurante?: string } | { tipo: "ROTA"; lugares: number[] };

const dois = (n: number) => String(n).padStart(2, "0");

export function codigoWhats(origem: OrigemWhats, lingua: Lingua): string {
  const l = lingua.toUpperCase();
  if (origem.tipo === "ROTA") return `#ROTA${origem.lugares.length ? " " + origem.lugares.join("·") : ""} · ${l}`;
  const partes = ["#MESA"];
  if (origem.prato) partes.push(`P${dois(origem.prato)}`);
  if (origem.restaurante) partes.push(origem.restaurante);
  else if (origem.prato) partes.push("LIVRE");
  return `${partes.join("-")} · ${l}`;
}

export function linkWhatsapp(texto: string, origem: OrigemWhats, lingua: Lingua): string {
  return `https://wa.me/${CONFIG_LISBOA.whatsapp}?text=${encodeURIComponent(`${codigoWhats(origem, lingua)}\n${texto}`)}`;
}
