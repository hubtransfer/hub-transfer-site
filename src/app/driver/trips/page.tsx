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
/*  Lisbon Clock                                                       */
/* ================================================================== */

function useLisbonClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("pt-PT", {
          timeZone: "Europe/Lisbon",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ================================================================== */
/*  Fetch drivers list from HUB Central                                */
/* ================================================================== */

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function DriverTripsPage() {
  const store = useDriverStore();
  const clock = useLisbonClock();
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
    for (const v of driverTrips) {
      const tipo = detectTipo(v.origin || "", v.flight || "", v.type);
      if (tipo === "CHEGADA") chegadas++;
      else recolhas++;
      totalPay += calcDriverPrice(v.platform || "");
    }
    return { total: driverTrips.length, chegadas, recolhas, totalPay };
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
            <span className="text-xs text-[#D4D4D4] font-mono">Cache &middot; {store.cacheAge}</span>
          ) : store.lastSyncTime ? (
            <span className="text-xs text-[#D4A847] font-mono">Sincronizado &#10003;</span>
          ) : null}
          <span className="text-sm text-white/50 tabular-nums font-mono">
            {clock}
          </span>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-500/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-blue-400 font-mono">
              {stats.total}
            </div>
            <div className="text-[10px] text-white/40 uppercase font-mono">
              Total
            </div>
          </div>
          <div className="flex-1 bg-[#D4A847]/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-[#D4A847] font-mono">
              {stats.chegadas}
            </div>
            <div className="text-[10px] text-[#D4D4D4] uppercase font-mono">
              Chegadas
            </div>
          </div>
          <div className="flex-1 bg-[#8B9DAF]/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-[#8B9DAF] font-mono">
              {stats.recolhas}
            </div>
            <div className="text-[10px] text-white/40 uppercase font-mono">
              Recolhas
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[#F0D030]">
            &euro;{stats.totalPay.toFixed(0)}
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
            &#9664; Ontem
          </button>
          <button
            onClick={() => store.loadDate("")}
            className="h-10 px-4 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-xs font-bold active:bg-[#F0D030]/30 transition-colors font-mono"
          >
            &#128197; Hoje
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors font-mono"
          >
            Amanh&atilde; &#9654;
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
      <div className="px-4 pb-8 space-y-3">
        {driverTrips.length === 0 && store.isLoading ? (
          <SkeletonList count={3} />
        ) : driverTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">&#128661;</div>
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
            {nonDoneTrips.map((viagem) => {
              const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
              return (
                <DriverTripCard
                  key={vId}
                  viagem={viagem}
                  driverName={store.driverName}
                  onDarBaixa={store.darBaixa}
                  onShowNameplate={openNameplate}
                />
              );
            })}

            {doneTrips.length > 0 && (
              <>
                <p className="text-[10px] text-white/20 uppercase tracking-widest text-center py-2 font-mono">
                  &#8213; conclu&iacute;das &#8213;
                </p>
                {doneTrips.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  return (
                    <DriverTripCard
                      key={vId}
                      viagem={viagem}
                      onDarBaixa={store.darBaixa}
                      onShowNameplate={openNameplate}
                    />
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
