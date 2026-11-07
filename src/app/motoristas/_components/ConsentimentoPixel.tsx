"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EVENTO_ABRIR_COOKIES, gravarConsentimento, iniciarPixel, lerConsentimento } from "../_lib/medicao";

/** Aviso de cookies da página. O pixel da Meta só arranca depois de "Aceitar".
    Na primeira visita, o aviso só aparece quando a pessoa começa a descer a página: assim o primeiro ecrã do telemóvel
    mostra o título, o subtítulo e o botão, e o aviso aparece sempre antes de se chegar à ficha. */
export default function ConsentimentoPixel() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO_ABRIR_COOKIES, abrir);

    const c = lerConsentimento();
    let aoDescer: (() => void) | null = null;
    if (c === "sim") iniciarPixel();
    else if (c === null) {
      if (window.scrollY > 40 || window.location.hash) setAberto(true);
      else {
        aoDescer = () => {
          if (window.scrollY > 40) {
            setAberto(true);
            window.removeEventListener("scroll", aoDescer!);
          }
        };
        window.addEventListener("scroll", aoDescer, { passive: true });
      }
    }
    return () => {
      window.removeEventListener(EVENTO_ABRIR_COOKIES, abrir);
      if (aoDescer) window.removeEventListener("scroll", aoDescer);
    };
  }, []);

  if (!aberto) return null;

  const escolher = (v: "sim" | "nao") => {
    const antes = lerConsentimento();
    gravarConsentimento(v);
    setAberto(false);
    if (v === "sim") iniciarPixel();
    else if (antes === "sim") window.location.reload(); // retirar o consentimento descarrega o pixel
  };

  return (
    <div className="mot-cookies" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        Usamos cookies da Meta para saber que anúncios trazem motoristas até aqui. Só os ativamos se aceitares.{" "}
        <Link href="/motoristas/privacidade" prefetch={false}>
          Saber mais
        </Link>
      </p>
      <div className="mot-cookies-acoes">
        <button type="button" className="mot-cookies-recusar" onClick={() => escolher("nao")}>
          Recusar
        </button>
        <button type="button" className="mot-cookies-aceitar" onClick={() => escolher("sim")}>
          Aceitar
        </button>
      </div>
    </div>
  );
}
