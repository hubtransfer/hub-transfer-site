"use client";

interface ActionBarProps {
  onScrollToForm: () => void;
  onClearForm: () => void;
  onExportCSV: () => void;
  onToggleConfig: () => void;
  onToggleClearData: () => void;
}

export default function ActionBar({
  onScrollToForm,
  onClearForm,
  onExportCSV,
  onToggleConfig,
  onToggleClearData,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-hub-black-card border-b border-hub-gold/10">
      <button
        onClick={onScrollToForm}
        className="bg-gradient-gold text-black font-bold px-5 py-2.5 rounded-xl text-sm uppercase tracking-wider hover:shadow-gold transition-all"
      >
        📋 Solicitar Transfer
      </button>
      <button
        onClick={onClearForm}
        className="bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-hub-gold/30 hover:text-white transition-all"
      >
        🧹 Limpar
      </button>
      <button
        onClick={onExportCSV}
        className="bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-hub-gold/30 hover:text-white transition-all"
      >
        📊 Exportar CSV
      </button>
      <button
        onClick={onToggleConfig}
        className="bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-hub-gold/30 hover:text-white transition-all"
      >
        ⚙️ Configurar
      </button>
      <button
        onClick={onToggleClearData}
        className="bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-hub-error/30 hover:text-hub-error transition-all"
      >
        🗑️ Limpar Dados
      </button>
    </div>
  );
}
