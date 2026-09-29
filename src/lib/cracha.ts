// Crachá da sessão (devolvido pelo validateLogin, guardado em hub_session).
// Vai em todos os pedidos à HUB-Central: GET → &cracha=…, POST JSON → campo
// cracha. Sem crachá na sessão, o pedido segue exactamente como antes.
// Sem imports de propósito: é usado por trips.ts, que o auth.ts importa.

const SESSION_KEY = "hub_session";

/** O crachá da sessão actual, ou "" (sem sessão, sessão expirada ou antiga). */
export function crachaAtual(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as { cracha?: unknown; expiresAt?: number } | null;
    if (!s || (s.expiresAt && Date.now() > s.expiresAt)) return "";
    return typeof s.cracha === "string" ? s.cracha : "";
  } catch {
    return "";
  }
}

/** «&cracha=…» para juntar a um GET à HUB-Central; "" sem crachá. */
export function crachaParam(): string {
  const c = crachaAtual();
  return c ? `&cracha=${encodeURIComponent(c)}` : "";
}

/** { cracha } para espalhar num URLSearchParams ou num corpo; {} sem crachá. */
export function crachaCampo(): { cracha?: string } {
  const c = crachaAtual();
  return c ? { cracha: c } : {};
}

/** O corpo de um POST à HUB-Central com o campo cracha (se houver). */
export function comCracha<T extends object>(corpo: T): T & { cracha?: string } {
  const c = crachaAtual();
  return c ? { ...corpo, cracha: c } : corpo;
}
