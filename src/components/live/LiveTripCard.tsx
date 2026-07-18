"use client";

// Cartão de viagem LIVE — cliente, hora, voo, motorista, rota + faixa de progresso.
// NUNCA mostra preços/comissões (o feed liveHotel não os traz, por contrato).

import LiveProgressStrip from "./LiveProgressStrip";
import { isNoShow, firstName, type LiveViagem } from "@/lib/live";
import { cleanHora } from "@/lib/trips";

interface LiveTripCardProps {
  viagem: LiveViagem;
}

export default function LiveTripCard({ viagem: v }: LiveTripCardProps) {
  const noShow = isNoShow(v);
  const done = !noShow && (v.passo?.n || 1) >= 5;
  const borderColor = noShow ? "#EF4444" : done ? "#22C55E" : "#F5C518";
  const hora = cleanHora(v.hora || "");
  const motorista = firstName(v.motorista);

  return (
    <div
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor, ...(noShow ? { backgroundColor: "#2A1414", borderColor: "#7F1D1D", borderLeftColor: "#EF4444" } : {}) }}
    >
      {/* Hora + Cliente + plataforma */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <span className="flex-shrink-0 font-bold font-mono text-xl" style={{ color: noShow ? "#EF4444" : done ? "#22C55E" : "#F5C518" }}>{hora}</span>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{v.cliente}</p>
        </div>
        {v.plataforma && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 bg-[#2A2A2A] text-[#A0A0A0] font-mono">{v.plataforma}</span>
        )}
      </div>

      {/* Motorista · Voo · Rota */}
      <div className="px-4 pb-1 flex items-center gap-3 flex-wrap text-xs font-mono">
        {motorista && <span className="text-[#D0D0D0]">🚘 {motorista}</span>}
        {v.voo?.trim() && <span className="text-amber-400 font-bold">✈️ {v.voo}</span>}
        {v.rota && <span className="text-[#888] truncate">{v.rota}</span>}
      </div>

      {/* Estado NO_SHOW */}
      {noShow && (
        <p className="px-4 py-1 text-sm font-bold text-red-500">Cliente não compareceu</p>
      )}

      {/* Faixa de progresso 5 pontos + carrinho */}
      <div className="pb-1">
        <LiveProgressStrip n={v.passo?.n || 1} tsPassos={v.tsPassos} horaAgendada={hora} noShow={noShow} />
      </div>

      {/* Posição do motorista (link maps) — só quando o backend a fornece */}
      {v.pos?.maps && !done && !noShow && (
        <div className="px-4 pb-2.5">
          <a href={v.pos.maps} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#D4A017] hover:text-[#F0D030] underline">
            📍 posição há {v.pos.min}min
          </a>
        </div>
      )}
    </div>
  );
}
