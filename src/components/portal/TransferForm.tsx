"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User, FileText, Car, Users, Briefcase, Calendar, Clock,
  Phone, Plane, MapPin, Navigation, DollarSign, CreditCard, MessageSquare,
} from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import {
  Transfer, TOURS_DATA, getTourPrice, getTourUnitPrice,
  calculatePrices, formatDateForInput,
} from "@/lib/transfers";

interface TransferFormProps {
  onSubmit: (formData: Partial<Transfer>) => void;
  editingTransfer: Transfer | null;
  isAdminMode: boolean;
  isLoading: boolean;
  onClear: () => void;
}

const TIME_SLOTS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00","22:00","23:00",
];
const QUICK_PRICES = [25, 35, 45, 60, 75, 100];
const QUICK_OBS = [
  { label: "Bagagem Extra", value: "Bagagem Extra", icon: Briefcase },
  { label: "Urgente", value: "Urgente", icon: Clock },
  { label: "VIP", value: "VIP", icon: User },
  { label: "Com Criança", value: "Com Crianca", icon: Users },
];

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
    if (isTour && tourSelecionado) setValorTotal(getTourPrice(tourSelecionado, numeroPessoas, tipoServico));
  }, [isTour, tourSelecionado, numeroPessoas, tipoServico]);

  const adminPrices = useMemo(() => calculatePrices(
    tipoServico === "Tour Regular" ? "tour" : tipoServico === "Private Tour" ? "private" : "transfer", valorTotal
  ), [tipoServico, valorTotal]);

  const tourUnitPrice = useMemo(() => tourSelecionado ? getTourUnitPrice(tourSelecionado, numeroPessoas) : 0, [tourSelecionado, numeroPessoas]);

  useEffect(() => {
    if (editingTransfer) {
      setNomeCliente(editingTransfer.nomeCliente || ""); setReferencia(editingTransfer.referencia || "");
      setTipoServico(editingTransfer.tipoServico || "Transfer"); setTourSelecionado(editingTransfer.tourSelecionado || "");
      setNumeroPessoas(editingTransfer.numeroPessoas || 1); setNumeroBagagens(editingTransfer.numeroBagagens || 1);
      setData(editingTransfer.data ? formatDateForInput(editingTransfer.data) : ""); setHoraPickup(editingTransfer.horaPickup || "");
      setContacto(editingTransfer.contacto || ""); setNumeroVoo(editingTransfer.numeroVoo || "");
      setOrigem(editingTransfer.origem || ""); setDestino(editingTransfer.destino || "");
      setValorTotal(editingTransfer.valorTotal || 0); setModoPagamento(editingTransfer.modoPagamento || "");
      setPagoParaQuem(editingTransfer.pagoParaQuem || ""); setObservacoes(editingTransfer.observacoes || "");
    }
  }, [editingTransfer]);

  const clearForm = useCallback(() => {
    setNomeCliente(""); setReferencia(""); setTipoServico("Transfer"); setTourSelecionado("");
    setNumeroPessoas(1); setNumeroBagagens(1); setData(""); setHoraPickup("");
    setContacto(""); setNumeroVoo(""); setOrigem(""); setDestino("");
    setValorTotal(0); setModoPagamento(""); setPagoParaQuem(""); setObservacoes("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tourData = tourSelecionado ? TOURS_DATA[tourSelecionado] : null;
    const prices = calculatePrices(tipoServico === "Tour Regular" ? "tour" : tipoServico === "Private Tour" ? "private" : "transfer", valorTotal);
    onSubmit({
      nomeCliente, referencia, tipoServico, tourSelecionado, tourNome: tourData?.name || "",
      numeroPessoas, numeroBagagens, data, horaPickup, contacto, numeroVoo, origem, destino,
      valorTotal, valorHotel: prices.valorHotel, valorHUB: prices.valorHUB,
      comissaoRecepcao: prices.comissaoRecepcao, modoPagamento, pagoParaQuem, observacoes, status: "Solicitado",
    });
    clearForm();
  };

  const handleClear = () => { clearForm(); onClear(); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); document.querySelector("form")?.requestSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const setToday = () => setData(formatDateForInput(new Date()));
  const setTomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); setData(formatDateForInput(d)); };
  const handlePeopleSelect = (n: number) => {
    if (n === 8) { const v = window.prompt("Quantas pessoas?", "8"); if (v) { const p = parseInt(v); if (!isNaN(p) && p > 0) setNumeroPessoas(p); } return; }
    setNumeroPessoas(n);
  };
  const handleBaggageSelect = (n: number) => {
    if (n === 6) { const v = window.prompt("Quantas bagagens?", "6"); if (v) { const p = parseInt(v); if (!isNaN(p) && p >= 0) setNumeroBagagens(p); } return; }
    setNumeroBagagens(n);
  };
  const toggleObs = (value: string) => {
    if (observacoes.includes(value)) setObservacoes(observacoes.replace(value, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim());
    else setObservacoes(observacoes ? `${observacoes}, ${value}` : value);
  };

  // Styles
  const chip = (active: boolean) =>
    `px-3 py-1.5 text-sm font-bold rounded-full transition-all cursor-pointer hover:scale-[1.03] ${
      active ? "bg-[#F0D030] text-[#0A0A0A] shadow-[0_0_8px_rgba(240,208,48,0.2)]" : "bg-[#111] border border-[#2A2A2A] text-[#888] hover:border-[#F0D030]/30 hover:text-[#A0A0A0]"
    }`;
  const chipLg = (active: boolean) =>
    `px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer hover:scale-[1.02] ${
      active ? "bg-[#F0D030] text-[#0A0A0A] shadow-[0_0_8px_rgba(240,208,48,0.2)]" : "bg-[#111] border border-[#2A2A2A] text-[#888] hover:border-[#F0D030]/30"
    }`;
  const inp = "w-full h-11 bg-[#111] border border-[#2A2A2A] rounded-lg px-4 text-[15px] text-[#F5F5F5] placeholder-[#555] focus:outline-none focus:border-[#F0D030] focus:shadow-[0_0_0_2px_rgba(240,208,48,0.1)] transition-all";
  const lbl = "flex items-center gap-1.5 text-[#A0A0A0] text-sm font-semibold mb-1.5 uppercase tracking-wider";
  const iconCls = "w-4 h-4 text-[#F0D030]";

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-[#F5F5F5] mb-4">
        {editingTransfer ? "Editar Transfer" : "Novo Transfer"}
      </h2>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 md:p-6 space-y-4">
        {/* L1: Nome + Referência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><User className={iconCls} /> Nome do Cliente <span className="text-[#C06060]">*</span></label>
            <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} className={inp} placeholder="Nome completo" required />
          </div>
          <div>
            <label className={lbl}><FileText className={iconCls} /> Referência</label>
            <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} className={inp} placeholder="Booking.com, Expedia..." />
          </div>
        </div>

        {/* L2: Tipo de Serviço + Bagagens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Car className={iconCls} /> Tipo de Serviço</label>
            <div className="flex gap-1.5">
              {["Transfer", "Tour Regular", "Private Tour"].map((type) => (
                <button key={type} type="button" onClick={() => { setTipoServico(type); setTourSelecionado(""); }} className={chipLg(tipoServico === type)}>{type}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}><Briefcase className={iconCls} /> Bagagens</label>
            <div className="flex flex-wrap gap-1">
              {[0,1,2,3,4,5,6].map((n) => (
                <button key={n} type="button" onClick={() => handleBaggageSelect(n)} className={chip(n < 6 ? numeroBagagens === n : numeroBagagens >= 6)}>{n === 6 ? "6+" : n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Tour selector (conditional) */}
        {isTour && (
          <div>
            <label className={lbl}><Navigation className={iconCls} /> Selecionar Tour</label>
            <select value={tourSelecionado} onChange={(e) => setTourSelecionado(e.target.value)} className={inp}>
              <option value="">-- Selecione --</option>
              {tourOptions.map(([key, tour]) => <option key={key} value={key}>{tour.name}</option>)}
            </select>
            {tourSelecionado && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#888]">
                <span>€{tourUnitPrice.toFixed(0)} × {numeroPessoas} pax = <span className="text-[#F0D030] font-bold">€{valorTotal.toFixed(0)}</span></span>
                {isAdminMode && <><span className="text-[#2A2A2A]">|</span><span>Hotel: <span className="text-[#FFA726]">€{adminPrices.valorHotel.toFixed(0)}</span></span><span>HUB: <span className="text-[#7EAA6E]">€{adminPrices.valorHUB.toFixed(0)}</span></span></>}
              </div>
            )}
          </div>
        )}

        {/* L3: Pessoas + Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Users className={iconCls} /> Pessoas <span className="text-[#C06060]">*</span></label>
            <div className="flex flex-wrap gap-1">
              {[1,2,3,4,5,6,7,8].map((n) => (
                <button key={n} type="button" onClick={() => handlePeopleSelect(n)} className={chip(n < 8 ? numeroPessoas === n : numeroPessoas >= 8)}>{n === 8 ? "8+" : n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}><Calendar className={iconCls} /> Data <span className="text-[#C06060]">*</span></label>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={setToday} className={chip(data === formatDateForInput(new Date()))}>Hoje</button>
              <button type="button" onClick={setTomorrow} className={chip((() => { const d = new Date(); d.setDate(d.getDate() + 1); return data === formatDateForInput(d); })())}>Amanhã</button>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${inp} max-w-[180px]`} required />
            </div>
          </div>
        </div>

        {/* L4: Hora Pick-up (full width) */}
        <div>
          <label className={lbl}><Clock className={iconCls} /> Hora Pick-up <span className="text-[#C06060]">*</span></label>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1 flex-1">
              {TIME_SLOTS.map((time) => (
                <button key={time} type="button" onClick={() => setHoraPickup(time)}
                  className={`px-3 py-1.5 text-sm font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    horaPickup === time ? "bg-[#F0D030] text-[#0A0A0A]" : "bg-[#0A0A0A] text-[#555] hover:text-[#A0A0A0] hover:bg-[#1A1A1A]"
                  }`}>{time}</button>
              ))}
            </div>
            <input type="time" value={horaPickup} onChange={(e) => setHoraPickup(e.target.value)} className={`${inp} max-w-[130px]`} required />
          </div>
        </div>

        {/* Contacto + Voo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Phone className={iconCls} /> Contacto <span className="text-[#C06060]">*</span></label>
            <PhoneInput value={contacto} onChange={setContacto} defaultCountry="PT" />
          </div>
          <div>
            <label className={lbl}><Plane className={iconCls} /> Número do Voo</label>
            <input type="text" value={numeroVoo} onChange={(e) => setNumeroVoo(e.target.value)} className={inp} placeholder="TP1234" />
          </div>
        </div>

        {/* Origem + Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><MapPin className={iconCls} /> Origem <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1 mb-1.5">
              <button type="button" onClick={() => setOrigem("Aeroporto de Lisboa")} className={chip(origem === "Aeroporto de Lisboa")}>Aeroporto</button>
              <button type="button" onClick={() => setOrigem("Hotel Principal")} className={chip(origem === "Hotel Principal")}>Hotel</button>
            </div>
            <input type="text" value={origem} onChange={(e) => setOrigem(e.target.value)} className={inp} placeholder="Outro local..." required />
          </div>
          <div>
            <label className={lbl}><Navigation className={iconCls} /> Destino <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1 mb-1.5">
              <button type="button" onClick={() => setDestino("Hotel Principal")} className={chip(destino === "Hotel Principal")}>Hotel</button>
              <button type="button" onClick={() => setDestino("Aeroporto de Lisboa")} className={chip(destino === "Aeroporto de Lisboa")}>Aeroporto</button>
            </div>
            <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} className={inp} placeholder="Outro local..." required />
          </div>
        </div>

        {/* Valor + Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><DollarSign className={iconCls} /> Valor € <span className="text-[#C06060]">*</span></label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {QUICK_PRICES.map((p) => <button key={p} type="button" onClick={() => setValorTotal(p)} className={chip(valorTotal === p)}>€{p}</button>)}
            </div>
            <input type="number" min={0} step={0.01} value={valorTotal || ""} onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)} className={inp} placeholder="Valor em euros" required />
            {isAdminMode && valorTotal > 0 && !isTour && (
              <div className="mt-1 flex gap-2 text-[10px] font-mono text-[#555]">
                <span>Hotel: <span className="text-[#FFA726]">€{adminPrices.valorHotel.toFixed(0)}</span></span>
                <span>HUB: <span className="text-[#7EAA6E]">€{adminPrices.valorHUB.toFixed(0)}</span></span>
              </div>
            )}
          </div>
          <div>
            <label className={lbl}><CreditCard className={iconCls} /> Pagamento <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5">
              {[{l:"Dinheiro",v:"Dinheiro"},{l:"Cartão",v:"Cartao"},{l:"Transf.",v:"Transferencia"}].map(({l,v}) => (
                <button key={v} type="button" onClick={() => setModoPagamento(v)} className={chipLg(modoPagamento === v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Pago Para + Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><User className={iconCls} /> Pago Para <span className="text-[#C06060]">*</span></label>
            <div className="flex gap-1.5">
              {[{l:"Recepção",v:"Recepcao"},{l:"Motorista",v:"Motorista"}].map(({l,v}) => (
                <button key={v} type="button" onClick={() => setPagoParaQuem(v)} className={chipLg(pagoParaQuem === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}><MessageSquare className={iconCls} /> Observações</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {QUICK_OBS.map(({label: l, value: v, icon: Icon}) => (
                <button key={v} type="button" onClick={() => toggleObs(v)}
                  className={`flex items-center gap-1 ${chip(observacoes.includes(v))}`}>
                  <Icon className="w-3 h-3" />{l}
                </button>
              ))}
            </div>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              className={`${inp} min-h-[60px] h-auto resize-y py-3`} placeholder="Notas adicionais..." rows={2} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={isLoading} title="Ctrl+Enter"
          className="flex-1 h-12 bg-[#F0D030] text-[#0A0A0A] font-bold text-base rounded-lg hover:bg-[#D4B828] hover:shadow-[0_0_16px_rgba(240,208,48,0.2)] disabled:opacity-50 transition-all cursor-pointer uppercase tracking-wider">
          {isLoading ? "A Guardar..." : editingTransfer ? "Actualizar Transfer" : "Registar Transfer"}
        </button>
        <button type="button" onClick={handleClear}
          className="h-12 px-6 bg-[#111] border border-[#2A2A2A] text-[#888] text-base rounded-lg hover:text-[#F5F5F5] transition-all cursor-pointer">
          Limpar
        </button>
      </div>
    </form>
  );
}
