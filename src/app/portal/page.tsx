"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useTransferStore } from "@/hooks/useTransferStore";
import TransferForm from "@/components/portal/TransferForm";
import TransferTable from "@/components/portal/TransferTable";
import KPICards from "@/components/portal/KPICards";
import FinancialSummary from "@/components/portal/FinancialSummary";
import ActionBar from "@/components/portal/ActionBar";
import ConfigPanel from "@/components/portal/ConfigPanel";
import ClearDataPanel from "@/components/portal/ClearDataPanel";
import StatusToast from "@/components/portal/StatusToast";
import type { Transfer } from "@/lib/transfers";
import { getSession, fetchHotelUrl, saveHotelUrl } from "@/lib/auth";

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

  // Auto-configure GAS URL based on session — fetch from backend
  useEffect(() => {
    const session = getSession();
    const code = session?.code || "";
    if (session?.role === "admin") setIsAdmin(true);
    if (code) {
      setHotelCode(code);
      setHotelName(session?.name || code);
    }

    (async () => {
      if (!code) {
        // No hotel code — try loading with whatever webappUrl exists
        store.loadFromSheets();
        return;
      }
      // Fetch URL from backend
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

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleEdit = useCallback(
    (id: number) => {
      store.editService(id);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [store]
  );

  const editingTransfer: Transfer | null = store.editingId
    ? store.services.find((s) => s.id === store.editingId) ?? null
    : null;

  const hasActiveFilters =
    store.filters.dateStart ||
    store.filters.dateEnd ||
    store.filters.status ||
    store.filters.cliente ||
    store.filters.tipoServico;

  const filterIndicator = hasActiveFilters
    ? {
        filtered: store.filteredServices.length,
        total: store.services.length,
      }
    : null;

  return (
    <div className="min-h-screen bg-hub-black">
      {/* Status Toast */}
      <StatusToast
        message={store.statusMessage}
        type={store.statusType}
      />

      {/* Admin bar + URL editor */}
      {isAdmin && hotelCode && (
        <div className="bg-[#F0D030]/10 border-b border-[#F0D030]/20 px-4 py-3">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#F0D030] font-mono font-bold">
                Modo Administrador — Hotel: {hotelCode}
              </span>
              <a href="/admin/partners" className="text-xs text-[#888] hover:text-[#F5F5F5] font-mono cursor-pointer">← Voltar</a>
            </div>
            {/* URL editor */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-[#F0D030] font-mono flex-shrink-0">URL GAS:</label>
              <input
                type="url"
                value={hotelGasUrl}
                onChange={(e) => setHotelGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="flex-1 h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 text-[11px] text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono"
              />
              <button
                onClick={async () => {
                  if (!hotelGasUrl.trim()) return;
                  setUrlSaving(true);
                  const res = await saveHotelUrl(hotelCode, hotelGasUrl.trim());
                  setUrlSaving(false);
                  if (res.success) {
                    localStorage.setItem("webappUrl", hotelGasUrl.trim());
                    setNoUrl(false);
                    setUrlToast("URL guardada ✓");
                    store.loadFromSheets();
                  } else {
                    setUrlToast(res.message || "Erro ao guardar");
                  }
                  setTimeout(() => setUrlToast(""), 3000);
                }}
                disabled={urlSaving}
                className="h-8 px-3 bg-[#F0D030] text-[#0A0A0A] text-[10px] font-bold rounded hover:bg-[#D4B828] disabled:opacity-50 cursor-pointer"
              >
                {urlSaving ? "..." : "Guardar"}
              </button>
              <button
                onClick={() => store.testConnectionAction(hotelGasUrl)}
                className="h-8 px-3 bg-[#222] text-[#D0D0D0] text-[10px] font-bold rounded hover:text-[#F5F5F5] cursor-pointer"
              >
                Testar
              </button>
              {urlToast && <span className="text-[10px] text-[#7EAA6E] font-mono">{urlToast}</span>}
            </div>
          </div>
        </div>
      )}

      {/* No URL warning */}
      {noUrl && (
        <div className="bg-[#C06060]/10 border-b border-[#C06060]/20 px-4 py-4 text-center">
          <p className="text-sm text-[#C06060] font-semibold">Portal em configuração.</p>
          <p className="text-xs text-[#888] mt-1">
            {isAdmin ? "Configure a URL do GAS para este hotel na secção abaixo." : "Contacte o administrador para configurar o acesso."}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-hub-black-card to-hub-black border-b border-hub-gold/10">
        <div className="max-w-[1400px] mx-auto px-4 py-8 text-center">
          <Image src="/images/logo.png" alt="HUB Transfer" width={200} height={56} className="h-14 w-auto mx-auto mb-2" priority />
          <p className="text-hub-gray-400 text-lg font-body tracking-wide">
            {hotelName || "Sistema de Gestão de Transfers"}
          </p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto">
        {/* Action Bar */}
        <ActionBar
          onScrollToForm={scrollToForm}
          onClearForm={() => store.setEditingId(null)}
          onExportCSV={store.exportCSV}
          onToggleConfig={isAdmin ? () => setShowConfig(!showConfig) : () => {}}
          onToggleClearData={isAdmin ? () => setShowClearData(!showClearData) : () => {}}
        />

        {/* Config Panel — admin only */}
        {isAdmin && (
          <ConfigPanel
            isOpen={showConfig}
            onClose={() => setShowConfig(false)}
            onTestConnection={(url) => {
              store.testConnectionAction(url);
            }}
            statusMessage={store.statusMessage}
            statusType={store.statusType}
          />
        )}

        {/* Clear Data Panel */}
        <ClearDataPanel
          isOpen={showClearData}
          onClose={() => setShowClearData(false)}
          onClearAll={store.clearAllData}
          onClearTests={store.clearTestData}
        />

        {/* Transfer Form */}
        <div ref={formRef}>
          <TransferForm
            onSubmit={store.submitTransfer}
            editingTransfer={editingTransfer}
            isAdminMode={store.isAdminMode}
            isLoading={store.syncInProgress}
            onClear={() => store.setEditingId(null)}
          />
        </div>

        {/* KPI Cards */}
        <div className="px-4 py-6 space-y-6">
          <KPICards
            total={store.summary.total}
            pending={store.summary.pending}
            confirmed={store.summary.confirmed}
            completed={store.summary.completed}
          />

          {/* Financial Summary */}
          <FinancialSummary
            totalRevenue={store.summary.totalRevenue}
            pendingRevenue={store.summary.pendingRevenue}
            confirmedRevenue={store.summary.confirmedRevenue}
            completedRevenue={store.summary.completedRevenue}
          />
        </div>

        {/* Transfer Table */}
        <div className="px-4 pb-8">
          <TransferTable
            services={store.paginatedServices}
            totalServices={
              hasActiveFilters
                ? store.filteredServices.length
                : store.services.length
            }
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

      {/* Admin Toggle */}
      <button
        onClick={store.toggleAdmin}
        className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
          store.isAdminMode
            ? "bg-hub-gold text-black shadow-gold"
            : "bg-hub-black-elevated border border-hub-gold/10 text-hub-gray-400 hover:border-hub-gold/30"
        }`}
      >
        👨‍💻 Admin{store.isAdminMode ? " ✓" : ""}
      </button>
    </div>
  );
}
