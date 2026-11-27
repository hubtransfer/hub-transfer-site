import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Montserrat } from "next/font/google";
import { ficheiroGuia, ligacoesGuia, TEXTOS_GUIA, whatsappEscrito } from "@/lib/lisboa/guia";
import { codigoWhats } from "@/lib/lisboa/config";
import { imagensHero } from "@/lib/lisboa/imagens";
import { LUGARES } from "@/lib/lisboa/lugares";
import { PRATOS } from "@/lib/lisboa/pratos";
import { TEXTOS } from "@/lib/lisboa/textos";
import { LINGUAS, type Lingua } from "@/lib/lisboa/tipos";
import "./guia.css";

/* Guia «Lisboa à sua mesa» para ler no telemóvel (pedidos E18 e E19; antes A4 em duas colunas, pedido E9) —
   /guia/en, /guia/pt, /guia/es, /guia/fr, /guia/it. É daqui que o comando «npm run guias» faz os PDF
   (public/guia/HUB-Transfer-Lisboa-XX.pdf). Cada página tem 390×760 e uma só coluna: aberta à largura do ecrã,
   cada px desta página é um ponto do ecrã (texto de leitura ≥ 17 px) e a página inteira cabe entre as barras do leitor.
   Páginas: 1 capa · 2 índice · 3 como usar · entrada dos pratos · um prato por página · entrada dos lugares ·
   um lugar por página · o jantar · a mesa · contracapa.
   Fotografias: public/guia/fotos/, feitas por «npm run fotos-guia» (corte pelo ponto de foco de
   src/lib/lisboa/enquadramentos-guia.json e só depois a marca de água). Pratos e lugares: todas em 6:5.
   Sem preços. Cada número, fotografia e botão abre o site na língua do guia, com os UTM da campanha;
   o índice, as páginas de entrada e o «↑» de cada rodapé saltam dentro do próprio PDF.
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

/** Fotografias do guia: já cortadas à medida, com a marca de água gravada depois do corte (npm run fotos-guia). */
const foto = (nome: string) => `/guia/fotos/${nome}.jpg`;
const dois = (n: number) => String(n).padStart(2, "0");

// números das páginas (o índice e as páginas de entrada mostram-nos e saltam para eles)
const P_INDICE = 2;
const P_COMO = 3;
const P_PRATOS = 4; // página de entrada dos pratos; um prato por página a seguir
const P_LUGARES = P_PRATOS + 1 + PRATOS.length; // página de entrada dos lugares; um lugar por página a seguir
const P_JANTAR = P_LUGARES + 1 + LUGARES.length;
const P_MESA = P_JANTAR + 1;

function Img({ nome }: { nome: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={foto(nome)} alt="" className="gx-img" draggable={false} />;
}

export default async function Guia({ params }: Props) {
  const { lingua } = await params;
  if (!valida(lingua)) notFound();
  const t = TEXTOS[lingua];
  const g = TEXTOS_GUIA[lingua];
  const ir = ligacoesGuia(lingua);
  const zap = whatsappEscrito();
  const temCapa = imagensHero().length > 0;
  const fado = PRATOS.find((p) => p.slug === "jantar-com-fado") ?? PRATOS[PRATOS.length - 1];

  // rodapé: «↑ Neste guia» à esquerda (salta para o índice) · «hubtransfer.pt · página N» à direita
  const rodape = (pagina: number, escura = false) => (
    <footer className={`gx-rodape${escura ? " gx-rodape--escura" : ""}`}>
      <a href="#indice" className="gx-rodape-indice">
        ↑ {g.indice}
      </a>
      <span className="gx-rodape-direita">
        <a href={ir.pagina}>hubtransfer.pt</a>
        <span>
          {" · "}
          {g.pagina.toLowerCase()} {pagina}
        </span>
      </span>
    </footer>
  );

  const seta = <span aria-hidden="true">→</span>;

  return (
    <div lang={lingua} className={`gx ${montserrat.variable}`}>
      {/* 1. Capa */}
      <section className="gx-folha gx-escura gx-capa">
        {temCapa && (
          <a href={ir.pagina} className="gx-capa-foto" aria-label={t.pVoltar}>
            <Img nome="capa" />
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
      </section>

      {/* 2. Índice: cada linha salta para a secção dentro do PDF */}
      <section id="indice" className="gx-folha gx-escura gx-pagina-indice">
        <p className="gx-sobretitulo">{t.pVoltar}</p>
        <h2 className="gx-h2">{g.indice}</h2>
        <ul className="gx-indice">
          {[
            ["#como", g.comoT, P_COMO],
            ["#pratos", t.pratos, P_PRATOS],
            ["#lugares", t.choose, P_LUGARES],
            ["#jantar", t.eT, P_JANTAR],
            ["#mesa", g.mesaT, P_MESA],
          ].map(([href, nome, pagina]) => (
            <li key={href}>
              <a href={String(href)}>
                <span className="gx-indice-nome">{nome}</span>
                <span className="gx-indice-pag">{pagina}</span>
              </a>
            </li>
          ))}
        </ul>
        {rodape(P_INDICE, true)}
        <span className="gx-canto" />
      </section>

      {/* 3. Como usar este guia */}
      <section id="como" className="gx-folha gx-como">
        <h2 className="gx-h2">{g.comoT}</h2>
        <ol className="gx-passos">
          {g.como.map((frase, i) => (
            <li key={i}>
              <span className="gx-numero">{i + 1}</span>
              <p>{frase}</p>
            </li>
          ))}
        </ol>
        <a href={ir.lugar(7)} className="gx-exemplo-foto">
          <Img nome="como" />
          <span className="gx-numero gx-numero--foto">7</span>
        </a>
        {rodape(P_COMO)}
      </section>

      {/* Entrada dos pratos: o título, a frase e os 8 pratos (cada um salta para a sua página) */}
      <section id="pratos" className="gx-folha gx-escura gx-entrada">
        <h2 className="gx-titulo gx-titulo--entrada">
          <a href={ir.pratos}>{t.pratos}</a>
        </h2>
        <p className="gx-entrada-sub">{t.pratosSub}</p>
        <ul className="gx-entrada-lista">
          {PRATOS.map((p, i) => (
            <li key={p.n}>
              <a href={`#prato-${p.n}`}>
                <span>{p[lingua][0]}</span>
                <span className="gx-entrada-pag">{P_PRATOS + 1 + i}</span>
              </a>
            </li>
          ))}
        </ul>
        {rodape(P_PRATOS, true)}
        <span className="gx-canto" />
      </section>

      {/* Os 8 pratos, um por página, todos com a mesma fotografia 6:5 */}
      {PRATOS.map((p, i) => {
        const [nome, frase] = p[lingua];
        return (
          <section key={`p${p.n}`} id={`prato-${p.n}`} className="gx-folha gx-item">
            <p className="gx-seccao">{t.pratos}</p>
            <a href={ir.prato(p.slug)} className="gx-item-foto" aria-label={nome}>
              <Img nome={`prato-${dois(p.n)}`} />
            </a>
            <div className="gx-item-corpo">
              <h3 className="gx-item-nome">
                <a href={ir.prato(p.slug)}>{nome}</a>
              </h3>
              <p className="gx-item-txt">{frase}</p>
              <a className="gx-botao gx-botao--tinta" href={ir.prato(p.slug)}>
                <span>{g.ondeProvar} {seta}</span>
              </a>
            </div>
            {rodape(P_PRATOS + 1 + i)}
          </section>
        );
      })}

      {/* Entrada dos lugares: o título, a frase e os 21 números (cada um salta para a sua página) */}
      <section id="lugares" className="gx-folha gx-escura gx-entrada">
        <h2 className="gx-titulo gx-titulo--entrada">{t.choose}</h2>
        <p className="gx-entrada-sub">{t.brS}</p>
        <ul className="gx-entrada-numeros">
          {LUGARES.map((l) => (
            <li key={l.n}>
              <a href={`#lugar-${l.n}`} aria-label={`${l.n}. ${l[lingua].nome}`}>
                {l.n}
              </a>
            </li>
          ))}
        </ul>
        {rodape(P_LUGARES, true)}
        <span className="gx-canto" />
      </section>

      {/* Os 21 lugares, um por página, todos com a mesma fotografia 6:5 */}
      {LUGARES.map((l, i) => {
        const txt = l[lingua];
        return (
          <section key={`l${l.n}`} id={`lugar-${l.n}`} className="gx-folha gx-item">
            <p className="gx-seccao">{t.choose}</p>
            <a href={ir.lugar(l.n)} className="gx-item-foto" aria-label={`${l.n}. ${txt.nome}`}>
              <Img nome={`lugar-${dois(l.n)}`} />
              <span className="gx-numero gx-numero--foto">{l.n}</span>
            </a>
            <div className="gx-item-corpo">
              <p className="gx-zona">{l.zona}</p>
              <h3 className="gx-item-nome">
                <a href={ir.lugar(l.n)}>{txt.nome}</a>
              </h3>
              <p className="gx-item-txt">{txt.txt}</p>
              <a className="gx-botao gx-botao--tinta" href={ir.lugar(l.n)}>
                <span>{g.verJuntar} {seta}</span>
              </a>
            </div>
            {rodape(P_LUGARES + 1 + i)}
          </section>
        );
      })}

      {/* O convite para o jantar */}
      <section id="jantar" className="gx-folha gx-jantar-folha">
        <aside className="gx-jantar">
          <h2 className="gx-jantar-titulo">{t.eT}</h2>
          <p>{t.eS}</p>
          <a className="gx-botao" href={ir.whatsapp}>
            <span>{t.own2} {seta}</span>
          </a>
        </aside>
        <a className="gx-faixa" href={ir.prato(fado.slug)}>
          <Img nome="jantar" />
          <span className="gx-faixa-texto">
            <b>{fado[lingua][0]}</b>
            <span>
              {g.ondeProvar} {seta}
            </span>
          </span>
        </a>
        {rodape(P_JANTAR)}
      </section>

      {/* Uma mesa à sua espera */}
      <section id="mesa" className="gx-folha gx-escura gx-mesa">
        {temCapa && (
          <a href={ir.pagina} className="gx-mesa-foto" aria-label={t.pVoltar}>
            <Img nome="mesa" />
          </a>
        )}
        <div className="gx-mesa-texto">
          <h2 className="gx-titulo gx-titulo--mesa">{g.mesaT}</h2>
          <p className="gx-mesa-sub">{g.mesaS}</p>
          <p className="gx-mesa-txt">{g.mesaTxt}</p>
          <div className="gx-botoes">
            <a className="gx-botao" href={ir.pagina}>
              {g.botaoSite}
            </a>
            <a className="gx-botao gx-botao--whats" href={ir.whatsapp}>
              <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">
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
      </section>

      {/* Contracapa */}
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
