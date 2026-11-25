/* Medição da página «Lisboa à sua mesa».
   Usa só o que o site já tem: o Pixel da Meta (window.fbq). Nesta página o Pixel não é carregado
   (no site só arranca nas campanhas, depois do «Aceitar» do aviso de cookies); quando estiver carregado,
   os eventos seguem. Sem Pixel, não acontece nada: a medição nunca impede a página de funcionar. */

/* VerPrato (prato) · EscolherRestaurante (prato, restaurante) · PedirMesa (prato, restaurante, servico, origem)
   AdicionarLugar (lugar) · FalarConsultor (lugares).
   Pedido da mesa em passos (E8): MesaPasso (passo 1–4) · EscolheIda (sim / nao / naosei) · EscolheVolta (sim / nao)
   · EnviarPedido (servico M / I / V / IV, cliente sim / nao). Todos levam também a língua. */
export type EventoLisboa =
  | "VerPrato"
  | "EscolherRestaurante"
  | "PedirMesa"
  | "AdicionarLugar"
  | "FalarConsultor"
  | "MesaPasso"
  | "EscolheIda"
  | "EscolheVolta"
  | "EnviarPedido";

export function medir(evento: EventoLisboa, dados: Record<string, string | number> = {}) {
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === "function") fbq("trackCustom", evento, { pagina: "lisboa", ...dados });
  } catch {
    /* nada */
  }
}
