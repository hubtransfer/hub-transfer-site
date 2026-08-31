"use client";

// Hora com risco à Google Flights: quando a original difere da actual em
// ≥ 1 minuto, mostra a original riscada em cinza discreto ao lado da actual.
// Sem original (ou iguais): só a actual, sem risco. ÚNICO sítio desta regra —
// usado na chegada, na descolagem e no pickup (aberto e minimizado).

import React from "react";
import { horaAlterada } from "@/lib/flightUtils";

interface HoraRiscadaProps {
  /** Hora original (opcional — em falta, nunca há risco) */
  original?: string;
  /** Hora actual — a que manda */
  atual?: string;
  /** Estilo da hora actual quando HÁ risco (destaque) */
  className?: string;
  /** Estilo da hora actual quando NÃO há risco (default: className) */
  classNameSemRisco?: string;
  /** Estilo da original riscada (default: cinza discreto) */
  origClassName?: string;
  style?: React.CSSProperties;
}

export default function HoraRiscada({
  original,
  atual,
  className,
  classNameSemRisco,
  origClassName,
  style,
}: HoraRiscadaProps) {
  if (!atual) return null;
  const riscada = horaAlterada(original, atual);
  return (
    <>
      {riscada && (
        <span className={origClassName || "font-mono line-through text-gray-500"}>
          {original}
        </span>
      )}
      {riscada && " "}
      <span className={riscada ? className : (classNameSemRisco ?? className)} style={style}>
        {atual}
      </span>
    </>
  );
}
