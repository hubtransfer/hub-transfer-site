"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import type { HubViagem, Driver } from "@/lib/trips";
import {
  detectTipo,
  splitLocation,
  cleanHora,
  calcFlightProgress,
  calcDriverPrice,
  resolveLanguage,
  guessDepAirport,
  getMapUrl,
  getWazeUrl,
} from "@/lib/trips";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TripCardProps {
  viagem: HubViagem;
  drivers: Driver[];
  onSetDriver: (cardId: string, driver: string) => void;
  onDarBaixa: (id: string, rowIndex: string, cardId: string) => void;
  onDispatch: (cardId: string, type: string, client: string, lang: string, origin: string, hora: string) => void;
  onClientMsg: (cardId: string, type: string, client: string, lang: string, origin: string, hora: string, phone: string) => void;
  onSmsMsg: (cardId: string, type: string, client: string, lang: string, origin: string, hora: string, phone: string) => void;
  onShowNameplate: (name: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Color maps — CHEGADA=#D4A847  RECOLHA=#10b981  TOUR=#a855f7       */
/* ------------------------------------------------------------------ */

const TYPE_COLORS = {
  CHEGADA: { text: "text-[#D4A847]", bg: "bg-[#D4A847]/10", border: "border-l-[#D4A847]", hex: "#D4A847" },
  RECOLHA: { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-l-[#10b981]", hex: "#10b981" },
  TOUR:    { text: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-l-[#a855f7]", hex: "#a855f7" },
} as const;

function getTypeStyle(tipo: string) {
  return TYPE_COLORS[tipo as keyof typeof TYPE_COLORS] ?? { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-l-gray-500", hex: "#999" };
}

/* ------------------------------------------------------------------ */
/*  Swipe-to-complete constants                                        */
/* ------------------------------------------------------------------ */

const HOLD_DURATION = 1000; // 1 second hold
const SWIPE_THRESHOLD = 120; // pixels to trigger completion

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded bg-hub-black-elevated border border-hub-gold/10 whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

function NavBtn({ href, label, color }: { href: string; label: string; color: "blue" | "cyan" }) {
  const c = color === "blue"
    ? "bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/25"
    : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25";
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${c}`}>
      {label === "Maps" ? "🗺" : "🔷"} {label}
    </a>
  );
}

function AddressRow({ label, address, icon }: { label: string; address: string; icon?: React.ReactNode }) {
  if (!address) return null;
  const loc = splitLocation(address);
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-0.5">{label}</p>
        {loc.name && <p className="text-sm font-bold text-white/90 leading-snug">{loc.name}</p>}
        <p className="text-xs text-white/50 leading-snug">{loc.addr}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <NavBtn href={getMapUrl(address)} label="Maps" color="blue" />
        <NavBtn href={getWazeUrl(address)} label="Waze" color="cyan" />
      </div>
    </div>
  );
}

function FlightProgress({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#D4A847] to-[#D4A847]/60 transition-all duration-700"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
      {progress > 0 && progress < 100 && (
        <div className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white shadow-sm shadow-white/50"
          style={{ left: `${progress}%` }} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function TripCard({
  viagem, drivers, onSetDriver, onDarBaixa, onDispatch, onClientMsg, onSmsMsg, onShowNameplate,
}: TripCardProps) {
  const cardId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
  const tipo = detectTipo(viagem.origin || "", viagem.flight || "");
  const hora = cleanHora(viagem.pickupTime || "");
  const lang = resolveLanguage(viagem.language || "", viagem.phone);
  const price = calcDriverPrice(viagem.platform || "");
  const isDone = viagem.concluida || viagem.status === "CONCLUIDA" || viagem.status === "FINALIZOU";
  const ts = getTypeStyle(tipo);

  const flightProgress = useMemo(() => {
    if (tipo !== "CHEGADA") return 0;
    return calcFlightProgress(viagem.depTime || "", viagem.arrTime || "");
  }, [tipo, viagem.depTime, viagem.arrTime]);

  const depAirport = useMemo(() => {
    if (tipo !== "CHEGADA") return null;
    return guessDepAirport(viagem.flight || "");
  }, [tipo, viagem.flight]);

  /* ─── Swipe-to-complete state ─── */
  const [swipeState, setSwipeState] = useState<"idle" | "holding" | "armed" | "swiping" | "completing">("idle");
  const [swipeX, setSwipeX] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const clearHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDone) return;
    startX.current = e.clientX;
    setSwipeState("holding");
    holdTimer.current = setTimeout(() => {
      setSwipeState("armed");
    }, HOLD_DURATION);
  }, [isDone]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (swipeState === "holding") {
      // If moved more than 10px before hold completes, cancel
      if (Math.abs(e.clientX - startX.current) > 10) {
        clearHold();
        setSwipeState("idle");
      }
      return;
    }
    if (swipeState === "armed" || swipeState === "swiping") {
      const dx = Math.max(0, e.clientX - startX.current);
      setSwipeX(dx);
      setSwipeState("swiping");
    }
  }, [swipeState, clearHold]);

  const handlePointerUp = useCallback(() => {
    clearHold();
    if (swipeState === "swiping" && swipeX >= SWIPE_THRESHOLD) {
      setSwipeState("completing");
      // Animate out then fire
      setTimeout(() => {
        onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId);
        setSwipeState("idle");
        setSwipeX(0);
      }, 400);
    } else {
      setSwipeState("idle");
      setSwipeX(0);
    }
  }, [swipeState, swipeX, viagem.id, viagem.rowIndex, cardId, onDarBaixa, clearHold]);

  const handlePointerCancel = useCallback(() => {
    clearHold();
    setSwipeState("idle");
    setSwipeX(0);
  }, [clearHold]);

  const isArmed = swipeState === "armed";
  const isSwiping = swipeState === "swiping";
  const isActive = isArmed || isSwiping;
  const isCompleting = swipeState === "completing";
  const isHolding = swipeState === "holding";
  const swipeProgress = Math.min(swipeX / SWIPE_THRESHOLD, 1);

  /* ─── Card dynamic styles ─── */
  const cardBorderColor = isActive || isCompleting
    ? "border-l-[#ef4444]"
    : ts.border;

  const cardBgOverlay = isActive || isCompleting
    ? "ring-2 ring-[#ef4444]/40 bg-[#ef4444]/5"
    : "";

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`
        bg-hub-black-card rounded-2xl border border-hub-gold/10 overflow-hidden
        border-l-4 ${cardBorderColor}
        ${isDone ? "opacity-40" : ""}
        ${cardBgOverlay}
        ${isCompleting ? "animate-slide-out-right" : ""}
        transition-all duration-200 select-none touch-none
      `}
      style={{
        transform: isSwiping ? `translateX(${swipeX}px)` : isCompleting ? "translateX(100vw)" : undefined,
        transition: isSwiping ? "none" : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ── Swipe indicator overlay ── */}
      {isActive && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider transition-opacity duration-200"
            style={{
              color: swipeProgress >= 1 ? "#22c55e" : "#ef4444",
              opacity: isSwiping ? 1 : 0.7,
            }}
          >
            {isArmed && !swipeX && (
              <span className="animate-pulse">Segura e desliza →</span>
            )}
            {isSwiping && swipeProgress < 1 && (
              <>
                <span>Deslize para concluir</span>
                <span className="text-lg">→</span>
              </>
            )}
            {isSwiping && swipeProgress >= 1 && (
              <>
                <span>Solte para concluir</span>
                <span className="text-lg">✓</span>
              </>
            )}
          </div>
          {/* Progress bar at bottom of card */}
          {isSwiping && (
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${swipeProgress * 100}%`,
                  backgroundColor: swipeProgress >= 1 ? "#22c55e" : "#ef4444",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Hold indicator (pulsing ring during 1s hold) ── */}
      {isHolding && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-2 border-[#ef4444]/30 animate-pulse" />
      )}

      {/* ============================================================ */}
      {/*  TOP ROW: timebox | info | nav                               */}
      {/* ============================================================ */}
      <div className="relative grid grid-cols-[auto_1fr_auto] gap-3 p-4 pb-3">
        {/* Timebox */}
        <div className={`bg-hub-black-elevated rounded-xl px-4 py-3 flex flex-col items-center justify-center min-w-[80px] ${ts.bg}`}>
          <span className={`font-mono text-2xl font-bold leading-none ${ts.text}`}>{hora}</span>
          <span className={`font-mono text-[10px] uppercase tracking-widest mt-1 ${ts.text} opacity-70`}>{tipo}</span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-2 min-w-0">
          <button type="button" onClick={() => onShowNameplate(viagem.client)}
            className="text-lg font-bold text-white text-left truncate hover:text-hub-gold transition-colors">
            {viagem.client}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {viagem.driver ? (
              <Tag className="bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]">{viagem.driver}</Tag>
            ) : (
              <Tag className="bg-red-500/10 border-red-500/20 text-red-400">Sem motorista</Tag>
            )}
            {viagem.flight && <Tag><span style={{ color: ts.hex }}>{viagem.flight}</span></Tag>}
            <Tag><span className="text-white/60">{lang}</span></Tag>
            {viagem.pax && <Tag><span className="text-white/60">{viagem.pax} pax</span></Tag>}
            {viagem.bags && <Tag><span className="text-white/60">{viagem.bags} bags</span></Tag>}
            {price > 0 && <Tag><span className="text-hub-gold">{price}&euro;</span></Tag>}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex flex-col gap-1.5 justify-center">
          {viagem.origin && (
            <>
              <NavBtn href={getMapUrl(viagem.origin)} label="Maps" color="blue" />
              <NavBtn href={getWazeUrl(viagem.origin)} label="Waze" color="cyan" />
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  MIDDLE SECTION — type-specific                              */}
      {/* ============================================================ */}
      <div className="px-4 pb-3">
        {/* CHEGADA */}
        {tipo === "CHEGADA" && (
          <div className="space-y-3">
            <div className="bg-hub-black-elevated rounded-xl p-3 space-y-2" style={{ borderLeft: `3px solid ${ts.hex}20` }}>
              <div className="flex items-center justify-between text-xs">
                <div className="text-center">
                  <p className="font-mono font-bold text-sm" style={{ color: ts.hex }}>
                    {(viagem.depAirport || viagem.depIata || depAirport || "???").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">{viagem.depCity || "Partida"}</p>
                  {viagem.depTime && <p className="font-mono text-[10px] text-white/50 mt-0.5">{viagem.depTime}</p>}
                </div>
                <div className="flex-1 mx-3">
                  <FlightProgress progress={flightProgress} />
                  {viagem.flight && <p className="text-center font-mono text-[10px] mt-1" style={{ color: `${ts.hex}99` }}>{viagem.flight}</p>}
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-sm" style={{ color: ts.hex }}>
                    {(viagem.arrAirport || viagem.arrIata || "LIS").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">{viagem.arrCity || "Lisboa"}</p>
                  {viagem.arrTime && <p className="font-mono text-[10px] text-white/50 mt-0.5">{viagem.arrTime}</p>}
                </div>
              </div>
              {(viagem.depTerminal || viagem.arrTerminal) && (
                <div className="flex justify-between font-mono text-[10px] text-white/30">
                  {viagem.depTerminal && <span>T{viagem.depTerminal}</span>}
                  {viagem.arrTerminal && <span>T{viagem.arrTerminal}</span>}
                </div>
              )}
            </div>
            <div className="divide-y divide-white/5">
              <AddressRow label="Origem" address={viagem.origin} icon={<span className="text-lg leading-none" style={{ color: ts.hex }}>✈</span>} />
              <AddressRow label="Destino" address={viagem.destination} icon={<span className="text-[#10b981] text-lg leading-none">📍</span>} />
            </div>
          </div>
        )}

        {/* RECOLHA */}
        {tipo === "RECOLHA" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ts.hex }} />
              <div className="flex-1 h-px relative" style={{ background: `linear-gradient(90deg, ${ts.hex}99, ${ts.hex}33, ${ts.hex}99)` }}>
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-xs" style={{ color: `${ts.hex}80` }}>&rarr;</span>
              </div>
              <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: ts.hex }} />
            </div>
            <div className="divide-y divide-white/5">
              <AddressRow label="Pickup" address={viagem.origin} icon={<div className="w-2.5 h-2.5 rounded-full mt-0.5" style={{ backgroundColor: ts.hex }} />} />
              <AddressRow label="Destino" address={viagem.destination} icon={<div className="w-2.5 h-2.5 rounded-full border-2 mt-0.5" style={{ borderColor: ts.hex }} />} />
            </div>
          </div>
        )}

        {/* TOUR */}
        {tipo === "TOUR" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2" style={{ color: ts.hex }}>
              <span className="text-xl">🧭</span>
              <span className="font-mono text-xs uppercase tracking-wider">Tour</span>
            </div>
            <div className="divide-y divide-white/5">
              <AddressRow label="Ponto de encontro" address={viagem.origin} icon={<span style={{ color: ts.hex }} className="text-lg leading-none">📍</span>} />
              {viagem.destination && (
                <AddressRow label="Destino" address={viagem.destination} icon={<span style={{ color: `${ts.hex}80` }} className="text-lg leading-none">🏁</span>} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM ROW: actions                                         */}
      {/* ============================================================ */}
      <div className="border-t border-white/5 bg-hub-black-elevated/50 px-4 py-3 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={viagem.driver ?? ""} onChange={(e) => onSetDriver(cardId, e.target.value)}
            className="flex-1 min-w-[140px] bg-hub-black-elevated border border-hub-gold/10 rounded-lg px-3 py-2 font-mono text-xs text-white/90 focus:outline-none focus:border-hub-gold/40 transition-colors">
            <option value="">Escolher motorista...</option>
            {drivers.map((d) => (
              <option key={d.name} value={d.name}>{d.name}{d.viatura ? ` · ${d.viatura}` : ""}</option>
            ))}
          </select>
          {viagem.phone && (
            <button type="button" onClick={() => copyToClipboard(viagem.phone!)}
              className="font-mono text-sm text-white/70 hover:text-hub-gold cursor-pointer transition-colors px-2 py-1 rounded hover:bg-hub-gold/5" title="Copiar telefone">
              📞 {viagem.phone}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {viagem.phone && (
            <button type="button" onClick={() => onClientMsg(cardId, tipo, viagem.client, lang, viagem.origin, hora, viagem.phone!)}
              className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20 hover:bg-[#25d366]/20 transition-colors">
              WhatsApp
            </button>
          )}
          {viagem.phone && (
            <button type="button" onClick={() => onSmsMsg(cardId, tipo, viagem.client, lang, viagem.origin, hora, viagem.phone!)}
              className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
              SMS
            </button>
          )}
          <button type="button" onClick={() => onDispatch(cardId, tipo, viagem.client, lang, viagem.origin, hora)}
            className="font-mono text-xs font-bold rounded-lg px-3 py-2 border transition-colors"
            style={{ backgroundColor: `${ts.hex}15`, color: ts.hex, borderColor: `${ts.hex}33` }}>
            ⚡ Motorista
          </button>
          {!isDone && (
            <button type="button" onClick={() => onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId)}
              className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 hover:bg-[#10b981]/20 transition-colors ml-auto">
              ✅ Dar Baixa
            </button>
          )}
          {isDone && (
            <span className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-white/5 text-white/30 border border-white/10 ml-auto">
              ✅ Concluída
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
