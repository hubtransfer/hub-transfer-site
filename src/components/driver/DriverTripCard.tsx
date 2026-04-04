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
import SwipeBar from "@/components/shared/SwipeBar";
import DriverProgressBar from "@/components/shared/DriverProgressBar";



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
  CHEGADA: { text: "text-[#F5C518]", bg: "bg-[#F5C518]/15", border: "border-l-[#F5C518]", hex: "#F5C518" },
  RECOLHA: { text: "text-[#3B82F6]", bg: "bg-[#3B82F6]/15", border: "border-l-[#3B82F6]", hex: "#3B82F6" },
  TOUR:    { text: "text-[#A855F7]", bg: "bg-[#A855F7]/15", border: "border-l-[#A855F7]", hex: "#A855F7" },
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
  isHistorical?: boolean; // viewing past date — don't dim completed trips
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
  isHistorical = false,
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
    return computeFlightState(viagem.depTime || "", viagem.arrTime || "", hora, viagem.statusVoo || "", parseInt(viagem.atrasoMin || "0", 10) || 0, viagem.etaChegada || "", viagem.depActualFull || viagem.depTimeFull || "", viagem.etaChegadaFull || "");
  }, [hasFlight, viagem.depTime, viagem.arrTime, hora, viagem.statusVoo, viagem.atrasoMin, flightTick]);

  const arrTime = cleanHora(viagem.arrTime || "");
  const delayMin = parseInt(viagem.atrasoMin || "0", 10) || 0;
  const dColor = delayMin > 0 ? delayColor(delayMin) : "";

  // Adjusted pickup: only change if etaChegada+15min > original pickupTime
  const adjustedPickup = useMemo(() => {
    const eta = (viagem.etaChegada || viagem.arrTime || "").trim();
    if (!eta || !hora) return "";
    const etaM = (() => { const [h, m] = eta.split(":").map(Number); return isNaN(h) || isNaN(m) ? null : h * 60 + m; })();
    const pickM = (() => { const [h, m] = hora.split(":").map(Number); return isNaN(h) || isNaN(m) ? null : h * 60 + m; })();
    if (etaM === null || pickM === null) return "";
    const needed = etaM + 15; // ETA + 15min for disembark/baggage
    if (needed > pickM) {
      const h = Math.floor(needed / 60) % 24;
      const m = needed % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return ""; // original pickup is fine
  }, [viagem.etaChegada, viagem.arrTime, hora]);

  // Origin flag + IATA code from depIata
  const depIata = (viagem.depIata || "").toUpperCase().trim();
  const originFlag = getOriginFlag(depIata);

  // Departure delay + arrival original vs ETA
  const depDelayMin = parseInt(viagem.depDelay || "0", 10) || 0;
  const arrOriginal = (viagem.arrOriginal || "").trim();
  const etaChegada = (viagem.etaChegada || "").trim();
  const hasArrDiff = arrOriginal && etaChegada && arrOriginal !== etaChegada;
  const depActual = (viagem.depActual || "").trim();
  const depTime = (viagem.depTime || "").trim();
  const hasDepDiff = depActual && depTime && depActual !== depTime;
  const isLanded = (viagem.statusVoo || "").toUpperCase().replace(/[_\s]+/g, " ").includes("ATERRISADO") || (viagem.statusVoo || "").toUpperCase().includes("LANDED");

  // Display time: ETA for flights, pickupTime otherwise
  const displayTime = useMemo(() => {
    if (!hasFlight || !flight) return hora; // no flight → pickupTime
    if (isLanded) return viagem.arrTime || etaChegada || hora;
    if (etaChegada) return etaChegada;
    if (arrOriginal) return arrOriginal;
    if (viagem.arrTime) return viagem.arrTime;
    return hora;
  }, [hasFlight, flight, isLanded, viagem.arrTime, etaChegada, arrOriginal, hora]);


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
        ${isDone && !isHistorical ? "opacity-40 bg-[#1A1A1A] border-[#2A2A2A]" : ""}
        ${isDone && isHistorical ? "bg-[#1A1A1A] border-[#2A2A2A]" : ""}
        ${!isDone && isNext ? "bg-[#1A1A00] border-[#2A2A1A] ring-1 ring-[#F0D030]/20" : ""}
        ${!isDone && !isNext ? "bg-[#1A1A1A] border-[#2A2A2A] opacity-90" : ""}
        ${isSwipeActive || isCompleting ? `ring-2 ring-[${swipeColor}]/30` : ""}
      `}
      style={{
        transform: isSwiping ? `translateX(${swipeX}px)` : isCompleting ? "translateX(100vw)" : undefined,
        transition: isSwiping ? "none" : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      animate={isCompleting ? { x: "100vw", opacity: 0 } : { x: 0, opacity: (isDone && !isHistorical) ? 0.4 : 1 }}
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
        {/* L1: Source · Tipo + Driver Status Badge */}
        <div className="px-4 pt-3 flex items-center justify-between">
          <span className="font-semibold uppercase font-mono leading-none" style={{ fontSize: "0.65rem", letterSpacing: "0.5px", color: c.hex }}>{sourceLabel} · {tipo}</span>
          {viagem.statusMotorista && viagem.statusMotorista !== "AGUARDANDO" && (
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded" style={{
              backgroundColor: viagem.statusMotorista === "NO_LOCAL" ? "#3B82F620" : viagem.statusMotorista === "EM_VIAGEM" ? "#22C55E20" : viagem.statusMotorista === "FINALIZADO" ? "#D4A01720" : "#6B728020",
              color: viagem.statusMotorista === "NO_LOCAL" ? "#3B82F6" : viagem.statusMotorista === "EM_VIAGEM" ? "#22C55E" : viagem.statusMotorista === "FINALIZADO" ? "#D4A017" : "#6B7280",
            }}>
              {viagem.statusMotorista === "NO_LOCAL" ? "📍 No local" : viagem.statusMotorista === "EM_VIAGEM" ? "🚗 Em viagem" : viagem.statusMotorista === "FINALIZADO" ? "✅ Concluído" : viagem.statusMotorista}
            </span>
          )}
        </div>

        {/* L2: ETA time | name (clickable→nameplate) | driver+price */}
        <div className="flex items-center gap-3 px-4 py-1">
          <span className="flex-shrink-0 font-bold font-mono" style={{ fontSize: "1.5rem", color: isLanded ? "#22C55E" : c.hex }}>{displayTime}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-white truncate cursor-pointer hover:text-[#D4A017] transition-colors"
              onClick={(e) => { e.stopPropagation(); onShowNameplate(viagem.client, viagem.destination); }}>
              {viagem.client}
            </p>
          </div>
          <div className="flex-shrink-0 text-right flex flex-col items-end">
            {mode === "admin" && (
              viagem.driver
                ? <span className="font-mono text-[10px] font-semibold text-[#7EAA6E]/80 truncate max-w-[80px]">{viagem.driver}</span>
                : <span className="font-mono text-[10px] text-[#555]">—</span>
            )}
            {price > 0 && <span className="font-mono text-sm font-bold text-[#F0D030]">€{price}</span>}
          </div>
        </div>

        {/* L3-L6: Flight block (collapsed, CHEGADA only) */}
        {!expanded && hasFlight && flight && tipo === "CHEGADA" && (
          <div className="px-4 pb-3 pt-1">
            {flight.noData ? (
              <p className="font-mono text-xs text-[#888] italic">✈️ {viagem.flight} · Dados em breve</p>
            ) : flight.cancelled ? (
              <div className="flex items-center gap-2">
                <div className="flex-1" style={{ height: "3px", borderRadius: "2px", backgroundColor: "#EF4444", opacity: 0.3 }} />
                <span className="font-mono text-[10px] text-[#EF4444] font-bold">❌ CANCELADO</span>
              </div>
            ) : (
              <div className="space-y-1">
                {/* L1: Times — dep left, arr right */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasDepDiff ? (
                      <><span className="font-mono text-xs line-through text-gray-500">{depTime}</span><span className="font-mono text-sm font-semibold text-white">→ {depActual}</span></>
                    ) : depTime ? (
                      <span className="font-mono text-xs text-gray-400">{depTime}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {hasArrDiff ? (
                      <><span className="font-mono text-xs line-through text-gray-500">{arrOriginal}</span><span className="font-mono text-sm font-semibold text-white">→ {etaChegada}</span></>
                    ) : (
                      <span className="font-mono text-xs text-gray-400">{etaChegada || viagem.arrTime || ""}</span>
                    )}
                  </div>
                </div>

                {/* L2: Flight bar — flag+IATA | progress | flag+IATA */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm leading-none">{originFlag || "🌍"}</span>
                    <span className="font-mono text-sm font-bold text-[#D4A017]">{depIata}</span>
                  </div>
                  <div className="flex-1 relative" style={{ height: "3px", borderRadius: "2px", backgroundColor: "#333" }}>
                    <div className="h-full transition-all duration-[2s] ease-in-out" style={{ width: `${Math.max(flight.progress, 2)}%`, backgroundColor: flight.color, borderRadius: "2px" }} />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={flight.color}
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-[2s] ease-in-out"
                      style={{ left: `calc(${Math.max(flight.progress, 2)}% - 6px)`, filter: "drop-shadow(0 0 2px rgba(0,0,0,.7))" }}>
                      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm leading-none">🇵🇹</span>
                    <span className="font-mono text-sm font-bold text-[#D4A017]">LIS</span>
                  </div>
                </div>

                {/* L3: Driver progress bar */}
                <DriverProgressBar statusMotorista={viagem.statusMotorista} />

                {/* L4: Pickup */}
                {hora && (
                  <p className="text-center font-mono text-sm" style={{ color: "#D4A017" }}>🚗 Pickup: {adjustedPickup || hora}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Non-flight cards: just pickup below name */}
        {!expanded && (!hasFlight || !flight || tipo !== "CHEGADA") && hora && (
          <div className="px-4 pb-2" />
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

            {/* ── Flight block — CHEGADA with flight only ── */}
            {hasFlight && flight && tipo === "CHEGADA" && (
              <div className="px-4 py-3 border-t border-[#2A2A2A]" style={{ backgroundColor: `${c.hex}06` }}>
                {flight.noData ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">🌍</span>
                    <div className="flex-1">
                      <p className="text-center mb-1.5"><a href={`https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-sm text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">{viagem.flight}</a></p>
                      <p className="text-center font-mono text-[11px] italic font-medium text-[#E0E0E0]">✈️ Acompanhamento do voo activa em breve</p>
                    </div>
                    <div className="text-center min-w-[48px]">
                      <p className="text-xl leading-none mb-1">🇵🇹</p>
                      <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>LIS</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ETA big time + flight number */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-sm text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">
                        {viagem.flight}
                      </a>
                      {depDelayMin > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-mono font-bold">+{depDelayMin}min partida</span>
                      )}
                    </div>
                    <p className="text-center font-mono text-[10px] mb-3" style={{ color: flight.color }}>
                      {flight.statusText}
                    </p>

                    {/* Progress bar: Origin → bar → Destination */}
                    <div className="flex items-start gap-3">
                      {/* LEFT: Origin */}
                      <div className="flex-shrink-0 text-center min-w-[52px]">
                        <p className="text-xl leading-none mb-1">{originFlag || "🌍"}</p>
                        <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>{depIata || "???"}</p>
                        {viagem.depTime && (
                          viagem.depActual && viagem.depActual !== viagem.depTime ? (
                            <div className="mt-1">
                              <p className="font-mono text-[10px] line-through text-[#666]">{viagem.depTime}</p>
                              <p className="font-mono text-xs font-bold text-[#F5C518]">{viagem.depActual}</p>
                            </div>
                          ) : (
                            <p className="font-mono text-xs text-[#A0A0A0] mt-1">{viagem.depTime}</p>
                          )
                        )}
                        <p className="font-mono text-[8px] text-[#555] mt-0.5 uppercase">Decolagem</p>
                      </div>

                      {/* CENTER: Thin progress bar */}
                      <div className="flex-1 flex items-center">
                        <div className="w-full cursor-pointer"
                          onClick={() => viagem.flight && window.open(`https://www.google.com/search?q=flight+${encodeURIComponent(viagem.flight)}`, "_blank")}>
                          {flight.cancelled ? (
                            <div className="h-[3px] rounded bg-[#EF4444]/25" />
                          ) : (
                            <div className="relative w-full overflow-visible" style={{ height: "3px", borderRadius: "2px", backgroundColor: "#333" }}>
                              <div className="h-full transition-all duration-[2s] ease-in-out" style={{ width: `${Math.max(flight.progress, 2)}%`, backgroundColor: flight.color, borderRadius: "2px" }} />
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={flight.color}
                                className="absolute top-1/2 -translate-y-1/2 transition-all duration-[2s] ease-in-out"
                                style={{ left: `calc(${Math.max(flight.progress, 2)}% - 7px)`, filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }}>
                                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: Destination */}
                      <div className="flex-shrink-0 text-center min-w-[52px]">
                        <p className="text-xl leading-none mb-1">🇵🇹</p>
                        <p className="font-mono text-xs font-bold" style={{ color: c.hex }}>LIS</p>
                        {hasArrDiff ? (
                          <div className="mt-1">
                            <p className="font-mono text-[10px] line-through text-[#666]">{arrOriginal}</p>
                            <p className="font-mono text-xs font-bold text-[#F5C518]">{etaChegada}</p>
                          </div>
                        ) : (
                          <p className="font-mono text-xs text-[#A0A0A0] mt-1">{etaChegada || viagem.arrTime || ""}</p>
                        )}
                        <p className="font-mono text-[8px] text-[#555] mt-0.5 uppercase">Aterragem</p>
                      </div>
                    </div>

                    {(viagem.depTerminal || viagem.arrTerminal) && (
                      <div className="flex justify-between font-mono text-[10px] text-[#999] mt-2 px-1">
                        {viagem.depTerminal && <span>T{viagem.depTerminal}</span>}
                        {viagem.arrTerminal && <span>T{viagem.arrTerminal}</span>}
                      </div>
                    )}

                    {/* Pickup time — separate below flight block */}
                    <div className="mt-2 pt-2 border-t border-[#2A2A2A]/50 text-center">
                      <span className="font-mono text-xs" style={{ color: "#D4A017" }}>🚗 Pickup: {adjustedPickup || hora}</span>
                    </div>
                  </>
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

              {/* Swipe bar — both driver and admin modes */}
              <SwipeBar
                tripId={cardId}
                rowIndex={viagem.rowIndex ?? ""}
                initialStatus={viagem.statusMotorista || viagem.status}
                origin={viagem.origin}
                destination={viagem.destination}
                onStatusChange={(newStatus) => {
                  if (newStatus === "FINALIZADO") onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId);
                }}
              />

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
