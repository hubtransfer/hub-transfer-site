"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ─── Country data ─── */
interface Country {
  code: string;
  name: string;
  ddi: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "PT", name: "Portugal", ddi: "351", flag: "🇵🇹" },
  { code: "ES", name: "Spain", ddi: "34", flag: "🇪🇸" },
  { code: "FR", name: "France", ddi: "33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", ddi: "49", flag: "🇩🇪" },
  { code: "BR", name: "Brazil", ddi: "55", flag: "🇧🇷" },
  { code: "US", name: "United States", ddi: "1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", ddi: "44", flag: "🇬🇧" },
  { code: "IT", name: "Italy", ddi: "39", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", ddi: "31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", ddi: "32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", ddi: "41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", ddi: "43", flag: "🇦🇹" },
  { code: "DK", name: "Denmark", ddi: "45", flag: "🇩🇰" },
  { code: "SE", name: "Sweden", ddi: "46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", ddi: "47", flag: "🇳🇴" },
  { code: "FI", name: "Finland", ddi: "358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", ddi: "48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", ddi: "420", flag: "🇨🇿" },
  { code: "GR", name: "Greece", ddi: "30", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", ddi: "353", flag: "🇮🇪" },
  { code: "RO", name: "Romania", ddi: "40", flag: "🇷🇴" },
  { code: "HU", name: "Hungary", ddi: "36", flag: "🇭🇺" },
  { code: "HR", name: "Croatia", ddi: "385", flag: "🇭🇷" },
  { code: "TR", name: "Turkey", ddi: "90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", ddi: "7", flag: "🇷🇺" },
  { code: "MA", name: "Morocco", ddi: "212", flag: "🇲🇦" },
  { code: "AO", name: "Angola", ddi: "244", flag: "🇦🇴" },
  { code: "MZ", name: "Mozambique", ddi: "258", flag: "🇲🇿" },
  { code: "IL", name: "Israel", ddi: "972", flag: "🇮🇱" },
  { code: "AE", name: "UAE", ddi: "971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", ddi: "966", flag: "🇸🇦" },
  { code: "IN", name: "India", ddi: "91", flag: "🇮🇳" },
  { code: "CN", name: "China", ddi: "86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", ddi: "81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", ddi: "82", flag: "🇰🇷" },
  { code: "AU", name: "Australia", ddi: "61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", ddi: "1", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", ddi: "52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", ddi: "54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", ddi: "56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", ddi: "57", flag: "🇨🇴" },
  { code: "ZA", name: "South Africa", ddi: "27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", ddi: "234", flag: "🇳🇬" },
  { code: "EG", name: "Egypt", ddi: "20", flag: "🇪🇬" },
  { code: "TH", name: "Thailand", ddi: "66", flag: "🇹🇭" },
  { code: "SG", name: "Singapore", ddi: "65", flag: "🇸🇬" },
  { code: "CV", name: "Cape Verde", ddi: "238", flag: "🇨🇻" },
  { code: "GW", name: "Guinea-Bissau", ddi: "245", flag: "🇬🇼" },
];

const PRIORITY = ["PT", "ES", "FR", "DE", "BR", "US", "GB", "IT"];

/** Detect country from raw digits — tries 4, 3, 2, 1 digit DDI */
function detectCountry(digits: string): Country | null {
  if (!digits) return null;
  // Sort DDIs by length descending so longer matches win
  const sorted = [...COUNTRIES].sort((a, b) => b.ddi.length - a.ddi.length);
  for (const c of sorted) {
    if (digits.startsWith(c.ddi)) return c;
  }
  return null;
}

function sortedCountries(): Country[] {
  const p = COUNTRIES.filter((c) => PRIORITY.includes(c.code));
  const r = COUNTRIES.filter((c) => !PRIORITY.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  return [...p, ...r];
}

/* ─── Component ─── */

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = "PT",
  placeholder,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Detected country from current value
  const detected = useMemo(() => {
    const digits = (value || "").replace(/\D/g, "");
    return detectCountry(digits) || COUNTRIES.find((c) => c.code === defaultCountry) || null;
  }, [value, defaultCountry]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleInput = useCallback(
    (raw: string) => {
      // Strip everything except digits and leading +
      let cleaned = raw.replace(/[^\d+]/g, "");
      // Ensure starts with + if has digits
      if (cleaned && !cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
      }
      onChange(cleaned);
    },
    [onChange],
  );

  const handleSelect = useCallback(
    (c: Country) => {
      setOpen(false);
      setSearch("");
      // Get current number part (after DDI)
      const digits = (value || "").replace(/\D/g, "");
      const current = detected ? digits.slice(detected.ddi.length) : digits;
      onChange("+" + c.ddi + current);
    },
    [value, detected, onChange],
  );

  // Display value with spaces for readability
  const displayValue = useMemo(() => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (!detected) return "+" + digits;
    const rest = digits.slice(detected.ddi.length);
    // Format: +DDI XXX XXX XXX
    const parts: string[] = [];
    for (let i = 0; i < rest.length; i += 3) {
      parts.push(rest.slice(i, i + 3));
    }
    return "+" + detected.ddi + (parts.length ? " " + parts.join(" ") : "");
  }, [value, detected]);

  const filtered = useMemo(() => {
    if (!search) return sortedCountries();
    const q = search.toLowerCase();
    return sortedCountries().filter(
      (c) => c.name.toLowerCase().includes(q) || c.ddi.includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const ph = placeholder || (detected ? `+${detected.ddi} 912 345 678` : "+351 912 345 678");

  return (
    <div className="relative" ref={dropRef}>
      <div className="flex items-center">
        {/* Flag button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pr-1 cursor-pointer z-10"
          tabIndex={-1}
        >
          <span className="text-lg leading-none">{detected?.flag || "🌐"}</span>
          <svg className="w-3 h-3 ml-0.5 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Single input field */}
        <input
          type="tel"
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={ph}
          className="w-full h-[44px] bg-white/[0.06] border border-white/[0.12] rounded-lg pl-12 pr-3 text-[#F5F5F5] text-sm placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors font-mono"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[48px] left-0 right-0 z-50 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl max-h-[240px] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-[#2A2A2A]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 text-xs text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030]"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#222] transition-colors cursor-pointer ${detected?.code === c.code ? "bg-[#F0D030]/10 text-[#F0D030]" : "text-[#D0D0D0]"}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono text-xs text-[#888]">+{c.ddi}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
