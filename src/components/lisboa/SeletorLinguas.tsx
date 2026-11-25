"use client";

import { useEffect, useRef, useState } from "react";
import { CHAVE_LINGUA_ESCOLHIDA, linguaJaEscolhida, obterCliente } from "@/lib/lisboa/cliente";
import { LINGUAS, type Lingua } from "@/lib/lisboa/tipos";

/* Seletor de línguas da /lisboa e das páginas dos pratos — o mesmo esquema da página inicial:
   as bandeiras JPG de /public/flags (sem sigla), áreas de toque de 44×44, a ativa com contorno dourado,
   a ordem EN, PT, ES, FR, IT e a escolha guardada em «hub-lang».
   Ecrãs com espaço: as cinco numa linha. Telemóvel estreito: a bandeira atual com uma seta, e as cinco num menu.
   Ao mudar, abre-se a mesma página na outra língua e volta-se ao mesmo sítio (guardado só nesta visita).
   Nunca muda de língua pela língua do browser. Só o cliente identificado (E8) abre na língua dele,
   e só enquanto não escolher outra no seletor. */

const CHAVE_SITIO = "hub-lisboa-sitio";

type Sitio = { destino: string; id: string; delta: number; razao: number };

/** O elemento com id mais próximo acima do topo do ecrã (secções, #p-1…#p-21) e a distância a ele. */
function sitioAtual(destino: string): Sitio {
  const raiz = document.querySelector(".lx") ?? document.body;
  let id = "";
  let delta = 0;
  raiz.querySelectorAll<HTMLElement>("main [id]").forEach((el) => {
    const topo = el.getBoundingClientRect().top;
    if (topo <= 80) {
      id = el.id;
      delta = topo;
    }
  });
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return { destino, id, delta, razao: max > 0 ? window.scrollY / max : 0 };
}

function guardar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: fica só nesta visita */
  }
}

export default function SeletorLinguas({ lingua, rotas, rotulo }: { lingua: Lingua; rotas: Record<Lingua, string>; rotulo: string }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  /* Chegou de outra língua: volta ao mesmo sítio da página. */
  useEffect(() => {
    let s: Sitio | null = null;
    try {
      s = JSON.parse(sessionStorage.getItem(CHAVE_SITIO) || "null") as Sitio | null;
      sessionStorage.removeItem(CHAVE_SITIO);
    } catch {
      /* nada */
    }
    if (!s || s.destino !== window.location.pathname || window.location.hash) return;
    const alvo = s;
    const ir = () => {
      const el = alvo.id ? document.getElementById(alvo.id) : null;
      const top = el
        ? el.getBoundingClientRect().top + window.scrollY - alvo.delta
        : alvo.razao * (document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top, behavior: "instant" });
    };
    // depois de as imagens e os cartões ocuparem o seu lugar
    requestAnimationFrame(() => requestAnimationFrame(ir));
  }, []);

  /* Cliente identificado com outra língua (e que ainda não escolheu nenhuma): abre a mesma página na língua dele. */
  useEffect(() => {
    let vivo = true;
    obterCliente().then((c) => {
      if (!vivo || !c?.lingua || c.lingua === lingua || linguaJaEscolhida()) return;
      guardar("hub-lang", c.lingua);
      window.location.replace(rotas[c.lingua] + window.location.hash);
    });
    return () => {
      vivo = false;
    };
  }, [lingua, rotas]);

  /* Fechar o menu ao tocar fora ou com Esc. */
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const aoEscolher = (l: Lingua) => (e: React.MouseEvent) => {
    guardar("hub-lang", l);
    guardar(CHAVE_LINGUA_ESCOLHIDA, "1");
    setAberto(false);
    if (l === lingua) {
      e.preventDefault();
      return;
    }
    try {
      sessionStorage.setItem(CHAVE_SITIO, JSON.stringify(sitioAtual(rotas[l])));
    } catch {
      /* nada */
    }
  };

  const bandeira = (l: Lingua) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/flags/${l}.jpg`} alt={l.toUpperCase()} width={32} height={24} />
  );

  const ligacoes = () =>
    LINGUAS.map((l) => (
      <a
        key={l}
        className="lx-lingua"
        href={rotas[l]}
        hrefLang={l === "pt" ? "pt-PT" : l}
        lang={l}
        aria-label={l.toUpperCase()}
        aria-current={l === lingua ? "page" : undefined}
        onClick={aoEscolher(l)}
      >
        <span className="lx-bandeira">{bandeira(l)}</span>
      </a>
    ));

  return (
    <nav className="lx-linguas" aria-label={rotulo}>
      {/* as cinco numa linha (quando cabem) */}
      <div className="lx-linguas-linha">{ligacoes()}</div>

      {/* telemóvel estreito: a atual com uma seta; as cinco num menu */}
      <div className="lx-linguas-menu" ref={caixa}>
        <button
          type="button"
          className="lx-lingua lx-lingua--atual"
          aria-label={`${rotulo}: ${lingua.toUpperCase()}`}
          aria-haspopup="true"
          aria-expanded={aberto}
          onClick={() => setAberto((a) => !a)}
        >
          <span className="lx-bandeira">{bandeira(lingua)}</span>
          <svg className="lx-seta" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {aberto && <div className="lx-linguas-lista">{ligacoes()}</div>}
      </div>
    </nav>
  );
}
