"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTripsStore } from "@/hooks/useTripsStore";
import TripCard from "@/components/trips/TripCard";
import Nameplate from "@/components/trips/Nameplate";
import type { TabType, HubViagem, TripService } from "@/lib/trips";
import {
  TAB_INFO,
  TEMPLATES,
  resolveLanguage,
  cleanHora,
  getWhatsAppUrl,
  getSmsUrl,
  todayStr,
  dateToISO,
} from "@/lib/trips";

/* ================================================================== */
/*  TAB DEFINITIONS                                                    */
/* ================================================================== */

const TABS: { key: TabType; icon: string; label: string; mobileLabel: string }[] = [
  { key: "dia",       icon: "\u{1F5D3}",  label: "Dia Completo",  mobileLabel: "Hoje" },
  { key: "current",   icon: "\u26A1",      label: "Actuais",       mobileLabel: "Current" },
  { key: "chegadas",  icon: "\u25BC",      label: "Chegadas",      mobileLabel: "Chegadas" },
  { key: "recolhas",  icon: "\u25B2",      label: "Recolhas",      mobileLabel: "Recolhas" },
  { key: "past",      icon: "\u{1F3C1}",  label: "Passadas",      mobileLabel: "Past" },
  { key: "cancelled", icon: "\u2715",      label: "Canceladas",    mobileLabel: "Cancelled" },
];

/* ================================================================== */
/*  CLOCK HOOK                                                         */
/* ================================================================== */

function useLisbonClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("pt-PT", {
          timeZone: "Europe/Lisbon",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function tabColor(key: TabType, active: boolean) {
  if (!active) return "";
  if (key === "chegadas") return "bg-[#f59e0b]/10 text-[#f59e0b] border-r-2 border-[#f59e0b]";
  if (key === "recolhas") return "bg-[#10b981]/10 text-[#10b981] border-r-2 border-[#10b981]";
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
  const clock = useLisbonClock();

  // Filter sub-tab for "current" view
  const [currentFilter, setCurrentFilter] = useState<"all" | "chegadas" | "recolhas">("all");

  // Local URL input
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    setUrlInput(store.hubViagensUrl);
  }, [store.hubViagensUrl]);

  // ── Computed: filtered current list ──
  const filteredCurrentList = useMemo(() => {
    if (store.currentTab !== "current" || currentFilter === "all") return store.currentList;
    return (store.currentList as TripService[]).filter((s) => {
      const tipo = (s.type || "").toLowerCase();
      if (currentFilter === "chegadas") return tipo === "chegada";
      if (currentFilter === "recolhas") return tipo === "recolha";
      return true;
    });
  }, [store.currentList, store.currentTab, currentFilter]);

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
        <span className="text-lg font-black tracking-widest bg-gradient-to-r from-hub-gold to-yellow-400 bg-clip-text text-transparent">
          HUB OPS
        </span>

        {/* Clock + Badges */}
        <div className="flex items-center gap-3">
          {/* Badges */}
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="text-[10px]">{"\u25BC"}</span> {store.counts.chegadas}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#10b981]/10 text-[#10b981] text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="text-[10px]">{"\u25B2"}</span> {store.counts.recolhas}
          </span>
          {/* Clock */}
          <span className="text-xs text-zinc-400 tabular-nums">{clock}</span>
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

        {/* Filter chips (current tab only) */}
        {store.currentTab === "current" && (
          <div className="px-4 sm:px-6 pb-3 flex gap-2">
            {(["all", "chegadas", "recolhas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCurrentFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  currentFilter === f
                    ? "bg-hub-gold/20 text-hub-gold"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {f === "all" ? "Todos" : f === "chegadas" ? "\u25BC Chegadas" : "\u25B2 Recolhas"}
              </button>
            ))}
          </div>
        )}

        {/* ── DIA TAB ── */}
        {store.currentTab === "dia" && (
          <div className="px-4 sm:px-6 space-y-3">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Total", value: store.diaStats.total, color: "text-white" },
                { label: "Chegadas", value: store.diaStats.chegadas, color: "text-amber-400" },
                { label: "Recolhas", value: store.diaStats.recolhas, color: "text-emerald-400" },
                { label: "Tours", value: store.diaStats.tours, color: "text-purple-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-hub-black-card border border-hub-gold/5 rounded-lg px-3 py-2 text-center min-w-[70px]"
                >
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
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
                Amanh\u00E3 {"\u25B6"}
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
                        <span className="text-hub-gold">{data.total.toFixed(0)}\u20AC</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline / Cards */}
            <div className="space-y-3 pb-4">
              {store.diaList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3 opacity-30">{"\u{1F5D3}"}</div>
                  <p className="text-zinc-500 text-sm">Nenhuma viagem para esta data</p>
                </div>
              ) : (
                store.diaList.map((viagem) => (
                  <TripCard
                    key={(viagem as HubViagem & { cardId?: string }).cardId ?? viagem.id}
                    viagem={viagem}
                    drivers={store.drivers}
                    onSetDriver={store.diaSetDriver}
                    onDarBaixa={store.darBaixa}
                    onDispatch={handleDispatch}
                    onClientMsg={handleClientMsg}
                    onSmsMsg={handleSmsMsg}
                    onShowNameplate={store.showNameplate}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {store.currentTab !== "dia" && (
          <div className="px-4 sm:px-6 space-y-3 pb-4">
            {(store.currentTab === "current"
              ? filteredCurrentList
              : store.currentList
            ).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">
                  {store.currentTab === "past"
                    ? "\u{1F3C1}"
                    : store.currentTab === "cancelled"
                      ? "\u2715"
                      : "\u26A1"}
                </div>
                <p className="text-zinc-500 text-sm">
                  {store.currentTab === "past"
                    ? "Nenhuma viagem conclu\u00EDda"
                    : store.currentTab === "cancelled"
                      ? "Nenhuma viagem cancelada"
                      : "Nenhuma viagem activa"}
                </p>
              </div>
            ) : (
              (store.currentTab === "current"
                ? (filteredCurrentList as TripService[])
                : (store.currentList as TripService[])
              ).map((s) => (
                <div
                  key={s.id}
                  className="bg-hub-black-card border border-hub-gold/5 rounded-lg p-4 space-y-2"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          s.type === "CHEGADA"
                            ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                            : s.type === "RECOLHA"
                              ? "bg-[#10b981]/10 text-[#10b981]"
                              : "bg-[#a855f7]/10 text-[#a855f7]"
                        }`}
                      >
                        {(s.type || "").toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {s.client || "—"}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">{s.pickupTime || ""}</span>
                  </div>

                  {/* Route */}
                  <div className="text-xs text-zinc-400">
                    {s.origin || "—"} {"\u2192"} {s.destination || "—"}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {s.flightNumber && (
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                        {"\u2708"} {s.flightNumber}
                      </span>
                    )}
                    {s.platform && (
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                        {s.platform}
                      </span>
                    )}
                    {s.assignedDriver ? (
                      <span className="text-[10px] text-hub-gold bg-hub-gold/10 px-2 py-0.5 rounded">
                        {s.assignedDriver}
                      </span>
                    ) : null}

                    {/* Tab-specific actions */}
                    {store.currentTab === "current" ||
                    store.currentTab === "chegadas" ||
                    store.currentTab === "recolhas" ? (
                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={() => store.markDone(s.id)}
                          className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          {"\u2713"} Done
                        </button>
                        <button
                          onClick={() => store.markCancelled(s.id)}
                          className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          {"\u2715"}
                        </button>
                      </div>
                    ) : store.currentTab === "past" || store.currentTab === "cancelled" ? (
                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={() =>
                            store.restoreService(
                              s.id,
                              store.currentTab as "past" | "cancelled",
                            )
                          }
                          className="text-[10px] bg-hub-gold/10 text-hub-gold px-2 py-1 rounded hover:bg-hub-gold/20 transition-colors"
                        >
                          {"\u21A9"} Restaurar
                        </button>
                        <button
                          onClick={() =>
                            store.removeService(
                              s.id,
                              store.currentTab as "past" | "cancelled",
                            )
                          }
                          className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          {"\u{1F5D1}"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
      <Nameplate
        isOpen={store.nameplateOpen}
        name={store.nameplateName}
        onClose={store.closeNameplate}
      />
    </div>
  );
}
