"use client";

// Os pedidos de ajuda que este motorista recebeu — no topo das viagens dele.
// Antes de aceitar NÃO vê o nome nem o telefone do cliente (o PedidoRecebido nem os tem).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Users, HandHelping, Info } from "lucide-react";
import { ajuda } from "@/lib/ajuda/cliente";
import type { MotoristaRef, PedidoRecebido } from "@/lib/ajuda/tipos";
import { pedidosPorResponder } from "@/lib/ajuda/regras";
import { T, textoQuemPede, textoConfirmarFicar, textoFicou } from "@/lib/ajuda/textos";
import DeslizarConfirmar from "./DeslizarConfirmar";
import { ResumoViagem, Caixa } from "./partes";

type Desfecho = "feito" | "ja_ficou" | "cancelado" | "expirou";

function haQuanto(iso: string, agora: number): string {
  const min = Math.max(0, Math.floor((agora - Date.parse(iso)) / 60000));
  return min < 1 ? "agora" : min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
}

export default function PedidosRecebidos({
  recebidos, eu, agora, onMudou,
}: {
  recebidos: PedidoRecebido[];
  eu: MotoristaRef;
  agora: number;
  onMudou?: () => void;
}) {
  const [desfechos, setDesfechos] = useState<Record<string, Desfecho>>({});
  const [dispensados, setDispensados] = useState<Set<string>>(new Set());
  const vistos = useRef<Set<string>>(new Set());

  const porResponder = pedidosPorResponder(recebidos, agora);
  useEffect(() => { porResponder.forEach((p) => vistos.current.add(p.id)); });

  // Mostra: os que pedem resposta + os que já se viram e mudaram (outro ficou, cancelado)
  const visiveis = recebidos.filter((p) => {
    if (dispensados.has(p.id)) return false;
    if (desfechos[p.id]) return true;
    if (porResponder.some((q) => q.id === p.id)) return true;
    return vistos.current.has(p.id) && !!p.ficouCom && p.ficouCom.id !== eu.id;
  });

  const dispensar = useCallback((id: string) => {
    setDispensados((s) => new Set(s).add(id));
  }, []);

  if (visiveis.length === 0) return null;

  return (
    <div className="space-y-2">
      {visiveis.map((p) => (
        <CartaoRecebido key={p.id} p={p} eu={eu} agora={agora}
          desfecho={desfechos[p.id] ?? (p.ficouCom && p.ficouCom.id !== eu.id ? "ja_ficou" : undefined)}
          onDesfecho={(d) => { setDesfechos((x) => ({ ...x, [p.id]: d })); onMudou?.(); }}
          onDispensar={() => dispensar(p.id)}
          onNaoPosso={() => { dispensar(p.id); onMudou?.(); }} />
      ))}
    </div>
  );
}

export function CartaoRecebido({
  p, eu, agora, desfecho, onDesfecho, onDispensar, onNaoPosso, faseInicial = "pedido",
}: {
  p: PedidoRecebido;
  eu: MotoristaRef;
  agora: number;
  desfecho?: Desfecho;
  onDesfecho: (d: Desfecho) => void;
  onDispensar: () => void;
  onNaoPosso: () => void;
  /** só para a página de demonstração */
  faseInicial?: "pedido" | "confirmar";
}) {
  const [fase, setFase] = useState<"pedido" | "confirmar">(faseInicial);
  const [ocupado, setOcupado] = useState(false);
  const grupo = p.tipo === "grupo";

  const responder = useCallback(async (resposta: "sim" | "nao") => {
    setOcupado(true);
    try {
      const r = await ajuda.responder({ pedidoId: p.id, motorista: eu.id, resposta });
      if (resposta === "nao") { onNaoPosso(); return; }
      onDesfecho(r.ok ? "feito" : (r.motivo ?? "ja_ficou"));
    } catch { /* fica como estava; tenta outra vez */ }
    finally { setOcupado(false); }
  }, [p.id, eu.id, onDesfecho, onNaoPosso]);

  const moldura = "rounded-2xl border border-l-4 px-4 py-3.5 space-y-3";

  if (desfecho === "feito") {
    const f = textoFicou();
    return (
      <div className="space-y-2">
        <Caixa cor="#22C55E" icone={<CheckCircle className="w-8 h-8" />} titulo={f.titulo} frase={f.frase}>
          <button type="button" onClick={onDispensar} className="mt-1 font-mono text-xs text-white/50 underline underline-offset-2">OK</button>
        </Caixa>
      </div>
    );
  }
  if (desfecho) {
    const t = desfecho === "cancelado" ? T.recebidoCancelado : desfecho === "expirou" ? T.recebidoExpirou : T.jaFicou;
    return (
      <div className={`${moldura} bg-[#151515] border-[#2A2A2A]`} style={{ borderLeftColor: "#555" }}>
        <p className="text-sm text-[#BDBDBD] flex items-center gap-2"><Info className="w-4 h-4 flex-shrink-0" /> {t}</p>
        <ResumoViagem r={p.viagem} compacto />
        <button type="button" onClick={onDispensar} className="w-full h-10 font-mono text-xs text-white/50 underline underline-offset-2">OK</button>
      </div>
    );
  }

  return (
    <div className={`${moldura} bg-[#1A1A00] border-[#F0D030]/30 ring-1 ring-[#F0D030]/20`} style={{ borderLeftColor: "#F0D030" }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] flex items-center gap-1.5">
          {grupo ? <Users className="w-3.5 h-3.5" /> : <HandHelping className="w-3.5 h-3.5" />}
          {grupo ? T.recebidoGrupoTitulo : T.recebidoTitulo}
        </span>
        <span className="font-mono text-[10px] text-[#888]">{haQuanto(p.criadoEm, agora)}</span>
      </div>
      <p className="text-base font-bold text-white leading-snug">{textoQuemPede(p)}</p>
      <ResumoViagem r={p.viagem} compacto />

      {fase === "pedido" ? (
        <>
          <p className="font-mono text-[11px] text-[#888]">{T.semCliente}</p>
          {grupo ? (
            <button type="button" disabled={ocupado} onClick={() => setFase("confirmar")}
              className="w-full h-14 rounded-xl bg-[#F0D030] text-black font-mono text-base font-bold active:bg-[#D4B820] disabled:opacity-60">
              {T.ficoEu}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" disabled={ocupado} onClick={() => responder("nao")}
                className="h-14 rounded-xl bg-transparent border border-white/15 text-white/80 font-mono text-base font-bold active:bg-white/10 disabled:opacity-60">
                {T.naoPosso}
              </button>
              <button type="button" disabled={ocupado} onClick={() => setFase("confirmar")}
                className="h-14 rounded-xl bg-[#F0D030] text-black font-mono text-base font-bold active:bg-[#D4B820] disabled:opacity-60">
                {T.simFaco}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 pt-1">
          <div>
            <p className="text-sm font-bold text-white">{T.confirmarTitulo}</p>
            <p className="text-sm text-[#BDBDBD] leading-snug">{textoConfirmarFicar(p.de.nome)}</p>
          </div>
          <DeslizarConfirmar texto={T.deslizarFicar} cor="#22C55E" ocupado={ocupado} onConfirmar={() => responder("sim")} />
          <button type="button" disabled={ocupado} onClick={() => setFase("pedido")}
            className="w-full h-10 font-mono text-xs text-white/50 underline underline-offset-2">
            {T.voltar}
          </button>
        </div>
      )}
    </div>
  );
}
