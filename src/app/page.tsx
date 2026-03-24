"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Clock,
  Radar,
  MessageCircle,
  Car,
  Shield,
  Headphones,
  Brain,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { getLandingT, type LandingLang } from "@/lib/landing-translations";

// ─── Constants ───
const LANGUAGES: LandingLang[] = ["PT", "EN", "ES", "FR", "IT"];
const WHATSAPP_URL = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

// ─── Typewriter Hook ───
function useTypewriter(text: string, speed = 60, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

// ─── Concentric Pulse Animation (CSS only, no images) ───
function BrainVisualization() {
  return (
    <div className="relative flex items-center justify-center h-64 md:h-80">
      {[1, 2, 3, 4].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-[#F5C518]"
          style={{
            width: ring * 80,
            height: ring * 80,
            opacity: 0.15 + (0.12 / ring),
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.15 + 0.12 / ring, 0.3 / ring, 0.15 + 0.12 / ring],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: ring * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.div
        className="relative z-10 w-16 h-16 rounded-full bg-[#F5C518]/20 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain className="w-8 h-8 text-[#F5C518]" />
      </motion.div>
    </div>
  );
}

// ─── Section Wrapper ───
function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      className={`relative px-6 md:px-12 lg:px-24 py-20 md:py-32 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

// ─── Main Page ───
export default function Home() {
  const [lang, setLang] = useState<LandingLang>("PT");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const t = getLandingT(lang);

  // Track scroll for navbar style
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Typewriter for hero
  const line1 = useTypewriter(t.headline, 55, 400);
  const line2 = useTypewriter(t.headlineHighlight, 55, 400 + t.headline.length * 55 + 400);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ─── NAVBAR ───
  const Navbar = (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-[#F5C518]/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20 px-6 md:px-12 lg:px-24">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-[var(--font-display)] text-xl md:text-2xl font-bold tracking-tight text-gradient-gold cursor-pointer"
          style={{ fontFamily: "var(--font-display)" }}
        >
          HUB Transfer
        </button>

        {/* Center nav — desktop */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo("how-it-works")}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.navHow}
          </button>
          <button
            onClick={() => scrollTo("why-us")}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.navWhy}
          </button>
          <button
            onClick={() => scrollTo("guarantee")}
            className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.navGuarantee}
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language selector — desktop with flags */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  lang === l
                    ? "bg-[#F5C518] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <img
                  src={`/flags/${l.toLowerCase()}.jpg`}
                  alt={l}
                  className="w-4 h-3 rounded-sm object-cover"
                />
                {l}
              </button>
            ))}
          </div>

          {/* CTA button */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex bg-[#F5C518] text-black font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#D4A017] transition-colors"
          >
            {t.navBook}
          </a>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-b border-[#F5C518]/10 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-4">
              <button
                onClick={() => scrollTo("how-it-works")}
                className="block w-full text-left text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {t.navHow}
              </button>
              <button
                onClick={() => scrollTo("why-us")}
                className="block w-full text-left text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {t.navWhy}
              </button>
              <button
                onClick={() => scrollTo("guarantee")}
                className="block w-full text-left text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {t.navGuarantee}
              </button>

              {/* Language selector — mobile with flags */}
              <div className="flex items-center gap-2 pt-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      lang === l
                        ? "bg-[#F5C518] text-black"
                        : "text-gray-400 bg-white/5 hover:text-white"
                    }`}
                  >
                    <img
                      src={`/flags/${l.toLowerCase()}.jpg`}
                      alt={l}
                      className="w-5 h-3.5 rounded-sm object-cover"
                    />
                    {l}
                  </button>
                ))}
              </div>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#F5C518] text-black font-bold text-sm px-6 py-3 rounded-full hover:bg-[#D4A017] transition-colors mt-4"
              >
                {t.navBook}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );

  // ─── HERO ───
  const Hero = (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background image: airport at night */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/hub_dobra1_hero.jpg)" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />
      {/* Gold vignette at bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,197,24,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto pt-20">
        {/* Headline with typewriter */}
        <div className="min-h-[180px] md:min-h-[220px] flex flex-col items-center justify-center">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {line1.displayed}
            {!line1.done && (
              <span className="inline-block w-[3px] h-[1em] bg-white ml-1 animate-pulse align-middle" />
            )}
          </h1>
          {line1.done && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-[#F5C518] mt-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {line2.displayed}
              {!line2.done && (
                <span className="inline-block w-[3px] h-[1em] bg-[#F5C518] ml-1 animate-pulse align-middle" />
              )}
            </motion.h1>
          )}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: line2.done ? 1 : 0, y: line2.done ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          {t.subheadline}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: line2.done ? 1 : 0, y: line2.done ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F5C518] text-black font-bold text-sm md:text-base px-8 md:px-10 py-4 rounded-full uppercase tracking-wider hover:bg-[#D4A017] hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,197,24,0.2)]"
          >
            {t.ctaBook}
          </a>
          <span className="text-gray-500 text-sm">{t.ctaSupport}</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: line2.done ? 1 : 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-[#F5C518]/60" />
        </motion.div>
      </motion.div>
    </section>
  );

  // ─── PAIN SECTION ───
  const PainSection = (
    <Section id="pain" className="bg-black">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Text */}
        <div>
          <h2
            className="text-3xl md:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.painTitle}
          </h2>
          <p className="mt-6 text-gray-400 text-lg leading-relaxed">
            {t.painDesc}
          </p>
          <p className="mt-4 text-[#F5C518] font-semibold text-lg">
            {t.painSubtext}
          </p>
        </div>

        {/* Image: taxi queue chaos */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden border border-[#F5C518]/10"
        >
          <img
            src="/images/hub_dobra2_dor.jpg"
            alt="Taxi queue chaos"
            className="w-full h-72 md:h-96 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Stats overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-around text-center">
            {[
              { value: "< 3 min", label: lang === "PT" ? "Espera" : "Wait" },
              { value: "99.8%", label: lang === "PT" ? "Pontualidade" : "Punctuality" },
              { value: "2,400+", label: lang === "PT" ? "Clientes" : "Clients" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-[#F5C518] text-xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</div>
                <div className="text-white/50 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );

  // ─── ALGORITHM / HOW IT WORKS ───
  const AlgorithmSection = (
    <Section id="how-it-works">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.algoTitle}
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            {t.algoDesc}
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: <Radar className="w-7 h-7" />, title: t.algoFeature1, desc: lang === "PT" ? "Nosso sistema sincroniza com o radar a cada 30 segundos para rastrear seu voo." : lang === "EN" ? "Our system syncs with radar every 30 seconds to track your flight." : lang === "ES" ? "Nuestro sistema sincroniza con el radar cada 30 segundos." : lang === "FR" ? "Notre systeme se synchronise avec le radar toutes les 30 secondes." : "Il nostro sistema si sincronizza con il radar ogni 30 secondi." },
            { icon: <MessageCircle className="w-7 h-7" />, title: t.algoFeature2, desc: lang === "PT" ? "O motorista recebe atualizações automáticas. Sem mensagens, sem chamadas." : lang === "EN" ? "The driver receives automatic updates. No messages, no calls needed." : lang === "ES" ? "El conductor recibe actualizaciones automáticas. Sin mensajes necesarios." : lang === "FR" ? "Le conducteur recoit des mises a jour automatiques. Sans messages." : "Il conducente riceve aggiornamenti automatici. Nessun messaggio." },
            { icon: <Car className="w-7 h-7" />, title: t.algoFeature3, desc: lang === "PT" ? "Quando você desembarca, o motorista já está lá. Sempre. Garantido." : lang === "EN" ? "When you land, the driver is already there. Always. Guaranteed." : lang === "ES" ? "Cuando aterrizas, el conductor ya esta ahi. Siempre. Garantizado." : lang === "FR" ? "Quand vous atterrissez, le conducteur est deja la. Toujours. Garanti." : "Quando atterri, il conducente e gia li. Sempre. Garantito." },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group bg-[#1A1A1A] border border-[#F5C518]/10 rounded-2xl p-8 hover:border-[#F5C518]/30 hover:shadow-[0_0_25px_rgba(245,197,24,0.08)] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F5C518]/10 flex items-center justify-center text-[#F5C518] mb-6 group-hover:bg-[#F5C518]/20 transition-colors">
                {card.icon}
              </div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Algorithm image + brain viz */}
        <div className="mt-16 relative rounded-2xl overflow-hidden border border-[#F5C518]/10">
          <img
            src="/images/hub_dobra3_algoritmo.jpg"
            alt="HUB Brain Algorithm"
            className="w-full h-64 md:h-96 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainVisualization />
          </div>
        </div>
      </div>
    </Section>
  );

  // ─── FLEET SECTION ───
  const FleetSection = (
    <Section
      id="fleet"
      className="bg-gradient-to-b from-black via-[#0a0a0a] to-black"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Visual left — abstract car silhouette with CSS */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative flex items-center justify-center"
        >
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#F5C518]/10">
            <img
              src="/images/hub_dobra4_carro.jpg"
              alt="Premium Black Sedan"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Stats overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-[#F5C518] text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>99.8%</div>
                  <div className="text-white/50 text-xs mt-1">{lang === "PT" ? "Pontualidade" : "Punctuality"}</div>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <div className="text-[#F5C518] text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>24/7</div>
                  <div className="text-white/50 text-xs mt-1">{lang === "PT" ? "Disponível" : "Available"}</div>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <div className="text-[#F5C518] text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>5★</div>
                  <div className="text-white/50 text-xs mt-1">{lang === "PT" ? "Avaliação" : "Rating"}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Text right */}
        <div>
          <h2
            className="text-3xl md:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.fleetTitle}
          </h2>
          <p className="mt-6 text-gray-400 text-lg leading-relaxed">
            {t.fleetDesc}
          </p>
          <div className="mt-8 space-y-5">
            {[t.fleetFeature1, t.fleetFeature2, t.fleetFeature3].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-[#F5C518]/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#F5C518]" />
                </div>
                <span className="text-white font-medium">{feat}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );

  // ─── WHY IT WORKS (4 REASONS) ───
  const WhySection = (
    <Section id="why-us" className="bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.whyTitle}
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            {t.whyDesc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Brain className="w-6 h-6" />, title: t.whyReason1Title, desc: t.whyReason1Desc },
            { icon: <Car className="w-6 h-6" />, title: t.whyReason2Title, desc: t.whyReason2Desc },
            { icon: <Shield className="w-6 h-6" />, title: t.whyReason3Title, desc: t.whyReason3Desc },
            { icon: <Headphones className="w-6 h-6" />, title: t.whyReason4Title, desc: t.whyReason4Desc },
          ].map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-[#1A1A1A] border border-[#F5C518]/10 rounded-2xl p-8 hover:border-[#F5C518]/30 hover:shadow-[0_0_25px_rgba(245,197,24,0.08)] transition-all duration-300"
            >
              {/* Number badge */}
              <div className="w-10 h-10 rounded-full bg-[#F5C518] flex items-center justify-center mb-6">
                <span className="text-black font-bold text-sm">
                  0{i + 1}
                </span>
              </div>
              <div className="text-[#F5C518] mb-4 group-hover:scale-110 transition-transform">
                {reason.icon}
              </div>
              <h3
                className="text-lg font-bold text-white mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {reason.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {reason.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  // ─── GUARANTEE SECTION ───
  const GuaranteeSection = (
    <Section id="guarantee">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-full px-5 py-2 mb-8"
        >
          <Shield className="w-4 h-4 text-[#F5C518]" />
          <span className="text-[#F5C518] text-sm font-semibold tracking-wider uppercase">
            {t.guaranteeBadge}
          </span>
        </motion.div>

        <h2
          className="text-3xl md:text-5xl font-bold text-white leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.guaranteeTitle}
        </h2>
        <p className="mt-6 text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          {t.guaranteeDesc}
        </p>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F5C518] text-black font-bold text-base md:text-lg px-10 md:px-14 py-4 md:py-5 rounded-full uppercase tracking-wider hover:bg-[#D4A017] hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,197,24,0.2)]"
          >
            {t.ctaBook}
          </a>
        </motion.div>

        {/* Guarantee seal image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 relative rounded-2xl overflow-hidden border border-[#F5C518]/10 max-w-md mx-auto"
        >
          <img
            src="/images/hub_dobra5_selo.jpg"
            alt="HUB Guarantee Seal"
            className="w-full h-48 md:h-64 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </div>
    </Section>
  );

  // ─── FOOTER ───
  const Footer = (
    <footer className="border-t border-[#F5C518]/10 bg-black">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <div
              className="text-2xl font-bold text-gradient-gold mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              HUB Transfer
            </div>
            <p className="text-gray-500 text-sm">{COMPANY.slogan}</p>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Phone className="w-4 h-4 text-[#F5C518]" />
              {COMPANY.whatsappFormatted}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Mail className="w-4 h-4 text-[#F5C518]" />
              {COMPANY.email}
            </a>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <MapPin className="w-4 h-4 text-[#F5C518]" />
              {COMPANY.location}
            </div>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-gray-500 text-sm">{t.footer}</p>
          </div>
        </div>
      </div>
    </footer>
  );

  // ─── PARTNERS CAROUSEL ───
  const PARTNER_LOGOS = [
    { src: "/logos/tap.png", name: "TAP Portugal" },
    { src: "/logos/emirates.png", name: "Emirates" },
    { src: "/logos/british-airways.png", name: "British Airways" },
    { src: "/logos/lufthansa.png", name: "Lufthansa" },
    { src: "/logos/air-france.png", name: "Air France" },
    { src: "/logos/klm.png", name: "KLM" },
    { src: "/logos/iberia.png", name: "Iberia" },
    { src: "/logos/swiss.png", name: "Swiss" },
    { src: "/logos/turkish-airlines.png", name: "Turkish Airlines" },
    { src: "/logos/qatar.png", name: "Qatar Airways" },
    { src: "/logos/air-europa.png", name: "Air Europa" },
    { src: "/logos/royal-air-maroc.png", name: "Royal Air Maroc" },
    { src: "/logos/aer-lingus.png", name: "Aer Lingus" },
    { src: "/logos/air-canada.png", name: "Air Canada" },
    { src: "/logos/jet2.png", name: "Jet2" },
    { src: "/logos/mercedes.png", name: "Mercedes-Benz" },
    { src: "/logos/bmw.png", name: "BMW" },
    { src: "/logos/marriott.png", name: "Marriott" },
  ];

  const PartnersSection = (
    <section className="py-16 md:py-24 bg-black overflow-hidden border-y border-[#F5C518]/5">
      <div className="max-w-7xl mx-auto px-6 text-center mb-12">
        <h2
          className="text-2xl md:text-3xl font-bold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.partnersTitle}
        </h2>
        <p className="mt-3 text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
          {t.partnersDesc}
        </p>
      </div>
      {/* Infinite scroll carousel */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />
        <div className="flex animate-[scroll_40s_linear_infinite] gap-12 items-center w-max">
          {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 h-16 md:w-32 md:h-20 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // ─── WHATSAPP FLOATING BUTTON ───
  const WhatsAppFloat = (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25d366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]"
      aria-label="WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 text-white fill-current"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );

  // ─── RENDER ───
  return (
    <main className="bg-black min-h-screen overflow-x-hidden">
      {Navbar}
      {Hero}
      {PainSection}
      {AlgorithmSection}
      {FleetSection}
      {PartnersSection}
      {WhySection}
      {GuaranteeSection}
      {Footer}
      {WhatsAppFloat}
    </main>
  );
}
