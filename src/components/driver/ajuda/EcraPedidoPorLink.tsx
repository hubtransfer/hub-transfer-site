"use client";

// A app aberta pelo link de um pedido (vindo do WhatsApp):
//   <site>/driver/trips?ajuda=<PedidoId>                  → o pedido («Aceitar» no grupo,
//                                                            «Sim, faço»/«Não posso» do colega)
//   <site>/driver/trips?ajuda=<PedidoId>&passo=confirmar  → a segunda confirmação do grupo
// Quem abre é o motorista da sessão: é por ela que o HUB-Central sabe quem aceitou.
// O link só leva o id opaco do pedido (ver linkDoPedido em src/lib/ajuda/regras.ts).

import React, { useCallback, useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, Loader2, Clock, Users } from "lucide-react";
import { ajuda } from "@/lib/ajuda/cliente";
import type { MotoristaRef, PedidoRecebido } from "@/lib/ajuda/tipos";
import { estadoEfectivo, horaDoPrazo, minutosAteExpirar, type PassoLink } from "@/lib/ajuda/regras";
import { T, textoFicou, textoPrazoReserva } from "@/lib/ajuda/textos";
import DeslizarConfirmar from "./DeslizarConfirmar";
import { ResumoViagem, Caixa } from "./partes";
import { CartaoRecebido, desfechoDoPedido, type Desfecho } from "./PedidosRecebidos";

export default function EcraPedidoPorLink({
  pedidoId, passo, eu, agora, onFechar, onMudou, embutido = false, inicial,
}: {
  pedidoId: string;
  passo: PassoLink;
  eu: MotoristaRef;
  agora: number;
  onFechar: () => void;
  onMudou?: () => void;
  /** só na página de demonstração */
  embutido?: boolean;
  /** só na página de demonstração: o pedido já carregado (null = não existe) */
  inicial?: PedidoRecebido | null;
}) {
  const [p, setP] = useState<PedidoRecebido | null | undefined>(inicial);
  const [desfecho, setDesfecho] = useState<Desfecho | undefined>();

  const carregar = useCallback(async () => {
    try { setP(await ajuda.recebido(pedidoId, eu.id)); } catch { setP(null); }
  }, [pedidoId, eu.id]);
  useEffect(() => { if (inicial === undefined) void carregar(); }, [carregar, inicial]);

  const titulo = passo === "confirmar" ? T.segundaTitulo : T.recebidoTitulo;

  let corpo: React.ReactNode;
  if (p === undefined) {
    corpo = (
      <div className="flex items-center justify-center gap-2 py-16 text-white/50 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> {T.linkACarregar}
      </div>
    );
  } else if (p === null) {
    corpo = <Caixa cor="#888888" icone={<Info className="w-8 h-8" />} titulo={T.linkNaoExiste} />;
  } else if (p.de.id === eu.id) {
    corpo = <Caixa cor="#888888" icone={<Info className="w-8 h-8" />} titulo={T.linkProprio} />;
  } else if (passo === "confirmar") {
    corpo = <SegundaConfirmacao p={p} eu={eu} agora={agora} onMudou={() => { onMudou?.(); void carregar(); }} onFechar={onFechar} />;
  } else {
    corpo = (
      <CartaoRecebido p={p} eu={eu} agora={agora}
        desfecho={desfecho ?? desfechoDoPedido(p, eu, agora)}
        onDesfecho={(d) => { setDesfecho(d); onMudou?.(); }}
        onDispensar={onFechar}
        onNaoPosso={() => { onMudou?.(); onFechar(); }}
        onReservou={() => { onMudou?.(); void carregar(); }} />
    );
  }

  return (
    <div className={`${embutido ? "absolute" : "fixed"} inset-0 z-[75] bg-black text-white overflow-y-auto`} role="dialog" aria-modal="true" aria-label={titulo}>
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/5 px-2 py-2 flex items-center justify-between">
        <span className="w-11" />
        <p className="font-mono text-sm font-bold text-[#F0D030] tracking-wide">{titulo}</p>
        <button type="button" onClick={onFechar} aria-label={T.fechar}
          className="w-11 h-11 flex items-center justify-center text-white/50 active:text-white">
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">{corpo}</div>
    </div>
  );
}

/** A segunda confirmação (grupo): «Confirmo que faço esta viagem», com o prazo dos 10 min. */
export function SegundaConfirmacao({
  p, eu, agora, onMudou, onFechar,
}: {
  p: PedidoRecebido;
  eu: MotoristaRef;
  agora: number;
  onMudou?: () => void;
  onFechar: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<"feito" | "prazo" | "ja_ficou" | "cancelado" | null>(null);

  const confirmar = useCallback(async () => {
    setOcupado(true);
    try {
      const r = await ajuda.confirmar({ pedidoId: p.id, motorista: eu.id });
      setResultado(r.ok ? "feito" : r.motivo === "ja_ficou" ? "ja_ficou" : r.motivo === "cancelado" ? "cancelado" : "prazo");
      onMudou?.();
    } catch { /* fica como estava; tenta outra vez */ }
    finally { setOcupado(false); }
  }, [p.id, eu.id, onMudou]);

  // O que o pedido já diz, antes de deslizar
  const estado = estadoEfectivo(p, agora);
  const ja: typeof resultado =
    resultado ?? (p.ficouCom ? (p.ficouCom.id === eu.id ? "feito" : "ja_ficou")
      : p.estado === "cancelado" ? "cancelado"
      : !(p.reservadaParaMim && estado === "reservada") ? "prazo"
      : null);

  const voltar = (
    <button type="button" onClick={onFechar}
      className="w-full h-12 rounded-xl border border-white/10 text-white/70 font-mono text-sm font-bold">
      {T.voltarViagens}
    </button>
  );

  if (ja === "feito") {
    const f = textoFicou();
    return (<div className="space-y-4"><ResumoViagem r={p.viagem} /><Caixa cor="#22C55E" icone={<CheckCircle className="w-9 h-9" />} titulo={f.titulo} frase={f.frase} />{voltar}</div>);
  }
  if (ja === "prazo") {
    return (
      <div className="space-y-4">
        <ResumoViagem r={p.viagem} />
        <Caixa cor="#F59E0B" icone={<AlertTriangle className="w-9 h-9" />} titulo={T.prazoAcabou} frase={T.prazoAcabouDica} />
        {voltar}
      </div>
    );
  }
  if (ja === "ja_ficou" || ja === "cancelado") {
    return (
      <div className="space-y-4">
        <ResumoViagem r={p.viagem} />
        <Caixa cor="#888888" icone={<Info className="w-8 h-8" />} titulo={ja === "cancelado" ? T.recebidoCancelado : T.jaFicou} />
        {voltar}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#22C55E] flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> {T.recebidoGrupoTitulo}
      </p>
      <ResumoViagem r={p.viagem} />
      <p className="text-sm text-white leading-snug">{T.segundaFrase}</p>
      <p className="font-mono text-xs text-[#F0D030] flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> {textoPrazoReserva(horaDoPrazo(p.reservaExpiraEm), minutosAteExpirar(p.reservaExpiraEm, agora))}
      </p>
      <DeslizarConfirmar texto={T.deslizarSegunda} cor="#22C55E" ocupado={ocupado} onConfirmar={confirmar} />
      <p className="font-mono text-[11px] text-[#888] text-center">{T.semCliente}</p>
    </div>
  );
}
