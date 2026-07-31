"use client";

import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/* ─── Types ─── */

/** key = tipo EXACTO que o GAS registerNoShow usa para nomear os ficheiros */
type ProofKey = "calls" | "whatsapp" | "sms" | "location" | "flight_arrival";

interface ProofPhoto {
  file: File;
  preview: string;
}

interface ProofSlot {
  key: ProofKey;
  label: string;
  hint: string;
  icon: string;
  accept: string;
  photos: ProofPhoto[];
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

// Limite de ENTRADA generoso: fotos de iPhone chegam aos 8-10MB, mas o que
// segue no POST é sempre a versão comprimida (máx. 1600px, JPEG ~0.8).
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Sem `capture`: o browser deixa escolher câmara OU galeria em cada slot.
const INITIAL_SLOTS: () => ProofSlot[] = () => [
  { key: "calls",          icon: "📞", label: "Chamadas",          hint: "print do registo de chamadas ao cliente",             accept: "image/*", photos: [] },
  { key: "whatsapp",       icon: "💬", label: "WhatsApp",          hint: "prints das tentativas no WhatsApp",                   accept: "image/*", photos: [] },
  { key: "sms",            icon: "✉️", label: "SMS",               hint: "print do SMS enviado",                                accept: "image/*", photos: [] },
  { key: "location",       icon: "📍", label: "Presença no local", hint: "foto no ponto de recolha (placa com nome visível)",   accept: "image/*", photos: [] },
  { key: "flight_arrival", icon: "✈️", label: "Horário do voo",    hint: "print da chegada do voo",                             accept: "image/*", photos: [] },
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

/* ─── Compressão client-side: máx. 1600px no lado maior, JPEG ~0.8.
   O POST vai com tudo em base64 e o motorista está em 4G — sem isto,
   meia dúzia de fotos de iPhone estouram o pedido. Prints de ecrã
   ficam pequenos e perfeitamente legíveis. Em falha, base64 original. ─── */
const COMPRESS_MAX_PX = 1600;
const COMPRESS_QUALITY = 0.8;

async function compressToDataUrl(file: File): Promise<string> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("img load"));
        i.src = url;
      });
      const scale = Math.min(1, COMPRESS_MAX_PX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas ctx");
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", COMPRESS_QUALITY);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return fileToBase64(file);
  }
}

/* ─── Component ─── */

export default function NoShowModal({ isOpen, tripId, clientName, driverName, gasUrl, date, onClose, onSubmit }: NoShowModalProps) {
  const [slots, setSlots] = useState<ProofSlot[]>(INITIAL_SLOTS);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const totalFotos = slots.reduce((n, s) => n + s.photos.length, 0);
  const slotsComProva = slots.filter((s) => s.photos.length > 0).length;
  // A defesa é obrigatória: pelo menos 1 foto no total E o relato preenchido
  const canSubmit = totalFotos >= 1 && notes.trim().length > 0 && !submitting;

  // Acrescenta (não substitui) — tocar outra vez no slot junta mais fotos
  const handleFiles = useCallback((index: number, list: FileList | null) => {
    if (!list || list.length === 0) return;
    const added: ProofPhoto[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" é demasiado grande (máx. 20MB)`);
        continue;
      }
      added.push({ file, preview: URL.createObjectURL(file) });
    }
    if (added.length === 0) return;
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, photos: [...s.photos, ...added] } : s));
  }, []);

  const removePhoto = useCallback((slotIdx: number, photoIdx: number) => {
    setSlots((prev) => prev.map((s, i) => {
      if (i !== slotIdx) return s;
      const photo = s.photos[photoIdx];
      if (photo?.preview) URL.revokeObjectURL(photo.preview);
      return { ...s, photos: s.photos.filter((_, j) => j !== photoIdx) };
    }));
  }, []);

  /** Save to localStorage as fallback */
  const saveToLocal = useCallback((
    d: string,
    proofs: { key: ProofKey; label: string; fileName: string; mime: string; data: string }[],
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
      // Uma entrada em proofs POR FOTO, todas com o type do slot —
      // o GAS numera ficheiros repetidos do mesmo tipo (_2, _3…).
      // Cada foto é comprimida (1600px / JPEG 0.8) antes do base64.
      const proofs: { key: ProofKey; label: string; fileName: string; mime: string; data: string }[] = [];
      for (const slot of slots) {
        for (const photo of slot.photos) {
          const data = await compressToDataUrl(photo.file);
          proofs.push({
            key: slot.key,
            label: slot.label,
            fileName: photo.file.name.replace(/\.[^.]+$/, "") + ".jpg",
            mime: "image/jpeg",
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
            // type = calls/whatsapp/sms/location/flight_arrival — o GAS nomeia
            // os ficheiros por estes tipos; nunca enviar o MIME aqui.
            proofs: proofs.map((p) => ({
              type: p.key,
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
  if (typeof document === "undefined") return null;

  // Portal para document.body: o modal NÃO pode viver dentro do card — o
  // motion.div do card tem transform (framer) + overflow-hidden, o que faz o
  // `position: fixed` posicionar-se em relação ao CARD e desalinha os
  // hit-targets no iOS (o toque no slot caía no overlay e fechava o modal).
  // stopPropagation de pointer: com portal os eventos sintéticos ainda
  // borbulham pela árvore React até aos handlers de swipe do card.
  return createPortal(
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
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
            <div key={slot.key} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-mono text-[#D0D0D0]">
                  <span className="mr-1">{slot.icon}</span> <span className="font-bold">{slot.label}</span>
                </p>
                {slot.photos.length > 0 && (
                  <span className="text-[10px] font-mono font-bold text-[#F87171]">
                    {slot.photos.length} {slot.photos.length === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#777] mb-2">{slot.hint}</p>

              {/* Miniaturas em grelha, ✕ individual */}
              {slot.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {slot.photos.map((photo, j) => (
                    <div key={photo.preview} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.preview}
                        alt={`${slot.label} ${j + 1}`}
                        className="w-full h-16 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i, j)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tocar outra vez ACRESCENTA — o input `multiple` deixa
                  escolher várias da fototeca de uma só vez */}
              <label className="flex items-center justify-center h-12 border border-dashed border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#EF4444]/30 transition-colors">
                <span className="text-xs text-[#666]">
                  {slot.photos.length > 0 ? "📷 Acrescentar mais fotos" : "📷 Câmara ou galeria (podes escolher várias)"}
                </span>
                <input
                  ref={(el) => { fileRefs.current[i] = el; }}
                  type="file"
                  accept={slot.accept}
                  multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(i, e.target.files); e.target.value = ""; }}
                />
              </label>
            </div>
          ))}

          {/* O que aconteceu — a defesa do motorista, obrigatória */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs font-mono text-[#D0D0D0] mb-0.5">📝 <span className="font-bold">O que aconteceu?</span> <span className="text-[#EF4444]">*</span></p>
            <p className="text-[10px] text-[#777] mb-2">a tua defesa — conta a história completa, com horas</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Cheguei às 08:05, voo aterrou às 08:12, esperei 65 min com placa na saída. Liguei 3x e mandei WhatsApp/SMS sem resposta. Contactei a operadora às 09:20."
              rows={5}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#EF4444]/40 resize-none font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#2A2A2A] px-5 py-4 space-y-3">
          <p className="text-xs text-[#999] text-center font-mono">
            {totalFotos} {totalFotos === 1 ? "foto" : "fotos"} em {slotsComProva} {slotsComProva === 1 ? "prova" : "provas"}
            {totalFotos < 1 && <span className="text-[#EF4444]"> (mínimo 1 foto)</span>}
            {notes.trim().length === 0 && <span className="text-[#EF4444]"> · falta o relato &quot;O que aconteceu?&quot;</span>}
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
    </div>,
    document.body
  );
}
