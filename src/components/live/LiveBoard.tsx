"use client";

// Quadro LIVE partilhado (portal hotel + /admin/live).
// Autenticação: lê a sessão existente para saber o `codigo`; a senha é pedida
// UMA vez por separador (sessionStorage) e validada no próprio feed liveHotel.
// A auth existente (hub_session) nunca é alterada aqui — só lida.

import { useState, useCallback, useEffect } from "react";
import { getLiveCred, setLiveCred, clearLiveCred, fetchLivePing, splitDia } from "@/lib/live";
import { useLiveHotel } from "@/hooks/useLiveHotel";
import LiveTripCard from "./LiveTripCard";

interface LiveBoardProps {
  /** Identificador enviado como &codigo= (código do hotel, TEST, ou nome do admin) */
  codigo: string;
  /** Nome mostrado no pedido de desbloqueio */
  nomeExib: string;
  /** Conteúdo mostrado enquanto o LIVE não tem dados (ex.: lista antiga) */
  fallback?: React.ReactNode;
}

export default function LiveBoard({ codigo, nomeExib, fallback }: LiveBoardProps) {
  const [senha, setSenha] = useState<string | null>(() => getLiveCred(codigo));
  const [pwdInput, setPwdInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showAmanha, setShowAmanha] = useState(false);

  const live = useLiveHotel(codigo, senha);

  const doUnlock = useCallback(async () => {
    const pwd = pwdInput.trim();
    if (!pwd) { setUnlockError("Insira a senha."); return; }
    setUnlocking(true);
    setUnlockError("");
    try {
      const ping = await fetchLivePing(codigo, pwd);
      if (ping.ok) {
        setLiveCred(codigo, pwd);
        setSenha(pwd);
        setPwdInput("");
      } else {
        setUnlockError("Senha incorrecta ou Live indisponível.");
      }
    } catch {
      setUnlockError("Erro de conexão. Tente novamente.");
    }
    setUnlocking(false);
  }, [codigo, pwdInput]);

  // Credencial recusada durante o polling → limpar e voltar ao desbloqueio
  useEffect(() => {
    if (senha && live.status === "unauthorized") {
      clearLiveCred();
      setSenha(null);
      setUnlockError("Sessão LIVE expirada — insira a senha novamente.");
    }
  }, [senha, live.status]);

  // ── Sem credencial: pedido de desbloqueio (uma vez por separador) ──
  if (!senha) {
    return (
      <div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-5 py-5 max-w-md mx-auto text-center">
          <p className="text-sm text-white font-bold mb-1">🔴 Activar acompanhamento LIVE</p>
          <p className="text-[11px] text-[#888] font-mono mb-3">Confirme a senha de <span className="text-[#D4A017]">{nomeExib}</span> para ver os transfers em directo.</p>
          <div className="flex gap-2 justify-center">
            <input
              type="password"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void doUnlock(); }}
              placeholder="Senha"
              autoComplete="current-password"
              className="h-9 w-40 bg-[#111] border border-[#2A2A2A] rounded px-3 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#D4A017]"
            />
            <button onClick={() => void doUnlock()} disabled={unlocking}
              className="h-9 px-4 bg-[#D4A017] text-black text-sm font-bold rounded cursor-pointer hover:bg-[#F0D030] transition-colors disabled:opacity-50">
              {unlocking ? "..." : "Entrar"}
            </button>
          </div>
          {unlockError && <p className="text-[11px] text-red-400 font-mono mt-2">{unlockError}</p>}
        </div>
        {fallback}
      </div>
    );
  }

  // ── Erro sem dados: fallback gracioso, sem partir o resto da página ──
  if (live.status === "error" && live.viagens.length === 0) {
    return (
      <div>
        <p className="text-[#888] text-sm font-mono text-center py-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">Live indisponível</p>
        {fallback}
      </div>
    );
  }

  if (live.status === "loading" || live.status === "idle") {
    return (
      <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-28 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
    );
  }

  const { hoje, amanha } = splitDia(live.viagens);

  return (
    <div>
      {/* Cabeçalho da secção */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#D4A017] uppercase tracking-wider text-xs font-bold font-mono">🚗 Transfers em directo — {hoje.length}</h3>
        <span className="text-[9px] text-[#666] font-mono flex items-center gap-1.5">
          {live.status === "error" && <span title="Erro no último sync — a mostrar últimos dados">⚠️</span>}
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {live.syncedAt}
        </span>
      </div>

      {/* HOJE */}
      {hoje.length === 0 ? (
        <p className="text-[#666] text-sm font-mono text-center py-6">Nenhum transfer para hoje</p>
      ) : (
        <div className="space-y-2">
          {hoje.map((v, i) => <LiveTripCard key={`${v.cliente}|${v.hora}|${i}`} viagem={v} />)}
        </div>
      )}

      {/* AMANHÃ — colapsado */}
      {amanha.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowAmanha((s) => !s)}
            className="w-full text-left text-[11px] font-mono font-bold text-[#888] hover:text-[#D0D0D0] bg-[#111] border border-[#2A2A2A] rounded-lg px-4 py-2.5 cursor-pointer transition-colors">
            <span className="inline-block transition-transform duration-300" style={{ transform: showAmanha ? "rotate(90deg)" : "rotate(0)" }}>▸</span>
            {" "}Amanhã — {amanha.length} transfer{amanha.length > 1 ? "s" : ""}
          </button>
          {showAmanha && (
            <div className="space-y-2 mt-2">
              {amanha.map((v, i) => <LiveTripCard key={`${v.cliente}|${v.hora}|${i}`} viagem={v} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
