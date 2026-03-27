"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Country data ─── */
interface Country {
  code: string; // ISO 2-letter
  name: string;
  ddi: string;
  flag: string;
}

const PRIORITY_CODES = ["PT", "ES", "FR", "DE", "BR", "US", "GB", "IT"];

const COUNTRIES: Country[] = [
  { code: "PT", name: "Portugal", ddi: "+351", flag: "🇵🇹" },
  { code: "ES", name: "Spain", ddi: "+34", flag: "🇪🇸" },
  { code: "FR", name: "France", ddi: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", ddi: "+49", flag: "🇩🇪" },
  { code: "BR", name: "Brazil", ddi: "+55", flag: "🇧🇷" },
  { code: "US", name: "United States", ddi: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", ddi: "+44", flag: "🇬🇧" },
  { code: "IT", name: "Italy", ddi: "+39", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", ddi: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", ddi: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", ddi: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", ddi: "+43", flag: "🇦🇹" },
  { code: "DK", name: "Denmark", ddi: "+45", flag: "🇩🇰" },
  { code: "SE", name: "Sweden", ddi: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", ddi: "+47", flag: "🇳🇴" },
  { code: "FI", name: "Finland", ddi: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", ddi: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", ddi: "+420", flag: "🇨🇿" },
  { code: "GR", name: "Greece", ddi: "+30", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", ddi: "+353", flag: "🇮🇪" },
  { code: "RO", name: "Romania", ddi: "+40", flag: "🇷🇴" },
  { code: "HU", name: "Hungary", ddi: "+36", flag: "🇭🇺" },
  { code: "HR", name: "Croatia", ddi: "+385", flag: "🇭🇷" },
  { code: "TR", name: "Turkey", ddi: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", ddi: "+7", flag: "🇷🇺" },
  { code: "MA", name: "Morocco", ddi: "+212", flag: "🇲🇦" },
  { code: "AO", name: "Angola", ddi: "+244", flag: "🇦🇴" },
  { code: "MZ", name: "Mozambique", ddi: "+258", flag: "🇲🇿" },
  { code: "IL", name: "Israel", ddi: "+972", flag: "🇮🇱" },
  { code: "AE", name: "UAE", ddi: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", ddi: "+966", flag: "🇸🇦" },
  { code: "IN", name: "India", ddi: "+91", flag: "🇮🇳" },
  { code: "CN", name: "China", ddi: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", ddi: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", ddi: "+82", flag: "🇰🇷" },
  { code: "AU", name: "Australia", ddi: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", ddi: "+1", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", ddi: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", ddi: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", ddi: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", ddi: "+57", flag: "🇨🇴" },
  { code: "ZA", name: "South Africa", ddi: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", ddi: "+234", flag: "🇳🇬" },
  { code: "EG", name: "Egypt", ddi: "+20", flag: "🇪🇬" },
  { code: "TH", name: "Thailand", ddi: "+66", flag: "🇹🇭" },
  { code: "SG", name: "Singapore", ddi: "+65", flag: "🇸🇬" },
];

function sortedCountries(): Country[] {
  const priority = COUNTRIES.filter((c) => PRIORITY_CODES.includes(c.code));
  const rest = COUNTRIES.filter((c) => !PRIORITY_CODES.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  return [...priority, ...rest];
}

/* ─── Component ─── */

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
}

export default function PhoneInput({ value, onChange, defaultCountry = "PT", placeholder = "912 345 678" }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Country>(() => COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]);
  const [number, setNumber] = useState(() => {
    // Extract number part from value (remove DDI)
    if (!value) return "";
    const c = COUNTRIES.find((co) => value.startsWith(co.ddi));
    return c ? value.slice(c.ddi.length).trim() : value.replace(/^\+\d+\s*/, "");
  });
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Parse initial value
  useEffect(() => {
    if (!value) return;
    const match = COUNTRIES.find((c) => value.startsWith(c.ddi));
    if (match) {
      setSelected(match);
      setNumber(value.slice(match.ddi.length).trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = useCallback((c: Country) => {
    setSelected(c);
    setOpen(false);
    setSearch("");
    onChange(`${c.ddi} ${number}`);
  }, [number, onChange]);

  const handleNumber = useCallback((num: string) => {
    setNumber(num);
    onChange(`${selected.ddi} ${num}`);
  }, [selected, onChange]);

  const filtered = search
    ? sortedCountries().filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ddi.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : sortedCountries();

  return (
    <div className="relative flex gap-1.5" ref={dropRef}>
      {/* DDI selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-[44px] px-2.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[#F5F5F5] text-sm hover:border-[#F0D030]/40 transition-colors cursor-pointer flex-shrink-0"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-mono text-xs text-[#B0B0B0]">{selected.ddi}</span>
        <svg className="w-3 h-3 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={(e) => handleNumber(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-[44px] bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 text-[#F5F5F5] text-sm placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors font-mono"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[48px] left-0 right-0 z-50 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl max-h-[260px] overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-[#2A2A2A]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 text-xs text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#F0D030]"
            />
          </div>
          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.map((c) => (
              <button
                key={c.code + c.ddi}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#222] transition-colors cursor-pointer ${selected.code === c.code ? "bg-[#F0D030]/10 text-[#F0D030]" : "text-[#D0D0D0]"}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono text-xs text-[#888]">{c.ddi}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
