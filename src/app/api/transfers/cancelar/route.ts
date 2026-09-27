// Rota de servidor: cancelar ou marcar no-show no HUB-CENTRAL (Apps Script),
// sem apagar a linha. Mesmo desenho do apagar/route.ts: o browser fala com
// esta rota, a rota fala com o Google (o Apps Script não devolve CORS).

import { NextResponse } from "next/server";
import { HUB_CENTRAL_URL } from "@/lib/trips";

// Pode escrever no hotel e na aba mensal e enviar WhatsApp — pode demorar.
export const maxDuration = 60;

const GAS_URL = process.env.GAS_WEBAPP_URL || HUB_CENTRAL_URL;

interface CancelarBody {
  id?: string;
  senha?: string;
  desfecho?: string;
  notificar?: boolean;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json(
    { ok: false, mensagem, desfecho: "", clienteNotificado: false, jaEstava: false, log: [] },
    { status },
  );
}

export async function POST(req: Request) {
  let body: CancelarBody;
  try {
    body = await req.json();
  } catch {
    return erro("Pedido inválido", 400);
  }

  // Sem verificação de sessão aqui (ver apagar/route.ts): a protecção real é
  // a senha, validada no Apps Script.
  if (!body.id) return erro("Falta o ID da viagem", 400);
  if (!body.senha) return erro("Senha incorrecta", 400);
  if (body.desfecho !== "cancelado" && body.desfecho !== "noshow") {
    return erro("Desfecho inválido (cancelado ou noshow)", 400);
  }

  // A partir daqui o pedido pode ter chegado ao Google — em caso de dúvida a
  // resposta leva naoConfirmado: true e o painel reconcilia com o backend.
  // Nunca incluir a senha na resposta.
  const t0 = Date.now();
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cancelarTransferSite",
        id: body.id,
        senha: body.senha,
        desfecho: body.desfecho,
        // no-show nunca avisa o cliente — nem que o pedido diga o contrário
        notificar: body.desfecho === "cancelado" && body.notificar === true,
      }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });

    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      const corpo = text.replace(/\s+/g, " ").trim().slice(0, 300);
      return NextResponse.json(
        {
          ok: false,
          naoConfirmado: true,
          mensagem:
            "O Apps Script respondeu, mas não em JSON — não foi possível confirmar o resultado.",
          desfecho: body.desfecho,
          clienteNotificado: false,
          jaEstava: false,
          log: [
            `HTTP ${res.status}`,
            `content-type: ${res.headers.get("content-type") || "—"}`,
            `url final: ${res.url}`,
            `demorou: ${Date.now() - t0}ms`,
            `corpo (primeiros 300 chars): ${corpo || "(vazio)"}`,
          ],
        },
        { status: 502 },
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        {
          ok: false,
          naoConfirmado: true,
          mensagem:
            "Timeout: o Apps Script não respondeu dentro de 55s — não foi possível confirmar o resultado.",
          desfecho: body.desfecho,
          clienteNotificado: false,
          jaEstava: false,
          log: [`timeout ao fim de ${Date.now() - t0}ms (limite 55000ms)`],
        },
        { status: 504 },
      );
    }
    return erro("Erro de conexão com o Apps Script", 502);
  }
}
