"use client";

import { useState, useCallback } from "react";
import { HUB_CENTRAL_URL } from "@/lib/trips";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: "admin" | "motorista" | "hotel" | "restaurante";
}

export default function ForgotPasswordModal({ isOpen, onClose, tipo }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        action: "recuperarSenha",
        email: email.trim(),
        tipo,
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success === false && data?.message) {
        setError(data.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [email, tipo]);

  const handleClose = useCallback(() => {
    setEmail("");
    setSent(false);
    setError("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-[#111827] border border-[#D4A017]/30 rounded-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        {!sent ? (
          <>
            <div>
              <h3 className="text-white font-bold text-base">Recuperar senha</h3>
              <p className="text-xs text-[#888] mt-1">Introduza o seu email para receber instruções de redefinição.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  className="w-full bg-[#16213e] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none"
                  placeholder="email@exemplo.com"
                />
              </div>
              {error && (
                <div className="bg-[#7f1d1d] border border-[#EF4444]/40 text-[#fecaca] px-3 py-2 rounded text-xs font-mono">{error}</div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleClose} disabled={loading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-mono transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> A enviar...</>
                  ) : "Enviar"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-3 py-2">
              <div className="text-3xl">📧</div>
              <h3 className="text-white font-bold text-base">Email enviado</h3>
              <p className="text-xs text-[#888]">
                Se este email estiver registado, receberá instruções para redefinir a senha.
              </p>
            </div>
            <button type="button" onClick={handleClose}
              className="w-full bg-[#D4A017] hover:bg-[#b8860b] text-black py-2.5 rounded-lg text-sm font-bold transition-colors">
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
