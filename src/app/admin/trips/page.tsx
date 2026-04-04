"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTripsStore } from "@/hooks/useTripsStore";
import TripCard from "@/components/driver/DriverTripCard";
import DriverNameplate from "@/components/driver/DriverNameplate";
import RestaurantsTab from "@/components/admin/RestaurantsTab";
import type { TabType, HubViagem, TripService } from "@/lib/trips";
import {
  HUB_CENTRAL_URL,
  TAB_INFO,
  TEMPLATES,
  detectTipo,
  resolveLanguage,
  cleanHora,
  getWhatsAppUrl,
  getSmsUrl,
  todayStr,
  dateToISO,
} from "@/lib/trips";
import { validateLogin, getSession } from "@/lib/auth";

/* ================================================================== */
/*  TAB DEFINITIONS                                                    */
/* ================================================================== */

const TABS: { key: TabType; icon: string; label: string; mobileLabel: string }[] = [
  { key: "dia",       icon: "\u{1F5D3}",  label: "Dia Completo",  mobileLabel: "Hoje" },
  { key: "chegadas",  icon: "\u25BC",      label: "Chegadas",      mobileLabel: "Chegadas" },
  { key: "recolhas",  icon: "\u25B2",      label: "Recolhas",      mobileLabel: "Recolhas" },
  { key: "past",      icon: "\u{1F3C1}",  label: "Passadas",      mobileLabel: "Past" },
  { key: "cancelled", icon: "\u2715",      label: "Canceladas",    mobileLabel: "Cancelled" },
  { key: "restaurantes", icon: "\u{1F37D}\uFE0F", label: "Restaurantes", mobileLabel: "Rest" },
];

/* ================================================================== */
/*  CLOCK HOOK                                                         */
/* ================================================================== */


/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function tabColor(key: TabType, active: boolean) {
  if (!active) return "";
  if (key === "chegadas") return "bg-[#D4A847]/10 text-[#D4A847] border-r-2 border-[#D4A847]";
  if (key === "recolhas") return "bg-[#8B9DAF]/10 text-[#8B9DAF] border-r-2 border-[#8B9DAF]";
  return "bg-hub-gold/10 text-hub-gold border-r-2 border-hub-gold";
}

function syncDot(status: string) {
  if (status === "online") return "bg-emerald-500";
  if (status === "loading") return "bg-amber-500 animate-pulse";
  return "bg-red-500";
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function TripsPage() {
  const store = useTripsStore();

  // Reset trip modal
  const [resetTrip, setResetTrip] = useState<HubViagem | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToast, setResetToast] = useState("");

  const handleResetTrip = useCallback(async () => {
    if (!resetTrip || !resetPwd) return;
    setResetError("");
    setResetLoading(true);

    // Validate admin password via same GAS backend as login — use actual session name
    const session = getSession();
    const adminName = session?.name || "admin";
    const check = await validateLogin(adminName, resetPwd);
    if (!check.success) {
      setResetError("Senha incorrecta");
      setResetLoading(false);
      return;
    }

    // Send reset to GAS
    try {
      const url = `${HUB_CENTRAL_URL}?action=resetTrip&rowIndex=${encodeURIComponent(resetTrip.rowIndex || "")}&t=${Date.now()}`;
      const res = await fetch(url, { redirect: "follow" });
      const data = await res.json();
      if (data.success) {
        setResetToast("Viagem reactivada com sucesso");
        setResetTrip(null);
        setResetPwd("");
        store.syncViagens(true);
        setTimeout(() => setResetToast(""), 3000);
      } else {
        setResetError(data.message || "Erro ao resetar");
      }
    } catch {
      setResetError("Erro de conexão");
    }
    setResetLoading(false);
  }, [resetTrip, resetPwd, store]);

  // Local URL input
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    setUrlInput(store.hubViagensUrl);
  }, [store.hubViagensUrl]);

  // ── Dispatch handlers ──

  function handleDispatch(
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
  ) {
    // Find the driver from diaList (overrides already applied)
    const viagem = store.diaList.find(
      (v) => (v.id ?? (v.client || "").replace(/\W/g, "")) === cardId,
    );
    const driver = viagem?.driver ?? "";
    if (!driver) {
      alert("Seleciona um motorista primeiro!");
      return;
    }
    const drvObj = store.drivers.find((d) => d.name === driver);
    if (!drvObj?.phone) {
      alert(driver + " n\u00E3o tem n\u00FAmero.");
      return;
    }
    const resolvedLang = resolveLanguage(lang);
    const templateType = type as "CHEGADA" | "RECOLHA";
    const fn = TEMPLATES[templateType]?.[resolvedLang] || TEMPLATES[templateType]?.EN;
    if (!fn) return;
    const txt = fn(driver, client, origin, cleanHora(hora));
    window.open(getWhatsAppUrl(drvObj.phone, txt), "_blank");
  }

  function handleClientMsg(
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
    phone: string,
  ) {
    if (!phone) {
      alert("Cliente sem n\u00FAmero de telefone.");
      return;
    }
    const viagem = store.diaList.find(
      (v) => (v.id ?? (v.client || "").replace(/\W/g, "")) === cardId,
    );
    const driver = viagem?.driver ?? "";
    const resolvedLang = resolveLanguage(lang, phone);
    const templateType = type as "CHEGADA" | "RECOLHA";
    const fn = TEMPLATES[templateType]?.[resolvedLang] || TEMPLATES[templateType]?.EN;
    if (!fn) return;
    const txt = fn(driver || "o motorista", client, origin, cleanHora(hora));
    window.open(getWhatsAppUrl(phone, txt), "_blank");
  }

  function handleSmsMsg(
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
    phone: string,
  ) {
    if (!phone) {
      alert("Cliente sem n\u00FAmero de telefone.");
      return;
    }
    const viagem = store.diaList.find(
      (v) => (v.id ?? (v.client || "").replace(/\W/g, "")) === cardId,
    );
    const driver = viagem?.driver ?? "";
    const resolvedLang = resolveLanguage(lang, phone);
    const templateType = type as "CHEGADA" | "RECOLHA";
    const fn = TEMPLATES[templateType]?.[resolvedLang] || TEMPLATES[templateType]?.EN;
    if (!fn) return;
    const txt = fn(driver || "o motorista", client, origin, cleanHora(hora));
    window.open(getSmsUrl(phone, txt), "_blank");
  }

  // ── Date navigation ──

  function shiftDate(days: number) {
    const current = store.selectedDate
      ? new Date(dateToISO(store.selectedDate))
      : new Date();
    current.setDate(current.getDate() + days);
    const dd = String(current.getDate()).padStart(2, "0");
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const yyyy = current.getFullYear();
    store.loadDate(`${dd}/${mm}/${yyyy}`);
  }

  function goToday() {
    store.loadDate(todayStr());
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const info = TAB_INFO[store.currentTab];

  return (
    <div className="min-h-screen bg-hub-black text-white font-mono">
      {/* ─── TOP BAR ─── */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-hub-black-card border-b border-hub-gold/10 z-50 flex items-center justify-between px-4">
        {/* Logo */}
        <img src="/images/logo.png" alt="HUB Transfer" className="h-8 w-auto" />

        {/* Clock + Badges */}
        <div className="flex items-center gap-3">
          {/* Badges */}
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#D4A847]/10 text-[#D4A847] text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="text-[10px]">{"\u25BC"}</span> {store.counts.chegadas}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#8B9DAF]/10 text-[#8B9DAF] text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="text-[10px]">{"\u25B2"}</span> {store.counts.recolhas}
          </span>
          {/* Last sync + dot silencioso */}
          <span className="text-xs text-zinc-400 tabular-nums font-mono flex items-center gap-1.5">
            {store.backgroundRefreshing && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="A sincronizar em segundo plano" />
            )}
            {store.lastSyncTime ? `Sync: ${store.lastSyncTime}` : "Sync: --:--:--"}
          </span>
        </div>
      </header>

      {/* ─── SIDEBAR (desktop) ─── */}
      <aside className="fixed left-0 top-12 bottom-0 w-56 bg-hub-black-card border-r border-hub-gold/10 hidden lg:flex flex-col z-40">
        {/* Tab buttons */}
        <nav className="flex-1 overflow-y-auto py-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => store.switchTab(tab.key)}
              className={`w-full text-left px-4 py-3 font-mono text-sm hover:bg-hub-black-elevated transition-all flex items-center justify-between ${
                store.currentTab === tab.key
                  ? tabColor(tab.key, true)
                  : "text-zinc-400"
              }`}
            >
              <span>
                {tab.icon} {tab.label}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  store.currentTab === tab.key
                    ? "bg-white/10"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {store.counts[tab.key as keyof typeof store.counts] ?? 0}
              </span>
            </button>
          ))}
          {/* Partners link */}
          <a href="/admin/partners"
            className="w-full text-left px-4 py-3 font-mono text-sm text-zinc-400 hover:bg-hub-black-elevated hover:text-[#F0D030] transition-all flex items-center gap-2 border-t border-[#2A2A2A] mt-1">
            👥 Parceiros
          </a>
        </nav>

        {/* Sync status */}
        <div className="border-t border-hub-gold/10 px-4 py-3 space-y-2 text-xs">
          {/* HUB Central */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${syncDot(store.hubCentralSyncStatus)}`} />
              <span className="text-zinc-400">HUB Central</span>
            </div>
            <button
              onClick={() => store.syncDrivers(true)}
              className="text-hub-gold hover:text-yellow-300 transition-colors"
              title="Sincronizar motoristas"
            >
              {"\u21BB"}
            </button>
          </div>
          <p className="text-zinc-500 pl-4 truncate">{store.hubCentralSyncMsg}</p>

          {/* Viagens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${syncDot(store.hubViagensSyncStatus)}`} />
              <span className="text-zinc-400">Viagens</span>
            </div>
            <button
              onClick={() => store.syncViagens(true)}
              className="text-hub-gold hover:text-yellow-300 transition-colors"
              title="Sincronizar viagens"
            >
              {"\u21BB"}
            </button>
          </div>
          <p className="text-zinc-500 pl-4 truncate">{store.hubViagensSyncMsg}</p>

          {/* URL Config */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-zinc-500">Config GAS URL</span>
            <button
              onClick={store.toggleViagensConfig}
              className="text-zinc-400 hover:text-hub-gold transition-colors"
              title="Configurar URL"
            >
              {"\u2699\uFE0F"}
            </button>
          </div>
          {store.showViagensCfg && (
            <div className="flex gap-1 pt-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:border-hub-gold focus:outline-none"
              />
              <button
                onClick={() => store.saveViagensUrl(urlInput)}
                className="bg-hub-gold/20 text-hub-gold px-2 py-1 rounded text-xs hover:bg-hub-gold/30 transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── CONTENT AREA ─── */}
      <main className="lg:ml-56 mt-12 pb-16 lg:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <h1 className="text-lg font-bold text-white">{info.title}</h1>
          <p className="text-xs text-zinc-500">{info.sub}</p>
        </div>


        {/* ── DIA TAB ── */}
        {store.currentTab === "dia" && (
          <div className="px-4 sm:px-6 space-y-3">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Total", value: store.diaStats.total, color: "text-white", labelColor: "text-zinc-500" },
                { label: "Chegadas", value: store.diaStats.chegadas, color: "text-[#D4A847]", labelColor: "text-[#D4A847]" },
                { label: "Recolhas", value: store.diaStats.recolhas, color: "text-[#8B9DAF]", labelColor: "text-[#8B9DAF]" },
                { label: "Tours", value: store.diaStats.tours, color: "text-[#C17E4A]", labelColor: "text-[#C17E4A]" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-hub-black-card border border-hub-gold/5 rounded-lg px-3 py-2 text-center min-w-[70px]"
                >
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className={`text-[10px] uppercase tracking-wider ${s.labelColor}`}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Date picker bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => shiftDate(-1)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs transition-colors"
              >
                {"\u25C0"} Ontem
              </button>
              <button
                onClick={goToday}
                className="bg-hub-gold/20 text-hub-gold px-3 py-1.5 rounded text-xs font-bold hover:bg-hub-gold/30 transition-colors"
              >
                {"\u{1F4C5}"} Hoje
              </button>
              <button
                onClick={() => shiftDate(1)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs transition-colors"
              >
                Amanhã ▶
              </button>
              <input
                type="date"
                value={store.selectedDate ? dateToISO(store.selectedDate) : ""}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-");
                  store.loadDate(`${d}/${m}/${y}`);
                }}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-hub-gold focus:outline-none"
              />
              <select
                value={store.selectedDriver}
                onChange={(e) => store.filterDriver(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-hub-gold focus:outline-none"
              >
                <option value="">Todos motoristas</option>
                {store.drivers.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sync bar */}
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{store.selectedDate || todayStr()}</span>
              <span className={`w-2 h-2 rounded-full ${syncDot(store.hubViagensSyncStatus)}`} />
              <span>{store.hubViagensSyncMsg}</span>
              <button
                onClick={() => store.syncViagens(true)}
                className="ml-auto bg-hub-gold/20 text-hub-gold px-3 py-1 rounded text-xs hover:bg-hub-gold/30 transition-colors"
              >
                Sincronizar
              </button>
            </div>

            {/* Driver payment summary */}
            {Object.keys(store.diaPaySummary).length > 0 && (
              <div className="bg-hub-black-card border border-hub-gold/5 rounded-lg p-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Resumo por Motorista
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {Object.entries(store.diaPaySummary).map(([name, data]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-zinc-800/50"
                    >
                      <span className="text-white font-medium">{name}</span>
                      <span className="text-zinc-400">
                        {data.count} viagens &middot;{" "}
                        <span className="text-hub-gold">€{data.total.toFixed(0)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline / Cards — active trips only */}
            <div className="space-y-2 pb-4">
              {store.diaActiveList.length === 0 && store.diaDoneList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3 opacity-30">{"\u{1F5D3}"}</div>
                  <p className="text-zinc-500 text-sm">Nenhuma viagem para esta data</p>
                </div>
              ) : store.diaActiveList.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-sm">Todas as viagens foram concluídas</p>
                </div>
              ) : (
                store.diaActiveList.map((viagem) => (
                  <TripCard
                    key={viagem.id || (viagem.client || "x").replace(/\W/g, "")}
                    viagem={viagem}
                    drivers={store.drivers}
                    onSetDriver={store.diaSetDriver}
                    onDarBaixa={store.darBaixa}
                    onNoShow={store.markNoShow}
                    onDispatch={handleDispatch}
                    onClientMsg={handleClientMsg}
                    onSmsMsg={handleSmsMsg}
                    onShowNameplate={store.showNameplate}
                    onRefresh={store.syncViagensSilent}
                    mode="admin"
                    isHistorical={!store.isViewingToday}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── PAST TAB — completed hubViagens ── */}
        {store.currentTab === "past" && (
          <div className="px-4 sm:px-6 space-y-3 pb-4">
            {/* Date picker for past viagens */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono">Consultar data:</span>
              <input
                type="date"
                value={store.pastDate ? dateToISO(store.pastDate) : ""}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-");
                  store.loadPastDate(`${d}/${m}/${y}`);
                }}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-hub-gold focus:outline-none"
              />
              {store.pastLoading && <span className="text-xs text-hub-gold animate-pulse font-mono">A carregar...</span>}
              {store.pastDate && !store.pastLoading && (
                <span className="text-xs text-zinc-500 font-mono">
                  {store.pastViagens.length} viagens em {store.pastDate}
                </span>
              )}
            </div>

            {/* Today's completed viagens */}
            {store.diaDoneList.length > 0 && !store.pastDate && (
              <>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Concluídas hoje</p>
                {store.diaDoneList.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
                  const hora = cleanHora(viagem.pickupTime || "");
                  const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : "#C17E4A";
                  return (
                    <div key={vId}
                      className="bg-hub-black-card border border-hub-gold/5 rounded-lg px-4 py-3 flex items-center gap-3 opacity-60"
                      style={{ borderLeftWidth: "3px", borderLeftColor: typeColor }}>
                      <span className="font-mono text-sm font-bold text-zinc-500">{hora}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{viagem.client}</p>
                        {viagem.driver && <p className="text-[10px] text-zinc-500 truncate">{viagem.driver}</p>}
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>{tipo}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">CONCLUÍDA</span>
                      <button onClick={() => { setResetTrip(viagem); setResetPwd(""); setResetError(""); }}
                        className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/30 px-2 py-0.5 rounded cursor-pointer transition-colors">
                        🔄 Reactivar
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Fetched past viagens for selected date */}
            {store.pastDate && !store.pastLoading && (
              <>
                {store.pastViagens.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 text-sm">Nenhuma viagem para {store.pastDate}</p>
                  </div>
                ) : (
                  store.pastViagens.map((viagem) => {
                    const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                    const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
                    const hora = cleanHora(viagem.pickupTime || "");
                    const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : "#C17E4A";
                    const isDone = viagem.concluida || viagem.status === "CONCLUIDA" || viagem.status === "FINALIZOU";
                    return (
                      <div key={vId}
                        className={`bg-hub-black-card border border-hub-gold/5 rounded-lg px-4 py-3 flex items-center gap-3 ${isDone ? "opacity-60" : ""}`}
                        style={{ borderLeftWidth: "3px", borderLeftColor: typeColor }}>
                        <span className="font-mono text-sm font-bold text-zinc-500">{hora}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{viagem.client}</p>
                          {viagem.driver && <p className="text-[10px] text-zinc-500 truncate">{viagem.driver}</p>}
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>{tipo}</span>
                        {isDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">CONCLUÍDA</span>}
                        <button onClick={() => { setResetTrip(viagem); setResetPwd(""); setResetError(""); }}
                          className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/30 px-2 py-0.5 rounded cursor-pointer transition-colors">
                          🔄 Reactivar
                        </button>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* Empty state when no date selected and no done today */}
            {!store.pastDate && store.diaDoneList.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3 opacity-30">🏁</div>
                <p className="text-zinc-500 text-sm">Seleccione uma data para consultar viagens passadas</p>
              </div>
            )}
          </div>
        )}

        {/* ── CANCELLED TAB — no-shows ── */}
        {store.currentTab === "cancelled" && (
          <div className="px-4 sm:px-6 space-y-2 pb-4">
            {store.diaNoShowList.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">✕</div>
                <p className="text-zinc-500 text-sm">Nenhuma viagem cancelada / no-show</p>
              </div>
            ) : (
              store.diaNoShowList.map((viagem) => {
                const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
                const hora = cleanHora(viagem.pickupTime || "");
                const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : "#C17E4A";
                return (
                  <div
                    key={vId}
                    className="bg-hub-black-card border border-hub-gold/5 rounded-lg px-4 py-3 flex items-center gap-3 opacity-60"
                    style={{ borderLeftWidth: "3px", borderLeftColor: "#EF4444" }}
                  >
                    <span className="font-mono text-sm font-bold text-zinc-500">{hora}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{viagem.client}</p>
                      {viagem.driver && (
                        <p className="text-[10px] text-zinc-500 truncate">{viagem.driver}</p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                    >
                      {tipo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444]">
                      NO-SHOW
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── OTHER TABS (chegadas, recolhas) ── */}
        {store.currentTab !== "dia" && store.currentTab !== "past" && store.currentTab !== "cancelled" && (
          <div className="px-4 sm:px-6 space-y-3 pb-4">
            {(store.currentList as TripService[]).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">⚡</div>
                <p className="text-zinc-500 text-sm">Nenhuma viagem activa</p>
              </div>
            ) : (
              (store.currentList as TripService[]).map((s) => (
                <div
                  key={s.id}
                  className="bg-hub-black-card border border-hub-gold/5 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          s.type === "CHEGADA"
                            ? "bg-[#D4A847]/10 text-[#D4A847]"
                            : s.type === "RECOLHA"
                              ? "bg-[#8B9DAF]/10 text-[#8B9DAF]"
                              : "bg-[#C17E4A]/10 text-[#C17E4A]"
                        }`}
                      >
                        {(s.type || "").toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-white">{s.client || "—"}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{s.pickupTime || ""}</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {s.origin || "—"} → {s.destination || "—"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {s.flightNumber && (
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">✈ {s.flightNumber}</span>
                    )}
                    {s.assignedDriver && (
                      <span className="text-[10px] text-hub-gold bg-hub-gold/10 px-2 py-0.5 rounded">{s.assignedDriver}</span>
                    )}
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => store.markDone(s.id)}
                        className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors">
                        ✓ Done
                      </button>
                      <button onClick={() => store.markCancelled(s.id)}
                        className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── RESTAURANTES TAB ── */}
        {store.currentTab === "restaurantes" && <RestaurantsTab />}
      </main>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-hub-black-card border-t border-hub-gold/10 lg:hidden flex items-center z-50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => store.switchTab(tab.key)}
            className={`flex-shrink-0 flex flex-col items-center justify-center px-4 h-full text-xs transition-all ${
              store.currentTab === tab.key
                ? "text-hub-gold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.mobileLabel}</span>
          </button>
        ))}
      </nav>

      {/* ─── NAMEPLATE OVERLAY ─── */}
      <DriverNameplate
        isOpen={store.nameplateOpen}
        name={store.nameplateName}
        destination={store.nameplateDestination}
        onClose={store.closeNameplate}
      />

      {/* ─── RESET TRIP MODAL ─── */}
      {resetTrip && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setResetTrip(null)}>
          <div className="w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-amber-400">🔄 Reactivar viagem</h3>
            <p className="text-xs text-zinc-400">
              <span className="text-white font-semibold">{resetTrip.client}</span> — {cleanHora(resetTrip.pickupTime || "")} — {resetTrip.flight || "sem voo"}
            </p>
            <p className="text-xs text-zinc-500">Insira a senha de administrador para confirmar.</p>
            <input
              type="password"
              value={resetPwd}
              onChange={(e) => { setResetPwd(e.target.value); setResetError(""); }}
              placeholder="Senha admin"
              autoFocus
              className="w-full h-10 bg-[#0A0A0A] border border-amber-500/30 rounded-lg px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              onKeyDown={(e) => { if (e.key === "Enter") handleResetTrip(); }}
            />
            {resetError && <p className="text-xs text-red-400 font-mono">{resetError}</p>}
            <div className="flex gap-2">
              <button onClick={handleResetTrip} disabled={resetLoading || !resetPwd}
                className="flex-1 h-9 bg-amber-500/20 text-amber-400 font-bold text-sm rounded-lg hover:bg-amber-500/30 disabled:opacity-50 cursor-pointer transition-colors">
                {resetLoading ? "A verificar..." : "Confirmar"}
              </button>
              <button onClick={() => setResetTrip(null)}
                className="h-9 px-4 bg-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white cursor-pointer transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {resetToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#22C55E] text-black text-sm font-bold px-5 py-2.5 rounded-lg shadow-lg">
          {resetToast}
        </div>
      )}
    </div>
  );
}
