"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDriverStore } from "@/hooks/useDriverStore";
import DriverTripCard from "@/components/driver/DriverTripCard";
import DriverNameplate from "@/components/driver/DriverNameplate";
import { SkeletonList } from "@/components/trips/SkeletonCard";
import { getSession, clearSession } from "@/lib/auth";
import {
  detectTipo,
  calcDriverPrice,
  cleanHora,
  todayStr,
  dateToISO,
} from "@/lib/trips";
import type { HubViagem } from "@/lib/trips";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const LS_DRIVER_NAME = "hub_driver_name"; // legacy key for backward compat
const SYNC_INTERVAL = 3 * 60 * 1000;


/* ================================================================== */
/*  Fetch drivers list from HUB Central                                */
/* ================================================================== */

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function DriverTripsPage() {
  const store = useDriverStore();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ── Nameplate ── */
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState("");
  const [nameplateDest, setNameplateDest] = useState("");

  /* ── Load session from auth ── */
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "driver") {
      // Fallback: check legacy localStorage
      const legacy = localStorage.getItem(LS_DRIVER_NAME);
      if (legacy) {
        store.setDriverName(legacy);
        setIsLoggedIn(true);
        return;
      }
      router.replace("/login");
      return;
    }
    store.setDriverName(session.name);
    setIsLoggedIn(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-sync ── */
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(() => store.syncViagens(), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [isLoggedIn, store]);

  /* ── Logout ── */
  const handleLogout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  /* ── Nameplate ── */
  const openNameplate = useCallback((name: string, destination?: string) => {
    setNameplateName(name);
    setNameplateDest(destination || "");
    setNameplateOpen(true);
  }, []);
  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateName("");
    setNameplateDest("");
  }, []);

  /* ── Date navigation ── */
  const shiftDate = useCallback(
    (days: number) => {
      const current = store.selectedDate
        ? new Date(dateToISO(store.selectedDate))
        : new Date();
      current.setDate(current.getDate() + days);
      const dd = String(current.getDate()).padStart(2, "0");
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const yyyy = current.getFullYear();
      store.loadDate(`${dd}/${mm}/${yyyy}`);
    },
    [store],
  );

  /* ── Driver's trips (already filtered by useDriverStore) ── */
  const driverTrips = store.sortedViagens;

  /* ── Stats ── */
  const stats = useMemo(() => {
    let chegadas = 0;
    let recolhas = 0;
    let totalPay = 0;
    let done = 0;
    for (const v of driverTrips) {
      const tipo = detectTipo(v.origin || "", v.flight || "", v.type);
      if (tipo === "CHEGADA") chegadas++;
      else recolhas++;
      totalPay += calcDriverPrice(v.platform || "");
      if (v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU") done++;
    }
    return { total: driverTrips.length, chegadas, recolhas, totalPay, done };
  }, [driverTrips]);

  /* ── (heroId removed — cards self-expand on tap) ── */

  /* ================================================================ */
  /*  LOGIN SCREEN                                                     */
  /* ================================================================ */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /*  MAIN DRIVER VIEW                                                 */
  /* ================================================================ */

  const nonDoneTrips = driverTrips.filter(
    (v) =>
      !v.concluida &&
      v.status !== "CONCLUIDA" &&
      v.status !== "FINALIZOU",
  );
  const doneTrips = driverTrips.filter(
    (v) =>
      v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU",
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[#F0D030] font-bold text-base truncate block"
            title="Sair"
          >
            {store.driverName}
          </button>
          <img src="/images/logo.png" alt="HUB Transfer" className="h-5 w-auto opacity-50 mt-0.5" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {store.isLoading ? (
            <span className="text-xs text-[#F0D030]/60 animate-pulse font-mono">A sincronizar...</span>
          ) : store.isFromCache ? (
            <span className="text-xs text-[#D4D4D4] font-mono">Cache · {store.cacheAge}</span>
          ) : null}
          <span className="text-xs text-white/50 tabular-nums font-mono">
            {store.lastSyncTime ? `Sync: ${store.lastSyncTime}` : "Sync: --:--:--"}
          </span>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-[#F0D030]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#F0D030] font-mono">
              {stats.total}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Total
            </div>
          </div>
          <div className="flex-1 bg-[#D4A847]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#D4A847] font-mono">
              {stats.chegadas}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Chegadas
            </div>
          </div>
          <div className="flex-1 bg-[#8B9DAF]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#8B9DAF] font-mono">
              {stats.recolhas}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Recolhas
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[#F0D030]">
            €{stats.totalPay.toFixed(0)}
          </span>
          <span className="text-xs text-white/30 font-mono">
            {store.selectedDate || todayStr()}
            {store.lastSyncTime && (
              <span className="ml-2 text-white/20">
                sync {store.lastSyncTime}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── DATE PICKER ── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors font-mono"
          >
            ◀ Ontem
          </button>
          <button
            onClick={() => store.loadDate("")}
            className="h-10 px-4 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-xs font-bold active:bg-[#F0D030]/30 transition-colors font-mono"
          >
            📅 Hoje
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors font-mono"
          >
            Amanhã ▶
          </button>
          <input
            type="date"
            value={
              store.selectedDate ? dateToISO(store.selectedDate) : ""
            }
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-");
              store.loadDate(`${d}/${m}/${y}`);
            }}
            className="h-10 flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:border-[#F0D030]/40 focus:outline-none"
          />
        </div>
      </div>

      {/* ── TRIP CARDS ── */}
      <div className="px-4 pb-8 space-y-2">
        {driverTrips.length === 0 && store.isLoading ? (
          <SkeletonList count={3} />
        ) : driverTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🚕</div>
            <p className="text-[#E5E5E5] text-sm font-mono">
              Nenhuma viagem para hoje
            </p>
            <button type="button" onClick={() => store.syncViagens()}
              className="mt-3 text-[#F0D030] text-xs font-mono underline underline-offset-2 cursor-pointer">
              Sincronizar
            </button>
          </div>
        ) : (
          <>
            {nonDoneTrips.map((viagem, i) => {
              const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
              return (
                <React.Fragment key={vId}>
                  {i === 0 && nonDoneTrips.length > 1 && (
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] px-1">
                      Próxima viagem
                    </p>
                  )}
                  {i === 1 && (
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#666] px-1 pt-1">
                      Mais tarde
                    </p>
                  )}
                  <DriverTripCard
                    viagem={viagem}
                    driverName={store.driverName}
                    onDarBaixa={store.darBaixa}
                    onShowNameplate={openNameplate}
                    isNext={i === 0}
                  />
                </React.Fragment>
              );
            })}

            {doneTrips.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                    Concluídas ({doneTrips.length})
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {doneTrips.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
                  const hora = cleanHora(viagem.pickupTime || "");
                  const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : "#C17E4A";
                  return (
                    <div
                      key={vId}
                      className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] px-4 py-3 flex items-center gap-3 opacity-50"
                      style={{ borderLeftWidth: "3px", borderLeftColor: typeColor }}
                    >
                      <span className="font-mono text-sm font-bold text-[#666]">{hora}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#999] truncate">{viagem.client}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                      >
                        {tipo}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">
                        CONCLUÍDA
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* ── NAMEPLATE ── */}
      <DriverNameplate
        isOpen={nameplateOpen}
        name={nameplateName}
        destination={nameplateDest}
        onClose={closeNameplate}
      />
    </div>
  );
}
