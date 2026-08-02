// Rota de servidor: apagar viagem no HUB-CENTRAL (Apps Script).
// O browser fala com esta rota; a rota fala com o Google — o Apps Script
// não devolve cabeçalhos CORS, por isso a chamada não pode sair do browser.

import { NextResponse } from "next/server";
import { HUB_CENTRAL_URL } from "@/lib/trips";

// Apaga em várias folhas e ainda envia WhatsApp — pode demorar 10–20s.
export const maxDuration = 60;

const GAS_URL = process.env.GAS_WEBAPP_URL || HUB_CENTRAL_URL;

interface ApagarBody {
  id?: string;
  senha?: string;
  notificar?: boolean;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json(
    { ok: false, mensagem, clienteNotificado: false, log: [] },
    { status },
  );
}

export async function POST(req: Request) {
  let body: ApagarBody;
  try {
    body = await req.json();
  } catch {
    return erro("Pedido inválido", 400);
  }

  // Sem verificação de sessão aqui: a sessão vive no localStorage e seria o
  // browser a enviá-la, logo qualquer um a forjaria — e expirada bloqueava
  // admins verdadeiros. A protecção real é a senha, validada no Apps Script.
  if (!body.id) {
    return erro("Falta o ID da viagem", 400);
  }
  if (!body.senha) {
    return erro("Senha incorrecta", 400);
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "apagarTransferSite",
        id: body.id,
        senha: body.senha,
        notificar: body.notificar === true,
      }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });

    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      // O Apps Script devolve uma página HTML de erro se a publicação estiver mal
      return erro(
        "Erro: resposta inesperada do Apps Script (não é JSON). Verifique a publicação do Web App.",
        502,
      );
    }
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return erro(
      timeout
        ? "Erro: o Apps Script demorou demasiado a responder. Verifique na folha se a viagem foi apagada."
        : "Erro de conexão com o Apps Script",
      502,
    );
  }
}
