/* O aviso da Stripe (pedido E11) — a lógica, separada da rota para se testar sem rede.
   A rota (src/app/api/stripe/webhook/route.ts) só lê o corpo cru e o cabeçalho e chama tratarAviso().

   1. Verifica a assinatura (cabeçalho Stripe-Signature, HMAC-SHA256 com STRIPE_WEBHOOK_SECRET, tolerância de 5 min).
   2. Só trata checkout.session.completed com payment_status=paid e checkout.session.async_payment_succeeded.
   3. Chama a acção «pagamentoConfirmado» do HUB-Central (HIBRIDO_HUB.js · hubHibPagamentoConfirmado_), com o corpo:
        { action, segredo, hub, carrinho, pedido, evento, sessao, valorCent, moeda }
      O backend confere o segredo, a sessão, o valor e a moeda, e não duplica (estado «pago» ou o mesmo id de evento).
   4. Responde já; a chamada ao backend corre depois da resposta (agendar). Um evento já visto nesta instância não volta a sair.
   Registos: só os 6 primeiros caracteres de qualquer id. Nunca o segredo. */

import { createHmac, timingSafeEqual } from "node:crypto";

export const TOLERANCIA_S = 300;

/** Os 6 primeiros caracteres de um id, para os registos. */
export const curto = (id: unknown) => (typeof id === "string" && id ? id.slice(0, 6) + "…" : "—");

/** Verifica o cabeçalho Stripe-Signature («t=…,v1=…,v1=…») contra o corpo cru, como a biblioteca da Stripe. */
export function assinaturaValida(corpo: string, cabecalho: string | null, segredo: string, agoraS: number): boolean {
  if (!cabecalho || !segredo) return false;
  let t = "";
  const v1: string[] = [];
  for (const parte of cabecalho.split(",")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const k = parte.slice(0, i).trim();
    const v = parte.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  const ts = Number(t);
  if (!/^\d+$/.test(t) || !v1.length || Math.abs(agoraS - ts) > TOLERANCIA_S) return false;
  const esperado = Buffer.from(createHmac("sha256", segredo).update(`${t}.${corpo}`, "utf8").digest("hex"), "utf8");
  return v1.some((s) => {
    const b = Buffer.from(s, "utf8");
    return b.length === esperado.length && timingSafeEqual(b, esperado);
  });
}

/** O que segue para o backend: exactamente os campos que o hubHibPagamentoConfirmado_ lê. */
export type CorpoConfirmado = {
  action: "pagamentoConfirmado";
  segredo: string;
  hub: string;
  carrinho: string;
  pedido: string;
  evento: string;
  sessao: string;
  valorCent: number;
  moeda: string;
};

type Sessao = {
  id?: string;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
};
type Evento = { id?: string; type?: string; data?: { object?: Sessao } };

const TIPOS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

/** null = evento que não nos interessa (outro tipo, ou ainda não pago). */
export function corpoDoEvento(ev: Evento, segredo: string): CorpoConfirmado | null {
  if (!ev || !ev.type || !TIPOS.has(ev.type)) return null;
  const s = ev.data?.object;
  if (!s || s.payment_status !== "paid" || !ev.id || !s.id) return null;
  const m = s.metadata ?? {};
  return {
    action: "pagamentoConfirmado",
    segredo,
    hub: String(m.hub ?? ""),
    carrinho: String(m.carrinho ?? ""),
    pedido: String(m.pedido ?? ""),
    evento: ev.id,
    sessao: s.id,
    valorCent: Number(s.amount_total ?? NaN),
    moeda: String(s.currency ?? ""),
  };
}

/** Os eventos já enviados por esta instância (a Stripe repete; o backend também não duplica). */
export class Vistos {
  private m = new Map<string, number>();
  private max: number;
  constructor(max = 1000) {
    this.max = max;
  }
  tem(id: string) {
    return this.m.has(id);
  }
  marcar(id: string) {
    this.m.set(id, Date.now());
    if (this.m.size > this.max) this.m.delete(this.m.keys().next().value as string);
  }
  esquecer(id: string) {
    this.m.delete(id);
  }
}

export type Ambiente = {
  /** STRIPE_WEBHOOK_SECRET */
  segredoStripe: string;
  /** HIBRIDO_PAGAR_SEGREDO (o mesmo valor da propriedade com esse nome no HUB-Central) */
  segredoHub: string;
  /** GAS_WEBAPP_URL, ou o HUB_CENTRAL_URL do código */
  urlBackend: string;
};

export type Dependencias = {
  env: Ambiente;
  vistos: Vistos;
  agoraS: () => number;
  /** POST JSON ao backend; devolve o JSON da resposta (ou lança). */
  enviar: (url: string, corpo: CorpoConfirmado) => Promise<unknown>;
  /** Corre o trabalho depois de responder (na rota: after() do Next). */
  agendar: (trabalho: () => Promise<void>) => void;
  registar: (linha: string) => void;
};

export type Resposta = { status: number; corpo: Record<string, unknown> };

export function tratarAviso(corpoCru: string, assinatura: string | null, d: Dependencias): Resposta {
  const { env } = d;
  if (!env.segredoStripe) {
    d.registar("💳 webhook: falta STRIPE_WEBHOOK_SECRET");
    return { status: 500, corpo: { erro: "não configurado" } };
  }
  if (!assinaturaValida(corpoCru, assinatura, env.segredoStripe, d.agoraS())) {
    d.registar("💳 webhook: assinatura inválida");
    return { status: 400, corpo: { erro: "assinatura inválida" } };
  }
  let ev: Evento;
  try {
    ev = JSON.parse(corpoCru) as Evento;
  } catch {
    return { status: 400, corpo: { erro: "corpo inválido" } };
  }
  const corpo = corpoDoEvento(ev, env.segredoHub);
  if (!corpo) {
    d.registar(`💳 webhook: ${ev.type ?? "?"} ${curto(ev.id)} ignorado`);
    return { status: 200, corpo: { recebido: true, ignorado: true } };
  }
  if (d.vistos.tem(corpo.evento)) {
    d.registar(`💳 webhook: ${curto(corpo.evento)} repetido`);
    return { status: 200, corpo: { recebido: true, repetido: true } };
  }
  if (!env.segredoHub) {
    // sem o segredo o backend recusa tudo: 500 para a Stripe tentar de novo depois de a variável existir
    d.registar("💳 webhook: falta HIBRIDO_PAGAR_SEGREDO");
    return { status: 500, corpo: { erro: "não configurado" } };
  }
  d.vistos.marcar(corpo.evento);
  const rotulo = `${curto(corpo.evento)} ses ${curto(corpo.sessao)} hub ${curto(corpo.hub)} car ${curto(corpo.carrinho)}`;
  d.agendar(async () => {
    try {
      const r = (await d.enviar(env.urlBackend, corpo)) as { ok?: boolean; repetido?: boolean; motivo?: string } | null;
      d.registar(`💳 webhook: ${rotulo} → backend ${r?.ok ? (r.repetido ? "ok (repetido)" : "ok") : "recusou" + (r?.motivo ? ` (${String(r.motivo).slice(0, 60)})` : "")}`);
    } catch (e) {
      // não chegou ao backend: esquece o evento (uma repetição da Stripe volta a tentar); a reserva horária do backend apanha o resto
      d.vistos.esquecer(corpo.evento);
      d.registar(`💳 webhook: ${rotulo} → backend falhou (${e instanceof Error ? e.name : "erro"})`);
    }
  });
  return { status: 200, corpo: { recebido: true } };
}
