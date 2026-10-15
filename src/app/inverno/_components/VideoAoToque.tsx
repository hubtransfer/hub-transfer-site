"use client";

import { useState } from "react";

/** Mostra só a capa; o vídeo (7 MB) só é descarregado quando a pessoa toca. */
export default function VideoAoToque() {
  const [aTocar, setATocar] = useState(false);

  return (
    <div className="inv-video">
      {aTocar ? (
        <video
          src="/inverno/filme-inverno.mp4"
          poster="/inverno/filme-capa.webp"
          controls
          autoPlay
          playsInline
          preload="auto"
        />
      ) : (
        <button type="button" onClick={() => setATocar(true)} aria-label="Ver o filme (1 min 32 s, com som)">
          {/* eslint-disable-next-line @next/next/no-img-element -- capa fixa e leve; sem otimização dinâmica */}
          <img src="/inverno/filme-capa.webp" alt="" width={540} height={960} loading="lazy" decoding="async" />
          <span className="inv-play" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 4.5v15l12.5-7.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
