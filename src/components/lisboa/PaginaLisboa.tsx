import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import BotaoWhats from "./BotaoWhats";
import Carrossel from "./Carrossel";
import Planeador, { type LugarVista } from "./Planeador";
import ProtecaoFotos from "./ProtecaoFotos";
import { CONFIG_LISBOA, linkWhatsapp } from "@/lib/lisboa/config";
import { imagensHero, imagensLugar, imagensPrato } from "@/lib/lisboa/imagens";
import { LUGARES } from "@/lib/lisboa/lugares";
import { ESTILOS_JANTAR, PRATOS } from "@/lib/lisboa/pratos";
import { ROTAS, TEXTOS } from "@/lib/lisboa/textos";
import { LINGUAS, type Lingua } from "@/lib/lisboa/tipos";
import "./lisboa.css";

/* «Lisboa à sua mesa» — /lisboa, /en/lisboa, /es/lisboa.
   Estrutura, textos e identidade do protótipo validado (19/11/2026). A página NUNCA mostra preços. */

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

      {/* a) Topo */}
      <header className={hero ? "lx-hero" : "lx-hero lx-hero--sem"}>
        {hero && (
          <Image src={hero} alt="" fill priority fetchPriority="high" sizes="(max-width: 767px) and (orientation: portrait) 82vh, 100vw" quality={60} className="lx-hero-img" draggable={false} />
        )}
        <div className="lx-hero-veu" aria-hidden="true" />
        <div className="lx-wrap lx-hero-top">
          <Link href="/" aria-label="HUB Transfer" prefetch={false}>
            <Image src="/images/logo.png" alt="HUB Transfer" width={828} height={204} sizes="140px" className="lx-logo" priority />
          </Link>
          <nav className="lx-linguas" aria-label={t.aLingua}>
            {LINGUAS.map((l) => (
              <Link key={l} href={ROTAS[l]} hrefLang={l} lang={l} aria-current={l === lingua ? "page" : undefined} prefetch={false}>
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
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
            <BotaoWhats
              className="lx-cta lx-cta--linha"
              href={linkWhatsapp(t.msgOwn, { tipo: "MESA-LIVRE" }, lingua)}
              evento="PedirMesa"
              dados={{ origem: "topo", lingua }}
              extra={t.aWhats}
            >
              {t.own}
            </BotaoWhats>
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
                    <BotaoWhats
                      className="lx-btn lx-btn--ink lx-btn--bloco"
                      href={linkWhatsapp(t.msgDish.replace("{d}", nome.toLowerCase()), { tipo: "PRATO", prato: p.n }, lingua)}
                      evento="QueroProvar"
                      dados={{ prato: p.n, lingua }}
                      extra={`${nome}, ${t.aWhats}`}
                    >
                      {t.provar}
                    </BotaoWhats>
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
    </div>
  );
}
