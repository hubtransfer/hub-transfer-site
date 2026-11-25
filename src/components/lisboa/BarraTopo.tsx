"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SeletorLinguas from "./SeletorLinguas";
import type { Lingua } from "@/lib/lisboa/tipos";

/* Barra fixa no topo da /lisboa e das páginas dos pratos (como a da página inicial): o logótipo e o seletor de línguas
   ficam sempre à mão. Respeita a zona segura do iPhone (env(safe-area-inset-top)).
   Na /lisboa começa transparente sobre a fotografia do topo e escurece ao descer; nas páginas dos pratos é sempre escura.
   A altura (--lx-barra) é reservada pela página, para a barra nunca tapar conteúdo. */

type Props = {
  lingua: Lingua;
  rotas: Record<Lingua, string>;
  rotulo: string;
  logo: { href: string; rotulo: string };
  /** sempre escura (páginas sem fotografia por trás) */
  solida?: boolean;
};

export default function BarraTopo({ lingua, rotas, rotulo, logo, solida = false }: Props) {
  const [desceu, setDesceu] = useState(false);

  useEffect(() => {
    if (solida) return;
    const ver = () => setDesceu(window.scrollY > 8);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, [solida]);

  return (
    <div className="lx-barra" data-escura={solida || desceu ? "" : undefined}>
      <div className="lx-wrap lx-barra-in">
        <Link href={logo.href} aria-label={logo.rotulo} prefetch={false} className="lx-barra-logo">
          <Image src="/images/logo.png" alt="HUB Transfer" width={828} height={204} sizes="140px" className="lx-logo" priority />
        </Link>
        <SeletorLinguas lingua={lingua} rotas={rotas} rotulo={rotulo} />
      </div>
    </div>
  );
}
