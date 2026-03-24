"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HubViagem, Driver } from "@/lib/trips";
import {
  detectTipo,
  splitLocation,
  cleanHora,
  calcFlightProgress,
  calcDriverPrice,
  resolveLanguage,
  guessDepAirport,
  getIataInfo,
  getMapUrl,
  getWazeUrl,
  getWhatsAppUrl,
  getSmsUrl,
  TEMPLATES,
} from "@/lib/trips";

/* ─── Helpers ─── */

function countryFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "🌐";
  const u = iso.toUpperCase();
  return String.fromCodePoint(...[...u].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function flightBarStyle(progress: number, status?: string): { color: string; pulse: boolean } {
  const st = (status || "").toLowerCase();
  if (st === "landed" || st === "aterrou" || progress >= 95) return { color: "#10b981", pulse: false };
  if (progress <= 5 && st !== "boarding") return { color: "#374151", pulse: false };
  return { color: "#f59e0b", pulse: true };
}

function formatCountdown(arrTime: string): string | null {
  if (!arrTime || arrTime === "—:—") return null;
  const [h, m] = arrTime.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target.getTime() < now.getTime() - 60000) return null;
  const mins = Math.round((target.getTime() - now.getTime()) / 60000);
  if (mins < 1) return null;
  if (mins < 60) return `em ${mins}min`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  return rm > 0 ? `em ${hrs}h${String(rm).padStart(2, "0")}` : `em ${hrs}h`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ─── Color config ─── */

const TYPE_COLORS = {
  CHEGADA: { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", border: "border-l-[#f59e0b]", hex: "#f59e0b" },
  RECOLHA: { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-l-[#10b981]", hex: "#10b981" },
  TOUR:    { text: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-l-[#a855f7]", hex: "#a855f7" },
} as const;
function ts(tipo: string) { return TYPE_COLORS[tipo as keyof typeof TYPE_COLORS] ?? { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-l-gray-500", hex: "#999" }; }

const HOLD_MS = 1000;
const SWIPE_PX = 140;

/* ─── Props ─── */

interface DriverTripCardProps {
  viagem: HubViagem;
  drivers?: Driver[];                                                      // admin only
  onDarBaixa: (id: string, rowIndex: string, cardId: string) => void;
  onShowNameplate: (name: string) => void;
  onSetDriver?: (cardId: string, driver: string) => void;                  // admin only
  onDispatch?: (cid: string, type: string, client: string, lang: string, origin: string, hora: string) => void;
  onClientMsg?: (cid: string, type: string, client: string, lang: string, origin: string, hora: string, phone: string) => void;
  onSmsMsg?: (cid: string, type: string, client: string, lang: string, origin: string, hora: string, phone: string) => void;
  mode?: "driver" | "admin";
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function DriverTripCard({
  viagem, drivers, onDarBaixa, onShowNameplate,
  onSetDriver, onDispatch, onClientMsg, onSmsMsg,
  mode = "driver",
}: DriverTripCardProps) {
  /* ─ Tick for countdown refresh ─ */
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 30000); return () => clearInterval(id); }, []);

  /* ─ Derived data ─ */
  const cardId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
  const tipo = detectTipo(viagem.origin || "", viagem.flight || "");
  const hora = cleanHora(viagem.pickupTime || "");
  const lang = resolveLanguage(viagem.language || "", viagem.phone);
  const price = calcDriverPrice(viagem.platform || "");
  const isDone = viagem.concluida || viagem.status === "CONCLUIDA" || viagem.status === "FINALIZOU";
  const c = ts(tipo);

  const flightProg = useMemo(() => tipo === "CHEGADA" ? calcFlightProgress(viagem.depTime || "", viagem.arrTime || "") : 0, [tipo, viagem.depTime, viagem.arrTime]);
  const depIata = useMemo(() => tipo === "CHEGADA" ? ((viagem.depAirport || viagem.depIata || guessDepAirport(viagem.flight || "") || "").toUpperCase() || null) : null, [tipo, viagem.depAirport, viagem.depIata, viagem.flight]);
  const depInfo = useMemo(() => depIata ? getIataInfo(depIata) : null, [depIata]);
  const flag = depInfo ? countryFlag(depInfo.c) : null;
  const arrTime = cleanHora(viagem.arrTime || "");
  const bar = flightBarStyle(flightProg, viagem.status);
  const hasFlight = tipo === "CHEGADA" && !!(depIata || (arrTime && arrTime !== "—:—"));
  const countdown = arrTime !== "—:—" ? formatCountdown(arrTime) : null;

  /* ─ Expand / Collapse ─ */
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = useCallback(() => { if (swipeState === "idle") setExpanded((e) => !e); }, []);

  /* ─ Swipe-to-complete (Uber style) ─ */
  const [swipeState, setSwipeState] = useState<"idle" | "holding" | "armed" | "swiping" | "completing">("idle");
  const [swipeX, setSwipeX] = useState(0);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startXRef = useRef(0);

  const clearHold = useCallback(() => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (isDone) return;
    startXRef.current = e.clientX;
    setSwipeState("holding");
    holdRef.current = setTimeout(() => setSwipeState("armed"), HOLD_MS);
  }, [isDone]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (swipeState === "holding") { if (Math.abs(e.clientX - startXRef.current) > 10) { clearHold(); setSwipeState("idle"); } return; }
    if (swipeState === "armed" || swipeState === "swiping") { setSwipeX(Math.max(0, e.clientX - startXRef.current)); setSwipeState("swiping"); }
  }, [swipeState, clearHold]);

  const onUp = useCallback(() => {
    clearHold();
    if (swipeState === "swiping" && swipeX >= SWIPE_PX) {
      setSwipeState("completing");
      setTimeout(() => { onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId); setSwipeState("idle"); setSwipeX(0); }, 400);
    } else if (swipeState === "armed" || swipeState === "swiping") {
      // Didn't complete — back to idle, treat as tap
      setSwipeState("idle"); setSwipeX(0);
    } else {
      setSwipeState("idle"); setSwipeX(0);
    }
  }, [swipeState, swipeX, viagem.id, viagem.rowIndex, cardId, onDarBaixa, clearHold]);

  const onCancel = useCallback(() => { clearHold(); setSwipeState("idle"); setSwipeX(0); }, [clearHold]);

  const isArmed = swipeState === "armed";
  const isSwiping = swipeState === "swiping";
  const isSwipeActive = isArmed || isSwiping;
  const isCompleting = swipeState === "completing";
  const swipePct = Math.min(swipeX / SWIPE_PX, 1);

  // Swipe color: gold when armed, green when threshold reached
  const swipeColor = swipePct >= 1 ? "#10b981" : "#F5C518";

  /* ─── Address helpers ─── */
  const originLoc = useMemo(() => splitLocation(viagem.origin || ""), [viagem.origin]);
  const destLoc = useMemo(() => splitLocation(viagem.destination || ""), [viagem.destination]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <motion.div
      layout
      onPointerDown={expanded && !isDone ? onDown : undefined}
      onPointerMove={expanded && !isDone ? onMove : undefined}
      onPointerUp={expanded && !isDone ? onUp : undefined}
      onPointerCancel={expanded && !isDone ? onCancel : undefined}
      className={`
        relative bg-[#111] rounded-2xl border border-white/5 overflow-hidden
        border-l-4 ${isSwipeActive || isCompleting ? "border-l-[#F5C518]" : c.border}
        ${isDone ? "opacity-40" : ""}
        ${isSwipeActive || isCompleting ? `ring-2 ring-[${swipeColor}]/30` : ""}
        select-none
      `}
      style={{
        transform: isSwiping ? `translateX(${swipeX}px)` : isCompleting ? "translateX(100vw)" : undefined,
        transition: isSwiping ? "none" : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      animate={isCompleting ? { x: "100vw", opacity: 0 } : { x: 0, opacity: isDone ? 0.4 : 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Swipe overlay (Uber style) ── */}
      <AnimatePresence>
        {isSwipeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="flex items-center gap-3 font-mono text-base font-bold" style={{ color: swipeColor }}>
              {isArmed && !swipeX && <span className="animate-pulse">Arrastar para concluir →</span>}
              {isSwiping && swipePct < 1 && <><span>Arrastar para concluir</span><span className="text-xl">→</span></>}
              {isSwiping && swipePct >= 1 && <><span>Soltar para concluir</span><span className="text-xl">✓</span></>}
            </div>
            {isSwiping && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-full overflow-hidden bg-white/5">
                <motion.div className="h-full rounded-full" style={{ width: `${swipePct * 100}%`, backgroundColor: swipeColor }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hold indicator ── */}
      {swipeState === "holding" && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-2 border-[#F5C518]/20 animate-pulse" />
      )}

      {/* ════════════════════════════════════════════════ */}
      {/*  COLLAPSED VIEW (always visible)                */}
      {/* ════════════════════════════════════════════════ */}
      <div className="cursor-pointer" onClick={toggleExpand}>
        {/* Main row: time | name+tags | price */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-shrink-0 min-w-[56px]">
            <span className={`text-xl font-bold font-mono ${c.text}`}>{hora}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{viagem.client}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{tipo}</span>
              {viagem.pax && <span className="text-[10px] font-mono text-white/40">{viagem.pax} pax</span>}
              {expanded && <span className="text-[10px] text-white/20">▲</span>}
              {!expanded && <span className="text-[10px] text-white/20">▼</span>}
            </div>
          </div>
          <div className="flex-shrink-0 text-right flex flex-col items-end gap-0.5">
            {mode === "admin" && (
              viagem.driver
                ? <span className="font-mono text-[10px] font-semibold text-[#10b981]/80 truncate max-w-[80px]">{viagem.driver}</span>
                : <span className="font-mono text-[10px] text-white/20">Sem motorista</span>
            )}
            {price > 0 && <span className="font-mono text-sm font-bold text-[#F5C518]">€{price}</span>}
          </div>
        </div>

        {/* Flight progress bar (collapsed, CHEGADA only) */}
        {!expanded && hasFlight && (
          <div className="flex items-center gap-2.5 px-4 pb-3 pt-0.5">
            <div className="flex items-center gap-1 flex-shrink-0 min-w-[52px]">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <span className="font-mono text-xs font-bold text-white/60">{depIata || "???"}</span>
            </div>
            <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] relative overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${bar.pulse ? "animate-flight-pulse" : ""}`}
                style={{ width: `${Math.max(flightProg, 4)}%`, backgroundColor: bar.color }} />
              {flightProg > 8 && flightProg < 92 && (
                <span className="absolute top-1/2 text-[9px] leading-none" style={{ left: `calc(${flightProg}% - 5px)`, transform: "translateY(-50%)", filter: "drop-shadow(0 0 2px rgba(0,0,0,.8))" }}>✈</span>
              )}
            </div>
            <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: bar.color }}>LIS</span>
            <div className="flex flex-col items-end flex-shrink-0 min-w-[48px]">
              {arrTime !== "—:—" && <span className="font-mono text-base font-black leading-none" style={{ color: bar.color }}>{arrTime}</span>}
              {countdown && <span className="font-mono text-[9px] leading-tight mt-0.5" style={{ color: `${bar.color}99` }}>{countdown}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/*  EXPANDED VIEW (animated)                       */}
      {/* ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* ── Flight block (CHEGADA) ── */}
            {tipo === "CHEGADA" && hasFlight && (
              <div className="px-4 py-3 border-t border-white/5" style={{ backgroundColor: `${c.hex}08` }}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="text-center">
                    <p className="font-mono font-bold text-sm" style={{ color: c.hex }}>{depIata || "???"}</p>
                    <p className="text-[10px] text-white/40">{viagem.depCity || ""}</p>
                    {viagem.depTime && <p className="font-mono text-[10px] text-white/50 mt-0.5">{viagem.depTime}</p>}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="relative w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${bar.pulse ? "animate-flight-pulse" : ""}`}
                        style={{ width: `${Math.max(flightProg, 4)}%`, backgroundColor: bar.color }} />
                    </div>
                    {viagem.flight && <p className="text-center font-mono text-[10px] mt-1" style={{ color: `${c.hex}99` }}>{viagem.flight}</p>}
                  </div>
                  <div className="text-center">
                    <p className="font-mono font-bold text-sm" style={{ color: c.hex }}>{(viagem.arrAirport || viagem.arrIata || "LIS").toUpperCase()}</p>
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
            )}

            {/* ── Route: Origin + Destination with Maps/Waze ── */}
            <div className="px-4 py-3 border-t border-white/5 space-y-3">
              {/* Origin */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">📍 {tipo === "CHEGADA" ? "Aeroporto" : "Recolha"}</p>
                {originLoc.name && <p className="text-sm font-bold text-white">{originLoc.name}</p>}
                <p className="text-xs text-white/50">{originLoc.addr}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a href={getMapUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm font-bold active:bg-blue-500/20 transition-colors">
                    🗺 Maps
                  </a>
                  <a href={getWazeUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-sm font-bold active:bg-cyan-500/20 transition-colors">
                    🔷 Waze
                  </a>
                </div>
              </div>
              {/* Destination */}
              {viagem.destination && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">🏁 Destino</p>
                  {destLoc.name && <p className="text-sm font-bold text-white">{destLoc.name}</p>}
                  <p className="text-xs text-white/50">{destLoc.addr}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a href={getMapUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm font-bold active:bg-blue-500/20 transition-colors">
                      🗺 Maps
                    </a>
                    <a href={getWazeUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-sm font-bold active:bg-cyan-500/20 transition-colors">
                      🔷 Waze
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="border-t border-white/5 bg-[#0d0d0d] px-4 py-3 space-y-3">
              {/* Phone */}
              {viagem.phone && (
                <button type="button" onClick={() => copyToClipboard(`+${viagem.phone!.replace(/\D/g, "")}`)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-white/70 active:bg-white/10 transition-colors">
                  📞 +{viagem.phone.replace(/\D/g, "")}
                </button>
              )}

              {/* Name plate */}
              <button type="button" onClick={() => onShowNameplate(viagem.client)}
                className="w-full h-12 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/20 text-[#F5C518] font-bold text-sm active:bg-[#F5C518]/20 transition-colors">
                📋 Placa do Nome
              </button>

              {/* WhatsApp + SMS */}
              <div className="grid grid-cols-2 gap-2">
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const h = cleanHora(viagem.pickupTime || "");
                    const fn = TEMPLATES[tipo as "CHEGADA" | "RECOLHA"]?.[lang] || TEMPLATES.RECOLHA?.EN;
                    if (fn) window.open(getWhatsAppUrl(viagem.phone!, fn(mode === "driver" ? "o motorista" : "", viagem.client, viagem.origin, h)), "_blank");
                  }}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] font-mono text-sm font-bold active:bg-[#25d366]/20 transition-colors">
                    💬 WhatsApp
                  </button>
                )}
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const h = cleanHora(viagem.pickupTime || "");
                    const fn = TEMPLATES[tipo as "CHEGADA" | "RECOLHA"]?.[lang] || TEMPLATES.RECOLHA?.EN;
                    if (fn) window.open(getSmsUrl(viagem.phone!, fn(mode === "driver" ? "o motorista" : "", viagem.client, viagem.origin, h)), "_blank");
                  }}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm font-bold active:bg-blue-500/20 transition-colors">
                    💬 SMS
                  </button>
                )}
              </div>

              {/* Admin-only: driver selector + dispatch */}
              {mode === "admin" && drivers && onSetDriver && (
                <select value={viagem.driver ?? ""} onChange={(e) => onSetDriver(cardId, e.target.value)}
                  className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 font-mono text-sm text-white/90 focus:outline-none focus:border-[#F5C518]/40">
                  <option value="">Atribuir motorista...</option>
                  {drivers.map((d) => <option key={d.name} value={d.name}>{d.name}{d.viatura ? ` · ${d.viatura}` : ""}</option>)}
                </select>
              )}
              {mode === "admin" && onDispatch && (
                <button type="button" onClick={() => onDispatch(cardId, tipo, viagem.client, lang, viagem.origin, hora)}
                  className="w-full h-12 rounded-xl border transition-colors font-mono text-sm font-bold"
                  style={{ backgroundColor: `${c.hex}15`, color: c.hex, borderColor: `${c.hex}33` }}>
                  ⚡ Enviar Template Motorista
                </button>
              )}

              {/* Dar Baixa button (fallback for non-swipe) */}
              {!isDone && (
                <button type="button" onClick={() => onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId)}
                  className="w-full h-12 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] font-mono text-sm font-bold active:bg-[#10b981]/20 transition-colors">
                  ✅ Dar Baixa
                </button>
              )}
              {isDone && (
                <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 font-mono text-sm">
                  ✅ Concluída
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
