"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HubViagem, Driver } from "@/lib/trips";
import {
  HUB_CENTRAL_URL,
  detectTipo,
  splitLocation,
  cleanHora,
  calcDriverPrice,
  resolveLanguage,
  getSourceLabel,
  getMapUrl,
  getWazeUrl,
} from "@/lib/trips";
import { generateDriverWhatsAppURL, generateDriverSmsURL } from "@/lib/driver-templates";
import { getOriginFlag } from "@/lib/countryFlags";
import { getDelayedTime, delayColor, computeFlightState } from "@/lib/flightUtils";
import NoShowModal from "@/components/driver/NoShowModal";



/* ─── Helpers ─── */

/* ─── SVG Brand Icons ─── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);
const MapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const WazeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2.1 6.1L2 22l3.9-2.1c1.7 1.3 3.8 2.1 6.1 2.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm-2 13c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm2-4H8c0-2.2 1.8-4 4-4s4 1.8 4 4z" /></svg>
);
const SmsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
);

/* ─── Color config ─── */

const TYPE_COLORS = {
  CHEGADA: { text: "text-[#D4A847]", bg: "bg-[#D4A847]/15", border: "border-l-[#D4A847]", hex: "#D4A847" },
  RECOLHA: { text: "text-[#8B9DAF]", bg: "bg-[#8B9DAF]/15", border: "border-l-[#8B9DAF]", hex: "#8B9DAF" },
  TOUR:    { text: "text-[#C17E4A]", bg: "bg-[#C17E4A]/15", border: "border-l-[#C17E4A]", hex: "#C17E4A" },
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
  driverName?: string;  // logged-in driver name (driver mode) or selected driver (admin mode)
  onNoShow?: (tripId: string) => void;  // called after no-show proofs submitted
  mode?: "driver" | "admin";
  isNext?: boolean;     // first non-done trip gets hero treatment
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function DriverTripCard({
  viagem, drivers, onDarBaixa, onShowNameplate,
  onSetDriver, onDispatch, onClientMsg, onSmsMsg,
  driverName: driverNameProp,
  onNoShow,
  mode = "driver",
  isNext = false,
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
  const sourceLabel = getSourceLabel(viagem);
  const c = ts(tipo);

  const hasFlightNumber = !!(viagem.flight && viagem.flight.trim());
  const hasFlight = hasFlightNumber && (tipo === "CHEGADA" || !!(viagem.depAirport || viagem.depIata || viagem.arrTime));

  // Real-time flight state — recalculates every 30s
  const [flightTick, setFlightTick] = useState(0);
  useEffect(() => {
    if (!hasFlight) return;
    const id = setInterval(() => setFlightTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [hasFlight]);

  const flight = useMemo(() => {
    if (!hasFlight) return null;
    void flightTick; // dependency to force recalc
    return computeFlightState(viagem.depTime || "", viagem.arrTime || "", hora, viagem.statusVoo || "", parseInt(viagem.atrasoMin || "0", 10) || 0);
  }, [hasFlight, viagem.depTime, viagem.arrTime, hora, viagem.statusVoo, viagem.atrasoMin, flightTick]);

  const arrTime = cleanHora(viagem.arrTime || "");
  const delayMin = parseInt(viagem.atrasoMin || "0", 10) || 0;
  const delayedHora = delayMin > 0 ? getDelayedTime(hora, delayMin) : "";
  const dColor = delayMin > 0 ? delayColor(delayMin) : "";

  // Origin flag + IATA code from depIata
  const depIata = (viagem.depIata || "").toUpperCase().trim();
  const originFlag = getOriginFlag(depIata);


  /* ─ No-Show modal ─ */
  const [noShowOpen, setNoShowOpen] = useState(false);

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
  const swipeColor = swipePct >= 1 ? "#7EAA6E" : "#F0D030";

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
        relative rounded-2xl border overflow-hidden border-l-4 select-none
        ${isSwipeActive || isCompleting ? "border-l-[#F0D030]" : c.border}
        ${isDone ? "opacity-40 bg-[#1A1A1A] border-[#2A2A2A]" : ""}
        ${!isDone && isNext ? "bg-[#1A1A00] border-[#2A2A1A] ring-1 ring-[#F0D030]/20" : ""}
        ${!isDone && !isNext ? "bg-[#1A1A1A] border-[#2A2A2A] opacity-90" : ""}
        ${isSwipeActive || isCompleting ? `ring-2 ring-[${swipeColor}]/30` : ""}
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
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#F0D030] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
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
              <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-full overflow-hidden bg-[#1A1A1A]">
                <motion.div className="h-full rounded-full" style={{ width: `${swipePct * 100}%`, backgroundColor: swipeColor }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hold indicator ── */}
      {swipeState === "holding" && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-2 border-[#F0D030]/20 animate-pulse" />
      )}

      {/* ════════════════════════════════════════════════ */}
      {/*  COLLAPSED VIEW (always visible)                */}
      {/* ════════════════════════════════════════════════ */}
      <div className="cursor-pointer" onClick={toggleExpand}>
        {/* Main row: flag/globe | source+time | name | driver+price */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Left: flag or globe */}
          <div className="flex-shrink-0 w-[28px] flex items-center justify-center">
            {hasFlightNumber && originFlag ? (
              <span className="text-[22px] leading-none">{originFlag}</span>
            ) : hasFlightNumber && depIata ? (
              <span className="text-[22px] leading-none">🌍</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
          </div>
          {/* Source label + time */}
          <div className="flex-shrink-0 min-w-[52px]">
            <span className="block text-[9px] font-bold uppercase tracking-[1px] text-[#F0D030]/70 font-mono leading-none mb-0.5">{sourceLabel}</span>
            {delayedHora ? (
              <div className="flex items-center gap-1">
                <span className="text-base font-bold font-mono line-through opacity-40 text-[#999]">{hora}</span>
                <span className="text-[9px] text-[#666]">→</span>
                <span className="text-lg font-black font-mono" style={{ color: dColor }}>{delayedHora}</span>
              </div>
            ) : (
              <span className={`text-xl font-bold font-mono ${c.text}`}>{hora}</span>
            )}
          </div>
          {/* Client name */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-[15px] font-semibold text-[#F5F5F5] truncate ${expanded ? "cursor-pointer hover:text-[#F0D030] transition-colors" : ""}`}
              onClick={expanded ? (e) => { e.stopPropagation(); onShowNameplate(viagem.client, viagem.destination); } : undefined}
            >
              {viagem.client}
            </p>
          </div>
          {/* Right: driver + price */}
          <div className="flex-shrink-0 text-right flex flex-col items-end">
            {mode === "admin" && (
              viagem.driver
                ? <span className="font-mono text-[10px] font-semibold text-[#7EAA6E]/80 truncate max-w-[80px]">{viagem.driver}</span>
                : <span className="font-mono text-[10px] text-[#555]">—</span>
            )}
            {price > 0 && <span className="font-mono text-sm font-bold text-[#F0D030]">€{price}</span>}
          </div>
        </div>

        {/* Flight progress bar (collapsed) — clickable */}
        {!expanded && hasFlight && flight && (
          <a
            href={viagem.flight ? `https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}` : "#"}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block px-4 pb-2.5 pt-0 cursor-pointer hover:bg-[#151515] transition-colors rounded-b-2xl"
          >
            {flight.noData ? (
              /* No flight data yet — awaiting monitoring */
              <div className="flex items-center gap-2">
                <span className="text-[10px] leading-none">🌍</span>
                <div className="flex-1 h-[3px] rounded-full bg-[#222] relative">
                  <p className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[8px] text-[#666] italic">{viagem.flight} · Dados em breve</span>
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#666]">{hora}</span>
                <span className="text-[10px] leading-none">🇵🇹</span>
              </div>
            ) : (
              <>
                {/* Bar with plane → pointing right */}
                <div className="relative h-[3px] rounded-full bg-[#1A1A1A] overflow-visible">
                  {flight.cancelled ? (
                    <div className="absolute inset-0 rounded-full bg-[#EF4444]/20" />
                  ) : (
                    <div className="h-full rounded-full transition-all duration-[2s] ease-in-out"
                      style={{ width: `${Math.max(flight.progress, 2)}%`, backgroundColor: flight.color, opacity: 0.8 }} />
                  )}
                  {!flight.cancelled && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={flight.color}
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-[2s] ease-in-out"
                      style={{ left: `calc(${Math.max(flight.progress, 2)}% - 5px)`, filter: "drop-shadow(0 0 2px rgba(0,0,0,.6))" }}>
                      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
                    </svg>
                  )}
                </div>
                {/* Info row */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] leading-none">{originFlag || "🌍"}</span>
                    <span className="font-mono text-[9px] text-[#888]">{viagem.flight}</span>
                  </div>
                  <span className="font-mono text-[9px]" style={{ color: flight.color }}>{flight.statusText}</span>
                  <div className="flex items-center gap-0.5">
                    {delayMin > 0 ? (
                      <span className="font-mono text-[10px] font-bold text-[#F5C518]">{delayedHora}</span>
                    ) : (
                      <span className="font-mono text-[10px]" style={{ color: flight.color }}>{viagem.arrTime || hora}</span>
                    )}
                    <span className="text-[10px] leading-none">🇵🇹</span>
                  </div>
                </div>
                {flight.pulse && <style dangerouslySetInnerHTML={{ __html: `@keyframes fp{0%,100%{opacity:.8}50%{opacity:.4}}` }} />}
                {flight.pulse && <div className="h-[3px] rounded-full mt-0.5" style={{ backgroundColor: flight.color, opacity: 0.3, animation: "fp 2s ease-in-out infinite" }} />}
              </>
            )}
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
            {/* ── Trip details (expanded only) ── */}
            <div className="px-4 py-2.5 border-t border-[#2A2A2A] flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{tipo}</span>
              {viagem.pax && <span className="text-xs font-mono text-[#D0D0D0]">{viagem.pax} pax</span>}
              {viagem.bags && <span className="text-xs font-mono text-[#999]">{viagem.bags} bag</span>}
              {viagem.notes && <span className="text-[10px] text-[#888] truncate max-w-[200px]">{viagem.notes}</span>}
            </div>

            {/* ── Flight block — operational instrument ── */}
            {hasFlight && flight && (
              <div className="px-4 py-3 border-t border-[#2A2A2A]" style={{ backgroundColor: `${c.hex}06` }}>
                {flight.noData ? (
                  /* Awaiting monitoring — no dep/arr data yet */
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">🌍</span>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-[#222] flex items-center justify-center">
                        <span className="font-mono text-[10px] text-[#666] italic">✈️ Acompanhamento do voo activa em breve</span>
                      </div>
                      <p className="text-center font-mono text-sm font-bold mt-1.5" style={{ color: c.hex }}>{viagem.flight}</p>
                      <p className="text-center font-mono text-[9px] text-[#555] mt-0.5">Monitoramento inicia ~90min antes da descolagem</p>
                    </div>
                    <div className="text-center min-w-[48px]">
                      <p className="text-xl leading-none mb-1">🇵🇹</p>
                      <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>LIS</p>
                      <p className="font-mono text-xs text-[#A0A0A0] mt-1">{hora}</p>
                      <p className="font-mono text-[8px] text-[#555] mt-0.5 uppercase">Pickup</p>
                    </div>
                  </div>
                ) : (
                  /* Full flight tracking */
                  <div className="flex items-start gap-3">
                    {/* LEFT: Origin */}
                    <div className="flex-shrink-0 text-center min-w-[52px]">
                      <p className="text-xl leading-none mb-1">{originFlag || "🌍"}</p>
                      <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>{depIata || "???"}</p>
                      {viagem.depTime && (
                        delayMin > 0 && viagem.depTimeProg ? (
                          <div className="mt-1">
                            <p className="font-mono text-[10px] line-through text-[#666]">{viagem.depTimeProg}</p>
                            <p className="font-mono text-xs font-bold text-[#F5C518]">{getDelayedTime(viagem.depTimeProg, delayMin)}</p>
                          </div>
                        ) : (
                          <p className="font-mono text-xs text-[#A0A0A0] mt-1">{viagem.depTime}</p>
                        )
                      )}
                      <p className="font-mono text-[8px] text-[#555] mt-0.5 uppercase">Descolagem</p>
                    </div>

                    {/* CENTER: Progress bar + plane SVG → pointing RIGHT */}
                    <div className="flex-1 pt-3">
                      <div
                        className="cursor-pointer"
                        onClick={() => viagem.flight && window.open(`https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}`, "_blank")}
                      >
                        {flight.cancelled ? (
                          <div className="h-4 rounded-full bg-[#EF4444]/15 flex items-center justify-center">
                            <span className="text-[9px] font-mono font-bold text-[#EF4444]">CANCELADO</span>
                          </div>
                        ) : (
                          <div className="relative w-full h-4 rounded-full bg-[#222222] overflow-visible">
                            <div className="h-full rounded-full transition-all duration-[2s] ease-in-out"
                              style={{ width: `${Math.max(flight.progress, 2)}%`, backgroundColor: flight.color }} />
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={flight.color}
                              className="absolute top-1/2 -translate-y-1/2 transition-all duration-[2s] ease-in-out"
                              style={{ left: `calc(${Math.max(flight.progress, 2)}% - 8px)`, filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }}>
                              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      {viagem.flight && (
                        <p className="text-center font-mono text-sm font-bold mt-1.5 cursor-pointer hover:text-[#F0D030] transition-colors"
                          style={{ color: c.hex }}
                          onClick={() => window.open(`https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}`, "_blank")}>
                          {viagem.flight}
                        </p>
                      )}
                      <p className="text-center font-mono text-[10px] mt-1" style={{ color: flight.color }}>
                        {flight.statusText}
                      </p>
                      {delayMin > 0 && (
                        <div className="text-center mt-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${dColor}15`, color: dColor }}>⚠️ +{delayMin}min atraso</span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Destination */}
                    <div className="flex-shrink-0 text-center min-w-[52px]">
                      <p className="text-xl leading-none mb-1">🇵🇹</p>
                      <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>LIS</p>
                      {delayMin > 0 ? (
                        <div className="mt-1">
                          <p className="font-mono text-[10px] line-through text-[#666]">{hora}</p>
                          <p className="font-mono text-xs font-bold text-[#F5C518]">{delayedHora}</p>
                        </div>
                      ) : !viagem.arrTime ? (
                        <div className="mt-1">
                          <p className="font-mono text-xs text-[#A0A0A0]">{hora}</p>
                          <p className="font-mono text-[8px] text-[#555]">(est.)</p>
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-[#A0A0A0] mt-1">{viagem.arrTime}</p>
                      )}
                      <p className="font-mono text-[8px] text-[#555] mt-0.5 uppercase">Aterragem</p>
                    </div>
                  </div>
                )}
                {(viagem.depTerminal || viagem.arrTerminal) && (
                  <div className="flex justify-between font-mono text-[10px] text-[#999] mt-2 px-1">
                    {viagem.depTerminal && <span>T{viagem.depTerminal}</span>}
                    {viagem.arrTerminal && <span>T{viagem.arrTerminal}</span>}
                  </div>
                )}
              </div>
            )}

            {/* ── Route: Origin + Destination — clickable to copy, real icons ── */}
            <div className="px-5 py-4 border-t border-[#2A2A2A] space-y-4">
              {/* Origin */}
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[#F0D030] mb-1.5">{tipo === "CHEGADA" ? "Origem — Aeroporto" : "Origem — Recolha"}</p>
                <button type="button" onClick={() => copyWithToast(viagem.origin)} className="text-left w-full active:opacity-70 transition-opacity">
                  {originLoc.name && <p className="text-base font-bold text-white">{originLoc.name}</p>}
                  <p className="text-sm text-[#E5E5E5]">{originLoc.addr}</p>
                </button>
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <a href={getMapUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#4285f4]/10 border border-[#4285f4]/20 text-[#4285f4] font-mono text-base font-bold active:bg-[#4285f4]/20 transition-colors">
                    <MapsIcon /> Google Maps
                  </a>
                  <a href={getWazeUrl(viagem.origin)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#35c5f0]/10 border border-[#35c5f0]/20 text-[#35c5f0] font-mono text-base font-bold active:bg-[#35c5f0]/20 transition-colors">
                    <WazeIcon /> Waze
                  </a>
                </div>
              </div>
              {/* Destination */}
              {viagem.destination && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[#F0D030] mb-1.5">Destino</p>
                  <button type="button" onClick={() => copyWithToast(viagem.destination)} className="text-left w-full active:opacity-70 transition-opacity">
                    {destLoc.name && <p className="text-base font-bold text-white">{destLoc.name}</p>}
                    <p className="text-sm text-[#E5E5E5]">{destLoc.addr}</p>
                  </button>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <a href={getMapUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#4285f4]/10 border border-[#4285f4]/20 text-[#4285f4] font-mono text-base font-bold active:bg-[#4285f4]/20 transition-colors">
                      <MapsIcon /> Google Maps
                    </a>
                    <a href={getWazeUrl(viagem.destination)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#35c5f0]/10 border border-[#35c5f0]/20 text-[#35c5f0] font-mono text-base font-bold active:bg-[#35c5f0]/20 transition-colors">
                      <WazeIcon /> Waze
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="border-t border-[#2A2A2A] bg-[#111111] px-5 py-4 space-y-3">
              {/* Phone — click to copy */}
              {viagem.phone && (
                <button type="button" onClick={() => copyWithToast(`+${viagem.phone!.replace(/\D/g, "")}`)}
                  className="w-full h-14 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] font-mono text-base text-[#E5E5E5] active:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2.5">
                  <PhoneIcon /> +{viagem.phone.replace(/\D/g, "")}
                </button>
              )}

              {/* WhatsApp + SMS — smart templates */}
              <div className="grid grid-cols-2 gap-2.5">
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const drv = driverNameProp || viagem.driver || "o motorista";
                    window.open(generateDriverWhatsAppURL(viagem, drv), "_blank");
                  }}
                    className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] font-mono text-base font-bold active:bg-[#25d366]/20 transition-colors">
                    <WhatsAppIcon /> WhatsApp
                  </button>
                )}
                {viagem.phone && (
                  <button type="button" onClick={() => {
                    const drv = driverNameProp || viagem.driver || "o motorista";
                    window.open(generateDriverSmsURL(viagem, drv), "_blank");
                  }}
                    className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-[#8B9DAF]/10 border border-[#8B9DAF]/20 text-[#8B9DAF] font-mono text-base font-bold active:bg-[#8B9DAF]/20 transition-colors">
                    <SmsIcon /> SMS
                  </button>
                )}
              </div>

              {/* Admin-only: driver selector + dispatch */}
              {mode === "admin" && drivers && onSetDriver && (
                <select value={viagem.driver ?? ""} onChange={(e) => onSetDriver(cardId, e.target.value)}
                  className="w-full h-14 bg-black/50 border border-[#2A2A2A] rounded-xl px-4 font-mono text-base text-white/90 focus:outline-none focus:border-[#F0D030]/40">
                  <option value="">Atribuir motorista...</option>
                  {drivers.map((d) => <option key={d.name} value={d.name}>{d.name}{d.viatura ? ` · ${d.viatura}` : ""}</option>)}
                </select>
              )}
              {mode === "admin" && onDispatch && (
                <button type="button" onClick={() => onDispatch(cardId, tipo, viagem.client, lang, viagem.origin, hora)}
                  className="w-full h-14 rounded-xl border transition-colors font-mono text-base font-bold"
                  style={{ backgroundColor: `${c.hex}15`, color: c.hex, borderColor: `${c.hex}33` }}>
                  ⚡ Enviar Template Motorista
                </button>
              )}

              {/* Dar Baixa button (fallback for non-swipe) */}
              {!isDone && (
                <button type="button" onClick={() => onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId)}
                  className="w-full h-14 rounded-2xl bg-[#7EAA6E]/15 border border-[#7EAA6E]/20 text-[#7EAA6E] font-mono text-base font-bold active:bg-[#7EAA6E]/25 transition-colors">
                  ✅ Dar Baixa
                </button>
              )}
              {isDone && (
                <div className="w-full h-14 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#999] font-mono text-base">
                  ✅ Concluída
                </div>
              )}

              {/* No-Show button */}
              {!isDone && (
                <button type="button" onClick={() => setNoShowOpen(true)}
                  className="w-full h-12 rounded-xl bg-transparent border border-[#EF4444]/30 text-[#EF4444] font-mono text-sm font-bold hover:bg-[#EF4444]/15 active:bg-[#EF4444]/20 transition-colors">
                  🚫 Cliente No-Show
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No-Show Modal */}
      <NoShowModal
        isOpen={noShowOpen}
        tripId={cardId}
        clientName={viagem.client}
        driverName={driverNameProp || viagem.driver || ""}
        gasUrl={HUB_CENTRAL_URL}
        date={viagem.flightDate}
        onClose={() => setNoShowOpen(false)}
        onSubmit={(id) => {
          if (onNoShow) onNoShow(id);
          else onDarBaixa(viagem.id, viagem.rowIndex ?? "", id);
        }}
      />
    </motion.div>
  );
}
