"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { Shield, Plane } from "lucide-react";
import { useTransferStore } from "@/hooks/useTransferStore";
import TransferForm from "@/components/portal/TransferForm";
import TransferTable from "@/components/portal/TransferTable";
import KPICards from "@/components/portal/KPICards";
import FinancialSummary from "@/components/portal/FinancialSummary";
import ConfigPanel from "@/components/portal/ConfigPanel";
import ClearDataPanel from "@/components/portal/ClearDataPanel";
import StatusToast from "@/components/portal/StatusToast";
import type { Transfer } from "@/lib/transfers";
import { getSession, fetchHotelUrl, saveHotelUrl } from "@/lib/auth";

type PortalTab = "form" | "viagens" | "tracking";

export default function PortalPage() {
  const store = useTransferStore();
  const formRef = useRef<HTMLDivElement>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showClearData, setShowClearData] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hotelName, setHotelName] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [noUrl, setNoUrl] = useState(false);
  const [hotelGasUrl, setHotelGasUrl] = useState("");
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlToast, setUrlToast] = useState("");
  const [activeTab, setActiveTab] = useState<PortalTab>("form");

  // Auto-configure GAS URL
  useEffect(() => {
    const session = getSession();
    const code = session?.code || "";
    if (session?.role === "admin") setIsAdmin(true);
    if (code) {
      setHotelCode(code);
      setHotelName(session?.name || code);
    }
    (async () => {
      if (!code) { store.loadFromSheets(); return; }
      const url = await fetchHotelUrl(code);
      if (url) {
        localStorage.setItem("webappUrl", url);
        setHotelGasUrl(url);
        store.loadFromSheets();
      } else {
        setNoUrl(true);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "e") { e.preventDefault(); store.exportCSV(); }
      if (e.ctrlKey && e.key === "r" && !e.shiftKey) { e.preventDefault(); store.loadFromSheets(); }
      if (e.key === "Escape" && activeTab === "form") { store.setEditingId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, store]);

  const handleEdit = useCallback(
    (id: number) => {
      store.editService(id);
      setActiveTab("form");
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    },
    [store]
  );

  const editingTransfer: Transfer | null = store.editingId
    ? store.services.find((s) => s.id === store.editingId) ?? null
    : null;

  const hasActiveFilters =
    store.filters.dateStart || store.filters.dateEnd ||
    store.filters.status || store.filters.cliente || store.filters.tipoServico;

  const filterIndicator = hasActiveFilters
    ? { filtered: store.filteredServices.length, total: store.services.length }
    : null;

  // Today's flights for HUB Tracking tab
  const todayFlights = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const todayParts = today.split("-"); // [YYYY, MM, DD]
    const todayFormatted = `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`; // DD/MM/YYYY
    return store.services.filter((s) => {
      if (!s.numeroVoo || !s.numeroVoo.trim()) return false;
      // Match both YYYY-MM-DD and DD/MM/YYYY formats
      return s.data === today || s.data === todayFormatted;
    });
  }, [store.services]);

  // Tab definition
  const tabs: { key: PortalTab; label: string; icon?: typeof Plane; count?: number }[] = [
    { key: "form", label: "Novo Transfer" },
    { key: "viagens", label: "Viagens", count: store.services.length || undefined },
    { key: "tracking", label: "HUB Tracking", icon: Plane, count: todayFlights.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <StatusToast message={store.statusMessage} type={store.statusType} />

      {/* Admin bar */}
      {isAdmin && hotelCode && (
        <div className="bg-[#F0D030]/5 border-b border-[#F0D030]/10 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#F0D030] font-mono font-bold">ADMIN — {hotelCode}</span>
            <div className="flex-1 flex items-center gap-2">
              <input type="url" value={hotelGasUrl} onChange={(e) => setHotelGasUrl(e.target.value)}
                placeholder="URL GAS..." className="flex-1 h-7 bg-[#111] border border-[#2A2A2A] rounded px-2 text-[10px] text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono" />
              <button onClick={async () => {
                if (!hotelGasUrl.trim()) return;
                setUrlSaving(true);
                const res = await saveHotelUrl(hotelCode, hotelGasUrl.trim());
                setUrlSaving(false);
                if (res.success) { localStorage.setItem("webappUrl", hotelGasUrl.trim()); setNoUrl(false); setUrlToast("✓"); store.loadFromSheets(); }
                else setUrlToast("Erro");
                setTimeout(() => setUrlToast(""), 2000);
              }} disabled={urlSaving}
                className="h-7 px-2 bg-[#F0D030] text-[#0A0A0A] text-[10px] font-bold rounded cursor-pointer">{urlSaving ? "..." : "OK"}</button>
              {urlToast && <span className="text-[10px] text-[#7EAA6E] font-mono">{urlToast}</span>}
            </div>
            <a href="/admin/partners" className="text-[10px] text-[#666] hover:text-[#F5F5F5] font-mono">← Voltar</a>
          </div>
        </div>
      )}

      {/* No URL warning */}
      {noUrl && (
        <div className="bg-[#C06060]/10 border-b border-[#C06060]/20 px-4 py-3 text-center">
          <p className="text-sm text-[#C06060] font-semibold">Portal em configuração.</p>
          <p className="text-xs text-[#888] mt-1">
            {isAdmin ? "Configure a URL do GAS acima." : "Contacte o administrador."}
          </p>
        </div>
      )}

      {/* ═══ HEADER + TABS ═══ */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#2A2A2A]">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="HUB Transfer" width={180} height={50} className="h-11 w-auto" priority />
              <span className="text-sm text-[#A0A0A0] font-mono hidden sm:inline">{hotelName || "Portal"}</span>
            </div>
            <div className="flex items-center gap-3">
              {store.lastSyncTime && (
                <span className="text-[10px] text-[#666] font-mono hidden sm:inline">Sync {store.lastSyncTime}</span>
              )}
              {/* Admin toggle — in header */}
              <button
                onClick={store.toggleAdmin}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  store.isAdminMode
                    ? "text-[#F0D030] bg-[#F0D030]/10"
                    : "text-[#555] hover:text-[#A0A0A0]"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin{store.isAdminMode ? " ✓" : ""}
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition-colors relative ${
                  activeTab === tab.key ? "text-[#F0D030]" : "text-[#666] hover:text-[#A0A0A0]"
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-[10px] bg-[#F0D030]/15 text-[#F0D030] px-1.5 py-0.5 rounded-full font-mono">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0D030]" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ TAB CONTENT ═══ */}

      {/* Config + Clear panels (admin) */}
      {isAdmin && (
        <div className="max-w-[960px] mx-auto">
          <ConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)}
            onTestConnection={(url) => store.testConnectionAction(url)}
            statusMessage={store.statusMessage} statusType={store.statusType} />
          <ClearDataPanel isOpen={showClearData} onClose={() => setShowClearData(false)}
            onClearAll={store.clearAllData} onClearTests={store.clearTestData} />
        </div>
      )}

      {/* ─── TAB 1: NOVO TRANSFER ─── */}
      {activeTab === "form" && (
        <div ref={formRef} className="w-full px-4 py-5 animate-[fadeSlideIn_200ms_ease]">
          <TransferForm
            onSubmit={store.submitTransfer}
            editingTransfer={editingTransfer}
            isAdminMode={store.isAdminMode}
            isLoading={store.syncInProgress}
            onClear={() => store.setEditingId(null)}
          />
        </div>
      )}

      {/* ─── TAB 2: VIAGENS ─── */}
      {activeTab === "viagens" && (
        <div className="w-full py-5 space-y-3 animate-[fadeSlideIn_200ms_ease]">
          <div className="px-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <KPICards
                total={store.summary.total}
                pending={store.summary.pending}
                confirmed={store.summary.confirmed}
                completed={store.summary.completed}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#A0A0A0] bg-[#1A1A1A] rounded-lg px-4 py-2.5 border border-[#2A2A2A]">
              <span>Receita: <span className="text-[#F0D030] font-bold">€{store.summary.totalRevenue.toFixed(0)}</span></span>
              <span className="text-[#2A2A2A]">|</span>
              <span>Pendente: <span className="text-[#FFA726] font-bold">€{store.summary.pendingRevenue.toFixed(0)}</span></span>
              <span className="text-[#2A2A2A]">|</span>
              <span>Confirmado: <span className="text-[#7EAA6E] font-bold">€{store.summary.confirmedRevenue.toFixed(0)}</span></span>
              <span className="text-[#2A2A2A]">|</span>
              <span>Finalizado: <span className="text-[#60A5FA] font-bold">€{store.summary.completedRevenue.toFixed(0)}</span></span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={store.loadFromSheets} title="Ctrl+R"
                className="h-8 px-3 bg-[#F0D030]/10 text-[#F0D030] text-xs font-bold rounded hover:bg-[#F0D030]/20 transition-colors cursor-pointer">
                Sincronizar
              </button>
              <button onClick={store.exportCSV} title="Ctrl+E"
                className="h-8 px-3 bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] text-xs rounded hover:text-[#F5F5F5] transition-colors cursor-pointer">
                Exportar CSV
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => setShowConfig(!showConfig)}
                    className="h-8 px-3 bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] text-xs rounded hover:text-[#F5F5F5] transition-colors cursor-pointer">
                    Configurar
                  </button>
                  <button onClick={() => setShowClearData(!showClearData)}
                    className="h-8 px-3 bg-[#1A1A1A] border border-[#2A2A2A] text-[#666] text-xs rounded hover:text-[#C06060] hover:border-[#C06060]/30 transition-colors cursor-pointer">
                    Limpar Dados
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-2">
            <TransferTable
              services={store.paginatedServices}
              totalServices={hasActiveFilters ? store.filteredServices.length : store.services.length}
              isAdminMode={store.isAdminMode}
              currentPage={store.currentPage}
              totalPages={store.totalPages}
              itemsPerPage={store.itemsPerPage}
              onChangePage={store.changePage}
              onChangePageSize={store.changePageSize}
              onEdit={handleEdit}
              onChangeStatus={store.changeStatus}
              onDelete={store.deleteService}
              filters={store.filters}
              onSetFilter={store.setFilter}
              onClearFilters={store.clearFilters}
              onApplyQuickPeriod={store.applyQuickPeriod}
              onLoadFromSheets={store.loadFromSheets}
              onTestConnection={store.testBasicConnectivityAction}
              lastSyncTime={store.lastSyncTime}
              filterIndicator={filterIndicator}
            />
          </div>
        </div>
      )}

      {/* ─── TAB 3: HUB TRACKING ─── */}
      {activeTab === "tracking" && (
        <div className="w-full px-4 py-5 animate-[fadeSlideIn_200ms_ease]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#F0D030]" />
              Voos de Hoje
            </h2>
            <span className="text-xs text-[#666] font-mono">
              {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>

          {todayFlights.length === 0 ? (
            <div className="text-center py-16">
              <Plane className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#666] text-sm">Nenhum voo registado para hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayFlights
                .sort((a, b) => (a.horaPickup || "").localeCompare(b.horaPickup || ""))
                .map((flight) => {
                  const isArrival = flight.origem.toLowerCase().includes("aeroporto") || flight.origem.toLowerCase().includes("airport");
                  return (
                    <div
                      key={flight.id}
                      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 flex items-center gap-4 hover:border-[#F0D030]/20 transition-colors"
                      style={{ borderLeftWidth: "3px", borderLeftColor: isArrival ? "#D4A847" : "#8B9DAF" }}
                    >
                      {/* Time */}
                      <div className="flex-shrink-0 text-center min-w-[50px]">
                        <span className="text-lg font-black font-mono" style={{ color: isArrival ? "#D4A847" : "#8B9DAF" }}>
                          {flight.horaPickup}
                        </span>
                      </div>

                      {/* Flight number */}
                      <div className="flex-shrink-0 min-w-[70px]">
                        <a
                          href={`https://www.google.com/search?q=flight+${encodeURIComponent(flight.numeroVoo)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-bold text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                        >
                          {flight.numeroVoo}
                        </a>
                      </div>

                      {/* Client */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#F5F5F5] truncate">{flight.nomeCliente}</p>
                        <p className="text-xs text-[#666] truncate">
                          {flight.origem.replace("Aeroporto de Lisboa", "Aeroporto")} → {flight.destino.replace("Aeroporto de Lisboa", "Aeroporto").replace("Hotel Principal", "Hotel")}
                        </p>
                      </div>

                      {/* Pax */}
                      <div className="flex-shrink-0 text-center">
                        <span className="text-xs text-[#888] font-mono">{flight.numeroPessoas} pax</span>
                      </div>

                      {/* Type badge */}
                      <div className="flex-shrink-0">
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: isArrival ? "#D4A84730" : "#8B9DAF30",
                            color: isArrival ? "#D4A847" : "#8B9DAF",
                          }}
                        >
                          {isArrival ? "CHEGADA" : "RECOLHA"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          flight.status === "Confirmado" ? "bg-[#7EAA6E]/20 text-[#7EAA6E]" :
                          flight.status === "Finalizado" ? "bg-[#60A5FA]/20 text-[#60A5FA]" :
                          "bg-[#FFA726]/20 text-[#FFA726]"
                        }`}>
                          {flight.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab transition animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
