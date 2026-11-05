import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

/* Política de espera (05/11/2026) — pt. As cinco versões ligam-se entre si. */
export const metadata: Metadata = {
  title: "Política de Espera | HUB Transfer",
  description:
    "60 minutos de espera nas recolhas no aeroporto, desde a aterragem real do voo, e 15 minutos nas outras recolhas. Cancelamentos e não comparência.",
  alternates: {
    canonical: "/politica-de-espera",
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
const ESTA = "pt";

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

export default function PoliticaDeEsperaPage() {
  return (
    <div lang="pt" className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
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
          <a href="/" className="order-2 sm:order-3 text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Voltar</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{"Política de espera"}</h1>
          <p className="text-[#888] text-xs"><N>{"Última atualização: 5 de novembro de 2026."}</N></p>
        </div>

        <p><N>{"A recolha acompanha o seu voo. Se o voo se atrasar ou chegar mais cedo, ajustamos a hora da recolha, sem que tenha de nos avisar."}</N></p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Recolhas no aeroporto"}</h2>
          <p><N>{"O motorista espera 60 minutos, contados desde a aterragem real do voo."}</N></p>
          <p><N>{"Se precisar de mais tempo, por exemplo na bagagem ou no controlo de fronteiras, escreva-nos por WhatsApp: combinamos consigo a espera a mais."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Recolhas no hotel ou noutra morada"}</h2>
          <p><N>{"O motorista espera 15 minutos, contados desde a hora marcada."}</N></p>
          <p><N>{"Pedimos que esteja pronto à hora marcada, sobretudo quando vai para o aeroporto."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Quando não o encontramos"}</h2>
          <p><N>{"Durante o tempo de espera, o motorista tenta contactá-lo por vários meios, incluindo mensagens de WhatsApp e chamadas, e a equipa da HUB também. O motorista espera no ponto de encontro combinado e regista que lá esteve."}</N></p>
          <p><N>{"Se, no fim do tempo de espera, não for possível falar consigo, a viagem conta como não comparência: o motorista pode sair e cobra-se o valor total da viagem."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Cancelamentos"}</h2>
          <p><N>{"O cancelamento é grátis até 3 horas antes da recolha. Depois disso, cobra-se o valor total da viagem. A mesma regra vale nos termos e condições."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Reservas feitas através de agências, operadores ou hotéis"}</h2>
          <p><N>{"Valem as regras de espera, de cancelamento e de não comparência combinadas com quem fez a reserva."}</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{"Contacto"}</h2>
          <p>
            {"Para avisar de um atraso ou combinar a espera: "}
            <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[var(--hub-gold)] hover:underline">{"o WhatsApp da HUB"}</a>
            {" ("}<span className="font-mono text-white">{COMPANY.whatsappFormatted}</span>{")"}
            {" ou "}
            <a href={`mailto:${COMPANY.email}`} className="text-[var(--hub-gold)] hover:underline">{COMPANY.email}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
