"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { HUB_CENTRAL_URL } from "@/lib/trips";

type TripStatus = "PENDENTE" | "NO_LOCAL" | "EM_VIAGEM" | "FINALIZADO";

interface SwipeBarProps {
  tripId: string;
  rowIndex: string;
  initialStatus?: string;
  onStatusChange?: (newStatus: TripStatus) => void;
}

const STEPS: { from: TripStatus; to: TripStatus; label: string; color: string; textColor: string }[] = [
  { from: "PENDENTE",   to: "NO_LOCAL",   label: "Arraste para confirmar chegada",  color: "#D4A017", textColor: "text-gray-400" },
  { from: "NO_LOCAL",   to: "EM_VIAGEM",  label: "Arraste quando o cliente entrar", color: "#3B82F6", textColor: "text-blue-400" },
  { from: "EM_VIAGEM",  to: "FINALIZADO", label: "Arraste ao chegar no destino",    color: "#22C55E", textColor: "text-green-400" },
];

const THRESHOLD = 0.85;
const DOT_COUNT = 12;

function getGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function sendStatus(rowIndex: string, status: string, lat?: number, lng?: number) {
  try {
    const url = `${HUB_CENTRAL_URL}?action=updateDriverStatus&rowIndex=${encodeURIComponent(rowIndex)}&status=${encodeURIComponent(status)}&lat=${lat ?? ""}&lng=${lng ?? ""}&t=${Date.now()}`;
    await fetch(url, { redirect: "follow" });
  } catch (err) {
    console.error("[SwipeBar] sendStatus error:", err);
  }
}

function mapInitialStatus(s: string): TripStatus {
  const u = (s || "").toUpperCase().replace(/[_\s]+/g, "_");
  if (u === "NO_LOCAL" || u.includes("NO LOCAL") || u.includes("CHEGOU")) return "NO_LOCAL";
  if (u === "EM_VIAGEM" || u.includes("EM VIAGEM") || u.includes("A CAMINHO")) return "EM_VIAGEM";
  if (u === "FINALIZADO" || u === "CONCLUIDA" || u.includes("FINALIZOU")) return "FINALIZADO";
  return "PENDENTE";
}

/* Plane SVG pointing right (flat/minimal) */
const PlaneIcon = ({ size = 22, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
  </svg>
);

export default function SwipeBar({ tripId, rowIndex, initialStatus, onStatusChange }: SwipeBarProps) {
  const [status, setStatus] = useState<TripStatus>(() => mapInitialStatus(initialStatus || ""));
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const widthRef = useRef(0);

  const stepIdx = STEPS.findIndex((s) => s.from === status);
  const step = stepIdx >= 0 ? STEPS[stepIdx] : null;
  const isDone = status === "FINALIZADO";

  useEffect(() => {
    setStatus(mapInitialStatus(initialStatus || ""));
  }, [initialStatus]);

  const onStart = useCallback((clientX: number) => {
    if (!step || sending || isDone) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    widthRef.current = rect.width - 48;
    startXRef.current = clientX;
    setDragging(true);
  }, [step, sending, isDone]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging) return;
    setDragX(Math.max(0, Math.min(clientX - startXRef.current, widthRef.current)));
  }, [dragging]);

  const onEnd = useCallback(async () => {
    if (!dragging || !step) { setDragging(false); setDragX(0); return; }
    setDragging(false);
    const pct = dragX / widthRef.current;

    if (pct >= THRESHOLD) {
      setSending(true);
      try { navigator.vibrate?.(200); } catch { /* */ }
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      const coords = await getGPS();
      await sendStatus(rowIndex, step.to, coords?.lat, coords?.lng);
      setStatus(step.to);
      onStatusChange?.(step.to);
      setSending(false);
    }
    setDragX(0);
  }, [dragging, dragX, step, rowIndex, onStatusChange]);

  // Touch
  const onTouchStart = useCallback((e: React.TouchEvent) => onStart(e.touches[0].clientX), [onStart]);
  const onTouchMove = useCallback((e: React.TouchEvent) => onMove(e.touches[0].clientX), [onMove]);
  const onTouchEnd = useCallback(() => onEnd(), [onEnd]);

  // Mouse
  const onMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); onStart(e.clientX); }, [onStart]);
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onMove(e.clientX);
    const up = () => onEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, onMove, onEnd]);

  const pct = widthRef.current > 0 ? dragX / widthRef.current : 0;
  const activeColor = step?.color || "#D4A017";

  // Done state
  if (isDone) {
    return (
      <div className="space-y-1.5">
        <div className="relative w-full h-12 rounded-full bg-[#1A1A0A] border border-[#D4A017]/30 flex items-center justify-center overflow-hidden">
          {/* All dots gold */}
          <div className="absolute inset-0 flex items-center justify-evenly px-6 pointer-events-none">
            {Array.from({ length: DOT_COUNT }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "#D4A017" }} />
            ))}
          </div>
          <span className="relative z-10 font-mono text-sm font-bold text-[#D4A017]">✅ Viagem concluída</span>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div ref={containerRef} className="relative w-full h-12 rounded-full select-none overflow-hidden"
        style={{
          backgroundColor: "#111",
          border: `1px solid ${flash ? activeColor : "rgba(100,100,100,0.3)"}`,
          transition: "border-color 0.4s",
          boxShadow: flash ? `0 0 20px ${activeColor}40` : "none",
        }}>

        {/* Dotted track */}
        <div className="absolute inset-0 flex items-center justify-evenly px-6 pointer-events-none">
          {Array.from({ length: DOT_COUNT }).map((_, i) => {
            const dotPct = (i + 1) / DOT_COUNT;
            const isLit = pct >= dotPct;
            return (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-150"
                style={{ backgroundColor: isLit ? activeColor : "#333", opacity: isLit ? 1 : 0.3 }} />
            );
          })}
        </div>

        {/* Draggable plane thumb */}
        <div
          className="absolute top-1 left-1 w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{
            backgroundColor: activeColor,
            transform: `translateX(${dragX}px)${dragging ? " scale(1.1)" : ""}`,
            transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 12px ${activeColor}40`,
            opacity: sending ? 0.6 : 1,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          {sending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <PlaneIcon size={20} color="#fff" />
          )}
        </div>

        {/* Right target indicator */}
        {!dragging && !sending && (
          <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${activeColor}30` }}>
              <span className="text-xs" style={{ color: `${activeColor}50` }}>→</span>
            </div>
          </div>
        )}

        {/* Near-complete hint */}
        {pct >= THRESHOLD && dragging && (
          <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
            <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${activeColor}30` }}>
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Label below bar */}
      <p className={`text-center text-sm font-mono transition-all duration-300 ${step.textColor}`}>
        {sending ? "A enviar..." : step.label}
      </p>
    </div>
  );
}
