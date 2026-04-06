"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Google Maps types ───
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: { input: string; componentRestrictions?: { country: string }; types?: string[] },
              callback: (predictions: GooglePrediction[] | null, status: string) => void,
            ) => void;
          };
        };
      };
    };
  }
}

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

// ─── Public types ───

export interface AddressOption {
  name: string;
  type: "hotel" | "restaurante" | "google";
  address?: string;
  icon: string;
  placeId?: string;
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
  faded?: boolean;
  enableGooglePlaces?: boolean;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBe4UwnVYRP5KAUOtHg3diD6kPTif3VN30";

// Remove acentos e normaliza para match parcial
const normalize = (s: string): string =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Load Google Maps script once globally
let googleScriptLoaded = false;
function ensureGoogleScript() {
  if (googleScriptLoaded || typeof window === "undefined") return;
  if (window.google?.maps?.places) { googleScriptLoaded = true; return; }
  const existing = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
  if (existing) { googleScriptLoaded = true; return; }
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  document.head.appendChild(script);
  googleScriptLoaded = true;
}

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
  enableGooglePlaces = true,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [googleSuggestions, setGoogleSuggestions] = useState<AddressOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRef = useRef<InstanceType<NonNullable<NonNullable<NonNullable<Window["google"]>["maps"]>["places"]>["AutocompleteService"]> | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (enableGooglePlaces) ensureGoogleScript();
  }, [enableGooglePlaces]);

  // ─── Filter hotels + restaurants (local) ───
  const { filteredHotels, filteredRestaurantes } = useMemo(() => {
    const q = normalize(value);
    const fh = q ? hotels.filter((h) => normalize(h).includes(q)) : hotels.slice();
    const fr = q
      ? restaurantes.filter((r) => normalize(r.nome).includes(q) || normalize(r.endereco || "").includes(q))
      : restaurantes.slice();
    return { filteredHotels: fh, filteredRestaurantes: fr };
  }, [value, hotels, restaurantes]);

  // ─── Google Places fetch with debounce ───
  const fetchGoogleSuggestions = useCallback((input: string) => {
    if (!enableGooglePlaces || input.length < 3) {
      setGoogleSuggestions([]);
      return;
    }
    if (!window.google?.maps?.places) {
      setGoogleSuggestions([]);
      return;
    }
    if (!serviceRef.current) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
    serviceRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: "pt" }, types: ["establishment", "geocode"] },
      (predictions, status) => {
        if (status === "OK" && predictions) {
          setGoogleSuggestions(
            predictions.map((p) => ({
              name: p.structured_formatting.main_text,
              address: p.description,
              type: "google" as const,
              icon: "📍",
              placeId: p.place_id,
            })),
          );
        } else {
          setGoogleSuggestions([]);
        }
      },
    );
  }, [enableGooglePlaces]);

  // Debounced google fetch when value changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isOpen || !enableGooglePlaces || value.length < 3) {
      setGoogleSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchGoogleSuggestions(value), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, isOpen, enableGooglePlaces, fetchGoogleSuggestions]);

  // ─── Flat options for keyboard nav ───
  const flatOptions = useMemo<AddressOption[]>(() => {
    const opts: AddressOption[] = [];
    for (const h of filteredHotels) opts.push({ name: h, type: "hotel", icon: "🏨" });
    for (const r of filteredRestaurantes) {
      const addr = r.endereco ? `${r.nome}, ${r.endereco}` : r.nome;
      opts.push({ name: addr, type: "restaurante", icon: "🍽️", address: r.endereco });
    }
    for (const g of googleSuggestions) opts.push(g);
    return opts;
  }, [filteredHotels, filteredRestaurantes, googleSuggestions]);

  const totalCount = flatOptions.length;

  useEffect(() => { setHighlightIndex(-1); }, [totalCount]);

  // ─── Close on outside click ───
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ─── Handlers ───
  const handleSelect = useCallback((opt: AddressOption) => {
    // Google suggestions: use full description as value
    const val = opt.type === "google" ? (opt.address || opt.name) : opt.name;
    onChange(val, opt);
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleFocus = useCallback(() => setIsOpen(true), []);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion before closing
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setIsOpen(false); setHighlightIndex(-1); return; }
    if (!isOpen || flatOptions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIndex((i) => (i + 1) % flatOptions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIndex((i) => (i <= 0 ? flatOptions.length - 1 : i - 1)); }
    else if (e.key === "Enter" && highlightIndex >= 0) { e.preventDefault(); handleSelect(flatOptions[highlightIndex]); }
  }, [isOpen, flatOptions, highlightIndex, handleSelect]);

  // ─── Render helpers ───
  const hotelStartIdx = 0;
  const restStartIdx = filteredHotels.length;
  const googleStartIdx = filteredHotels.length + filteredRestaurantes.length;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">{label}</label>
      <input
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
        className={`w-full bg-[#16213e] border border-zinc-800 rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:border-[#D4A017] focus:outline-none disabled:opacity-50 ${faded ? "text-[#888]" : "text-white"}`}
      />

      {isOpen && totalCount > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#16213e] border border-[#D4A017] rounded-lg shadow-2xl z-50 max-h-[250px] overflow-y-auto">
          {/* Hotels */}
          {filteredHotels.length > 0 && (
            <>
              <div className="px-4 py-2 text-[11px] uppercase tracking-[1px] text-[#D4A017] font-mono font-bold select-none bg-[#0f1626]">🏨 Hotéis Parceiros</div>
              {filteredHotels.map((h, i) => {
                const idx = hotelStartIdx + i;
                return (
                  <button key={`h-${h}`} type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect({ name: h, type: "hotel", icon: "🏨" })}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-center gap-2 ${highlightIndex === idx ? "bg-[#D4A017]/20" : ""}`}>
                    <span className="text-xs">🏨</span><span className="truncate">{h}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Restaurants */}
          {filteredRestaurantes.length > 0 && (
            <>
              {filteredHotels.length > 0 && <div className="border-t border-[#333]" />}
              <div className="px-4 py-2 text-[11px] uppercase tracking-[1px] text-[#D4A017] font-mono font-bold select-none bg-[#0f1626]">🍽️ Restaurantes</div>
              {filteredRestaurantes.map((r, i) => {
                const idx = restStartIdx + i;
                const display = r.endereco ? `${r.nome}, ${r.endereco}` : r.nome;
                return (
                  <button key={`r-${r.id}`} type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect({ name: display, type: "restaurante", icon: "🍽️", address: r.endereco })}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-start gap-2 ${highlightIndex === idx ? "bg-[#D4A017]/20" : ""}`}>
                    <span className="text-xs mt-0.5">🍽️</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{r.nome}</div>
                      {r.endereco && <div className="truncate text-[11px] text-[#888]">{r.endereco}</div>}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Google Places */}
          {googleSuggestions.length > 0 && (
            <>
              {(filteredHotels.length > 0 || filteredRestaurantes.length > 0) && <div className="border-t border-[#333]" />}
              <div className="px-4 py-2 text-[11px] uppercase tracking-[1px] text-[#D4A017] font-mono font-bold select-none bg-[#0f1626]">📍 Sugestões</div>
              {googleSuggestions.map((g, i) => {
                const idx = googleStartIdx + i;
                return (
                  <button key={`g-${g.placeId || i}`} type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(g)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-start gap-2 ${highlightIndex === idx ? "bg-[#D4A017]/20" : ""}`}>
                    <span className="text-xs mt-0.5">📍</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{g.name}</div>
                      {g.address && g.address !== g.name && <div className="truncate text-[11px] text-[#888]">{g.address}</div>}
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
