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

// ─── Time slots ───
const TIME_ROWS = [
  ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"],
  ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
  ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
];

const QUICK_PRICES = [25, 35, 45, 60, 75, 100];

const QUICK_OBS = [
  { label: "🧳 Bagagem Extra", value: "Bagagem Extra" },
  { label: "⚡ Urgente", value: "Urgente" },
  { label: "⭐ VIP", value: "VIP" },
  { label: "👶 Com Crianca", value: "Com Crianca" },
];

// ─── Component ───
export default function TransferForm({
  onSubmit,
  editingTransfer,
  isAdminMode,
  isLoading,
  onClear,
}: TransferFormProps) {
  // ─── Form State ───
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

  // ─── Derived ───
  const isTour = tipoServico === "Tour Regular" || tipoServico === "Private Tour";

  const tourOptions = useMemo(() => {
    const type = tipoServico === "Tour Regular" ? "regular" : "private";
    return Object.entries(TOURS_DATA).filter(([, t]) => t.type === type);
  }, [tipoServico]);

  // Auto-calculate price for tours
  useEffect(() => {
    if (isTour && tourSelecionado) {
      const price = getTourPrice(tourSelecionado, numeroPessoas, tipoServico);
      setValorTotal(price);
    }
  }, [isTour, tourSelecionado, numeroPessoas, tipoServico]);

  const adminPrices = useMemo(() => {
    return calculatePrices(
      tipoServico === "Tour Regular"
        ? "tour"
        : tipoServico === "Private Tour"
          ? "private"
          : "transfer",
      valorTotal
    );
  }, [tipoServico, valorTotal]);

  const tourUnitPrice = useMemo(() => {
    if (!tourSelecionado) return 0;
    return getTourUnitPrice(tourSelecionado, numeroPessoas);
  }, [tourSelecionado, numeroPessoas]);

  // ─── Populate on edit ───
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

  // ─── Clear form ───
  const clearForm = useCallback(() => {
    setNomeCliente("");
    setReferencia("");
    setTipoServico("Transfer");
    setTourSelecionado("");
    setNumeroPessoas(1);
    setNumeroBagagens(1);
    setData("");
    setHoraPickup("");
    setContacto("");
    setNumeroVoo("");
    setOrigem("");
    setDestino("");
    setValorTotal(0);
    setModoPagamento("");
    setPagoParaQuem("");
    setObservacoes("");
  }, []);

  // ─── Submit ───
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tourData = tourSelecionado ? TOURS_DATA[tourSelecionado] : null;
    const prices = calculatePrices(
      tipoServico === "Tour Regular"
        ? "tour"
        : tipoServico === "Private Tour"
          ? "private"
          : "transfer",
      valorTotal
    );

    onSubmit({
      nomeCliente,
      referencia,
      tipoServico,
      tourSelecionado,
      tourNome: tourData?.name || "",
      numeroPessoas,
      numeroBagagens,
      data,
      horaPickup,
      contacto,
      numeroVoo,
      origem,
      destino,
      valorTotal,
      valorHotel: prices.valorHotel,
      valorHUB: prices.valorHUB,
      comissaoRecepcao: prices.comissaoRecepcao,
      modoPagamento,
      pagoParaQuem,
      observacoes,
      status: "Solicitado",
    });

    clearForm();
  };

  const handleClear = () => {
    clearForm();
    onClear();
  };

  // ─── Quick date helpers ───
  const setToday = () => setData(formatDateForInput(new Date()));
  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setData(formatDateForInput(d));
  };

  // ─── People button handler (8+) ───
  const handlePeopleSelect = (n: number) => {
    if (n === 8) {
      const input = window.prompt("Quantas pessoas? (numero exacto)", "8");
      if (input) {
        const parsed = parseInt(input, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setNumeroPessoas(parsed);
          return;
        }
      }
      return;
    }
    setNumeroPessoas(n);
  };

  // ─── Baggage button handler (6+) ───
  const handleBaggageSelect = (n: number) => {
    if (n === 6) {
      const input = window.prompt("Quantas bagagens? (numero exacto)", "6");
      if (input) {
        const parsed = parseInt(input, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          setNumeroBagagens(parsed);
          return;
        }
      }
      return;
    }
    setNumeroBagagens(n);
  };

  // ─── Quick obs toggle ───
  const toggleObs = (value: string) => {
    if (observacoes.includes(value)) {
      setObservacoes(observacoes.replace(value, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim());
    } else {
      setObservacoes(observacoes ? `${observacoes}, ${value}` : value);
    }
  };

  // ─── Render helpers ───
  const toggleBtnClass = (active: boolean) =>
    active
      ? "bg-hub-gold text-black font-bold rounded-xl shadow-gold px-4 py-2.5 transition-all duration-200"
      : "bg-hub-black-light border border-hub-gold/10 text-hub-gray-400 rounded-xl px-4 py-2.5 hover:border-hub-gold/30 transition-all duration-200";

  const circleBtnClass = (active: boolean) =>
    active
      ? "w-12 h-12 rounded-full border-2 border-hub-gold bg-hub-gold text-black font-bold flex items-center justify-center transition-all duration-200"
      : "w-12 h-12 rounded-full border-2 border-hub-gold/20 bg-hub-black-light text-hub-gray-400 flex items-center justify-center hover:border-hub-gold/40 transition-all duration-200";

  const inputClass =
    "w-full bg-hub-black-light border border-hub-gold/10 text-white rounded-xl px-4 py-3 focus:border-hub-gold focus:ring-2 focus:ring-hub-gold/20 focus:outline-none placeholder:text-hub-gray-500 transition-all duration-200";

  const labelClass = "text-hub-gray-400 font-body text-sm font-semibold mb-2 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Header ─── */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl text-gradient-gold">
          {editingTransfer ? "Editar Transfer" : "Novo Transfer"}
        </h2>
      </div>

      {/* ─── 1. Nome do Cliente ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          👤 Nome do Cliente <span className="text-hub-error">*</span>
        </label>
        <input
          type="text"
          value={nomeCliente}
          onChange={(e) => setNomeCliente(e.target.value)}
          className={inputClass}
          placeholder="Nome completo do cliente"
          required
        />
      </div>

      {/* ─── 2. Referencia da Reserva ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>📋 Referencia da Reserva</label>
        <input
          type="text"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          className={inputClass}
          placeholder="Booking.com, Expedia"
        />
      </div>

      {/* ─── 3. Tipo de Servico ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>🚗 Tipo de Servico</label>
        <div className="flex gap-2">
          {["Transfer", "Tour Regular", "Private Tour"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTipoServico(type);
                setTourSelecionado("");
              }}
              className={`flex-1 ${toggleBtnClass(tipoServico === type)}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. Selecione o Tour ─── */}
      {isTour && (
        <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
          <label className={labelClass}>🎯 Selecione o Tour</label>
          <select
            value={tourSelecionado}
            onChange={(e) => setTourSelecionado(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Selecione --</option>
            {tourOptions.map(([key, tour]) => (
              <option key={key} value={key}>
                {tour.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ─── 5. Numero de Pessoas ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          👥 Numero de Pessoas <span className="text-hub-error">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const isActive = n < 8 ? numeroPessoas === n : numeroPessoas >= 8;
            const label =
              n === 1 ? "👤1" : n === 2 ? "👥2" : n === 8 ? "8+" : String(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => handlePeopleSelect(n)}
                className={circleBtnClass(isActive)}
              >
                <span className="text-sm">{label}</span>
              </button>
            );
          })}
        </div>
        {numeroPessoas >= 8 && (
          <p className="text-hub-gold text-sm mt-2">
            Selecionado: {numeroPessoas} pessoas
          </p>
        )}
      </div>

      {/* ─── 6. Numero de Bagagens ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>🧳 Numero de Bagagens</label>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => {
            const isActive = n < 6 ? numeroBagagens === n : numeroBagagens >= 6;
            const label =
              n === 0 ? "🎒0" : n === 1 ? "🧳1" : n === 6 ? "6+" : String(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleBaggageSelect(n)}
                className={circleBtnClass(isActive)}
              >
                <span className="text-sm">{label}</span>
              </button>
            );
          })}
        </div>
        {numeroBagagens >= 6 && (
          <p className="text-hub-gold text-sm mt-2">
            Selecionado: {numeroBagagens} bagagens
          </p>
        )}
      </div>

      {/* ─── 7. Data do Transfer ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          📅 Data do Transfer <span className="text-hub-error">*</span>
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={setToday}
            className={toggleBtnClass(data === formatDateForInput(new Date()))}
          >
            📅 Hoje
          </button>
          <button
            type="button"
            onClick={setTomorrow}
            className={toggleBtnClass(
              (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return data === formatDateForInput(d);
              })()
            )}
          >
            🗓️ Amanha
          </button>
        </div>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {/* ─── 8. Hora de Pick-up ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          🕐 Hora de Pick-up <span className="text-hub-error">*</span>
        </label>
        <div className="space-y-2 mb-3">
          {TIME_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 flex-wrap">
              {row.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setHoraPickup(time)}
                  className={`text-xs px-3 py-2 ${toggleBtnClass(horaPickup === time)}`}
                >
                  {time}
                </button>
              ))}
            </div>
          ))}
        </div>
        <input
          type="time"
          value={horaPickup}
          onChange={(e) => setHoraPickup(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {/* ─── 9. Contacto do Cliente ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          📱 Contacto do Cliente <span className="text-hub-error">*</span>
        </label>
        <PhoneInput
          value={contacto}
          onChange={setContacto}
          defaultCountry="PT"
        />
      </div>

      {/* ─── 10. Numero do Voo ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>✈️ Numero do Voo</label>
        <input
          type="text"
          value={numeroVoo}
          onChange={(e) => setNumeroVoo(e.target.value)}
          className={inputClass}
          placeholder="TP1234"
        />
      </div>

      {/* ─── 11. Local de Origem ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          📍 Local de Origem <span className="text-hub-error">*</span>
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setOrigem("Aeroporto de Lisboa")}
            className={toggleBtnClass(origem === "Aeroporto de Lisboa")}
          >
            ✈️ Aeroporto de Lisboa
          </button>
          <button
            type="button"
            onClick={() => setOrigem("Hotel Principal")}
            className={toggleBtnClass(origem === "Hotel Principal")}
          >
            🏨 Hotel Principal
          </button>
        </div>
        <input
          type="text"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className={inputClass}
          placeholder="Outro local de origem"
          required
        />
      </div>

      {/* ─── 12. Local de Destino ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          🎯 Local de Destino <span className="text-hub-error">*</span>
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setDestino("Hotel Principal")}
            className={toggleBtnClass(destino === "Hotel Principal")}
          >
            🏨 Hotel Principal
          </button>
          <button
            type="button"
            onClick={() => setDestino("Aeroporto de Lisboa")}
            className={toggleBtnClass(destino === "Aeroporto de Lisboa")}
          >
            ✈️ Aeroporto de Lisboa
          </button>
        </div>
        <input
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className={inputClass}
          placeholder="Outro local de destino"
          required
        />
      </div>

      {/* ─── 13. Valor do Servico ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          💰 Valor do Servico € <span className="text-hub-error">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PRICES.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => setValorTotal(price)}
              className={toggleBtnClass(valorTotal === price)}
            >
              €{price}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={0}
          step={0.01}
          value={valorTotal || ""}
          onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
          className={inputClass}
          placeholder="Valor em euros"
          required
        />
      </div>

      {/* ─── Price Calculation Box (tours) ─── */}
      {isTour && tourSelecionado && (
        <div className="bg-hub-black-elevated rounded-2xl border border-hub-gold/10 p-5 space-y-3">
          <h3 className="font-display text-lg text-gradient-gold">
            💰 Calculo de Preco
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-hub-gray-400">Tipo de Servico:</div>
            <div className="text-white font-semibold">{tipoServico}</div>

            <div className="text-hub-gray-400">Preco Unitario:</div>
            <div className="text-hub-gold font-semibold">€{tourUnitPrice.toFixed(2)}</div>

            <div className="text-hub-gray-400">Quantidade Pessoas:</div>
            <div className="text-white font-semibold">{numeroPessoas}</div>

            <div className="text-hub-gray-400">Valor Total:</div>
            <div className="text-hub-gold font-bold text-lg">€{valorTotal.toFixed(2)}</div>
          </div>

          {/* Admin fields */}
          {isAdminMode && (
            <div className="mt-4 pt-4 border-t border-hub-gold/10 space-y-2">
              <h4 className="text-hub-gray-400 text-xs font-semibold uppercase tracking-wider">
                Valores Administrativos
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-hub-gray-400">Valor Hotel (30%):</div>
                <div className="text-hub-warning font-semibold">
                  €{adminPrices.valorHotel.toFixed(2)}
                </div>

                <div className="text-hub-gray-400">Valor HUB:</div>
                <div className="text-hub-success font-semibold">
                  €{adminPrices.valorHUB.toFixed(2)}
                </div>

                <div className="text-hub-gray-400">Comissao Recepcao:</div>
                <div className="text-white font-semibold">
                  €{adminPrices.comissaoRecepcao.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 14. Forma de Pagamento ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          💳 Forma de Pagamento <span className="text-hub-error">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { label: "💵 Dinheiro", value: "Dinheiro" },
            { label: "💳 Cartao", value: "Cartao" },
            { label: "🏦 Transferencia", value: "Transferencia" },
          ].map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setModoPagamento(value)}
              className={`flex-1 ${toggleBtnClass(modoPagamento === value)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 15. Pago Para ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>
          👨‍💼 Pago Para <span className="text-hub-error">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { label: "👨‍💼 Recepcao", value: "Recepcao" },
            { label: "🚗 Motorista", value: "Motorista" },
          ].map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPagoParaQuem(value)}
              className={`flex-1 ${toggleBtnClass(pagoParaQuem === value)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 16. Observacoes ─── */}
      <div className="bg-hub-black-card rounded-2xl border border-hub-gold/10 p-5">
        <label className={labelClass}>📝 Observacoes</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_OBS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleObs(value)}
              className={toggleBtnClass(observacoes.includes(value))}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder="Notas adicionais..."
          rows={3}
        />
      </div>

      {/* ─── Actions ─── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-gold text-black font-bold rounded-xl py-4 uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all duration-200 shadow-gold"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              A Guardar...
            </span>
          ) : editingTransfer ? (
            "Atualizar Transfer"
          ) : (
            "Registar Transfer"
          )}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-6 bg-hub-black-light border border-hub-gold/10 text-hub-gray-400 font-semibold rounded-xl py-4 hover:border-hub-gold/30 hover:text-white transition-all duration-200"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}
