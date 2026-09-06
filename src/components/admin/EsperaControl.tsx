"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { HubViagem } from "@/lib/trips";
import { HUB_CENTRAL_URL, cleanHora } from "@/lib/trips";
import {
  parseEspera,
  esperaChipTexto,
  esperaMinutos,
  nomeOperadora,
  type EsperaCor,
  type EsperaEvento,
} from "@/lib/espera";

/* ================================================================== */
/*  Controlo de espera — SÓ ADMIN.                                     */
/*  Chip pequeno no cartão (só existe com esperaEstado preenchido);    */
/*  clicar abre o painel. Tudo o que se mostra vem do texto do backend.*/
/* ================================================================== */

const GUIAO =
  "Aos 60 min podíamos cancelar e cobrar na mesma; esperámos mais 30 por nossa conta. " +
  "Pergunte quanto tempo falta e ofereça manter o motorista por €15/hora iniciada — evita o táxi a preço absurdo. " +
  "Aceitou → “Espera paga: SIM”; o sistema gera e envia o link. Não atende/recusa → “No-show”.";

const CHIP_COR: Record<EsperaCor, string> = {
  verde:    "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40",
  vermelho: "bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/50 animate-pulse",
  laranja:  "bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/50",
  cinza:    "bg-zinc-700/40 text-zinc-400 border-zinc-600/50",
  neutro:   "bg-zinc-800/60 text-zinc-300 border-zinc-600/50",
};

type Acao = "esperaContacto" | "esperaPaga";
type Busy = `${Acao}:${"SIM" | "NAO"}` | null;

interface EsperaControlProps {
  viagem: HubViagem;
  onRefresh?: () => void;
  /** "card" = chip no cabeçalho do cartão; "row" = linha compacta (Passadas). */
  variant?: "card" | "row";
}

export default function EsperaControl({ viagem, onRefresh, variant = "card" }: EsperaControlProps) {
  const texto = String((viagem as unknown as Record<string, unknown>)["esperaEstado"] ?? "").trim();
  const info = useMemo(() => parseEspera(texto), [texto]);

  // Contador de minutos: re-render a cada 30s enquanto o chip existir
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!texto || info.terminado) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [texto, info.terminado]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [guiaoOpen, setGuiaoOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  const chamar = useCallback(async (action: Acao, valor: "SIM" | "NAO") => {
    if (busy) return; // um toque = uma chamada
    const rowIndex = String(viagem.rowIndex ?? "").trim();
    if (!rowIndex) { setErro("Viagem sem rowIndex — impossível registar."); return; }
    setErro("");
    setBusy(`${action}:${valor}`);
    try {
      const url = `${HUB_CENTRAL_URL}?action=${action}&rowIndex=${encodeURIComponent(rowIndex)}&valor=${valor}&t=${Date.now()}`;
      const res = await fetch(url, { redirect: "follow" });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.success === false)) {
        setErro(String(data?.message || data?.error || `Erro ${res.status}`));
      } else {
        setAviso(action === "esperaContacto" ? "✅ Contacto registado" : valor === "SIM" ? "💶 Espera paga registada" : "🚫 Recusa registada");
        onRefresh?.();
      }
    } catch {
      setErro("Erro de conexão");
    }
    setBusy(null);
  }, [busy, viagem.rowIndex, onRefresh]);

  const copiarLink = useCallback(() => {
    if (!info.link) return;
    navigator.clipboard.writeText(info.link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }).catch(() => {});
  }, [info.link]);

  if (!texto) return null; // sem estado → nem chip nem painel

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const chipTexto = esperaChipTexto(info);
  const minutos = esperaMinutos(info);
  const telefone = String(viagem.phone || "").replace(/\D/g, "");
  const mostraContactado = !info.terminado && !(info.ultimaResposta?.sim);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        onPointerDown={stop}
        title="Controlo de espera — abrir painel"
        className={`inline-flex items-center font-mono font-bold whitespace-nowrap rounded border px-1.5 cursor-pointer transition-colors ${
          variant === "row" ? "text-[10px] py-0.5" : "text-[9px] py-0.5"
        } ${CHIP_COR[info.cor]}`}
      >
        {chipTexto}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99997] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setOpen(false); }}
          onPointerDown={stop} onPointerMove={stop} onPointerUp={stop} onPointerCancel={stop}
        >
          <div
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-2xl sm:rounded-xl p-5 space-y-4 font-mono"
            onClick={stop}
          >
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">⏳ Espera</h3>
                <p className="text-xs text-zinc-400 truncate">
                  {viagem.client}{viagem.pickupTime ? ` · ${cleanHora(viagem.pickupTime)}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"
                className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
            </div>

            <div className="bg-black/40 border border-[#2A2A2A] rounded-lg px-3 py-2.5 space-y-1 text-xs">
              <p className="text-white">
                ⏳ em espera desde <span className="font-bold">{info.desde || "—"}</span>
                {info.incluidaAte && <> · incluída até <span className="font-bold">{info.incluidaAte}</span></>}
                {minutos !== null && (
                  <span className="text-zinc-400"> · {minutos} min{info.terminado ? " (fechada)" : ""}</span>
                )}
              </p>
              <p className="text-zinc-300">
                ❓ perguntado ×{info.perguntas}
                {info.ultimaPergunta && <span className="text-zinc-500"> (última {info.ultimaPergunta})</span>}
              </p>
            </div>

            {/* Linha do tempo */}
            {info.eventos.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Linha do tempo</p>
                <div className="flex flex-wrap gap-1.5">
                  {info.eventos.map((ev, i) => <EventoPill key={i} ev={ev} />)}
                </div>
              </div>
            )}

            {/* Link de pagamento */}
            {info.link && (
              <div className="flex items-center justify-between gap-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-lg px-3 py-2">
                <span className="text-xs text-[#D4A017] font-bold truncate">🔗 Link enviado</span>
                <button type="button" onClick={copiarLink}
                  className="text-[11px] bg-[#D4A017]/20 text-[#D4A017] px-2.5 py-1 rounded hover:bg-[#D4A017]/30 transition-colors flex-shrink-0">
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
            )}
            {!info.link && info.semLink && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                ⚠️ sem provedor de pagamento — enviar MB WAY/transferência à mão
              </p>
            )}

            {/* Telefone do cliente */}
            {telefone ? (
              <a href={`tel:+${telefone}`}
                className="w-full h-12 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-[#E5E5E5] hover:border-[#D4A017]/40 active:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2">
                📞 Ligar ao cliente · +{telefone}
              </a>
            ) : (
              <p className="text-xs text-zinc-500 text-center">Cliente sem número de telefone</p>
            )}

            {/* Cliente contactado — enquanto a última resposta não for SIM */}
            {mostraContactado && (
              <button type="button" disabled={!!busy}
                onClick={() => chamar("esperaContacto", "SIM")}
                className="w-full h-12 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-sm font-bold hover:bg-[#22C55E]/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {busy === "esperaContacto:SIM"
                  ? <><span className="w-4 h-4 border-2 border-[#22C55E]/30 border-t-[#22C55E] rounded-full animate-spin" />A registar…</>
                  : "✅ Cliente contactado"}
              </button>
            )}

            {/* Espera paga — só aos 75'/90' e sem decisão ainda */}
            {info.podeDecidirPaga && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Espera paga</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={!!busy}
                    onClick={() => chamar("esperaPaga", "SIM")}
                    className="h-12 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/50 text-[#D4A017] text-sm font-bold hover:bg-[#D4A017]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {busy === "esperaPaga:SIM"
                      ? <span className="w-4 h-4 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
                      : "💶 SIM"}
                  </button>
                  <button type="button" disabled={!!busy}
                    onClick={() => chamar("esperaPaga", "NAO")}
                    className="h-12 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-300 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {busy === "esperaPaga:NAO"
                      ? <span className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                      : "NÃO"}
                  </button>
                </div>
              </div>
            )}

            {erro && <p className="text-xs text-[#EF4444]">{erro}</p>}
            {aviso && <p className="text-xs text-[#22C55E]">{aviso}</p>}

            {/* Guião da chamada — colapsado por defeito */}
            <div className="border border-[#2A2A2A] rounded-lg">
              <button type="button" onClick={() => setGuiaoOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-300 hover:text-white transition-colors">
                <span>📄 Guião da chamada</span>
                <span className="text-zinc-500">{guiaoOpen ? "▲" : "▼"}</span>
              </button>
              {guiaoOpen && (
                <p className="px-3 pb-3 text-xs text-zinc-400 leading-relaxed font-sans">{GUIAO}</p>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ─── Pílulas da linha do tempo ─── */

const PILL_BASE = "inline-flex items-center text-[11px] font-mono font-semibold px-2 py-1 rounded-full border whitespace-nowrap";
const PILL_SIM  = `${PILL_BASE} bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40`;
const PILL_NAO  = `${PILL_BASE} bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40`;
const PILL_SYS  = `${PILL_BASE} bg-zinc-800/70 text-zinc-400 border-zinc-600/50`;
const PILL_PAGA = `${PILL_BASE} bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/40`;

function EventoPill({ ev }: { ev: EsperaEvento }) {
  switch (ev.kind) {
    case "resposta":
      return ev.sim
        ? <span className={PILL_SIM}>✅ SIM {ev.hora}</span>
        : <span className={PILL_NAO}>❌ NÃO {ev.hora}</span>;
    case "regra":     return <span className={PILL_SYS}>📋 regra {nomeOperadora(ev.operadora)} {ev.hora}</span>;
    case "equipa":    return <span className={PILL_SYS}>🚨 equipa avisada {ev.hora}</span>;
    case "mudo":      return <span className={PILL_SYS}>🔇 motorista sem resposta {ev.hora}</span>;
    case "ligar":     return <span className={PILL_SYS}>📞 ligar 75&apos; {ev.hora}</span>;
    case "limite":    return <span className={PILL_SYS}>⏰ limite 90&apos; {ev.hora}</span>;
    case "paga":      return <span className={PILL_PAGA}>💶 espera paga {ev.hora}</span>;
    case "recusou":   return <span className={PILL_SYS}>🚫 recusou {ev.hora}</span>;
    case "libertado": return <span className={PILL_SYS}>🏳️ libertado (no-show) {ev.hora}</span>;
    case "fim":
      return (
        <span className={PILL_SYS}>
          🏁 fim {ev.hora}
          {ev.extraMin !== null && ` · extra ${ev.extraMin} min`}
          {ev.valor && ` · ${ev.valor}`}
        </span>
      );
    default:
      return null;
  }
}
