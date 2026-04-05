"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export interface AddressOption {
  name: string;
  type: "hotel" | "restaurante";
  address?: string;
  icon: string;
}

interface AutocompleteRestaurant {
  id: string | number;
  nome: string;
  endereco: string;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string, selected?: AddressOption) => void;
  placeholder?: string;
  required?: boolean;
  hotels: string[];
  restaurantes: AutocompleteRestaurant[];
  disabled?: boolean;
  /** Mostra o valor em cor secundária quando true (auto-preenchido / não editado) */
  faded?: boolean;
}

// Remove acentos e normaliza para match parcial
const normalize = (s: string): string =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  required,
  hotels,
  restaurantes,
  disabled,
  faded,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtra sugestões por match parcial (case/accent-insensitive)
  const { filteredHotels, filteredRestaurantes, totalCount } = useMemo(() => {
    const q = normalize(value);
    const fh = q
      ? hotels.filter((h) => normalize(h).includes(q))
      : hotels.slice();
    const fr = q
      ? restaurantes.filter(
          (r) => normalize(r.nome).includes(q) || normalize(r.endereco || "").includes(q)
        )
      : restaurantes.slice();
    return { filteredHotels: fh, filteredRestaurantes: fr, totalCount: fh.length + fr.length };
  }, [value, hotels, restaurantes]);

  // Lista achatada para keyboard navigation
  const flatOptions = useMemo<AddressOption[]>(() => {
    const opts: AddressOption[] = [];
    for (const h of filteredHotels) opts.push({ name: h, type: "hotel", icon: "🏨" });
    for (const r of filteredRestaurantes) {
      const addr = r.endereco ? `${r.nome}, ${r.endereco}` : r.nome;
      opts.push({ name: addr, type: "restaurante", icon: "🍽️", address: r.endereco });
    }
    return opts;
  }, [filteredHotels, filteredRestaurantes]);

  // Reset highlight when options change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [flatOptions.length]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isOpen]);

  // Cleanup
  useEffect(() => () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
  }, []);

  const handleSelect = useCallback((opt: AddressOption) => {
    onChange(opt.name, opt);
    setIsOpen(false);
    setHighlightIndex(-1);
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    if (blurTimerRef.current) { clearTimeout(blurTimerRef.current); blurTimerRef.current = null; }
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay para permitir click numa sugestão antes de fechar
    blurTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
      return;
    }
    if (!isOpen || flatOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % flatOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? flatOptions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(flatOptions[highlightIndex]);
    }
  }, [isOpen, flatOptions, highlightIndex, handleSelect]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full bg-[#16213e] border border-zinc-800 rounded px-3 py-2 text-sm placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none disabled:opacity-50 ${
          faded ? "text-[#888]" : "text-white"
        }`}
      />

      {isOpen && totalCount > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#16213e] border border-[#D4A017] rounded-lg shadow-2xl z-50 max-h-[250px] overflow-y-auto">
          {filteredHotels.length > 0 && (
            <>
              <div className="px-4 py-2 text-[11px] uppercase tracking-[1px] text-[#D4A017] font-mono font-bold select-none bg-[#0f1626]">
                🏨 Hotéis Parceiros
              </div>
              {filteredHotels.map((h, i) => {
                const flatIdx = i;
                const isHighlighted = highlightIndex === flatIdx;
                return (
                  <button
                    key={`hotel-${h}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect({ name: h, type: "hotel", icon: "🏨" })}
                    onMouseEnter={() => setHighlightIndex(flatIdx)}
                    className={`w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-center gap-2 ${
                      isHighlighted ? "bg-[#D4A017]/20" : ""
                    }`}
                  >
                    <span className="text-xs">🏨</span>
                    <span className="truncate">{h}</span>
                  </button>
                );
              })}
            </>
          )}

          {filteredRestaurantes.length > 0 && (
            <>
              {filteredHotels.length > 0 && <div className="border-t border-[#333]" />}
              <div className="px-4 py-2 text-[11px] uppercase tracking-[1px] text-[#D4A017] font-mono font-bold select-none bg-[#0f1626]">
                🍽️ Restaurantes
              </div>
              {filteredRestaurantes.map((r, i) => {
                const flatIdx = filteredHotels.length + i;
                const isHighlighted = highlightIndex === flatIdx;
                const display = r.endereco ? `${r.nome}, ${r.endereco}` : r.nome;
                return (
                  <button
                    key={`rest-${r.id}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect({ name: display, type: "restaurante", icon: "🍽️", address: r.endereco })}
                    onMouseEnter={() => setHighlightIndex(flatIdx)}
                    className={`w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-start gap-2 ${
                      isHighlighted ? "bg-[#D4A017]/20" : ""
                    }`}
                  >
                    <span className="text-xs mt-0.5">🍽️</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.nome}</div>
                      {r.endereco && (
                        <div className="truncate text-[11px] text-[#888]">{r.endereco}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
