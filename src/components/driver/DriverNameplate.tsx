"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface DriverNameplateProps {
  isOpen: boolean;
  name: string;
  destination?: string;
  onClose: () => void;
}

export default function DriverNameplate({ isOpen, name, destination, onClose }: DriverNameplateProps) {
  const nameRef = useRef<HTMLDivElement>(null);

  /* ── Enter fullscreen + landscape ── */
  useEffect(() => {
    if (!isOpen) return;

    // Fullscreen API
    try { document.documentElement.requestFullscreen?.(); } catch { /* */ }
    // Landscape lock
    try {
      if (screen.orientation && "lock" in screen.orientation) {
        (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock("landscape").catch(() => {});
      }
    } catch { /* */ }
    // Lock scroll
    document.body.style.overflow = "hidden";
    // Theme color black for mobile status bar
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    const prevColor = meta.content;
    meta.content = "#000000";

    return () => {
      document.body.style.overflow = "";
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* */ }
      try { screen.orientation?.unlock?.(); } catch { /* */ }
      if (meta) meta.content = prevColor || "#0A0A0A";
    };
  }, [isOpen]);

  /* ── Auto-fit text ── */
  useEffect(() => {
    if (!isOpen || !nameRef.current) return;
    let sz = 22;
    const el = nameRef.current;
    el.style.fontSize = sz + "vw";
    requestAnimationFrame(() => {
      const maxW = window.innerWidth * 0.92;
      const maxH = window.innerHeight * 0.50;
      while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && sz > 3) {
        sz -= 0.5;
        el.style.fontSize = sz + "vw";
      }
    });
  }, [isOpen, name]);

  /* ── Close on ESC / space / tap ── */
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (["Escape", " ", "Enter"].includes(e.key)) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const handleClose = useCallback(() => {
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* */ }
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ background: "#000000", zIndex: 99999 }}
      onClick={handleClose}
      role="button"
      tabIndex={0}
    >
      {/* Brand watermark — small, subtle */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: "rgba(200,200,200,0.2)" }}>
          HUB TRANSFER
        </span>
      </div>

      {/* Client name — gold, massive */}
      <div
        ref={nameRef}
        className="px-[4vw] text-center leading-tight uppercase break-words"
        style={{
          fontWeight: 900,
          letterSpacing: "0.06em",
          maxWidth: "92vw",
          maxHeight: "50vh",
          overflow: "hidden",
          wordBreak: "break-word",
          color: "#F0D030",
        }}
      >
        {name}
      </div>

      {/* Destination — red pin + address */}
      {destination && (
        <div className="absolute bottom-14 left-0 right-0 text-center px-6">
          <p className="text-sm font-mono truncate max-w-[90vw] mx-auto" style={{ color: "#D0D0D0" }}>
            <span style={{ color: "#C06060" }}>📍</span> {destination}
          </p>
        </div>
      )}

      {/* Close hint */}
      <div className="absolute bottom-5 left-0 right-0 text-center">
        <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.10)" }}>
          toca para fechar
        </p>
      </div>
    </div>
  );
}
