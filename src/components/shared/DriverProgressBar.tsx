"use client";

interface DriverProgressBarProps {
  statusMotorista?: string;
  depTime?: string;
  depActual?: string;
  arrOriginal?: string;
  etaChegada?: string;
}

const STEPS = [
  { key: "A_CAMINHO", label: "A caminho", short: "A cam." },
  { key: "NO_LOCAL", label: "No local", short: "Local" },
  { key: "EM_VIAGEM", label: "Cliente", short: "Client." },
  { key: "FINALIZADO", label: "Destino", short: "Dest." },
];

function statusToStep(s: string): number {
  const u = (s || "").toUpperCase().replace(/[_\s]+/g, "_");
  if (u === "FINALIZADO" || u === "CONCLUIDA" || u.includes("FINALIZOU")) return 4;
  if (u === "EM_VIAGEM" || u.includes("EM VIAGEM")) return 3;
  if (u === "NO_LOCAL" || u.includes("NO LOCAL") || u.includes("CHEGOU")) return 2;
  if (u === "A_CAMINHO") return 1;
  return 0;
}

const CLR_GOLD = "#D4A017";
const CLR_GREEN = "#4CAF50";
const CLR_GREY = "#4B5563";
const CLR_GREY_DIM = "#374151";

/* Car SVG pointing right */
const CarIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

export default function DriverProgressBar({ statusMotorista, depTime, depActual, arrOriginal, etaChegada }: DriverProgressBarProps) {
  const activeStep = statusToStep(statusMotorista || "");
  const isDone = activeStep >= 4;
  const dotColor = isDone ? CLR_GREEN : CLR_GOLD;
  const hasDepDiff = depActual && depTime && depActual !== depTime;
  const hasArrDiff = arrOriginal && etaChegada && arrOriginal !== etaChegada;

  return (
    <div className="w-full px-2 py-2">
      {/* Main bar row */}
      <div className="flex items-center gap-1.5">
        {/* Left: dep times */}
        <div className="flex-shrink-0 text-right min-w-[48px]">
          {depTime && (
            hasDepDiff ? (
              <><span className="font-mono text-[10px] line-through text-gray-500 block">{depTime}</span><span className="font-mono text-[10px] text-white block">{depActual}</span></>
            ) : (
              <span className="font-mono text-[10px] text-gray-400">{depTime}</span>
            )
          )}
        </div>

        {/* Car + dots + line */}
        <div className="flex-1 relative flex items-center" style={{ minHeight: "20px" }}>
          {/* Background dashed line */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2" style={{ height: "2px", backgroundImage: `repeating-linear-gradient(90deg, ${CLR_GREY_DIM} 0px, ${CLR_GREY_DIM} 6px, transparent 6px, transparent 12px)` }} />

          {/* Active solid line */}
          {activeStep > 0 && (
            <div className="absolute top-1/2 left-0 -translate-y-1/2 transition-all duration-500 ease-in-out" style={{
              height: "2px",
              width: `${Math.min((activeStep / 4) * 100, 100)}%`,
              backgroundColor: isDone ? CLR_GREEN : CLR_GOLD,
            }} />
          )}

          {/* Dots */}
          <div className="relative w-full flex items-center justify-between">
            {STEPS.map((s, i) => {
              const stepNum = i + 1;
              const isActive = activeStep >= stepNum;
              const isCurrent = activeStep === stepNum;
              return (
                <div key={s.key} className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
                  <div className="w-[10px] h-[10px] rounded-full border-2 transition-all duration-500"
                    style={{
                      borderColor: isActive ? (isDone ? CLR_GREEN : dotColor) : CLR_GREY,
                      backgroundColor: isActive ? (isDone ? CLR_GREEN : dotColor) : "transparent",
                    }} />
                  {/* Car icon on current step */}
                  {isCurrent && !isDone && (
                    <div className="absolute -top-5 transition-all duration-500">
                      <CarIcon color={dotColor} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Car at start if no step active */}
          {activeStep === 0 && (
            <div className="absolute -top-3 left-0 transition-all duration-500" style={{ zIndex: 3 }}>
              <CarIcon color={CLR_GREY} />
            </div>
          )}

          {/* Flag at end if done */}
          {isDone && (
            <div className="absolute -top-3 right-0 transition-all duration-500" style={{ zIndex: 3 }}>
              <span className="text-sm" style={{ color: CLR_GREEN }}>🏁</span>
            </div>
          )}
        </div>

        {/* Right: arr times */}
        <div className="flex-shrink-0 text-left min-w-[48px]">
          {(arrOriginal || etaChegada) && (
            hasArrDiff ? (
              <><span className="font-mono text-[10px] line-through text-gray-500 block">{arrOriginal}</span><span className="font-mono text-[10px] text-white block">{etaChegada}</span></>
            ) : (
              <span className="font-mono text-[10px] text-gray-400">{etaChegada || arrOriginal}</span>
            )
          )}
        </div>
      </div>

      {/* Labels below dots */}
      <div className="flex items-start mt-1 px-[50px]">
        <div className="flex-1 flex justify-between">
          {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const isActive = activeStep >= stepNum;
            return (
              <span key={s.key} className="text-center transition-colors duration-500 font-mono"
                style={{ fontSize: "9px", color: isDone ? CLR_GREEN : isActive ? "#D0D0D0" : "#4B5563" }}>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.short}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
