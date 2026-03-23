"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  TripService,
  HubViagem,
  Driver,
  TabType,
  ServicesState,
} from "@/lib/trips";
import {
  HUB_CENTRAL_URL,
  DRIVERS_FALLBACK,
  TAB_INFO,
} from "@/lib/trips";

// ─── LocalStorage Keys ───
const LS_VIAGENS_URL = "hub_viagens_url";
const LS_LAST_SYNC = "hub_viagens_last_sync";

// ─── Sync Status ───
type SyncStatus = "online" | "offline" | "loading";

// ─── Dia Stats ───
interface DiaStats {
  total: number;
  chegadas: number;
  recolhas: number;
  tours: number;
  semMotorista: number;
  totalPay: number;
}

// ─── Tab Counts ───
interface TabCounts {
  current: number;
  chegadas: number;
  recolhas: number;
  past: number;
  cancelled: number;
  dia: number;
}

// ─── Store Return Type ───
interface TripsStore {
  // Core data
  services: ServicesState;
  hubViagens: HubViagem[];
  drivers: Driver[];

  // UI state
  currentTab: TabType;
  selectedDate: string;
  selectedDriver: string;
  nameplateOpen: boolean;
  nameplateName: string;

  // Sync state
  hubViagensSyncStatus: SyncStatus;
  hubViagensSyncMsg: string;
  hubCentralSyncStatus: SyncStatus;
  hubCentralSyncMsg: string;
  hubCentralInfo: string;
  lastSyncTime: string;

  // Config
  hubViagensUrl: string;
  showViagensCfg: boolean;

  // Computed
  counts: TabCounts;
  currentList: TripService[] | HubViagem[];
  diaList: HubViagem[];
  diaStats: DiaStats;
  diaPaySummary: Record<string, { count: number; total: number }>;

  // Tab Navigation
  switchTab: (tab: TabType) => void;

  // Service Actions
  addService: (data: Partial<TripService>) => void;
  markDone: (id: number) => void;
  markCancelled: (id: number) => void;
  restoreService: (id: number, from: "past" | "cancelled") => void;
  removeService: (id: number, from: "past" | "cancelled") => void;
  setDriverFor: (id: number, driver: string) => void;
  setPlatformFor: (id: number, platform: string) => void;

  // Dia View Actions
  loadDate: (dateStr: string) => void;
  filterDriver: (name: string) => void;
  diaSetDriver: (cardId: string, driver: string) => void;
  darBaixa: (id: string, rowIndex: string, cardId: string) => Promise<void>;

  // Nameplate
  showNameplate: (name: string) => void;
  closeNameplate: () => void;

  // Sync
  syncViagens: (manual?: boolean) => Promise<void>;
  syncDrivers: (manual?: boolean) => Promise<void>;
  saveViagensUrl: (url: string) => void;

  // Config
  toggleViagensConfig: () => void;
}

// ─── Helper: timestamp for cache-busting ───
function ts(): string {
  return Date.now().toString();
}

// ─── The Hook ───
export function useTripsStore(): TripsStore {
  // ─── Core Data ───
  const [services, setServices] = useState<ServicesState>({
    current: [],
    past: [],
    cancelled: [],
  });
  const [hubViagens, setHubViagens] = useState<HubViagem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ─── UI State ───
  const [currentTab, setCurrentTab] = useState<TabType>("current");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState("");

  // ─── Sync State ───
  const [hubViagensSyncStatus, setHubViagensSyncStatus] =
    useState<SyncStatus>("offline");
  const [hubViagensSyncMsg, setHubViagensSyncMsg] = useState("");
  const [hubCentralSyncStatus, setHubCentralSyncStatus] =
    useState<SyncStatus>("offline");
  const [hubCentralSyncMsg, setHubCentralSyncMsg] = useState("");
  const [hubCentralInfo, setHubCentralInfo] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState("");

  // ─── Config ───
  const [hubViagensUrl, setHubViagensUrl] = useState("");
  const [showViagensCfg, setShowViagensCfg] = useState(false);

  // ─── Dia driver map (local overrides) ───
  const [diaDriverMap, setDiaDriverMap] = useState<Record<string, string>>({});

  // ─── Next ID ref ───
  const nextIdRef = useRef(1);

  // ──────────────────────────────────────────────
  // On Mount
  // ──────────────────────────────────────────────
  useEffect(() => {
    const storedUrl = localStorage.getItem(LS_VIAGENS_URL) || "";
    const storedSync = localStorage.getItem(LS_LAST_SYNC) || "";
    setHubViagensUrl(storedUrl);
    setLastSyncTime(storedSync);

    // Sync drivers on mount
    syncDriversImpl(false);

    // Sync viagens if URL is set
    if (storedUrl) {
      syncViagensImpl(false, storedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────────────
  // Computed: Counts
  // ──────────────────────────────────────────────
  const counts = useMemo<TabCounts>(() => {
    const chegadas = services.current.filter(
      (s) => s.type === "CHEGADA"
    ).length;
    const recolhas = services.current.filter(
      (s) => s.type === "RECOLHA"
    ).length;

    return {
      current: services.current.length,
      chegadas,
      recolhas,
      past: services.past.length,
      cancelled: services.cancelled.length,
      dia: hubViagens.length,
    };
  }, [services, hubViagens]);

  // ──────────────────────────────────────────────
  // Computed: Dia List (filtered + sorted)
  // ──────────────────────────────────────────────
  const diaList = useMemo<HubViagem[]>(() => {
    let list = [...hubViagens];

    // Apply local driver overrides
    list = list.map((v) => {
      const override = diaDriverMap[v.cardId ?? v.id ?? ""];
      if (override !== undefined) {
        return { ...v, motorista: override };
      }
      return v;
    });

    // Filter by selected driver
    if (selectedDriver) {
      list = list.filter(
        (v) =>
          (v.motorista || "").toLowerCase().includes(selectedDriver.toLowerCase())
      );
    }

    // Sort chronologically by hora
    list.sort((a, b) => {
      const timeA = a.hora || a.time || "";
      const timeB = b.hora || b.time || "";
      return timeA.localeCompare(timeB);
    });

    return list;
  }, [hubViagens, selectedDriver, diaDriverMap]);

  // ──────────────────────────────────────────────
  // Computed: Dia Stats
  // ──────────────────────────────────────────────
  const diaStats = useMemo<DiaStats>(() => {
    const stats: DiaStats = {
      total: diaList.length,
      chegadas: 0,
      recolhas: 0,
      tours: 0,
      semMotorista: 0,
      totalPay: 0,
    };

    for (const v of diaList) {
      const tipo = (v.tipo || v.type || "").toLowerCase();
      if (tipo === "chegada" || tipo === "arrival") stats.chegadas++;
      else if (tipo === "recolha" || tipo === "departure" || tipo === "pickup")
        stats.recolhas++;
      else if (tipo === "tour") stats.tours++;

      if (!v.motorista || v.motorista.trim() === "") stats.semMotorista++;

      const pay = parseFloat(String(v.valor || v.pay || v.price || 0));
      if (!isNaN(pay)) stats.totalPay += pay;
    }

    return stats;
  }, [diaList]);

  // ──────────────────────────────────────────────
  // Computed: Dia Pay Summary
  // ──────────────────────────────────────────────
  const diaPaySummary = useMemo<
    Record<string, { count: number; total: number }>
  >(() => {
    const summary: Record<string, { count: number; total: number }> = {};

    for (const v of diaList) {
      const driver = v.motorista || "Sem Motorista";
      if (!summary[driver]) {
        summary[driver] = { count: 0, total: 0 };
      }
      summary[driver].count++;
      const pay = parseFloat(String(v.valor || v.pay || v.price || 0));
      if (!isNaN(pay)) summary[driver].total += pay;
    }

    return summary;
  }, [diaList]);

  // ──────────────────────────────────────────────
  // Computed: Current List for active tab
  // ──────────────────────────────────────────────
  const currentList = useMemo<TripService[] | HubViagem[]>(() => {
    switch (currentTab) {
      case "current":
        return services.current;
      case "chegadas":
        return services.current.filter(
          (s) => s.tipo === "chegada" || s.type === "chegada"
        );
      case "recolhas":
        return services.current.filter(
          (s) => s.tipo === "recolha" || s.type === "recolha"
        );
      case "past":
        return services.past;
      case "cancelled":
        return services.cancelled;
      case "dia":
        return diaList;
      default:
        return services.current;
    }
  }, [currentTab, services, diaList]);

  // ──────────────────────────────────────────────
  // Tab Navigation
  // ──────────────────────────────────────────────
  const switchTab = useCallback((tab: TabType) => {
    setCurrentTab(tab);
  }, []);

  // ──────────────────────────────────────────────
  // Service Actions
  // ──────────────────────────────────────────────
  const addService = useCallback((data: Partial<TripService>) => {
    const id = nextIdRef.current++;
    const newService: TripService = {
      id,
      booking: data.booking || "",
      guest: data.guest || "",
      pax: data.pax || 1,
      from: data.from || "",
      to: data.to || "",
      date: data.date || "",
      time: data.time || "",
      flight: data.flight || "",
      tipo: data.tipo || data.type || "chegada",
      type: data.tipo || data.type || "chegada",
      driver: data.driver || "",
      motorista: data.motorista || data.driver || "",
      platform: data.platform || "Talixo",
      status: data.status || "active",
      notes: data.notes || "",
      price: data.price || 0,
      createdAt: new Date().toISOString(),
      ...data,
      id, // ensure our ID takes precedence
    } as TripService;

    setServices((prev) => ({
      ...prev,
      current: [...prev.current, newService],
    }));
  }, []);

  const markDone = useCallback((id: number) => {
    setServices((prev) => {
      const idx = prev.current.findIndex((s) => s.id === id);
      if (idx === -1) return prev;

      const service = { ...prev.current[idx], doneAt: new Date().toISOString() };
      const current = prev.current.filter((_, i) => i !== idx);
      return {
        ...prev,
        current,
        past: [...prev.past, service],
      };
    });
  }, []);

  const markCancelled = useCallback((id: number) => {
    if (!window.confirm("Tem a certeza que quer cancelar este serviço?")) return;

    setServices((prev) => {
      const idx = prev.current.findIndex((s) => s.id === id);
      if (idx === -1) return prev;

      const service = {
        ...prev.current[idx],
        cancelledAt: new Date().toISOString(),
      };
      const current = prev.current.filter((_, i) => i !== idx);
      return {
        ...prev,
        current,
        cancelled: [...prev.cancelled, service],
      };
    });
  }, []);

  const restoreService = useCallback(
    (id: number, from: "past" | "cancelled") => {
      setServices((prev) => {
        const idx = prev[from].findIndex((s) => s.id === id);
        if (idx === -1) return prev;

        const service = { ...prev[from][idx] };
        // Clean up timestamps
        delete (service as Record<string, unknown>).doneAt;
        delete (service as Record<string, unknown>).cancelledAt;
        service.status = "active";

        const fromList = prev[from].filter((_, i) => i !== idx);
        return {
          ...prev,
          [from]: fromList,
          current: [...prev.current, service],
        };
      });
    },
    []
  );

  const removeService = useCallback(
    (id: number, from: "past" | "cancelled") => {
      if (!window.confirm("Eliminar permanentemente este serviço?")) return;

      setServices((prev) => ({
        ...prev,
        [from]: prev[from].filter((s) => s.id !== id),
      }));
    },
    []
  );

  const setDriverFor = useCallback((id: number, driver: string) => {
    setServices((prev) => ({
      ...prev,
      current: prev.current.map((s) =>
        s.id === id ? { ...s, driver, motorista: driver } : s
      ),
    }));
  }, []);

  const setPlatformFor = useCallback((id: number, platform: string) => {
    setServices((prev) => ({
      ...prev,
      current: prev.current.map((s) =>
        s.id === id ? { ...s, platform } : s
      ),
    }));
  }, []);

  // ──────────────────────────────────────────────
  // Dia View Actions
  // ──────────────────────────────────────────────
  const loadDate = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      // Trigger sync with new date
      if (hubViagensUrl) {
        syncViagensImpl(true, hubViagensUrl, dateStr);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hubViagensUrl]
  );

  const filterDriver = useCallback((name: string) => {
    setSelectedDriver(name);
  }, []);

  const diaSetDriver = useCallback((cardId: string, driver: string) => {
    setDiaDriverMap((prev) => ({ ...prev, [cardId]: driver }));
  }, []);

  const darBaixa = useCallback(
    async (id: string, rowIndex: string, cardId: string) => {
      if (!hubViagensUrl) return;

      try {
        const url = `${hubViagensUrl}?action=completar&id=${encodeURIComponent(
          id
        )}&row=${encodeURIComponent(rowIndex)}&t=${ts()}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          // Mark as concluida locally
          setHubViagens((prev) =>
            prev.map((v) => {
              const vId = v.cardId ?? v.id ?? "";
              if (String(vId) === String(cardId)) {
                return { ...v, concluida: true, status: "concluida" };
              }
              return v;
            })
          );
        } else {
          console.error("darBaixa error:", data.error || "Unknown error");
          alert(data.error || "Erro ao dar baixa na viagem.");
        }
      } catch (err) {
        console.error("darBaixa fetch error:", err);
        alert("Erro de ligação ao dar baixa.");
      }
    },
    [hubViagensUrl]
  );

  // ──────────────────────────────────────────────
  // Nameplate
  // ──────────────────────────────────────────────
  const showNameplate = useCallback((name: string) => {
    setNameplateName(name);
    setNameplateOpen(true);
  }, []);

  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateName("");
  }, []);

  // ──────────────────────────────────────────────
  // Sync: Drivers
  // ──────────────────────────────────────────────
  async function syncDriversImpl(manual: boolean) {
    setHubCentralSyncStatus("loading");
    setHubCentralSyncMsg(manual ? "A sincronizar motoristas..." : "A carregar...");

    try {
      const url = `${HUB_CENTRAL_URL}?action=motoristas&t=${ts()}`;
      const res = await fetch(url);
      const data = await res.json();

      let motoristas: Driver[] = [];
      if (Array.isArray(data)) {
        motoristas = data;
      } else if (data?.motoristas && Array.isArray(data.motoristas)) {
        motoristas = data.motoristas;
      }

      // Normalize fields
      motoristas = motoristas.map((m: Record<string, unknown>) => ({
        name: (m.name || m.nome || "") as string,
        phone: (m.phone || m.telefone || "") as string,
        viatura: (m.viatura || "") as string,
      }));

      if (motoristas.length > 0) {
        setDrivers(motoristas);
        setHubCentralSyncStatus("online");
        setHubCentralSyncMsg(`${motoristas.length} motoristas carregados`);

        // Build info HTML
        const infoLines = motoristas.map(
          (m) =>
            `<b>${m.name}</b> — ${m.phone || "s/ tel"} — ${m.viatura || "s/ viatura"}`
        );
        setHubCentralInfo(infoLines.join("<br>"));
      } else {
        throw new Error("Nenhum motorista recebido");
      }
    } catch (err) {
      console.error("syncDrivers error:", err);
      setDrivers(DRIVERS_FALLBACK);
      setHubCentralSyncStatus("offline");
      setHubCentralSyncMsg("Offline — a usar lista local");
      setHubCentralInfo("");
    }
  }

  const syncDrivers = useCallback(async (manual = false) => {
    await syncDriversImpl(manual);
  }, []);

  // ──────────────────────────────────────────────
  // Sync: Viagens
  // ──────────────────────────────────────────────
  async function syncViagensImpl(
    manual: boolean,
    urlOverride?: string,
    dateOverride?: string
  ) {
    const url = urlOverride || hubViagensUrl;
    if (!url) {
      setHubViagensSyncStatus("offline");
      setHubViagensSyncMsg("URL não configurado");
      return;
    }

    setHubViagensSyncStatus("loading");
    setHubViagensSyncMsg(manual ? "A sincronizar viagens..." : "A carregar...");

    try {
      const dateParam = dateOverride ?? selectedDate;
      const fetchUrl = `${url}?action=viagens&t=${ts()}${
        dateParam ? `&data=${encodeURIComponent(dateParam)}` : ""
      }`;

      const res = await fetch(fetchUrl);
      const data = await res.json();

      let viagens: HubViagem[] = [];
      if (Array.isArray(data)) {
        viagens = data;
      } else if (data?.viagens && Array.isArray(data.viagens)) {
        viagens = data.viagens;
      }

      setHubViagens(viagens);
      setHubViagensSyncStatus("online");
      setHubViagensSyncMsg(`${viagens.length} viagens carregadas`);

      // Update last sync time
      const now = new Date().toLocaleString("pt-PT");
      setLastSyncTime(now);
      localStorage.setItem(LS_LAST_SYNC, now);
    } catch (err) {
      console.error("syncViagens error:", err);
      setHubViagensSyncStatus("offline");
      setHubViagensSyncMsg("Erro ao carregar viagens");
    }
  }

  const syncViagens = useCallback(
    async (manual = false) => {
      await syncViagensImpl(manual);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hubViagensUrl, selectedDate]
  );

  // ──────────────────────────────────────────────
  // Config
  // ──────────────────────────────────────────────
  const saveViagensUrl = useCallback((url: string) => {
    setHubViagensUrl(url);
    localStorage.setItem(LS_VIAGENS_URL, url);
    if (url) {
      syncViagensImpl(true, url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleViagensConfig = useCallback(() => {
    setShowViagensCfg((prev) => !prev);
  }, []);

  // ──────────────────────────────────────────────
  // Return
  // ──────────────────────────────────────────────
  return {
    // Core data
    services,
    hubViagens,
    drivers,

    // UI state
    currentTab,
    selectedDate,
    selectedDriver,
    nameplateOpen,
    nameplateName,

    // Sync state
    hubViagensSyncStatus,
    hubViagensSyncMsg,
    hubCentralSyncStatus,
    hubCentralSyncMsg,
    hubCentralInfo,
    lastSyncTime,

    // Config
    hubViagensUrl,
    showViagensCfg,

    // Computed
    counts,
    currentList,
    diaList,
    diaStats,
    diaPaySummary,

    // Tab Navigation
    switchTab,

    // Service Actions
    addService,
    markDone,
    markCancelled,
    restoreService,
    removeService,
    setDriverFor,
    setPlatformFor,

    // Dia View Actions
    loadDate,
    filterDriver,
    diaSetDriver,
    darBaixa,

    // Nameplate
    showNameplate,
    closeNameplate,

    // Sync
    syncViagens,
    syncDrivers,
    saveViagensUrl,

    // Config
    toggleViagensConfig,
  };
}

export type { TripsStore, DiaStats, TabCounts, SyncStatus };
