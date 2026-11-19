"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  imagens: string[];
  alt: string;
  sizes: string;
  /** rótulos de acessibilidade: anterior, seguinte, "Imagem {i} de {t}" */
  rotulos: { anterior: string; seguinte: string; imagem: string };
  children?: React.ReactNode;
};

/** Fotografia(s) de um cartão. Sem imagens: fundo escuro com o canto amarelo.
    Uma imagem: só a imagem. Várias: arrasta-se com o dedo (scroll-snap nativo), com pontos e setas. */
export default function Carrossel({ imagens, alt, sizes, rotulos, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  // As fotografias só começam a descarregar quando o cartão se aproxima do ecrã: assim não disputam a rede com o topo.
  const [perto, setPerto] = useState(false);
  const [atual, setAtual] = useState(0);
  const varias = imagens.length > 1;

  useEffect(() => {
    const el = caixa.current;
    if (!el || !imagens.length) return;
    if (!("IntersectionObserver" in window)) return setPerto(true);
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((x) => x.isIntersecting)) {
          setPerto(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [imagens.length]);

  const irPara = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const alvo = Math.max(0, Math.min(imagens.length - 1, i));
    el.scrollTo({ left: alvo * el.clientWidth, behavior: "smooth" });
  };

  const aoRolar = () => {
    const el = pista.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== atual) setAtual(i);
  };

  return (
    <div ref={caixa} className="lx-ph" data-vazio={imagens.length === 0 || undefined}>
      {perto && imagens.length > 0 && (
        <div
          ref={pista}
          className={varias ? "lx-pista" : "lx-pista lx-pista--uma"}
          onScroll={varias ? aoRolar : undefined}
          aria-roledescription={varias ? "carousel" : undefined}
        >
          {imagens.map((src, i) => (
            <div
              key={src}
              className="lx-slide"
              role={varias ? "group" : undefined}
              aria-label={varias ? rotulos.imagem.replace("{i}", String(i + 1)).replace("{t}", String(imagens.length)) : undefined}
            >
              <Image src={src} alt={i === 0 ? alt : ""} fill sizes={sizes} quality={60} className="lx-img" draggable={false} />
            </div>
          ))}
        </div>
      )}
      {perto && varias && (
        <>
          <button type="button" className="lx-seta lx-seta--ant" aria-label={rotulos.anterior} onClick={() => irPara(atual - 1)} disabled={atual === 0}>
            ‹
          </button>
          <button
            type="button"
            className="lx-seta lx-seta--seg"
            aria-label={rotulos.seguinte}
            onClick={() => irPara(atual + 1)}
            disabled={atual === imagens.length - 1}
          >
            ›
          </button>
          <div className="lx-pontos" aria-hidden="true">
            {imagens.map((src, i) => (
              <span key={src} className={i === atual ? "on" : undefined} />
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
