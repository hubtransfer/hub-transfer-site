import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Montserrat } from "next/font/google";
import { ficheiroGuia, ligacoesGuia, TEXTOS_GUIA, whatsappEscrito } from "@/lib/lisboa/guia";
import { codigoWhats } from "@/lib/lisboa/config";
import { imagensHero, imagensLugar, imagensPrato } from "@/lib/lisboa/imagens";
import { LUGARES } from "@/lib/lisboa/lugares";
import { PRATOS } from "@/lib/lisboa/pratos";
import { TEXTOS } from "@/lib/lisboa/textos";
import { LINGUAS, type Lingua } from "@/lib/lisboa/tipos";
import Foto from "./Foto";
import "./guia.css";

/* Guia «Lisboa à sua mesa» para imprimir em A4 (pedido E9, Fase B) — /guia/en, /guia/pt, /guia/es, /guia/fr, /guia/it.
   É daqui que o comando «npm run guias» faz os PDF (public/guia/HUB-Transfer-Lisboa-XX.pdf).
   Páginas: 1 capa · 2 como usar · 3–4 os 8 pratos · 5–8 os 21 lugares · 9 a mesa · 10 contracapa.
   Sem preços. Cada número, fotografia e botão abre o site na língua do guia, com os UTM da campanha.
   Não aparece nos motores de busca nem no sitemap. */

const montserrat = Montserrat({ subsets: ["latin"], variable: "--gx-font", display: "block", style: ["normal", "italic"] });

type Props = { params: Promise<{ lingua: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LINGUAS.map((lingua) => ({ lingua }));
export const viewport: Viewport = { themeColor: "#111110" };

const valida = (l: string): l is Lingua => (LINGUAS as readonly string[]).includes(l);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lingua } = await params;
  if (!valida(lingua)) return {};
  return {
    title: `${TEXTOS[lingua].pVoltar} — ${ficheiroGuia(lingua)}`,
    robots: { index: false, follow: false },
  };
}

const PAGINA_PRATOS = 3;
const PAGINA_LUGARES = 5;
const PAGINA_MESA = 9;

function grupos<T>(lista: T[], n: number): T[][] {
  const r: T[][] = [];
  for (let i = 0; i < lista.length; i += n) r.push(lista.slice(i, i + n));
  return r;
}

export default async function Guia({ params }: Props) {
  const { lingua } = await params;
  if (!valida(lingua)) notFound();
  const t = TEXTOS[lingua];
  const g = TEXTOS_GUIA[lingua];
  const ir = ligacoesGuia(lingua);
  const zap = whatsappEscrito();
  const capa = imagensHero()[0];
  const pratos = grupos(PRATOS, 4);
  const lugares = grupos(LUGARES, 6);
  const fado = PRATOS.find((p) => p.slug === "jantar-com-fado") ?? PRATOS[PRATOS.length - 1];

  const rodape = (pagina: number) => (
    <footer className="gx-rodape">
      <a href={ir.pagina}>
        {t.pVoltar} · hubtransfer.pt
      </a>
      <span>
        {g.pagina} {pagina}
      </span>
    </footer>
  );

  return (
    <div lang={lingua} className={`gx ${montserrat.variable}`}>
      {/* 1. Capa */}
      <section className="gx-folha gx-escura gx-capa">
        {capa && (
          <a href={ir.pagina} className="gx-capa-foto" aria-label={t.pVoltar}>
            <Foto src={capa} largura={1200} />
          </a>
        )}
        <div className="gx-capa-veu" />
        <a href={ir.pagina} className="gx-logo-capa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="HUB Transfer" />
        </a>
        <div className="gx-capa-texto">
          <p className="gx-sobretitulo">HUB Transfer</p>
          <h1 className="gx-titulo">{t.pVoltar}</h1>
          <p className="gx-boas-vindas">{g.boasVindas}</p>
          <a className="gx-botao" href={ir.pagina}>
            {g.botaoSite}
          </a>
        </div>
        <span className="gx-canto" />
      </section>

      {/* 2. Como usar este guia */}
      <section className="gx-folha gx-como">
        <h2 className="gx-h2">{g.comoT}</h2>
        <ol className="gx-passos">
          {g.como.map((frase, i) => (
            <li key={i}>
              <span className="gx-numero">{i + 1}</span>
              <p>{frase}</p>
            </li>
          ))}
        </ol>
        <div className="gx-exemplo">
          <a href={ir.lugar(7)} className="gx-exemplo-foto">
            <Foto src={imagensLugar(7)[0]} largura={1080} />
            <span className="gx-numero gx-numero--foto">7</span>
          </a>
        </div>
        <h3 className="gx-h3">{g.indice}</h3>
        <ul className="gx-indice">
          <li>
            <a href={ir.pratos}>{t.pratos}</a>
            <span>{PAGINA_PRATOS}</span>
          </li>
          <li>
            <a href={ir.lugar(1)}>{t.choose}</a>
            <span>{PAGINA_LUGARES}</span>
          </li>
          <li>
            <a href={ir.pagina}>{g.mesaT}</a>
            <span>{PAGINA_MESA}</span>
          </li>
        </ul>
        {rodape(2)}
      </section>

      {/* 3–4. Os 8 pratos */}
      {pratos.map((grupo, gi) => (
        <section key={`p${gi}`} className="gx-folha">
          {gi === 0 ? (
            <header className="gx-cabeca">
              <h2 className="gx-h2">{t.pratos}</h2>
              <p className="gx-sub">{t.pratosSub}</p>
            </header>
          ) : (
            <header className="gx-cabeca gx-cabeca--curta">
              <h2 className="gx-h2">{t.pratos}</h2>
            </header>
          )}
          <div className="gx-grelha gx-grelha--pratos">
            {grupo.map((p) => {
              const [nome, frase] = p[lingua];
              return (
                <article key={p.n} className="gx-cartao">
                  <a href={ir.prato(p.slug)} className="gx-cartao-foto" aria-label={nome}>
                    <Foto src={imagensPrato(p.n)[0]} largura={640} />
                  </a>
                  <div className="gx-cartao-corpo">
                    <h3>
                      <a href={ir.prato(p.slug)}>{nome}</a>
                    </h3>
                    <p>{frase}</p>
                    <a className="gx-botao gx-botao--tinta" href={ir.prato(p.slug)}>
                      {g.ondeProvar} →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          {rodape(PAGINA_PRATOS + gi)}
        </section>
      ))}

      {/* 5–8. Os 21 lugares */}
      {lugares.map((grupo, gi) => (
        <section key={`l${gi}`} className="gx-folha">
          {gi === 0 ? (
            <header className="gx-cabeca">
              <h2 className="gx-h2">{t.choose}</h2>
              <p className="gx-sub">{t.brS}</p>
            </header>
          ) : (
            <header className="gx-cabeca gx-cabeca--curta">
              <h2 className="gx-h2">{t.choose}</h2>
            </header>
          )}
          <div className="gx-grelha gx-grelha--lugares">
            {grupo.map((l) => {
              const txt = l[lingua];
              return (
                <article key={l.n} className="gx-cartao">
                  <a href={ir.lugar(l.n)} className="gx-cartao-foto gx-cartao-foto--lugar" aria-label={`${l.n}. ${txt.nome}`}>
                    <Foto src={imagensLugar(l.n)[0]} largura={640} />
                    <span className="gx-numero gx-numero--foto">{l.n}</span>
                  </a>
                  <div className="gx-cartao-corpo">
                    <h3>
                      <a href={ir.lugar(l.n)}>{txt.nome}</a>
                    </h3>
                    <p className="gx-zona">{l.zona}</p>
                    <p>{txt.txt}</p>
                    <a className="gx-botao gx-botao--tinta" href={ir.lugar(l.n)}>
                      {g.verJuntar} →
                    </a>
                  </div>
                </article>
              );
            })}
            {/* última página dos lugares (19–21): o resto da folha convida para o jantar */}
            {grupo.length < 6 && (
              <>
                <aside className="gx-cartao gx-jantar">
                  <h3>{t.eT}</h3>
                  <p>{t.eS}</p>
                  <a className="gx-botao" href={ir.whatsapp}>
                    {t.own2} →
                  </a>
                </aside>
                <a className="gx-faixa" href={ir.prato(fado.slug)}>
                  <Foto src={imagensPrato(fado.n)[0]} largura={1080} />
                  <span className="gx-faixa-texto">
                    <b>{fado[lingua][0]}</b>
                    <span>{g.ondeProvar} →</span>
                  </span>
                </a>
              </>
            )}
          </div>
          {rodape(PAGINA_LUGARES + gi)}
        </section>
      ))}

      {/* 9. Uma mesa à sua espera */}
      <section className="gx-folha gx-escura gx-mesa">
        {capa && (
          <a href={ir.pagina} className="gx-mesa-foto" aria-label={t.pVoltar}>
            <Foto src={capa} largura={1200} />
          </a>
        )}
        <div className="gx-mesa-texto">
          <h2 className="gx-titulo gx-titulo--mesa">{g.mesaT}</h2>
          <p className="gx-mesa-sub">{g.mesaS}</p>
          <p className="gx-boas-vindas">{g.mesaTxt}</p>
          <div className="gx-botoes">
            <a className="gx-botao" href={ir.pagina}>
              {g.botaoSite}
            </a>
            <a className="gx-botao gx-botao--whats" href={ir.whatsapp}>
              <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.56 4.2 1.62 6.03L4 29l8.13-1.6a12 12 0 0 0 3.9.66h.01C22.68 28.06 28 22.66 28 16.02 28 9.4 22.68 3 16.04 3Zm0 22.88h-.01c-1.24 0-2.46-.33-3.53-.96l-.25-.15-4.83.95.97-4.7-.17-.27a9.8 9.8 0 0 1-1.5-5.2c0-5.43 4.42-9.85 9.86-9.85a9.85 9.85 0 0 1 9.84 9.86c0 5.43-4.42 9.86-9.86 9.86Zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.71 2-1.4.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"
                />
              </svg>
              {g.botaoWhats}
            </a>
          </div>
          <p className="gx-codigo">
            {g.codigo} <b>{codigoWhats({ tipo: "MESA" }, lingua)}</b>
          </p>
        </div>
        <span className="gx-canto" />
      </section>

      {/* 10. Contracapa */}
      <section className="gx-folha gx-escura gx-contra">
        <a href={ir.pagina} className="gx-logo-contra">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="HUB Transfer" />
        </a>
        <p className="gx-lema">{t.trustLema}</p>
        <p className="gx-contra-txt">{g.contraTxt}</p>
        <ul className="gx-contactos">
          <li>
            <span>Web</span>
            <a href={ir.pagina}>hubtransfer.pt</a>
          </li>
          <li>
            <span>WhatsApp</span>
            <a href={ir.whatsapp}>{zap}</a>
          </li>
        </ul>
        <p className="gx-licenca">
          <b>{t.trustNome}</b> · {t.trust}
        </p>
        <span className="gx-canto" />
      </section>
    </div>
  );
}
