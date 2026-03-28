"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface DriverNameplateProps {
  isOpen: boolean;
  name: string;
  destination?: string;
  onClose: () => void;
}

/** Ensure/create a <meta> tag and return it + its previous value */
function ensureMeta(name: string, value: string): { el: HTMLMetaElement; prev: string } {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  const prev = el.content;
  el.content = value;
  return { el, prev };
}

export default function DriverNameplate({ isOpen, name, destination, onClose }: DriverNameplateProps) {
  const nameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Enter fullscreen + landscape + hide browser chrome ── */
  useEffect(() => {
    if (!isOpen) return;

    // A) Scroll trick — nudge scroll to hide mobile address bar
    window.scrollTo(0, 1);

    // B) Fullscreen API — try container, then documentElement
    const el = containerRef.current || document.documentElement;
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
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
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlHeight = document.documentElement.style.height;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";

    // C) Meta tags for mobile browser chrome
    const themeColor = ensureMeta("theme-color", "#000000");
    const appleStatus = ensureMeta("apple-mobile-web-app-status-bar-style", "black");
    const appleCapable = ensureMeta("apple-mobile-web-app-capable", "yes");
    const mobileCapable = ensureMeta("mobile-web-app-capable", "yes");

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.height = prevHtmlHeight;
      window.scrollTo(0, 0);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* */ }
      try { screen.orientation?.unlock?.(); } catch { /* */ }
      themeColor.el.content = themeColor.prev || "#0A0A0A";
      appleStatus.el.content = appleStatus.prev || "default";
      appleCapable.el.content = appleCapable.prev || "";
      mobileCapable.el.content = mobileCapable.prev || "";
    };
  }, [isOpen]);

  /* ── Auto-fit text (works in both portrait & landscape) ── */
  useEffect(() => {
    if (!isOpen || !nameRef.current) return;
    let sz = 28;
    const el = nameRef.current;
    el.style.fontSize = sz + "vw";

    const fit = () => {
      // Use visualViewport for actual visible area (excludes browser chrome)
      const vp = window.visualViewport;
      const maxW = (vp ? vp.width : window.innerWidth) * 0.92;
      const maxH = (vp ? vp.height : window.innerHeight) * 0.60;
      while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && sz > 3) {
        sz -= 0.5;
        el.style.fontSize = sz + "vw";
      }
    };

    requestAnimationFrame(fit);

    // Re-fit on orientation change / viewport resize
    const onResize = () => {
      sz = 28;
      el.style.fontSize = sz + "vw";
      requestAnimationFrame(fit);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
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
        width: "100dvw",
        height: "100dvh",
        /* Safari iOS fallback — fill the entire screen */
        minHeight: "-webkit-fill-available",
        background: "#000000",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        /* Prevent pull-to-refresh and overscroll */
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      onClick={handleClose}
      role="button"
      tabIndex={0}
    >
      {/* Brand watermark — gold tint, subtle, safe from notch */}
      <div className="absolute left-0 right-0 text-center" style={{ top: "max(env(safe-area-inset-top, 12px), 12px)" }}>
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
          style={{ bottom: "max(calc(env(safe-area-inset-bottom, 8px) + 40px), 48px)" }}
        >
          <p className="text-base font-mono truncate max-w-[90vw] mx-auto" style={{ color: "#D0D0D0" }}>
            <span style={{ color: "#C06060" }}>📍</span> {destination}
          </p>
        </div>
      )}

      {/* Close hint — safe from bottom */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{ bottom: "max(calc(env(safe-area-inset-bottom, 8px) + 12px), 20px)" }}
      >
        <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.10)" }}>
          toca para fechar
        </p>
      </div>
    </div>
  );
}
