"use client";

import { useState, useCallback } from "react";
import { HUB_CENTRAL_URL } from "@/lib/trips";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: "admin" | "motorista" | "hotel" | "restaurante";
  userId: string;
}

export default function ChangePasswordModal({ isOpen, onClose, tipo, userId }: ChangePasswordModalProps) {
  const [senhaActual, setSenhaActual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!senhaActual.trim()) { setError("Introduza a senha actual."); return; }
    if (novaSenha.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "alterarSenha",
        tipo,
        id: userId,
        senhaActual: senhaActual.trim(),
        novaSenha,
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success) {
        setSuccess(true);
      } else {
        setError(data?.message || "Senha actual incorrecta.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, [senhaActual, novaSenha, confirmar, tipo, userId]);

  const handleClose = useCallback(() => {
    setSenhaActual("");
    setNovaSenha("");
    setConfirmar("");
    setError("");
    setSuccess(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-[#111827] border border-[#D4A017]/30 rounded-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        {!success ? (
          <>
            <div>
              <h3 className="text-white font-bold text-base">Alterar senha</h3>
              <p className="text-xs text-[#888] mt-1">Introduza a senha actual e escolha uma nova.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Senha actual</label>
                <input type="password" value={senhaActual} onChange={(e) => setSenhaActual(e.target.value)} required disabled={loading} autoFocus autoComplete="current-password"
                  className="w-full bg-[#16213e] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none" placeholder="Senha actual" />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Nova senha</label>
                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required disabled={loading} autoComplete="new-password"
                  className="w-full bg-[#16213e] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Confirmar</label>
                <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required disabled={loading} autoComplete="new-password"
                  className="w-full bg-[#16213e] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none" placeholder="Repita a nova senha" />
                {novaSenha && confirmar && novaSenha !== confirmar && (
                  <p className="text-[10px] text-[#EF4444] mt-1 font-mono">As senhas não coincidem</p>
                )}
              </div>
              {error && (
                <div className="bg-[#7f1d1d] border border-[#EF4444]/40 text-[#fecaca] px-3 py-2 rounded text-xs font-mono">{error}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleClose} disabled={loading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-mono transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> A guardar...</> : "Guardar"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-2">
            <div className="text-3xl">✅</div>
            <h3 className="text-white font-bold text-base">Senha alterada</h3>
            <p className="text-xs text-[#888]">A sua nova senha já está activa.</p>
            <button type="button" onClick={handleClose}
              className="w-full bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded-lg text-sm font-bold transition-colors">Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
