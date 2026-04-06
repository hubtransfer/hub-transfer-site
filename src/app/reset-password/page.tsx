"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { HUB_CENTRAL_URL } from "@/lib/trips";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) { setError("Token inválido ou em falta."); return; }
    if (novaSenha.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: "redefinirSenha",
        token,
        novaSenha,
        t: String(Date.now()),
      });
      const res = await fetch(`${HUB_CENTRAL_URL}?${params}`, { redirect: "follow" });
      const data = await res.json();
      if (data?.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data?.message || "Token expirado ou inválido. Peça um novo link.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [token, novaSenha, confirmar, router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔗</div>
          <h1 className="text-white font-bold text-lg">Link inválido</h1>
          <p className="text-[#888] text-sm">Este link de redefinição de senha é inválido ou expirou.</p>
          <a href="/login" className="inline-block bg-[#D4A017] hover:bg-[#b8860b] text-black px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">
            Voltar ao login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 30% at 50% 100%, rgba(240,208,48,0.04) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <a href="/" className="inline-block">
            <Image src="/images/logo.png" alt="HUB Transfer" width={200} height={56} className="h-14 w-auto mx-auto" priority />
          </a>
          <p className="text-sm text-[#888] tracking-[0.2em] uppercase">Redefinir Senha</p>
        </div>

        {success ? (
          <div className="bg-[#064e3b] border border-[#22C55E]/30 rounded-xl p-6 text-center space-y-3">
            <div className="text-3xl">✅</div>
            <h2 className="text-white font-bold">Senha alterada com sucesso</h2>
            <p className="text-xs text-[#888]">A redirecionar para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#F0D030] mb-1.5 tracking-wider uppercase font-mono">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => { setNovaSenha(e.target.value); setError(""); }}
                placeholder="Mínimo 6 caracteres"
                autoFocus
                autoComplete="new-password"
                className="w-full h-12 bg-white/[0.06] border border-[#2A2A2A] rounded-lg px-4 text-[#F5F5F5] text-base placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#F0D030] mb-1.5 tracking-wider uppercase font-mono">Confirmar senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                className="w-full h-12 bg-white/[0.06] border border-[#2A2A2A] rounded-lg px-4 text-[#F5F5F5] text-base placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors"
              />
              {novaSenha && confirmar && novaSenha !== confirmar && (
                <p className="text-[10px] text-[#C06060] mt-1 font-mono">As senhas não coincidem</p>
              )}
            </div>

            {error && (
              <div className="text-center text-sm text-[#C06060] bg-[#C06060]/10 border border-[#C06060]/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 font-bold text-base bg-[#F0D030] text-[#0A0A0A] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D4B828] cursor-pointer">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                  A guardar...
                </span>
              ) : "Redefinir senha"}
            </button>
          </form>
        )}

        <div className="text-center">
          <a href="/login" className="text-xs text-[#666] hover:text-[#B0B0B0] transition-colors font-mono">
            ← Voltar ao login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
