"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession, clearSession, setSession, getPartners, updatePassword,
  validateLogin, getAdminEmail, setAdminEmail, getLocalAdminPassword, setLocalAdminPassword,
  getHotelUrlSync, fetchHotelUrl, saveHotelUrl,
  type Partner, type Hotel,
} from "@/lib/auth";

/* ─── Admin account section ─── */
function AdminSection({ adminName }: { adminName: string }) {
  const [editingPwd, setEditingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState(() => getAdminEmail());
  const [emailSaved, setEmailSaved] = useState(false);

  const hasCustomPwd = !!getLocalAdminPassword();

  const handleSavePwd = useCallback(async () => {
    setPwdError(""); setPwdSuccess("");
    if (!currentPwd) { setPwdError("Insira a senha actual."); return; }
    if (newPwd.length < 6) { setPwdError("Nova senha: mínimo 6 caracteres."); return; }
    if (newPwd !== confirmPwd) { setPwdError("As senhas não coincidem."); return; }

    setSaving(true);
    // Validate current password
    const check = await validateLogin(adminName, currentPwd);
    setSaving(false);

    if (!check.success) {
      setPwdError("Senha actual incorrecta.");
      return;
    }

    setLocalAdminPassword(newPwd);
    setPwdSuccess("Senha admin actualizada com sucesso.");
    setEditingPwd(false);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setTimeout(() => setPwdSuccess(""), 3000);
  }, [adminName, currentPwd, newPwd, confirmPwd]);

  const handleSaveEmail = useCallback(() => {
    setAdminEmail(email);
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  }, [email]);

  return (
    <section className="bg-[#1A1A1A] border border-[#F0D030]/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 text-[#F0D030]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        <h2 className="text-base font-bold text-[#F0D030]">Conta Admin</h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-[#D0D0D0]">Logado como:</span>
        <span className="text-sm font-bold text-[#F5F5F5]">{adminName}</span>
        {hasCustomPwd && <span className="text-[10px] text-[#7EAA6E] bg-[#7EAA6E]/10 px-2 py-0.5 rounded font-mono">Senha personalizada</span>}
      </div>

      {/* Password */}
      {!editingPwd ? (
        <button onClick={() => setEditingPwd(true)}
          className="text-xs text-[#F0D030] hover:text-[#D4B828] font-mono cursor-pointer">
          Redefinir senha admin →
        </button>
      ) : (
        <div className="space-y-2 bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
          <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Senha actual" className="w-full h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono" />
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)" className="w-full h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono" />
          <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Confirmar nova senha" className="w-full h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono" />
          {pwdError && <p className="text-xs text-[#C06060]">{pwdError}</p>}
          <div className="flex gap-2">
            <button onClick={handleSavePwd} disabled={saving}
              className="h-9 px-4 bg-[#F0D030] text-[#0A0A0A] text-xs font-bold rounded-lg hover:bg-[#D4B828] disabled:opacity-50 cursor-pointer">
              {saving ? "A verificar..." : "Guardar"}
            </button>
            <button onClick={() => { setEditingPwd(false); setPwdError(""); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }}
              className="h-9 px-4 text-[#888] text-xs hover:text-[#F5F5F5] cursor-pointer">Cancelar</button>
          </div>
        </div>
      )}
      {pwdSuccess && <p className="text-xs text-[#7EAA6E] font-mono">{pwdSuccess}</p>}

      {/* Recovery email */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#2A2A2A]">
        <label className="text-xs text-[#888] flex-shrink-0 font-mono">Email recuperação:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@hubtransferencia.com"
          className="flex-1 h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 text-xs text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030] font-mono" />
        <button onClick={handleSaveEmail}
          className="h-8 px-3 text-[10px] font-bold bg-[#222] text-[#D0D0D0] rounded hover:text-[#F5F5F5] cursor-pointer">
          {emailSaved ? "✓" : "Guardar"}
        </button>
      </div>
    </section>
  );
}

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
    <div className="flex flex-col gap-1 relative">
      <div className="flex items-center gap-2">
        {hasPwd ? (
          <span className="text-[#888] text-sm font-mono">•••••</span>
        ) : (
          <span className="text-[#C06060] text-xs font-mono">⚠️ Sem senha</span>
        )}
        <button onClick={() => setEditing(true)}
          className="text-[10px] text-[#F0D030] hover:text-[#D4B828] cursor-pointer font-mono">
          {hasPwd ? "Redefinir" : "Definir"}
        </button>
      </div>
      {!hasPwd && type === "driver" && (
        <p className="text-[9px] text-[#C06060]/70 font-mono leading-tight">Usa senha padrão — redefina</p>
      )}
      {toast && <span className="text-[10px] text-[#7EAA6E] font-mono">{toast}</span>}
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
  const [adminName, setAdminName] = useState("");

  // URL config modal state
  const [urlModalHotel, setUrlModalHotel] = useState<Hotel | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlToast, setUrlToast] = useState("");
  const [hotelUrls, setHotelUrls] = useState<Record<string, string>>({});

  // Auth check
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      router.replace("/login");
      return;
    }
    setAdminName(session.name);
  }, [router]);

  // Load data + hotel URLs
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getPartners();
      setDrivers(data.drivers);
      setHotels(data.hotels);
      // Load URLs for all hotels
      const urls: Record<string, string> = {};
      for (const h of data.hotels) {
        const u = await fetchHotelUrl(h.code);
        if (u) urls[h.code.toUpperCase()] = u;
      }
      setHotelUrls(urls);
      setLoading(false);
    })();
  }, []);

  const handleSaveUrl = useCallback(async () => {
    if (!urlModalHotel || !urlInput.trim()) return;
    setUrlSaving(true);
    const res = await saveHotelUrl(urlModalHotel.code, urlInput.trim());
    setUrlSaving(false);
    if (res.success) {
      setHotelUrls((prev) => ({ ...prev, [urlModalHotel.code.toUpperCase()]: urlInput.trim() }));
      setUrlToast("URL guardada ✓");
      setTimeout(() => { setUrlToast(""); setUrlModalHotel(null); }, 1500);
    } else {
      setUrlToast(res.message || "Erro ao guardar");
      setTimeout(() => setUrlToast(""), 3000);
    }
  }, [urlModalHotel, urlInput]);

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

        {/* ═══ ADMIN ACCOUNT ═══ */}
        {adminName && <AdminSection adminName={adminName} />}

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
            <div className="hidden md:grid grid-cols-[80px_1fr_150px_140px] gap-2 px-4 py-2 border-b border-[#2A2A2A] text-[10px] text-[#888] uppercase tracking-wider font-mono">
              <span>Código</span><span>Nome</span><span>Senha</span><span>Acções</span>
            </div>

            {loading ? (
              <div className="space-y-1 p-2">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-10 text-[#666] text-sm font-mono">Nenhum hotel encontrado</div>
            ) : (
              hotels.map((h, i) => {
                const url = hotelUrls[h.code.toUpperCase()] || getHotelUrlSync(h.code);
                return (
                  <div key={i} className="space-y-2 px-4 py-3 border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A]">
                    <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_150px_140px] gap-2 items-center">
                      <span className="text-xs font-mono font-bold text-[#F0D030] bg-[#F0D030]/10 px-2 py-0.5 rounded w-fit uppercase">{h.code}</span>
                      <span className="font-semibold text-sm text-[#F5F5F5]">{h.name}</span>
                      <PasswordCell hasPassword={h.hasPassword} rowIndex={h.rowIndex} type="hotel" />
                      <button
                        onClick={() => {
                          setSession({ name: h.name || adminName, role: "admin", code: h.code.toUpperCase() });
                          if (url) localStorage.setItem("webappUrl", url);
                          router.push("/portal");
                        }}
                        className="text-[11px] font-bold text-[#F0D030] bg-[#F0D030]/10 border border-[#F0D030]/20 rounded-lg px-3 py-1.5 hover:bg-[#F0D030]/20 cursor-pointer transition-colors"
                      >
                        Entrar no Portal →
                      </button>
                    </div>
                    {/* URL status + config button */}
                    <div className="flex items-center gap-2 ml-0 md:ml-[88px]">
                      {url ? (
                        <>
                          <span className="text-[10px] font-mono text-[#7EAA6E]">🟢 URL configurada</span>
                          <button onClick={() => { setUrlModalHotel(h); setUrlInput(url); }}
                            className="text-[10px] font-mono text-[#888] hover:text-[#F0D030] cursor-pointer">Editar</button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-mono text-[#C06060]">🔴 Sem URL</span>
                          <button onClick={() => { setUrlModalHotel(h); setUrlInput(""); }}
                            className="text-[10px] font-mono text-[#F0D030] hover:text-[#D4B828] cursor-pointer font-bold">⚙️ Configurar URL</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ═══ URL CONFIG MODAL ═══ */}
      {urlModalHotel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setUrlModalHotel(null)}>
          <div className="w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F0D030]">Configurar URL do Hotel</h3>
              <button onClick={() => setUrlModalHotel(null)} className="text-[#666] hover:text-white text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888] font-mono w-[60px]">Hotel:</span>
                <span className="text-sm text-[#F5F5F5] font-semibold">{urlModalHotel.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888] font-mono w-[60px]">Código:</span>
                <span className="text-xs text-[#F0D030] font-mono font-bold uppercase">{urlModalHotel.code}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#888] font-mono uppercase tracking-wider block mb-1">URL do Google Apps Script</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-sm text-[#F5F5F5] placeholder-[#555] focus:outline-none focus:border-[#F0D030] font-mono"
                autoFocus
              />
            </div>

            {urlToast && (
              <p className={`text-xs font-mono ${urlToast.includes("✓") ? "text-[#7EAA6E]" : "text-[#C06060]"}`}>{urlToast}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSaveUrl}
                disabled={urlSaving || !urlInput.trim()}
                className="flex-1 h-10 bg-[#F0D030] text-[#0A0A0A] font-bold text-sm rounded-lg hover:bg-[#D4B828] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {urlSaving ? "A guardar..." : "Salvar URL"}
              </button>
              <button
                onClick={() => setUrlModalHotel(null)}
                className="h-10 px-4 bg-[#222] text-[#888] text-sm rounded-lg hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
