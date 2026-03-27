"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession, getPartners, updatePassword, type Partner, type Hotel } from "@/lib/auth";

/* ─── Skeleton row ─── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-12 h-5 bg-[#222] rounded" />
      <div className="w-32 h-5 bg-[#222] rounded" />
      <div className="w-24 h-5 bg-[#222] rounded" />
      <div className="flex-1" />
      <div className="w-20 h-5 bg-[#222] rounded" />
    </div>
  );
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const colors =
    s === "ativo" || s === "active" ? "bg-[#7EAA6E]/15 text-[#7EAA6E] border-[#7EAA6E]/30" :
    s === "férias" || s === "vacation" ? "bg-[#F0D030]/15 text-[#F0D030] border-[#F0D030]/30" :
    "bg-[#666]/15 text-[#888] border-[#666]/30";
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colors}`}>
      {status || "—"}
    </span>
  );
}

/* ─── Password cell with inline edit ─── */
function PasswordCell({
  hasPassword,
  rowIndex,
  type,
}: {
  hasPassword?: boolean;
  rowIndex?: string;
  type: "driver" | "hotel";
}) {
  const [editing, setEditing] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [hasPwd, setHasPwd] = useState(hasPassword);

  const save = useCallback(async () => {
    if (newPwd.length < 4) { setToast("Mínimo 4 caracteres"); setTimeout(() => setToast(""), 2000); return; }
    if (!rowIndex) return;
    setSaving(true);
    const res = await updatePassword(type, rowIndex, newPwd);
    setSaving(false);
    if (res.success) {
      setHasPwd(true);
      setEditing(false);
      setNewPwd("");
      setToast("Senha actualizada");
      setTimeout(() => setToast(""), 2000);
    } else {
      setToast(res.message || "Erro");
      setTimeout(() => setToast(""), 3000);
    }
  }, [newPwd, rowIndex, type]);

  if (editing) {
    return (
      <div className="flex items-center gap-2 relative">
        <input
          type="text"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="Nova senha..."
          autoFocus
          className="h-8 w-28 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono"
        />
        <button onClick={save} disabled={saving}
          className="h-8 px-3 bg-[#F0D030] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#D4B828] disabled:opacity-50 cursor-pointer">
          {saving ? "..." : "OK"}
        </button>
        <button onClick={() => { setEditing(false); setNewPwd(""); }}
          className="h-8 px-2 text-[#888] text-xs hover:text-[#F5F5F5] cursor-pointer">✕</button>
        {toast && <span className="absolute -bottom-5 left-0 text-[10px] text-[#F0D030] font-mono">{toast}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 relative">
      {hasPwd ? (
        <span className="text-[#888] text-sm font-mono">•••••</span>
      ) : (
        <span className="text-[#666] text-xs font-mono">Sem senha</span>
      )}
      <button onClick={() => setEditing(true)}
        className="text-[10px] text-[#F0D030] hover:text-[#D4B828] cursor-pointer font-mono">
        {hasPwd ? "Redefinir" : "Definir"}
      </button>
      {toast && <span className="absolute -bottom-5 left-0 text-[10px] text-[#7EAA6E] font-mono">{toast}</span>}
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function PartnersPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Partner[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      router.replace("/login");
    }
  }, [router]);

  // Load data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getPartners();
      setDrivers(data.drivers);
      setHotels(data.hotels);
      setLoading(false);
    })();
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-50 h-12 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <a href="/admin/trips" className="text-[#888] hover:text-[#F5F5F5] text-sm font-mono cursor-pointer">← Viagens</a>
          <span className="text-[#2A2A2A]">|</span>
          <span className="text-sm font-bold text-[#F0D030]">Parceiros</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-[#888] hover:text-[#C06060] font-mono cursor-pointer">Sair</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ═══ MOTORISTAS ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Motoristas</h2>
            <span className="text-xs text-[#888] font-mono">{drivers.length} registos</span>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[60px_1fr_120px_160px_80px_180px] gap-2 px-4 py-2 border-b border-[#2A2A2A] text-[10px] text-[#888] uppercase tracking-wider font-mono">
              <span>ID</span><span>Nome</span><span>Telefone</span><span>Email</span><span>Status</span><span>Senha</span>
            </div>

            {loading ? (
              <div className="space-y-1 p-2">{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-10 text-[#666] text-sm font-mono">Nenhum motorista encontrado</div>
            ) : (
              drivers.map((d, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[60px_1fr_120px_160px_80px_180px] gap-2 px-4 py-3 border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] items-center">
                  <span className="text-[10px] font-mono text-[#888] bg-[#222] px-2 py-0.5 rounded w-fit">{d.id || `M${String(i+1).padStart(3,"0")}`}</span>
                  <span className="font-semibold text-sm text-[#F5F5F5]">{d.name}</span>
                  <span className="text-sm font-mono text-[#B0B0B0]">{d.phone || "—"}</span>
                  <span className="text-xs text-[#888] truncate">{d.email || "—"}</span>
                  <StatusBadge status={d.status} />
                  <PasswordCell hasPassword={d.hasPassword} rowIndex={d.rowIndex} type="driver" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* ═══ HOTÉIS ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Hotéis</h2>
            <span className="text-xs text-[#888] font-mono">{hotels.length} registos</span>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_180px] gap-2 px-4 py-2 border-b border-[#2A2A2A] text-[10px] text-[#888] uppercase tracking-wider font-mono">
              <span>Código</span><span>Nome</span><span>Senha</span>
            </div>

            {loading ? (
              <div className="space-y-1 p-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-10 text-[#666] text-sm font-mono">Nenhum hotel encontrado</div>
            ) : (
              hotels.map((h, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[80px_1fr_180px] gap-2 px-4 py-3 border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] items-center">
                  <span className="text-xs font-mono font-bold text-[#F0D030] bg-[#F0D030]/10 px-2 py-0.5 rounded w-fit uppercase">{h.code}</span>
                  <span className="font-semibold text-sm text-[#F5F5F5]">{h.name}</span>
                  <PasswordCell hasPassword={h.hasPassword} rowIndex={h.rowIndex} type="hotel" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
