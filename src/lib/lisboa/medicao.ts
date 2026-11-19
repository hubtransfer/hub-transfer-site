/* Medição da página «Lisboa à sua mesa».
   Usa só o que o site já tem: o Pixel da Meta (window.fbq). Nesta página o Pixel não é carregado
   (no site só arranca nas campanhas, depois do «Aceitar» do aviso de cookies); quando estiver carregado,
   os eventos seguem. Sem Pixel, não acontece nada: a medição nunca impede a página de funcionar. */

/* VerPrato (prato) · EscolherRestaurante (prato, restaurante) · PedirMesa (prato, restaurante, transporte sim/não, origem)
   AdicionarLugar (lugar) · FalarConsultor (lugares). Todos levam também a língua. */
export type EventoLisboa = "VerPrato" | "EscolherRestaurante" | "PedirMesa" | "AdicionarLugar" | "FalarConsultor";

export function medir(evento: EventoLisboa, dados: Record<string, string | number> = {}) {
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === "function") fbq("trackCustom", evento, { pagina: "lisboa", ...dados });
  } catch {
    /* nada */
  }
}
