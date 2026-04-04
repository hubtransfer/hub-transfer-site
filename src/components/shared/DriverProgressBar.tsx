"use client";

interface DriverProgressBarProps {
  statusMotorista?: string;
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
  return 1; // AGUARDANDO or empty → car at first dot
}

const CLR_GOLD = "#D4A017";
const CLR_GREEN = "#4CAF50";
const CLR_GREY = "#4B5563";

const CarIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

export default function DriverProgressBar({ statusMotorista }: DriverProgressBarProps) {
  const activeStep = statusToStep(statusMotorista || "");
  const isDone = activeStep >= 4;
  const color = isDone ? CLR_GREEN : CLR_GOLD;

  // Active line goes from dot 1 to the active dot. Each segment = 33.33% of total width.
  // activeStep 1 = 0% (at first dot, no line filled)
  // activeStep 2 = 33.33% (line from dot1 to dot2)
  // activeStep 3 = 66.66% (line from dot1 to dot3)
  // activeStep 4 = 100% (line from dot1 to dot4)
  const linePct = Math.max(0, ((activeStep - 1) / 3) * 100);

  return (
    <div className="w-full px-4 py-2">
      {/* Dots + lines */}
      <div className="relative flex items-center justify-between" style={{ height: "24px" }}>
        {/* Background dashed line (full width between dots) */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2" style={{
          height: "2px",
          backgroundImage: `repeating-linear-gradient(90deg, ${CLR_GREY}40 0px, ${CLR_GREY}40 5px, transparent 5px, transparent 10px)`,
        }} />

        {/* Active solid line (from dot 1 to current dot) */}
        {activeStep > 1 && (
          <div className="absolute top-1/2 left-0 -translate-y-1/2 transition-all duration-500 ease-in-out" style={{
            height: "2px",
            width: `${linePct}%`,
            backgroundColor: color,
          }} />
        )}

        {/* 4 dots */}
        {STEPS.map((_, i) => {
          const stepNum = i + 1;
          const isActive = activeStep >= stepNum;
          const isCurrent = activeStep === stepNum;
          return (
            <div key={i} className="relative flex items-center justify-center" style={{ zIndex: 2 }}>
              <div className="w-[10px] h-[10px] rounded-full border-2 transition-all duration-500" style={{
                borderColor: isActive ? color : CLR_GREY,
                backgroundColor: isActive ? color : "transparent",
              }} />
              {/* Car on current dot */}
              {isCurrent && !isDone && (
                <div className="absolute -top-[18px] transition-all duration-500">
                  <CarIcon color={color} />
                </div>
              )}
              {/* Flag on last dot when done */}
              {i === 3 && isDone && (
                <div className="absolute -top-[18px]">
                  <span className="text-sm" style={{ color: CLR_GREEN }}>🏁</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels below dots */}
      <div className="flex justify-between mt-0.5">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isActive = activeStep >= stepNum;
          return (
            <span key={s.key} className="text-center font-mono transition-colors duration-500" style={{
              fontSize: "9px",
              color: isDone ? CLR_GREEN : isActive ? "#D0D0D0" : "#4B5563",
              width: "25%",
            }}>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.short}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
