import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import BotaoMesa from "./BotaoMesa";
import Carrossel from "./Carrossel";
import FormularioMesa from "./FormularioMesa";
import Planeador, { type LugarVista } from "./Planeador";
import BarraTopo from "./BarraTopo";
import ProtecaoFotos from "./ProtecaoFotos";
import { CONFIG_LISBOA } from "@/lib/lisboa/config";
import { listaRestaurantes } from "@/lib/lisboa/formulario";
import { imagensHero, imagensLugar, imagensPrato } from "@/lib/lisboa/imagens";
import { LUGARES } from "@/lib/lisboa/lugares";
import { ESTILOS_JANTAR, PRATOS } from "@/lib/lisboa/pratos";
import { VISTAS_FR_IT } from "@/lib/lisboa/pratos-fr-it";
import { LUGAR_DA_VISTA, paraVista, restaurantesComVista } from "@/lib/lisboa/restaurantes";
import { ROTAS, TEXTOS, rotaPrato } from "@/lib/lisboa/textos";
import type { Lingua } from "@/lib/lisboa/tipos";
import "./lisboa.css";

/* «Lisboa à sua mesa» — /lisboa (en), /pt/lisboa, /es/lisboa, /fr/lisboa, /it/lisboa.
   Estrutura, textos e identidade do protótipo validado (19/11/2026). A página NUNCA mostra preços. */

/* «Uma mesa com vista»: a fotografia é a de um lugar nosso dessa zona, com a legenda da vista
   (nunca apresentada como o restaurante: não temos autorização para usar fotografias dos restaurantes). */
const VISTAS: Record<string, { lugar: number; legenda: Record<Lingua, string> }> = {
  R10: { lugar: LUGAR_DA_VISTA.R10, legenda: { pt: "Vista da Graça", en: "View from Graça", es: "Vista desde Graça", ...VISTAS_FR_IT.R10 } },
  R11: { lugar: LUGAR_DA_VISTA.R11, legenda: { pt: "Vista de Belém", en: "View from Belém", es: "Vista desde Belém", ...VISTAS_FR_IT.R11 } },
};

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--lx-font",
  display: "swap",
  style: ["normal", "italic"],
});

export default function PaginaLisboa({ lingua }: { lingua: Lingua }) {
  const t = TEXTOS[lingua];
  const hero = imagensHero()[0];
  const rotulos = { anterior: t.aAnterior, seguinte: t.aSeguinte, imagem: t.aImagem };

  const lugares: LugarVista[] = LUGARES.map((l) => ({
    n: l.n,
    id: l.id,
    zona: l.zona,
    lat: l.lat,
    lng: l.lng,
    min: l.min,
    nome: l[lingua].nome,
    txt: l[lingua].txt,
    hist: l[lingua].hist,
    imagens: imagensLugar(l.n),
  }));

  return (
    <div lang={lingua} className={`lx ${montserrat.variable}`}>
      {/* Abrir esta página guarda a língua: o início do site abre nela (como nas outras páginas). */}
      <script dangerouslySetInnerHTML={{ __html: `try{localStorage.setItem("hub-lang","${lingua}")}catch(e){}` }} />
      <ProtecaoFotos />

      <BarraTopo lingua={lingua} rotas={ROTAS} rotulo={t.aLingua} logo={{ href: "/", rotulo: "HUB Transfer" }} />

      {/* a) Topo */}
      <header className={hero ? "lx-hero" : "lx-hero lx-hero--sem"}>
        {hero && (
          <Image src={hero} alt="" fill priority fetchPriority="high" sizes="(max-width: 767px) and (orientation: portrait) 82vh, 100vw" quality={60} className="lx-hero-img" draggable={false} />
        )}
        <div className="lx-hero-veu" aria-hidden="true" />
        <div className="lx-wrap lx-hero-corpo">
          <h1 className="lx-h1">
            {t.titleA}
            <em>{t.titleEm}</em>
            {t.titleB}
          </h1>
          <p className="lx-lead">{t.lead}</p>
          <div className="lx-ctas">
            <a className="lx-cta" href="#pratos">
              {t.sug}
            </a>
            <BotaoMesa className="lx-cta lx-cta--linha" pedido={{ origem: "topo" }}>
              {t.own}
            </BotaoMesa>
          </div>
          <p className="lx-dica">{t.hint}</p>
        </div>
      </header>

      <main className="lx-wrap lx-main">
        {/* b) O que se come em Portugal */}
        <section className="lx-sec" aria-labelledby="pratos">
          <h2 id="pratos" className="lx-h2">
            {t.pratos}
          </h2>
          <p className="lx-sub">{t.pratosSub}</p>
          <div className="lx-grelha lx-grelha--pratos">
            {PRATOS.map((p) => {
              const [nome, frase] = p[lingua];
              return (
                <article key={p.n} className="lx-card lx-prato" data-revelar>
                  <Carrossel imagens={imagensPrato(p.n)} alt={nome} rotulos={rotulos} sizes="(min-width: 1040px) 240px, (min-width: 640px) 33vw, (min-width: 560px) 50vw, 80vw" />
                  <div className="lx-card-body">
                    <h3>{nome}</h3>
                    <p className="lx-t">{frase}</p>
                    <Link className="lx-btn lx-btn--ink lx-btn--bloco" href={rotaPrato(lingua, p.slug)} prefetch={false}>
                      {t.provar}
                      <span className="lx-sr"> ({nome})</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* c) A passagem */}
        <aside className="lx-ponte" data-revelar>
          <b>{t.brT}</b>
          <span>{t.brS}</span>
        </aside>

        {/* d) e) f) h) */}
        <Planeador lingua={lingua} t={t} lugares={lugares} estilos={ESTILOS_JANTAR} />

        {/* Uma mesa com vista (antes do rodapé) */}
        <section className="lx-sec" aria-labelledby="vista">
          <h2 id="vista" className="lx-h2">
            {t.vT}
          </h2>
          <p className="lx-sub">{t.vS}</p>
          <div className="lx-grelha lx-grelha--rest">
            {restaurantesComVista().map((r) => {
              const v = paraVista(r, lingua);
              const vista = VISTAS[r.codigo];
              const foto = vista ? imagensLugar(vista.lugar)[0] : undefined;
              return (
                <article key={r.codigo} className="lx-card lx-rest" data-revelar>
                  <Carrossel imagens={foto ? [foto] : []} alt="" rotulos={rotulos} sizes="(min-width: 640px) 33vw, (min-width: 560px) 50vw, 40vw">
                    {vista && <span className="lx-legenda">{vista.legenda[lingua]}</span>}
                  </Carrossel>
                  <div className="lx-card-body">
                    <span className="lx-etiqueta">{t.pReco}</span>
                    <h3>{v.nome}</h3>
                    <p className="lx-bairro">{v.bairro}</p>
                    <p className="lx-t">{v.ambiente}</p>
                    <BotaoMesa
                      className="lx-btn lx-btn--ink lx-btn--bloco"
                      pedido={{ origem: "vista", restaurante: { codigo: v.codigo, nome: v.nome, bairro: v.bairro } }}
                      evento={{ nome: "EscolherRestaurante", dados: { prato: "-", restaurante: v.codigo, lingua } }}
                    >
                      {t.pEscolher}
                    </BotaoMesa>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* g) Rodapé de confiança */}
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
