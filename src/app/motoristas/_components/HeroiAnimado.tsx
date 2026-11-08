import { preload } from "react-dom";
import HeroiVideo from "./HeroiVideo";

/* Topo da /motoristas: o colete, a chave e o telemóvel; o ecrã acende, aparece o visto verde, o visto passa a carro
   e o carro fica pintado com as cores da HUB dentro do telemóvel.
   - Desenhado no servidor: a capa (ecrã apagado, da imagem 2K "inicio") é o que a página mostra primeiro e conta para o LCP.
     Ficheiros feitos à mão em public/motoristas (AVIF e WebP, 480 a 1440 px, 4:5), sem o otimizador do Next.
   - A animação (HeroiVideo, no browser): um só vídeo em loop, ~5 s.
   - Com "reduzir movimento" ligado, não há vídeo: o <picture> mostra só o último fotograma do vídeo ("fim"), parado. */

const ALT = "Colete preto da HUB Transfer, chave do carro e telemóvel";
const SIZES = "(min-width: 760px) 440px, 100vw";
const LARGURAS = [480, 750, 1080, 1440];
const LARGURAS_FIM = [480, 750, 1064]; // o vídeo original só tem 1064 px de largura útil: sem ampliar
const conjunto = (nome: string, ext: string, larguras = LARGURAS) =>
  larguras.map((w) => `/motoristas/heroi-${nome}-${w}.${ext} ${w}w`).join(", ");

export default function HeroiAnimado() {
  // como o <Image priority>: a capa é pedida logo no <head> (só em AVIF; quem não o lê vai ao WebP pelo <picture>)
  preload("/motoristas/heroi-inicio-750.avif", {
    as: "image",
    type: "image/avif",
    imageSrcSet: conjunto("inicio", "avif"),
    imageSizes: SIZES,
    fetchPriority: "high",
  });

  return (
    <figure className="mot-foto">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" type="image/avif" srcSet={conjunto("fim", "avif", LARGURAS_FIM)} sizes={SIZES} />
        <source media="(prefers-reduced-motion: reduce)" type="image/webp" srcSet={conjunto("fim", "webp", LARGURAS_FIM)} sizes={SIZES} />
        <source type="image/avif" srcSet={conjunto("inicio", "avif")} sizes={SIZES} />
        <img
          src="/motoristas/heroi-inicio-750.webp"
          srcSet={conjunto("inicio", "webp")}
          sizes={SIZES}
          width={1440}
          height={1800}
          alt={ALT}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <HeroiVideo />
    </figure>
  );
}
