"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HUB_CENTRAL_URL } from "@/lib/trips";
import AddressAutocomplete from "@/components/shared/AddressAutocomplete";

// ─── Types ───

interface Restaurante {
  id: string | number;
  nome: string;
  tipo: string;
  endereco: string;
  telefone: string;
  email: string;
  comissao: string | number;
  horario: string;
  precoMedio: string | number;
  avaliacao: string | number;
  coordenadas: string;
  capacidade: string | number;
  website: string;
}

interface ReservaRestaurante {
  id: string | number;
  cliente: string;
  telefone: string;
  idioma: string;
  restaurante: string;
  restauranteId: string | number;
  data: string;
  hora: string;
  pessoas: string | number;
  hotel: string;
  status: string;
  viagemIda: string;
  viagemVolta: string;
  valorConta: string | number;
  comissao: string | number;
  observacoes: string;
}

const HOTEIS = [
  "Empire Lisbon Hotel",
  "Empire Marques Hotel",
  "Gota d'Água",
  "Teste Sistema Validado",
];

const IDIOMAS = ["PT", "EN", "ES", "FR", "IT"];

// ─── Status styling ───

function statusStyle(status: string): { bg: string; text: string; label: string } {
  const s = (status || "").toUpperCase();
  if (s === "CONFIRMADA") return { bg: "bg-[#22C55E]/15", text: "text-[#22C55E]", label: "CONFIRMADA" };
  if (s === "RECUSADA") return { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]", label: "RECUSADA" };
  if (s === "CONCLUIDA") return { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", label: "CONCLUÍDA" };
  if (s === "CANCELADA") return { bg: "bg-[#6B7280]/15", text: "text-[#6B7280]", label: "CANCELADA" };
  return { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", label: "PENDENTE" };
}

// ─── Component ───

export default function RestaurantsTab() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [reservas, setReservas] = useState<ReservaRestaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }, []);

  const fetchRestaurantes = useCallback(async () => {
    try {
      const res = await fetch(`${HUB_CENTRAL_URL}?action=getRestaurantes&t=${Date.now()}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.restaurantes)) {
        setRestaurantes(data.restaurantes);
      }
    } catch (err) {
      console.error("[RestaurantsTab] getRestaurantes error:", err);
    }
  }, []);

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${HUB_CENTRAL_URL}?action=getReservasRestaurantes&t=${Date.now()}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.reservas)) {
        setReservas(data.reservas);
      } else {
        setReservas([]);
      }
    } catch (err) {
      console.error("[RestaurantsTab] getReservasRestaurantes error:", err);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurantes();
    fetchReservas();
  }, [fetchRestaurantes, fetchReservas]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="px-4 sm:px-6 pb-4 space-y-4">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <h2 className="text-lg font-bold text-white">Restaurantes</h2>
          <span className="text-xs text-zinc-500 font-mono">({reservas.length} reservas)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReservas}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono transition-colors"
            title="Actualizar reservas"
          >
            ↻ Actualizar
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#D4A017]/20 hover:bg-[#D4A017]/30 text-[#D4A017] border border-[#D4A017]/30 px-4 py-1.5 rounded text-xs font-mono font-bold transition-colors"
          >
            ➕ Nova Reserva
          </button>
        </div>
      </div>

      {/* ── Reservas list ── */}
      {loading ? (
        <div className="text-center py-12">
          <span className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin inline-block" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">🍽️</div>
          <p className="text-zinc-500 text-sm font-mono">Nenhuma reserva este mês</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                <th className="px-2 py-2 font-mono">ID</th>
                <th className="px-2 py-2 font-mono">Cliente</th>
                <th className="px-2 py-2 font-mono">Restaurante</th>
                <th className="px-2 py-2 font-mono">Data</th>
                <th className="px-2 py-2 font-mono">Hora</th>
                <th className="px-2 py-2 font-mono text-center">Pax</th>
                <th className="px-2 py-2 font-mono">Hotel</th>
                <th className="px-2 py-2 font-mono">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => {
                const s = statusStyle(r.status);
                return (
                  <tr key={r.id} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                    <td className="px-2 py-2 font-mono text-zinc-400">{r.id}</td>
                    <td className="px-2 py-2 text-white font-medium">{r.cliente}</td>
                    <td className="px-2 py-2 text-zinc-300">{r.restaurante}</td>
                    <td className="px-2 py-2 font-mono text-zinc-400">{r.data}</td>
                    <td className="px-2 py-2 font-mono text-zinc-400">{r.hora}</td>
                    <td className="px-2 py-2 font-mono text-zinc-400 text-center">{r.pessoas}</td>
                    <td className="px-2 py-2 text-zinc-400 truncate max-w-[140px]" title={r.hotel || "Endereço livre"}>{r.hotel || <span className="text-[#666]">— livre —</span>}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#D4A017]/40 text-white px-4 py-3 rounded-lg shadow-2xl z-[100] max-w-md text-xs font-mono whitespace-pre-line">
          {toast}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <NewReservationModal
          restaurantes={restaurantes}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchReservas();
          }}
          onError={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
}

// ─── Modal Component ───

interface ModalProps {
  restaurantes: Restaurante[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

interface ReservationSuccess {
  idReserva: string | number;
  idViagemIda: string | number;
  idViagemVolta: string | number;
  restaurante: string;
  horaPickup: string;
  horaVoltaEstimada: string;
  origem: string;
  destino: string;
}

function NewReservationModal({ restaurantes, onClose, onSuccess }: ModalProps) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [idioma, setIdioma] = useState("PT");
  const [restauranteId, setRestauranteId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("20:00");
  const [pessoas, setPessoas] = useState(2);
  const [observacoes, setObservacoes] = useState("");
  // ─── Origem / Destino (autocomplete) ───
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [destinoEditado, setDestinoEditado] = useState(false);
  // ─── Feedback state ───
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ReservationSuccess | null>(null);

  // Auto-fill destino with restaurant address when restaurant is selected
  const restauranteSeleccionado = restaurantes.find((r) => String(r.id) === restauranteId);
  useEffect(() => {
    if (restauranteSeleccionado && !destinoEditado) {
      const addr = `${restauranteSeleccionado.nome}${restauranteSeleccionado.endereco ? ", " + restauranteSeleccionado.endereco : ""}`;
      setDestino(addr);
    }
    if (!restauranteSeleccionado && !destinoEditado) {
      setDestino("");
    }
  }, [restauranteSeleccionado, destinoEditado]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const origemFinal = origem.trim();
    // Se origem é um hotel parceiro exacto, envia no param hotel (para notificações)
    const hotelFinal = HOTEIS.includes(origemFinal) ? origemFinal : "";

    if (!cliente.trim() || !telefone.trim() || !restauranteId || !data || !hora || !origemFinal) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      // Convert date from YYYY-MM-DD (input type=date) to DD/MM/YYYY (GAS expects PT format)
      const dataFormatada = data.split("-").reverse().join("/");

      const params = new URLSearchParams({
        action: "criarReservaRestaurante",
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        idioma,
        restauranteId,
        data: dataFormatada,
        hora,
        pessoas: String(pessoas),
        origem: origemFinal,
        destino: destino.trim(),
        hotel: hotelFinal,
        fonte: "HUB",
        observacoes: observacoes.trim(),
        t: String(Date.now()),
      });

      const url = `${HUB_CENTRAL_URL}?${params.toString()}`;
      const res = await fetch(url, { redirect: "follow" });
      const json = await res.json();

      if (json?.success) {
        setSuccess({
          idReserva: json.idReserva ?? "",
          idViagemIda: json.idViagemIda ?? "",
          idViagemVolta: json.idViagemVolta ?? "",
          restaurante: json.restaurante ?? "",
          horaPickup: json.horaPickup ?? "",
          horaVoltaEstimada: json.horaVoltaEstimada ?? "",
          origem: json.origem ?? origemFinal,
          destino: json.destino ?? destino.trim(),
        });
      } else {
        const msg = json?.message || json?.error || "Erro desconhecido";
        setError(msg);
      }
    } catch (err) {
      console.error("[NewReservationModal] submit error:", err);
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  }, [cliente, telefone, idioma, restauranteId, data, hora, pessoas, origem, destino, observacoes]);

  const handleCloseSuccess = useCallback(() => {
    onSuccess();
  }, [onSuccess]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] border border-[#D4A017]/30 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#D4A017]/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <h3 className="text-white font-bold text-base">Nova Reserva</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Cliente */}
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Cliente *</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
              disabled={submitting}
              className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Telefone + Idioma */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Telefone *</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                disabled={submitting}
                className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none font-mono"
                placeholder="+351 ..."
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Idioma</label>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                disabled={submitting}
                className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono"
              >
                {IDIOMAS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Restaurante */}
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Restaurante *</label>
            <select
              value={restauranteId}
              onChange={(e) => { setRestauranteId(e.target.value); setDestinoEditado(false); }}
              required
              disabled={submitting || restaurantes.length === 0}
              className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none"
            >
              <option value="">{restaurantes.length === 0 ? "A carregar..." : "Seleccionar..."}</option>
              {restaurantes.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nome}{r.tipo ? ` · ${r.tipo}` : ""}
                </option>
              ))}
            </select>
            {restauranteSeleccionado?.endereco && (
              <p className="text-[10px] text-[#666] mt-1 font-mono truncate" title={restauranteSeleccionado.endereco}>
                📍 {restauranteSeleccionado.endereco}
              </p>
            )}
          </div>

          {/* Origem (Recolha) — autocomplete com hotéis + restaurantes */}
          <AddressAutocomplete
            label="Origem (Recolha) *"
            value={origem}
            onChange={(v) => setOrigem(v)}
            placeholder="Onde buscar o cliente..."
            required
            disabled={submitting}
            hotels={HOTEIS}
            restaurantes={restaurantes}
          />

          {/* Destino — autocomplete, auto-preenchido quando restaurante seleccionado */}
          <div>
            <AddressAutocomplete
              label="Destino"
              value={destino}
              onChange={(v, opt) => { setDestino(v); setDestinoEditado(true); void opt; }}
              placeholder="Endereço de entrega..."
              disabled={submitting}
              hotels={HOTEIS}
              restaurantes={restaurantes}
              faded={!destinoEditado && !!destino}
            />
          </div>

          {/* Data + Hora */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Data *</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                disabled={submitting}
                className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Hora *</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                disabled={submitting}
                className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Pax */}
          <div className="w-24">
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Pax</label>
            <input
              type="number"
              min={1}
              max={20}
              value={pessoas}
              onChange={(e) => setPessoas(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              disabled={submitting}
              className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono text-center"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={submitting}
              rows={2}
              className="w-full bg-[#1a1a2e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none resize-none"
              placeholder="Alergias, pedidos especiais..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#7f1d1d] border border-[#EF4444]/40 text-[#fecaca] px-3 py-2 rounded text-xs font-mono">
              ❌ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded text-sm font-mono transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded text-sm font-mono font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  A criar...
                </>
              ) : (
                <>🍽️ Criar Reserva</>
              )}
            </button>
          </div>
        </form>

        {/* ═══ SUCCESS OVERLAY ═══ */}
        {success && (
          <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col">
            {/* Success header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#22C55E]/30 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-white font-bold text-base">Reserva Criada</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Success body */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              <div className="bg-[#064e3b] border border-[#22C55E]/30 rounded-lg px-4 py-4 space-y-2 text-sm">
                <p className="text-[#22C55E] font-bold text-base">✅ Reserva criada!</p>
                <div className="space-y-1.5 text-white font-mono text-xs">
                  <p>🆔 <span className="text-[#22C55E]">{success.idReserva}</span></p>
                  <p>🍽️ {success.restaurante}</p>
                  <p>🚗 Ida #{success.idViagemIda} — Pickup: <span className="text-[#D4A017]">{success.horaPickup}</span></p>
                  <p>🔄 Volta #{success.idViagemVolta} — Estimada: <span className="text-[#D4A017]">{success.horaVoltaEstimada}</span></p>
                  <p className="pt-1 text-[#9ca3af] break-words">📍 {success.origem} → {success.destino}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSuccess}
                className="w-full bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded text-sm font-mono font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
