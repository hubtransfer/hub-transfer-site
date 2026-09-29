"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DESFECHO_CORES, type Desfecho } from "@/lib/trips";
import { comCracha } from "@/lib/cracha";

/* ================================================================== */
/*  Uma viagem que não se faz não se apaga: fica CANCELADA (avisando   */
/*  ou não o cliente) ou NO-SHOW. Um só caminho — POST à rota          */
/*  /api/transfers/cancelar, que chama o cancelarTransferSite do GAS.  */
/* ================================================================== */

/** Selo do desfecho, nas cores da folha (cancelada riscada). */
export function SeloDesfecho({ desfecho, className = "" }: { desfecho: Desfecho; className?: string }) {
  const c = DESFECHO_CORES[desfecho];
  return (
    <span
      className={`inline-block font-mono font-bold rounded px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap ${c.riscado ? "line-through" : ""} ${className}`}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}

export type OpcaoCancelar = "cancelar_avisar" | "cancelar_silencio" | "noshow";

const OPCOES: { key: OpcaoCancelar; titulo: string; nota: string; desfecho: Desfecho }[] = [
  { key: "cancelar_avisar",   titulo: "Cancelar e avisar o cliente", nota: "o cliente recebe a mensagem de cancelamento", desfecho: "cancelada" },
  { key: "cancelar_silencio", titulo: "Cancelar sem avisar",         nota: "o cliente não recebe nada",                    desfecho: "cancelada" },
  { key: "noshow",            titulo: "No-show",                     nota: "o cliente não recebe mensagem",                desfecho: "noshow" },
];

export interface AlvoCancelar {
  id: string;
  cliente: string;
  data: string;
  hora: string;
}

export interface ResultadoCancelar {
  ok: boolean;
  mensagem: string;
  desfecho?: string;
  clienteNotificado?: boolean;
  jaEstava?: boolean;
  naoConfirmado?: boolean;
}

interface Props {
  alvo: AlvoCancelar | null;
  /** Opção já escolhida ao abrir (ex.: «No-show» vindo do botão de no-show). */
  inicial?: OpcaoCancelar;
  onClose: () => void;
  /** Chamado depois de o backend responder ok (ou sem confirmação) — refrescar a lista. */
  onFeito?: (r: ResultadoCancelar, opcao: OpcaoCancelar) => void;
}

export default function CancelarViagemModal({ alvo, inicial, onClose, onFeito }: Props) {
  const [opcao, setOpcao] = useState<OpcaoCancelar | null>(inicial ?? null);
  const [passo, setPasso] = useState<1 | 2 | 3>(inicial ? 2 : 1);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCancelar | null>(null);

  // Cada abertura começa limpa
  useEffect(() => {
    setOpcao(inicial ?? null);
    setPasso(inicial ? 2 : 1);
    setSenha("");
    setErro("");
    setLoading(false);
    setResultado(null);
  }, [alvo, inicial]);

  if (!alvo || typeof document === "undefined") return null;

  const idProvisorio = !alvo.id || alvo.id.startsWith("tmp-");
  const escolhida = OPCOES.find((o) => o.key === opcao) || null;

  const confirmar = async () => {
    if (!escolhida || !senha || loading) return;
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/transfers/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comCracha({
          id: alvo.id,
          senha,
          desfecho: escolhida.desfecho === "cancelada" ? "cancelado" : "noshow",
          notificar: escolhida.key === "cancelar_avisar",
        })),
      });
      const data = (await res.json().catch(() => null)) as ResultadoCancelar | null;
      if (!data) {
        setErro("Resposta inválida do servidor");
      } else if (data.ok || data.naoConfirmado) {
        setResultado(data);
        setPasso(3);
        onFeito?.(data, escolhida.key);
      } else if (/senha incorrecta/i.test(String(data.mensagem || ""))) {
        setErro("Senha incorrecta");
      } else {
        setErro(String(data.mensagem || "Erro ao cancelar"));
      }
    } catch {
      setErro("Erro de conexão");
    }
    setLoading(false);
  };

  const fechar = () => { if (!loading) onClose(); };
  const jaEstavaTxt = resultado?.jaEstava
    ? (escolhida?.desfecho === "noshow" ? "Já estava como no-show." : "Já estava cancelada.")
    : "";

  return createPortal(
    <div className="fixed inset-0 z-[99996] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={fechar} onPointerDown={(e) => e.stopPropagation()}>
      <div className="w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-4 font-mono"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-white">🚫 Cancelar / No-show</h3>
          <button type="button" onClick={fechar} aria-label="Fechar" className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="bg-black/40 border border-[#2A2A2A] rounded-lg px-3 py-2.5 space-y-0.5">
          <p className="text-sm text-white font-semibold truncate">{alvo.cliente || "—"}</p>
          <p className="text-xs text-zinc-400">{alvo.data || "—"} · {alvo.hora || "—"} · {alvo.id || "—"}</p>
        </div>

        {idProvisorio ? (
          <p className="text-xs text-amber-400">Esta viagem ainda não tem ID definitivo da folha — sincronize primeiro.</p>
        ) : passo === 1 ? (
          <div className="space-y-2">
            {OPCOES.map((o) => {
              const c = DESFECHO_CORES[o.desfecho];
              return (
                <button key={o.key} type="button" onClick={() => { setOpcao(o.key); setPasso(2); setErro(""); }}
                  className="w-full text-left rounded-lg border px-3 py-2.5 transition-colors hover:brightness-110"
                  style={{ backgroundColor: `${c.bg}1A`, borderColor: `${c.bg}66` }}>
                  <span className="block text-sm font-bold" style={{ color: c.bg }}>{o.titulo}</span>
                  <span className="block text-[11px] text-zinc-400">{o.nota}</span>
                </button>
              );
            })}
          </div>
        ) : passo === 2 && escolhida ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              Confirmar: <span className="font-bold" style={{ color: DESFECHO_CORES[escolhida.desfecho].bg }}>{escolhida.titulo}</span>
              <span className="block text-[11px] text-zinc-500">{escolhida.nota}</span>
            </p>
            <input type="password" value={senha} autoFocus placeholder="Senha admin"
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmar(); }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F0D030] focus:outline-none" />
            {erro && <p className="text-xs text-[#EF4444]">{erro}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={loading} onClick={() => { setPasso(1); setErro(""); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">← Voltar</button>
              <button type="button" disabled={loading || !senha} onClick={confirmar}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: DESFECHO_CORES[escolhida.desfecho].bg, color: DESFECHO_CORES[escolhida.desfecho].fg }}>
                {loading ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        ) : resultado ? (
          <div className="space-y-3">
            <p className={`text-sm ${resultado.ok ? "text-white" : "text-amber-400"}`}>{resultado.mensagem}</p>
            {jaEstavaTxt && <p className="text-xs text-zinc-400">{jaEstavaTxt}</p>}
            <button type="button" onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-lg text-sm transition-colors">Fechar</button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
