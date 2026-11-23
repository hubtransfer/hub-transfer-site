// ───────────────────────────────────────────────────────────────
//  ajuda/mensagens.ts — RASCUNHO das três mensagens de WhatsApp que o
//  HUB-Central vai mandar. A APP NÃO AS ENVIA: estão aqui para o Junior
//  as aprovar e para o backend (Apps Script + Z-API) as copiar depois.
//  Os testes confirmam que nenhuma leva a operadora, a referência da
//  reserva, o nome ou o telefone do cliente, nem o motivo.
//
//  Sem imports de valores (os testes correm-no com o node, sem build).
//  O link vem sempre de linkDoPedido() (src/lib/ajuda/regras.ts).
// ───────────────────────────────────────────────────────────────
import type { ResumoViagemAjuda } from "./tipos";

function linhasViagem(r: ResumoViagemAjuda): string[] {
  const rota = [r.origem, r.destino].map((s) => String(s || "").trim()).filter(Boolean).join(" → ");
  const voo = String(r.voo ?? "").trim();
  return [
    `*${r.rotulo}*`,
    `📅 ${r.data} · ${r.hora}`,
    ...(voo ? [`✈️ Voo ${voo}`] : []),
    `📍 ${rota}`,
    ...(r.valor > 0 ? [`💶 €${Math.round(r.valor)}`] : []),
  ];
}

/** 1. Ao colega escolhido, em privado. */
export function mensagemAoColega(deNome: string, r: ResumoViagemAjuda, link: string): string {
  return [
    `🤝 *Pedido de ajuda — HUB Transfer*`,
    ``,
    `${deNome} pede-lhe esta viagem:`,
    ...linhasViagem(r),
    ``,
    `Responda na app («Sim, faço» ou «Não posso»):`,
    link,
    ``,
    `Se não responder em 15 minutos, o pedido passa a outro colega.`,
  ].join("\n");
}

/** 2. Ao grupo da empresa. */
export function mensagemAoGrupo(deNome: string, r: ResumoViagemAjuda, link: string): string {
  return [
    `🤝 *Pedido ao grupo — HUB Transfer*`,
    ``,
    `${deNome} precisa de quem faça esta viagem:`,
    ...linhasViagem(r),
    ``,
    `Para aceitar, abra o link e carregue em «Aceitar»:`,
    link,
    ``,
    `Fica com quem aceitar primeiro. A seguir recebe uma mensagem em privado para confirmar.`,
  ].join("\n");
}

/** 3. A segunda confirmação, em privado, a quem aceitou no grupo. */
export function mensagemSegundaConfirmacao(r: ResumoViagemAjuda, horaLimite: string, link: string): string {
  return [
    `✅ *Aceitou uma viagem no grupo — falta confirmar*`,
    ``,
    ...linhasViagem(r),
    ``,
    `Confirme até às ${horaLimite} (10 minutos):`,
    link,
    ``,
    `Se não confirmar a tempo, o pedido volta ao grupo.`,
  ].join("\n");
}
