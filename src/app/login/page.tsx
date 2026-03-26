"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ─── Route map: password → destination ─── */
const ROUTES: Record<string, { path: string; role: string }> = {
  elh:          { path: "/portal",       role: "hotel" },
  emh:          { path: "/portal",       role: "hotel" },
  gda:          { path: "/portal",       role: "hotel" },
  hub2026:      { path: "/driver/trips", role: "driver" },
  hubtransfer:  { path: "/admin/trips",  role: "admin" },
};

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmedName = name.trim();
      const trimmedPwd = password.trim().toLowerCase();

      if (!trimmedName) {
        setError("Insira o seu nome.");
        return;
      }
      if (!trimmedPwd) {
        setError("Insira a senha.");
        return;
      }

      const route = ROUTES[trimmedPwd];
      if (!route) {
        setError("Credenciais inválidas.");
        return;
      }

      setLoading(true);

      // Store name for the destination page
      if (route.role === "driver") {
        localStorage.setItem("hub_driver_name", trimmedName);
      } else if (route.role === "hotel") {
        localStorage.setItem("hub_hotel_name", trimmedName);
        localStorage.setItem("hub_hotel_code", trimmedPwd);
      } else if (route.role === "admin") {
        localStorage.setItem("hub_admin_name", trimmedName);
      }

      router.push(route.path);
    },
    [name, password, router],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 transition-colors duration-300">
      {/* Gold vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 100%, rgba(245,197,24,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <a href="/" className="inline-block">
            <Image src="/images/logo.png" alt="HUB Transfer" width={200} height={56} className="h-14 w-auto mx-auto" priority />
          </a>
          <p className="text-sm text-white/30 tracking-[0.2em] uppercase">
            Área Reservada
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className="block text-xs text-white/40 mb-1.5 tracking-wider uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Ex: Empire Lisbon Hotel"
              autoFocus
              autoComplete="name"
              className="w-full h-14 text-lg bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#F0D030]/50 transition-colors"
            />
          </div>

          <div>
            <label
              className="block text-xs text-white/40 mb-1.5 tracking-wider uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Senha de acesso"
              autoComplete="current-password"
              className="w-full h-14 text-lg bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#F0D030]/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-center text-sm text-[#C06060] bg-[#C06060]/10 border border-[#C06060]/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 font-bold text-lg bg-[#F0D030] text-black rounded-xl active:bg-[#F0D030]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
