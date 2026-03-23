"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTripsStore } from "@/hooks/useTripsStore";
import DriverTripCard from "@/components/driver/DriverTripCard";
import DriverNameplate from "@/components/driver/DriverNameplate";
import type { HubViagem } from "@/lib/trips";
import {
  detectTipo,
  calcDriverPrice,
  cleanHora,
  todayStr,
  dateToISO,
} from "@/lib/trips";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const LS_DRIVER_NAME = "hub_driver_name";
const SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes

/* ================================================================== */
/*  Lisbon Clock Hook                                                  */
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
/*  PAGE                                                               */
/* ================================================================== */

export default function DriverTripsPage() {
  const store = useTripsStore();
  const clock = useLisbonClock();

  /* ---- Driver login state ---- */
  const [driverName, setDriverName] = useState<string>("");
  const [loginInput, setLoginInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ---- Nameplate state ---- */
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState("");

  /* ---- Hero expansion state ---- */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ---- Load driver name from localStorage on mount ---- */
  useEffect(() => {
    const stored = localStorage.getItem(LS_DRIVER_NAME);
    if (stored) {
      setDriverName(stored);
      setIsLoggedIn(true);
    }
  }, []);

  /* ---- Auto-sync viagens every 3 minutes ---- */
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(() => {
      store.syncViagens(false);
    }, SYNC_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  /* ---- Handle login ---- */
  const handleLogin = useCallback(() => {
    const name = loginInput.trim();
    if (!name) return;
    localStorage.setItem(LS_DRIVER_NAME, name);
    setDriverName(name);
    setIsLoggedIn(true);
    // Filter trips for this driver
    store.filterDriver(name);
  }, [loginInput, store]);

  /* ---- Handle logout ---- */
  const handleLogout = useCallback(() => {
    localStorage.removeItem(LS_DRIVER_NAME);
    setDriverName("");
    setIsLoggedIn(false);
    setLoginInput("");
    store.filterDriver("");
  }, [store]);

  /* ---- Nameplate handlers ---- */
  const openNameplate = useCallback((name: string) => {
    setNameplateName(name);
    setNameplateOpen(true);
  }, []);

  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateName("");
  }, []);

  /* ---- Date navigation ---- */
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

  const goToday = useCallback(() => {
    store.loadDate(todayStr());
  }, [store]);

  /* ---- Filtered trips for this driver ---- */
  const driverTrips = useMemo<HubViagem[]>(() => {
    return store.diaList.filter((v) => {
      if (!driverName) return true;
      return (v.driver || "").toLowerCase().includes(driverName.toLowerCase());
    });
  }, [store.diaList, driverName]);

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    let chegadas = 0;
    let recolhas = 0;
    let totalPay = 0;

    for (const v of driverTrips) {
      const tipo = detectTipo(v.origin || "", v.flight || "");
      if (tipo === "CHEGADA") chegadas++;
      else if (tipo === "RECOLHA") recolhas++;
      totalPay += calcDriverPrice(v.platform || "");
    }

    return {
      total: driverTrips.length,
      chegadas,
      recolhas,
      totalPay,
    };
  }, [driverTrips]);

  /* ---- Determine hero card ---- */
  const heroId = useMemo(() => {
    if (expandedId) return expandedId;
    // First non-done trip
    const first = driverTrips.find(
      (v) => !v.concluida && v.status !== "CONCLUIDA" && v.status !== "FINALIZOU",
    );
    return first ? first.id || (first.client || "x").replace(/\W/g, "") : null;
  }, [driverTrips, expandedId]);

  /* ================================================================ */
  /*  LOGIN SCREEN                                                     */
  /* ================================================================ */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Brand */}
          <div className="text-center space-y-2">
            <h1
              className="text-4xl font-black tracking-wider"
              style={{
                fontFamily: "var(--font-display), serif",
                background: "linear-gradient(135deg, #F5C518, #FFD700, #F5C518)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              HUB TRANSFER
            </h1>
            <p className="text-sm text-white/40 tracking-widest uppercase">Motorista</p>
          </div>

          {/* Login form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="O teu nome..."
              autoFocus
              className="w-full h-14 text-lg bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/30 focus:outline-none focus:border-[#F5C518]/50 transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={!loginInput.trim()}
              className="w-full h-14 font-bold text-lg bg-[#F5C518] text-black rounded-xl font-mono active:bg-[#F5C518]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  MAIN DRIVER VIEW                                                 */
  /* ================================================================ */

  const nonDoneTrips = driverTrips.filter(
    (v) => !v.concluida && v.status !== "CONCLUIDA" && v.status !== "FINALIZOU",
  );
  const doneTrips = driverTrips.filter(
    (v) => v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU",
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* ---- TOP BAR (sticky) ---- */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[#F5C518] font-bold text-base truncate block"
            title="Sair"
          >
            {driverName}
          </button>
          <p className="text-[10px] text-white/30 tracking-wider">HUB Transfer</p>
        </div>
        <span className="text-sm text-white/50 tabular-nums flex-shrink-0">{clock}</span>
      </header>

      {/* ---- STATS BAR ---- */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-500/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-blue-400">{stats.total}</div>
            <div className="text-[10px] text-white/40 uppercase">Total</div>
          </div>
          <div className="flex-1 bg-amber-500/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-amber-400">{stats.chegadas}</div>
            <div className="text-[10px] text-white/40 uppercase">Chegadas</div>
          </div>
          <div className="flex-1 bg-emerald-500/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{stats.recolhas}</div>
            <div className="text-[10px] text-white/40 uppercase">Recolhas</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[#F5C518]">
            {"\u20AC"}{stats.totalPay.toFixed(0)}
          </span>
          <span className="text-xs text-white/30">{store.selectedDate || todayStr()}</span>
        </div>
      </div>

      {/* ---- DATE PICKER ---- */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors"
          >
            {"\u25C0"} Ontem
          </button>
          <button
            onClick={goToday}
            className="h-10 px-4 bg-[#F5C518]/20 text-[#F5C518] rounded-lg text-xs font-bold active:bg-[#F5C518]/30 transition-colors"
          >
            {"\uD83D\uDCC5"} Hoje
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors"
          >
            Amanh{"\u00E3"} {"\u25B6"}
          </button>
          <input
            type="date"
            value={store.selectedDate ? dateToISO(store.selectedDate) : ""}
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-");
              store.loadDate(`${d}/${m}/${y}`);
            }}
            className="h-10 flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:border-[#F5C518]/40 focus:outline-none"
          />
        </div>
      </div>

      {/* ---- TRIP CARDS ---- */}
      <div className="px-4 pb-8 space-y-3">
        {driverTrips.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">{"\uD83D\uDE95"}</div>
            <p className="text-white/40 text-sm">Nenhuma viagem para hoje</p>
            <p className="text-white/20 text-xs mt-1">Puxa para baixo para actualizar</p>
          </div>
        ) : (
          <>
            {/* Render hero + strips */}
            {nonDoneTrips.map((viagem) => {
              const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
              const isHero = vId === heroId;

              return (
                <React.Fragment key={vId}>
                  {/* Separator before first non-hero card */}
                  {!isHero && vId === nonDoneTrips.find((v) => {
                    const id = v.id || (v.client || "x").replace(/\W/g, "");
                    return id !== heroId;
                  })?.id && nonDoneTrips.length > 1 && (
                    <p className="text-[10px] text-white/20 uppercase tracking-widest text-center py-2">
                      {"\u2015"} pr{"\u00F3"}ximas viagens {"\u2015"}
                    </p>
                  )}
                  <DriverTripCard
                    viagem={viagem}
                    isHero={isHero}
                    onDarBaixa={store.darBaixa}
                    onShowNameplate={openNameplate}
                    onExpand={() => setExpandedId(vId)}
                  />
                </React.Fragment>
              );
            })}

            {/* Done trips at bottom, all as strips */}
            {doneTrips.length > 0 && (
              <>
                <p className="text-[10px] text-white/20 uppercase tracking-widest text-center py-2">
                  {"\u2015"} conclu{"\u00ED"}das {"\u2015"}
                </p>
                {doneTrips.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  return (
                    <DriverTripCard
                      key={vId}
                      viagem={viagem}
                      isHero={false}
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

      {/* ---- NAMEPLATE OVERLAY ---- */}
      <DriverNameplate
        isOpen={nameplateOpen}
        name={nameplateName}
        onClose={closeNameplate}
      />
    </div>
  );
}
