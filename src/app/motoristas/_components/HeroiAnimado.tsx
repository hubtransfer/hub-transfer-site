import { preload } from "react-dom";
import HeroiVideo from "./HeroiVideo";

/* Topo da /motoristas: o carro, o colete da HUB e o telemóvel; os faróis acendem, o telemóvel vibra, o ecrã acende já
   com a app ("NOVA VIAGEM"), passa ao ecrã "Viagens de hoje" (só horas e percursos, sem preços) e apaga-se.
   - Desenhado no servidor: a capa (primeiro fotograma do vídeo, ecrã apagado: "inicio") é o que a página mostra primeiro
     e conta para o LCP.
     Ficheiros feitos à mão em public/motoristas (AVIF e WebP, 480 e 704 px, 4:5), sem o otimizador do Next.
     O vídeo original só tem 704 px de largura útil: as imagens não são ampliadas.
   - A animação (HeroiVideo, no browser): um só vídeo em loop, 5,8 s.
   - Com "reduzir movimento" ligado, não há vídeo: o <picture> mostra o ecrã "Nova viagem" ("fim"), parado. */

const ALT = "Colete preto da HUB Transfer, carro preto e telemóvel com a app da HUB Transfer a mostrar uma nova viagem";
const SIZES = "(min-width: 760px) 440px, 100vw";
const LARGURAS = [480, 704];
const conjunto = (nome: string, ext: string) =>
  LARGURAS.map((w) => `/motoristas/heroi-v8-${nome}-${w}.${ext} ${w}w`).join(", ");

export default function HeroiAnimado() {
  // como o <Image priority>: a capa é pedida logo no <head> (só em AVIF; quem não o lê vai ao WebP pelo <picture>)
  preload("/motoristas/heroi-v8-inicio-704.avif", {
    as: "image",
    type: "image/avif",
    imageSrcSet: conjunto("inicio", "avif"),
    imageSizes: SIZES,
    fetchPriority: "high",
  });

  return (
    <figure className="mot-foto">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" type="image/avif" srcSet={conjunto("fim", "avif")} sizes={SIZES} />
        <source media="(prefers-reduced-motion: reduce)" type="image/webp" srcSet={conjunto("fim", "webp")} sizes={SIZES} />
        <source type="image/avif" srcSet={conjunto("inicio", "avif")} sizes={SIZES} />
        <img
          src="/motoristas/heroi-v8-inicio-704.webp"
          srcSet={conjunto("inicio", "webp")}
          sizes={SIZES}
          width={704}
          height={880}
          alt={ALT}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <HeroiVideo />
    </figure>
  );
}
