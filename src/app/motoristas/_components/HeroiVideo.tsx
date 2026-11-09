"use client";

import { useEffect, useRef, useState } from "react";

/* A animação do topo, por cima da capa (ver HeroiAnimado). Um só vídeo (heroi-v8, 5,8 s) em loop, que acaba na mesma
   imagem em que começa: os faróis acendem, o telemóvel vibra, o ecrã acende já com a "Nova viagem" (a imagem treme de leve),
   passa à lista "Viagens de hoje" (horas e percursos, sem preços) e apaga-se. O reflexo do vidro mantém-se por cima do ecrã.
   - Só é pedido depois do load + 3 s + um momento livre: a página assenta primeiro (texto, fontes, capa).
     Com "reduzir movimento" ou "poupar dados" ligados, nunca é pedido.
   - Só toca enquanto a moldura está no ecrã (e o separador está à vista): fora dele, pára, para poupar bateria.
   - Sem botões: o vídeo só aparece depois de começar mesmo a tocar. Se o telemóvel bloquear a reprodução automática
     (ex.: iPhone em poupança de bateria), fica a capa parada, sem o botão de play do sistema. */

const TREMER_EM = 0.75; // s: o ecrã acende com a "Nova viagem" (fotograma 18 do heroi-v8)
// 0,4 s de tremer leve (2 a 3 px)
const TREMER: Keyframe[] = [
  { transform: "translate(0, 0)" },
  { transform: "translate(-3px, 1px)" },
  { transform: "translate(3px, -1px)" },
  { transform: "translate(-2px, -1px)" },
  { transform: "translate(2px, 1px)" },
  { transform: "translate(-1px, 0)" },
  { transform: "translate(0, 0)" },
];

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
      }, 3000);
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

  // 3. Tremer de leve quando aparece a "Nova viagem" (ecrã acende aos ~0,75 s do vídeo), em cada volta do loop.
  //    Segue os fotogramas mostrados (requestVideoFrameCallback; senão, requestAnimationFrame) e dispara ao passar o instante.
  //    Usa a Web Animations API (não mexe no className do React). Com "reduzir movimento" não há vídeo nem tremer.
  useEffect(() => {
    const v = video.current as (HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    }) | null;
    if (!carregar || !visivel || !v || typeof v.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const porVideo = typeof v.requestVideoFrameCallback === "function";
    let id = 0;
    let antes = v.currentTime;
    const seguir = () => {
      const agora = v.currentTime;
      const passou = agora >= antes ? antes < TREMER_EM && agora >= TREMER_EM : agora >= TREMER_EM || antes < TREMER_EM; // volta do loop
      if (passou && !v.paused) {
        v.animate(TREMER, { duration: 400, easing: "linear" });
      }
      antes = agora;
      id = porVideo ? v.requestVideoFrameCallback!(seguir) : requestAnimationFrame(seguir);
    };
    id = porVideo ? v.requestVideoFrameCallback!(seguir) : requestAnimationFrame(seguir);
    return () => {
      if (porVideo) v.cancelVideoFrameCallback?.(id);
      else cancelAnimationFrame(id);
    };
  }, [carregar, visivel]);

  // 4. Tocar ou parar
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
        <source src="/motoristas/heroi-v8.webm" type="video/webm" />
        <source src="/motoristas/heroi-v8.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
