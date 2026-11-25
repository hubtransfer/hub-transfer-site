import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import BotaoMesa, { MedirAoAbrir } from "./BotaoMesa";
import Carrossel from "./Carrossel";
import FormularioMesa from "./FormularioMesa";
import ProtecaoFotos from "./ProtecaoFotos";
import SeletorLinguas from "./SeletorLinguas";
import { CONFIG_LISBOA } from "@/lib/lisboa/config";
import { listaRestaurantes } from "@/lib/lisboa/formulario";
import { imagensPrato } from "@/lib/lisboa/imagens";
import { PRATOS } from "@/lib/lisboa/pratos";
import { paraVista, restaurantesDoPrato } from "@/lib/lisboa/restaurantes";
import { ROTAS, TEXTOS, rotaPrato } from "@/lib/lisboa/textos";
import { LINGUAS, type Lingua, type Prato } from "@/lib/lisboa/tipos";
import "./lisboa.css";

/* Página de um prato — /lisboa/prato/{slug} (en), /pt/…, /es/…, /fr/…, /it/lisboa/prato/{slug}.
   a) fotografias, nome e o que é; b) «Onde o provamos»; c) «Já tem um restaurante em mente?»; d) «Ver outros pratos».
   Sem preços, sem notas do Google, sem fotografias dos restaurantes (os cartões usam as do prato). */

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--lx-font",
  display: "swap",
  style: ["normal", "italic"],
});

export default function PaginaPrato({ lingua, prato }: { lingua: Lingua; prato: Prato }) {
  const t = TEXTOS[lingua];
  const [nome, frase] = prato[lingua];
  const fotos = imagensPrato(prato.n);
  const rotulos = { anterior: t.aAnterior, seguinte: t.aSeguinte, imagem: t.aImagem };
  const restaurantes = restaurantesDoPrato(prato.n).map((r) => paraVista(r, lingua));
  const outros = PRATOS.filter((p) => p.n !== prato.n);
  const pratoPedido = { n: prato.n, nome };
  const rotasPrato = Object.fromEntries(LINGUAS.map((l) => [l, rotaPrato(l, prato.slug)])) as Record<Lingua, string>;

  return (
    <div lang={lingua} className={`lx ${montserrat.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: `try{localStorage.setItem("hub-lang","${lingua}")}catch(e){}` }} />
      <ProtecaoFotos />
      <MedirAoAbrir evento="VerPrato" dados={{ prato: prato.n, lingua }} />

      <header className="lx-topo">
        <div className="lx-wrap lx-hero-top">
          <Link href={ROTAS[lingua]} aria-label={t.pVoltar} prefetch={false}>
            <Image src="/images/logo.png" alt="HUB Transfer" width={828} height={204} sizes="140px" className="lx-logo" priority />
          </Link>
          <SeletorLinguas lingua={lingua} rotas={rotasPrato} rotulo={t.aLingua} />
        </div>
      </header>

      <main className="lx-wrap lx-main lx-main--prato">
        <Link href={`${ROTAS[lingua]}#pratos`} className="lx-voltar">
          <span aria-hidden="true">←</span> {t.pVoltar}
        </Link>

        {/* a) O prato */}
        <article className="lx-prato-topo">
          <Carrossel
            imagens={fotos}
            alt={nome}
            rotulos={rotulos}
            classe="lx-ph--grande"
            prioridade
            sizes="(min-width: 1040px) 560px, (min-width: 768px) 55vw, 100vw"
          />
          <div className="lx-prato-texto">
            <h1 className="lx-h1 lx-h1--prato">{nome}</h1>
            <p className="lx-prato-frase">{frase}</p>
            {prato.sobre[lingua].map((linha) => (
              <p key={linha} className="lx-t">
                {linha}
              </p>
            ))}
          </div>
        </article>

        {/* b) Onde o provamos */}
        <section className="lx-sec" aria-labelledby="onde">
          <h2 id="onde" className="lx-h2">
            {t.pOnde}
          </h2>
          {restaurantes.length > 0 ? (
            <div className="lx-grelha lx-grelha--rest">
              {restaurantes.map((r, i) => (
                <article key={r.codigo} className="lx-card lx-rest" data-revelar>
                  <Carrossel
                    imagens={fotos.length ? [fotos[i % fotos.length]] : []}
                    alt={nome}
                    rotulos={rotulos}
                    sizes="(min-width: 1040px) 330px, (min-width: 640px) 33vw, (min-width: 560px) 50vw, 40vw"
                  />
                  <div className="lx-card-body">
                    <span className="lx-etiqueta">{t.pReco}</span>
                    <h3>{r.nome}</h3>
                    <p className="lx-bairro">{r.bairro}</p>
                    <p className="lx-t">{r.ambiente}</p>
                    <BotaoMesa
                      className="lx-btn lx-btn--ink lx-btn--bloco"
                      pedido={{ origem: "restaurante", prato: pratoPedido, restaurante: { codigo: r.codigo, nome: r.nome, bairro: r.bairro } }}
                      evento={{ nome: "EscolherRestaurante", dados: { prato: prato.n, restaurante: r.codigo, lingua } }}
                    >
                      {t.pEscolher}
                    </BotaoMesa>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="lx-deixe" data-revelar>
              <p>{t.pDeixe}</p>
              <BotaoMesa className="lx-cta" pedido={{ origem: "deixe-connosco", prato: pratoPedido }}>
                {t.fBotao}
              </BotaoMesa>
            </div>
          )}
        </section>

        {/* c) Já tem um restaurante em mente? */}
        <aside className="lx-mente" data-revelar>
          <p>{t.pMente}</p>
          <BotaoMesa className="lx-btn lx-btn--ink" pedido={{ origem: "livre", prato: pratoPedido }}>
            {t.pMenteBtn}
          </BotaoMesa>
        </aside>

        {/* d) Ver outros pratos */}
        <section className="lx-sec" aria-labelledby="outros">
          <h2 id="outros" className="lx-h2">
            {t.pOutros}
          </h2>
          <ul className="lx-fila">
            {outros.map((p) => {
              const foto = imagensPrato(p.n)[0];
              return (
                <li key={p.n}>
                  <Link href={rotaPrato(lingua, p.slug)} className="lx-mini-prato" prefetch={false}>
                    <span className="lx-ph" data-vazio={foto ? undefined : true}>
                      {foto && <Image src={foto} alt="" fill sizes="190px" quality={55} className="lx-img" draggable={false} />}
                    </span>
                    <b>{p[lingua][0]}</b>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="lx-confianca">
          <p>
            <b>{t.trustNome}</b> · {t.trust} · {t.trustLema}
          </p>
          {CONFIG_LISBOA.googleRating && CONFIG_LISBOA.googleReviews && (
            <p>{t.proof.replace("{r}", CONFIG_LISBOA.googleRating).replace("{n}", CONFIG_LISBOA.googleReviews)}</p>
          )}
        </footer>
      </main>

      <FormularioMesa lingua={lingua} t={t} restaurantes={listaRestaurantes(lingua)} />
    </div>
  );
}
