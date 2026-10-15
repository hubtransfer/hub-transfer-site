import { createHash } from "node:crypto";

/* API de Conversões da Meta (servidor). Só é chamada com consentimento de cookies.
   Variáveis: NEXT_PUBLIC_META_PIXEL_ID, META_CAPI_TOKEN, META_API_VERSION (opcional), META_TEST_EVENT_CODE (opcional). */

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** Telefone em formato internacional só com dígitos (números portugueses de 9 dígitos ganham o 351). */
export function normalizarTelefone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && /^[23679]/.test(d)) d = `351${d}`;
  return d;
}

export type EventoMeta = {
  nome: "PageView" | "Lead" | "CompleteRegistration";
  eventId: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  telefone?: string;
  primeiroNome?: string;
  cidade?: string;
};

export async function enviarEventoMeta(e: EventoMeta): Promise<void> {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return;

  const user_data: Record<string, unknown> = {
    client_ip_address: e.ip,
    client_user_agent: e.userAgent,
    fbp: e.fbp,
    fbc: e.fbc,
  };
  if (e.telefone) user_data.ph = [sha(normalizarTelefone(e.telefone))];
  if (e.primeiroNome) user_data.fn = [sha(e.primeiroNome)];
  if (e.cidade) user_data.ct = [sha(e.cidade.replace(/\s+/g, ""))];
  if (e.telefone || e.cidade) user_data.country = [sha("pt")];

  const corpo: Record<string, unknown> = {
    data: [
      {
        event_name: e.nome,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.url,
        user_data,
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) corpo.test_event_code = process.env.META_TEST_EVENT_CODE;

  const versao = process.env.META_API_VERSION || "v23.0";
  try {
    const r = await fetch(`https://graph.facebook.com/${versao}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.warn("[inverno] API de Conversões respondeu", r.status, (await r.text()).slice(0, 300));
  } catch (err) {
    console.warn("[inverno] API de Conversões falhou:", (err as Error).message);
  }
}

export function dadosPedido(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const userAgent = req.headers.get("user-agent") || undefined;
  return { ip, userAgent };
}

export function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
