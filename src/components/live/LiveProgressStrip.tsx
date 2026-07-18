"use client";

// Faixa de progresso LIVE — 5 pontos + carrinho.
// Restauro/adaptação da linguagem visual da DriverProgressBar (fefb8be):
// linha pontilhada estilo logo HUB, carro SVG, linha dourada, transição CSS.
// HONESTIDADE: o carro só se move quando passo.n (confirmado no backend) muda.
// Nada de interpolação inventada entre passos.

import { LIVE_STEPS, tsToHora, type LiveTsPassos } from "@/lib/live";

interface LiveProgressStripProps {
  /** Último passo CONFIRMADO (1..5) vindo do backend (passo.n) */
  n: number;
  tsPassos?: LiveTsPassos;
  /** Hora agendada — mostrada sob o ponto 1 (Agendada) */
  horaAgendada?: string;
  noShow?: boolean;
  /** Versão compacta: só pontos + carrinho, sem rótulos nem horas (cartão fechado) */
  compact?: boolean;
}

const CLR_GOLD = "#D4A017";
const CLR_GREEN = "#4CAF50";
const CLR_RED = "#EF4444";
const CLR_GREY = "#4B5563";

const CarIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

export default function LiveProgressStrip({ n, tsPassos, horaAgendada, noShow, compact }: LiveProgressStripProps) {
  // NO_SHOW: carro parado no ponto 2 ("A caminho"), tudo vermelho
  const activeStep = noShow ? 2 : Math.min(5, Math.max(1, n || 1));
  const isDone = !noShow && activeStep >= 5;
  const color = noShow ? CLR_RED : isDone ? CLR_GREEN : CLR_GOLD;
  const linePct = ((activeStep - 1) / 4) * 100;

  return (
    <div className={compact ? "w-full px-1 pt-3 pb-0.5" : "w-full px-2 sm:px-4 py-1 sm:py-2"}>
      {/* Pontos + linhas */}
      <div className="relative flex items-center justify-between" style={{ height: "24px" }}>
        {/* Linha pontilhada de fundo (largura total) */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2" style={{
          height: "2px",
          backgroundImage: `repeating-linear-gradient(90deg, ${CLR_GREY}40 0px, ${CLR_GREY}40 5px, transparent 5px, transparent 10px)`,
        }} />

        {/* Linha sólida até ao passo confirmado */}
        {activeStep > 1 && (
          <div className="absolute top-1/2 left-0 -translate-y-1/2 transition-all duration-700 ease-in-out" style={{
            height: "2px",
            width: `${linePct}%`,
            backgroundColor: color,
          }} />
        )}

        {/* Carrinho — elemento único; `left` muda com transição suave */}
        {!isDone && (
          <div className="absolute transition-all duration-700 ease-in-out" style={{
            left: `${linePct}%`,
            top: "-14px",
            transform: "translateX(-50%)",
            zIndex: 3,
          }}>
            <CarIcon color={activeStep === 1 && !noShow ? CLR_GREY : color} />
          </div>
        )}

        {/* 5 pontos */}
        {LIVE_STEPS.map((_, i) => {
          const stepNum = i + 1;
          const isActive = activeStep >= stepNum;
          return (
            <div key={i} className="relative flex items-center justify-center" style={{ zIndex: 2 }}>
              <div className="w-[10px] h-[10px] rounded-full border-2 transition-all duration-700" style={{
                borderColor: isActive ? color : CLR_GREY,
                backgroundColor: isActive ? color : "transparent",
              }} />
              {/* Bandeira no último ponto quando concluída */}
              {i === 4 && isDone && (
                <div className="absolute -top-[18px]">
                  <span className="text-sm" style={{ color: CLR_GREEN }}>🏁</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rótulos + horas sob cada ponto — mobile-first: rótulos longos
          quebram em 2 linhas em vez de colidir num ecrã estreito.
          Na versão compacta não há rótulos. */}
      {!compact && (
      <div className="relative mt-0.5" style={{ height: "34px" }}>
        {LIVE_STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isActive = activeStep >= stepNum;
          const pos = (i / 4) * 100;
          const anchor = i === 0 ? "left" : i === 4 ? "right" : "center";
          const hora = i === 0 ? (horaAgendada || "") : tsToHora(tsPassos?.[s.tsKey!]);
          return (
            <div key={s.label} className="absolute flex flex-col font-mono transition-colors duration-700" style={{
              left: `${pos}%`,
              transform: anchor === "left" ? "translateX(0)" : anchor === "right" ? "translateX(-100%)" : "translateX(-50%)",
              alignItems: anchor === "left" ? "flex-start" : anchor === "right" ? "flex-end" : "center",
            }}>
              <span style={{
                fontSize: "9px",
                lineHeight: "1.15",
                maxWidth: "56px",
                textAlign: anchor === "left" ? "left" : anchor === "right" ? "right" : "center",
                color: noShow ? CLR_RED : isDone ? CLR_GREEN : isActive ? "#D0D0D0" : CLR_GREY,
              }}>
                {s.label}
              </span>
              {/* Hora só sob pontos atingidos */}
              {isActive && hora && (
                <span style={{ fontSize: "9px", color: noShow ? CLR_RED : color, whiteSpace: "nowrap" }}>{hora}</span>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
