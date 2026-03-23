"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import type { HubViagem } from "@/lib/trips";
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

/* ------------------------------------------------------------------ */
/*  Country code → flag emoji                                          */
/* ------------------------------------------------------------------ */

function countryFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "🌐";
  const upper = iso.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/* ------------------------------------------------------------------ */
/*  Flight status color for strip progress bar                         */
/* ------------------------------------------------------------------ */

function flightBarColor(progress: number, status?: string): { color: string; pulse: boolean } {
  const st = (status || "").toLowerCase();
  if (st === "landed" || st === "aterrou" || progress >= 95) return { color: "#10b981", pulse: false };
  if (progress <= 5 && st !== "boarding") return { color: "#374151", pulse: false };
  return { color: "#f59e0b", pulse: true }; // amber + pulse when in flight
}

/* Countdown: "em 45min" or "em 2h10" — returns null if in the past or invalid */
function formatCountdown(arrTime: string): string | null {
  if (!arrTime || arrTime === "—:—") return null;
  const parts = arrTime.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  // Handle overnight
  if (target.getTime() < now.getTime() - 60000) return null;

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalMin = Math.round(diffMs / 60000);
  if (totalMin < 1) return null;
  if (totalMin < 60) return `em ${totalMin}min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `em ${hrs}h${String(mins).padStart(2, "0")}` : `em ${hrs}h`;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DriverTripCardProps {
  viagem: HubViagem;
  isHero: boolean;
  onDarBaixa: (id: string, rowIndex: string, cardId: string) => void;
  onShowNameplate: (name: string) => void;
  onExpand?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Color maps                                                         */
/* ------------------------------------------------------------------ */

const TYPE_COLORS = {
  CHEGADA: { text: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", border: "border-l-[#f59e0b]", hex: "#f59e0b" },
  RECOLHA: { text: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-l-[#10b981]", hex: "#10b981" },
  TOUR:    { text: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-l-[#a855f7]", hex: "#a855f7" },
} as const;

function getTypeStyle(tipo: string) {
  return TYPE_COLORS[tipo as keyof typeof TYPE_COLORS] ?? { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-l-gray-500", hex: "#999" };
}

/* ------------------------------------------------------------------ */
/*  Swipe-to-complete constants                                        */
/* ------------------------------------------------------------------ */

const HOLD_DURATION = 1000;
const SWIPE_THRESHOLD = 120;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded bg-black/40 border border-white/10 whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

function FullWidthNavBtn({ href, label, color }: { href: string; label: string; color: "blue" | "cyan" }) {
  const c = color === "blue"
    ? "bg-blue-500/15 text-blue-400 border-blue-500/20 active:bg-blue-500/30"
    : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20 active:bg-cyan-500/30";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 font-mono text-sm font-bold h-14 rounded-xl border transition-colors ${c}`}
    >
      {label === "Maps" ? "\uD83D\uDDFA" : "\uD83D\uDD37"} {label}
    </a>
  );
}

function FlightProgress({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f59e0b]/60 transition-all duration-700"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white shadow-sm shadow-white/50"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function DriverTripCard({
  viagem,
  isHero,
  onDarBaixa,
  onShowNameplate,
  onExpand,
}: DriverTripCardProps) {
  /* Tick every 30s to update countdown */
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

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

  /* ---- Swipe-to-complete state ---- */
  const [swipeState, setSwipeState] = useState<"idle" | "holding" | "armed" | "swiping" | "completing">("idle");
  const [swipeX, setSwipeX] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDone || !isHero) return;
      startX.current = e.clientX;
      setSwipeState("holding");
      holdTimer.current = setTimeout(() => {
        setSwipeState("armed");
      }, HOLD_DURATION);
    },
    [isDone, isHero],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (swipeState === "holding") {
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
    },
    [swipeState, clearHold],
  );

  const handlePointerUp = useCallback(() => {
    clearHold();
    if (swipeState === "swiping" && swipeX >= SWIPE_THRESHOLD) {
      setSwipeState("completing");
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

  /* ================================================================ */
  /*  STRIP: flight info for CHEGADA                                   */
  /* ================================================================ */
  const stripDepIata = useMemo(() => {
    if (tipo !== "CHEGADA") return null;
    const raw = (viagem.depAirport || viagem.depIata || depAirport || "").toUpperCase();
    if (!raw || raw === "???") return null;
    return raw;
  }, [tipo, viagem.depAirport, viagem.depIata, depAirport]);

  const stripIataInfo = useMemo(() => {
    if (!stripDepIata) return null;
    return getIataInfo(stripDepIata);
  }, [stripDepIata]);

  const stripArrTime = cleanHora(viagem.arrTime || "");
  const stripBar = flightBarColor(flightProgress, viagem.status);
  const hasFlightData = tipo === "CHEGADA" && !!(stripDepIata || (viagem.arrTime && viagem.arrTime !== "—:—"));
  const countdown = stripArrTime !== "—:—" ? formatCountdown(stripArrTime) : null;

  /* ================================================================ */
  /*  STRIP CARD (compact)                                             */
  /* ================================================================ */
  if (!isHero) {
    const isCHEGADA = tipo === "CHEGADA";
    const flag = stripIataInfo ? countryFlag(stripIataInfo.c) : null;

    return (
      <button
        type="button"
        onClick={() => onExpand?.()}
        className={`
          w-full flex flex-col bg-[#111] rounded-2xl border border-white/5
          border-l-4 ${ts.border}
          ${isDone ? "opacity-40" : ""}
          active:bg-white/5 transition-all overflow-hidden
        `}
      >
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Left: time */}
          <div className="flex-shrink-0 min-w-[56px]">
            <span className={`text-xl font-bold font-mono ${ts.text}`}>{hora}</span>
          </div>

          {/* Middle: name + badge */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-base font-bold text-white truncate">{viagem.client}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ts.bg} ${ts.text}`}>
                {tipo}
              </span>
              {viagem.pax && (
                <span className="text-[10px] font-mono text-white/40">{viagem.pax} pax</span>
              )}
            </div>
          </div>

          {/* Right: price or arrow */}
          <div className="flex-shrink-0 text-right">
            {price > 0 ? (
              <span className="font-mono text-sm font-bold text-[#F5C518]">&euro;{price}</span>
            ) : (
              <span className="text-lg text-white/30">&#8250;</span>
            )}
          </div>
        </div>

        {/* Flight progress row (CHEGADA with flight data only) */}
        {hasFlightData && (
          <div className="flex items-center gap-2.5 px-4 pb-3 pt-0.5">
            {/* Origin: flag + IATA */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-[52px]">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <span className="font-mono text-xs font-bold text-white/60">
                {stripDepIata || "???"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] relative overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${stripBar.pulse ? "animate-flight-pulse" : ""}`}
                style={{
                  width: `${Math.max(flightProgress, 4)}%`,
                  backgroundColor: stripBar.color,
                }}
              />
              {/* Plane icon */}
              {flightProgress > 8 && flightProgress < 92 && (
                <span
                  className="absolute top-1/2 text-[9px] leading-none drop-shadow-sm"
                  style={{
                    left: `calc(${flightProgress}% - 5px)`,
                    transform: "translateY(-50%)",
                    filter: "drop-shadow(0 0 2px rgba(0,0,0,.8))",
                  }}
                >
                  ✈
                </span>
              )}
            </div>

            {/* Destination: LIS */}
            <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: stripBar.color }}>
              LIS
            </span>

            {/* ETA: large arrival time + countdown */}
            <div className="flex flex-col items-end flex-shrink-0 min-w-[48px]">
              {stripArrTime && stripArrTime !== "—:—" && (
                <span className="font-mono text-base font-black leading-none" style={{ color: stripBar.color }}>
                  {stripArrTime}
                </span>
              )}
              {countdown && (
                <span className="font-mono text-[9px] leading-tight mt-0.5" style={{ color: `${stripBar.color}99` }}>
                  {countdown}
                </span>
              )}
            </div>
          </div>
        )}
      </button>
    );
  }

  /* ================================================================ */
  /*  HERO CARD (fills viewport)                                       */
  /* ================================================================ */

  const originLoc = splitLocation(viagem.origin || "");
  const destLoc = splitLocation(viagem.destination || "");

  const cardBorderColor = isActive || isCompleting ? "border-l-[#ef4444]" : ts.border;
  const cardBgOverlay = isActive || isCompleting ? "ring-2 ring-[#ef4444]/40 bg-[#ef4444]/5" : "";

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`
        relative bg-[#111] rounded-2xl border border-white/5 overflow-hidden
        border-l-[6px] ${cardBorderColor}
        min-h-[calc(100vh-140px)] flex flex-col
        ${isDone ? "opacity-40" : ""}
        ${cardBgOverlay}
        ${isCompleting ? "translate-x-[100vw]" : ""}
        transition-all duration-200 select-none touch-none
      `}
      style={{
        transform: isSwiping ? `translateX(${swipeX}px)` : isCompleting ? "translateX(100vw)" : undefined,
        transition: isSwiping ? "none" : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ---- Swipe indicator overlay ---- */}
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
              <span className="animate-pulse">Segura e desliza {"\u2192"}</span>
            )}
            {isSwiping && swipeProgress < 1 && (
              <>
                <span>Deslize para concluir</span>
                <span className="text-lg">{"\u2192"}</span>
              </>
            )}
            {isSwiping && swipeProgress >= 1 && (
              <>
                <span>Solte para concluir</span>
                <span className="text-lg">{"\u2713"}</span>
              </>
            )}
          </div>
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

      {/* Hold indicator */}
      {isHolding && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-2 border-[#ef4444]/30 animate-pulse" />
      )}

      {/* ============================================================ */}
      {/*  GLANCE ZONE (top ~30%)                                       */}
      {/* ============================================================ */}
      <div className="px-5 pt-5 pb-3 space-y-3">
        {/* Type badge */}
        <span
          className={`inline-block text-xs font-bold uppercase px-3 py-1 rounded-full ${ts.bg} ${ts.text}`}
        >
          {tipo}
        </span>

        {/* MASSIVE TIME */}
        <div>
          <span className={`font-mono text-5xl font-black leading-none ${ts.text}`}>
            {hora}
          </span>
        </div>

        {/* Client name — clickable for nameplate */}
        <button
          type="button"
          onClick={() => onShowNameplate(viagem.client)}
          className="text-2xl font-bold text-white text-left truncate block w-full active:text-[#F5C518] transition-colors"
        >
          {viagem.client}
        </button>
      </div>

      {/* ============================================================ */}
      {/*  ROUTE ZONE (middle ~40%)                                     */}
      {/* ============================================================ */}
      <div className="flex-1 px-5 pb-3 space-y-3 overflow-y-auto">
        {/* CHEGADA */}
        {tipo === "CHEGADA" && (
          <div className="space-y-3">
            {/* Flight info block */}
            <div className="bg-black/40 rounded-xl p-4 space-y-3" style={{ borderLeft: `3px solid ${ts.hex}30` }}>
              <div className="flex items-center justify-between text-xs">
                <div className="text-center">
                  <p className="font-mono font-bold text-base" style={{ color: ts.hex }}>
                    {(viagem.depAirport || viagem.depIata || depAirport || "???").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">{viagem.depCity || "Partida"}</p>
                  {viagem.depTime && (
                    <p className="font-mono text-xs text-white/50 mt-0.5">{viagem.depTime}</p>
                  )}
                </div>
                <div className="flex-1 mx-4">
                  <FlightProgress progress={flightProgress} />
                  {viagem.flight && (
                    <p className="text-center font-mono text-xs mt-1" style={{ color: `${ts.hex}99` }}>
                      {viagem.flight}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-base" style={{ color: ts.hex }}>
                    {(viagem.arrAirport || viagem.arrIata || "LIS").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">{viagem.arrCity || "Lisboa"}</p>
                  {viagem.arrTime && (
                    <p className="font-mono text-xs text-white/50 mt-0.5">{viagem.arrTime}</p>
                  )}
                </div>
              </div>
              {(viagem.depTerminal || viagem.arrTerminal) && (
                <div className="flex justify-between font-mono text-xs text-white/30">
                  {viagem.depTerminal && <span>T{viagem.depTerminal}</span>}
                  {viagem.arrTerminal && <span>T{viagem.arrTerminal}</span>}
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              {viagem.origin && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Origem</p>
                  {originLoc.name && <p className="text-sm font-bold text-white/90">{originLoc.name}</p>}
                  {originLoc.addr && <p className="text-xs text-white/50">{originLoc.addr}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <FullWidthNavBtn href={getMapUrl(viagem.origin)} label="Maps" color="blue" />
                    <FullWidthNavBtn href={getWazeUrl(viagem.origin)} label="Waze" color="cyan" />
                  </div>
                </div>
              )}
              {viagem.destination && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Destino</p>
                  {destLoc.name && <p className="text-sm font-bold text-white/90">{destLoc.name}</p>}
                  {destLoc.addr && <p className="text-xs text-white/50">{destLoc.addr}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <FullWidthNavBtn href={getMapUrl(viagem.destination)} label="Maps" color="blue" />
                    <FullWidthNavBtn href={getWazeUrl(viagem.destination)} label="Waze" color="cyan" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECOLHA */}
        {tipo === "RECOLHA" && (
          <div className="space-y-3">
            {/* Visual A->B route */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: ts.hex }} />
              <div className="flex-1 h-px relative" style={{ background: `linear-gradient(90deg, ${ts.hex}99, ${ts.hex}33, ${ts.hex}99)` }}>
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-base" style={{ color: `${ts.hex}80` }}>
                  {"\u2192"}
                </span>
              </div>
              <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: ts.hex }} />
            </div>

            {/* Addresses */}
            {viagem.origin && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Pickup</p>
                {originLoc.name && <p className="text-sm font-bold text-white/90">{originLoc.name}</p>}
                {originLoc.addr && <p className="text-xs text-white/50">{originLoc.addr}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <FullWidthNavBtn href={getMapUrl(viagem.origin)} label="Maps" color="blue" />
                  <FullWidthNavBtn href={getWazeUrl(viagem.origin)} label="Waze" color="cyan" />
                </div>
              </div>
            )}
            {viagem.destination && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Destino</p>
                {destLoc.name && <p className="text-sm font-bold text-white/90">{destLoc.name}</p>}
                {destLoc.addr && <p className="text-xs text-white/50">{destLoc.addr}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <FullWidthNavBtn href={getMapUrl(viagem.destination)} label="Maps" color="blue" />
                  <FullWidthNavBtn href={getWazeUrl(viagem.destination)} label="Waze" color="cyan" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TOUR */}
        {tipo === "TOUR" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2" style={{ color: ts.hex }}>
              <span className="text-2xl">{"\uD83E\uDDED"}</span>
              <span className="font-mono text-sm uppercase tracking-wider">Tour</span>
            </div>
            {viagem.origin && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Ponto de encontro</p>
                {originLoc.name && <p className="text-sm font-bold text-white/90">{originLoc.name}</p>}
                {originLoc.addr && <p className="text-xs text-white/50">{originLoc.addr}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <FullWidthNavBtn href={getMapUrl(viagem.origin)} label="Maps" color="blue" />
                  <FullWidthNavBtn href={getWazeUrl(viagem.origin)} label="Waze" color="cyan" />
                </div>
              </div>
            )}
            {viagem.destination && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Destino</p>
                {destLoc.name && <p className="text-sm font-bold text-white/90">{destLoc.name}</p>}
                {destLoc.addr && <p className="text-xs text-white/50">{destLoc.addr}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <FullWidthNavBtn href={getMapUrl(viagem.destination)} label="Maps" color="blue" />
                  <FullWidthNavBtn href={getWazeUrl(viagem.destination)} label="Waze" color="cyan" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  ACTION ZONE (bottom ~30%, thumb-reachable)                    */}
      {/* ============================================================ */}
      <div className="border-t border-white/5 bg-black/30 px-5 py-4 space-y-3">
        {/* Phone number — tap to copy */}
        {viagem.phone && (
          <button
            type="button"
            onClick={() => copyToClipboard(viagem.phone!)}
            className="w-full h-11 flex items-center justify-center gap-2 font-mono text-sm text-white/70 bg-white/5 rounded-xl active:bg-white/10 transition-colors"
          >
            {"\uD83D\uDCDE"} {viagem.phone}
          </button>
        )}

        {/* WhatsApp + SMS row */}
        {viagem.phone && (
          <div className="flex gap-2">
            <a
              href={getWhatsAppUrl(
                viagem.phone,
                (() => {
                  const templateType = tipo as "CHEGADA" | "RECOLHA";
                  const resolvedLang = resolveLanguage(lang, viagem.phone);
                  const fn = TEMPLATES[templateType]?.[resolvedLang] || TEMPLATES[templateType]?.EN;
                  return fn ? fn(viagem.driver || "o motorista", viagem.client, viagem.origin, hora) : "";
                })(),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 flex items-center justify-center gap-2 font-mono text-sm font-bold rounded-xl bg-[#25d366]/15 text-[#25d366] active:bg-[#25d366]/25 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={getSmsUrl(
                viagem.phone,
                (() => {
                  const templateType = tipo as "CHEGADA" | "RECOLHA";
                  const resolvedLang = resolveLanguage(lang, viagem.phone);
                  const fn = TEMPLATES[templateType]?.[resolvedLang] || TEMPLATES[templateType]?.EN;
                  return fn ? fn(viagem.driver || "o motorista", viagem.client, viagem.origin, hora) : "";
                })(),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 flex items-center justify-center gap-2 font-mono text-sm font-bold rounded-xl bg-[#3b82f6]/15 text-[#3b82f6] active:bg-[#3b82f6]/25 transition-colors"
            >
              SMS
            </a>
          </div>
        )}

        {/* Price badge */}
        {price > 0 && (
          <div className="flex items-center justify-center">
            <span className="text-[#F5C518] font-bold font-mono text-lg">
              {price}&euro;
            </span>
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {viagem.flight && <Tag><span style={{ color: ts.hex }}>{viagem.flight}</span></Tag>}
          {lang && <Tag><span className="text-white/60">{lang}</span></Tag>}
          {viagem.pax && <Tag><span className="text-white/60">{viagem.pax} pax</span></Tag>}
          {viagem.bags && <Tag><span className="text-white/60">{viagem.bags} bags</span></Tag>}
        </div>

        {/* Done / Dar Baixa fallback button */}
        {isDone && (
          <div className="w-full h-12 flex items-center justify-center font-mono text-sm font-bold rounded-xl bg-white/5 text-white/30">
            {"\u2705"} Conclu\u00EDda
          </div>
        )}
        {!isDone && (
          <button
            type="button"
            onClick={() => onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId)}
            className="w-full h-12 flex items-center justify-center font-mono text-sm font-bold rounded-xl bg-[#10b981]/15 text-[#10b981] active:bg-[#10b981]/25 transition-colors"
          >
            {"\u2705"} Dar Baixa
          </button>
        )}
      </div>
    </div>
  );
}
