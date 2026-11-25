import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import BarraTopo from "@/components/lisboa/BarraTopo";
import { viewportLisboa } from "@/lib/lisboa/metadados";
import type { Lingua } from "@/lib/lisboa/tipos";
import { TEXTOS_PAG, linkWhatsPagamento, refValida, rotasPagamento, type Pagina } from "@/lib/pagamento/textos";
import "@/components/lisboa/lisboa.css";
import "./pagamento.css";

/* As páginas para onde a Stripe devolve o cliente (pedido E11): obrigado e cancelado, nas cinco línguas.
   Mesma identidade da /lisboa (barra, seletor de línguas, Montserrat). NUNCA mostram preços nem dados do cliente:
   só a referência K-… do ?k=, e só se bater certo com /^K-\d{4}(-[B-Z])?$/ (senão, a versão genérica).
   Esta página não confirma nada: quem confirma o pagamento é o aviso da Stripe (/api/stripe/webhook) e o WhatsApp. */

const montserrat = Montserrat({ subsets: ["latin"], variable: "--lx-font", display: "swap", style: ["normal", "italic"] });

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const viewportPagamento: Viewport = viewportLisboa;

export function metadadosPagamento(pagina: Pagina, lingua: Lingua): Metadata {
  const t = TEXTOS_PAG[lingua];
  return {
    title: pagina === "obrigado" ? t.ok.meta : t.ko.meta,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

function IconeWhats() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.47-9.47 9.47Zm8.06-17.53A11.33 11.33 0 0 0 12.04.63C5.76.63.65 5.74.65 12.02c0 2 .52 3.96 1.52 5.69L.55 23.6l6.04-1.58a11.38 11.38 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05Z"
      />
    </svg>
  );
}

export default async function PaginaPagamento({
  pagina,
  lingua,
  searchParams,
}: {
  pagina: Pagina;
  lingua: Lingua;
  searchParams: SearchParams;
}) {
  const ref = refValida((await searchParams).k);
  const t = TEXTOS_PAG[lingua];
  const ok = pagina === "obrigado";

  return (
    <div lang={lingua} className={`lx ${montserrat.variable}`} data-pagina={pagina} data-ref={ref ? "" : undefined}>
      <BarraTopo lingua={lingua} rotas={rotasPagamento(pagina, ref)} rotulo={t.lingua} logo={{ href: "/", rotulo: t.inicio }} solida />
      <div className="lx-barra-espaco" aria-hidden="true" />

      <main className="lx-wrap pg-main">
        <section className={`pg-cartao ${ok ? "pg-cartao--ok" : "pg-cartao--ko"}`} aria-labelledby="pg-titulo">
          <span className="pg-icone" aria-hidden="true">
            {ok ? (
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path d="M12 7v6M12 17h.01" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            )}
          </span>

          <h1 id="pg-titulo" className="pg-titulo">
            {ok ? t.ok.titulo : t.ko.titulo}
          </h1>

          {ref ? (
            <>
              <p className="pg-texto">{ok ? t.ok.texto : t.ko.texto}</p>
              <div className="pg-ref">
                <span className="pg-ref-rotulo">{t.ref}</span>
                <span className="pg-ref-valor" data-testid="referencia">
                  {ref}
                </span>
              </div>
              <p className="pg-texto pg-texto--forte">{ok ? t.ok.whatsLinha : t.ko.ajuda}</p>
            </>
          ) : (
            <p className="pg-texto pg-texto--forte">{ok ? t.ok.generico : t.ko.generico}</p>
          )}

          <a
            className="pg-whats"
            href={linkWhatsPagamento(pagina, lingua, ref)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="whatsapp"
          >
            <IconeWhats />
            <span>{ok ? t.ok.botao : t.ko.botao}</span>
          </a>
        </section>
      </main>
    </div>
  );
}
