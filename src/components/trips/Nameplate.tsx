"use client";

import React, { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface NameplateProps {
  isOpen: boolean;
  name: string;
  onClose: () => void;
}

/* ================================================================== */
/*  NAMEPLATE — fullscreen client name for airport arrivals            */
/* ================================================================== */

export default function Nameplate({ isOpen, name, onClose }: NameplateProps) {
  const nameRef = useRef<HTMLDivElement>(null);

  /* Auto-fit text to fill screen */
  useEffect(() => {
    if (!isOpen || !nameRef.current) return;
    let sz = 18;
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ background: "#0a0a0a" }}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
          onClose();
        }
      }}
    >
      {/* Top: brand watermark */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <span
          className="font-mono text-sm tracking-[0.35em] uppercase"
          style={{ color: "rgba(245, 197, 24, 0.4)" }}
        >
          HUB TRANSFER
        </span>
      </div>

      {/* Center: client name */}
      <div
        ref={nameRef}
        className="px-[4vw] text-center leading-tight uppercase break-words"
        style={{
          color: "#F0D030",
          fontWeight: 900,
          letterSpacing: "0.06em",
          maxWidth: "92vw",
          maxHeight: "55vh",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {name}
      </div>

      {/* Bottom: close hint */}
      <div className="absolute bottom-10 left-0 right-0 text-center space-y-3">
        <p
          className="text-sm tracking-wide"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          toca para fechar
        </p>

        {/* Portrait-only rotate hint */}
        <div className="portrait-rotate-hint">
          <p
            className="text-xs tracking-wide flex items-center justify-center gap-2"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            <span className="inline-block rotate-phone-anim text-base">
              &#128241;
            </span>
            Deita o telemovel para placa maior
          </p>
        </div>
      </div>

      {/* Scoped styles for portrait/landscape and animation */}
      <style jsx>{`
        @keyframes rotatePhone {
          0%,
          100% {
            transform: rotate(0deg);
          }
          30%,
          70% {
            transform: rotate(90deg);
          }
        }
        .rotate-phone-anim {
          display: inline-block;
          animation: rotatePhone 2.5s ease-in-out infinite;
        }
        @media (orientation: landscape) {
          .portrait-rotate-hint {
            display: none;
          }
        }
        @media (orientation: portrait) {
          .portrait-rotate-hint {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
