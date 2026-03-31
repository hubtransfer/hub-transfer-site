"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PhoneInput from "@/components/PhoneInput";
import {
  Transfer,
  TOURS_DATA,
  getTourPrice,
  getTourUnitPrice,
  calculatePrices,
  formatDateForInput,
} from "@/lib/transfers";

// ─── Props ───
interface TransferFormProps {
  onSubmit: (formData: Partial<Transfer>) => void;
  editingTransfer: Transfer | null;
  isAdminMode: boolean;
  isLoading: boolean;
  onClear: () => void;
}

// ─── Constants ───
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];
const QUICK_PRICES = [25, 35, 45, 60, 75, 100];
const QUICK_OBS = [
  { label: "🧳 Bagagem Extra", value: "Bagagem Extra" },
  { label: "⚡ Urgente", value: "Urgente" },
  { label: "⭐ VIP", value: "VIP" },
  { label: "👶 Com Criança", value: "Com Crianca" },
];

// ─── Component ───
export default function TransferForm({
  onSubmit, editingTransfer, isAdminMode, isLoading, onClear,
}: TransferFormProps) {
  const [nomeCliente, setNomeCliente] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoServico, setTipoServico] = useState("Transfer");
  const [tourSelecionado, setTourSelecionado] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [numeroBagagens, setNumeroBagagens] = useState(1);
  const [data, setData] = useState("");
  const [horaPickup, setHoraPickup] = useState("");
  const [contacto, setContacto] = useState("");
  const [numeroVoo, setNumeroVoo] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [valorTotal, setValorTotal] = useState(0);
  const [modoPagamento, setModoPagamento] = useState("");
  const [pagoParaQuem, setPagoParaQuem] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const isTour = tipoServico === "Tour Regular" || tipoServico === "Private Tour";

  const tourOptions = useMemo(() => {
    const type = tipoServico === "Tour Regular" ? "regular" : "private";
    return Object.entries(TOURS_DATA).filter(([, t]) => t.type === type);
  }, [tipoServico]);

  useEffect(() => {
    if (isTour && tourSelecionado) {
      setValorTotal(getTourPrice(tourSelecionado, numeroPessoas, tipoServico));
    }
  }, [isTour, tourSelecionado, numeroPessoas, tipoServico]);

  const adminPrices = useMemo(() => {
    return calculatePrices(
      tipoServico === "Tour Regular" ? "tour" : tipoServico === "Private Tour" ? "private" : "transfer",
      valorTotal
    );
  }, [tipoServico, valorTotal]);

  const tourUnitPrice = useMemo(() => {
    if (!tourSelecionado) return 0;
    return getTourUnitPrice(tourSelecionado, numeroPessoas);
  }, [tourSelecionado, numeroPessoas]);

  // Populate on edit
  useEffect(() => {
    if (editingTransfer) {
      setNomeCliente(editingTransfer.nomeCliente || "");
      setReferencia(editingTransfer.referencia || "");
      setTipoServico(editingTransfer.tipoServico || "Transfer");
      setTourSelecionado(editingTransfer.tourSelecionado || "");
      setNumeroPessoas(editingTransfer.numeroPessoas || 1);
      setNumeroBagagens(editingTransfer.numeroBagagens || 1);
      setData(editingTransfer.data ? formatDateForInput(editingTransfer.data) : "");
      setHoraPickup(editingTransfer.horaPickup || "");
      setContacto(editingTransfer.contacto || "");
      setNumeroVoo(editingTransfer.numeroVoo || "");
      setOrigem(editingTransfer.origem || "");
      setDestino(editingTransfer.destino || "");
      setValorTotal(editingTransfer.valorTotal || 0);
      setModoPagamento(editingTransfer.modoPagamento || "");
      setPagoParaQuem(editingTransfer.pagoParaQuem || "");
      setObservacoes(editingTransfer.observacoes || "");
    }
  }, [editingTransfer]);

  const clearForm = useCallback(() => {
    setNomeCliente(""); setReferencia(""); setTipoServico("Transfer");
    setTourSelecionado(""); setNumeroPessoas(1); setNumeroBagagens(1);
    setData(""); setHoraPickup(""); setContacto(""); setNumeroVoo("");
    setOrigem(""); setDestino(""); setValorTotal(0); setModoPagamento("");
    setPagoParaQuem(""); setObservacoes("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tourData = tourSelecionado ? TOURS_DATA[tourSelecionado] : null;
    const prices = calculatePrices(
      tipoServico === "Tour Regular" ? "tour" : tipoServico === "Private Tour" ? "private" : "transfer",
      valorTotal
    );
    onSubmit({
      nomeCliente, referencia, tipoServico, tourSelecionado,
      tourNome: tourData?.name || "", numeroPessoas, numeroBagagens,
      data, horaPickup, contacto, numeroVoo, origem, destino,
      valorTotal, valorHotel: prices.valorHotel, valorHUB: prices.valorHUB,
      comissaoRecepcao: prices.comissaoRecepcao, modoPagamento,
      pagoParaQuem, observacoes, status: "Solicitado",
    });
    clearForm();
  };

  const handleClear = () => { clearForm(); onClear(); };

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const setToday = () => setData(formatDateForInput(new Date()));
  const setTomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); setData(formatDateForInput(d)); };

  const handlePeopleSelect = (n: number) => {
    if (n === 8) {
      const input = window.prompt("Quantas pessoas?", "8");
      if (input) { const p = parseInt(input, 10); if (!isNaN(p) && p > 0) setNumeroPessoas(p); }
      return;
    }
    setNumeroPessoas(n);
  };

  const handleBaggageSelect = (n: number) => {
    if (n === 6) {
      const input = window.prompt("Quantas bagagens?", "6");
      if (input) { const p = parseInt(input, 10); if (!isNaN(p) && p >= 0) setNumeroBagagens(p); }
      return;
    }
    setNumeroBagagens(n);
  };

  const toggleObs = (value: string) => {
    if (observacoes.includes(value)) {
      setObservacoes(observacoes.replace(value, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim());
    } else {
      setObservacoes(observacoes ? `${observacoes}, ${value}` : value);
    }
  };

  // ─── Style helpers ───
  const chip = (active: boolean) =>
    `px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
      active ? "bg-[#F0D030] text-[#0A0A0A]" : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#F0D030]/30"
    }`;

  const chipLg = (active: boolean) =>
    `px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
      active ? "bg-[#F0D030] text-[#0A0A0A]" : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#F0D030]/30"
    }`;

  const input = "w-full h-10 bg-[#111] border border-[#2A2A2A] rounded-lg px-3 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] focus:ring-1 focus:ring-[#F0D030]/20 transition-colors";

  const label = "text-[#A0A0A0] text-xs font-semibold mb-1.5 block";

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <h2 className="text-lg font-bold text-[#F5F5F5] mb-4">
        {editingTransfer ? "Editar Transfer" : "Novo Transfer"}
      </h2>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 md:p-5 space-y-4">
        {/* Row 1: Nome + Referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>👤 Nome do Cliente <span className="text-[#C06060]">*</span></label>
            <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)}
              className={input} placeholder="Nome completo" required />
          </div>
          <div>
            <label className={label}>📋 Referência</label>
            <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)}
              className={input} placeholder="Booking.com, Expedia..." />
          </div>
        </div>

        {/* Tipo de Servico */}
        <div>
          <label className={label}>🚐 Tipo de Serviço</label>
          <div className="flex gap-2">
            {["Transfer", "Tour Regular", "Private Tour"].map((type) => (
              <button key={type} type="button"
                onClick={() => { setTipoServico(type); setTourSelecionado(""); }}
                className={chipLg(tipoServico === type)}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Tour selector */}
        {isTour && (
          <div>
            <label className={label}>🎯 Selecionar Tour</label>
            <select value={tourSelecionado} onChange={(e) => setTourSelecionado(e.target.value)} className={input}>
              <option value="">-- Selecione --</option>
              {tourOptions.map(([key, tour]) => (
                <option key={key} value={key}>{tour.name}</option>
              ))}
            </select>
            {/* Inline price calculation */}
            {tourSelecionado && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-[#A0A0A0]">
                <span>Unitário: <span className="text-[#F0D030]">€{tourUnitPrice.toFixed(0)}</span></span>
                <span>× {numeroPessoas} pax</span>
                <span>= <span className="text-[#F0D030] font-bold text-sm">€{valorTotal.toFixed(0)}</span></span>
                {isAdminMode && (
                  <>
                    <span className="text-[#2A2A2A]">|</span>
                    <span>Hotel: <span className="text-[#FFA726]">€{adminPrices.valorHotel.toFixed(0)}</span></span>
                    <span>HUB: <span className="text-[#7EAA6E]">€{adminPrices.valorHUB.toFixed(0)}</span></span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row: Pessoas + Bagagens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>👥 Pessoas <span className="text-[#C06060]">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button key={n} type="button" onClick={() => handlePeopleSelect(n)}
                  className={chip(n < 8 ? numeroPessoas === n : numeroPessoas >= 8)}>
                  {n === 8 ? "8+" : n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>🧳 Bagagens</label>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" onClick={() => handleBaggageSelect(n)}
                  className={chip(n < 6 ? numeroBagagens === n : numeroBagagens >= 6)}>
                  {n === 6 ? "6+" : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row: Data + Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>📅 Data <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5 mb-2">
              <button type="button" onClick={setToday} className={chip(data === formatDateForInput(new Date()))}>Hoje</button>
              <button type="button" onClick={setTomorrow} className={chip((() => { const d = new Date(); d.setDate(d.getDate() + 1); return data === formatDateForInput(d); })())}>Amanhã</button>
            </div>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={input} required />
          </div>
          <div>
            <label className={label}>⏰ Hora Pick-up <span className="text-[#C06060]">*</span></label>
            <div className="flex flex-wrap gap-1 mb-2">
              {TIME_SLOTS.map((time) => (
                <button key={time} type="button" onClick={() => setHoraPickup(time)}
                  className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                    horaPickup === time ? "bg-[#F0D030] text-[#0A0A0A]" : "bg-[#111] text-[#666] hover:text-[#A0A0A0]"
                  }`}>
                  {time}
                </button>
              ))}
            </div>
            <input type="time" value={horaPickup} onChange={(e) => setHoraPickup(e.target.value)} className={input} required />
          </div>
        </div>

        {/* Row: Contacto + Voo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>📞 Contacto <span className="text-[#C06060]">*</span></label>
            <PhoneInput value={contacto} onChange={setContacto} defaultCountry="PT" />
          </div>
          <div>
            <label className={label}>✈️ Número do Voo</label>
            <input type="text" value={numeroVoo} onChange={(e) => setNumeroVoo(e.target.value)}
              className={input} placeholder="TP1234" />
          </div>
        </div>

        {/* Row: Origem + Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>📍 Origem <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5 mb-2">
              <button type="button" onClick={() => setOrigem("Aeroporto de Lisboa")}
                className={chip(origem === "Aeroporto de Lisboa")}>✈️ Aeroporto</button>
              <button type="button" onClick={() => setOrigem("Hotel Principal")}
                className={chip(origem === "Hotel Principal")}>🏨 Hotel</button>
            </div>
            <input type="text" value={origem} onChange={(e) => setOrigem(e.target.value)}
              className={input} placeholder="Outro local..." required />
          </div>
          <div>
            <label className={label}>📍 Destino <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5 mb-2">
              <button type="button" onClick={() => setDestino("Hotel Principal")}
                className={chip(destino === "Hotel Principal")}>🏨 Hotel</button>
              <button type="button" onClick={() => setDestino("Aeroporto de Lisboa")}
                className={chip(destino === "Aeroporto de Lisboa")}>✈️ Aeroporto</button>
            </div>
            <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)}
              className={input} placeholder="Outro local..." required />
          </div>
        </div>

        {/* Row: Valor + Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>💰 Valor € <span className="text-[#C06060]">*</span></label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_PRICES.map((price) => (
                <button key={price} type="button" onClick={() => setValorTotal(price)}
                  className={chip(valorTotal === price)}>€{price}</button>
              ))}
            </div>
            <input type="number" min={0} step={0.01} value={valorTotal || ""}
              onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
              className={input} placeholder="Valor em euros" required />
            {/* Admin inline prices */}
            {isAdminMode && valorTotal > 0 && !isTour && (
              <div className="mt-1.5 flex gap-3 text-[10px] font-mono text-[#666]">
                <span>Hotel: <span className="text-[#FFA726]">€{adminPrices.valorHotel.toFixed(0)}</span></span>
                <span>HUB: <span className="text-[#7EAA6E]">€{adminPrices.valorHUB.toFixed(0)}</span></span>
                <span>Comissão: <span className="text-[#F5F5F5]">€{adminPrices.comissaoRecepcao.toFixed(0)}</span></span>
              </div>
            )}
          </div>
          <div>
            <label className={label}>💳 Pagamento <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5">
              {[
                { label: "💵 Dinheiro", value: "Dinheiro" },
                { label: "💳 Cartão", value: "Cartao" },
                { label: "🏦 Transf.", value: "Transferencia" },
              ].map(({ label: l, value }) => (
                <button key={value} type="button" onClick={() => setModoPagamento(value)}
                  className={chipLg(modoPagamento === value)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Row: Pago Para + Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>👤 Pago Para <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5">
              {[
                { label: "👨‍💼 Recepção", value: "Recepcao" },
                { label: "🚗 Motorista", value: "Motorista" },
              ].map(({ label: l, value }) => (
                <button key={value} type="button" onClick={() => setPagoParaQuem(value)}
                  className={chipLg(pagoParaQuem === value)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>📝 Observações</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_OBS.map(({ label: l, value }) => (
                <button key={value} type="button" onClick={() => toggleObs(value)}
                  className={chip(observacoes.includes(value))}>{l}</button>
              ))}
            </div>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              className={`${input} min-h-[60px] h-auto resize-y py-2`} placeholder="Notas..." rows={2} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={isLoading} title="Ctrl+Enter"
          className="flex-1 h-11 bg-[#F0D030] text-[#0A0A0A] font-bold text-sm rounded-lg hover:bg-[#D4B828] disabled:opacity-50 transition-colors cursor-pointer uppercase tracking-wider">
          {isLoading ? "A Guardar..." : editingTransfer ? "Actualizar Transfer" : "Registar Transfer"}
        </button>
        <button type="button" onClick={handleClear}
          className="h-11 px-5 bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] text-sm font-semibold rounded-lg hover:text-[#F5F5F5] transition-colors cursor-pointer">
          Limpar
        </button>
      </div>
    </form>
  );
}
