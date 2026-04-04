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

const STEPS: { from: TripStatus; to: TripStatus; label: string; icon: string; bg: string; thumb: string }[] = [
  { from: "PENDENTE",   to: "NO_LOCAL",   label: "Arraste para confirmar chegada", icon: "📍", bg: "#374151", thumb: "#6B7280" },
  { from: "NO_LOCAL",   to: "EM_VIAGEM",  label: "Arraste quando o cliente entrar", icon: "🚗", bg: "#1E3A5F", thumb: "#3B82F6" },
  { from: "EM_VIAGEM",  to: "FINALIZADO", label: "Arraste ao chegar ao destino",   icon: "🏁", bg: "#14532D", thumb: "#22C55E" },
];

const DONE_BG = "#422006";
const DONE_THUMB = "#D4A017";
const THRESHOLD = 0.85;

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

export default function SwipeBar({ tripId, rowIndex, initialStatus, onStatusChange }: SwipeBarProps) {
  const [status, setStatus] = useState<TripStatus>(() => mapInitialStatus(initialStatus || ""));
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const widthRef = useRef(0);

  // Find current step
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
    widthRef.current = rect.width - 56; // container width minus thumb
    startXRef.current = clientX;
    setDragging(true);
  }, [step, sending, isDone]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging) return;
    const dx = Math.max(0, Math.min(clientX - startXRef.current, widthRef.current));
    setDragX(dx);
  }, [dragging]);

  const onEnd = useCallback(async () => {
    if (!dragging || !step) { setDragging(false); setDragX(0); return; }
    setDragging(false);
    const pct = dragX / widthRef.current;

    if (pct >= THRESHOLD) {
      // Confirmed!
      setSending(true);
      try { navigator.vibrate?.(200); } catch { /* */ }
      const coords = await getGPS();
      await sendStatus(rowIndex, step.to, coords?.lat, coords?.lng);
      setStatus(step.to);
      onStatusChange?.(step.to);
    }
    setDragX(0);
    setSending(false);
  }, [dragging, dragX, step, rowIndex, onStatusChange]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => onStart(e.touches[0].clientX), [onStart]);
  const handleTouchMove = useCallback((e: React.TouchEvent) => onMove(e.touches[0].clientX), [onMove]);
  const handleTouchEnd = useCallback(() => onEnd(), [onEnd]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); onStart(e.clientX); }, [onStart]);
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onMove(e.clientX);
    const up = () => onEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, onMove, onEnd]);

  const pct = widthRef.current > 0 ? dragX / widthRef.current : 0;

  if (isDone) {
    return (
      <div className="w-full h-14 rounded-full flex items-center justify-center gap-2 font-mono text-sm font-bold"
        style={{ backgroundColor: DONE_BG, color: DONE_THUMB }}>
        ✅ Viagem concluída
      </div>
    );
  }

  if (!step) return null;

  return (
    <div ref={containerRef} className="relative w-full h-14 rounded-full overflow-hidden select-none"
      style={{ backgroundColor: step.bg }}>
      {/* Fill */}
      <div className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{ width: `${Math.max((dragX / (widthRef.current || 1)) * 100, 0)}%`, backgroundColor: step.thumb, opacity: 0.2, transition: dragging ? "none" : "width 0.3s ease" }} />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white/50 text-sm font-mono font-medium tracking-wide">
          {sending ? "A enviar..." : step.label}
        </span>
      </div>

      {/* Draggable thumb */}
      <div
        className="absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-grab active:cursor-grabbing shadow-lg"
        style={{
          backgroundColor: step.thumb,
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: sending ? 0.5 : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {sending ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>{step.icon}</span>
        )}
      </div>

      {/* Right arrow hint */}
      {!dragging && !sending && (
        <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none">
          <span className="text-white/20 text-lg">→→</span>
        </div>
      )}

      {/* Completion hint when near threshold */}
      {pct >= THRESHOLD && dragging && (
        <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
          <span className="text-white text-sm font-bold animate-pulse">Soltar!</span>
        </div>
      )}
    </div>
  );
}
