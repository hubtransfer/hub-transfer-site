// Rota de servidor: registar que o motorista carregou no botão do WhatsApp.
// O browser fala com esta rota; a rota fala com o Google — o Apps Script
// não devolve cabeçalhos CORS, por isso a chamada não pode sair do browser.
//
// Chamada via navigator.sendBeacon no clique (a página navega para o wa.me
// logo a seguir; um fetch normal seria cancelado). O beacon não lê resposta,
// por isso devolvemos sempre 204 — um erro aqui nunca pode partir a ida do
// motorista para o WhatsApp.

import { HUB_CENTRAL_URL } from "@/lib/trips";

const GAS_URL = process.env.GAS_WEBAPP_URL || HUB_CENTRAL_URL;

interface MensagemEnviadaBody {
  rowIndex?: string;
  id?: string;
  motorista?: string;
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  // Sem verificação de sessão aqui: a sessão vive no localStorage e seria o
  // browser a enviá-la, logo qualquer um a forjaria — mesmo padrão da rota
  // de apagar. Este registo é um carimbo inofensivo; a folha é que manda.

  // O sendBeacon manda um Blob e o Content-Type pode não vir como esperamos —
  // ler como texto e fazer o parse à mão, nunca confiar no req.json().
  let body: MensagemEnviadaBody;
  try {
    body = JSON.parse(await req.text());
  } catch {
    console.error("[mensagem-enviada] corpo inválido, registo perdido");
    return noContent();
  }

  const rowIndex = String(body.rowIndex ?? "").trim();
  const id = String(body.id ?? "").trim();
  const motorista = String(body.motorista ?? "").trim();

  if (!rowIndex && !id) {
    console.error("[mensagem-enviada] sem rowIndex nem id, registo perdido");
    return noContent();
  }

  const params = new URLSearchParams({ action: "motoristaMandouMsg" });
  // rowIndex é o preferido; o id (coluna A) é a reserva — um ou outro.
  if (rowIndex) params.set("rowIndex", rowIndex);
  else params.set("id", id);
  if (motorista) params.set("motorista", motorista);

  try {
    // O Apps Script responde 302 antes de dar o JSON — seguir o redirect.
    const res = await fetch(`${GAS_URL}?${params.toString()}`, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (!data.success) {
        console.error("[mensagem-enviada] GAS recusou:", data.message || text.slice(0, 200));
      }
    } catch {
      console.error(
        `[mensagem-enviada] GAS não respondeu JSON (HTTP ${res.status}):`,
        text.replace(/\s+/g, " ").trim().slice(0, 200),
      );
    }
  } catch (err) {
    console.error("[mensagem-enviada] erro a falar com o GAS:", err);
  }

  return noContent();
}
