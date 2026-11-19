"use client";

import { useEffect } from "react";

/** Só na /lisboa: sem botão direito nem arrastar sobre as fotografias.
    O texto da página continua a poder ser selecionado e copiado. */
export default function ProtecaoFotos() {
  useEffect(() => {
    const bloquear = (ev: Event) => {
      const alvo = ev.target as Element | null;
      if (alvo?.closest?.(".lx-ph, .lx-hero-img, .lx-hero-veu")) ev.preventDefault();
    };
    document.addEventListener("contextmenu", bloquear);
    document.addEventListener("dragstart", bloquear);
    return () => {
      document.removeEventListener("contextmenu", bloquear);
      document.removeEventListener("dragstart", bloquear);
    };
  }, []);
  return null;
}
