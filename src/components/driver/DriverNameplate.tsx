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
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Enter fullscreen + landscape ── */
  useEffect(() => {
    if (!isOpen) return;

    // Fullscreen API — try on the container element first, then documentElement
    const el = containerRef.current || document.documentElement;
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          // Fallback: try on documentElement
          try { document.documentElement.requestFullscreen?.(); } catch { /* */ }
        });
      }
    } catch { /* */ }

    // Landscape lock
    try {
      if (screen.orientation && "lock" in screen.orientation) {
        (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock("landscape").catch(() => {});
      }
    } catch { /* */ }

    // Lock scroll on body and html
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Theme color black for mobile status bar
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const prevColor = meta.content;
    meta.content = "#000000";

    // Also set apple-mobile-web-app-status-bar-style for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleMeta);
    }
    const prevApple = appleMeta.content;
    appleMeta.content = "black";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* */ }
      try { screen.orientation?.unlock?.(); } catch { /* */ }
      if (meta) meta.content = prevColor || "#0A0A0A";
      if (appleMeta) appleMeta.content = prevApple || "default";
    };
  }, [isOpen]);

  /* ── Auto-fit text (works in both portrait & landscape) ── */
  useEffect(() => {
    if (!isOpen || !nameRef.current) return;
    let sz = 28;
    const el = nameRef.current;
    el.style.fontSize = sz + "vw";

    const fit = () => {
      const maxW = window.innerWidth * 0.92;
      const maxH = window.innerHeight * 0.60;
      while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && sz > 3) {
        sz -= 0.5;
        el.style.fontSize = sz + "vw";
      }
    };

    // Fit after layout
    requestAnimationFrame(fit);

    // Re-fit on orientation change (landscape ↔ portrait)
    const onResize = () => {
      sz = 28;
      el.style.fontSize = sz + "vw";
      requestAnimationFrame(fit);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
      ref={containerRef}
      className="select-none cursor-pointer"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100dvw",
        height: "100dvh",
        background: "#000000",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        /* Prevent any Safari address bar overlap */
        WebkitOverflowScrolling: "touch",
      }}
      onClick={handleClose}
      role="button"
      tabIndex={0}
    >
      {/* Brand watermark — gold tint, subtle, safe from notch */}
      <div className="absolute left-0 right-0 text-center" style={{ top: "env(safe-area-inset-top, 12px)", paddingTop: "12px" }}>
        <span className="font-mono text-xs tracking-[0.4em] uppercase" style={{ color: "rgba(240,208,48,0.12)" }}>
          HUB TRANSFER
        </span>
      </div>

      {/* Client name — gold, massive, with glow */}
      <div
        ref={nameRef}
        className="px-[4vw] text-center leading-tight uppercase break-words"
        style={{
          fontWeight: 900,
          letterSpacing: "0.08em",
          maxWidth: "92vw",
          maxHeight: "60dvh",
          overflow: "hidden",
          wordBreak: "break-word",
          color: "#F0D030",
          textShadow: "0 0 80px rgba(240,208,48,0.3), 0 0 160px rgba(240,208,48,0.1)",
        }}
      >
        {name}
      </div>

      {/* Gold accent line */}
      <div className="mt-4 mx-auto" style={{
        width: "30vw", height: "2px",
        background: "linear-gradient(90deg, transparent, #F0D030, transparent)",
      }} />

      {/* Destination — red pin + address, safe from bottom */}
      {destination && (
        <div
          className="absolute left-0 right-0 text-center px-6"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 8px) + 40px)" }}
        >
          <p className="text-base font-mono truncate max-w-[90vw] mx-auto" style={{ color: "#D0D0D0" }}>
            <span style={{ color: "#C06060" }}>📍</span> {destination}
          </p>
        </div>
      )}

      {/* Close hint — safe from bottom */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 8px) + 12px)" }}
      >
        <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.10)" }}>
          toca para fechar
        </p>
      </div>
    </div>
  );
}
