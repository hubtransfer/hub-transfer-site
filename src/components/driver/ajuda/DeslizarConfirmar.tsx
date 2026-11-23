"use client";

// Deslizar para confirmar — para ninguém pedir (ou ficar com) uma viagem sem querer.
// Arrastar o círculo até ao fim confirma; largar antes volta ao início.

import React, { useCallback, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

const LIMIAR = 0.85;

export default function DeslizarConfirmar({
  texto,
  onConfirmar,
  cor = "#F0D030",
  ocupado = false,
}: {
  texto: string;
  onConfirmar: () => void;
  cor?: string;
  ocupado?: boolean;
}) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const inicioRef = useRef(0);
  const [x, setX] = useState(0);
  const [aArrastar, setAArrastar] = useState(false);
  const POLEGAR = 52;

  const max = () => Math.max(1, (pistaRef.current?.clientWidth ?? 300) - POLEGAR - 8);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (ocupado) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    inicioRef.current = e.clientX - x;
    setAArrastar(true);
  }, [ocupado, x]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!aArrastar) return;
    setX(Math.min(max(), Math.max(0, e.clientX - inicioRef.current)));
  }, [aArrastar]);

  const onUp = useCallback(() => {
    if (!aArrastar) return;
    setAArrastar(false);
    if (x / max() >= LIMIAR) {
      setX(max());
      try { navigator.vibrate?.(40); } catch { /* */ }
      onConfirmar();
    } else {
      setX(0);
    }
  }, [aArrastar, x, onConfirmar]);

  const pct = Math.min(1, x / max());

  return (
    <div
      ref={pistaRef}
      className="relative h-[60px] rounded-2xl overflow-hidden select-none touch-none"
      style={{ background: "#141414", border: `1px solid ${cor}55` }}
    >
      {/* rasto */}
      <div className="absolute inset-y-0 left-0 rounded-2xl"
        style={{ width: `${x + POLEGAR + 4}px`, background: `${cor}22`, transition: aArrastar ? "none" : "width .25s ease" }} />
      {/* texto */}
      <span className="absolute inset-0 flex items-center justify-center pl-14 pr-4 font-mono text-sm font-bold text-center leading-tight"
        style={{ color: cor, opacity: ocupado ? 0.6 : 1 - pct * 0.8 }}>
        {texto}
      </span>
      {/* polegar */}
      <button
        type="button"
        aria-label={texto}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => { if (!ocupado && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onConfirmar(); } }}
        className="absolute top-1 left-1 rounded-xl flex items-center justify-center text-black cursor-grab active:cursor-grabbing"
        style={{ width: POLEGAR, height: POLEGAR, background: cor, transform: `translateX(${x}px)`, transition: aArrastar ? "none" : "transform .25s ease" }}
      >
        {ocupado ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-6 h-6" strokeWidth={2.5} />}
      </button>
    </div>
  );
}
