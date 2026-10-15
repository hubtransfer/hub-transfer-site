"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  EVENTO_ABRIR_COOKIES,
  gravarConsentimento,
  iniciarPixel,
  lerConsentimento,
} from "../_lib/medicao";

/** Aviso de cookies da campanha. O pixel da Meta só arranca depois de "Aceitar". */
export default function ConsentimentoPixel() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const c = lerConsentimento();
    if (c === "sim") iniciarPixel();
    else if (c === null) setAberto(true);

    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO_ABRIR_COOKIES, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, abrir);
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
    <div className="inv-cookies" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p>
        Usamos cookies da Meta para saber que anúncios trazem motoristas até aqui. Só os ativamos se aceitares.{" "}
        <Link href="/inverno/privacidade" prefetch={false}>Saber mais</Link>
      </p>
      <div className="inv-cookies-actions">
        <button type="button" className="inv-cookies-refuse" onClick={() => escolher("nao")}>
          Recusar
        </button>
        <button type="button" className="inv-cookies-accept" onClick={() => escolher("sim")}>
          Aceitar
        </button>
      </div>
    </div>
  );
}
