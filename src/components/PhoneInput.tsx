"use client";

import { useMemo } from "react";

/* ─── Country DDI data ─── */
interface Country {
  ddi: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { ddi: "351", flag: "🇵🇹" },
  { ddi: "34",  flag: "🇪🇸" },
  { ddi: "33",  flag: "🇫🇷" },
  { ddi: "49",  flag: "🇩🇪" },
  { ddi: "55",  flag: "🇧🇷" },
  { ddi: "1",   flag: "🇺🇸" },
  { ddi: "44",  flag: "🇬🇧" },
  { ddi: "39",  flag: "🇮🇹" },
  { ddi: "31",  flag: "🇳🇱" },
  { ddi: "32",  flag: "🇧🇪" },
  { ddi: "41",  flag: "🇨🇭" },
  { ddi: "43",  flag: "🇦🇹" },
  { ddi: "45",  flag: "🇩🇰" },
  { ddi: "46",  flag: "🇸🇪" },
  { ddi: "47",  flag: "🇳🇴" },
  { ddi: "358", flag: "🇫🇮" },
  { ddi: "48",  flag: "🇵🇱" },
  { ddi: "420", flag: "🇨🇿" },
  { ddi: "30",  flag: "🇬🇷" },
  { ddi: "353", flag: "🇮🇪" },
  { ddi: "40",  flag: "🇷🇴" },
  { ddi: "36",  flag: "🇭🇺" },
  { ddi: "385", flag: "🇭🇷" },
  { ddi: "90",  flag: "🇹🇷" },
  { ddi: "7",   flag: "🇷🇺" },
  { ddi: "212", flag: "🇲🇦" },
  { ddi: "244", flag: "🇦🇴" },
  { ddi: "258", flag: "🇲🇿" },
  { ddi: "972", flag: "🇮🇱" },
  { ddi: "971", flag: "🇦🇪" },
  { ddi: "966", flag: "🇸🇦" },
  { ddi: "91",  flag: "🇮🇳" },
  { ddi: "86",  flag: "🇨🇳" },
  { ddi: "81",  flag: "🇯🇵" },
  { ddi: "82",  flag: "🇰🇷" },
  { ddi: "61",  flag: "🇦🇺" },
  { ddi: "52",  flag: "🇲🇽" },
  { ddi: "54",  flag: "🇦🇷" },
  { ddi: "56",  flag: "🇨🇱" },
  { ddi: "57",  flag: "🇨🇴" },
  { ddi: "27",  flag: "🇿🇦" },
  { ddi: "234", flag: "🇳🇬" },
  { ddi: "20",  flag: "🇪🇬" },
  { ddi: "66",  flag: "🇹🇭" },
  { ddi: "65",  flag: "🇸🇬" },
  { ddi: "238", flag: "🇨🇻" },
  { ddi: "245", flag: "🇬🇼" },
  { ddi: "380", flag: "🇺🇦" },
  { ddi: "371", flag: "🇱🇻" },
  { ddi: "370", flag: "🇱🇹" },
  { ddi: "372", flag: "🇪🇪" },
  { ddi: "354", flag: "🇮🇸" },
  { ddi: "356", flag: "🇲🇹" },
  { ddi: "357", flag: "🇨🇾" },
  { ddi: "352", flag: "🇱🇺" },
  { ddi: "974", flag: "🇶🇦" },
];

// Sort by DDI length descending so longer matches win (e.g. 351 before 35)
const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => b.ddi.length - a.ddi.length);

/** Detect country flag from raw digits */
function detectFlag(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "🌐";
  for (const c of SORTED_COUNTRIES) {
    if (digits.startsWith(c.ddi)) return c.flag;
  }
  return "🌐";
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
  placeholder,
}: PhoneInputProps) {
  // Detect flag from current value — purely visual, no blocking
  const flag = useMemo(() => detectFlag(value || ""), [value]);

  return (
    <div className="relative">
      {/* Flag indicator — purely visual, not interactive */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pointer-events-none">
        <span className="text-lg leading-none">{flag}</span>
      </div>

      {/* Single unrestricted input */}
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "+351 968 698 138"}
        className="w-full h-[44px] bg-white/[0.06] border border-white/[0.12] rounded-lg pl-11 pr-3 text-[#F5F5F5] text-sm placeholder-[#666] focus:outline-none focus:border-[#F0D030] transition-colors font-mono"
      />
    </div>
  );
}
