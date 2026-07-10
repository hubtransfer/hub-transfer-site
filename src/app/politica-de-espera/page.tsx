import Image from "next/image";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Espera e Garantia | HUB Transfer",
  description:
    "90 minutos de espera incluídos, contados da aterragem real do seu voo. Condições de espera estendida, no-show, compromisso e cancelamento.",
  alternates: { canonical: "/politica-de-espera" },
};

const WA = `https://wa.me/${COMPANY.whatsapp.replace(/\+/g, "")}`;

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
    <div className="min-h-screen bg-[var(--hub-black)] text-[#D0D0D0]">
      <header className="border-b border-[var(--hub-line)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/"><Image src="/images/logo.png" alt="HUB Transfer" width={140} height={40} className="h-9 w-auto" /></a>
          <a href="/" className="text-xs text-[#888] hover:text-[var(--hub-gold)] font-mono transition-colors">← Voltar</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Política de Espera e Garantia</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Espera incluída: <span className="font-mono">90</span> minutos</h2>
          <p><N>Todas as recolhas em aeroporto incluem 90 minutos de espera sem qualquer custo, contados a partir da aterragem real do seu voo — não da hora agendada. O nosso sistema monitoriza o voo em tempo real: atrasos do voo não consomem o seu tempo de espera. Para referência, o padrão habitual do setor é de 60 minutos.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Espera estendida</h2>
          <p><N>Terminados os 90 minutos, não cancelamos automaticamente: contactamos o cliente pelo WhatsApp. A espera pode ser estendida por €10 por cada hora iniciada, contada a partir do fim dos 90 minutos. A hora iniciada é devida por inteiro porque, durante a espera estendida, o motorista permanece dedicado exclusivamente à sua recolha e não aceita outros serviços. A confirmação e o pagamento são combinados no mesmo contacto.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">No-show</h2>
          <p><N>Se, terminados os 90 minutos, não obtivermos resposta no prazo de 15 minutos, a recolha é encerrada como no-show e o valor da viagem não é reembolsável.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">O nosso compromisso</h2>
          <p><N>Nós esperamos até 90 minutos por si. E em dias de grandes perturbações aéreas — quando os atrasos obrigam a reorganizar a logística —, pode acontecer pedirmos-lhe o mesmo: até 20 minutos pelo seu motorista, sempre com aviso antecipado e acompanhamento em tempo real. É reciprocidade, e é rara.</N></p>
          <p><N>O que nunca acontece é ficar abandonado: sem recolha e sem contacto da nossa parte. Se essa falha alguma vez ocorrer, a viagem é reembolsada na totalidade e o transporte alternativo até ao destino é por nossa conta.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Cancelamento</h2>
          <p><N>Cancelamento gratuito até 3 horas antes da recolha. Com menos de 3 horas, o valor pode não ser reembolsável.</N></p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Contacto</h2>
          <p>Qualquer situação resolve-se no nosso WhatsApp oficial: <a href={WA} target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--hub-gold)] hover:underline">{COMPANY.whatsappFormatted}</a>.</p>
        </section>
      </main>
    </div>
  );
}
