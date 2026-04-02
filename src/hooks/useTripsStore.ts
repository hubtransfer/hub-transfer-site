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
  detectTipo,
  calcDriverPrice,
  todayStr,
} from "@/lib/trips";

// ─── LocalStorage Keys ───
const LS_VIAGENS_URL = "hub_viagens_url";
const LS_LAST_SYNC = "hub_viagens_last_sync";
const LS_ADMIN_VIAGENS_CACHE = "hub_admin_viagens_cache";
const LS_ADMIN_DRIVERS_CACHE = "hub_admin_drivers_cache";

// ─── Cache TTL ───
const CACHE_FRESH = 2 * 60 * 1000;   // <2 min: use cache directly, no fetch
const CACHE_STALE = 5 * 60 * 1000;   // 2-5 min: show cache + background fetch
// >5 min: show skeleton + fetch

interface CacheRecord<T> { data: T; ts: number; date?: string }

function readCache<T>(key: string, dateKey?: string): { data: T; ageMs: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const c: CacheRecord<T> = JSON.parse(raw);
    if (dateKey && c.date !== dateKey) return null;
    return { data: c.data, ageMs: Date.now() - c.ts };
  } catch { return null; }
}

function writeCache<T>(key: string, data: T, dateKey?: string): void {
  try {
    const c: CacheRecord<T> = { data, ts: Date.now(), date: dateKey };
    localStorage.setItem(key, JSON.stringify(c));
  } catch { /* storage full */ }
}

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
  nameplateDestination: string;

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
  diaActiveList: HubViagem[];
  diaDoneList: HubViagem[];
  diaNoShowList: HubViagem[];
  isViewingToday: boolean;
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
  markNoShow: (cardId: string) => void;

  // Past View
  pastViagens: HubViagem[];
  pastDate: string;
  pastLoading: boolean;
  loadPastDate: (dateStr: string) => void;

  // Nameplate
  showNameplate: (name: string, destination?: string) => void;
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
  const [nameplateDestination, setNameplateDestination] = useState("");

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

  // ─── Past viagens (separate fetch for any date) ───
  const [pastViagens, setPastViagens] = useState<HubViagem[]>([]);
  const [pastDate, setPastDate] = useState("");
  const [pastLoading, setPastLoading] = useState(false);

  // ─── Dia driver map (local overrides) ───
  const [diaDriverMap, setDiaDriverMap] = useState<Record<string, string>>({});

  // ─── Next ID ref ───
  const nextIdRef = useRef(1);

  // ──────────────────────────────────────────────
  // On Mount
  // ──────────────────────────────────────────────
  useEffect(() => {
    const storedUrl = localStorage.getItem(LS_VIAGENS_URL) || HUB_CENTRAL_URL;
    const storedSync = localStorage.getItem(LS_LAST_SYNC) || "";
    setHubViagensUrl(storedUrl);
    setLastSyncTime(storedSync);

    // Load drivers from cache immediately
    const drvCache = readCache<Driver[]>(LS_ADMIN_DRIVERS_CACHE);
    if (drvCache) {
      setDrivers(drvCache.data);
      setHubCentralSyncStatus("online");
      setHubCentralSyncMsg(`${drvCache.data.length} motoristas (cache)`);
    }

    // Load viagens from cache immediately
    const dateKey = selectedDate || "today";
    const vCache = readCache<HubViagem[]>(LS_ADMIN_VIAGENS_CACHE, dateKey);
    if (vCache) {
      setHubViagens(vCache.data);
      setHubViagensSyncStatus("online");
      setHubViagensSyncMsg(`${vCache.data.length} viagens (cache)`);
      // If cache is fresh (<2min), skip network fetch
      if (vCache.ageMs < CACHE_FRESH) {
        return;
      }
    }

    // Sync from network (drivers + viagens in parallel)
    syncDriversImpl(false);
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

    // Count completed/no-show hubViagens
    const hubNoShow = hubViagens.filter((v) => v.status === "NO-SHOW").length;
    const hubDone = hubViagens.filter(
      (v) => (v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU" || v.status === "concluida") && v.status !== "NO-SHOW",
    ).length;
    const hubActive = hubViagens.length - hubDone - hubNoShow;

    return {
      current: services.current.length,
      chegadas,
      recolhas,
      past: services.past.length + hubDone,
      cancelled: services.cancelled.length + hubNoShow,
      dia: hubActive,
    };
  }, [services, hubViagens]);

  // ──────────────────────────────────────────────
  // Computed: Dia List (filtered + sorted)
  // ──────────────────────────────────────────────
  const diaList = useMemo<HubViagem[]>(() => {
    let list = [...hubViagens];

    // Filter by date — only show trips matching selected date (or today)
    const targetDate = selectedDate || todayStr();
    list = list.filter((v) => {
      const tripDate = (v.date || v.flightDate || "").trim();
      // If trip has no date, include it (backend already filtered)
      if (!tripDate) return true;
      // Exact match DD/MM/YYYY
      if (tripDate === targetDate) return true;
      // Handle ISO format YYYY-MM-DD from some backends
      if (tripDate.includes("-") && targetDate.includes("/")) {
        const [td, tm, ty] = targetDate.split("/");
        const iso = `${ty}-${tm}-${td}`;
        if (tripDate === iso) return true;
      }
      return false;
    });

    // Apply local driver overrides
    list = list.map((v) => {
      const cid = v.id || (v.client || "x").replace(/\W/g, "");
      const override = diaDriverMap[cid];
      if (override !== undefined) {
        return { ...v, driver: override };
      }
      return v;
    });

    // Filter by selected driver
    if (selectedDriver) {
      list = list.filter(
        (v) =>
          (v.driver || "").toLowerCase().includes(selectedDriver.toLowerCase())
      );
    }

    // Sort chronologically by hora
    list.sort((a, b) => {
      const timeA = a.pickupTime || "";
      const timeB = b.pickupTime || "";
      return timeA.localeCompare(timeB);
    });

    return list;
  }, [hubViagens, selectedDate, selectedDriver, diaDriverMap]);

  // ──────────────────────────────────────────────
  // Computed: Dia Active + Done split
  // Today: hide completed from Dia Completo. Past dates: show all.
  // ──────────────────────────────────────────────
  const isViewingToday = !selectedDate || selectedDate === todayStr();

  const diaActiveList = useMemo<HubViagem[]>(() => {
    if (!isViewingToday) return diaList; // Past dates: show ALL including completed
    return diaList.filter(
      (v) => !v.concluida && v.status !== "CONCLUIDA" && v.status !== "FINALIZOU" && v.status !== "concluida" && v.status !== "NO-SHOW",
    );
  }, [diaList, isViewingToday]);

  const diaDoneList = useMemo<HubViagem[]>(() => {
    return diaList.filter(
      (v) => (v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU" || v.status === "concluida") && v.status !== "NO-SHOW",
    );
  }, [diaList]);

  const diaNoShowList = useMemo<HubViagem[]>(() => {
    return diaList.filter((v) => v.status === "NO-SHOW");
  }, [diaList]);

  // ──────────────────────────────────────────────
  // Computed: Dia Stats (active only)
  // ──────────────────────────────────────────────
  const diaStats = useMemo<DiaStats>(() => {
    const stats: DiaStats = {
      total: diaActiveList.length,
      chegadas: 0,
      recolhas: 0,
      tours: 0,
      semMotorista: 0,
      totalPay: 0,
    };

    for (const v of diaActiveList) {
      const tipo = detectTipo(v.origin || "", v.flight || "", v.type);
      if (tipo === "CHEGADA") stats.chegadas++;
      else if (tipo === "RECOLHA") stats.recolhas++;
      else if (tipo === "TOUR") stats.tours++;

      if (!v.driver || v.driver.trim() === "") stats.semMotorista++;

      if (v.driver) stats.totalPay += calcDriverPrice(v.platform);
    }

    return stats;
  }, [diaActiveList]);

  // ──────────────────────────────────────────────
  // Computed: Dia Pay Summary
  // ──────────────────────────────────────────────
  const diaPaySummary = useMemo<
    Record<string, { count: number; total: number }>
  >(() => {
    const summary: Record<string, { count: number; total: number }> = {};

    for (const v of diaList) {
      const driver = v.driver || "Sem Motorista";
      if (!summary[driver]) {
        summary[driver] = { count: 0, total: 0 };
      }
      summary[driver].count++;
      if (v.driver) summary[driver].total += calcDriverPrice(v.platform);
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
          (s) => s.type === "CHEGADA"
        );
      case "recolhas":
        return services.current.filter(
          (s) => s.type === "RECOLHA"
        );
      case "past":
        return services.past;
      case "cancelled":
        return services.cancelled;
      case "dia":
        return diaActiveList;
      default:
        return services.current;
    }
  }, [currentTab, services, diaActiveList]);

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
      type: data.type || "CHEGADA",
      client: data.client || "",
      clientPhone: data.clientPhone || "",
      platform: data.platform || "Talixo",
      origin: data.origin || "",
      destination: data.destination || "",
      pickupTime: data.pickupTime || "",
      flightNumber: data.flightNumber || "",
      flightDate: data.flightDate || "",
      depAirport: data.depAirport || "",
      depCity: data.depCity || "",
      depTime: data.depTime || "",
      depTerminal: data.depTerminal || "",
      arrAirport: data.arrAirport || "",
      arrCity: data.arrCity || "",
      arrTime: data.arrTime || "",
      arrTerminal: data.arrTerminal || "",
      duration: data.duration || "",
      status: data.status || "scheduled",
      delayMinutes: data.delayMinutes || 0,
      progressPct: data.progressPct || 0,
      language: data.language || "EN",
      pax: data.pax || "",
      notes: data.notes || "",
      assignedDriver: data.assignedDriver || "",
    };

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
              const vId = v.id || (v.client || "").replace(/\W/g, "");
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
  // No-Show (mark trip as cancelled/no-show locally)
  // ──────────────────────────────────────────────
  const markNoShow = useCallback((cardId: string) => {
    setHubViagens((prev) =>
      prev.map((v) => {
        const vId = v.id || (v.client || "").replace(/\W/g, "");
        if (String(vId) === String(cardId)) {
          return { ...v, concluida: true, status: "NO-SHOW" };
        }
        return v;
      })
    );
  }, []);

  // ──────────────────────────────────────────────
  // Past: fetch viagens for any date
  // ──────────────────────────────────────────────
  const loadPastDate = useCallback(
    async (dateStr: string) => {
      setPastDate(dateStr);
      if (!hubViagensUrl || !dateStr) return;
      setPastLoading(true);
      try {
        const fetchUrl = `${hubViagensUrl}?action=viagens&t=${ts()}&data=${encodeURIComponent(dateStr)}`;
        const res = await fetch(fetchUrl);
        const data = await res.json();
        let viagens: HubViagem[] = [];
        if (Array.isArray(data)) viagens = data;
        else if (data?.viagens && Array.isArray(data.viagens)) viagens = data.viagens;
        setPastViagens(viagens);
      } catch {
        setPastViagens([]);
      } finally {
        setPastLoading(false);
      }
    },
    [hubViagensUrl]
  );

  // ──────────────────────────────────────────────
  // Nameplate
  // ──────────────────────────────────────────────
  const showNameplate = useCallback((name: string, destination?: string) => {
    setNameplateName(name);
    setNameplateDestination(destination || "");
    setNameplateOpen(true);
  }, []);

  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateDestination("");
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

      let rawList: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data?.motoristas && Array.isArray(data.motoristas)) {
        rawList = data.motoristas;
      }

      const motoristas: Driver[] = rawList.map((m) => ({
        name: String(m.name || m.nome || ""),
        phone: String(m.phone || m.telefone || ""),
        viatura: String(m.viatura || ""),
      }));

      if (motoristas.length > 0) {
        setDrivers(motoristas);
        writeCache(LS_ADMIN_DRIVERS_CACHE, motoristas);
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
      writeCache(LS_ADMIN_VIAGENS_CACHE, viagens, dateParam || "today");
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
    nameplateDestination,

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
    diaActiveList,
    diaDoneList,
    diaNoShowList,
    isViewingToday,
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
    markNoShow,

    // Past View
    pastViagens,
    pastDate,
    pastLoading,
    loadPastDate,

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
