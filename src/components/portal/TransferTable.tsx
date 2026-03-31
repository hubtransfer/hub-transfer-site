"use client";

import React from "react";
import { Pencil, Check, Trash2 } from "lucide-react";
import {
  Transfer,
  ActiveFilters,
  getTimeEmoji,
  getLocationEmoji,
  getPeopleEmoji,
  getBaggageEmoji,
  formatDisplayDate,
} from "@/lib/transfers";

// ─── Props ───

interface TransferTableProps {
  services: Transfer[];
  totalServices: number;
  isAdminMode: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onChangePage: (page: number) => void;
  onChangePageSize: (size: number) => void;
  onEdit: (id: number) => void;
  onChangeStatus: (id: number) => void;
  onDelete: (id: number) => void;
  filters: ActiveFilters;
  onSetFilter: (key: string, value: string | null) => void;
  onClearFilters: () => void;
  onApplyQuickPeriod: (period: string) => void;
  onLoadFromSheets: () => void;
  onTestConnection: () => void;
  lastSyncTime: string | null;
  filterIndicator: { filtered: number; total: number } | null;
}

// ─── Helpers ───

function cleanPhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "");
}

function isTourService(tipo: string, tourNome?: string): boolean {
  const t = (tipo || "").toLowerCase();
  return t.includes("tour") || t.includes("private") || !!(tourNome && tourNome.trim());
}

function isAirportToHotel(origem: string, destino: string): boolean {
  const o = origem.toLowerCase();
  const d = destino.toLowerCase();
  return (
    (o.includes("aeroporto") || o.includes("airport")) &&
    (d.includes("hotel") || (!d.includes("aeroporto") && !d.includes("airport")))
  );
}

function statusClass(status: string): string {
  switch (status) {
    case "Solicitado":
      return "bg-hub-warning/20 text-hub-warning";
    case "Confirmado":
      return "bg-hub-success/20 text-hub-success";
    case "Finalizado":
      return "bg-blue-500/20 text-blue-400";
    case "Cancelado":
      return "bg-hub-error/20 text-hub-error";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

// ─── Component ───

export default function TransferTable({
  services,
  totalServices,
  isAdminMode,
  currentPage,
  totalPages,
  itemsPerPage,
  onChangePage,
  onChangePageSize,
  onEdit,
  onChangeStatus,
  onDelete,
  filters,
  onSetFilter,
  onClearFilters,
  onApplyQuickPeriod,
  onLoadFromSheets,
  onTestConnection,
  lastSyncTime,
  filterIndicator,
}: TransferTableProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalServices);

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════
          FILTERS BAR
         ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-hub-gold/10 bg-hub-black-card p-4 space-y-4">
        {/* Row 1: Date inputs + quick period + status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Start */}
          <div>
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Data Inicio
            </label>
            <input
              type="date"
              value={filters.dateStart ?? ""}
              onChange={(e) => onSetFilter("dateStart", e.target.value)}
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 focus:border-hub-gold/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.dateEnd ?? ""}
              onChange={(e) => onSetFilter("dateEnd", e.target.value)}
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 focus:border-hub-gold/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Periods */}
          <div>
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Periodo Rapido
            </label>
            <select
              value={filters.quickPeriod}
              onChange={(e) => onApplyQuickPeriod(e.target.value)}
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 focus:border-hub-gold/40 focus:outline-none transition-colors"
            >
              <option value="">Selecionar...</option>
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="thisWeek">Esta Semana</option>
              <option value="lastWeek">Semana Passada</option>
              <option value="thisMonth">Este Mes</option>
              <option value="lastMonth">Mes Passado</option>
              <option value="last7days">Ultimos 7 Dias</option>
              <option value="last30days">Ultimos 30 Dias</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onSetFilter("status", e.target.value)}
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 focus:border-hub-gold/40 focus:outline-none transition-colors"
            >
              <option value="">Todos</option>
              <option value="Solicitado">Solicitado</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Tipo Servico
            </label>
            <select
              value={filters.tipoServico}
              onChange={(e) => onSetFilter("tipoServico", e.target.value)}
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 focus:border-hub-gold/40 focus:outline-none transition-colors"
            >
              <option value="">Todos</option>
              <option value="Transfer">Transfer</option>
              <option value="Tour Regular">Tour Regular</option>
              <option value="Private Tour">Private Tour</option>
            </select>
          </div>
        </div>

        {/* Row 2: Client search + action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          {/* Client search */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-hub-gold/60 mb-1 font-mono uppercase tracking-wider">
              Cliente
            </label>
            <input
              type="text"
              value={filters.cliente}
              onChange={(e) => onSetFilter("cliente", e.target.value)}
              placeholder="Pesquisar cliente..."
              className="w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-lg text-sm px-3 py-2 placeholder:text-gray-500 focus:border-hub-gold/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {/* filters are applied reactively via onSetFilter */}}
              className="px-4 py-2 bg-hub-gold text-black text-sm font-bold rounded-lg hover:bg-hub-gold/90 transition-colors whitespace-nowrap"
            >
              {"🔍 Aplicar Filtros"}
            </button>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-hub-black-elevated text-white text-sm font-medium rounded-lg border border-hub-gold/10 hover:border-hub-gold/30 transition-colors whitespace-nowrap"
            >
              {"🧹 Limpar Filtros"}
            </button>
            <button
              onClick={onLoadFromSheets}
              className="px-4 py-2 bg-hub-gold text-black text-sm font-bold rounded-lg hover:bg-hub-gold/90 transition-colors whitespace-nowrap"
            >
              {"📥 Carregar Transfers"}
            </button>
            <button
              onClick={onTestConnection}
              className="px-4 py-2 bg-hub-black-elevated text-white text-sm font-medium rounded-lg border border-hub-gold/10 hover:border-hub-gold/30 transition-colors whitespace-nowrap"
            >
              {"🔗 Testar Conexao"}
            </button>
          </div>
        </div>

        {/* Row 3: Sync time + filter indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          {lastSyncTime && (
            <span>
              Ultima sincronizacao:{" "}
              <span className="text-hub-gold/80">
                {new Date(lastSyncTime).toLocaleString("pt-PT")}
              </span>
            </span>
          )}
          {filterIndicator && (
            <span className="bg-hub-gold/10 text-hub-gold px-3 py-1 rounded-full">
              Mostrando {filterIndicator.filtered} de {filterIndicator.total} registos
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TABLE
         ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#111] overflow-hidden">
        <div className="overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#F0D030/30 transparent" }}>
          <table className="w-full text-[13px]">
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0A0A0A] text-[#F0D030] uppercase font-mono text-[11px] tracking-wider">
                <th className="px-2 py-2.5 text-left whitespace-nowrap">ID</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Ref</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Cliente</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Tipo</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">Pax</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">Bag</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Data</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Hora</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Contacto</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Voo</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Rota</th>
                <th className="px-2 py-2.5 text-right whitespace-nowrap">Valor</th>
                {isAdminMode && (
                  <>
                    <th className="px-2 py-2.5 text-right whitespace-nowrap">Hotel</th>
                    <th className="px-2 py-2.5 text-right whitespace-nowrap">HUB</th>
                    <th className="px-2 py-2.5 text-right whitespace-nowrap">Comissão</th>
                  </>
                )}
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Pagamento</th>
                <th className="px-2 py-2.5 text-left whitespace-nowrap">Pago Para</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">Status</th>
                <th className="px-2 py-2.5 text-center whitespace-nowrap">Acções</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdminMode ? 19 : 16}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <span className="text-4xl">📭</span>
                      <p className="text-lg font-medium">Nenhum transfer encontrado</p>
                      <p className="text-sm">
                        Ajuste os filtros ou carregue dados da planilha.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((s) => {
                  const tour = isTourService(s.tipoServico, s.tourNome);
                  const airportHotel = isAirportToHotel(s.origem, s.destino);
                  const phone = cleanPhone(s.contacto);
                  const tripColor = tour ? "#C17E4A" : airportHotel ? "#D4A847" : "#8B9DAF";

                  return (
                    <tr
                      key={s.id}
                      style={{ borderLeft: `3px solid ${tripColor}` }}
                      className="border-b border-[#1A1A1A] bg-[#111] hover:bg-[#1A1A1A] transition-colors"
                    >
                      {/* ID */}
                      <td className="px-2 py-2 text-[#666] font-mono text-xs">
                        {s.id}
                      </td>

                      {/* Ref */}
                      <td className="px-2 py-2 text-[#888] font-mono text-xs max-w-[80px] truncate">
                        {s.referencia || "—"}
                      </td>

                      {/* Cliente */}
                      <td className="px-2 py-2 text-[#F5F5F5] font-medium max-w-[140px] truncate">
                        {s.nomeCliente}
                      </td>

                      {/* Tipo */}
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${tripColor}30`, color: tripColor }}>
                          {s.tipoServico}
                        </span>
                      </td>

                      {/* Pax */}
                      <td className="px-2 py-2 text-center text-[#D0D0D0] font-mono">
                        {s.numeroPessoas}
                      </td>

                      {/* Bag */}
                      <td className="px-2 py-2 text-center text-[#D0D0D0] font-mono">
                        {s.numeroBagagens}
                      </td>

                      {/* Data */}
                      <td className="px-2 py-2 text-[#D0D0D0] whitespace-nowrap font-mono text-xs">
                        {formatDisplayDate(s.data)}
                      </td>

                      {/* Hora */}
                      <td className="px-2 py-2 text-[#D0D0D0] whitespace-nowrap font-mono">
                        {s.horaPickup || "—"}
                      </td>

                      {/* Contacto */}
                      <td className="px-2 py-2 whitespace-nowrap">
                        {phone ? (
                          <a href={`https://wa.me/${phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
                            className="text-[#25d366] hover:text-[#2ecc71] transition-colors text-xs underline underline-offset-2" title="WhatsApp">
                            {s.contacto}
                          </a>
                        ) : <span className="text-[#555] text-xs">—</span>}
                      </td>

                      {/* Voo */}
                      <td className="px-2 py-2 whitespace-nowrap">
                        {s.numeroVoo ? (
                          <a href={`https://www.google.com/search?q=flight+${encodeURIComponent(s.numeroVoo)}`} target="_blank" rel="noopener noreferrer"
                            className="text-[#60A5FA] hover:text-[#93C5FD] transition-colors text-xs font-mono" title="Pesquisar voo">
                            {s.numeroVoo}
                          </a>
                        ) : <span className="text-[#555] text-xs">—</span>}
                      </td>

                      {/* Rota */}
                      <td className="px-2 py-2 text-[#A0A0A0] text-xs max-w-[160px]" title={`${s.origem} → ${s.destino}`}>
                        <span className="block truncate">{s.origem.replace("Aeroporto de Lisboa", "Aeroporto").replace("Hotel Principal", "Hotel")}</span>
                        <span className="text-[#555]">→ </span>
                        <span className="truncate">{s.destino.replace("Aeroporto de Lisboa", "Aeroporto").replace("Hotel Principal", "Hotel")}</span>
                      </td>

                      {/* Valor */}
                      <td className="px-2 py-2 text-right text-[#F0D030] font-bold font-mono whitespace-nowrap">
                        {s.valorTotal > 0 ? `€${s.valorTotal.toFixed(0)}` : "—"}
                      </td>

                      {/* Admin columns */}
                      {isAdminMode && (
                        <>
                          <td className="px-2 py-2 text-right text-[#888] font-mono text-xs whitespace-nowrap">
                            {s.valorHotel > 0 ? `€${s.valorHotel.toFixed(0)}` : "—"}
                          </td>
                          <td className="px-2 py-2 text-right text-[#888] font-mono text-xs whitespace-nowrap">
                            {s.valorHUB > 0 ? `€${s.valorHUB.toFixed(0)}` : "—"}
                          </td>
                          <td className="px-2 py-2 text-right text-[#888] font-mono text-xs whitespace-nowrap">
                            {s.comissaoRecepcao > 0 ? `€${s.comissaoRecepcao.toFixed(0)}` : "—"}
                          </td>
                        </>
                      )}

                      {/* Pagamento */}
                      <td className="px-2 py-2 text-[#A0A0A0] text-xs whitespace-nowrap">
                        {s.modoPagamento || "—"}
                      </td>

                      {/* Pago Para */}
                      <td className="px-2 py-2 text-[#A0A0A0] text-xs whitespace-nowrap">
                        {s.pagoParaQuem || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => onChangeStatus(s.id)}
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-opacity hover:opacity-80 ${statusClass(s.status)}`}
                          title="Alterar status">
                          {s.status}
                        </button>
                      </td>

                      {/* Acções */}
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => onEdit(s.id)}
                            className="p-1.5 rounded-lg text-[#666] hover:text-[#F0D030] hover:bg-[#F0D030]/10 transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => onChangeStatus(s.id)}
                            className="p-1.5 rounded-lg text-[#666] hover:text-[#7EAA6E] hover:bg-[#7EAA6E]/10 transition-colors" title="Confirmar">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(s.id)}
                            className="p-1.5 rounded-lg text-[#666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PAGINATION
         ══════════════════════════════════════════════ */}
      {totalServices > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          {/* Info */}
          <span className="text-sm text-gray-400">
            Mostrando{" "}
            <span className="text-white font-medium">{startItem}</span> a{" "}
            <span className="text-white font-medium">{endItem}</span> de{" "}
            <span className="text-hub-gold font-medium">{totalServices}</span>{" "}
            registos
          </span>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {/* First */}
            <button
              onClick={() => onChangePage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-hub-gold/20 text-hub-gold hover:bg-hub-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-hub-gold transition-colors"
              title="Primeira pagina"
            >
              {"«"}
            </button>

            {/* Previous */}
            <button
              onClick={() => onChangePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-hub-gold/20 text-hub-gold hover:bg-hub-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-hub-gold transition-colors"
              title="Pagina anterior"
            >
              {"‹"}
            </button>

            {/* Page indicator */}
            <span className="px-4 py-1.5 text-xs text-gray-300 font-mono">
              Pagina{" "}
              <span className="text-hub-gold font-bold">{currentPage}</span>{" "}
              de{" "}
              <span className="text-hub-gold font-bold">{totalPages}</span>
            </span>

            {/* Next */}
            <button
              onClick={() => onChangePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-hub-gold/20 text-hub-gold hover:bg-hub-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-hub-gold transition-colors"
              title="Proxima pagina"
            >
              {"›"}
            </button>

            {/* Last */}
            <button
              onClick={() => onChangePage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-hub-gold/20 text-hub-gold hover:bg-hub-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-hub-gold transition-colors"
              title="Ultima pagina"
            >
              {"»"}
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Por pagina:</span>
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => onChangePageSize(size)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  itemsPerPage === size
                    ? "bg-hub-gold text-black border-hub-gold font-bold"
                    : "border-hub-gold/20 text-hub-gold hover:bg-hub-gold hover:text-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
