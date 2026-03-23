"use client";

import { useState } from "react";
import { WEBAPP_URL } from "@/lib/transfers";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTestConnection: (url: string) => void;
  statusMessage: string | null;
  statusType: string;
}

export default function ConfigPanel({
  isOpen,
  onClose,
  onTestConnection,
  statusMessage,
  statusType,
}: ConfigPanelProps) {
  const [url, setUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("webappUrl") || WEBAPP_URL;
    }
    return WEBAPP_URL;
  });

  if (!isOpen) return null;

  const statusColorMap: Record<string, string> = {
    success: "bg-hub-success/20 text-hub-success border-hub-success/30",
    error: "bg-hub-error/20 text-hub-error border-hub-error/30",
    warning: "bg-hub-warning/20 text-hub-warning border-hub-warning/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="mx-4 mt-4 p-6 rounded-2xl bg-hub-black-card border border-hub-gold/20 animate-fade-in">
      <h3 className="font-display text-xl text-hub-gold text-center mb-4">
        ⚙️ Configuração do Google Sheets
      </h3>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-hub-gray-400 text-sm font-semibold mb-2">
            URL do Google Apps Script:
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full p-3 bg-hub-black-light border border-hub-gold/10 text-white rounded-xl focus:border-hub-gold focus:ring-1 focus:ring-hub-gold/20 outline-none text-sm"
          />
        </div>
        <button
          onClick={() => onTestConnection(url)}
          className="bg-hub-success/20 text-hub-success border border-hub-success/30 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-hub-success/30 transition-all whitespace-nowrap"
        >
          ✅ Testar Conexão
        </button>
        <button
          onClick={onClose}
          className="bg-hub-error/20 text-hub-error border border-hub-error/30 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-hub-error/30 transition-all whitespace-nowrap"
        >
          ❌ Fechar
        </button>
      </div>
      {statusMessage && (
        <div
          className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold border ${statusColorMap[statusType] || statusColorMap.info}`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
