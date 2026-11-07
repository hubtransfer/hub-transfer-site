import { NextResponse } from "next/server";
import { chamarBackend } from "../_backend";
import { dadosPedido, diagnostico, enviarEventoMeta, ID_VALIDO, texto, type ResultadoMeta } from "../_meta";
import { ANO_MINIMO, ANTES_2010, CARROS, INGLES, LUGARES, REGIMES, SIM_NAO, TURNOS } from "@/app/motoristas/_lib/ficha";

/* Candidatura de motoristas (/motoristas).
   acao "passo1":    cria (ou atualiza) a linha na folha "Candidatos Motoristas" e devolve o código HUB-XXXX. Evento Lead.
   acao "respostas": grava as respostas do quiz (ao chegar às fotos, ou logo no "Não tenho" carro).
   acao "concluir":  grava as respostas outra vez, confirma as duas fotos, calcula o estado e avisa o Junior. Evento CompleteRegistration.
   O estado e a prioridade são calculados no Apps Script e nunca voltam para o candidato. */

const um = <T extends readonly string[]>(lista: T, v: unknown) => (lista.includes(String(v)) ? String(v) : "");

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

/** Respostas do quiz, só com valores conhecidos. */
function respostas(b: Record<string, unknown>) {
  const carro = um(CARROS, b.carro);
  const temCarro = carro !== "" && carro !== "Não tenho";
  const anoTxt = temCarro ? texto(b.ano, 16) : "";
  const anoNum = Number(anoTxt);
  const ano = anoTxt === ANTES_2010 || (Number.isInteger(anoNum) && anoNum >= ANO_MINIMO && anoNum <= new Date().getFullYear() + 1) ? anoTxt : "";
  const turnos = Array.isArray(b.turnos) ? b.turnos.map(String).filter((t) => (TURNOS as readonly string[]).includes(t)) : [];
  return {
    carro,
    marca: temCarro ? texto(b.marca, 40) : "",
    modelo: temCarro ? texto(b.modelo, 40) : "",
    ano,
    lugares: temCarro ? um(LUGARES, b.lugares) : "",
    carta: temCarro ? um(SIM_NAO, b.carta) : "",
    aeroporto: temCarro ? um(SIM_NAO, b.aeroporto) : "",
    trabalho: temCarro ? um(SIM_NAO, b.trabalho) : "",
    ingles: temCarro ? um(INGLES, b.ingles) : "",
    regime: temCarro ? um(REGIMES, b.regime) : "",
    turnos: temCarro ? [...new Set(turnos)].join(", ") : "",
  };
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // armadilha para robôs: responde como se estivesse tudo bem e não guarda nada
  if (texto(b.empresa, 200)) return NextResponse.json({ ok: true, codigo: "HUB-0000" });

  const acao = b.acao === "passo1" || b.acao === "respostas" || b.acao === "concluir" ? b.acao : "";
  const leadId = texto(b.leadId, 64);
  const url = texto(b.url, 600);
  if (!acao || !ID_VALIDO.test(leadId)) return NextResponse.json({ ok: false }, { status: 400 });

  const eventId = texto(b.eventId, 64);
  const querMeta = b.consentimentoCookies === true && ID_VALIDO.test(eventId);
  const { ip, userAgent } = dadosPedido(req);
  const fbp = texto(b.fbp, 200) || undefined;
  const fbc = texto(b.fbc, 300) || undefined;

  if (acao === "passo1") {
    const nome = texto(b.nome, 120);
    const whatsapp = texto(b.whatsapp, 40);
    const concelho = texto(b.concelho, 80);
    const digitos = whatsapp.replace(/\D/g, "");
    if (nome.length < 2 || digitos.length < 9 || digitos.length > 15 || concelho.length < 2 || b.consentimentoDados !== true) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const res = await chamarBackend({
      acao: "passo1",
      leadId,
      nome,
      whatsapp,
      concelho,
      consentimento: `Sim (${new Date().toISOString()})`,
      pagina: url.split("?")[0],
      ...utms(url),
    });
    if (!res.ok || !res.codigo) return NextResponse.json({ ok: false }, { status: 502 });

    let meta: ResultadoMeta | undefined;
    if (querMeta) {
      meta = await enviarEventoMeta({
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
    return NextResponse.json({ ok: true, codigo: res.codigo, ...diagnostico(meta) });
  }

  const r = respostas(b);
  if (!r.carro) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await chamarBackend({ acao, leadId, ...r });
  if (!res.ok) return NextResponse.json({ ok: false }, { status: res.erro === "fotos" ? 409 : 502 });

  let meta: ResultadoMeta | undefined;
  if (acao === "concluir" && querMeta) {
    meta = await enviarEventoMeta({ nome: "CompleteRegistration", eventId, url, ip, userAgent, fbp, fbc });
  }
  return NextResponse.json({ ok: true, ...diagnostico(meta) });
}
