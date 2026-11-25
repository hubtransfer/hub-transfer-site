/* Páginas de pagamento (pedido E11): /pagamento/obrigado e /pagamento/cancelado, nas cinco línguas da /lisboa.
   en /pagamento/… (principal) · pt /pt/pagamento/… · es /es/pagamento/… · fr /fr/pagamento/… · it /it/pagamento/…
   NUNCA mostram preços. A referência K-… vem do ?k= e só aparece se bater certo com REF_CARRINHO.
   Traduções FR e IT por rever (como as da /lisboa). */

import { CONFIG_LISBOA } from "@/lib/lisboa/config";
import { LINGUAS, type Lingua } from "@/lib/lisboa/tipos";

/** A referência do carrinho, como o backend a cria (CARRINHO_HUB.js): K-0012, ou K-0012-B… para um link refeito. */
export const REF_CARRINHO = /^K-\d{4}(-[B-Z])?$/;

/** A referência válida, ou null (página genérica). Aceita só uma string; ?k=a&k=b conta como inválido. */
export function refValida(k: unknown): string | null {
  return typeof k === "string" && REF_CARRINHO.test(k) ? k : null;
}

export type Pagina = "obrigado" | "cancelado";

export const rotaPagamento = (lingua: Lingua, pagina: Pagina) => `${lingua === "en" ? "" : `/${lingua}`}/pagamento/${pagina}`;

/** As cinco rotas da mesma página, com a referência (se válida) para o seletor de línguas. */
export function rotasPagamento(pagina: Pagina, ref: string | null): Record<Lingua, string> {
  const q = ref ? `?k=${encodeURIComponent(ref)}` : "";
  return Object.fromEntries(LINGUAS.map((l) => [l, rotaPagamento(l, pagina) + q])) as Record<Lingua, string>;
}

type Textos = {
  lingua: string;
  inicio: string;
  ref: string;
  whats: string;
  ok: { meta: string; titulo: string; texto: string; whatsLinha: string; generico: string; botao: string };
  ko: { meta: string; titulo: string; texto: string; ajuda: string; generico: string; botao: string; msgAjuda: string };
};

export const TEXTOS_PAG: Record<Lingua, Textos> = {
  en: {
    lingua: "Language",
    inicio: "HUB Transfer — home",
    ref: "Your reference",
    whats: "WhatsApp",
    ok: {
      meta: "Payment received | HUB Transfer",
      titulo: "Thank you — we have received your payment",
      texto: "Everything is in order. Our team is now taking care of your booking.",
      whatsLinha: "The confirmation will reach you on WhatsApp shortly.",
      generico: "If you have just paid, the confirmation will reach you on WhatsApp shortly.",
      botao: "Open WhatsApp",
    },
    ko: {
      meta: "Payment not completed | HUB Transfer",
      titulo: "The payment was not completed",
      texto: "Nothing was charged. Your booking request is still with us, and you can try again whenever you like.",
      ajuda: "Need a hand? Message us on WhatsApp and we will help you finish it.",
      generico: "Nothing was charged. If you need help, message us on WhatsApp.",
      botao: "Get help on WhatsApp",
      msgAjuda: "help with the payment",
    },
  },
  pt: {
    lingua: "Língua",
    inicio: "HUB Transfer — início",
    ref: "A sua referência",
    whats: "WhatsApp",
    ok: {
      meta: "Pagamento recebido | HUB Transfer",
      titulo: "Obrigado — recebemos o seu pagamento",
      texto: "Está tudo em ordem. A nossa equipa já está a tratar da sua reserva.",
      whatsLinha: "A confirmação chega-lhe no WhatsApp dentro de momentos.",
      generico: "Se acabou de pagar, a confirmação chega-lhe no WhatsApp dentro de momentos.",
      botao: "Abrir o WhatsApp",
    },
    ko: {
      meta: "Pagamento não concluído | HUB Transfer",
      titulo: "O pagamento não foi concluído",
      texto: "Nada foi cobrado. O seu pedido continua connosco e pode tentar de novo quando quiser.",
      ajuda: "Precisa de ajuda? Fale connosco no WhatsApp e ajudamos a concluir.",
      generico: "Nada foi cobrado. Se precisar de ajuda, fale connosco no WhatsApp.",
      botao: "Pedir ajuda no WhatsApp",
      msgAjuda: "ajuda com o pagamento",
    },
  },
  es: {
    lingua: "Idioma",
    inicio: "HUB Transfer — inicio",
    ref: "Su referencia",
    whats: "WhatsApp",
    ok: {
      meta: "Pago recibido | HUB Transfer",
      titulo: "Gracias — hemos recibido su pago",
      texto: "Todo está en orden. Nuestro equipo ya se está ocupando de su reserva.",
      whatsLinha: "La confirmación le llegará por WhatsApp en unos momentos.",
      generico: "Si acaba de pagar, la confirmación le llegará por WhatsApp en unos momentos.",
      botao: "Abrir WhatsApp",
    },
    ko: {
      meta: "Pago no completado | HUB Transfer",
      titulo: "El pago no se ha completado",
      texto: "No se ha cobrado nada. Su solicitud sigue con nosotros y puede intentarlo de nuevo cuando quiera.",
      ajuda: "¿Necesita ayuda? Escríbanos por WhatsApp y le ayudamos a terminarlo.",
      generico: "No se ha cobrado nada. Si necesita ayuda, escríbanos por WhatsApp.",
      botao: "Pedir ayuda por WhatsApp",
      msgAjuda: "ayuda con el pago",
    },
  },
  // tradução por rever
  fr: {
    lingua: "Langue",
    inicio: "HUB Transfer — accueil",
    ref: "Votre référence",
    whats: "WhatsApp",
    ok: {
      meta: "Paiement reçu | HUB Transfer",
      titulo: "Merci — nous avons bien reçu votre paiement",
      texto: "Tout est en ordre. Notre équipe s'occupe dès maintenant de votre réservation.",
      whatsLinha: "La confirmation vous parviendra sur WhatsApp dans quelques instants.",
      generico: "Si vous venez de payer, la confirmation vous parviendra sur WhatsApp dans quelques instants.",
      botao: "Ouvrir WhatsApp",
    },
    ko: {
      meta: "Paiement non finalisé | HUB Transfer",
      titulo: "Le paiement n'a pas été finalisé",
      texto: "Rien n'a été débité. Votre demande reste chez nous et vous pouvez réessayer quand vous le souhaitez.",
      ajuda: "Besoin d'aide ? Écrivez-nous sur WhatsApp et nous vous aiderons à le finaliser.",
      generico: "Rien n'a été débité. Si vous avez besoin d'aide, écrivez-nous sur WhatsApp.",
      botao: "Demander de l'aide sur WhatsApp",
      msgAjuda: "aide pour le paiement",
    },
  },
  // traduzione da rivedere
  it: {
    lingua: "Lingua",
    inicio: "HUB Transfer — home",
    ref: "Il suo riferimento",
    whats: "WhatsApp",
    ok: {
      meta: "Pagamento ricevuto | HUB Transfer",
      titulo: "Grazie — abbiamo ricevuto il suo pagamento",
      texto: "È tutto in ordine. Il nostro team si sta già occupando della sua prenotazione.",
      whatsLinha: "La conferma le arriverà su WhatsApp tra pochi istanti.",
      generico: "Se ha appena pagato, la conferma le arriverà su WhatsApp tra pochi istanti.",
      botao: "Apri WhatsApp",
    },
    ko: {
      meta: "Pagamento non completato | HUB Transfer",
      titulo: "Il pagamento non è stato completato",
      texto: "Non è stato addebitato nulla. La sua richiesta resta da noi e può riprovare quando vuole.",
      ajuda: "Ha bisogno di aiuto? Ci scriva su WhatsApp e la aiutiamo a completarlo.",
      generico: "Non è stato addebitato nulla. Se ha bisogno di aiuto, ci scriva su WhatsApp.",
      botao: "Chiedi aiuto su WhatsApp",
      msgAjuda: "aiuto con il pagamento",
    },
  },
};

/** O texto que o botão do WhatsApp leva: «K-0012» (obrigado) ou «K-0012 — ajuda com o pagamento» (cancelado).
    A referência vai sempre primeiro, para a equipa (e o CARRINHO_HUB) a reconhecer. Sem referência válida: só o pedido de ajuda. */
export function textoWhats(pagina: Pagina, lingua: Lingua, ref: string | null): string {
  if (pagina === "obrigado") return ref ?? "";
  const ajuda = TEXTOS_PAG[lingua].ko.msgAjuda;
  return ref ? `${ref} — ${ajuda}` : ajuda;
}

export function linkWhatsPagamento(pagina: Pagina, lingua: Lingua, ref: string | null): string {
  const t = textoWhats(pagina, lingua, ref);
  return `https://wa.me/${CONFIG_LISBOA.whatsapp}${t ? `?text=${encodeURIComponent(t)}` : ""}`;
}
