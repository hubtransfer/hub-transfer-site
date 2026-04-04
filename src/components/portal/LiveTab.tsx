"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Transfer } from "@/lib/transfers";

interface LiveTabProps {
  services: Transfer[];
  onRefresh: () => void;
  hotelName: string;
}

// QR SVG generator (no external dependency)
function generateQrSvg(text: string, size: number = 200): string {
  // Simple QR-like visual placeholder — real QR needs a library
  // Use Google Charts API for actual QR
  return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(text)}&choe=UTF-8`;
}

const STATUS_MAP: Record<string, { label: string; icon: string; color: string; order: number }> = {
  "Solicitado": { label: "Aguardando", icon: "⏳", color: "#6B7280", order: 2 },
  "Confirmado": { label: "Confirmado", icon: "✅", color: "#22C55E", order: 1 },
  "Finalizado": { label: "Concluído", icon: "🏁", color: "#3B82F6", order: 3 },
  "Cancelado": { label: "Cancelado", icon: "❌", color: "#EF4444", order: 4 },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, icon: "❓", color: "#888", order: 5 };
}

const TEMPLATES: Record<string, (name: string) => string> = {
  EN: (n) => `Dear ${n}, your transfer driver is ready! Please proceed to the arrivals exit. Welcome to Lisbon! 🇵🇹`,
  PT: (n) => `Olá ${n}, o seu motorista está pronto! Dirija-se à saída de chegadas. Bem-vindo a Lisboa! 🇵🇹`,
  ES: (n) => `Hola ${n}, su conductor está listo! Diríjase a la salida de llegadas. ¡Bienvenido a Lisboa! 🇵🇹`,
  FR: (n) => `Bonjour ${n}, votre chauffeur est prêt ! Rendez-vous à la sortie des arrivées. Bienvenue à Lisbonne ! 🇵🇹`,
  IT: (n) => `Ciao ${n}, il tuo autista è pronto! Dirigiti all'uscita arrivi. Benvenuto a Lisbona! 🇵🇹`,
  DE: (n) => `Hallo ${n}, Ihr Fahrer ist bereit! Bitte gehen Sie zum Ankunftsausgang. Willkommen in Lissabon! 🇵🇹`,
};

export default function LiveTab({ services, onRefresh, hotelName }: LiveTabProps) {
  const [lastUpdate, setLastUpdate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; phone: string; lang: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Today's services
  const today = new Date().toISOString().slice(0, 10);
  const todayParts = today.split("-");
  const todayFormatted = `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`;
  const todayServices = services.filter((s) => s.data === today || s.data === todayFormatted);

  // Flights (CHEGADA with flight number)
  const flights = todayServices
    .filter((s) => s.numeroVoo && s.numeroVoo.trim() && (s.tipoServico || "").toLowerCase().includes("transfer"))
    .sort((a, b) => {
      const sa = getStatusInfo(a.status).order;
      const sb = getStatusInfo(b.status).order;
      if (sa !== sb) return sa - sb;
      return (a.horaPickup || "").localeCompare(b.horaPickup || "");
    });

  // Stats
  const totalGuests = todayServices.reduce((sum, s) => sum + (s.numeroPessoas || 1), 0);
  const totalFlights = flights.length;
  const totalTransfers = todayServices.length;

  // Auto-refresh
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setLastUpdate(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setRefreshing(false);
  }, [onRefresh]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    intervalRef.current = setInterval(doRefresh, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [doRefresh]);

  // QR message
  const getQrUrl = useCallback((phone: string, name: string, lang: string) => {
    const clean = phone.replace(/[^+\d]/g, "").replace(/^\+/, "");
    const template = TEMPLATES[lang.toUpperCase()] || TEMPLATES.EN;
    const msg = template(name.split(" ")[0]);
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }, []);

  return (
    <div className="w-full px-4 py-5 animate-[fadeSlideIn_200ms_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <h2 className="text-lg font-bold text-white">LIVE</h2>
          </div>
          <span className="text-xs text-[#666] font-mono">{hotelName}</span>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && <span className="w-3 h-3 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />}
          <span className="text-[10px] text-[#888] font-mono">Actualizado: {lastUpdate}</span>
          <button onClick={doRefresh} className="text-[10px] text-[#F0D030] font-mono hover:text-[#D4B828] cursor-pointer">Actualizar</button>
        </div>
      </div>

      {/* Flights section */}
      {flights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-amber-400 uppercase tracking-wider text-sm font-bold mb-3">✈️ Voos de hoje ({flights.length})</h3>
          <div className="space-y-2">
            {flights.map((f) => {
              const st = getStatusInfo(f.status);
              const isArrived = f.status === "Finalizado" || f.status === "Confirmado";
              return (
                <div key={f.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 flex items-center gap-3"
                  style={{ borderLeftWidth: "3px", borderLeftColor: st.color }}>
                  <div className="flex-shrink-0 text-center min-w-[40px]">
                    <span className="font-mono text-sm font-bold" style={{ color: st.color }}>{f.horaPickup}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(f.numeroVoo)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="font-mono text-sm text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">{f.numeroVoo}</a>
                      <span className="text-xs" style={{ color: st.color }}>{st.icon} {st.label}</span>
                    </div>
                    <p className="text-sm text-[#D0D0D0] truncate">{f.nomeCliente}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-[#888] font-mono">{f.numeroPessoas} pax</span>
                  </div>
                  {/* QR button for arrived flights */}
                  {isArrived && f.contacto && (
                    <button onClick={() => setQrModal({ name: f.nomeCliente, phone: f.contacto, lang: "EN" })}
                      className="text-[10px] bg-[#25d366]/15 text-[#25d366] px-2 py-1 rounded font-bold cursor-pointer hover:bg-[#25d366]/25 transition-colors flex-shrink-0">
                      📱 Msg
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All transfers section */}
      <div className="mb-6">
        <h3 className="text-amber-400 uppercase tracking-wider text-sm font-bold mb-3">🚗 Transfers hoje ({todayServices.length})</h3>
        {todayServices.length === 0 ? (
          <p className="text-[#666] text-sm font-mono text-center py-8">Nenhum transfer para hoje</p>
        ) : (
          <div className="space-y-1.5">
            {todayServices
              .sort((a, b) => (a.horaPickup || "").localeCompare(b.horaPickup || ""))
              .map((s) => {
                const st = getStatusInfo(s.status);
                const tipo = (s.tipoServico || "Transfer").toUpperCase();
                const tipoColor = tipo.includes("TOUR") ? "#A855F7" : s.origem?.toLowerCase().includes("aeroporto") ? "#F5C518" : "#3B82F6";
                return (
                  <div key={s.id} className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 flex items-center gap-2"
                    style={{ borderLeftWidth: "3px", borderLeftColor: tipoColor }}>
                    <span className="font-mono text-xs font-bold text-[#888] w-[44px]">{s.horaPickup}</span>
                    <span className="text-sm text-[#E0E0E0] flex-1 truncate">{s.nomeCliente}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tipoColor}20`, color: tipoColor }}>
                      {tipo.includes("TOUR") ? "TOUR" : s.origem?.toLowerCase().includes("aeroporto") ? "CHEGADA" : "RECOLHA"}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: st.color }}>{st.icon}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-center gap-6 py-3 border-t border-[#2A2A2A] text-xs text-[#888] font-mono">
        <span>Hoje: <span className="text-white font-bold">{totalGuests}</span> hóspedes</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{totalFlights}</span> voos</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{totalTransfers}</span> transfers</span>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-500 mb-2">Enviar mensagem WhatsApp para</p>
            <p className="text-xl font-bold text-black mb-4">{qrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generateQrSvg(getQrUrl(qrModal.phone, qrModal.name, qrModal.lang))} alt="QR Code"
              className="mx-auto mb-4 rounded-lg" width={200} height={200} />
            <p className="text-xs text-gray-400 mb-4">Aponte a câmara do telemóvel para o QR</p>
            <a href={getQrUrl(qrModal.phone, qrModal.name, qrModal.lang)} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-[#25d366] text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-[#1ea952] transition-colors">
              Abrir WhatsApp directamente
            </a>
            <button onClick={() => setQrModal(null)} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
