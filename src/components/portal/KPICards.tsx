"use client";

interface KPICardsProps {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
}

const cards = [
  { key: "total", label: "Total de Serviços", icon: "📊", color: "hub-gold" },
  { key: "pending", label: "Solicitados", icon: "⏳", color: "hub-warning" },
  { key: "confirmed", label: "Confirmados", icon: "✅", color: "hub-success" },
  { key: "completed", label: "Finalizados", icon: "🏁", color: "blue-400" },
] as const;

export default function KPICards({
  total,
  pending,
  confirmed,
  completed,
}: KPICardsProps) {
  const values = { total, pending, confirmed, completed };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="card-hub p-6 text-center group hover:border-hub-gold/20 transition-all"
        >
          <div
            className={`font-display text-4xl font-bold text-${card.color} mb-2 tracking-tight`}
          >
            {values[card.key]}
          </div>
          <div className="text-hub-gray-400 text-sm uppercase tracking-wider font-semibold">
            {card.icon} {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
