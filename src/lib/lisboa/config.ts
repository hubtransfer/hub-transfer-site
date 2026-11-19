/* Configuração da página «Lisboa à sua mesa» (CONFIG do protótipo validado). */

export const CONFIG_LISBOA = {
  /** WhatsApp da HUB para esta página (o do protótipo; só dígitos, como o wa.me pede) */
  whatsapp: "351928283652",
  /** ponto de partida e de regresso do dia (hotel de referência no centro de Lisboa) */
  hotel: { lat: 38.7167, lng: -9.142 },
  /** Nota do Google: só valores reais. Vazio = a linha não aparece no rodapé. */
  googleRating: "",
  googleReviews: "",
} as const;

export function linkWhatsapp(texto: string): string {
  return `https://wa.me/${CONFIG_LISBOA.whatsapp}?text=${encodeURIComponent(texto)}`;
}
