import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

/* Política de espera (05/11/2026) — fr. As cinco versões ligam-se entre si. */
export const metadata: Metadata = {
  title: "Politique d'Attente | HUB Transfer",
  description:
    "60 minutes d'attente pour les prises en charge à l'aéroport, dès l'atterrissage réel, et 15 minutes pour les autres. Annulations et absences.",
  alternates: {
    canonical: "/fr/politique-d-attente",
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
const ESTA = "fr";

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

export default function PolitiqueDAttentePage() {
  return (
    <div lang="fr" className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
      <header className="border-b border-[var(--hub-line)] py-4">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
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
          <a href="/" className="order-2 sm:order-3 text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Retour</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{"Politique d'attente"}</h1>
          <p className="max-w-[68ch] text-[#888] text-xs"><N>{"Dernière mise à jour : 5 novembre 2026."}</N></p>
        </div>

        <p className="max-w-[68ch]"><N>{"La prise en charge suit votre vol. Si le vol est retardé ou arrive en avance, nous ajustons l'heure de prise en charge, sans que vous ayez à nous prévenir."}</N></p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Prises en charge à l'aéroport"}</h2>
          <p className="max-w-[68ch]"><N>{"Le chauffeur attend 60 minutes, à compter de l'atterrissage réel du vol."}</N></p>
          <p className="max-w-[68ch]"><N>{"Si vous avez besoin de plus de temps, par exemple pour récupérer vos bagages ou au contrôle aux frontières, écrivez-nous sur WhatsApp : nous convenons avec vous du temps d'attente supplémentaire."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Prises en charge à l'hôtel ou à une autre adresse"}</h2>
          <p className="max-w-[68ch]"><N>{"Le chauffeur attend 15 minutes, à compter de l'heure réservée."}</N></p>
          <p className="max-w-[68ch]"><N>{"Merci d'être prêt à l'heure réservée, surtout si vous allez à l'aéroport."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Si nous ne vous trouvons pas"}</h2>
          <p className="max-w-[68ch]"><N>{"Pendant le temps d'attente, le chauffeur essaie de vous joindre par plusieurs moyens, notamment par messages WhatsApp et par appels, tout comme l'équipe HUB. Le chauffeur attend au point de rendez-vous convenu et enregistre sa présence."}</N></p>
          <p className="max-w-[68ch]"><N>{"Si, à la fin du temps d'attente, il n'est pas possible de vous joindre, le trajet est considéré comme une absence (no-show) : le chauffeur peut partir et le prix total du trajet est facturé."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Annulations"}</h2>
          <p className="max-w-[68ch]"><N>{"L'annulation est gratuite jusqu'à 3 heures avant la prise en charge. Au-delà, le prix total du trajet est facturé. La même règle s'applique dans les conditions générales."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Réservations faites par des agences, des opérateurs ou des hôtels"}</h2>
          <p className="max-w-[68ch]"><N>{"Les règles d'attente, d'annulation et d'absence convenues avec celui qui a fait la réservation s'appliquent."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Contact"}</h2>
          <p className="max-w-[68ch]">
            {"Pour nous signaler un retard ou convenir de l'attente : "}
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[var(--hub-gold)] hover:underline">{"le WhatsApp de HUB"}</a>
            {" ("}<span className="font-mono text-white">{COMPANY.whatsappFormatted}</span>{")"}
            {" ou "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--hub-gold)] hover:underline">{COMPANY.email}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
