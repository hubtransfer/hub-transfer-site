import Image from "next/image";
import HeroiAnimado from "./_components/HeroiAnimado";
import Link from "next/link";
import Candidatura from "./_components/Candidatura";
import PreferenciasCookies from "./_components/PreferenciasCookies";
import { TITULO_A } from "./_lib/titulos";

/* /motoristas — candidatura de motoristas (versão clara).
   Textos aprovados pelo Junior: não reescrever sem o pedido dele.
   Regras: não falar de valores, de TVDE, de Uber nem de número de vagas; não garantir viagens. */

/** Título no ar. Para o teste A/B, trocar por TITULO_B (em _lib/titulos.ts). */
const TITULO = TITULO_A;

const VAGA: [string, string][] = [
  ["Serviço", "Transfers entre os aeroportos de Lisboa, Porto e Faro e os hotéis."],
  ["Marcação", "Viagens marcadas com antecedência, com hora e cliente à espera."],
  ["Horários", "Temos vagas só para alguns horários."],
];

const REQUISITOS = [
  "Carro próprio, de 2010 ou mais recente, em bom estado.",
  "Carta há mais de um ano.",
  "Não precisas de experiência em transfers. Ensinamos tudo, no terreno.",
];

const PASSOS = [
  "Preenches a ficha de candidatura e envias duas fotos do carro.",
  "Analisamos a tua ficha.",
  "Se fores selecionado, o responsável pela contratação fala contigo pelo WhatsApp da HUB Transfer e marca a entrevista, perto do aeroporto.",
];

const Tracos = ({ pequenos }: { pequenos?: boolean }) => (
  <div className={`mot-tracos${pequenos ? " mot-tracos-p" : ""}`} aria-hidden="true">
    <i />
    <i />
    <i />
  </div>
);

export default function MotoristasPage() {
  return (
    <>
      <header className="mot-wrap mot-topo">
        <Image src="/motoristas/logo-hub.png" alt="HUB Transfer" width={944} height={234} sizes="140px" priority />
        <a className="mot-ir" href="#ficha">
          Candidatar
        </a>
      </header>

      <main>
        <section className="mot-wrap mot-heroi" aria-labelledby="mot-titulo">
          <div>
            <p className="mot-etiqueta">
              <b>Candidaturas abertas</b>
              <span>Aeroportos de Lisboa, Porto e Faro</span>
            </p>
            <div className="mot-placa">
              <Tracos />
              <h1 id="mot-titulo">{TITULO}</h1>
            </div>
            <p className="mot-sub">
              Lemos cada candidatura. Os perfis escolhidos são chamados para uma entrevista. Os bons perfis que não couberem agora
              ficam em lista de espera.
            </p>
            <a className="mot-cta" href="#ficha">
              Quero candidatar-me à vaga
            </a>
            <p className="mot-micro">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Leva poucos minutos. Tem o telemóvel à mão para tirares duas fotos ao teu carro.
            </p>
          </div>
          <HeroiAnimado />
        </section>

        <section className="mot-seccao mot-sem-topo" aria-labelledby="mot-vaga">
          <div className="mot-wrap">
            <h2 id="mot-vaga">A vaga</h2>
            <dl className="mot-ficha-tecnica">
              {VAGA.map(([dt, dd]) => (
                <div key={dt}>
                  <dt>{dt}</dt>
                  <dd>{dd}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mot-destaque" aria-label="Porque escolhemos com calma">
          <div className="mot-wrap">
            <div className="mot-marca" aria-hidden="true" />
            <p>
              Para quem aterra, o motorista é a primeira pessoa com quem fala em Portugal. Por isso, não aceitamos toda a gente:
              temos critérios e padrões, e conhecemos cada motorista pessoalmente antes da primeira viagem.
            </p>
          </div>
        </section>

        <section className="mot-seccao" aria-labelledby="mot-perfil">
          <div className="mot-wrap">
            <h2 id="mot-perfil">Quem procuramos</h2>
            <ul className="mot-requisitos">
              {REQUISITOS.map((t) => (
                <li key={t}>
                  <span className="mot-visto" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2CF32" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mot-placa mot-selecao">
              <Tracos pequenos />
              <p>Aqui, a viagem tem hora marcada e um cliente à espera. Procuramos quem cumpre o combinado.</p>
            </div>
          </div>
        </section>

        <section className="mot-seccao mot-sem-topo" aria-labelledby="mot-seguir">
          <div className="mot-wrap">
            <h2 id="mot-seguir">O que acontece a seguir</h2>
            <ol className="mot-passos">
              {PASSOS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <a className="mot-cta" href="#ficha">
              Quero candidatar-me à vaga
            </a>
          </div>
        </section>

        <section className="mot-zona-ficha" id="ficha" aria-label="Ficha de candidatura">
          <div className="mot-wrap">
            <Candidatura />
          </div>
        </section>
      </main>

      <footer className="mot-rodape">
        <div className="mot-wrap">
          <Image src="/motoristas/logo-hub.png" alt="HUB Transfer" width={944} height={234} sizes="120px" />
          <p className="mot-lema">Ninguém chega sozinho.</p>
          <p>HUB Transfer é uma marca da Jornadas e Possibilidades, Unipessoal Lda.</p>
          <p>Registo de agência de viagens RNAVT 12529. Registo de animação turística RNAAT 568/2025.</p>
          <nav>
            <Link href="/motoristas/privacidade" prefetch={false}>
              Privacidade
            </Link>
            <PreferenciasCookies />
          </nav>
        </div>
      </footer>
    </>
  );
}
