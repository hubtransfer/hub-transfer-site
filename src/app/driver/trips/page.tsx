"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDriverStore } from "@/hooks/useDriverStore";
import DriverTripCard from "@/components/driver/DriverTripCard";
import DriverNameplate from "@/components/driver/DriverNameplate";
import NoShowModal from "@/components/driver/NoShowModal";
import { SkeletonList } from "@/components/trips/SkeletonCard";
import { getSession, clearSession } from "@/lib/auth";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";
import {
  HUB_CENTRAL_URL,
  detectTipo,
  calcDriverPrice,
  cleanHora,
  todayStr,
  dateToISO,
  isNoShowViagem,
  fetchMotoristas,
  chaveMotorista,
} from "@/lib/trips";
import type { HubViagem, Driver } from "@/lib/trips";
import { clearCachedTrips } from "@/lib/trips-cache";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const LS_DRIVER_NAME = "hub_driver_name"; // legacy key for backward compat
const LS_DRIVER_IDENTITY = "hub_driver_identity"; // nome EXACTO validado contra ?action=motoristas


/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function DriverTripsPage() {
  const store = useDriverStore();
  const router = useRouter();

  /* ── Identidade oficial do motorista ──
     Só um nome da lista ?action=motoristas pode ser identidade.
     Sem identidade validada: ZERO cartões — ecrã "Quem és tu?". */
  const [identity, setIdentity] = useState("");
  const [officialDrivers, setOfficialDrivers] = useState<Driver[] | null>(null);
  const [driversFailed, setDriversFailed] = useState(false);
  const [needsPicker, setNeedsPicker] = useState(false);
  const [hasDriverContext, setHasDriverContext] = useState(false);

  const [changePwdOpen, setChangePwdOpen] = useState(false);

  /* ── Nameplate ── */
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState("");
  const [nameplateDest, setNameplateDest] = useState("");

  /* ── Anexar provas a um no-show já marcado (linhas compactas) ── */
  const [proofTrip, setProofTrip] = useState<HubViagem | null>(null);

  const adoptIdentity = useCallback(
    (name: string, persist = true) => {
      setIdentity(name);
      setNeedsPicker(false);
      if (persist) {
        try { localStorage.setItem(LS_DRIVER_IDENTITY, name); } catch { /* */ }
      }
      store.setDriverName(name);
    },
    [store],
  );

  /* ── Lista oficial de motoristas ── */
  const loadOfficialDrivers = useCallback(async () => {
    setDriversFailed(false);
    try {
      setOfficialDrivers(await fetchMotoristas());
    } catch {
      setDriversFailed(true);
    }
  }, []);

  useEffect(() => {
    loadOfficialDrivers();
  }, [loadOfficialDrivers]);

  /* ── Sessão/identidade guardada ── */
  useEffect(() => {
    let stored = "";
    let legacy = "";
    try {
      stored = localStorage.getItem(LS_DRIVER_IDENTITY) || "";
      legacy = localStorage.getItem(LS_DRIVER_NAME) || "";
    } catch { /* */ }
    const session = getSession();
    const sessionName = session && session.role === "driver" ? session.name : "";

    if (!stored && !sessionName && !legacy) {
      router.replace("/login");
      return;
    }
    setHasDriverContext(true);
    if (stored) {
      // Já validada numa sessão anterior — usar já; revalida quando a lista chegar
      adoptIdentity(stored, false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Resolver identidade contra a lista oficial ── */
  useEffect(() => {
    if (!officialDrivers || !hasDriverContext) return;

    const match = (n: string): Driver | undefined => {
      const k = chaveMotorista(n);
      if (!k) return undefined;
      return officialDrivers.find((d) => chaveMotorista(d.name) === k);
    };

    let stored = "";
    let legacy = "";
    try {
      stored = localStorage.getItem(LS_DRIVER_IDENTITY) || "";
      legacy = localStorage.getItem(LS_DRIVER_NAME) || "";
    } catch { /* */ }
    const session = getSession();
    const sessionName = session && session.role === "driver" ? session.name : "";

    // 1) Identidade guardada — revalidar (pode ter saído da folha)
    if (stored) {
      const m = match(stored);
      if (m) { adoptIdentity(m.name); return; }
      try { localStorage.removeItem(LS_DRIVER_IDENTITY); } catch { /* */ }
      setIdentity("");
      store.setDriverName("");
    }

    // 2) Nome da sessão de login ou legacy — adoptar se corresponder a um nome oficial
    const m = match(sessionName) || match(legacy);
    if (m) { adoptIdentity(m.name); return; }

    // 3) Nada corresponde → "Quem és tu?" (nunca mostrar viagens de todos)
    setNeedsPicker(true);
  }, [officialDrivers, hasDriverContext]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-sync silencioso: intervalo gerido pelo useDriverStore com ping lastChange ── */

  /* ── Logout ── */
  const handleLogout = useCallback(() => {
    clearSession();
    try { localStorage.removeItem(LS_DRIVER_IDENTITY); } catch { /* */ }
    clearCachedTrips();
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
      totalPay += calcDriverPrice(v);
      if (v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU") done++;
    }
    return { total: driverTrips.length, chegadas, recolhas, totalPay, done };
  }, [driverTrips]);

  /* ── (heroId removed — cards self-expand on tap) ── */

  /* ================================================================ */
  /*  SEM IDENTIDADE VALIDADA → ZERO CARTÕES                           */
  /* ================================================================ */

  if (!identity) {
    // Ecrã "Quem és tu?" — só nomes da lista oficial, nunca texto livre, nunca "Todos"
    if (needsPicker && officialDrivers) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-10">
          <img src="/images/logo.png" alt="HUB Transfer" className="h-8 w-auto opacity-60 mb-8" />
          <h1 className="text-2xl font-bold text-[#F0D030] mb-1">Quem és tu?</h1>
          <p className="text-sm text-white/50 mb-6 text-center font-mono">
            Escolhe o teu nome da lista oficial para veres as tuas viagens.
          </p>
          <div className="w-full max-w-sm space-y-2">
            {officialDrivers.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => adoptIdentity(d.name)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-left text-white font-mono hover:border-[#F0D030]/50 active:bg-[#F0D030]/10 transition-colors"
              >
                {d.name}
              </button>
            ))}
            {officialDrivers.length === 0 && (
              <p className="text-center text-white/40 text-sm font-mono py-6">
                Nenhum motorista na lista oficial.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 text-white/30 text-xs font-mono underline underline-offset-2"
          >
            Sair
          </button>
        </div>
      );
    }

    // Lista oficial indisponível (sem rede) e sem identidade validada → nunca mostrar viagens
    if (driversFailed) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
          <p className="text-white/60 text-sm font-mono mb-4 text-center">
            Sem ligação ao HUB Central.<br />Não é possível confirmar a tua identidade.
          </p>
          <button
            type="button"
            onClick={loadOfficialDrivers}
            className="px-5 py-2.5 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-sm font-bold font-mono active:bg-[#F0D030]/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    // A carregar a lista oficial
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /*  MAIN DRIVER VIEW                                                 */
  /* ================================================================ */

  // NO_SHOW dá baixa: sai das ativas e junta-se às terminadas (com selo próprio)
  const nonDoneTrips = driverTrips.filter(
    (v) =>
      !isNoShowViagem(v) &&
      !v.concluida &&
      v.status !== "CONCLUIDA" &&
      v.status !== "FINALIZOU",
  );
  const doneTrips = driverTrips.filter(
    (v) =>
      isNoShowViagem(v) || v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU",
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
          <span className="text-xs text-white/50 tabular-nums font-mono flex items-center gap-1.5">
            {store.backgroundRefreshing && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="A sincronizar em segundo plano" />
            )}
            {store.lastSyncTime ? `Sync: ${store.lastSyncTime}` : "Sync: --:--:--"}
          </span>
          <button onClick={() => setChangePwdOpen(true)} title="Alterar senha" className="text-white/40 hover:text-[#F0D030] transition-colors">⚙️</button>
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
                    onRefresh={store.syncViagensSilent}
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
                    {(() => {
                      const noShows = doneTrips.filter((v) => isNoShowViagem(v)).length;
                      const done = doneTrips.length - noShows;
                      return noShows > 0 ? `Concluídas (${done}) · No-show (${noShows})` : `Concluídas (${done})`;
                    })()}
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {doneTrips.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type);
                  const hora = cleanHora(viagem.pickupTime || "");
                  const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : "#C17E4A";
                  const noShow = isNoShowViagem(viagem);
                  return (
                    <div
                      key={vId}
                      className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] px-4 py-3 flex items-center gap-3 opacity-50"
                      style={{ borderLeftWidth: "3px", borderLeftColor: noShow ? "#7F1D1D" : typeColor, ...(noShow ? { filter: "grayscale(0.55)" } : {}) }}
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
                      {noShow ? (
                        <>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7F1D1D]/50 text-[#F87171]">
                            🚫 Cliente não compareceu
                          </span>
                          <button type="button" onClick={() => setProofTrip(viagem)} title="Anexar provas do no-show"
                            className="text-sm px-1.5 py-0.5 rounded border border-[#7F1D1D]/60 text-[#F87171] hover:bg-[#7F1D1D]/30 active:bg-[#7F1D1D]/40 transition-colors">
                            📎
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">
                          CONCLUÍDA
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* ── PROVAS DO NO-SHOW (viagem já marcada — só anexa, não re-marca) ── */}
      {proofTrip && (
        <NoShowModal
          isOpen
          tripId={String(proofTrip.id ?? "")}
          clientName={String(proofTrip.client ?? "")}
          driverName={store.driverName}
          gasUrl={HUB_CENTRAL_URL}
          date={String(proofTrip.date || proofTrip.flightDate || "")}
          onClose={() => setProofTrip(null)}
          onSubmit={() => { setProofTrip(null); store.syncViagensSilent(); }}
        />
      )}

      {/* ── NAMEPLATE ── */}
      <DriverNameplate
        isOpen={nameplateOpen}
        name={nameplateName}
        destination={nameplateDest}
        onClose={closeNameplate}
      />

      <ChangePasswordModal isOpen={changePwdOpen} onClose={() => setChangePwdOpen(false)} tipo="motorista" userId={store.driverName} />
    </div>
  );
}
