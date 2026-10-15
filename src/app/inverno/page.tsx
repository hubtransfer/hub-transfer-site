import Image from "next/image";
import Link from "next/link";
import InscricaoForm from "./_components/InscricaoForm";
import VideoAoToque from "./_components/VideoAoToque";
import PreferenciasCookies from "./_components/PreferenciasCookies";

/* /inverno — pré-inscrição de motoristas (campanha de inverno).
   Textos aprovados pelo Junior: não reescrever sem o pedido dele.
   Regras: não falar de TVDE, não dar números de vagas, não garantir viagens. */

const GANHOS = ["10 € por viagem de 3 a 10 km (aprox.)", "A gorjeta é 100% tua", "Não largas as apps"];

const GARANTIAS = ["Não precisas de largar a Uber.", "Não precisas de carro premium.", "Também em part-time."];

export default function InvernoPage() {
  return (
    <main>
      <div className="inv-wrap">
        <header className="inv-header">
          <Image src="/images/logo.png" alt="HUB Transfer" width={828} height={204} sizes="118px" priority />
        </header>

        <section className="inv-hero" aria-labelledby="inv-titulo">
          <div>
            <h1 id="inv-titulo" className="inv-h1 inv-display">
              <span>No inverno, a dinâmica vai embora.</span>
              <span className="inv-h1-b">As viagens marcadas, não.</span>
            </h1>
            <p className="inv-sub">A HUB Transfer está a formar a equipa de motoristas para o inverno.</p>
            <div className="inv-cta-top">
              <a className="inv-btn" href="#inscricao">
                Quero o meu lugar na fila
              </a>
            </div>
          </div>

          {/* O adereço (o colete preto da HUB) e o trabalho a acontecer: um serviço marcado de véspera */}
          <div className="inv-demo" aria-hidden="true">
            <div className="inv-demo-colete">
              <Image src="/inverno/colete.webp" alt="" width={480} height={560} priority sizes="(min-width: 900px) 280px, 62vw" />
            </div>
            <div className="inv-bubble">
              <div className="inv-bubble-head">
                <span className="inv-bubble-name">HUB Transfer</span>
                <span className="inv-bubble-time">21:47</span>
              </div>
              <p>Amanhã 9:30.</p>
              <p>Aeroporto → hotel, 4 km.</p>
              <p>Recebes 10 €.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="inv-wrap inv-narrow">
        <section className="inv-section" aria-label="O que ganhas">
          <ul className="inv-ganhos">
            {GANHOS.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>

        <section className="inv-section" aria-label="O filme">
          <VideoAoToque />
        </section>
      </div>

      <section className="inv-band" aria-label="Quem procuramos">
        <div className="inv-wrap inv-narrow">
          <p className="inv-display">
            Aqui, a viagem tem hora marcada e um cliente à espera. Procuramos quem cumpre o combinado.
          </p>
        </div>
      </section>

      <div className="inv-wrap inv-narrow">
        <section className="inv-section" aria-label="Lugares nesta fase">
          <p className="inv-text">
            Só aceitamos os motoristas para quem vamos ter trabalho. Por isso, os lugares nesta fase são limitados, e a
            fila é por ordem de inscrição. As inscrições fecham quando a fila estiver completa.
          </p>
        </section>

        <section className="inv-section" aria-labelledby="inv-seguir">
          <h2 id="inv-seguir" className="inv-h2 inv-display">
            O que acontece a seguir
          </h2>
          <ol className="inv-steps">
            <li>Deixas os teus dados em 30 segundos.</li>
            <li>Alguém da nossa equipa entra em contacto contigo para uma conversa, sem compromisso.</li>
          </ol>
        </section>

        <section className="inv-section" id="inscricao" aria-label="Inscrição">
          <InscricaoForm garantias={GARANTIAS} />
        </section>

        <footer className="inv-footer">
          <p>HUB Transfer · Jornadas e Possibilidades, Unipessoal Lda</p>
          <p>
            <Link href="/inverno/privacidade" prefetch={false}>Privacidade</Link> · <PreferenciasCookies />
          </p>
        </footer>
      </div>
    </main>
  );
}
