"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Mail, MapPin, Facebook, Instagram, ExternalLink, ArrowRight, ChevronDown } from "lucide-react";
import Script from "next/script";
import { COMPANY } from "@/lib/constants";
import { getLandingT, type LandingLang } from "@/lib/landing-translations";
// import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

const LANGS: LandingLang[] = ["PT", "EN", "ES", "FR", "IT"];

/* ─── ATC Flight Radar — all animations via CSS classes, zero JS ─── */
function RadarIllustration() {
  /* Fixed plane positions: x/y as SVG coords in 240x240 viewBox */
  const planes = [
    { cx: 80,  cy: 70,  code: "TP1923", sz: 14, moveCls: "radar-move-1", blipCls: "radar-blip-1", trail: true },
    { cx: 150, cy: 60,  code: "AF1025", sz: 12, moveCls: "radar-move-2", blipCls: "radar-blip-2", trail: true },
    { cx: 170, cy: 110, code: "BA502",  sz: 16, moveCls: "radar-move-3", blipCls: "radar-blip-3", trail: true },
    { cx: 60,  cy: 140, code: "LH1148", sz: 11, moveCls: "radar-move-4", blipCls: "radar-blip-4", trail: true },
    { cx: 130, cy: 160, code: "EK191",  sz: 13, moveCls: "radar-move-5", blipCls: "radar-blip-5", trail: false },
    { cx: 100, cy: 90,  code: "FR8832", sz: 12, moveCls: "",             blipCls: "radar-blip-6", trail: false },
    { cx: 180, cy: 150, code: "QR345",  sz: 14, moveCls: "radar-move-7", blipCls: "radar-blip-7", trail: true },
    { cx: 50,  cy: 100, code: "IB3102", sz: 11, moveCls: "",             blipCls: "radar-blip-8", trail: true },
  ];

  return (
    <div className="relative w-[420px] aspect-square select-none">
      {/* LIVE indicator */}
      <div className="absolute top-2 right-3 flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] radar-live" />
        <span className="text-[#F5C518] text-[9px] tracking-[0.15em] uppercase font-mono">LIVE</span>
      </div>

      <svg viewBox="0 0 240 240" className="w-full h-full">
        <defs>
          <radialGradient id="sweepCone">
            <stop offset="0%" stopColor="#F5C518" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blipG">
            <stop offset="0%" stopColor="#F5C518" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric rings */}
        <circle cx="120" cy="120" r="100" fill="none" stroke="#F5C518" strokeWidth="0.5" opacity="0.35" />
        <circle cx="120" cy="120" r="75"  fill="none" stroke="#F5C518" strokeWidth="0.4" opacity="0.25" />
        <circle cx="120" cy="120" r="50"  fill="none" stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <circle cx="120" cy="120" r="25"  fill="none" stroke="#F5C518" strokeWidth="0.3" opacity="0.15" />

        {/* Crosshair */}
        <line x1="20" y1="120" x2="220" y2="120" stroke="#F5C518" strokeWidth="0.3" opacity="0.12" />
        <line x1="120" y1="20" x2="120" y2="220" stroke="#F5C518" strokeWidth="0.3" opacity="0.12" />

        {/* Tick marks every 30° — pre-computed fixed positions */}
        <line x1="217" y1="120" x2="224" y2="120" stroke="#F5C518" strokeWidth="0.7" opacity="0.4" />
        <line x1="204" y1="71"  x2="207" y2="69"  stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="169" y1="35"  x2="170" y2="32"  stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="120" y1="23"  x2="120" y2="16"  stroke="#F5C518" strokeWidth="0.7" opacity="0.4" />
        <line x1="71"  y1="35"  x2="70"  y2="32"  stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="36"  y1="71"  x2="33"  y2="69"  stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="23"  y1="120" x2="16"  y2="120" stroke="#F5C518" strokeWidth="0.7" opacity="0.4" />
        <line x1="36"  y1="169" x2="33"  y2="171" stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="71"  y1="205" x2="70"  y2="208" stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="120" y1="217" x2="120" y2="224" stroke="#F5C518" strokeWidth="0.7" opacity="0.4" />
        <line x1="169" y1="205" x2="170" y2="208" stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />
        <line x1="204" y1="169" x2="207" y2="171" stroke="#F5C518" strokeWidth="0.4" opacity="0.2" />

        {/* Cardinal labels + coordinates */}
        <text x="120" y="14"  textAnchor="middle" fill="#F5C518" opacity="0.5" fontSize="5.5" className="font-mono">N</text>
        <text x="120" y="234" textAnchor="middle" fill="#F5C518" opacity="0.5" fontSize="5.5" className="font-mono">S</text>
        <text x="10"  y="122" textAnchor="middle" fill="#F5C518" opacity="0.5" fontSize="5.5" className="font-mono">W</text>
        <text x="232" y="122" textAnchor="middle" fill="#F5C518" opacity="0.5" fontSize="5.5" className="font-mono">E</text>
        <text x="22"  y="28"  fill="#F5C518" opacity="0.35" fontSize="4.5" className="font-mono">38.7°N</text>
        <text x="185" y="232" fill="#F5C518" opacity="0.35" fontSize="4.5" className="font-mono">9.1°W</text>

        {/* Center: LIS */}
        <circle cx="120" cy="120" r="3" fill="#F5C518" opacity="0.3" />
        <circle cx="120" cy="120" r="1.2" fill="#F5C518" opacity="0.7" />
        <text x="120" y="130" textAnchor="middle" fill="#F5C518" opacity="0.6" fontSize="5" fontWeight="bold" className="font-mono">LIS</text>

        {/* Rotating sweep arm + trail — CSS class only */}
        <g className="radar-sweep">
          <path d="M 120 120 L 220 120 A 100 100 0 0 0 203 68 Z" fill="url(#sweepCone)" />
          <line x1="120" y1="120" x2="220" y2="120" stroke="#F5C518" strokeWidth="1" opacity="0.6" />
        </g>

        {/* 8 flight blips — fixed SVG coords, CSS class animations */}
        {planes.map((p, i) => (
          <g key={i} className={p.moveCls}>
            {p.trail && (
              <line x1={p.cx - 8} y1={p.cy - 8} x2={p.cx} y2={p.cy}
                stroke="#F5C518" strokeWidth="0.4" opacity="0.2" strokeDasharray="2 2" />
            )}
            <circle cx={p.cx} cy={p.cy} r={p.sz * 0.35 + 2} fill="url(#blipG)" className={p.blipCls} />
            <text x={p.cx} y={p.cy + p.sz * 0.15} textAnchor="middle"
              fill="#F5C518" opacity="0.9" fontSize={p.sz} className={p.blipCls}>
              ✈
            </text>
            <text x={p.cx + p.sz * 0.35 + 4} y={p.cy - 3}
              fill="#F5C518" opacity="0.4" fontSize="3.8" className="font-mono">
              {p.code}
            </text>
          </g>
        ))}
      </svg>

      {/* Data readout */}
      <div className="absolute -bottom-10 left-0 right-0 text-center space-y-1">
        <p className="text-[#F5C518] text-[10px] tracking-[0.2em] uppercase opacity-80 font-mono">
          MONITORING ACTIVE
        </p>
        <p className="text-[#F5C518] text-[9px] tracking-[0.15em] uppercase opacity-60 font-mono">
          SYNC EVERY 30s
        </p>
      </div>
    </div>
  );
}
const WA_URL = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

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
            <a href="#" className="text-xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)", color: "#F5C518" }}>
              HUB Transfer
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: t.navHow, id: "how" },
                { label: t.navWhy, id: "why" },
                { label: t.navGuarantee, id: "guarantee" },
              ].map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} className="text-[13px] text-[#E5E5E5] hover:text-white transition-colors tracking-wide uppercase cursor-pointer">
                  {l.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {/* Lang */}
              <div className="flex gap-1">
                {LANGS.map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-8 h-6 rounded overflow-hidden border transition-all cursor-pointer ${lang === l ? "border-[#F5C518]/60 opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}>
                    <img src={`/flags/${l.toLowerCase()}.jpg`} alt={l} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button onClick={() => setDrawerOpen(true)}
                className="text-[13px] font-semibold tracking-wider uppercase px-5 py-2 border border-[#F5C518]/30 text-[#F5C518] hover:bg-[#F5C518] hover:text-black transition-all duration-300 cursor-pointer">
                {t.navBook}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden text-[#E5E5E5] cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-background/95 backdrop-blur-md border-t border-foreground/5 overflow-hidden">
                <div className="px-6 py-6 space-y-4">
                  {[{ label: t.navHow, id: "how" }, { label: t.navWhy, id: "why" }, { label: t.navGuarantee, id: "guarantee" }].map((l) => (
                    <button key={l.id} onClick={() => scrollTo(l.id)} className="block text-[#E5E5E5] text-sm tracking-wide uppercase cursor-pointer">{l.label}</button>
                  ))}
                  <div className="flex gap-1 pt-2">
                    {LANGS.map((l) => (
                      <button key={l} onClick={() => { setLang(l); setMenuOpen(false); }}
                        className={`w-8 h-6 rounded overflow-hidden border transition-all cursor-pointer ${lang === l ? "border-[#F5C518]/60 opacity-100" : "border-transparent opacity-40"}`}>
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
            <img src="/images/hub_dobra1_hero.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/65" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-20 pb-32">
            <div className="min-h-[120px] md:min-h-[160px]">
              <h1 className="text-[2.8rem] md:text-[4.5rem] leading-[1.05] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {typed}
                {!showHighlight && <span className="inline-block w-[2px] h-[0.9em] bg-white/80 ml-1 animate-pulse align-middle" />}
              </h1>
              {showHighlight && (
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-[2.8rem] md:text-[4.5rem] leading-[1.05] font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "#F5C518" }}
                >
                  {t.headlineHighlight}
                </motion.h1>
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
                className="inline-flex items-center gap-2 bg-[#F5C518] text-black text-[13px] font-semibold tracking-[0.15em] uppercase px-8 py-4 hover:bg-[#d4a817] transition-colors duration-300 cursor-pointer">
                {t.ctaBook}
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-4 text-[#E5E5E5] text-xs tracking-wide">{t.ctaSupport}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showHighlight ? 0.4 : 0 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: "2s" }} />
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  SOCIAL PROOF — Numbers strip                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="border-y border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { n: "4.387", l: lang === "PT" ? "Clientes satisfeitos" : "Happy clients" },
              { n: "99.8%", l: lang === "PT" ? "Pontualidade" : "Punctuality" },
              { n: "0 min", l: lang === "PT" ? "Tempo de espera" : "Wait time" },
              { n: "24/7", l: lang === "PT" ? "Suporte disponível" : "Support available" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#F5C518] tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>{s.n}</div>
                <div className="text-[#E5E5E5] text-xs tracking-wider uppercase mt-1">{s.l}</div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  TECHNOLOGY — Radar + sync description                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="how" className="py-28 md:py-40 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
              <Reveal>
                <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "Tecnologia" : "Technology"}</p>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                  {lang === "PT" ? "Sincronização aérea a cada 30 segundos." : "Flight sync every 30 seconds."}
                </h2>
                <p className="text-[#E5E5E5] text-base leading-relaxed mb-8 max-w-lg">{t.algoDesc}</p>
                <div className="space-y-5">
                  {[t.algoFeature1, t.algoFeature2, t.algoFeature3].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-px h-4 bg-[#F5C518]" />
                      <span className="text-[#E5E5E5] text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.2} className="hidden lg:block">
                <RadarIllustration />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  PAIN — Asymmetric image + text                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-40">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal className="order-2 lg:order-1 lg:pr-20">
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "O problema" : "The problem"}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {t.painTitle}
              </h2>
              <p className="text-[#E5E5E5] text-base leading-relaxed mb-6">{t.painDesc}</p>
              <p className="text-[#F5C518] text-sm font-medium">{t.painSubtext}</p>
            </Reveal>
            <Reveal delay={0.2} className="order-1 lg:order-2">
              <div className="relative">
                <img src="/images/hub_dobra2_dor.jpg" alt="" className="w-full h-[400px] lg:h-[560px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  FLEET — Image left, text right                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-40">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal>
              <div className="relative">
                <img src="/images/hub_dobra4_carro.jpg" alt="" className="w-full h-[400px] lg:h-[560px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
              </div>
            </Reveal>
            <Reveal delay={0.2} className="lg:pl-20">
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "A frota" : "The fleet"}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {t.fleetTitle}
              </h2>
              <p className="text-[#E5E5E5] text-base leading-relaxed mb-8">{t.fleetDesc}</p>
              <div className="space-y-4">
                {[t.fleetFeature1, t.fleetFeature2, t.fleetFeature3].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-px h-4 bg-[#F5C518]" />
                    <span className="text-[#E5E5E5] text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  PARTNERS — Discrete scrolling logos                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 border-y border-white/5 overflow-hidden">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
            <div className="flex animate-[scroll_50s_linear_infinite] gap-16 items-center w-max">
              {[...Array(2)].flatMap(() => [
                "tap", "emirates", "british-airways", "lufthansa", "air-france", "klm", "iberia", "swiss", "turkish-airlines", "qatar", "mercedes", "bmw", "marriott", "air-europa", "royal-air-maroc", "aer-lingus", "air-canada", "jet2",
              ]).map((logo, i) => (
                <div key={i} className="flex-shrink-0 w-20 h-10 md:w-28 md:h-14 flex items-center justify-center opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <img src={`/logos/${logo}.png`} alt="" className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all duration-300" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HOW IT WORKS — 3 steps + image                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-40 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
            <Reveal className="lg:pr-20">
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "Como funciona" : "How it works"}</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-10" style={{ fontFamily: "var(--font-display)" }}>
                {t.algoTitle || (lang === "PT" ? "Não é mágica. É monitoramento." : "Not magic. Monitoring.")}
              </h2>
              <div className="space-y-10">
                {[
                  { step: "01", title: lang === "PT" ? "Reserve em 2 minutos" : "Book in 2 minutes", desc: lang === "PT" ? "Informe o seu voo e destino. Nós tratamos do resto." : "Enter your flight and destination. We handle the rest." },
                  { step: "02", title: lang === "PT" ? "Monitoramos o seu voo" : "We track your flight", desc: lang === "PT" ? "O nosso sistema acompanha o seu voo em tempo real. Atrasos? Já sabemos." : "Our system follows your flight in real-time. Delays? We already know." },
                  { step: "03", title: lang === "PT" ? "Motorista à sua espera" : "Driver waiting for you", desc: lang === "PT" ? "Desembarca e o seu motorista já está lá. Sem filas. Sem stress." : "You land and your driver is already there. No queues. No stress." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="text-[#F5C518]/25 text-4xl font-bold leading-none flex-shrink-0 w-12" style={{ fontFamily: "var(--font-mono)" }}>{s.step}</div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1.5">{s.title}</h3>
                      <p className="text-[#E5E5E5] text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="relative">
                <img src="/images/hub_dobra3_algoritmo.jpg" alt="" className="w-full h-[400px] lg:h-[520px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  WHY — 4 reasons, minimal                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="why" className="py-28 md:py-40 px-6">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "Porquê nós" : "Why us"}</p>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight max-w-lg" style={{ fontFamily: "var(--font-display)" }}>
                {t.whyTitle}
              </h2>
            </Reveal>

            <div className="mt-20 grid md:grid-cols-2 gap-x-16 gap-y-14">
              {[
                { title: t.whyReason1Title, desc: t.whyReason1Desc },
                { title: t.whyReason2Title, desc: t.whyReason2Desc },
                { title: t.whyReason3Title, desc: t.whyReason3Desc },
                { title: t.whyReason4Title, desc: t.whyReason4Desc },
              ].map((r, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="flex gap-5">
                    <div className="text-[#F5C518]/20 text-3xl font-bold leading-none flex-shrink-0 w-10" style={{ fontFamily: "var(--font-mono)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-2">{r.title}</h3>
                      <p className="text-[#E5E5E5] text-sm leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  TESTIMONIALS                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="py-28 md:py-40 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{lang === "PT" ? "Avaliações" : "Reviews"}</p>
            </Reveal>
            <div className="mt-12 grid md:grid-cols-3 gap-12">
              {[
                { name: "Sarah Mitchell", from: "London, UK", text: lang === "PT" ? "O meu voo atrasou 3 horas e quando desembarquei o motorista já estava à minha espera. Incrível." : "My flight was delayed 3 hours and when I landed the driver was already waiting. Incredible." },
                { name: "Thomas Weber", from: "München, DE", text: lang === "PT" ? "Serviço pontual e profissional. O melhor transfer que já usei em Portugal." : "Punctual and professional service. Best transfer I've used in Portugal." },
                { name: "Marie Dupont", from: "Paris, FR", text: lang === "PT" ? "Reservei às 23h e às 23h02 já tinha confirmação. E o motorista foi impecável." : "I booked at 11pm and at 11:02pm I already had confirmation. And the driver was impeccable." },
              ].map((r, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <p className="text-[#E5E5E5] text-sm leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
                  <div className="mt-5">
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-[#E5E5E5] text-xs">{r.from}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  GUARANTEE                                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="guarantee" className="py-28 md:py-40 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <p className="text-[#F5C518] text-xs tracking-[0.25em] uppercase mb-4">{t.guaranteeBadge}</p>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {t.guaranteeTitle}
              </h2>
              <p className="mt-6 text-[#E5E5E5] text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                {t.guaranteeDesc}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { l: lang === "PT" ? "Preço fixo" : "Fixed price" },
                  { l: lang === "PT" ? "Sempre pontual" : "Always on time" },
                  { l: lang === "PT" ? "Cancelamento grátis" : "Free cancellation" },
                  { l: lang === "PT" ? "Voo monitorizado" : "Flight tracked" },
                ].map((b, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[#F5C518] text-lg mb-1">✓</div>
                    <p className="text-[#E5E5E5] text-xs tracking-wide">{b.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-14">
                <button onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#F5C518] text-black text-[13px] font-semibold tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#d4a817] transition-colors duration-300 cursor-pointer">
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
        <footer className="border-t border-white/5 py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: "#F5C518" }}>HUB Transfer</div>
              <p className="text-[#E5E5E5] text-xs leading-relaxed">Transfer and Tourism</p>
              <div className="flex gap-3 mt-4">
                <a href="https://www.facebook.com/hubtransfer" target="_blank" rel="noopener noreferrer" className="text-[#E5E5E5] hover:text-white/80 transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="https://www.instagram.com/hubtransfer" target="_blank" rel="noopener noreferrer" className="text-[#E5E5E5] hover:text-white/80 transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <p className="text-[#E5E5E5] text-xs tracking-wider uppercase mb-4">{lang === "PT" ? "Contacto" : "Contact"}</p>
              <div className="space-y-2 text-[#E5E5E5] text-xs">
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#E5E5E5] transition-colors"><Phone className="w-3 h-3" />{COMPANY.whatsappFormatted}</a>
                <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-[#E5E5E5] transition-colors"><Mail className="w-3 h-3" />{COMPANY.email}</a>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{COMPANY.location}</div>
              </div>
            </div>
            <div>
              <p className="text-[#E5E5E5] text-xs tracking-wider uppercase mb-4">{lang === "PT" ? "Parceiros" : "Partners"}</p>
              <a href="/login" className="text-[#E5E5E5] text-xs hover:text-[#F5C518] transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" />{lang === "PT" ? "Área Reservada" : "Reserved Area"}
              </a>
            </div>
            <div className="md:text-right">
              <p className="text-[#999] text-xs leading-relaxed">© 2026 Jornadas e Possibilidades,<br />Unipessoal Lda</p>
            </div>
          </div>
        </footer>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  STICKY BOTTOM CTA                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#F5C518] text-black text-[13px] font-semibold tracking-[0.15em] uppercase py-4 animate-[subtlePulse_3s_ease-in-out_infinite] cursor-pointer"
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
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
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
                    <button onClick={() => setDrawerOpen(false)} className="text-[#E5E5E5] hover:text-white transition-colors cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Origin */}
                    <div>
                      <label className="text-[#E5E5E5] text-xs tracking-wider uppercase block mb-1.5">📍 {lang === "PT" ? "Origem" : "From"}</label>
                      <div className="flex gap-2 mb-1.5">
                        <button type="button" onClick={() => setBOrigin("Aeroporto de Lisboa (LIS), Lisboa, Portugal")}
                          className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer ${bOrigin.includes("Aeroporto") ? "border-[#F5C518]/40 text-[#F5C518]" : "border-white/10 text-[#E5E5E5] hover:text-white/80"}`}>
                          Aeroporto de Lisboa
                        </button>
                      </div>
                      <input id="drawerOrigin" type="text" value={bOrigin} onChange={(e) => setBOrigin(e.target.value)}
                        placeholder={lang === "PT" ? "Endereço..." : "Address..."}
                        className="w-full h-11 bg-white/5 border-b border-white/10 px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F5C518]/40 transition-colors" />
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="text-[#E5E5E5] text-xs tracking-wider uppercase block mb-1.5">🏁 {lang === "PT" ? "Destino" : "To"}</label>
                      <div className="flex gap-2 mb-1.5 flex-wrap">
                        {[
                          { l: "Aeroporto", v: "Aeroporto de Lisboa (LIS), Lisboa, Portugal" },
                          { l: "Cascais", v: "Cascais, Portugal" },
                          { l: "Sintra", v: "Sintra, Portugal" },
                        ].map((q) => (
                          <button key={q.l} type="button" onClick={() => setBDest(q.v)}
                            className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer ${bDest === q.v ? "border-[#F5C518]/40 text-[#F5C518]" : "border-white/10 text-[#E5E5E5] hover:text-white/80"}`}>
                            {q.l}
                          </button>
                        ))}
                      </div>
                      <input id="drawerDest" type="text" value={bDest} onChange={(e) => setBDest(e.target.value)}
                        placeholder={lang === "PT" ? "Endereço..." : "Address..."}
                        className="w-full h-11 bg-white/5 border-b border-white/10 px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F5C518]/40 transition-colors" />
                    </div>

                    {/* Date + Pax */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#E5E5E5] text-xs tracking-wider uppercase block mb-1.5">{lang === "PT" ? "Data" : "Date"}</label>
                        <input type="date" value={bDate} onChange={(e) => setBDate(e.target.value)}
                          className="w-full h-11 bg-white/5 border-b border-white/10 px-0 text-white text-sm focus:outline-none focus:border-[#F5C518]/40 [color-scheme:dark] transition-colors" />
                      </div>
                      <div>
                        <label className="text-[#E5E5E5] text-xs tracking-wider uppercase block mb-1.5">{lang === "PT" ? "Passageiros" : "Passengers"}</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button key={n} type="button" onClick={() => setBPax(n)}
                              className={`flex-1 h-11 text-sm font-medium transition-colors cursor-pointer ${bPax === n ? "bg-[#F5C518] text-black" : "bg-white/5 text-[#E5E5E5] hover:text-white/80"}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-[#E5E5E5] text-xs tracking-wider uppercase block mb-1.5">WhatsApp</label>
                      <input type="tel" value={bPhone} onChange={(e) => setBPhone(e.target.value)}
                        className="w-full h-11 bg-white/5 border-b border-white/10 px-0 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F5C518]/40 transition-colors" />
                    </div>

                    {/* Route info */}
                    {routeInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="flex justify-center gap-10 py-3">
                        <div className="text-center">
                          <div className="text-[#F5C518] text-xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{routeInfo.distance}</div>
                          <div className="text-[#E5E5E5] text-xs mt-0.5">{lang === "PT" ? "Distância" : "Distance"}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#F5C518] text-xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>~{routeInfo.duration}</div>
                          <div className="text-[#E5E5E5] text-xs mt-0.5">{lang === "PT" ? "Tempo" : "Time"}</div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <a href={waBookingUrl()} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 bg-[#F5C518] text-black text-[13px] font-semibold tracking-[0.12em] uppercase hover:bg-[#d4a817] transition-colors">
                      {lang === "PT" ? "Solicitar orçamento" : "Request quote"}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <p className="text-center text-[#E5E5E5] text-xs">{lang === "PT" ? "Resposta em menos de 5 minutos" : "Response in under 5 minutes"}</p>
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
