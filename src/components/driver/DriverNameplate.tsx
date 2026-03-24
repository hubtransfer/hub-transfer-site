"use client";

import React, { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DriverNameplateProps {
  isOpen: boolean;
  name: string;
  destination?: string;
  onClose: () => void;
}

/* ================================================================== */
/*  DRIVER NAMEPLATE — enhanced fullscreen client name                 */
/*  Gold shimmer, landscape lock, brand watermark                      */
/* ================================================================== */

export default function DriverNameplate({ isOpen, name, destination, onClose }: DriverNameplateProps) {
  const nameRef = useRef<HTMLDivElement>(null);

  /* Auto-fit text to fill screen — starts at 22vw */
  useEffect(() => {
    if (!isOpen || !nameRef.current) return;
    let sz = 22;
    const el = nameRef.current;
    el.style.fontSize = sz + "vw";
    requestAnimationFrame(() => {
      const maxW = window.innerWidth * 0.92;
      const maxH = window.innerHeight * 0.55;
      while ((el.scrollWidth > maxW || el.scrollHeight > maxH) && sz > 3) {
        sz -= 0.5;
        el.style.fontSize = sz + "vw";
      }
    });
  }, [isOpen, name]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Force landscape orientation when open */
  useEffect(() => {
    if (!isOpen) return;

    const lockOrientation = async () => {
      try {
        if (screen.orientation && "lock" in screen.orientation) {
          await (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock("landscape");
        }
      } catch {
        // Orientation lock not supported or denied — silently continue
      }
    };

    lockOrientation();

    return () => {
      try {
        if (screen.orientation && "unlock" in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch {
        // Silently continue
      }
    };
  }, [isOpen]);

  /* ESC key support */
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ background: "#000000" }}
      onClick={onClose}
      role="button"
      tabIndex={0}
    >
      {/* Top: brand watermark */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <span
          className="font-mono text-sm tracking-[0.3em] uppercase"
          style={{ color: "rgba(245, 197, 24, 0.25)" }}
        >
          HUB TRANSFER
        </span>
      </div>

      {/* Center: client name with gold shimmer */}
      <div
        ref={nameRef}
        className="driver-nameplate-shimmer px-[4vw] text-center leading-tight uppercase break-words"
        style={{
          fontWeight: 900,
          letterSpacing: "0.06em",
          maxWidth: "92vw",
          maxHeight: "55vh",
          overflow: "hidden",
          wordBreak: "break-word",
          background: "linear-gradient(180deg, #F5C518 0%, #F5C518 45%, #FFD700 50%, #F5C518 55%, #F5C518 100%)",
          backgroundSize: "100% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "nameShimmer 3s ease-in-out infinite",
        }}
      >
        {name}
      </div>

      {/* Bottom: destination + close hint */}
      <div className="absolute bottom-6 left-0 right-0 text-center space-y-2 px-6">
        {destination && (
          <p className="text-sm text-gray-400 font-mono truncate max-w-[90vw] mx-auto">
            📍 {destination}
          </p>
        )}
        <p className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.12)" }}>
          toca para fechar
        </p>
      </div>

      {/* Scoped styles for shimmer animation */}
      <style jsx>{`
        @keyframes nameShimmer {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
        .driver-nameplate-shimmer {
          background: linear-gradient(
            180deg,
            #F5C518 0%,
            #F5C518 45%,
            #FFD700 50%,
            #F5C518 55%,
            #F5C518 100%
          );
          background-size: 100% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: nameShimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
