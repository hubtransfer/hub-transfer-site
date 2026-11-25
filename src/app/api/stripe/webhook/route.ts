import { after, NextResponse } from "next/server";
import { HUB_CENTRAL_URL } from "@/lib/trips";
import { tratarAviso, Vistos, type CorpoConfirmado } from "@/lib/pagamento/webhook";

/* O aviso da Stripe (pedido E11). Endereço a registar na Stripe: https://hubtransfer.pt/api/stripe/webhook
   Eventos: checkout.session.completed e checkout.session.async_payment_succeeded. A lógica está em src/lib/pagamento/webhook.ts.
   Variáveis: STRIPE_WEBHOOK_SECRET (whsec_…), HIBRIDO_PAGAR_SEGREDO (igual à propriedade do HUB-Central), GAS_WEBAPP_URL (opcional). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const vistos = new Vistos();

async function enviar(url: string, corpo: CorpoConfirmado): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(50_000),
  });
  const texto = await res.text();
  try {
    return JSON.parse(texto);
  } catch {
    return { ok: false, motivo: `HTTP ${res.status}, resposta sem JSON` };
  }
}

export async function POST(req: Request) {
  const corpoCru = await req.text();
  const r = tratarAviso(corpoCru, req.headers.get("stripe-signature"), {
    env: {
      segredoStripe: process.env.STRIPE_WEBHOOK_SECRET || "",
      segredoHub: process.env.HIBRIDO_PAGAR_SEGREDO || "",
      urlBackend: process.env.GAS_WEBAPP_URL || HUB_CENTRAL_URL,
    },
    vistos,
    agoraS: () => Math.floor(Date.now() / 1000),
    enviar,
    agendar: (trabalho) => after(trabalho),
    registar: (linha) => console.log(linha),
  });
  return NextResponse.json(r.corpo, { status: r.status, headers: { "Cache-Control": "no-store" } });
}
