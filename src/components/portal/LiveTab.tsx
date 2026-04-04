"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Transfer } from "@/lib/transfers";
import type { HubViagem } from "@/lib/trips";
import { HUB_CENTRAL_URL, detectTipo, cleanHora, todayStr } from "@/lib/trips";
import { getOriginFlag } from "@/lib/countryFlags";
import { computeFlightState, getDelayedTime, delayColor } from "@/lib/flightUtils";
import DriverProgressBar from "@/components/shared/DriverProgressBar";

interface LiveTabProps {
  services: Transfer[];     // hotel's own transfer data
  onRefresh: () => void;
  hotelName: string;
  hotelCode: string;
}

// ─── Helpers ───

function getTripType(s: Transfer): "CHEGADA" | "RECOLHA" | "TOUR" {
  const tipo = (s.tipoServico || "").toLowerCase();
  if (tipo.includes("tour") || tipo.includes("private")) return "TOUR";
  if ((s.origem || "").toLowerCase().includes("aeroporto")) return "CHEGADA";
  return "RECOLHA";
}

const TYPE_COLORS: Record<string, string> = { CHEGADA: "#F5C518", RECOLHA: "#3B82F6", TOUR: "#A855F7" };

const STATUS_ORDER: Record<string, number> = { Confirmado: 1, Solicitado: 2, Finalizado: 3, Cancelado: 4 };

const MSG_TEMPLATES: Record<string, (n: string) => string> = {
  EN: (n) => `Dear ${n}, your transfer driver is ready! Please proceed to the arrivals exit. Welcome to Lisbon! 🇵🇹`,
  PT: (n) => `Olá ${n}, o seu motorista está pronto! Dirija-se à saída de chegadas. Bem-vindo a Lisboa! 🇵🇹`,
  ES: (n) => `Hola ${n}, su conductor está listo! Diríjase a la salida de llegadas. ¡Bienvenido a Lisboa! 🇵🇹`,
  FR: (n) => `Bonjour ${n}, votre chauffeur est prêt ! Rendez-vous à la sortie des arrivées. Bienvenue à Lisbonne ! 🇵🇹`,
  IT: (n) => `Ciao ${n}, il tuo autista è pronto! Dirigiti all'uscita arrivi. Benvenuto a Lisbona! 🇵🇹`,
  DE: (n) => `Hallo ${n}, Ihr Fahrer ist bereit! Willkommen in Lissabon! 🇵🇹`,
};

function waUrl(phone: string, name: string, lang: string = "EN"): string {
  const clean = phone.replace(/[^+\d]/g, "").replace(/^\+/, "");
  const fn = MSG_TEMPLATES[lang.toUpperCase()] || MSG_TEMPLATES.EN;
  return `https://wa.me/${clean}?text=${encodeURIComponent(fn(name.split(" ")[0]))}`;
}

// ─── Component ───

export default function LiveTab({ services, onRefresh, hotelName, hotelCode }: LiveTabProps) {
  const [lastUpdate, setLastUpdate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; phone: string; lang: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // HUB Central flight data (separate fetch)
  const [hubViagens, setHubViagens] = useState<HubViagem[]>([]);
  const [hubLoading, setHubLoading] = useState(true);

  // Tick for flight progress recalc
  const [tick, setTick] = useState(0);

  // Stable refs for callbacks (avoid re-render loops)
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const prevDataRef = useRef("");

  // Fetch from HUB Central (stable — no deps)
  const fetchHubCentral = useCallback(async () => {
    try {
      const url = `${HUB_CENTRAL_URL}?action=viagens&t=${Date.now()}`;
      const res = await fetch(url, { redirect: "follow" });
      const data = await res.json();
      let viagens: HubViagem[] = [];
      if (Array.isArray(data)) viagens = data;
      else if (data?.viagens && Array.isArray(data.viagens)) viagens = data.viagens;
      // Only update state if data actually changed
      const key = JSON.stringify(viagens.map((v) => v.id + (v.statusVoo || "") + (v.etaChegada || "")));
      if (key !== prevDataRef.current) {
        prevDataRef.current = key;
        setHubViagens(viagens);
      }
    } catch (err) {
      console.error("[LiveTab] HUB Central fetch error:", err);
    }
  }, []);

  // Initial load + intervals — runs ONCE on mount
  useEffect(() => {
    setHubLoading(true);
    fetchHubCentral().finally(() => setHubLoading(false));
    onRefreshRef.current();
    setLastUpdate(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    // Auto-refresh every 60 seconds
    const syncId = setInterval(async () => {
      setRefreshing(true);
      await fetchHubCentral();
      try { onRefreshRef.current(); } catch { /* */ }
      setLastUpdate(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setRefreshing(false);
    }, 180000);

    // Flight progress tick every 30 seconds
    const tickId = setInterval(() => setTick((t) => t + 1), 30000);

    return () => { clearInterval(syncId); clearInterval(tickId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHubCentral();
    try { onRefreshRef.current(); } catch { /* */ }
    setLastUpdate(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setRefreshing(false);
  }, [fetchHubCentral]);

  // Filter HUB Central viagens: today + matching hotel
  const hotelFlights = useMemo(() => {
    const hName = (hotelName || "").toLowerCase();
    const hCode = (hotelCode || "").toLowerCase();
    const today = todayStr();
    void tick; // force recalc

    return hubViagens.filter((v) => {
      // Must have flight number
      if (!v.flight?.trim()) return false;
      // Must be today
      const vDate = (v.date || "").trim();
      if (vDate && vDate !== today) {
        // Also check ISO format
        const [dd, mm, yy] = today.split("/");
        if (vDate !== `${yy}-${mm}-${dd}`) return false;
      }
      // Must match this hotel (check destination, origin, platform, id)
      const all = `${v.destination} ${v.origin} ${v.platform} ${v.id}`.toLowerCase();
      if (hName && (all.includes(hName) || hName.includes("empire") && all.includes("empire"))) return true;
      if (hCode && all.includes(hCode)) return true;
      // Broad match for hotel names
      if (hName.includes("empire lisbon") && all.includes("empire lisbon")) return true;
      if (hName.includes("empire marques") && all.includes("empire marques")) return true;
      if (hName.includes("gota") && all.includes("gota")) return true;
      if (hName.includes("lioz") && all.includes("lioz")) return true;
      return false;
    }).sort((a, b) => (a.pickupTime || "").localeCompare(b.pickupTime || ""));
  }, [hubViagens, hotelName, hotelCode, tick]);

  // Hotel's own transfers (today)
  const todayStr2 = new Date().toISOString().slice(0, 10);
  const todayParts = todayStr2.split("-");
  const todayFmt = `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`;
  const todayTransfers = useMemo(() =>
    services.filter((s) => s.data === todayStr2 || s.data === todayFmt)
      .filter((s) => !s.numeroVoo?.trim() || getTripType(s) !== "CHEGADA")
      .sort((a, b) => (a.horaPickup || "").localeCompare(b.horaPickup || "")),
    [services, todayStr2, todayFmt]
  );

  const totalGuests = useMemo(() => {
    const fromHub = hotelFlights.reduce((s, v) => s + (parseInt(v.pax || "1") || 1), 0);
    const fromHotel = todayTransfers.reduce((s, t) => s + (t.numeroPessoas || 1), 0);
    return fromHub + fromHotel;
  }, [hotelFlights, todayTransfers]);

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
          {(refreshing || hubLoading) && <span className="w-3 h-3 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />}
          <span className="text-[10px] text-[#888] font-mono">Sync: {lastUpdate}</span>
          <button onClick={doRefresh} className="text-[10px] text-[#F0D030] font-mono hover:text-[#D4B828] cursor-pointer font-bold">↻</button>
        </div>
      </div>

      {/* ═══ VOOS (from HUB Central) ═══ */}
      <div className="mb-8">
        <h3 className="text-[#D4A017] uppercase tracking-wider text-xs font-bold mb-3 font-mono">✈️ Voos — {hotelFlights.length}</h3>
        {hubLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-24 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
        ) : hotelFlights.length === 0 ? (
          <p className="text-[#666] text-sm font-mono text-center py-6">Nenhum voo para hoje</p>
        ) : (
          <div className="space-y-2">
            {hotelFlights.map((v) => {
              const tipo = detectTipo(v.origin || "", v.flight || "", v.type);
              const hora = cleanHora(v.pickupTime || "");
              const depIata = (v.depIata || "").toUpperCase().trim();
              const originFlag = getOriginFlag(depIata);
              const delayMin = parseInt(v.atrasoMin || "0", 10) || 0;
              const depDelayMin = parseInt(v.depDelay || "0", 10) || 0;
              const etaChegada = (v.etaChegada || "").trim();
              const arrOriginal = (v.arrOriginal || "").trim();
              const depTime = (v.depTime || "").trim();
              const depActual = (v.depActual || "").trim();
              const hasDepDiff = depActual && depTime && depActual !== depTime;
              const hasArrDiff = arrOriginal && etaChegada && arrOriginal !== etaChegada;
              const isLanded = (v.statusVoo || "").toUpperCase().includes("ATERRISADO") || (v.statusVoo || "").toUpperCase().includes("LANDED");
              const displayTime = isLanded ? (v.arrTime || etaChegada || hora) : (etaChegada || arrOriginal || v.arrTime || hora);

              const flight = computeFlightState(
                v.depTime || "", v.arrTime || "", hora, v.statusVoo || "",
                delayMin, v.etaChegada || "", v.depActualFull || v.depTimeFull || "", v.etaChegadaFull || ""
              );

              const cardKey = v.id || v.client || String(Math.random());
              const isExpanded = expandedId === cardKey;

              return (
                <div key={cardKey}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden cursor-pointer hover:bg-[#1A1A1A]/80 transition-all duration-200"
                  style={{ borderLeftWidth: "3px", borderLeftColor: flight.cancelled ? "#EF4444" : isLanded ? "#22C55E" : "#F5C518" }}
                  onClick={() => setExpandedId(isExpanded ? null : cardKey)}>

                  {/* Type + arrow */}
                  <div className="px-4 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono" style={{ color: TYPE_COLORS[tipo] || "#F5C518" }}>{tipo}</span>
                    <span className="text-[10px] text-[#555] transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                  </div>

                  {/* Time + Name + Pax */}
                  <div className="flex items-center gap-3 px-4 py-1">
                    <span className="flex-shrink-0 font-bold font-mono text-2xl" style={{ color: isLanded ? "#22C55E" : "#F5C518" }}>{displayTime}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white truncate">{v.client}</p>
                    </div>
                    <span className="text-xs text-[#D0D0D0] font-mono flex-shrink-0">{v.pax || "1"} pax</span>
                  </div>

                  {/* Flight info — centered */}
                  <div className="px-4 py-1 flex items-center justify-center gap-2 flex-wrap">
                    <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(v.flight)}`}
                      target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                      className="font-mono text-sm text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer">{v.flight}</a>
                    {depDelayMin > 0 && (
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-mono font-bold">+{depDelayMin}min partida</span>
                    )}
                    <span className="font-mono text-[10px]" style={{ color: flight.color }}>{flight.statusText}</span>
                  </div>

                  {/* Flight + driver bars block */}
                  {!flight.noData && !flight.cancelled && (
                    <div className="px-4 pb-1 space-y-1">
                      {/* Times — dep left, arr right */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {hasDepDiff ? (
                            <><span className="font-mono text-xs line-through text-gray-500">{depTime}</span><span className="font-mono text-sm font-semibold text-white">→ {depActual}</span></>
                          ) : depTime ? <span className="font-mono text-xs text-gray-400">{depTime}</span> : null}
                        </div>
                        <div className="flex items-center gap-1">
                          {hasArrDiff ? (
                            <><span className="font-mono text-xs line-through text-gray-500">{arrOriginal}</span><span className="font-mono text-sm font-semibold text-white">→ {etaChegada}</span></>
                          ) : <span className="font-mono text-xs text-gray-400">{etaChegada || v.arrTime || ""}</span>}
                        </div>
                      </div>

                      {/* Flight bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-sm leading-none">{originFlag || "🌍"}</span>
                          <span className="font-mono text-sm font-bold text-[#D4A017]">{depIata || "???"}</span>
                        </div>
                        <div className="flex-1 relative" style={{ height: "3px", borderRadius: "2px", backgroundColor: "#333" }}>
                          <div className="h-full transition-all duration-[2s] ease-in-out" style={{ width: `${Math.max(flight.progress, 2)}%`, backgroundColor: flight.color, borderRadius: "2px" }} />
                          {flight.progress > 0 && flight.progress < 100 && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={flight.color}
                              className="absolute top-1/2 -translate-y-1/2 transition-all duration-[2s] ease-in-out"
                              style={{ left: `calc(${Math.max(flight.progress, 2)}% - 6px)`, filter: "drop-shadow(0 0 2px rgba(0,0,0,.7))" }}>
                              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-sm leading-none">🇵🇹</span>
                          <span className="font-mono text-sm font-bold text-[#D4A017]">LIS</span>
                        </div>
                      </div>

                      {/* Driver progress bar */}
                      <DriverProgressBar statusMotorista={v.statusMotorista} />
                    </div>
                  )}

                  {/* Pickup */}
                  <p className="text-center font-mono text-sm py-1" style={{ color: "#D4A017" }}>🚗 Pickup: {hora}</p>

                  {/* WhatsApp button */}
                  {v.phone && (isLanded || (v.statusVoo || "").toUpperCase().includes("APROXIM")) && (
                    <div className="px-4 pb-2 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setQrModal({ name: v.client, phone: v.phone, lang: v.language || "EN" }); }}
                        className="inline-flex items-center gap-1.5 bg-green-600/20 text-green-400 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-green-600/30 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                    </div>
                  )}

                  {/* ═══ EXPANDED DETAILS ═══ */}
                  <div className="transition-all duration-300 ease-in-out overflow-hidden" style={{ maxHeight: isExpanded ? "400px" : "0", opacity: isExpanded ? 1 : 0 }}>
                    <div className="border-t border-[#2A2A2A] bg-[#161616] px-4 py-4">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {/* Left column */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">ID Viagem</p>
                          <p className="text-sm text-white font-medium font-mono">{v.id || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Referência</p>
                          <p className="text-sm text-white font-medium font-mono">{(v as unknown as Record<string, string>).referencia || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Data</p>
                          <p className="text-sm text-white font-medium">{v.date || v.flightDate || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Cliente</p>
                          <p className="text-sm text-white font-medium">{v.client}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Hora Pick-up</p>
                          <p className="text-sm text-white font-medium font-mono">{hora}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Contacto</p>
                          {v.phone ? (
                            <a href={`tel:${v.phone}`} onClick={(e) => e.stopPropagation()} className="text-sm text-amber-400 hover:text-amber-300 font-medium font-mono underline">{v.phone}</a>
                          ) : <p className="text-sm text-gray-500">—</p>}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Pessoas / Bagagens</p>
                          <p className="text-sm text-white font-medium">{v.pax || "1"} pax · {v.bags || "0"} bag</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Voo</p>
                          <p className="text-sm text-white font-medium font-mono">{v.flight}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Idioma</p>
                          <p className="text-sm text-white font-medium">{v.language || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Rota</p>
                          <p className="text-sm text-white font-medium">{v.origin || "—"} → {v.destination || "—"}</p>
                        </div>
                        {v.notes && (
                          <div className="col-span-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Observações</p>
                            <p className="text-sm text-[#D0D0D0]">{v.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ OTHER TRANSFERS (from hotel's own data) ═══ */}
      {todayTransfers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[#D4A017] uppercase tracking-wider text-xs font-bold mb-3 font-mono">🚗 Outros Transfers — {todayTransfers.length}</h3>
          <div className="space-y-1.5">
            {todayTransfers.map((s) => {
              const tipo = getTripType(s);
              const typeColor = TYPE_COLORS[tipo];
              return (
                <div key={s.id} className="bg-[#111] border border-[#2A2A2A] rounded-lg px-4 py-2.5 flex items-center gap-3"
                  style={{ borderLeftWidth: "3px", borderLeftColor: typeColor }}>
                  <span className="font-mono text-sm font-bold w-[48px]" style={{ color: typeColor }}>{s.horaPickup}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{s.nomeCliente}</p>
                    <p className="text-[10px] text-[#888] truncate">→ {(s.destino || "").replace(/,.*$/, "")}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>{tipo}</span>
                  <span className="text-[10px] text-[#888] font-mono flex-shrink-0">{s.numeroPessoas}p</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {hotelFlights.length === 0 && todayTransfers.length === 0 && !hubLoading && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3 opacity-30">🏨</p>
          <p className="text-[#666] text-sm font-mono">Nenhum transfer para hoje</p>
        </div>
      )}

      {/* ═══ FOOTER STATS ═══ */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-[#2A2A2A] text-xs text-[#888] font-mono">
        <span><span className="text-white font-bold">{totalGuests}</span> hóspedes</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{hotelFlights.length}</span> voos</span>
        <span className="text-[#2A2A2A]">|</span>
        <span><span className="text-white font-bold">{hotelFlights.length + todayTransfers.length}</span> transfers</span>
      </div>

      {/* ═══ QR MODAL ═══ */}
      {qrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-500 mb-1">Enviar mensagem para</p>
            <p className="text-xl font-bold text-black mb-4">{qrModal.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(waUrl(qrModal.phone, qrModal.name, qrModal.lang))}&choe=UTF-8`}
              alt="QR" className="mx-auto mb-4 rounded-lg" width={200} height={200} />
            <a href={waUrl(qrModal.phone, qrModal.name, qrModal.lang)} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-[#25d366] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#1ea952] transition-colors">
              Abrir WhatsApp
            </a>
            <button onClick={() => setQrModal(null)} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
