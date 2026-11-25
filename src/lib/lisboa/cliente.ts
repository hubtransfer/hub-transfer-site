/* Cliente identificado da /lisboa (pedido E8, ponto 3) — só no browser.
   /lisboa?c=XXXXXXXX (8 a 12 letras e números): o código fica guardado no browser, como a «hub-lang»,
   e sai do endereço (para não ir parar a quem receber a ligação copiada).
   A rota /api/lisboa/cliente devolve, quando houver backend, só { primeiroNome, lingua, hotel }.
   Por agora devolve vazio e a página funciona como sem cliente. */

import { LINGUAS, type Lingua } from "./tipos";

export type Cliente = { codigo: string; primeiroNome?: string; lingua?: Lingua; hotel?: string };

const CHAVE = "hub-cliente";
/** Marcado quando o cliente escolhe uma língua no seletor: a língua do cliente já não muda a página. */
export const CHAVE_LINGUA_ESCOLHIDA = "hub-lang-escolhida";
const CODIGO = /^[A-Za-z0-9]{8,12}$/;

let pedido: Promise<Cliente | null> | null = null;

function codigoGuardado(): string | null {
  try {
    const url = new URL(window.location.href);
    const c = url.searchParams.get("c");
    if (c && CODIGO.test(c)) {
      localStorage.setItem(CHAVE, c);
      url.searchParams.delete("c");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      return c;
    }
  } catch {
    /* sem armazenamento: usa o do endereço nesta visita */
  }
  try {
    const g = localStorage.getItem(CHAVE);
    return g && CODIGO.test(g) ? g : null;
  } catch {
    return null;
  }
}

const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** O cliente desta visita (um só pedido por página), ou null. Nunca falha: sem resposta, é null. */
export function obterCliente(): Promise<Cliente | null> {
  if (pedido) return pedido;
  pedido = (async () => {
    const codigo = codigoGuardado();
    if (!codigo) return null;
    try {
      const r = await fetch(`/api/lisboa/cliente?c=${encodeURIComponent(codigo)}`, { cache: "no-store" });
      const j = r.ok ? ((await r.json()) as Record<string, unknown>) : {};
      const lingua = (LINGUAS as readonly string[]).includes(String(j.lingua)) ? (j.lingua as Lingua) : undefined;
      return { codigo, primeiroNome: texto(j.primeiroNome, 40), lingua, hotel: texto(j.hotel, 80) };
    } catch {
      return { codigo };
    }
  })();
  return pedido;
}

export function linguaJaEscolhida(): boolean {
  try {
    return localStorage.getItem(CHAVE_LINGUA_ESCOLHIDA) === "1";
  } catch {
    return false;
  }
}
