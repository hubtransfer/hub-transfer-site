"use client";

import { useEffect, useRef, useState } from "react";

/* A animação do topo, por cima da capa (ver HeroiAnimado).
   - Só é pedida depois do load + 1,5 s + um momento livre: a página assenta primeiro (texto, fontes, capa).
     Com "reduzir movimento" ou "poupar dados" ligados, nunca é pedida.
   - Introdução (heroi-intro: clipes A+B+D, com o logótipo parado só ~1,6 s) toca uma vez. O último fotograma dela segue para o primeiro do loop
     (heroi-loop: clipe E), por isso a troca não tem salto. O loop repete sem fim.
   - Só toca enquanto a moldura está no ecrã (e o separador está à vista): fora dele, pára, para poupar bateria.
   - Botão pequeno de pausa e retoma no canto de cima à direita (o triângulo amarelo fica em baixo à esquerda). */

type Fase = "espera" | "intro" | "loop";

export default function HeroiVideo() {
  const [carregar, setCarregar] = useState(false);
  const [fase, setFase] = useState<Fase>("espera");
  const [pausado, setPausado] = useState(false); // escolha da pessoa (botão)
  const [visivel, setVisivel] = useState(true); // moldura no ecrã e separador à vista
  const intro = useRef<HTMLVideoElement>(null);
  const loop = useRef<HTMLVideoElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // 1. Pedir os vídeos só depois de a página aparecer
  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const poupar = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (semMovimento || poupar) return;

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    let tempo = 0;
    const comecar = () => {
      tempo = window.setTimeout(() => {
        if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setCarregar(true), { timeout: 2000 });
        else setCarregar(true);
      }, 1500);
    };
    if (document.readyState === "complete") comecar();
    else window.addEventListener("load", comecar, { once: true });
    return () => {
      window.removeEventListener("load", comecar);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      if (tempo) clearTimeout(tempo);
    };
  }, []);

  // 2. Saber se a moldura está no ecrã (e o separador à vista)
  useEffect(() => {
    if (!carregar) return;
    const fig = caixa.current?.closest("figure");
    let noEcra = true;
    const atualizar = () => setVisivel(noEcra && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      noEcra = e.isIntersecting;
      atualizar();
    }, { threshold: 0.15 });
    if (fig) io.observe(fig);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, [carregar]);

  // 3. Tocar ou parar o vídeo ativo
  useEffect(() => {
    if (!carregar) return;
    const ativo = fase === "loop" ? loop.current : intro.current;
    if (!ativo) return;
    if (visivel && !pausado) {
      ativo.muted = true; // obrigatório para tocar sozinho no telemóvel
      ativo.play().catch(() => {
        /* o navegador recusou tocar sozinho: fica a capa */
      });
    } else ativo.pause();
  }, [carregar, fase, visivel, pausado]);

  if (!carregar) return <div ref={caixa} hidden />;

  const comum = {
    muted: true,
    playsInline: true,
    disablePictureInPicture: true,
    disableRemotePlayback: true,
    "aria-hidden": true,
    tabIndex: -1,
  } as const;

  return (
    <div ref={caixa}>
      <video
        ref={intro}
        {...comum}
        className={fase === "intro" ? "mot-foto-video mot-foto-video-on" : "mot-foto-video"}
        preload="auto"
        onPlaying={() => setFase((f) => (f === "espera" ? "intro" : f))}
        onEnded={() => setFase("loop")}
      >
        <source src="/motoristas/heroi-intro.webm" type="video/webm" />
        <source src="/motoristas/heroi-intro.mp4" type="video/mp4" />
      </video>
      {fase !== "espera" && (
        <video
          ref={loop}
          {...comum}
          className={fase === "loop" ? "mot-foto-video mot-foto-video-on mot-foto-video-ja" : "mot-foto-video"}
          preload="auto"
          loop
        >
          <source src="/motoristas/heroi-loop.webm" type="video/webm" />
          <source src="/motoristas/heroi-loop.mp4" type="video/mp4" />
        </video>
      )}
      {fase !== "espera" && (
        <button
          type="button"
          className="mot-foto-pausa"
          aria-label={pausado ? "Retomar a animação" : "Pausar a animação"}
          aria-pressed={pausado}
          onClick={() => setPausado((p) => !p)}
        >
          {pausado ? (
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
