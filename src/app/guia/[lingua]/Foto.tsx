import Image from "next/image";

/* Fotografia do guia: passa pelo otimizador de imagens do site, numa largura fixa e com qualidade 60,
   para cada PDF ficar abaixo dos 5 MB. As fotografias já levam a marca de água HUB (gravada nos ficheiros).
   O «npm run guias» pede-as em JPEG (o PDF guarda o JPEG tal como vem). */
export default function Foto({ src, largura }: { src?: string; largura: number }) {
  if (!src) return <span className="gx-sem-foto" />;
  return <Image src={src} alt="" fill sizes={`${largura}px`} quality={60} priority className="gx-img" draggable={false} />;
}
