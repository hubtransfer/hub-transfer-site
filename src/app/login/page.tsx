"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { validateLogin, setSession, getRedirectPath } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmedName = name.trim();
      const trimmedPwd = password.trim();

      if (!trimmedName) { setError("Insira o seu nome."); return; }
      if (!trimmedPwd) { setError("Insira a senha."); return; }

      setLoading(true);
      const result = await validateLogin(trimmedName, trimmedPwd);
      setLoading(false);

      if (result.success && result.session) {
        setSession(result.session);
        router.push(getRedirectPath(result.session.role));
      } else {
        setError(result.message || "Nome ou senha incorrectos");
        setPassword("");
      }
    },
    [name, password, router],
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 30% at 50% 100%, rgba(240,208,48,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <a href="/" className="inline-block">
            <Image src="/images/logo.png" alt="HUB Transfer" width={200} height={56} className="h-14 w-auto mx-auto" priority />
          </a>
          <p className="text-sm text-[#888] tracking-[0.2em] uppercase">
            Área Reservada
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#F0D030] mb-1.5 tracking-wider uppercase font-mono">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ex: Filipe Ventura"
              autoFocus
              autoComplete="name"
              className="w-full h-12 bg-white/[0.06] border border-[#2A2A2A] rounded-lg px-4 text-[#F5F5F5] text-base placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#F0D030] mb-1.5 tracking-wider uppercase font-mono">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Senha de acesso"
              autoComplete="current-password"
              className="w-full h-12 bg-white/[0.06] border border-[#2A2A2A] rounded-lg px-4 text-[#F5F5F5] text-base placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors"
            />
          </div>

          {error && (
            <div className="text-center text-sm text-[#C06060] bg-[#C06060]/10 border border-[#C06060]/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-bold text-base bg-[#F0D030] text-[#0A0A0A] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D4B828] cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                A verificar...
              </span>
            ) : "Entrar"}
          </button>
        </form>

        {/* Back */}
        <div className="text-center">
          <a href="/" className="text-xs text-[#666] hover:text-[#B0B0B0] transition-colors font-mono">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
