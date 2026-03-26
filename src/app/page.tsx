"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail, MapPin, Facebook, Instagram, ExternalLink, ArrowRight, ChevronDown, Crosshair, Radar, Headphones, Radio, BellRing, MessageSquareOff } from "lucide-react";
import Script from "next/script";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";
import { getLandingT, type LandingLang } from "@/lib/landing-translations";
// import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

const LANGS: LandingLang[] = ["PT", "EN", "ES", "FR", "IT"];

/* ─── ATC Flight Radar — all animations via CSS classes, zero JS ─── */
function RadarIllustration() {
  /* Fixed plane positions — first 5 shown on mobile, all 8 on desktop */
  const allPlanes = [
    { cx: 80,  cy: 70,  code: "TP1923", sz: 14, moveCls: "radar-move-1", blipCls: "radar-blip-1", trail: true },
    { cx: 150, cy: 60,  code: "AF1025", sz: 12, moveCls: "radar-move-2", blipCls: "radar-blip-2", trail: true },
    { cx: 170, cy: 110, code: "BA502",  sz: 16, moveCls: "radar-move-3", blipCls: "radar-blip-3", trail: true },
    { cx: 60,  cy: 140, code: "LH1148", sz: 11, moveCls: "radar-move-4", blipCls: "radar-blip-4", trail: true },
    { cx: 130, cy: 160, code: "EK191",  sz: 13, moveCls: "radar-move-5", blipCls: "radar-blip-5", trail: false },
    { cx: 100, cy: 90,  code: "FR8832", sz: 12, moveCls: "",             blipCls: "radar-blip-6", trail: false, desktopOnly: true },
    { cx: 180, cy: 150, code: "QR345",  sz: 14, moveCls: "radar-move-7", blipCls: "radar-blip-7", trail: true, desktopOnly: true },
    { cx: 50,  cy: 100, code: "IB3102", sz: 11, moveCls: "",             blipCls: "radar-blip-8", trail: true, desktopOnly: true },
  ] as const;

  return (
    <div className="relative w-[260px] md:w-[320px] lg:w-[420px] aspect-square select-none mx-auto">
      {/* LIVE indicator */}
      <div className="absolute top-2 right-3 flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F0D030] radar-live" />
        <span className="text-[#F0D030] text-[9px] tracking-[0.15em] uppercase font-mono">LIVE</span>
      </div>

      <svg viewBox="0 0 240 240" className="w-full h-full">
        <defs>
          <radialGradient id="sweepCone">
            <stop offset="0%" stopColor="#F0D030" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F0D030" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blipG">
            <stop offset="0%" stopColor="#F0D030" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F0D030" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric rings */}
        <circle cx="120" cy="120" r="100" fill="none" stroke="#F0D030" strokeWidth="0.5" opacity="0.35" />
        <circle cx="120" cy="120" r="75"  fill="none" stroke="#F0D030" strokeWidth="0.4" opacity="0.25" />
        <circle cx="120" cy="120" r="50"  fill="none" stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <circle cx="120" cy="120" r="25"  fill="none" stroke="#F0D030" strokeWidth="0.3" opacity="0.15" />

        {/* Crosshair */}
        <line x1="20" y1="120" x2="220" y2="120" stroke="#F0D030" strokeWidth="0.3" opacity="0.12" />
        <line x1="120" y1="20" x2="120" y2="220" stroke="#F0D030" strokeWidth="0.3" opacity="0.12" />

        {/* Tick marks every 30° — pre-computed fixed positions */}
        <line x1="217" y1="120" x2="224" y2="120" stroke="#F0D030" strokeWidth="0.7" opacity="0.4" />
        <line x1="204" y1="71"  x2="207" y2="69"  stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="169" y1="35"  x2="170" y2="32"  stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="120" y1="23"  x2="120" y2="16"  stroke="#F0D030" strokeWidth="0.7" opacity="0.4" />
        <line x1="71"  y1="35"  x2="70"  y2="32"  stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="36"  y1="71"  x2="33"  y2="69"  stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="23"  y1="120" x2="16"  y2="120" stroke="#F0D030" strokeWidth="0.7" opacity="0.4" />
        <line x1="36"  y1="169" x2="33"  y2="171" stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="71"  y1="205" x2="70"  y2="208" stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="120" y1="217" x2="120" y2="224" stroke="#F0D030" strokeWidth="0.7" opacity="0.4" />
        <line x1="169" y1="205" x2="170" y2="208" stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />
        <line x1="204" y1="169" x2="207" y2="171" stroke="#F0D030" strokeWidth="0.4" opacity="0.2" />

        {/* Cardinal labels + coordinates */}
        <text x="120" y="14"  textAnchor="middle" fill="#F0D030" opacity="0.5" fontSize="5.5" className="font-mono">N</text>
        <text x="120" y="234" textAnchor="middle" fill="#F0D030" opacity="0.5" fontSize="5.5" className="font-mono">S</text>
        <text x="10"  y="122" textAnchor="middle" fill="#F0D030" opacity="0.5" fontSize="5.5" className="font-mono">W</text>
        <text x="232" y="122" textAnchor="middle" fill="#F0D030" opacity="0.5" fontSize="5.5" className="font-mono">E</text>
        <text x="22"  y="28"  fill="#F0D030" opacity="0.35" fontSize="4.5" className="font-mono">38.7°N</text>
        <text x="185" y="232" fill="#F0D030" opacity="0.35" fontSize="4.5" className="font-mono">9.1°W</text>

        {/* Center: LIS */}
        <circle cx="120" cy="120" r="3" fill="#F0D030" opacity="0.3" />
        <circle cx="120" cy="120" r="1.2" fill="#F0D030" opacity="0.7" />
        <text x="120" y="130" textAnchor="middle" fill="#F0D030" opacity="0.6" fontSize="5" fontWeight="bold" className="font-mono">LIS</text>

        {/* Rotating sweep arm + trail — CSS class only */}
        <g className="radar-sweep">
          <path d="M 120 120 L 220 120 A 100 100 0 0 0 203 68 Z" fill="url(#sweepCone)" />
          <line x1="120" y1="120" x2="220" y2="120" stroke="#F0D030" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Flight blips — 5 on mobile, 8 on desktop */}
        {allPlanes.map((p, i) => (
          <g key={i} className={`${p.moveCls} ${"desktopOnly" in p && p.desktopOnly ? "hidden lg:block" : ""}`}>
            {p.trail && (
              <line x1={p.cx - 8} y1={p.cy - 8} x2={p.cx} y2={p.cy}
                stroke="#F0D030" strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
            )}
            <circle cx={p.cx} cy={p.cy} r={p.sz * 0.35 + 2} fill="url(#blipG)" className={p.blipCls} />
            <text x={p.cx} y={p.cy + p.sz * 0.15} textAnchor="middle"
              fill="#F0D030" opacity="0.9" fontSize={p.sz} className={p.blipCls}>
              ✈
            </text>
            <text x={p.cx + p.sz * 0.35 + 4} y={p.cy - 3}
              fill="#F0D030" opacity="0.4" fontSize="3.8" className="font-mono">
              {p.code}
            </text>
          </g>
        ))}
      </svg>

      {/* Data readout */}
      <div className="absolute -bottom-8 lg:-bottom-10 left-0 right-0 text-center space-y-0.5 lg:space-y-1">
        <p className="text-[#F0D030] text-[8px] lg:text-[10px] tracking-[0.2em] uppercase opacity-80 font-mono">
          MONITORING ACTIVE
        </p>
        <p className="text-[#F0D030] text-[7px] lg:text-[9px] tracking-[0.15em] uppercase opacity-60 font-mono">
          SYNC EVERY 30s
        </p>
      </div>

      {/* Inline keyframes — immune to Tailwind purging */}
      <style dangerouslySetInnerHTML={{ __html: `
        .radar-sweep{transform-origin:120px 120px;animation:_rspin 4s linear infinite}
        .radar-live{animation:_rpulse 2s ease-in-out infinite}
        .radar-blip-1{animation:_rblink 2s ease-in-out infinite}
        .radar-blip-2{animation:_rblink 2.4s ease-in-out infinite .5s}
        .radar-blip-3{animation:_rblink 1.8s ease-in-out infinite 1.2s}
        .radar-blip-4{animation:_rblink 2.6s ease-in-out infinite .8s}
        .radar-blip-5{animation:_rblink 2.2s ease-in-out infinite 1.8s}
        .radar-blip-6{animation:_rblink 3s ease-in-out infinite .3s}
        .radar-blip-7{animation:_rblink 2s ease-in-out infinite 2.5s}
        .radar-blip-8{animation:_rblink 2.8s ease-in-out infinite .9s}
        .radar-move-1{animation:_rmv1 20s linear infinite}
        .radar-move-2{animation:_rmv2 28s linear infinite}
        .radar-move-3{animation:_rmv3 18s linear infinite}
        .radar-move-4{animation:_rmv4 25s linear infinite}
        .radar-move-5{animation:_rmv5 22s linear infinite}
        .radar-move-7{animation:_rmv1 24s linear infinite}
        @keyframes _rspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes _rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes _rblink{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes _rmv1{0%{transform:translate(0,0)}50%{transform:translate(-8px,6px)}100%{transform:translate(0,0)}}
        @keyframes _rmv2{0%{transform:translate(0,0)}50%{transform:translate(7px,8px)}100%{transform:translate(0,0)}}
        @keyframes _rmv3{0%{transform:translate(0,0)}50%{transform:translate(-6px,-10px)}100%{transform:translate(0,0)}}
        @keyframes _rmv4{0%{transform:translate(0,0)}50%{transform:translate(10px,-4px)}100%{transform:translate(0,0)}}
        @keyframes _rmv5{0%{transform:translate(0,0)}50%{transform:translate(-10px,5px)}100%{transform:translate(0,0)}}
      `}} />
    </div>
  );
}
const WA_URL = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

/* ─── Seal image with stamp impact animation ─── */
const SEAL_MAP: Record<string, string> = {
  PT: "/images/selo_br.png",
  EN: "/images/selo_en.png",
  ES: "/images/selo_es.png",
  FR: "/images/selo_fr.png",
  IT: "/images/selo_it.png",
};

function SealImage({ lang: sealLang }: { lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);
  const [ring, setRing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !stamped) {
          setStamped(true);
          setTimeout(() => setRing(true), 350);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [stamped]);

  const src = SEAL_MAP[sealLang] || SEAL_MAP.EN;

  return (
    <div ref={ref} className="flex justify-center mt-10">
      <div className="relative">
        {/* Impact ring */}
        {ring && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[160px] h-[160px] md:w-[220px] md:h-[220px] rounded-full border border-[#F0D030]/40"
              style={{ animation: "stampRing 0.6s ease-out forwards" }} />
          </div>
        )}

        {/* Seal image */}
        <Image
          src={src}
          alt="Selo de Garantia HUB Transfer"
          width={220}
          height={220}
          className="w-[160px] h-auto md:w-[220px]"
          style={{
            opacity: stamped ? 1 : 0,
            transform: stamped ? "scale(1) rotate(-5deg)" : "scale(2) rotate(-15deg)",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease-out",
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes stampRing {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}} />
    </div>
  );
}

/* ─── Fade-in on scroll ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================== */

export default function LandingPage() {
  const [lang, setLang] = useState<LandingLang>("PT");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = getLandingT(lang);

  /* ── Scroll lock when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  /* ── Booking state ── */
  const [bOrigin, setBOrigin] = useState("");
  const [bDest, setBDest] = useState("");
  const [bDate, setBDate] = useState("");
  const [bPax, setBPax] = useState(2);
  const [bPhone, setBPhone] = useState("+351 ");
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const calcRoute = useCallback(() => {
    if (!bOrigin || !bDest) { setRouteInfo(null); return; }
    try {
      const gm = (window as unknown as Record<string, unknown>).google as { maps: { DistanceMatrixService: new () => { getDistanceMatrix: (o: unknown, cb: (r: unknown, s: string) => void) => void }; DistanceMatrixStatus: { OK: string }; TravelMode: { DRIVING: string } } } | undefined;
      if (!gm?.maps) return;
      new gm.maps.DistanceMatrixService().getDistanceMatrix(
        { origins: [bOrigin], destinations: [bDest], travelMode: gm.maps.TravelMode.DRIVING },
        (r: unknown, s: string) => {
          if (s !== gm.maps.DistanceMatrixStatus.OK) return;
          const el = (r as { rows: { elements: { distance: { text: string }; duration: { text: string }; status: string }[] }[] }).rows[0]?.elements[0];
          if (el?.status === "OK") setRouteInfo({ distance: el.distance.text, duration: el.duration.text });
        },
      );
    } catch { /* silent */ }
  }, [bOrigin, bDest]);

  useEffect(() => { if (bOrigin && bDest) { const t = setTimeout(calcRoute, 600); return () => clearTimeout(t); } else { setRouteInfo(null); } }, [bOrigin, bDest, calcRoute]);

  /* ── Google Places init ── */
  useEffect(() => {
    const init = () => {
      const gm = (window as unknown as Record<string, unknown>).google as { maps: { places: { Autocomplete: new (el: HTMLInputElement, o: Record<string, unknown>) => { addListener: (e: string, cb: () => void) => void } } } } | undefined;
      if (!gm?.maps?.places) return;
      const oEl = document.getElementById("drawerOrigin") as HTMLInputElement;
      const dEl = document.getElementById("drawerDest") as HTMLInputElement;
      if (oEl) { const ac = new gm.maps.places.Autocomplete(oEl, { types: ["establishment", "geocode"], componentRestrictions: { country: "pt" } }); ac.addListener("place_changed", () => setBOrigin(oEl.value)); }
      if (dEl) { const ac = new gm.maps.places.Autocomplete(dEl, { types: ["establishment", "geocode"], componentRestrictions: { country: "pt" } }); ac.addListener("place_changed", () => setBDest(dEl.value)); }
    };
    if (drawerOpen) { const iv = setInterval(() => { if ((window as unknown as Record<string, unknown>).google) { init(); clearInterval(iv); } }, 500); return () => clearInterval(iv); }
  }, [drawerOpen]);

  const waBookingUrl = useCallback(() => {
    const msg = `Olá! Quero um orçamento para transfer:\n\n📍 De: ${bOrigin || "—"}\n🏁 Para: ${bDest || "—"}\n${routeInfo ? `📏 ${routeInfo.distance} (~${routeInfo.duration})\n` : ""}📅 Data: ${bDate || "—"}\n👥 Passageiros: ${bPax}\n📱 WhatsApp: ${bPhone}`;
    return `https://wa.me/351968698138?text=${encodeURIComponent(msg)}`;
  }, [bOrigin, bDest, routeInfo, bDate, bPax, bPhone]);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  /* ── Typewriter ── */
  const [typed, setTyped] = useState("");
  const [showHighlight, setShowHighlight] = useState(false);
  const fullText = t.headline;
  useEffect(() => {
    setTyped(""); setShowHighlight(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < fullText.length) { setTyped(fullText.slice(0, i + 1)); i++; }
      else { clearInterval(iv); setTimeout(() => setShowHighlight(true), 300); }
    }, 55);
    return () => clearInterval(iv);
  }, [fullText]);

  /* ── Nav scroll background ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true }); h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ================================================================ */

  return (
    <>
      <Script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBe4UwnVYRP5KAUOtHg3diD6kPTif3VN30&libraries=places" strategy="lazyOnload" />

      <div className="bg-background text-foreground min-h-screen overflow-x-hidden transition-colors duration-300">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  NAVBAR                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/90 backdrop-blur-md" : "bg-transparent"}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
            <a href="#" className="flex-shrink-0">
              <Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-10 w-auto" priority />
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: t.navHow, id: "how" },
                { label: t.navWhy, id: "why" },
                { label: t.navGuarantee, id: "guarantee" },
              ].map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} className="text-[13px] text-[#D0D0D0] hover:text-white transition-colors tracking-wide uppercase cursor-pointer">
                  {l.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {/* Lang */}
              <div className="flex gap-1">
                {LANGS.map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-8 h-6 rounded overflow-hidden border transition-all cursor-pointer ${lang === l ? "border-[#F0D030]/60 opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}>
                    <img src={`/flags/${l.toLowerCase()}.jpg`} alt={l} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button onClick={() => setDrawerOpen(true)}
                className="text-[13px] font-semibold tracking-wider uppercase px-5 py-2 border border-[#F0D030]/30 text-[#F0D030] hover:bg-[#F0D030] hover:text-black transition-all duration-300 cursor-pointer">
                {t.navBook}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden text-[#D0D0D0] cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-background/95 backdrop-blur-md border-t border-foreground/5 overflow-hidden">
                <div className="px-6 py-6 space-y-4">
                  {[{ label: t.navHow, id: "how" }, { label: t.navWhy, id: "why" }, { label: t.navGuarantee, id: "guarantee" }].map((l) => (
                    <button key={l.id} onClick={() => scrollTo(l.id)} className="block text-[#D0D0D0] text-sm tracking-wide uppercase cursor-pointer">{l.label}</button>
                  ))}
                  <div className="flex gap-1 pt-2">
                    {LANGS.map((l) => (
                      <button key={l} onClick={() => { setLang(l); setMenuOpen(false); }}
                        className={`w-8 h-6 rounded overflow-hidden border transition-all cursor-pointer ${lang === l ? "border-[#F0D030]/60 opacity-100" : "border-transparent opacity-40"}`}>
                        <img src={`/flags/${l.toLowerCase()}.jpg`} alt={l} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HERO                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center justify-center">
          <div className="absolute inset-0">
            <img src="/images/hub_dobra1_hero.jpg" alt="Transfer privado no Aeroporto de Lisboa à noite" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-[#0A0A0A]/65" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/40" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-20 pb-32">
            <div className="min-h-[120px] md:min-h-[160px]">
              <h1 className="text-[2.8rem] md:text-[4.5rem] leading-[1.05] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {typed}
                {!showHighlight && <span className="inline-block w-[2px] h-[0.9em] bg-white/80 ml-1 animate-pulse align-middle" />}
              </h1>
              {showHighlight && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="block text-[2.8rem] md:text-[4.5rem] leading-[1.05] font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "#F0D030" }}
                >
                  {t.headlineHighlight}
                </motion.span>
              )}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showHighlight ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8 text-white/90 text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            >
              {t.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showHighlight ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10"
            >
              <button onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 bg-[#F0D030] text-black text-[13px] font-semibold tracking-[0.15em] uppercase px-8 py-4 hover:bg-[#D4B828] transition-colors duration-300 cursor-pointer">
                {t.ctaBook}
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-4 text-[#D0D0D0] text-xs tracking-wide">{t.ctaSupport}</p>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showHighlight ? 0.6 : 0 }}
            transition={{ delay: 2 }}
            whileHover={{ opacity: 1 }}
            onClick={() => scrollTo("stats")}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 mt-4 cursor-pointer"
          >
            <ChevronDown className="w-9 h-9 text-white" style={{ animation: "heroArrow 2s ease-in-out infinite" }} />
          </motion.button>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  SOCIAL PROOF — Human + impactful                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="stats" className="bg-[#1A1A1A]">
          <div className="max-w-2xl mx-auto px-6 py-10 md:py-14 text-center">
            <Reveal>
              <div className="text-5xl md:text-6xl font-extrabold text-[#F0D030] tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>4.387+</div>
              <p className="text-lg md:text-xl text-[#D0D0D0] mt-3 leading-relaxed">{t.socialProofText}</p>
              <div className="flex items-center justify-center gap-2 mt-5">
                <span className="text-[#F0D030] text-xl tracking-widest">★★★★★</span>
                <span className="text-[#B0B0B0] text-sm">{t.socialProofRating}</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  TECHNOLOGY — Radar + sync description                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="how" className="py-16 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-6 items-center">
              {/* Radar — above text on mobile, right side on desktop */}
              <Reveal delay={0.1} className="lg:order-2 mb-4 lg:mb-0">
                <RadarIllustration />
              </Reveal>
              <Reveal className="lg:order-1">
                <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.labelTech}</p>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                  {t.techTitle}
                </h2>
                <p className="text-[#D0D0D0] text-base leading-relaxed mb-8 max-w-lg">{t.algoDesc}</p>
                <div className="space-y-4">
                  {[
                    { icon: <Radio className="w-7 h-7" strokeWidth={1.5} />, text: t.algoFeature1 },
                    { icon: <BellRing className="w-7 h-7" strokeWidth={1.5} />, text: t.algoFeature2 },
                    { icon: <MessageSquareOff className="w-7 h-7" strokeWidth={1.5} />, text: t.algoFeature3 },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                      className="flex items-center gap-3 group"
                    >
                      <div className="text-[#F0D030] group-hover:scale-110 transition-transform duration-200 flex-shrink-0">{f.icon}</div>
                      <span className="text-[#F5F5F5] text-base font-semibold">{f.text}</span>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  PAIN — Asymmetric image + text                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal className="order-2 lg:order-1 lg:pr-20">
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.labelProblem}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {t.painTitle}
              </h2>
              <p className="text-[#D0D0D0] text-base leading-relaxed mb-6">{t.painDesc}</p>
              <p className="text-[#F0D030] text-sm font-medium">{t.painSubtext}</p>
            </Reveal>
            <Reveal delay={0.2} className="order-1 lg:order-2">
              <div className="relative">
                <img src="/images/pessoas.png" alt="Passageiros no aeroporto de Lisboa" className="w-full h-[400px] lg:h-[560px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/60 to-[#0A0A0A]/10" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  WHY US — Image left, text right                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="why" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal>
              <div className="relative">
                <img src="/images/mercedes.png" alt="Mercedes S-Class HUB Transfer em Lisboa" className="w-full h-[400px] lg:h-[560px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A]/40 to-transparent" />
              </div>
            </Reveal>
            <Reveal delay={0.2} className="lg:pl-20">
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.labelFleet}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {t.fleetTitle}
              </h2>
              <p className="text-[#D0D0D0] text-base leading-relaxed mb-8">{t.fleetDesc}</p>
              <div className="space-y-4">
                {[
                  { icon: <Crosshair className="w-7 h-7" strokeWidth={1.5} />, text: t.fleetFeature1 },
                  { icon: <Radar className="w-7 h-7" strokeWidth={1.5} />, text: t.fleetFeature2 },
                  { icon: <Headphones className="w-7 h-7" strokeWidth={1.5} />, text: t.fleetFeature3 },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="text-[#F0D030] group-hover:scale-110 transition-transform duration-200 flex-shrink-0">{f.icon}</div>
                    <span className="text-[#F5F5F5] text-base font-semibold">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  PARTNERS — Discrete scrolling logos                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-10 md:py-14 border-y border-[#2A2A2A] overflow-hidden">
          {/* Title + subtitle */}
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-center mb-8">
            <Reveal>
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-3">{t.partnersLabel}</p>
              <p className="text-[#B0B0B0] text-sm max-w-xl mx-auto">{t.partnersSub}</p>
            </Reveal>
          </div>
          {/* Carousel — hold to pause, release to resume */}
          <div
            className="relative"
            onTouchStart={(e) => { const t = e.currentTarget.querySelector("[data-carousel]") as HTMLElement; if (t) t.style.animationPlayState = "paused"; }}
            onTouchEnd={(e) => { const t = e.currentTarget.querySelector("[data-carousel]") as HTMLElement; if (t) t.style.animationPlayState = "running"; }}
            onMouseDown={(e) => { const t = e.currentTarget.querySelector("[data-carousel]") as HTMLElement; if (t) t.style.animationPlayState = "paused"; }}
            onMouseUp={(e) => { const t = e.currentTarget.querySelector("[data-carousel]") as HTMLElement; if (t) t.style.animationPlayState = "running"; }}
            onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-carousel]") as HTMLElement; if (t) t.style.animationPlayState = "running"; }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
            <div data-carousel="" className="flex items-center w-max gap-7 md:gap-12" style={{ animation: "scroll 35s linear infinite" }}>
              {[...Array(2)].flatMap(() => [
                "tap", "emirates", "british-airways", "lufthansa", "air-france", "klm", "iberia", "swiss", "turkish-airlines", "qatar", "mercedes", "bmw", "marriott", "air-europa", "royal-air-maroc", "aer-lingus", "air-canada", "jet2",
              ]).map((logo, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex items-center justify-center select-none"
                  style={{ height: "52px", width: "auto", WebkitTouchCallout: "none", userSelect: "none" }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div
                    className="h-[44px] md:h-[52px] bg-contain bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url(/logos/${logo}.png)`,
                      width: "80px",
                      minWidth: "60px",
                      transform: "none",
                    }}
                    role="img"
                    aria-label={logo}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lock size — belt and suspenders */}
          <style dangerouslySetInnerHTML={{ __html: `
            [data-carousel] div[role="img"] {
              max-height: 44px !important;
              transform: none !important;
              pointer-events: none;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
            }
            @media (min-width: 768px) {
              [data-carousel] div[role="img"] { max-height: 52px !important; height: 52px !important; width: 100px !important; }
            }
          `}} />
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HOW IT WORKS — 3 steps + image                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal className="lg:pr-20">
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.labelHow}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-10" style={{ fontFamily: "var(--font-display)" }}>
                {t.algoTitle}
              </h2>
              <div className="space-y-10">
                {[
                  { step: "01", title: t.step1Title, desc: t.step1Desc },
                  { step: "02", title: t.step2Title, desc: t.step2Desc },
                  { step: "03", title: t.step3Title, desc: t.step3Desc },
                ].map((s, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="text-[#F0D030]/25 text-4xl font-bold leading-none flex-shrink-0 w-12" style={{ fontFamily: "var(--font-mono)" }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1.5">{s.title}</h3>
                      <p className="text-[#D0D0D0] text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="relative">
                <img src="/images/app.png" alt="Aplicação HUB Transfer com vista de Lisboa" className="w-full h-[400px] lg:h-[520px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/50 to-transparent" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  TESTIMONIALS                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-6 border-t border-[#2A2A2A]">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.labelReviews}</p>
            </Reveal>
            <div className="mt-12 grid md:grid-cols-3 gap-12">
              {[
                { name: "Sarah Mitchell", from: "London, UK", text: t.review1 },
                { name: "Thomas Weber", from: "München, DE", text: t.review2 },
                { name: "Marie Dupont", from: "Paris, FR", text: t.review3 },
              ].map((r, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <article>
                    <p className="text-[#D0D0D0] text-sm leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
                    <div className="mt-5">
                      <p className="text-white text-sm font-medium">{r.name}</p>
                      <p className="text-[#D0D0D0] text-xs">{r.from}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  GUARANTEE — Unified commitment + seal + badges            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="guarantee" className="py-16 md:py-24 px-6" style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%)" }}>
          <div className="max-w-3xl mx-auto text-center">
            {/* Label */}
            <Reveal>
              <p className="text-[#F0D030] text-xs tracking-[0.25em] uppercase font-semibold font-body mb-4">{t.guaranteeBadge}</p>
            </Reveal>

            {/* Title */}
            <Reveal>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {t.commitTitle}
              </h2>
            </Reveal>

            {/* Subtitle */}
            <Reveal delay={0.1}>
              <p className="mt-5 text-[#D0D0D0] text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                {t.guaranteeDesc}
              </p>
            </Reveal>

            {/* Designer seal — changes per language */}
            <Reveal delay={0.2}>
              <SealImage lang={lang} />
            </Reveal>

            {/* 4 checkmarks */}
            <Reveal delay={0.3}>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[t.badgePrice, t.badgePunctual, t.badgeCancel, t.badgeFlight].map((b, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[#F0D030] text-lg mb-1">✓</div>
                    <p className="text-[#D0D0D0] text-xs tracking-wide">{b}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal delay={0.4}>
              <div className="mt-12">
                <button onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#F0D030] text-[#0A0A0A] text-[13px] font-semibold tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#D4B828] transition-colors duration-300 cursor-pointer">
                  {t.ctaBook}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  FOOTER                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <footer className="border-t border-[#2A2A2A] py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <Image src="/images/logo.png" alt="HUB Transfer" width={160} height={50} className="h-12 w-auto mb-3" />
              <p className="text-[#D0D0D0] text-xs leading-relaxed">Transfer and Tourism</p>
              <div className="flex gap-3 mt-4">
                <a href="https://www.facebook.com/hubtransfer" target="_blank" rel="noopener noreferrer" className="text-[#D0D0D0] hover:text-white/80 transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="https://www.instagram.com/hubtransfer" target="_blank" rel="noopener noreferrer" className="text-[#D0D0D0] hover:text-white/80 transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <p className="text-[#D0D0D0] text-xs tracking-wider uppercase mb-4">{lang === "PT" ? "Contacto" : "Contact"}</p>
              <div className="space-y-2 text-[#D0D0D0] text-xs">
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#D0D0D0] transition-colors"><Phone className="w-3 h-3" />{COMPANY.whatsappFormatted}</a>
                <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-[#D0D0D0] transition-colors"><Mail className="w-3 h-3" />{COMPANY.email}</a>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{COMPANY.location}</div>
              </div>
            </div>
            <div>
              <p className="text-[#D0D0D0] text-xs tracking-wider uppercase mb-4">{lang === "PT" ? "Parceiros" : "Partners"}</p>
              <a href="/login" className="text-[#D0D0D0] text-xs hover:text-[#F0D030] transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" />{lang === "PT" ? "Área Reservada" : "Reserved Area"}
              </a>
            </div>
            <div className="md:text-right">
              <p className="text-[#B0B0B0] text-xs leading-relaxed">© 2026 Jornadas e Possibilidades,<br />Unipessoal Lda</p>
            </div>
          </div>
        </footer>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  STICKY BOTTOM CTA                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#F0D030] text-black text-[13px] font-semibold tracking-[0.15em] uppercase py-4 animate-[subtlePulse_3s_ease-in-out_infinite] cursor-pointer"
          >
            {t.ctaBook}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* spacer for sticky button on mobile */}
        <div className="h-16 md:hidden" />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  BOOKING DRAWER                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                <div className="px-6 pb-8 pt-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                      {lang === "PT" ? "Reserve o seu transfer" : "Book your transfer"}
                    </h3>
                    <button onClick={() => setDrawerOpen(false)} className="text-[#D0D0D0] hover:text-white transition-colors cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Origin */}
                    <div>
                      <label className="text-[#D0D0D0] text-xs tracking-wider uppercase block mb-1.5">📍 {lang === "PT" ? "Origem" : "From"}</label>
                      <div className="flex gap-2 mb-1.5">
                        <button type="button" onClick={() => setBOrigin("Aeroporto de Lisboa (LIS), Lisboa, Portugal")}
                          className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer ${bOrigin.includes("Aeroporto") ? "border-[#F0D030]/40 text-[#F0D030]" : "border-[#2A2A2A] text-[#D0D0D0] hover:text-white/80"}`}>
                          Aeroporto de Lisboa
                        </button>
                      </div>
                      <input id="drawerOrigin" type="text" value={bOrigin} onChange={(e) => setBOrigin(e.target.value)}
                        placeholder={lang === "PT" ? "Endereço..." : "Address..."}
                        className="w-full h-11 bg-white/5 border-b border-[#2A2A2A] px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F0D030]/40 transition-colors" />
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="text-[#D0D0D0] text-xs tracking-wider uppercase block mb-1.5">🏁 {lang === "PT" ? "Destino" : "To"}</label>
                      <div className="flex gap-2 mb-1.5 flex-wrap">
                        {[
                          { l: "Aeroporto", v: "Aeroporto de Lisboa (LIS), Lisboa, Portugal" },
                          { l: "Cascais", v: "Cascais, Portugal" },
                          { l: "Sintra", v: "Sintra, Portugal" },
                        ].map((q) => (
                          <button key={q.l} type="button" onClick={() => setBDest(q.v)}
                            className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer ${bDest === q.v ? "border-[#F0D030]/40 text-[#F0D030]" : "border-[#2A2A2A] text-[#D0D0D0] hover:text-white/80"}`}>
                            {q.l}
                          </button>
                        ))}
                      </div>
                      <input id="drawerDest" type="text" value={bDest} onChange={(e) => setBDest(e.target.value)}
                        placeholder={lang === "PT" ? "Endereço..." : "Address..."}
                        className="w-full h-11 bg-white/5 border-b border-[#2A2A2A] px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F0D030]/40 transition-colors" />
                    </div>

                    {/* Date + Pax */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#D0D0D0] text-xs tracking-wider uppercase block mb-1.5">{lang === "PT" ? "Data" : "Date"}</label>
                        <input type="date" value={bDate} onChange={(e) => setBDate(e.target.value)}
                          className="w-full h-11 bg-white/5 border-b border-[#2A2A2A] px-0 text-white text-sm focus:outline-none focus:border-[#F0D030]/40 [color-scheme:dark] transition-colors" />
                      </div>
                      <div>
                        <label className="text-[#D0D0D0] text-xs tracking-wider uppercase block mb-1.5">{lang === "PT" ? "Passageiros" : "Passengers"}</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button key={n} type="button" onClick={() => setBPax(n)}
                              className={`flex-1 h-11 text-sm font-medium transition-colors cursor-pointer ${bPax === n ? "bg-[#F0D030] text-black" : "bg-white/5 text-[#D0D0D0] hover:text-white/80"}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-[#D0D0D0] text-xs tracking-wider uppercase block mb-1.5">WhatsApp</label>
                      <input type="tel" value={bPhone} onChange={(e) => setBPhone(e.target.value)}
                        className="w-full h-11 bg-white/5 border-b border-[#2A2A2A] px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F0D030]/40 transition-colors" />
                    </div>

                    {/* Route info */}
                    {routeInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="flex justify-center gap-10 py-3">
                        <div className="text-center">
                          <div className="text-[#F0D030] text-xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{routeInfo.distance}</div>
                          <div className="text-[#D0D0D0] text-xs mt-0.5">{lang === "PT" ? "Distância" : "Distance"}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#F0D030] text-xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>~{routeInfo.duration}</div>
                          <div className="text-[#D0D0D0] text-xs mt-0.5">{lang === "PT" ? "Tempo" : "Time"}</div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <a href={waBookingUrl()} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 bg-[#F0D030] text-black text-[13px] font-semibold tracking-[0.12em] uppercase hover:bg-[#D4B828] transition-colors">
                      {lang === "PT" ? "Solicitar orçamento" : "Request quote"}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <p className="text-center text-[#D0D0D0] text-xs">{lang === "PT" ? "Resposta em menos de 5 minutos" : "Response in under 5 minutes"}</p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* WhatsApp float (desktop) */}
        <a href={WA_URL} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#25d366] hidden md:flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </>
  );
}
