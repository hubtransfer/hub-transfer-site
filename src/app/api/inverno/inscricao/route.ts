import { NextResponse } from "next/server";
import { dadosPedido, enviarEventoMeta, texto } from "../_meta";

/* Pré-inscrição de motoristas (campanha de inverno).
   Passo 1: cria a linha na folha "Candidatos Inverno" e avisa o Junior (WhatsApp + e-mail, no Apps Script).
   Passo 2: completa a mesma linha (regime, carro, turnos).
   Variáveis: INSCRICOES_WEBAPP_URL (web app do Apps Script) e INSCRICOES_TOKEN (segredo partilhado com o script). */

const REGIMES = ["Part-time", "Full-time"];
const CARROS = ["Carro próprio", "Carro de frota", "Sem carro"];
const TURNOS = ["Madrugada", "Manhã", "Tarde", "Noite"];
const ID_VALIDO = /^[A-Za-z0-9-]{8,64}$/;

function utms(url: string) {
  try {
    const p = new URL(url).searchParams;
    return {
      utm_source: texto(p.get("utm_source"), 80),
      utm_medium: texto(p.get("utm_medium"), 80),
      utm_campaign: texto(p.get("utm_campaign"), 120),
      utm_content: texto(p.get("utm_content"), 120),
    };
  } catch {
    return {};
  }
}

async function guardarNaFolha(dados: Record<string, unknown>): Promise<boolean> {
  const destino = process.env.INSCRICOES_WEBAPP_URL;
  if (!destino) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[inverno] INSCRICOES_WEBAPP_URL por definir — inscrição simulada:", dados);
      return true;
    }
    console.error("[inverno] INSCRICOES_WEBAPP_URL por definir — inscrição NÃO guardada");
    return false;
  }
  try {
    const r = await fetch(destino, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, token: process.env.INSCRICOES_TOKEN || "" }),
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; erro?: string } | null;
    if (!r.ok || !j?.ok) {
      console.error("[inverno] Apps Script recusou:", r.status, j?.erro);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inverno] Apps Script inacessível:", (err as Error).message);
    return false;
  }
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // armadilha para robôs: responde ok e não guarda nada
  if (texto(b.empresa, 200)) return NextResponse.json({ ok: true });

  const passo = b.passo === 2 ? 2 : b.passo === 1 ? 1 : 0;
  const leadId = texto(b.leadId, 64);
  const eventId = texto(b.eventId, 64);
  const url = texto(b.url, 600);
  if (!passo || !ID_VALIDO.test(leadId) || !ID_VALIDO.test(eventId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const consentimentoCookies = b.consentimentoCookies === true;
  const { ip, userAgent } = dadosPedido(req);
  const fbp = texto(b.fbp, 200) || undefined;
  const fbc = texto(b.fbc, 300) || undefined;

  if (passo === 1) {
    const nome = texto(b.nome, 120);
    const whatsapp = texto(b.whatsapp, 40);
    const concelho = texto(b.concelho, 80);
    const digitos = whatsapp.replace(/\D/g, "");
    if (nome.length < 2 || digitos.length < 9 || digitos.length > 15 || concelho.length < 2 || b.consentimentoDados !== true) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const ok = await guardarNaFolha({
      acao: "passo1",
      leadId,
      nome,
      whatsapp,
      concelho,
      consentimento: `Sim (${new Date().toISOString()})`,
      pagina: url.split("?")[0],
      ...utms(url),
    });
    if (!ok) return NextResponse.json({ ok: false }, { status: 502 });

    if (consentimentoCookies) {
      await enviarEventoMeta({
        nome: "Lead",
        eventId,
        url,
        ip,
        userAgent,
        fbp,
        fbc,
        telefone: whatsapp,
        primeiroNome: nome.split(/\s+/)[0],
        cidade: concelho,
      });
    }
    return NextResponse.json({ ok: true });
  }

  const regime = REGIMES.includes(String(b.regime)) ? String(b.regime) : "";
  const carro = CARROS.includes(String(b.carro)) ? String(b.carro) : "";
  const turnos = Array.isArray(b.turnos) ? b.turnos.map(String).filter((t) => TURNOS.includes(t)) : [];
  const ok = await guardarNaFolha({ acao: "passo2", leadId, regime, carro, turnos: turnos.join(", ") });
  if (!ok) return NextResponse.json({ ok: false }, { status: 502 });

  if (consentimentoCookies) {
    await enviarEventoMeta({ nome: "CompleteRegistration", eventId, url, ip, userAgent, fbp, fbc });
  }
  return NextResponse.json({ ok: true });
}
