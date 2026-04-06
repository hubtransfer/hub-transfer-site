"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { HUB_CENTRAL_URL } from "@/lib/trips";
import { getSession, clearSession as clearMainSession } from "@/lib/auth";
import AddressAutocomplete from "@/components/shared/AddressAutocomplete";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";

// ─── Types ───

interface RestauranteSession {
  restauranteId: string | number;
  nome: string;
  endereco: string;
  comissao: number;
  comissaoFixa: number;
}

interface Reserva {
  id: string;
  cliente: string;
  telefone: string;
  idioma: string;
  data: string;
  hora: string;
  pessoas: string | number;
  status: string;
  origem: string;
  hotel: string;
  valorConta: string | number;
  comissao: string | number;
  observacoes: string;
}

interface RelatorioResumo {
  totalEnviados: number;
  comissaoTotalHub: number;
  totalIndicados: number;
  comissaoTotalRestaurante: number;
  saldo: number;
}

interface RelatorioItem {
  id: string;
  cliente: string;
  data: string;
  valorConta: number;
  comissao: number;
}

interface AutocompleteRestaurant {
  id: string | number;
  nome: string;
  endereco: string;
}

// ─── Constants ───

const HOTEIS = [
  "Empire Lisbon Hotel",
  "Empire Marques Hotel",
  "Gota d'Água",
  "Teste Sistema Validado",
];

const IDIOMAS = ["PT", "EN", "ES", "FR", "IT"];

const SESSION_KEY = "hub_restaurante_session";

type TabKey = "reservas" | "transfer" | "comissoes";

// ─── Status badges ───

function statusBadge(status: string): { bg: string; text: string; label: string } {
  const s = (status || "").toUpperCase();
  if (s === "CONFIRMADA") return { bg: "bg-[#22C55E]/15", text: "text-[#22C55E]", label: "CONFIRMADA" };
  if (s === "RECUSADA") return { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]", label: "RECUSADA" };
  if (s === "CONCLUIDA") return { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", label: "CONCLUÍDA" };
  if (s === "CANCELADA") return { bg: "bg-[#6B7280]/15", text: "text-[#6B7280]", label: "CANCELADA" };
  if (s.includes("PENDENTE_HUB")) return { bg: "bg-[#F97316]/15", text: "text-[#F97316]", label: "PENDENTE HUB" };
  return { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", label: "PENDENTE" };
}

// ─── Session helpers ───

function loadSession(): RestauranteSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(s: RestauranteSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* */ }
}

function clearRestSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* */ }
}

// ════════════════════════════════════════════════════════════════
//  PAGE
// ════════════════════════════════════════════════════════════════

export default function RestaurantePage() {
  const router = useRouter();
  const [session, setSessionState] = useState<RestauranteSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check main auth session first (unified login)
    const mainSession = getSession();
    if (!mainSession || mainSession.role !== "restaurante") {
      router.replace("/login");
      return;
    }
    // Load restaurant-specific data
    const restData = loadSession();
    if (restData) {
      setSessionState(restData);
      setCheckingSession(false);
    } else {
      // Main session exists but no restaurant data — redirect to re-login
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    clearRestSession();
    clearMainSession();
    router.replace("/login");
  }, [router]);

  if (checkingSession || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
      </div>
    );
  }

  return <Dashboard session={session} onLogout={handleLogout} />;
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════

function Dashboard({ session, onLogout }: { session: RestauranteSession; onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>("reservas");
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const TABS: { key: TabKey; icon: string; label: string }[] = [
    { key: "reservas", icon: "📋", label: "Reservas" },
    { key: "transfer", icon: "🚗", label: "Novo Transfer" },
    { key: "comissoes", icon: "💰", label: "Comissões" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#111827] border-b border-[#D4A017]/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/images/logo.png" alt="HUB" className="h-7 opacity-70 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{session.nome}</p>
            <p className="text-[10px] text-[#888] font-mono truncate">{session.endereco}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setChangePwdOpen(true)} title="Alterar senha" className="text-[#888] hover:text-[#D4A017] transition-colors">⚙️</button>
          <button onClick={onLogout} className="text-xs text-[#888] hover:text-[#D4A017] font-mono transition-colors">Sair</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-zinc-800 bg-[#111827]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-xs font-mono font-bold transition-colors ${
              tab === t.key
                ? "text-[#D4A017] border-b-2 border-[#D4A017]"
                : "text-[#888] hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="pb-8">
        {tab === "reservas" && <ReservasTab session={session} />}
        {tab === "transfer" && <TransferTab session={session} />}
        {tab === "comissoes" && <ComissoesTab session={session} />}
      </main>

      <ChangePasswordModal isOpen={changePwdOpen} onClose={() => setChangePwdOpen(false)} tipo="restaurante" userId={String(session.restauranteId)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  RESERVAS TAB
// ════════════════════════════════════════════════════════════════

function ReservasTab({ session }: { session: RestauranteSession }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  // Lançar conta modal
  const [contaModal, setContaModal] = useState<Reserva | null>(null);
  const [contaValor, setContaValor] = useState("");
  const [contaLoading, setContaLoading] = useState(false);
  const [contaResult, setContaResult] = useState("");
  const [contaError, setContaError] = useState("");

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const params = new URLSearchParams({
        action: "getViagensRestaurante",
        restauranteId: String(session.restauranteId),
        mes: String(now.getMonth() + 1),
        ano: String(now.getFullYear()),
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success && Array.isArray(data.reservas)) {
        setReservas(data.reservas);
      }
    } catch (err) {
      console.error("[ReservasTab] error:", err);
    } finally {
      setLoading(false);
    }
  }, [session.restauranteId]);

  useEffect(() => { fetchReservas(); }, [fetchReservas]);

  const handleLancarConta = useCallback(async () => {
    if (!contaModal || !contaValor) return;
    setContaLoading(true);
    setContaError("");
    setContaResult("");
    try {
      const params = new URLSearchParams({
        action: "registarValorConta",
        id: String(contaModal.id),
        valor: contaValor,
        restauranteId: String(session.restauranteId),
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success) {
        setContaResult(`Comissão HUB: €${Number(data.comissaoValor || 0).toFixed(2)} (${data.comissaoPercent || session.comissao}%)`);
        fetchReservas();
      } else {
        setContaError(data?.message || "Erro ao registar");
      }
    } catch {
      setContaError("Erro de conexão");
    } finally {
      setContaLoading(false);
    }
  }, [contaModal, contaValor, session.restauranteId, session.comissao, fetchReservas]);

  const closeConta = useCallback(() => {
    setContaModal(null);
    setContaValor("");
    setContaResult("");
    setContaError("");
  }, []);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">📋 Reservas do mês</h2>
        <button onClick={fetchReservas} className="text-xs text-[#D4A017] font-mono hover:text-[#b8860b]">↻ Actualizar</button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin inline-block" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">🍽️</div>
          <p className="text-[#888] text-sm font-mono">Nenhuma reserva este mês</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservas.map((r) => {
            const badge = statusBadge(r.status);
            const isConfirmada = (r.status || "").toUpperCase() === "CONFIRMADA";
            const isConcluida = (r.status || "").toUpperCase() === "CONCLUIDA";
            const temConta = r.valorConta && Number(r.valorConta) > 0;
            return (
              <div key={r.id} className="bg-[#111827] border border-zinc-800 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-[#888]">{r.id}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1 truncate">{r.cliente}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm text-[#D4A017] font-bold">{r.hora}</p>
                    <p className="font-mono text-[10px] text-[#888]">{r.data}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#888] font-mono">
                  <span>👥 {r.pessoas} pax</span>
                  <span className="truncate">📍 {r.origem || r.hotel || "—"}</span>
                </div>
                {isConcluida && temConta && (
                  <div className="text-xs font-mono text-[#3B82F6]">💰 Conta: €{Number(r.valorConta).toFixed(2)} · Comissão: €{Number(r.comissao).toFixed(2)}</div>
                )}
                {isConfirmada && !temConta && (
                  <button
                    onClick={() => setContaModal(r)}
                    className="bg-[#D4A017]/15 text-[#D4A017] text-xs font-mono font-bold px-3 py-1.5 rounded hover:bg-[#D4A017]/25 transition-colors"
                  >
                    💰 Lançar conta
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Conta modal */}
      {contaModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85" onClick={closeConta}>
          <div className="bg-[#111827] border border-[#D4A017]/30 rounded-xl w-full max-w-xs p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white">💰 Valor da conta</h3>
            <p className="text-xs text-[#888] font-mono">{contaModal.cliente} — {contaModal.data}</p>

            {!contaResult ? (
              <>
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Valor total (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={contaValor}
                    onChange={(e) => setContaValor(e.target.value)}
                    disabled={contaLoading}
                    className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none font-mono"
                    placeholder="85.50"
                    autoFocus
                  />
                </div>
                {contaError && <p className="text-xs text-[#EF4444] font-mono">{contaError}</p>}
                <div className="flex gap-2">
                  <button onClick={closeConta} disabled={contaLoading} className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded text-xs font-mono">Cancelar</button>
                  <button onClick={handleLancarConta} disabled={contaLoading || !contaValor} className="flex-1 bg-[#D4A017] text-black py-2 rounded text-xs font-mono font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                    {contaLoading ? <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Registar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#064e3b] border border-[#22C55E]/30 rounded px-3 py-3 text-xs font-mono text-[#22C55E]">
                  ✅ {contaResult}
                </div>
                <button onClick={closeConta} className="w-full bg-[#D4A017] text-black py-2 rounded text-xs font-mono font-bold">Fechar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TRANSFER TAB (restaurant creates a booking)
// ════════════════════════════════════════════════════════════════

function TransferTab({ session }: { session: RestauranteSession }) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [idioma, setIdioma] = useState("PT");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [destinoEditado, setDestinoEditado] = useState(false);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [pessoas, setPessoas] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [restaurantes, setRestaurantes] = useState<AutocompleteRestaurant[]>([]);

  // Fetch restaurantes for autocomplete
  useEffect(() => {
    fetch(`${HUB_CENTRAL_URL}?action=getRestaurantes&t=${Date.now()}`, { redirect: "follow" })
      .then((r) => r.json())
      .then((d) => { if (d?.success && Array.isArray(d.restaurantes)) setRestaurantes(d.restaurantes); })
      .catch(() => {});
  }, []);

  const defaultDestino = `${session.nome}${session.endereco ? ", " + session.endereco : ""}`;

  // Auto-fill destino with restaurant address on mount
  useEffect(() => {
    if (!destinoEditado) setDestino(defaultDestino);
  }, [defaultDestino, destinoEditado]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cliente.trim() || !telefone.trim() || !origem.trim() || !data || !hora) {
      setError("Preenche todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    try {
      const dataFmt = data.split("-").reverse().join("/");
      const hotelParam = HOTEIS.includes(origem) ? origem : "";
      const params = new URLSearchParams({
        action: "criarReservaRestaurante",
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        idioma,
        restauranteId: String(session.restauranteId),
        data: dataFmt,
        hora,
        pessoas: String(pessoas),
        origem: origem.trim(),
        destino: destino.trim() || defaultDestino,
        hotel: hotelParam,
        fonte: "RESTAURANTE",
        observacoes: "",
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const json = await res.json();
      if (json?.success) {
        setSuccessMsg(`Pedido enviado! Pickup: ${json.horaPickup || hora}`);
        setCliente("");
        setTelefone("");
        setOrigem("");
        setDestinoEditado(false);
        setData("");
        setHora("");
        setPessoas(2);
      } else {
        setError(json?.message || json?.error || "Erro ao criar pedido");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  }, [cliente, telefone, idioma, origem, data, hora, pessoas, destino, session.restauranteId]);

  return (
    <div className="px-4 py-4 max-w-md mx-auto space-y-4">
      <h2 className="text-base font-bold">🚗 Pedir Transfer</h2>

      {/* Info banner */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-3 py-2 text-xs text-[#F59E0B] font-mono">
        ⏳ Pedidos ficam pendentes até confirmação do HUB
      </div>

      {successMsg && (
        <div className="bg-[#064e3b] border border-[#22C55E]/30 rounded-lg px-3 py-3 text-xs font-mono text-[#22C55E]">
          ✅ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Cliente *</label>
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} required disabled={submitting}
            className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none" placeholder="Nome do cliente" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Telefone *</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required disabled={submitting}
              className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none font-mono" placeholder="+351 ..." />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Idioma</label>
            <select value={idioma} onChange={(e) => setIdioma(e.target.value)} disabled={submitting}
              className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono">
              {IDIOMAS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Origem — autocomplete com Google Places */}
        <AddressAutocomplete
          label="Origem (Recolha) *"
          value={origem}
          onChange={(v) => { setOrigem(v); setSuccessMsg(""); }}
          placeholder="Onde buscar o cliente? (hotel, morada, local...)"
          required
          disabled={submitting}
          hotels={HOTEIS}
          restaurantes={restaurantes}
        />

        {/* Destino — editável, pré-preenchido com restaurante */}
        <AddressAutocomplete
          label="Destino"
          value={destino}
          onChange={(v) => { setDestino(v); setDestinoEditado(true); }}
          placeholder={defaultDestino}
          disabled={submitting}
          hotels={HOTEIS}
          restaurantes={restaurantes}
          faded={!destinoEditado && !!destino}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Data *</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required disabled={submitting}
              className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono" />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Hora *</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required disabled={submitting}
              className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono" />
          </div>
        </div>

        <div className="w-24">
          <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Pax</label>
          <input type="number" min={1} max={20} value={pessoas} onChange={(e) => setPessoas(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} disabled={submitting}
            className="w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-[#D4A017] focus:outline-none font-mono text-center" />
        </div>

        {error && (
          <div className="bg-[#7f1d1d] border border-[#EF4444]/40 text-[#fecaca] px-3 py-2 rounded text-xs font-mono">
            ❌ {error}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> A enviar...</>
          ) : (
            "🚗 Pedir Transfer"
          )}
        </button>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  COMISSÕES TAB
// ════════════════════════════════════════════════════════════════

function ComissoesTab({ session }: { session: RestauranteSession }) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null);
  const [enviadosHub, setEnviadosHub] = useState<RelatorioItem[]>([]);
  const [enviadosRest, setEnviadosRest] = useState<RelatorioItem[]>([]);

  const fetchRelatorio = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "getRelatorioComissoes",
        restauranteId: String(session.restauranteId),
        mes: String(mes),
        ano: String(ano),
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success) {
        setEnviadosHub(Array.isArray(data.enviadosPeloHUB) ? data.enviadosPeloHUB : []);
        setEnviadosRest(Array.isArray(data.enviadosPeloRestaurante) ? data.enviadosPeloRestaurante : []);
        setResumo(data.resumo || null);
      }
    } catch (err) {
      console.error("[ComissoesTab] error:", err);
    } finally {
      setLoading(false);
    }
  }, [session.restauranteId, mes, ano]);

  useEffect(() => { fetchRelatorio(); }, [fetchRelatorio]);

  const prevDataRef = useRef({ mes, ano });
  useEffect(() => {
    if (prevDataRef.current.mes !== mes || prevDataRef.current.ano !== ano) {
      prevDataRef.current = { mes, ano };
      fetchRelatorio();
    }
  }, [mes, ano, fetchRelatorio]);

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold">💰 Comissões</h2>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
            className="bg-[#16213e] border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-[#D4A017] focus:outline-none font-mono">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
            className="bg-[#16213e] border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-[#D4A017] focus:outline-none font-mono">
            {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin inline-block" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#111827] border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#888] uppercase tracking-wider font-mono mb-1">Clientes via HUB</p>
              <p className="text-lg font-bold text-[#D4A017] font-mono">{resumo?.totalEnviados ?? enviadosHub.length}</p>
              <p className="text-[10px] text-[#888] font-mono">Comissão: €{(resumo?.comissaoTotalHub ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-[#111827] border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#888] uppercase tracking-wider font-mono mb-1">Clientes indicados</p>
              <p className="text-lg font-bold text-[#22C55E] font-mono">{resumo?.totalIndicados ?? enviadosRest.length}</p>
              <p className="text-[10px] text-[#888] font-mono">Ganho: €{(resumo?.comissaoTotalRestaurante ?? enviadosRest.length * session.comissaoFixa).toFixed(2)}</p>
            </div>
            <div className="bg-[#111827] border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#888] uppercase tracking-wider font-mono mb-1">Saldo</p>
              {(() => {
                const saldo = resumo?.saldo ?? ((resumo?.comissaoTotalRestaurante ?? 0) - (resumo?.comissaoTotalHub ?? 0));
                const isPositive = saldo >= 0;
                return (
                  <>
                    <p className={`text-lg font-bold font-mono ${isPositive ? "text-[#22C55E]" : "text-[#D4A017]"}`}>
                      €{Math.abs(saldo).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[#888] font-mono">{isPositive ? "HUB deve" : "Restaurante deve"}</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Detail tables */}
          {enviadosHub.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#D4A017] uppercase tracking-wider font-mono mb-2">📥 Clientes que o HUB trouxe</h3>
              <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[#888] border-b border-zinc-800">
                      <th className="px-3 py-2 font-mono">Cliente</th>
                      <th className="px-3 py-2 font-mono">Data</th>
                      <th className="px-3 py-2 font-mono text-right">Conta</th>
                      <th className="px-3 py-2 font-mono text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enviadosHub.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-900 last:border-0">
                        <td className="px-3 py-2 text-white">{item.cliente}</td>
                        <td className="px-3 py-2 text-[#888] font-mono">{item.data}</td>
                        <td className="px-3 py-2 text-right font-mono text-white">€{Number(item.valorConta || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#D4A017]">€{Number(item.comissao || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {enviadosRest.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#22C55E] uppercase tracking-wider font-mono mb-2">📤 Clientes que indicou ao HUB</h3>
              <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[#888] border-b border-zinc-800">
                      <th className="px-3 py-2 font-mono">Cliente</th>
                      <th className="px-3 py-2 font-mono">Data</th>
                      <th className="px-3 py-2 font-mono text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enviadosRest.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-900 last:border-0">
                        <td className="px-3 py-2 text-white">{item.cliente}</td>
                        <td className="px-3 py-2 text-[#888] font-mono">{item.data}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#22C55E]">€{Number(item.comissao || session.comissaoFixa).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {enviadosHub.length === 0 && enviadosRest.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[#888] text-sm font-mono">Sem movimentos neste mês</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
