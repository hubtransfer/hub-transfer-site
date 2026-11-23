"use client";

// Peças comuns aos ecrãs da ajuda: o resumo da viagem e as iniciais do colega.
import React from "react";
import { ArrowRight, Plane, Lock } from "lucide-react";
import type { MotivoAjuda, ResumoViagemAjuda } from "@/lib/ajuda/tipos";
import { MOTIVOS } from "@/lib/ajuda/regras";
import { T, NOME_MOTIVO, textoValor } from "@/lib/ajuda/textos";

/** Cor do rótulo, como no cartão (CHEGADA amarelo, PARTIDA azul, TRANSFER verde-água). */
export function corDoRotulo(rotulo: string): string {
  const t = rotulo.split("·")[0].trim().toUpperCase();
  if (t === "CHEGADA") return "#F5C518";
  if (t === "PARTIDA" || t === "RECOLHA") return "#3B82F6";
  if (t === "TRANSFER") return "#2DD4BF";
  if (t === "TOUR") return "#A855F7";
  return "#C084FC";
}

/** Resumo da viagem: rótulo, dia, hora, voo, de onde para onde e valor (se o cartão o mostra). */
export function ResumoViagem({ r, compacto = false }: { r: ResumoViagemAjuda; compacto?: boolean }) {
  const cor = corDoRotulo(r.rotulo);
  const valor = textoValor(r.valor);
  return (
    <div className="rounded-2xl border border-[#2A2A2A] border-l-4 bg-[#1A1A1A] px-4 py-3" style={{ borderLeftColor: cor }}>
      <div className="flex items-center justify-between">
        <span className="font-semibold font-mono leading-none" style={{ fontSize: "0.65rem", letterSpacing: "0.5px", color: cor }}>
          {r.rotulo}
        </span>
        {r.data && <span className="font-mono text-[11px] text-[#888]">{r.data}</span>}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className={`font-bold font-mono ${compacto ? "text-xl" : "text-2xl"}`} style={{ color: cor }}>{r.hora}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-semibold truncate">{r.origem}</p>
          <p className="text-sm text-[#BDBDBD] truncate flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-[#666]" />
            <span className="truncate">{r.destino}</span>
          </p>
        </div>
        {valor && <span className="font-mono text-sm font-bold text-[#F0D030] flex-shrink-0">{valor}</span>}
      </div>
      {r.voo && (
        <p className="mt-1.5 font-mono text-[11px] text-[#BDBDBD] flex items-center gap-1.5">
          <Plane className="w-3.5 h-3.5 text-[#888]" /> Voo {r.voo}
        </p>
      )}
    </div>
  );
}

export function Iniciais({ nome, cor = "#F0D030" }: { nome: string; cor?: string }) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  const ini = ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  return (
    <span className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold flex-shrink-0"
      style={{ background: `${cor}1A`, color: cor, border: `1px solid ${cor}40` }}>
      {ini}
    </span>
  );
}

/** Caixa de mensagem (resultado, aviso). */
export function Caixa({
  cor, icone, titulo, frase, children,
}: { cor: string; icone: React.ReactNode; titulo: string; frase?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl px-4 py-5 text-center space-y-2" style={{ background: `${cor}0F`, border: `1px solid ${cor}40` }}>
      <div className="flex justify-center" style={{ color: cor }}>{icone}</div>
      <p className="text-base font-bold" style={{ color: cor }}>{titulo}</p>
      {frase && <p className="text-sm text-[#BDBDBD] leading-snug">{frase}</p>}
      {children}
    </div>
  );
}

/** O motivo: um toque obrigatório entre quatro. Só a gestão o vê. */
export function EscolherMotivo({
  valor, onEscolher,
}: { valor: MotivoAjuda | null; onEscolher: (m: MotivoAjuda) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-white">{T.motivoTitulo}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={T.motivoTitulo}>
        {MOTIVOS.map((m) => {
          const sel = valor === m;
          return (
            <button key={m} type="button" role="radio" aria-checked={sel} onClick={() => onEscolher(m)}
              className={`h-12 rounded-xl font-mono text-sm font-bold border transition-colors ${
                sel ? "bg-[#F0D030] text-black border-[#F0D030]" : "bg-[#1A1A1A] text-white/80 border-[#2A2A2A] active:bg-white/10"
              }`}>
              {NOME_MOTIVO[m]}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] text-[#888] flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> {T.motivoDica}
      </p>
    </div>
  );
}
