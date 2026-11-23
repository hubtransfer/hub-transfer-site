"use client";

// Ecrã «Pedir ajuda» de uma viagem: resumo, as duas escolhas no topo
// («Pedir a um colega» / «Pedir ao grupo»), a lista dos colegas (só nome e
// categoria), o motivo obrigatório, a confirmação a deslizar e o estado do
// pedido (à espera, 15 min, reservada no grupo, aceite, recusado).
// Nunca mostra a operadora, a referência nem o cliente.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, X, Users, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, UserRound } from "lucide-react";
import { ajuda, type ViagemParaAjuda } from "@/lib/ajuda/cliente";
import type { ColegaPossivel, MotivoAjuda, MotoristaRef, PedidoAjuda } from "@/lib/ajuda/tipos";
import { estadoEfectivo, minutosAteExpirar, motivoValido } from "@/lib/ajuda/regras";
import {
  T, linhaColega, textoDeslizarColega, textoEspera, textoFaltam,
  textoSemResposta, textoAceite, textoRecusado, textoReservaQuemPediu,
} from "@/lib/ajuda/textos";
import DeslizarConfirmar from "./DeslizarConfirmar";
import { ResumoViagem, Iniciais, Caixa, EscolherMotivo } from "./partes";

export type Fase =
  | { t: "escolha" }
  | { t: "lista" }
  | { t: "confirmar"; colega: ColegaPossivel }
  | { t: "confirmarGrupo" };

export default function EcraPedirAjuda({
  viagem, eu, pedido, agora, onFechar, onViagemSaiu, onMudou, embutido = false, faseInicial, motivoInicial = null,
}: {
  viagem: ViagemParaAjuda;
  eu: MotoristaRef;
  /** o último pedido desta viagem (do useAjuda) */
  pedido: PedidoAjuda | null;
  agora: number;
  onFechar: () => void;
  /** a viagem passou para um colega: sai da lista de quem pediu */
  onViagemSaiu?: (viagemRef: string) => void;
  onMudou?: () => void;
  /** só na página de demonstração: dentro de uma moldura, em vez de ecrã inteiro */
  embutido?: boolean;
  faseInicial?: Fase;
  motivoInicial?: MotivoAjuda | null;
}) {
  const recusado = pedido?.estado === "recusado";
  const [fase, setFase] = useState<Fase>(faseInicial ?? (recusado ? { t: "lista" } : { t: "escolha" }));
  const [motivo, setMotivo] = useState<MotivoAjuda | null>(motivoInicial ?? pedido?.motivo ?? null);
  const [colegas, setColegas] = useState<ColegaPossivel[] | null>(null);
  const [erro, setErro] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  const estado = pedido ? estadoEfectivo(pedido, agora) : null;
  const emCurso = !!pedido && (estado === "a_espera" || estado === "reservada" || estado === "sem_resposta" || estado === "aceite");

  // Só recarrega quando muda a viagem ou quem pede (não a cada render do pai)
  const viagemAtual = useRef(viagem);
  const euRef = useRef(eu);
  useEffect(() => { viagemAtual.current = viagem; euRef.current = eu; });
  const carregar = useCallback(async () => {
    setErro(false); setColegas(null);
    try { setColegas((await ajuda.colegas(viagemAtual.current, euRef.current)).colegas); }
    catch { setErro(true); }
  }, [viagem.viagemRef, eu.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A lista volta a carregar sempre que se regressa a ela (ex.: depois de uma recusa)
  useEffect(() => { if (!emCurso && fase.t === "lista") void carregar(); }, [emCurso, fase.t, carregar]);

  // Recusa: volta à lista dos colegas, com o aviso
  useEffect(() => {
    if (pedido?.estado === "recusado" && pedido.para) { setAviso(textoRecusado(pedido.para.nome)); setFase({ t: "lista" }); }
  }, [pedido?.id, pedido?.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = useCallback(async (c: ColegaPossivel | null) => {
    if (!motivoValido(motivo)) { setAviso(T.motivoFalta); return; }
    setOcupado(true);
    try {
      if (c) await ajuda.pedirAColega({ viagemRef: viagem.viagemRef, de: eu.id, para: c.id, motivo }, viagem.resumo, eu.nome);
      else await ajuda.pedirAoGrupo({ viagemRef: viagem.viagemRef, de: eu.id, motivo }, viagem.resumo, eu.nome);
      setAviso(""); setFase({ t: "escolha" }); onMudou?.();
    } catch { setAviso(T.erroEnviar); }
    finally { setOcupado(false); }
  }, [viagem, eu, motivo, onMudou]);

  const cancelar = useCallback(async (depois: Fase, texto: string) => {
    if (!pedido) return;
    setOcupado(true);
    try {
      await ajuda.cancelar({ pedidoId: pedido.id, de: eu.id });
      setAviso(texto); setFase(depois); onMudou?.();
    } catch { /* fica como estava */ }
    finally { setOcupado(false); }
  }, [pedido, eu, onMudou]);

  const voltar =
    fase.t === "confirmar" ? () => setFase({ t: "lista" })
    : fase.t !== "escolha" ? () => setFase({ t: "escolha" })
    : onFechar;

  const avisoCaixa = aviso && (
    <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
      aviso === T.cancelado ? "bg-white/5 border border-white/10 text-[#BDBDBD]" : "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#FCA5A5]"
    }`}>
      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{aviso}</span>
    </div>
  );

  return (
    <div className={`${embutido ? "absolute" : "fixed"} inset-0 z-[70] bg-black text-white overflow-y-auto`} role="dialog" aria-modal="true" aria-label={T.titulo}>
      {/* Cabeçalho */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/5 px-2 py-2 flex items-center justify-between">
        <button type="button" onClick={voltar} aria-label={T.voltar}
          className="w-11 h-11 flex items-center justify-center text-white/70 active:text-[#F0D030]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="font-mono text-sm font-bold text-[#F0D030] tracking-wide">{T.titulo}</p>
        <button type="button" onClick={onFechar} aria-label={T.fechar}
          className="w-11 h-11 flex items-center justify-center text-white/50 active:text-white">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        <ResumoViagem r={viagem.resumo} />

        {emCurso && pedido ? (
          /* ── Pedido em curso ── */
          <EstadoDoPedido pedido={pedido} estado={estado!} agora={agora} ocupado={ocupado}
            onCancelar={() => cancelar({ t: "escolha" }, T.cancelado)}
            onPedirOutro={() => cancelar({ t: "lista" }, "")}
            onSair={() => { onViagemSaiu?.(viagem.viagemRef); onFechar(); }} />

        ) : fase.t === "escolha" ? (
          /* ── As duas escolhas, logo no topo ── */
          <div className="space-y-3">
            {avisoCaixa}
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] px-1">{T.escolhaTitulo}</p>
            <Escolha icone={<UserRound className="w-5 h-5" />} titulo={T.pedirColega} dica={T.pedirColegaDica}
              onClick={() => { setAviso(""); setFase({ t: "lista" }); }} />
            <Escolha icone={<Users className="w-5 h-5" />} titulo={T.pedirGrupo} dica={T.pedirGrupoDica}
              onClick={() => { setAviso(""); setFase({ t: "confirmarGrupo" }); }} />
          </div>

        ) : fase.t === "confirmar" || fase.t === "confirmarGrupo" ? (
          /* ── Motivo + deslizar ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#F0D030]/30 bg-[#1A1A00] px-4 py-3.5">
              {fase.t === "confirmar"
                ? <Iniciais nome={fase.colega.nome} />
                : <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F0D030]/10 text-[#F0D030] border border-[#F0D030]/30"><Users className="w-5 h-5" /></span>}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">{fase.t === "confirmar" ? fase.colega.nome : T.pedirGrupo}</p>
                <p className="font-mono text-xs text-[#BDBDBD]">{fase.t === "confirmar" ? linhaColega(fase.colega) : T.pedirGrupoDica}</p>
              </div>
            </div>
            <EscolherMotivo valor={motivo} onEscolher={(m) => { setMotivo(m); setAviso(""); }} />
            {aviso && aviso !== T.motivoFalta && avisoCaixa}
            <DeslizarConfirmar
              texto={fase.t === "confirmar" ? textoDeslizarColega(fase.colega.nome) : T.deslizarGrupo}
              ocupado={ocupado} desactivado={!motivo}
              onConfirmar={() => enviar(fase.t === "confirmar" ? fase.colega : null)} />
            <p className="font-mono text-[11px] text-[#888] text-center">
              {!motivo ? T.motivoFalta : fase.t === "confirmar" ? textoEspera(fase.colega.nome).frase : T.grupoEsperaDica}
            </p>
            <button type="button" onClick={voltar} className="w-full h-12 font-mono text-sm text-white/50 underline underline-offset-2">
              {T.voltar}
            </button>
          </div>

        ) : (
          /* ── Lista dos colegas: só o nome e a categoria ── */
          <div className="space-y-3">
            {avisoCaixa}
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] px-1">{T.subtitulo}</p>

            {colegas === null && !erro && (
              <div className="flex items-center justify-center gap-2 py-10 text-white/50 font-mono text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> {T.aCarregar}
              </div>
            )}
            {erro && (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-white/60 font-mono">{T.erro}</p>
                <button type="button" onClick={carregar}
                  className="px-5 py-2.5 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-sm font-bold font-mono">{T.tentar}</button>
              </div>
            )}
            {colegas && colegas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#333] px-4 py-6 text-center space-y-1">
                <p className="text-sm text-white font-semibold">{T.nenhum}</p>
                <p className="text-xs text-[#999] leading-snug">{T.nenhumDica}</p>
              </div>
            )}
            {colegas && colegas.map((c) => (
              <button key={c.id} type="button" onClick={() => { setAviso(""); setFase({ t: "confirmar", colega: c }); }}
                className="w-full flex items-center gap-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3.5 text-left active:bg-[#F0D030]/10 hover:border-[#F0D030]/40 transition-colors">
                <Iniciais nome={c.nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white truncate">{c.nome}</p>
                  <p className="font-mono text-xs text-[#BDBDBD]">{linhaColega(c)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#666]" />
              </button>
            ))}

            {(colegas !== null || erro) && (
              <button type="button" onClick={() => { setAviso(""); setFase({ t: "confirmarGrupo" }); }}
                className={`w-full h-14 rounded-xl font-mono text-base font-bold flex items-center justify-center gap-2.5 transition-colors ${
                  colegas && colegas.length > 0
                    ? "bg-transparent border border-[#F0D030]/40 text-[#F0D030] active:bg-[#F0D030]/10"
                    : "bg-[#F0D030] text-black active:bg-[#D4B820]"
                }`}>
                <Users className="w-5 h-5" /> {T.pedirGrupo}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Escolha({ icone, titulo, dica, onClick }: { icone: React.ReactNode; titulo: string; dica: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-[#1A1A1A] border border-[#F0D030]/30 px-4 py-4 text-left active:bg-[#F0D030]/10 hover:border-[#F0D030]/60 transition-colors">
      <span className="w-11 h-11 rounded-full flex items-center justify-center bg-[#F0D030]/10 text-[#F0D030] border border-[#F0D030]/30 flex-shrink-0">{icone}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-base font-bold text-white">{titulo}</span>
        <span className="block text-xs text-[#BDBDBD] leading-snug">{dica}</span>
      </span>
      <ChevronRight className="w-5 h-5 text-[#F0D030]/70" />
    </button>
  );
}

/** O pedido depois de enviado: à espera, 15 min sem resposta, reservada (grupo), aceite. */
export function EstadoDoPedido({
  pedido, estado, agora, ocupado, onCancelar, onPedirOutro, onSair,
}: {
  pedido: PedidoAjuda;
  estado: ReturnType<typeof estadoEfectivo>;
  agora: number;
  ocupado: boolean;
  onCancelar: () => void;
  onPedirOutro: () => void;
  onSair: () => void;
}) {
  if (estado === "aceite" && pedido.ficouCom) {
    const a = textoAceite(pedido.ficouCom.nome);
    return (
      <div className="space-y-4">
        <Caixa cor="#22C55E" icone={<CheckCircle className="w-9 h-9" />} titulo={a.titulo} frase={a.frase} />
        <button type="button" onClick={onSair}
          className="w-full h-14 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] font-mono text-base font-bold">
          {T.voltarViagens}
        </button>
      </div>
    );
  }

  if (estado === "sem_resposta" && pedido.para) {
    const s = textoSemResposta(pedido.para.nome);
    return (
      <div className="space-y-4">
        <Caixa cor="#F59E0B" icone={<AlertTriangle className="w-9 h-9" />} titulo={s.titulo} frase={s.frase} />
        <button type="button" disabled={ocupado} onClick={onPedirOutro}
          className="w-full h-14 rounded-xl bg-[#F0D030] text-black font-mono text-base font-bold disabled:opacity-60">
          {T.pedirOutro}
        </button>
        <button type="button" disabled={ocupado} onClick={onCancelar}
          className="w-full h-12 rounded-xl border border-white/10 text-white/60 font-mono text-sm">
          {ocupado ? T.aCancelar : T.cancelar}
        </button>
      </div>
    );
  }

  // À espera (colega ou grupo) ou reservada (grupo: um colega aceitou e está a confirmar)
  const grupo = pedido.tipo === "grupo";
  const reservada = estado === "reservada";
  const e = reservada
    ? { titulo: T.grupoReservada, frase: T.grupoReservadaDica }
    : grupo ? { titulo: T.grupoEspera, frase: T.grupoEsperaDica } : textoEspera(pedido.para?.nome ?? "");
  const faltam = minutosAteExpirar(reservada ? pedido.reservaExpiraEm : pedido.expiraEm, agora);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F0D030]/40 bg-[#1A1A00] px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          {grupo
            ? <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F0D030]/10 text-[#F0D030] border border-[#F0D030]/30"><Users className="w-5 h-5" /></span>
            : <Iniciais nome={pedido.para?.nome ?? ""} />}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#F0D030] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F0D030] animate-pulse flex-shrink-0" />
              <span className="truncate">{e.titulo}</span>
            </p>
            <p className="text-sm text-[#BDBDBD] leading-snug">{e.frase}</p>
          </div>
        </div>
        {(!grupo || reservada) && (
          <p className="font-mono text-[11px] text-[#888] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {reservada ? textoReservaQuemPediu(faltam) : textoFaltam(faltam)}
          </p>
        )}
      </div>
      <button type="button" disabled={ocupado} onClick={onCancelar}
        className="w-full h-12 rounded-xl bg-transparent border border-[#EF4444]/30 text-[#EF4444] font-mono text-sm font-bold active:bg-[#EF4444]/15 disabled:opacity-60">
        {ocupado ? T.aCancelar : T.cancelar}
      </button>
    </div>
  );
}
