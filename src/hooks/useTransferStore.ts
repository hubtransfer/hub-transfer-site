"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  type Transfer,
  type ActiveFilters,
  DEFAULT_FILTERS,
  applyFilters,
  calculateSummary,
  calculatePrices,
  exportToCSV,
  getQuickPeriodDates,
  formatDateForInput,
} from "@/lib/transfers";
import {
  loadTransfersFromSheets,
  sendToSheets,
  testConnection,
  testBasicConnectivity,
  clearAllDataFromSheets,
  clearTestDataFromSheets,
} from "@/lib/google-sheets";

// ─── LocalStorage Keys ───
const LS_SERVICES = "partnershipTransferData";
const LS_FILTERS = "activeFilters";
const LS_LAST_SYNC = "lastSyncTime";
const LS_WEBAPP_URL = "webappUrl";

// ─── Status Types ───
type StatusType = "success" | "error" | "info" | "warning";
type ServiceType = "transfer" | "tour" | "private";

// ─── Return type ───
interface TransferStore {
  // State
  services: Transfer[];
  filters: ActiveFilters;
  filteredServices: Transfer[];
  summary: ReturnType<typeof calculateSummary>;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginatedServices: Transfer[];
  isAdminMode: boolean;
  editingId: number | null;
  isConnected: boolean;
  syncInProgress: boolean;
  lastSyncTime: string | null;
  currentServiceType: ServiceType;
  statusMessage: string;
  statusType: StatusType;

  // Actions
  loadFromSheets: () => Promise<void>;
  submitTransfer: (formData: Partial<Transfer>) => Promise<void>;
  editService: (id: number) => Transfer | undefined;
  changeStatus: (id: number) => void;
  deleteService: (id: number) => void;
  clearAllData: () => Promise<void>;
  clearTestData: () => Promise<void>;
  exportCSV: () => void;
  setFilter: (key: string, value: string | null) => void;
  clearFilters: () => void;
  applyQuickPeriod: (period: string) => void;
  changePage: (page: number) => void;
  changePageSize: (size: number) => void;
  toggleAdmin: () => void;
  testConnectionAction: (customUrl?: string) => Promise<void>;
  testBasicConnectivityAction: () => Promise<void>;
  showStatusMessage: (message: string, type: StatusType) => void;
  setCurrentServiceType: (type: ServiceType) => void;
  setEditingId: (id: number | null) => void;
}

// ─── Helper: safe localStorage ───
function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — silently ignore
  }
}

// ─── Status cycling ───
const STATUS_CYCLE: Record<string, string> = {
  Solicitado: "Confirmado",
  Confirmado: "Finalizado",
  Finalizado: "Cancelado",
  Cancelado: "Solicitado",
};

// ─── Hook ───
export function useTransferStore(): TransferStore {
  const [services, setServices] = useState<Transfer[]>([]);
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [currentServiceType, setCurrentServiceType] = useState<ServiceType>("transfer");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("info");

  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // ─── Status message with auto-hide ───
  const showStatusMessage = useCallback((message: string, type: StatusType) => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setStatusMessage(message);
    setStatusType(type);
    statusTimeoutRef.current = setTimeout(() => {
      setStatusMessage("");
      statusTimeoutRef.current = null;
    }, 5000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // ─── Persist services to localStorage ───
  const persistServices = useCallback((data: Transfer[]) => {
    setServices(data);
    saveToLocalStorage(LS_SERVICES, data);
  }, []);

  // ─── Computed: filtered services ───
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.dateStart ||
      filters.dateEnd ||
      filters.status ||
      filters.cliente ||
      filters.tipoServico
    );
  }, [filters]);

  const filteredServices = useMemo(() => {
    if (!hasActiveFilters) return services;
    return applyFilters(services, filters);
  }, [services, filters, hasActiveFilters]);

  // ─── Computed: summary ───
  const summary = useMemo(() => {
    return calculateSummary(hasActiveFilters ? filteredServices : services);
  }, [services, filteredServices, hasActiveFilters]);

  // ─── Computed: pagination ───
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  }, [filteredServices.length, itemsPerPage]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  // Reset page when filters change or services change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, services.length]);

  // ─── Mount: load data from localStorage ───
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const savedServices = loadFromLocalStorage<Transfer[]>(LS_SERVICES, []);
    const savedFilters = loadFromLocalStorage<ActiveFilters>(LS_FILTERS, DEFAULT_FILTERS);
    const savedLastSync = typeof window !== "undefined" ? localStorage.getItem(LS_LAST_SYNC) : null;
    const webappUrl = typeof window !== "undefined" ? localStorage.getItem(LS_WEBAPP_URL) : null;

    if (savedServices.length > 0) {
      setServices(savedServices);
    }
    setFilters(savedFilters);
    if (savedLastSync) {
      setLastSyncTime(savedLastSync);
    }
    if (webappUrl) {
      setIsConnected(true);
    }

    // Auto-load from sheets if no local data
    if (savedServices.length === 0 && webappUrl) {
      const timer = setTimeout(async () => {
        setSyncInProgress(true);
        const result = await loadTransfersFromSheets();
        if (result.success && result.data.length > 0) {
          setServices(result.data);
          saveToLocalStorage(LS_SERVICES, result.data);
          const syncTime = new Date().toISOString();
          setLastSyncTime(syncTime);
          localStorage.setItem(LS_LAST_SYNC, syncTime);
        }
        setSyncInProgress(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── loadFromSheets ───
  const loadFromSheets = useCallback(async () => {
    setSyncInProgress(true);
    showStatusMessage("Sincronizando com Google Sheets...", "info");

    const result = await loadTransfersFromSheets();

    if (result.success) {
      persistServices(result.data);
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      localStorage.setItem(LS_LAST_SYNC, syncTime);
      setIsConnected(true);
      showStatusMessage(result.message, "success");
    } else {
      showStatusMessage(result.message, "error");
    }

    setSyncInProgress(false);
  }, [persistServices, showStatusMessage]);

  // ─── submitTransfer ───
  const submitTransfer = useCallback(
    async (formData: Partial<Transfer>) => {
      const isEditing = editingId !== null;
      const now = new Date().toISOString();

      let updatedServices: Transfer[];

      if (isEditing) {
        updatedServices = services.map((s) =>
          s.id === editingId ? { ...s, ...formData } as Transfer : s
        );
        setEditingId(null);
        showStatusMessage("Servico atualizado com sucesso!", "success");
      } else {
        const newId = services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
        const defaults: Transfer = {
          id: newId, created: now, nomeCliente: "", referencia: "", tipoServico: "Transfer",
          tourSelecionado: "", numeroPessoas: 0, numeroBagagens: 0, data: "", contacto: "",
          numeroVoo: "", origem: "", destino: "", horaPickup: "", valorTotal: 0,
          valorHotel: 0, valorHUB: 0, comissaoRecepcao: 0, modoPagamento: "",
          pagoParaQuem: "", status: "Solicitado", observacoes: "",
        };
        const newTransfer: Transfer = { ...defaults, ...formData, id: newId, created: now };
        updatedServices = [...services, newTransfer];
        showStatusMessage("Servico adicionado com sucesso!", "success");

        // Send to Sheets if connected
        if (isConnected) {
          sendToSheets(newTransfer).catch(() => {
            showStatusMessage(
              "Salvo localmente, mas falhou ao enviar para Google Sheets",
              "warning"
            );
          });
        }
      }

      persistServices(updatedServices);
    },
    [services, editingId, isConnected, persistServices, showStatusMessage]
  );

  // ─── editService ───
  const editService = useCallback(
    (id: number): Transfer | undefined => {
      const service = services.find((s) => s.id === id);
      if (service) {
        setEditingId(id);
      }
      return service;
    },
    [services]
  );

  // ─── changeStatus ───
  const changeStatus = useCallback(
    (id: number) => {
      const updatedServices = services.map((s) => {
        if (s.id === id) {
          const nextStatus = STATUS_CYCLE[s.status] || "Solicitado";
          return { ...s, status: nextStatus };
        }
        return s;
      });
      persistServices(updatedServices);
      const service = updatedServices.find((s) => s.id === id);
      if (service) {
        showStatusMessage(`Status alterado para: ${service.status}`, "info");
      }
    },
    [services, persistServices, showStatusMessage]
  );

  // ─── deleteService ───
  const deleteService = useCallback(
    (id: number) => {
      const confirmed = window.confirm("Tem certeza que deseja excluir este servico?");
      if (!confirmed) return;

      const updatedServices = services.filter((s) => s.id !== id);
      persistServices(updatedServices);
      showStatusMessage("Servico excluido com sucesso!", "success");
    },
    [services, persistServices, showStatusMessage]
  );

  // ─── clearAllData ───
  const clearAllData = useCallback(async () => {
    const input = window.prompt(
      'Para confirmar a exclusao de TODOS os dados, digite "CONFIRMAR":'
    );
    if (input !== "CONFIRMAR") {
      showStatusMessage("Operacao cancelada", "info");
      return;
    }

    persistServices([]);
    localStorage.removeItem(LS_LAST_SYNC);
    setLastSyncTime(null);

    if (isConnected) {
      const result = await clearAllDataFromSheets();
      showStatusMessage(result.message, result.success ? "success" : "error");
    } else {
      showStatusMessage("Todos os dados locais foram excluidos", "success");
    }
  }, [isConnected, persistServices, showStatusMessage]);

  // ─── clearTestData ───
  const clearTestData = useCallback(async () => {
    const testIds = services
      .filter(
        (s) =>
          s.nomeCliente.toLowerCase().includes("test") ||
          s.nomeCliente.toLowerCase().includes("teste") ||
          s.referencia.toLowerCase().includes("test")
      )
      .map((s) => s.id);

    if (testIds.length === 0) {
      showStatusMessage("Nenhum dado de teste encontrado", "info");
      return;
    }

    const updatedServices = services.filter((s) => !testIds.includes(s.id));
    persistServices(updatedServices);

    if (isConnected) {
      const result = await clearTestDataFromSheets();
      showStatusMessage(
        result.success
          ? `${testIds.length} registros de teste removidos`
          : result.message,
        result.success ? "success" : "error"
      );
    } else {
      showStatusMessage(`${testIds.length} registros de teste removidos localmente`, "success");
    }
  }, [services, isConnected, persistServices, showStatusMessage]);

  // ─── exportCSV ───
  const exportCSVAction = useCallback(() => {
    if (services.length === 0) {
      showStatusMessage("Nenhum dado para exportar", "warning");
      return;
    }
    exportToCSV(hasActiveFilters ? filteredServices : services);
    showStatusMessage("CSV exportado com sucesso!", "success");
  }, [services, filteredServices, hasActiveFilters, showStatusMessage]);

  // ─── Filters ───
  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setFilters((prev) => {
        const updated = { ...prev, [key]: value };
        saveToLocalStorage(LS_FILTERS, updated);
        return updated;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    saveToLocalStorage(LS_FILTERS, DEFAULT_FILTERS);
    showStatusMessage("Filtros limpos", "info");
  }, [showStatusMessage]);

  const applyQuickPeriod = useCallback(
    (period: string) => {
      if (!period) {
        setFilter("dateStart", null);
        setFilter("dateEnd", null);
        setFilter("quickPeriod", "");
        return;
      }

      const dates = getQuickPeriodDates(period);
      if (dates) {
        setFilters((prev) => {
          const updated: ActiveFilters = {
            ...prev,
            dateStart: dates.start,
            dateEnd: dates.end,
            quickPeriod: period,
          };
          saveToLocalStorage(LS_FILTERS, updated);
          return updated;
        });
      }
    },
    [setFilter]
  );

  // ─── Pagination ───
  const changePage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
    },
    [totalPages]
  );

  const changePageSize = useCallback((size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  // ─── Admin toggle ───
  const toggleAdmin = useCallback(() => {
    if (isAdminMode) {
      setIsAdminMode(false);
      showStatusMessage("Modo admin desativado", "info");
      return;
    }

    const password = window.prompt("Digite a senha de administrador:");
    if (password === "admin2025") {
      setIsAdminMode(true);
      showStatusMessage("Modo admin ativado!", "success");
    } else {
      showStatusMessage("Senha incorreta", "error");
    }
  }, [isAdminMode, showStatusMessage]);

  // ─── Connection tests ───
  const testConnectionAction = useCallback(async (customUrl?: string) => {
    setSyncInProgress(true);
    showStatusMessage("Testando conexao...", "info");
    const result = await testConnection(customUrl);
    setIsConnected(result.success);
    showStatusMessage(result.message, result.success ? "success" : "error");
    setSyncInProgress(false);
  }, [showStatusMessage]);

  const testBasicConnectivityAction = useCallback(async () => {
    setSyncInProgress(true);
    showStatusMessage("Testando conectividade basica...", "info");
    const result = await testBasicConnectivity();
    showStatusMessage(result.message, result.success ? "success" : "error");
    setSyncInProgress(false);
  }, [showStatusMessage]);

  return {
    // State
    services,
    filters,
    filteredServices,
    summary,
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedServices,
    isAdminMode,
    editingId,
    isConnected,
    syncInProgress,
    lastSyncTime,
    currentServiceType,
    statusMessage,
    statusType,

    // Actions
    loadFromSheets,
    submitTransfer,
    editService,
    changeStatus,
    deleteService,
    clearAllData,
    clearTestData,
    exportCSV: exportCSVAction,
    setFilter,
    clearFilters,
    applyQuickPeriod,
    changePage,
    changePageSize,
    toggleAdmin,
    testConnectionAction,
    testBasicConnectivityAction,
    showStatusMessage,
    setCurrentServiceType,
    setEditingId,
  };
}
