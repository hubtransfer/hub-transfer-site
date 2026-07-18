"use client";

// /admin/live — vista TOTAL do acompanhamento em directo (só admins).
// Usa a mesma sessão de login do admin (lida, nunca alterada) e o mesmo
// LiveBoard do portal; o backend devolve TODAS as viagens para admins.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSession, type AuthSession } from "@/lib/auth";
import LiveBoard from "@/components/live/LiveBoard";

export default function AdminLivePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "admin") {
      router.replace("/login");
      return;
    }
    setSession(s);
    setAuthChecked(true);
  }, [router]);

  if (!authChecked || !session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#2A2A2A]">
        <div className="max-w-[960px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="HUB Transfer" width={180} height={50} className="h-10 w-auto" priority />
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <h1 className="text-lg font-bold text-white">LIVE — Vista Total</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#666] font-mono hidden sm:inline">{session.name}</span>
            <a href="/admin/trips" className="text-[10px] text-[#666] hover:text-[#F5F5F5] font-mono">← Viagens</a>
          </div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-4 py-5">
        <LiveBoard codigo={session.name} nomeExib={session.name} />
      </main>
    </div>
  );
}
