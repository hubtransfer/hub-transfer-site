"use client";

interface FinancialSummaryProps {
  totalRevenue: number;
  pendingRevenue: number;
  confirmedRevenue: number;
  completedRevenue: number;
}

const items = [
  { key: "totalRevenue", label: "Receita Total", icon: "💵" },
  { key: "pendingRevenue", label: "Valor Pendente", icon: "⏳" },
  { key: "confirmedRevenue", label: "Valor Confirmado", icon: "✅" },
  { key: "completedRevenue", label: "Valor Finalizado", icon: "🏁" },
] as const;

export default function FinancialSummary({
  totalRevenue,
  pendingRevenue,
  confirmedRevenue,
  completedRevenue,
}: FinancialSummaryProps) {
  const values = {
    totalRevenue,
    pendingRevenue,
    confirmedRevenue,
    completedRevenue,
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-hub-black-card to-hub-black-elevated border border-hub-gold/10 p-8">
      <h3 className="font-display text-2xl text-center mb-6 text-gradient-gold tracking-tight">
        💰 Resumo Financeiro
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.key}
            className="text-center bg-hub-gold/5 rounded-xl p-5 border border-hub-gold/10"
          >
            <div className="font-display text-2xl lg:text-3xl font-bold text-hub-gold mb-2">
              €{values[item.key].toFixed(2)}
            </div>
            <div className="text-hub-gray-400 text-sm font-semibold">
              {item.icon} {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
