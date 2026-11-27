// Rota de servidor do CRM da assistente (E20). O browser fala com esta rota; a rota fala
// com o HUB-Central (CRM_ASSISTENTE.js) por POST com corpo JSON — o mesmo endereço que o
// resto do site usa (GAS_WEBAPP_URL, ou o HUB_CENTRAL_URL de sempre).
//
// Só passam as cinco acções do CRM. Nada do corpo é escrito nos registos (o código de
// entrada e as notas das chamadas nunca aparecem nos logs da Vercel).

import { HUB_CENTRAL_URL } from "@/lib/trips";

const GAS_URL = process.env.GAS_WEBAPP_URL || HUB_CENTRAL_URL;
const ACCOES = new Set(["crmEntrar", "crmFila", "crmCliente", "crmRegistar", "crmCarrinho"]);
const MAX_CORPO = 8_000;

export const dynamic = "force-dynamic";

const responder = (o: unknown, status = 200) =>
  Response.json(o, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

export async function POST(req: Request) {
  let corpo: Record<string, unknown>;
  try {
    const texto = await req.text();
    if (texto.length > MAX_CORPO) return responder({ ok: false, motivo: "pedido_invalido" }, 400);
    corpo = JSON.parse(texto);
  } catch {
    return responder({ ok: false, motivo: "pedido_invalido" }, 400);
  }
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo) || !ACCOES.has(String(corpo.action))) {
    return responder({ ok: false, motivo: "pedido_invalido" }, 400);
  }

  try {
    // text/plain como o resto do site; o Apps Script responde 302 antes do JSON — seguir.
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(corpo),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const texto = await res.text();
    try {
      return responder(JSON.parse(texto));
    } catch {
      console.error(`[assistente] ${String(corpo.action)}: o HUB-Central não respondeu JSON (HTTP ${res.status})`);
      return responder({ ok: false, motivo: "rede" }, 502);
    }
  } catch {
    console.error(`[assistente] ${String(corpo.action)}: sem ligação ao HUB-Central`);
    return responder({ ok: false, motivo: "rede" }, 502);
  }
}
