"use client";

import { useEffect, useRef, useState } from "react";

/* A animação do topo, por cima da capa (ver HeroiAnimado). Um só vídeo (heroi-video, ~5 s) em loop:
   o ecrã acende, aparece o visto, o visto passa a carro e o carro fica com as cores da HUB. Os últimos 0,3 s
   fundem-se no primeiro fotograma, por isso o recomeço não parece um corte.
   - Só é pedido depois do load + 1,5 s + um momento livre: a página assenta primeiro (texto, fontes, capa).
     Com "reduzir movimento" ou "poupar dados" ligados, nunca é pedido.
   - Só toca enquanto a moldura está no ecrã (e o separador está à vista): fora dele, pára, para poupar bateria.
   - Sem botões: o vídeo só aparece depois de começar mesmo a tocar. Se o telemóvel bloquear a reprodução automática
     (ex.: iPhone em poupança de bateria), fica a capa parada, sem o botão de play do sistema. */

export default function HeroiVideo() {
  const [carregar, setCarregar] = useState(false);
  const [aTocar, setATocar] = useState(false); // já tocou de verdade (evento "playing")
  const [visivel, setVisivel] = useState(true); // moldura no ecrã e separador à vista
  const video = useRef<HTMLVideoElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // 1. Pedir o vídeo só depois de a página aparecer
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

  // 3. Tocar ou parar
  useEffect(() => {
    const v = video.current;
    if (!carregar || !v) return;
    if (visivel) {
      v.muted = true; // obrigatório para tocar sozinho no telemóvel
      v.play().catch(() => {
        /* o navegador recusou tocar sozinho: o vídeo continua invisível e fica a capa */
      });
    } else v.pause();
  }, [carregar, visivel]);

  if (!carregar) return <div ref={caixa} hidden />;

  return (
    <div ref={caixa}>
      <video
        ref={video}
        className={aTocar ? "mot-foto-video mot-foto-video-on" : "mot-foto-video"}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden
        tabIndex={-1}
        onPlaying={() => setATocar(true)}
      >
        <source src="/motoristas/heroi-video.webm" type="video/webm" />
        <source src="/motoristas/heroi-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
