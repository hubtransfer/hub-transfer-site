import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

/* Política de espera (05/11/2026) — en. As cinco versões ligam-se entre si. */
export const metadata: Metadata = {
  title: "Waiting Policy | HUB Transfer",
  description:
    "60 minutes of waiting at airport pickups, from the actual landing, and 15 minutes at other pickups. Cancellations and no-shows.",
  alternates: {
    canonical: "/waiting-policy",
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
const ESTA = "en";

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

export default function WaitingPolicyPage() {
  return (
    <div lang="en" className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
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
          <a href="/" className="order-2 sm:order-3 text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Back</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{"Waiting policy"}</h1>
          <p className="text-[#888] text-xs"><N>{"Last updated: 5 November 2026."}</N></p>
        </div>

        <p><N>{"Your pickup follows your flight. If the flight is delayed or lands early, we adjust the pickup time, and you don't need to tell us."}</N></p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Airport pickups"}</h2>
          <p><N>{"The driver waits 60 minutes from the actual landing time of the flight."}</N></p>
          <p><N>{"If you need more time, for example at baggage claim or border control, message us on WhatsApp and we will agree the extra waiting time with you."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Pickups at a hotel or any other address"}</h2>
          <p><N>{"The driver waits 15 minutes from the booked time."}</N></p>
          <p><N>{"Please be ready at the booked time, especially when you are going to the airport."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"If we can't find you"}</h2>
          <p><N>{"During the waiting time, the driver tries to reach you in several ways, including WhatsApp messages and phone calls, and so does the HUB team. The driver waits at the agreed meeting point and records being there."}</N></p>
          <p><N>{"If we cannot reach you by the end of the waiting time, the trip counts as a no-show: the driver may leave and the full trip price is charged."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Cancellations"}</h2>
          <p><N>{"Cancellation is free up to 3 hours before pickup. After that, the full trip price is charged. The same rule applies in the terms and conditions."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Bookings made through agencies, operators or hotels"}</h2>
          <p><N>{"The waiting, cancellation and no-show rules agreed with whoever made the booking apply."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Contact"}</h2>
          <p>
            {"To tell us about a delay or agree the waiting time: "}
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[var(--hub-gold)] hover:underline">{"HUB's WhatsApp"}</a>
            {" ("}<span className="font-mono text-white">{COMPANY.whatsappFormatted}</span>{")"}
            {" or "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--hub-gold)] hover:underline">{COMPANY.email}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
