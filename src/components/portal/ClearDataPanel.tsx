"use client";

interface ClearDataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onClearTests: () => void;
}

export default function ClearDataPanel({
  isOpen,
  onClose,
  onClearAll,
  onClearTests,
}: ClearDataPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="mx-4 mt-4 p-6 rounded-2xl bg-hub-black-card border border-hub-error/20 animate-fade-in">
      <h3 className="font-display text-xl text-hub-error text-center mb-4">
        🧹 Limpeza de Dados
      </h3>
      <div className="bg-hub-error/10 border border-hub-error/20 rounded-xl p-4 mb-5 text-center">
        <p className="text-hub-error font-semibold text-sm">
          ⚠️ ATENÇÃO: Esta operação irá remover PERMANENTEMENTE todos os
          registros de transfers do sistema!
        </p>
        <p className="text-hub-gray-400 text-xs mt-1">
          Esta ação não pode ser desfeita.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onClearAll}
          className="bg-hub-error/20 text-hub-error border border-hub-error/30 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-hub-error/30 transition-all"
        >
          🗑️ Limpar Todos os Dados
        </button>
        <button
          onClick={onClearTests}
          className="bg-hub-warning/20 text-hub-warning border border-hub-warning/30 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-hub-warning/30 transition-all"
        >
          🧪 Limpar Apenas Testes
        </button>
        <button
          onClick={onClose}
          className="bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-hub-gold/30 hover:text-white transition-all"
        >
          ❌ Fechar
        </button>
      </div>
    </div>
  );
}
