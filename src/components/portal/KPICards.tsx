"use client";

interface KPICardsProps {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
}

export default function KPICards({ total, pending, confirmed, completed }: KPICardsProps) {
  const items = [
    { label: "Total", value: total, color: "#F0D030" },
    { label: "Solicitados", value: pending, color: "#FFA726" },
    { label: "Confirmados", value: confirmed, color: "#7EAA6E" },
    { label: "Finalizados", value: completed, color: "#60A5FA" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-center hover:border-[#F0D030]/20 transition-all hover:-translate-y-0.5 cursor-default"
        >
          <div className="text-xl font-bold font-mono" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="text-[10px] text-[#888] uppercase tracking-wider font-mono">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
