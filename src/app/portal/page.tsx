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
import { getSession, getHotelUrl } from "@/lib/auth";

export default function PortalPage() {
  const store = useTransferStore();
  const formRef = useRef<HTMLDivElement>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showClearData, setShowClearData] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hotelName, setHotelName] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [noUrl, setNoUrl] = useState(false);

  // Auto-configure GAS URL based on session
  useEffect(() => {
    const session = getSession();
    if (session?.role === "admin") {
      setIsAdmin(true);
      // Admin entering a specific hotel portal
      if (session.code) {
        setHotelCode(session.code);
        setHotelName(session.name || session.code);
        const url = getHotelUrl(session.code);
        if (url) {
          localStorage.setItem("webappUrl", url);
        } else {
          setNoUrl(true);
        }
      }
    } else if (session?.role === "hotel") {
      setHotelCode(session.code || "");
      setHotelName(session.name || "");
      const url = getHotelUrl(session.code || "");
      if (url) {
        localStorage.setItem("webappUrl", url);
      } else {
        setNoUrl(true);
        return; // Don't load if no URL
      }
    }
    // Auto-load transfers
    if (!noUrl) store.loadFromSheets();
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

      {/* Admin bar */}
      {isAdmin && hotelCode && (
        <div className="bg-[#F0D030]/10 border-b border-[#F0D030]/20 px-4 py-2 text-center">
          <span className="text-sm text-[#F0D030] font-mono">
            Modo Administrador — Hotel: {hotelCode}
          </span>
          <a href="/admin/partners" className="ml-4 text-xs text-[#888] hover:text-[#F5F5F5] font-mono cursor-pointer">← Voltar</a>
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
