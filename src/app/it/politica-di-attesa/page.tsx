import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

/* Política de espera (05/11/2026) — it. As cinco versões ligam-se entre si. */
export const metadata: Metadata = {
  title: "Politica di Attesa | HUB Transfer",
  description:
    "60 minuti di attesa per i ritiri in aeroporto, dall'atterraggio effettivo, e 15 minuti per gli altri ritiri. Cancellazioni e mancata presentazione.",
  alternates: {
    canonical: "/it/politica-di-attesa",
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
  { code: "en", href: "/waiting-policy" },
  { code: "pt", href: "/politica-de-espera" },
  { code: "es", href: "/es/politica-de-espera" },
  { code: "fr", href: "/fr/politique-d-attente" },
  { code: "it", href: "/it/politica-di-attesa" },
] as const;
const ESTA = "it";

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

export default function PoliticaDiAttesaPage() {
  return (
    <div lang="it" className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
      {/* Abrir esta página guarda a língua: o início abre nela (sem a língua do browser nem o país). */}
      <script dangerouslySetInnerHTML={{ __html: `try{localStorage.setItem("hub-lang","${ESTA}")}catch(e){}` }} />
      <header className="border-b border-[var(--hub-line)] py-4">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <a href="/" className="order-1"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <nav className="order-3 w-full sm:order-2 sm:w-auto sm:ml-auto flex gap-1">
            {LINGUAS.map((l) => (
              <a key={l.code} href={l.href} hrefLang={l.code} aria-current={l.code === ESTA ? "page" : undefined}
                className="w-11 h-11 flex items-center justify-center group">
                <span className={`w-8 h-6 rounded overflow-hidden border transition-all ${l.code === ESTA ? "border-[var(--hub-gold)]/60 opacity-100" : "border-transparent opacity-40 group-hover:opacity-70"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/flags/${l.code}.jpg`} alt={l.code.toUpperCase()} className="w-full h-full object-cover" />
                </span>
              </a>
            ))}
          </nav>
          <a href="/" className="order-2 sm:order-3 text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Indietro</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{"Politica di attesa"}</h1>
          <p className="max-w-[32em] text-[#888] text-xs"><N>{"Ultimo aggiornamento: 5 novembre 2026."}</N></p>
        </div>

        <p className="max-w-[32em]"><N>{"Il ritiro segue il suo volo. Se il volo è in ritardo o arriva in anticipo, adeguiamo l'orario del ritiro, senza che debba avvisarci."}</N></p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Ritiri in aeroporto"}</h2>
          <p className="max-w-[32em]"><N>{"L'autista attende 60 minuti, a partire dall'atterraggio effettivo del volo."}</N></p>
          <p className="max-w-[32em]"><N>{"Se le serve più tempo, ad esempio al ritiro bagagli o al controllo di frontiera, ci scriva su WhatsApp: concordiamo con lei l'attesa aggiuntiva."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Ritiri in hotel o a un altro indirizzo"}</h2>
          <p className="max-w-[32em]"><N>{"L'autista attende 15 minuti, a partire dall'orario prenotato."}</N></p>
          <p className="max-w-[32em]"><N>{"Le chiediamo di essere pronto all'orario prenotato, soprattutto se va in aeroporto."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Se non riusciamo a trovarla"}</h2>
          <p className="max-w-[32em]"><N>{"Durante il tempo di attesa, l'autista cerca di contattarla in diversi modi, compresi messaggi WhatsApp e chiamate, e lo fa anche il team HUB. L'autista attende al punto d'incontro concordato e registra di esserci stato."}</N></p>
          <p className="max-w-[32em]"><N>{"Se alla fine del tempo di attesa non è possibile contattarla, il viaggio viene considerato una mancata presentazione (no-show): l'autista può andare via e viene addebitato il prezzo intero del viaggio."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Cancellazioni"}</h2>
          <p className="max-w-[32em]"><N>{"La cancellazione è gratuita fino a 3 ore prima del ritiro. Dopo, viene addebitato il prezzo intero del viaggio. La stessa regola vale nei termini e condizioni."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Prenotazioni fatte tramite agenzie, operatori o hotel"}</h2>
          <p className="max-w-[32em]"><N>{"Valgono le regole di attesa, di cancellazione e di mancata presentazione concordate con chi ha fatto la prenotazione."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Contatti"}</h2>
          <p className="max-w-[32em]">
            {"Per avvisarci di un ritardo o concordare l'attesa: "}
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[var(--hub-gold)] hover:underline">{"il WhatsApp di HUB"}</a>
            {" ("}<span className="font-mono text-white">{COMPANY.whatsappFormatted}</span>{")"}
            {" oppure "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--hub-gold)] hover:underline">{COMPANY.email}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
