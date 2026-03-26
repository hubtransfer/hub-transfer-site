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

/* ─── SVG Brand Icons ─── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);
const MapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const WazeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2.1 6.1L2 22l3.9-2.1c1.7 1.3 3.8 2.1 6.1 2.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm-2 13c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm2-4H8c0-2.2 1.8-4 4-4s4 1.8 4 4z" /></svg>
);
const SmsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
);

/* ─── Color config ─── */

const TYPE_COLORS = {
  CHEGADA: { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-l-[#10b981]", hex: "#10b981" },
  RECOLHA: { text: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-l-[#3b82f6]", hex: "#3b82f6" },
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
  onShowNameplate: (name: string, destination?: string) => void;
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

  /* ─ Copy toast ─ */
  const [toast, setToast] = useState("");
  const copyWithToast = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast("Copiado!");
      setTimeout(() => setToast(""), 2000);
    }).catch(() => {});
  }, []);

  /* ─ Derived data ─ */
  const cardId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
  const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
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
    // Ctrl+Click on desktop → skip hold, go straight to armed
    if (e.ctrlKey || e.metaKey) {
      setSwipeState("armed");
      return;
    }
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
      {/* ── Copy toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#F5C518] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

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
            <p
              className={`text-base font-bold text-white truncate ${expanded ? "cursor-pointer hover:text-[#F5C518] transition-colors" : ""}`}
              onClick={expanded ? (e) => { e.stopPropagation(); onShowNameplate(viagem.client, viagem.destination); } : undefined}
            >
              {viagem.client}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{tipo}</span>
              {viagem.pax && <span className="text-[10px] font-mono text-[#D4D4D4]">{viagem.pax} pax</span>}
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

        {/* Flight progress bar (collapsed, CHEGADA only) — clickable */}
        {!expanded && hasFlight && (
          <a
            href={viagem.flight ? `https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2.5 px-4 pb-3 pt-0.5 cursor-pointer hover:bg-white/[0.02] transition-colors rounded-b-2xl"
          >
            <div className="flex items-center gap-1 flex-shrink-0 min-w-[52px]">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <span className="font-mono text-xs font-bold text-[#E5E5E5]">{depIata || "???"}</span>
            </div>
            <div className="flex-1 relative">
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${bar.pulse ? "animate-flight-pulse" : ""}`}
                  style={{ width: `${Math.max(flightProg, 4)}%`, backgroundColor: bar.color }} />
              </div>
              {viagem.flight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono text-[11px] font-bold text-[#E5E5E5] hover:text-[#F5C518] transition-colors">
                  {viagem.flight}
                </span>
              )}
              {flightProg > 8 && flightProg < 92 && (
                <span className="absolute top-0 text-[9px] leading-none" style={{ left: `calc(${flightProg}% - 5px)`, transform: "translateY(-50%)", filter: "drop-shadow(0 0 2px rgba(0,0,0,.8))" }}>✈</span>
              )}
            </div>
            <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: bar.color }}>LIS</span>
            <div className="flex flex-col items-end flex-shrink-0 min-w-[48px]">
              {arrTime !== "—:—" && <span className="font-mono text-base font-black leading-none" style={{ color: bar.color }}>{arrTime}</span>}
              {countdown && <span className="font-mono text-[9px] leading-tight mt-0.5" style={{ color: `${bar.color}99` }}>{countdown}</span>}
            </div>
          </a>
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
                    <p className="text-[10px] text-[#D4D4D4]">{viagem.depCity || ""}</p>
                    {viagem.depTime && <p className="font-mono text-[10px] text-[#D4D4D4] mt-0.5">{viagem.depTime}</p>}
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
                    <p className="text-[10px] text-[#D4D4D4]">{viagem.arrCity || "Lisboa"}</p>
                    {viagem.arrTime && <p className="font-mono text-[10px] text-[#D4D4D4] mt-0.5">{viagem.arrTime}</p>}
                  </div>
                </div>
                {(viagem.depTerminal || viagem.arrTerminal) && (
                  <div className="flex justify-between font-mono text-[10px] text-[#999]">
                    {viagem.depTerminal && <span>T{viagem.depTerminal}</span>}
                    {viagem.arrTerminal && <span>T{viagem.arrTerminal}</span>}
                  </div>
                )}
              </div>
            )}

            {/* ── Route: Origin + Destination — clickable to copy, real icons ── */}
            <div className="px-4 py-3 border-t border-white/5 space-y-3">
              {/* Origin */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#F5C518] mb-1">{tipo === "CHEGADA" ? "Origem — Aeroporto" : "Origem — Recolha"}</p>
                <button type="button" onClick={() => copyWithToast(viagem.origin)} className="text-left w-full active:opacity-70 transition-opacity">
                  {originLoc.name && <p className="text-sm font-bold text-white">{originLoc.name}</p>}
                  <p className="text-xs text-[#E5E5E5]">{originLoc.addr}</p>
                </button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a href={getMapUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#4285f4]/10 border border-[#4285f4]/20 text-[#4285f4] font-mono text-sm font-bold active:bg-[#4285f4]/20 transition-colors">
                    <MapsIcon /> Google Maps
                  </a>
                  <a href={getWazeUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#35c5f0]/10 border border-[#35c5f0]/20 text-[#35c5f0] font-mono text-sm font-bold active:bg-[#35c5f0]/20 transition-colors">
                    <WazeIcon /> Waze
                  </a>
                </div>
              </div>
              {/* Destination */}
              {viagem.destination && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#F5C518] mb-1">Destino</p>
                  <button type="button" onClick={() => copyWithToast(viagem.destination)} className="text-left w-full active:opacity-70 transition-opacity">
                    {destLoc.name && <p className="text-sm font-bold text-white">{destLoc.name}</p>}
                    <p className="text-xs text-[#E5E5E5]">{destLoc.addr}</p>
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a href={getMapUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#4285f4]/10 border border-[#4285f4]/20 text-[#4285f4] font-mono text-sm font-bold active:bg-[#4285f4]/20 transition-colors">
                      <MapsIcon /> Google Maps
                    </a>
                    <a href={getWazeUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#35c5f0]/10 border border-[#35c5f0]/20 text-[#35c5f0] font-mono text-sm font-bold active:bg-[#35c5f0]/20 transition-colors">
                      <WazeIcon /> Waze
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="border-t border-white/5 bg-[#0d0d0d] px-4 py-3 space-y-3">
              {/* Phone — click to copy */}
              {viagem.phone && (
                <button type="button" onClick={() => copyWithToast(`+${viagem.phone!.replace(/\D/g, "")}`)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-[#E5E5E5] active:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <PhoneIcon /> +{viagem.phone.replace(/\D/g, "")}
                </button>
              )}

              {/* WhatsApp + SMS — real icons */}
              <div className="grid grid-cols-2 gap-2">
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const h = cleanHora(viagem.pickupTime || "");
                    const fn = TEMPLATES[tipo as "CHEGADA" | "RECOLHA"]?.[lang] || TEMPLATES.RECOLHA?.EN;
                    if (fn) window.open(getWhatsAppUrl(viagem.phone!, fn(mode === "driver" ? "o motorista" : "", viagem.client, viagem.origin, h)), "_blank");
                  }}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] font-mono text-sm font-bold active:bg-[#25d366]/20 transition-colors">
                    <WhatsAppIcon /> WhatsApp
                  </button>
                )}
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const h = cleanHora(viagem.pickupTime || "");
                    const fn = TEMPLATES[tipo as "CHEGADA" | "RECOLHA"]?.[lang] || TEMPLATES.RECOLHA?.EN;
                    if (fn) window.open(getSmsUrl(viagem.phone!, fn(mode === "driver" ? "o motorista" : "", viagem.client, viagem.origin, h)), "_blank");
                  }}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] font-mono text-sm font-bold active:bg-[#3b82f6]/20 transition-colors">
                    <SmsIcon /> SMS
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
                <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#999] font-mono text-sm">
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
