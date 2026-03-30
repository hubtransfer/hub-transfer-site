"use client";

import React, { useState, useRef, useCallback } from "react";

/* ─── Types ─── */

interface ProofSlot {
  label: string;
  icon: string;
  accept: string;
  capture?: string;
  file: File | null;
  preview: string | null;
}

interface NoShowModalProps {
  isOpen: boolean;
  tripId: string;
  clientName: string;
  driverName?: string;
  gasUrl?: string;
  date?: string;
  onClose: () => void;
  onSubmit: (tripId: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const INITIAL_SLOTS: () => ProofSlot[] = () => [
  { label: "Chamadas (4 tentativas)", icon: "📞", accept: "image/*,.pdf", file: null, preview: null },
  { label: "Mensagem WhatsApp", icon: "💬", accept: "image/*,.pdf", file: null, preview: null },
  { label: "Mensagem SMS", icon: "📱", accept: "image/*,.pdf", file: null, preview: null },
  { label: "Presença no local (foto com placa)", icon: "📍", accept: "image/*", capture: "environment", file: null, preview: null },
  { label: "Horário chegada do voo", icon: "✈️", accept: "image/*,.pdf", file: null, preview: null },
];

/* ─── File to base64 ─── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Component ─── */

export default function NoShowModal({ isOpen, tripId, clientName, driverName, gasUrl, date, onClose, onSubmit }: NoShowModalProps) {
  const [slots, setSlots] = useState<ProofSlot[]>(INITIAL_SLOTS);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const proofCount = slots.filter((s) => s.file !== null).length;
  const canSubmit = proofCount >= 4 && !submitting;

  const handleFile = useCallback((index: number, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("Ficheiro demasiado grande (máx. 5MB)");
      return;
    }
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, file, preview: url } : s));
  }, []);

  const removeFile = useCallback((index: number) => {
    setSlots((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      if (s.preview) URL.revokeObjectURL(s.preview);
      return { ...s, file: null, preview: null };
    }));
    // Clear the file input
    if (fileRefs.current[index]) fileRefs.current[index]!.value = "";
  }, []);

  /** Save to localStorage as fallback */
  const saveToLocal = useCallback((
    d: string,
    proofs: { label: string; fileName: string; type: string; data: string }[],
  ) => {
    try {
      const key = `hub_noshow_${tripId}_${d}`;
      const record = {
        tripId,
        clientName,
        date: d,
        timestamp: new Date().toISOString(),
        notes,
        proofCount: proofs.length,
        proofs,
      };
      localStorage.setItem(key, JSON.stringify(record));

      const dayKey = `hub_noshows_${d}`;
      const existing: string[] = JSON.parse(localStorage.getItem(dayKey) || "[]");
      if (!existing.includes(tripId)) {
        existing.push(tripId);
        localStorage.setItem(dayKey, JSON.stringify(existing));
      }
    } catch { /* quota exceeded — ignore */ }
  }, [tripId, clientName, notes]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Convert all files to base64
      const proofs: { label: string; fileName: string; type: string; data: string }[] = [];
      for (const slot of slots) {
        if (slot.file) {
          const data = await fileToBase64(slot.file);
          proofs.push({
            label: slot.label,
            fileName: slot.file.name,
            type: slot.file.type,
            data,
          });
        }
      }

      const d = date || new Date().toISOString().slice(0, 10);
      let savedRemote = false;

      // Try POST to GAS backend
      if (gasUrl) {
        try {
          const payload = {
            action: "registerNoShow",
            tripId,
            clientName,
            date: d,
            driverName: driverName || "",
            observations: notes,
            proofs: proofs.map((p) => ({
              type: p.type,
              filename: p.fileName,
              data: p.data,
            })),
          };

          const res = await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload),
          });

          const result = await res.json();
          if (result.success) {
            savedRemote = true;
          }
        } catch (err) {
          console.error("NoShow GAS POST error:", err);
        }
      }

      // Fallback: always save to localStorage too
      saveToLocal(d, proofs);

      setToast(savedRemote ? "Provas guardadas com sucesso" : "Provas guardadas localmente");
      setTimeout(() => {
        setToast("");
        onSubmit(tripId);
        onClose();
        setSlots(INITIAL_SLOTS());
        setNotes("");
      }, 1500);
    } catch (err) {
      console.error("NoShow submit error:", err);
      alert("Erro ao guardar provas.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, slots, notes, tripId, clientName, driverName, gasUrl, date, saveToLocal, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0A0A0A] border border-[#2A2A2A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#EF4444] font-mono">🚫 Registar ausência do cliente</h2>
              <p className="text-xs text-[#999] mt-0.5">{clientName}</p>
            </div>
            <button type="button" onClick={onClose} className="text-[#666] hover:text-white text-xl leading-none px-2">✕</button>
          </div>
          <p className="text-xs text-[#D0D0D0] mt-2">Envie as seguintes provas:</p>
        </div>

        {/* Proof slots */}
        <div className="px-5 py-4 space-y-3">
          {slots.map((slot, i) => (
            <div key={slot.label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
              <p className="text-xs font-mono text-[#D0D0D0] mb-2">
                <span className="mr-1">{slot.icon}</span> {slot.label}
              </p>

              {slot.preview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.preview}
                    alt={slot.label}
                    className="max-h-[80px] rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : slot.file ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#D0D0D0] font-mono truncate">{slot.file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-[#EF4444] text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-16 border border-dashed border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#EF4444]/30 transition-colors">
                  <span className="text-xs text-[#666]">Carregar ficheiro (máx. 5MB)</span>
                  <input
                    ref={(el) => { fileRefs.current[i] = el; }}
                    type="file"
                    accept={slot.accept}
                    capture={slot.capture as "environment" | undefined}
                    className="hidden"
                    onChange={(e) => handleFile(i, e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          ))}

          {/* Notes */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs font-mono text-[#D0D0D0] mb-2">📝 Observações</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#EF4444]/40 resize-none font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#2A2A2A] px-5 py-4 space-y-3">
          <p className="text-xs text-[#999] text-center font-mono">
            {proofCount} de 5 provas carregadas {proofCount < 4 && <span className="text-[#EF4444]">(mínimo 4)</span>}
          </p>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full h-14 rounded-2xl font-mono text-base font-bold transition-colors ${
              canSubmit
                ? "bg-[#EF4444] text-white active:bg-[#DC2626]"
                : "bg-[#2A2A2A] text-[#666] cursor-not-allowed"
            }`}
          >
            {submitting ? "A guardar..." : "Submeter Provas"}
          </button>

          {/* Toast */}
          {toast && (
            <p className="text-center text-sm font-mono text-[#22C55E] font-bold">{toast}</p>
          )}
        </div>
      </div>
    </div>
  );
}
