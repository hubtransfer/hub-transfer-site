import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

/* Política de espera (05/11/2026) — es. As cinco versões ligam-se entre si. */
export const metadata: Metadata = {
  title: "Política de Espera | HUB Transfer",
  description:
    "60 minutos de espera en las recogidas en el aeropuerto, desde el aterrizaje real, y 15 minutos en las demás recogidas. Cancelaciones y no presentación.",
  alternates: {
    canonical: "/es/politica-de-espera",
    languages: {
      "pt-PT": "/politica-de-espera",
      en: "/waiting-policy",
      es: "/es/politica-de-espera",
      fr: "/fr/politique-d-attente",
      it: "/it/politica-di-attesa",
      "x-default": "/waiting-policy",
    },
  },
};

const WA = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

const LINGUAS = [
  { code: "pt", href: "/politica-de-espera" },
  { code: "en", href: "/waiting-policy" },
  { code: "es", href: "/es/politica-de-espera" },
  { code: "fr", href: "/fr/politique-d-attente" },
  { code: "it", href: "/it/politica-di-attesa" },
] as const;
const ESTA = "es";

/* Números em mono (dados/condições), preservando o texto verbatim. */
function N({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\d+)/g).map((p, i) =>
        /^\d+$/.test(p) ? <span key={i} className="font-mono text-white">{p}</span> : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function PoliticaDeEsperaEsPage() {
  return (
    <div lang="es" className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
      <header className="border-b border-[var(--hub-line)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <a href="/" className="order-1"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <nav className="order-3 w-full sm:order-2 sm:w-auto sm:ml-auto flex gap-1">
            {LINGUAS.map((l) => (
              <a key={l.code} href={l.href} hrefLang={l.code} aria-current={l.code === ESTA ? "page" : undefined}
                className={`w-8 h-6 rounded overflow-hidden border transition-all ${l.code === ESTA ? "border-[var(--hub-gold)]/60 opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${l.code}.jpg`} alt={l.code.toUpperCase()} className="w-full h-full object-cover" />
              </a>
            ))}
          </nav>
          <a href="/" className="order-2 sm:order-3 text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Volver</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{"Política de espera"}</h1>
          <p className="text-[#888] text-xs"><N>{"Última actualización: 5 de noviembre de 2026."}</N></p>
        </div>

        <p><N>{"La recogida sigue su vuelo. Si el vuelo se retrasa o llega antes, ajustamos la hora de recogida, sin que tenga que avisarnos."}</N></p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Recogidas en el aeropuerto"}</h2>
          <p><N>{"El conductor espera 60 minutos, contados desde el aterrizaje real del vuelo."}</N></p>
          <p><N>{"Si necesita más tiempo, por ejemplo en la recogida de equipaje o en el control de fronteras, escríbanos por WhatsApp y acordamos con usted el tiempo de espera adicional."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Recogidas en el hotel o en otra dirección"}</h2>
          <p><N>{"El conductor espera 15 minutos, contados desde la hora reservada."}</N></p>
          <p><N>{"Le pedimos que esté listo a la hora reservada, sobre todo si va al aeropuerto."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Si no podemos encontrarle"}</h2>
          <p><N>{"Durante el tiempo de espera, el conductor intenta contactarle por varios medios, incluidos mensajes de WhatsApp y llamadas, y el equipo de HUB también. El conductor espera en el punto de encuentro acordado y deja constancia de que estuvo allí."}</N></p>
          <p><N>{"Si al terminar el tiempo de espera no es posible hablar con usted, el viaje se considera una no presentación (no-show): el conductor puede marcharse y se cobra el precio total del viaje."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Cancelaciones"}</h2>
          <p><N>{"La cancelación es gratuita hasta 3 horas antes de la recogida. Después, se cobra el precio total del viaje. La misma regla se aplica en los términos y condiciones."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Reservas hechas a través de agencias, operadores u hoteles"}</h2>
          <p><N>{"Se aplican las reglas de espera, de cancelación y de no presentación acordadas con quien hizo la reserva."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Contacto"}</h2>
          <p>
            {"Para avisarnos de un retraso o acordar la espera: "}
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[var(--hub-gold)] hover:underline">{"el WhatsApp de HUB"}</a>
            {" ("}<span className="font-mono text-white">{COMPANY.whatsappFormatted}</span>{")"}
            {" o "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--hub-gold)] hover:underline">{COMPANY.email}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
