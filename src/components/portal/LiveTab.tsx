"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Transfer } from "@/lib/transfers";
import { getOriginFlag } from "@/lib/countryFlags";

interface LiveTabProps {
  services: Transfer[];
  onRefresh: () => void;
  hotelName: string;
}

// Extract airline IATA from flight number (TP1351 → TP, EZY3321 → EZY)
function extractAirline(flight: string): string {
  if (!flight) return "";
  const m = flight.trim().toUpperCase().match(/^([A-Z]{2,3})\d/);
  return m ? m[1] : "";
}

// Detect if origin is airport (CHEGADA)
function isArrival(origem: string): boolean {
  return (origem || "").toLowerCase().includes("aeroporto") || (origem || "").toLowerCase().includes("airport");
}

// Trip type detection
function getTripType(s: Transfer): "CHEGADA" | "RECOLHA" | "TOUR" {
  const tipo = (s.tipoServico || "").toLowerCase();
  if (tipo.includes("tour") || tipo.includes("private")) return "TOUR";
  if (isArrival(s.origem)) return "CHEGADA";
  return "RECOLHA";
}

const TYPE_COLORS = {
  CHEGADA: "#F5C518",
  RECOLHA: "#3B82F6",
  TOUR: "#A855F7",
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; order: number }> = {
  Solicitado: { label: "Aguardando", icon: "⏳", color: "#6B7280", order: 2 },
  Confirmado: { label: "Confirmado", icon: "✅", color: "#22C55E", order: 1 },
  Finalizado: { label: "Concluído", icon: "🏁", color: "#3B82F6", order: 3 },
  Cancelado: { label: "Cancelado", icon: "❌", color: "#EF4444", order: 4 },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status] || { label: status, icon: "❓", color: "#888", order: 5 };
}

// WhatsApp message templates
const MSG_TEMPLATES: Record<string, (name: string) => string> = {
  EN: (n) => `Dear ${n}, your transfer driver is ready! Please proceed to the arrivals exit. Welcome to Lisbon! 🇵🇹`,
  PT: (n) => `Olá ${n}, o seu motorista está pronto! Dirija-se à saída de chegadas. Bem-vindo a Lisboa! 🇵🇹`,
  ES: (n) => `Hola ${n}, su conductor está listo! Diríjase a la salida de llegadas. ¡Bienvenido a Lisboa! 🇵🇹`,
  FR: (n) => `Bonjour ${n}, votre chauffeur est prêt ! Rendez-vous à la sortie des arrivées. Bienvenue à Lisbonne ! 🇵🇹`,
  IT: (n) => `Ciao ${n}, il tuo autista è pronto! Dirigiti all'uscita arrivi. Benvenuto a Lisbona! 🇵🇹`,
  DE: (n) => `Hallo ${n}, Ihr Fahrer ist bereit! Bitte gehen Sie zum Ankunftsausgang. Willkommen in Lissabon! 🇵🇹`,
};

function getWhatsAppUrl(phone: string, name: string, lang: string = "EN"): string {
  const clean = phone.replace(/[^+\d]/g, "").replace(/^\+/, "");
  const template = MSG_TEMPLATES[lang.toUpperCase()] || MSG_TEMPLATES.EN;
  return `https://wa.me/${clean}?text=${encodeURIComponent(template(name.split(" ")[0]))}`;
}

// ─── Component ───

export default function LiveTab({ services, onRefresh, hotelName }: LiveTabProps) {
  const [lastUpdate, setLastUpdate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; phone: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Today filter
  const today = new Date().toISOString().slice(0, 10);
  const todayParts = today.split("-");
  const todayFmt = `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`;

  const todayServices = useMemo(() =>
    services.filter((s) => s.data === today || s.data === todayFmt),
    [services, today, todayFmt]
  );

  // Split: flights (CHEGADA with voo) vs other transfers
  const flights = useMemo(() =>
    todayServices
      .filter((s) => s.numeroVoo?.trim() && getTripType(s) === "CHEGADA")
      .sort((a, b) => {
        const sa = getStatus(a.status).order;
        const sb = getStatus(b.status).order;
        return sa !== sb ? sa - sb : (a.horaPickup || "").localeCompare(b.horaPickup || "");
      }),
    [todayServices]
  );

  const otherTransfers = useMemo(() =>
    todayServices
      .filter((s) => !s.numeroVoo?.trim() || getTripType(s) !== "CHEGADA")
      .sort((a, b) => (a.horaPickup || "").localeCompare(b.horaPickup || "")),
    [todayServices]
  );

  // Stats
  const totalGuests = todayServices.reduce((sum, s) => sum + (s.numeroPessoas || 1), 0);

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

  return (
    <div className="w-full px-4 py-5 animate-[fadeSlideIn_200ms_ease]">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
          </span>
          <h2 className="text-xl font-bold text-white">LIVE</h2>
          <span className="text-xs text-[#666] font-mono">{hotelName}</span>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && <span className="w-3 h-3 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />}
          <span className="text-[10px] text-[#888] font-mono">Actualizado: {lastUpdate}</span>
          <button onClick={doRefresh} className="text-[10px] text-[#F0D030] font-mono hover:text-[#D4B828] cursor-pointer font-bold">↻ Sync</button>
        </div>
      </div>

      {/* ═══ VOOS ═══ */}
      {flights.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[#D4A017] uppercase tracking-wider text-xs font-bold mb-3 font-mono">✈️ Voos de hoje — {flights.length}</h3>
          <div className="space-y-2">
            {flights.map((f) => {
              const st = getStatus(f.status);
              const airline = extractAirline(f.numeroVoo);
              const originFlag = airline ? getOriginFlag(airline === "TP" ? "LIS" : "") : "";
              // Shorten destination for display
              const destShort = (f.destino || "").replace("Aeroporto de Lisboa", "Aeroporto").replace(/,.*$/, "");
              const isComplete = f.status === "Finalizado";

              return (
                <div key={f.id}
                  className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden ${isComplete ? "opacity-60" : ""}`}
                  style={{ borderLeftWidth: "3px", borderLeftColor: st.color }}>

                  {/* Row 1: Type + Status */}
                  <div className="px-4 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono" style={{ color: TYPE_COLORS.CHEGADA }}>CHEGADA</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono" style={{ color: st.color }}>{st.icon} {st.label}</span>
                    </div>
                  </div>

                  {/* Row 2: Time + Name + Pax */}
                  <div className="flex items-center gap-3 px-4 py-1">
                    <span className="flex-shrink-0 font-bold font-mono text-2xl" style={{ color: st.color === "#22C55E" ? "#22C55E" : TYPE_COLORS.CHEGADA }}>
                      {f.horaPickup}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white truncate">{f.nomeCliente}</p>
                      <p className="text-xs text-[#888] truncate">→ {destShort}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs text-[#D0D0D0] font-mono">{f.numeroPessoas} pax</span>
                      {f.numeroBagagens > 0 && <span className="text-xs text-[#888] font-mono block">{f.numeroBagagens} bag</span>}
                    </div>
                  </div>

                  {/* Row 3: Flight number + link */}
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {originFlag && <span className="text-sm">{originFlag}</span>}
                      <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(f.numeroVoo)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="font-mono text-sm text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">
                        {f.numeroVoo}
                      </a>
                    </div>
                    {/* WhatsApp button */}
                    {f.contacto && (f.status === "Confirmado" || f.status === "Finalizado") && (
                      <button
                        onClick={() => setQrModal({ name: f.nomeCliente, phone: f.contacto })}
                        className="flex items-center gap-1 bg-[#25d366]/15 text-[#25d366] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#25d366]/25 transition-colors">
                        📱 WhatsApp
                      </button>
                    )}
                  </div>

                  {/* Row 4: Progress bar placeholder (visual only — no tracking data in Transfer type) */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs leading-none">{originFlag || "🌍"}</span>
                      <div className="flex-1 relative" style={{ height: "3px", borderRadius: "2px", backgroundColor: "#333" }}>
                        <div className="h-full" style={{
                          width: f.status === "Finalizado" ? "100%" : f.status === "Confirmado" ? "60%" : "10%",
                          backgroundColor: st.color,
                          borderRadius: "2px",
                          transition: "width 2s ease-in-out",
                        }} />
                      </div>
                      <span className="text-xs leading-none">🇵🇹</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ OTHER TRANSFERS ═══ */}
      {otherTransfers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[#D4A017] uppercase tracking-wider text-xs font-bold mb-3 font-mono">🚗 Transfers — {otherTransfers.length}</h3>
          <div className="space-y-1.5">
            {otherTransfers.map((s) => {
              const tipo = getTripType(s);
              const typeColor = TYPE_COLORS[tipo];
              const st = getStatus(s.status);
              const destShort = (s.destino || "").replace("Aeroporto de Lisboa", "Aeroporto").replace(/,.*$/, "");
              return (
                <div key={s.id}
                  className="bg-[#111] border border-[#2A2A2A] rounded-lg px-4 py-2.5 flex items-center gap-3"
                  style={{ borderLeftWidth: "3px", borderLeftColor: typeColor }}>
                  <span className="font-mono text-sm font-bold w-[48px]" style={{ color: typeColor }}>{s.horaPickup}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{s.nomeCliente}</p>
                    <p className="text-[10px] text-[#888] truncate">→ {destShort}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
                    {tipo}
                  </span>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: st.color }}>{st.icon}</span>
                  <span className="text-[10px] text-[#888] font-mono flex-shrink-0">{s.numeroPessoas}p</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {todayServices.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3 opacity-30">🏨</p>
          <p className="text-[#666] text-sm font-mono">Nenhum transfer para hoje</p>
        </div>
      )}

      {/* ═══ FOOTER STATS ═══ */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-[#2A2A2A] text-xs text-[#888] font-mono">
        <span>Hoje: <span className="text-white font-bold">{totalGuests}</span> hóspedes</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{flights.length}</span> voos</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{todayServices.length}</span> transfers</span>
      </div>

      {/* ═══ QR WHATSAPP MODAL ═══ */}
      {qrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-500 mb-1">Enviar mensagem para</p>
            <p className="text-xl font-bold text-black mb-4">{qrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(getWhatsAppUrl(qrModal.phone, qrModal.name))}&choe=UTF-8`}
              alt="QR Code" className="mx-auto mb-4 rounded-lg" width={200} height={200} />
            <p className="text-[10px] text-gray-400 mb-4">Aponte a câmara para o QR code</p>
            <a href={getWhatsAppUrl(qrModal.phone, qrModal.name)} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-[#25d366] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#1ea952] transition-colors">
              Abrir WhatsApp
            </a>
            <button onClick={() => setQrModal(null)} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
