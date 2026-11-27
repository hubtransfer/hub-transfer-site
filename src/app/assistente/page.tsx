"use client";

// /assistente — o CRM da assistente. E21: tema claro e o ecrã principal é «a próxima chamada».
// Em cima: saudação, a estrada do dia («6 de 20 chamadas») e três contadores.
// No meio: UM cliente, o botão «Ligar agora», o guião curto da etiqueta e os resultados.
// Ao gravar: celebração curta e passa sozinho ao cliente seguinte. «Ver a lista toda» fica pequeno.
// O telefone só existe no href do botão Ligar; o nome só aparece pelo primeiro nome.
// O crachá vive só no sessionStorage e acaba ao fim de 12 h (ou no botão «Sair»).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ban, CalendarClock, Check, ChevronLeft, Hand, Phone, PhoneOff, ShoppingBag, ThumbsUp, type LucideIcon } from "lucide-react";
import {
  BANDEIRAS,
  CrmErro,
  META_DIARIA,
  NOMES_LINGUA,
  apagarSessao,
  contarChamada,
  diasDesde,
  ehSessaoRecusada,
  eventoSimples,
  dataPt,
  fraseChave,
  gravarSessao,
  guiaoCurto,
  hojeLisboa,
  incentivo,
  lerDia,
  lerSessao,
  nomeProduto,
  pedirCrm,
  perfil,
  primeiroNome,
  saudacao,
  telHref,
  textoDias,
  vendasSemana,
  type Cartao,
  type Dia,
  type RespostaBase,
  type RespostaCarrinho,
  type RespostaCliente,
  type RespostaFila,
  type RespostaRegistar,
  type Sessao,
} from "@/lib/crm/crm";

// ── Peças de estilo (tema claro) ────────────────────────────────

const FOCO = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0b0c0c]";
const BOTAO = `inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-lg font-semibold transition active:scale-[0.98] disabled:opacity-40 ${FOCO}`;
const BOTAO_AMARELO = `${BOTAO} bg-[var(--amarelo)] text-[var(--asfalto)] shadow-[0_2px_0_#c9a91f]`;
const BOTAO_ESCURO = `${BOTAO} bg-[var(--asfalto)] text-white`;
const BOTAO_LINHA = `${BOTAO} border border-[var(--linha)] bg-white text-[var(--asfalto)]`;
const PLACA = "rounded-[22px] bg-white shadow-[var(--sombra)]";

interface ResultadoUI {
  codigo: string;
  texto: string;
  Icone: LucideIcon;
}
const RESULTADOS_UI: ResultadoUI[] = [
  { codigo: "COMPROU", texto: "Comprou", Icone: ShoppingBag },
  { codigo: "INTERESSADO", texto: "Interessado", Icone: ThumbsUp },
  { codigo: "LIGAR_DEPOIS", texto: "Ligar depois", Icone: CalendarClock },
  { codigo: "NAO_ATENDEU", texto: "Não atendeu", Icone: PhoneOff },
  { codigo: "NAO_QUER", texto: "Não quer", Icone: Hand },
  { codigo: "NUMERO_ERRADO", texto: "Número errado", Icone: Ban },
];

type Pedir = <T extends RespostaBase>(corpo: Record<string, unknown>) => Promise<T>;

// ─────────────────────────────────────────────────────────────────

export default function PaginaAssistente() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ensaio, setEnsaio] = useState(false);

  useEffect(() => {
    setSessao(lerSessao());
    setPronto(true);
  }, []);

  const sair = useCallback((msg = "") => {
    apagarSessao();
    setSessao(null);
    setAviso(msg);
  }, []);

  // Fim das 12 h (ou do expiraEm do backend): sai sozinha.
  useEffect(() => {
    if (!sessao) return;
    const ver = () => {
      if (Date.now() >= sessao.fim) sair("A sessão terminou (12 horas). Entre outra vez com o seu código.");
    };
    ver();
    const t = setInterval(ver, 30_000);
    return () => clearInterval(t);
  }, [sessao, sair]);

  const pedir = useCallback(
    async <T extends RespostaBase>(corpo: Record<string, unknown>): Promise<T> => {
      try {
        const r = await pedirCrm<T>({ ...corpo, cracha: sessao?.cracha || "" });
        // a faixa segue a última gravação: aparece num ensaio e sai quando volta a gravar a sério
        if (r.ensaio === true) setEnsaio(true);
        else if (corpo.action === "crmRegistar" || corpo.action === "crmCarrinho") setEnsaio(false);
        return r;
      } catch (e) {
        if (ehSessaoRecusada(e)) sair((e as CrmErro).message);
        throw e;
      }
    },
    [sessao, sair],
  );

  return (
    <main className="crm pb-[max(2rem,env(safe-area-inset-bottom))]">
      {ensaio && (
        <div data-testid="faixa-ensaio" role="status" className="sticky top-0 z-30 bg-[var(--amarelo)] px-4 py-3 text-center text-base font-bold">
          ⚠️ Modo de ensaio: nada foi gravado
        </div>
      )}
      <div className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {!pronto ? null : !sessao ? (
          <Entrada
            aviso={aviso}
            onEntrar={(s) => {
              setAviso("");
              setSessao(s);
            }}
          />
        ) : (
          <Painel sessao={sessao} pedir={pedir} onSair={() => sair("")} />
        )}
      </div>
    </main>
  );
}

// ── Entrada ──────────────────────────────────────────────────────

function Logo() {
  return (
    <p className="crm-display flex items-center gap-2 text-xl font-extrabold">
      <span aria-hidden className="flex gap-1">
        <span className="size-2 rounded-full bg-[var(--amarelo)]" />
        <span className="size-2 rounded-full bg-[var(--amarelo)]" />
        <span className="size-2 rounded-full bg-[var(--amarelo)]" />
      </span>
      HUB Transfer
    </p>
  );
}

function Entrada({ aviso, onEntrar }: { aviso: string; onEntrar: (s: Sessao) => void }) {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  const entrar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!codigo.trim() || aEnviar) return;
    setAEnviar(true);
    setErro("");
    try {
      const r = await pedirCrm<RespostaBase>({ action: "crmEntrar", codigo: codigo.trim().toUpperCase() });
      if (typeof r.cracha !== "string" || !r.cracha) throw new CrmErro("erro", "Erro no sistema. Tente outra vez.", r);
      onEntrar(gravarSessao(r.cracha, String(r.nome || "Assistente"), r.expiraEm));
    } catch (e) {
      setErro(e instanceof CrmErro ? e.message : "Erro no sistema. Tente outra vez.");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <section className="flex min-h-[85dvh] flex-col justify-center gap-6">
      <div>
        <Logo />
        <h1 className="crm-display mt-4 text-5xl leading-none font-extrabold">As chamadas de hoje</h1>
        <p className="mt-3 text-[var(--sinal)]">Escreva o código que recebeu para começar.</p>
      </div>
      {aviso && (
        <p role="status" className={`${PLACA} p-4 text-[var(--sinal)]`}>
          {aviso}
        </p>
      )}
      <form onSubmit={entrar} className={`${PLACA} flex flex-col gap-4 p-5`}>
        <label htmlFor="codigo" className="text-lg font-semibold">
          Código
        </label>
        <input
          id="codigo"
          data-testid="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          placeholder="XXXX-XXXX-XXXX"
          className="min-h-16 rounded-2xl border-2 border-[var(--linha)] bg-[var(--betao)] px-4 text-2xl tracking-widest placeholder:text-[#b4b9bf] focus:border-[var(--asfalto)] focus:outline-none"
        />
        {erro && (
          <p data-testid="erro-entrada" role="alert" className="text-lg font-semibold text-[#b42318]">
            {erro}
          </p>
        )}
        <button type="submit" data-testid="entrar" disabled={!codigo.trim() || aEnviar} className={BOTAO_AMARELO}>
          {aEnviar ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}

// ── Painel: progresso + próxima chamada (ou a lista) ─────────────

interface Festa {
  resultado: string;
  ensaio: boolean;
  meta: boolean;
  link: string;
  avisos: string[];
}

function Painel({ sessao, pedir, onSair }: { sessao: Sessao; pedir: Pedir; onSair: () => void }) {
  const [dados, setDados] = useState<RespostaFila | null>(null);
  const [erro, setErro] = useState("");
  const [aCarregar, setACarregar] = useState(true);
  const [dia, setDia] = useState<Dia>({ chamadas: 0, atendidas: 0, vendas: 0, refs: [] });
  const [semana, setSemana] = useState(0);
  const [saltados, setSaltados] = useState<string[]>([]);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [vista, setVista] = useState<"proxima" | "lista">("proxima");
  const [festa, setFesta] = useState<Festa | null>(null);
  const hoje = dados?.hoje || hojeLisboa();

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setACarregar(true);
      setErro("");
      try {
        setDados(await pedir<RespostaFila>({ action: "crmFila" }));
      } catch (e) {
        if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
      } finally {
        setACarregar(false);
      }
    },
    [pedir],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setDia(lerDia(hoje));
    setSemana(vendasSemana(hoje));
  }, [hoje]);

  // O botão «voltar» do telemóvel fecha a lista.
  useEffect(() => {
    const voltar = () => setVista("proxima");
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);

  // A fila: sem quem já foi ligado hoje neste aparelho; os saltados vão para o fim; o escolhido na lista vai à frente.
  const fila = useMemo(() => {
    const base = (dados?.clientes || []).filter((c) => !dia.refs.includes(c.ref));
    const ord = [...base.filter((c) => !saltados.includes(c.ref)), ...saltados.map((r) => base.find((c) => c.ref === r)).filter((c): c is Cartao => !!c)];
    const i = escolhido ? ord.findIndex((c) => c.ref === escolhido) : -1;
    return i > 0 ? [ord[i], ...ord.slice(0, i), ...ord.slice(i + 1)] : ord;
  }, [dados, dia.refs, saltados, escolhido]);

  const p = dados?.placar;
  const feitas = p?.chamadas ?? Math.max(dia.chamadas, Number(dados?.foraDaFila?.JA_CHAMADO_HOJE) || 0);
  const porMostrar = Math.max(0, (dados?.total || 0) - (dados?.mostrados || 0));
  const meta = p?.meta ?? Math.max(1, Math.min(META_DIARIA, feitas + fila.length + porMostrar));
  const contadores = { atendidas: p?.atendidas ?? dia.atendidas, vendasHoje: p?.vendasHoje ?? dia.vendas, vendasSemana: p?.vendasSemana ?? semana };

  const gravado = (c: Cartao, resultado: string, r: RespostaRegistar) => {
    let novo = dia;
    if (!r.ensaio) {
      novo = contarChamada(c.ref, resultado, hoje);
      setDia(novo);
      setSemana(vendasSemana(hoje));
    } else {
      setSaltados((s) => [...s.filter((x) => x !== c.ref), c.ref]); // ensaio: nada gravado, vai para o fim
    }
    const feitasDepois = p?.chamadas !== undefined ? p.chamadas + 1 : Math.max(novo.chamadas, feitas + (r.ensaio ? 0 : 1));
    setEscolhido(null);
    setFesta({
      resultado,
      ensaio: !!r.ensaio,
      meta: !r.ensaio && feitas < meta && feitasDepois >= meta,
      link: r.link ? (r.link.ok ? "O link do Google vai pelo WhatsApp." : "O link do Google não saiu.") : "",
      avisos: r.avisos || [],
    });
  };

  // A festa dura pouco e depois segue sozinha para o cliente seguinte.
  useEffect(() => {
    if (!festa) return;
    const ms = festa.meta ? 2600 : festa.resultado === "COMPROU" ? 2200 : 1300;
    const t = setTimeout(() => {
      setFesta(null);
      carregar(true);
      window.scrollTo({ top: 0 });
    }, ms);
    return () => clearTimeout(t);
  }, [festa, carregar]);

  const abrirLista = () => {
    window.history.pushState({ lista: 1 }, "");
    setVista("lista");
    window.scrollTo(0, 0);
  };
  const fecharLista = () => {
    if (window.history.state?.lista) window.history.back();
    else setVista("proxima");
  };

  const atual = fila[0];

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-center justify-between gap-3">
        <div>
          <Logo />
          <p data-testid="saudacao" className="crm-display mt-1 text-3xl leading-tight font-bold">
            {saudacao()}, {primeiroNome(sessao.nome) || "assistente"}
          </p>
        </div>
        <button type="button" data-testid="sair" onClick={onSair} className={`${BOTAO_LINHA} min-h-11 shrink-0 px-4 text-base`}>
          Sair
        </button>
      </header>

      <Progresso feitas={feitas} meta={meta} {...contadores} pronto={!!dados} />

      {erro && (
        <div role="alert" className={`${PLACA} flex flex-col gap-3 border-2 border-[#f3c1bb] p-4 text-lg text-[#b42318]`}>
          {erro}
          <button type="button" onClick={() => carregar()} className={BOTAO_LINHA}>
            Tentar outra vez
          </button>
        </div>
      )}

      {!dados && aCarregar && !erro && <div className={`${PLACA} h-80 animate-pulse`} aria-label="A carregar" />}

      {dados && vista === "lista" && (
        <Lista
          fila={fila}
          hoje={hoje}
          foraDaFila={dados.foraDaFila}
          onVoltar={fecharLista}
          onEscolher={(ref) => {
            setEscolhido(ref);
            setSaltados((s) => s.filter((x) => x !== ref));
            fecharLista();
          }}
        />
      )}

      {dados && vista === "proxima" && (
        <>
          {atual ? (
            <ProximaChamada key={atual.ref} cliente={atual} hoje={hoje} pedir={pedir} onGravado={(res, r) => gravado(atual, res, r)} />
          ) : (
            <div data-testid="fila-vazia" className={`${PLACA} flex flex-col items-center gap-3 p-8 text-center`}>
              <p className="text-5xl" aria-hidden>
                🌅
              </p>
              <p className="crm-display text-3xl font-bold">Não há mais ninguém para ligar hoje</p>
              <p className="text-[var(--sinal)]">Bom trabalho. Se entrar alguém novo, aparece aqui.</p>
              <button type="button" onClick={() => carregar()} disabled={aCarregar} className={`${BOTAO_LINHA} mt-2 w-full`}>
                {aCarregar ? "A procurar…" : "Procurar outra vez"}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 px-1 text-base">
            <button type="button" data-testid="ver-lista" onClick={abrirLista} className={`min-h-11 font-semibold underline underline-offset-4 ${FOCO}`}>
              Ver a lista toda ({fila.length})
            </button>
            {fila.length > 1 && atual && (
              <button
                type="button"
                data-testid="saltar"
                onClick={() => setSaltados((s) => [...s.filter((x) => x !== atual.ref), atual.ref])}
                className={`min-h-11 text-[var(--sinal)] underline underline-offset-4 ${FOCO}`}
              >
                Ligar a este mais tarde
              </button>
            )}
          </div>
        </>
      )}

      {festa && <Celebracao festa={festa} onSeguir={() => setFesta(null)} />}
    </div>
  );
}

// ── A estrada do dia ─────────────────────────────────────────────

function Progresso({
  feitas,
  meta,
  atendidas,
  vendasHoje,
  vendasSemana,
  pronto,
}: {
  feitas: number;
  meta: number;
  atendidas: number;
  vendasHoje: number;
  vendasSemana: number;
  pronto: boolean;
}) {
  const cumprida = pronto && feitas >= meta;
  const pct = pronto ? Math.min(100, Math.round((feitas / Math.max(1, meta)) * 100)) : 0;
  return (
    <section data-testid="progresso" aria-label="O meu dia" className={`${PLACA} p-5 ${cumprida ? "bg-[var(--amarelo-claro)] ring-2 ring-[var(--amarelo)]" : ""}`}>
      <p data-testid="incentivo" className={cumprida ? "crm-display text-4xl leading-none font-extrabold" : "text-lg font-semibold"}>
        {pronto ? incentivo(feitas, meta) : "A preparar o dia…"}
      </p>
      <p data-testid="contagem" className="crm-display mt-1 text-[2.6rem] leading-none font-extrabold">
        {pronto ? feitas : "–"}
        <span className="text-2xl font-bold text-[var(--sinal)]">
          {" "}
          de {pronto ? meta : "–"} chamadas
        </span>
      </p>
      <div
        className="crm-estrada mt-4"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={meta}
        aria-valuenow={Math.min(feitas, meta)}
        aria-label={`${feitas} de ${meta} chamadas`}
      >
        <div className="crm-estrada-feito" style={{ width: `${Math.max(pct, pct > 0 ? 8 : 0)}%` }} />
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Contador id="cont-atendidas" n={atendidas} t="atendidas" />
        <Contador id="cont-vendas-hoje" n={vendasHoje} t="vendas hoje" />
        <Contador id="cont-vendas-semana" n={vendasSemana} t="na semana" />
      </dl>
    </section>
  );
}

function Contador({ id, n, t }: { id: string; n: number; t: string }) {
  return (
    <div className="rounded-2xl bg-[var(--betao)] px-2 py-3">
      <dd data-testid={id} className="crm-display text-3xl leading-none font-bold">
        {n}
      </dd>
      <dt className="mt-1 text-sm text-[var(--sinal)]">{t}</dt>
    </div>
  );
}

// ── O cartão da próxima chamada ──────────────────────────────────

function Selo({ etiqueta }: { etiqueta: string }) {
  const pf = perfil(etiqueta);
  return (
    <p data-testid="etiqueta" className={`inline-flex flex-wrap items-center gap-x-1 rounded-full px-3.5 py-1.5 text-base ${pf.selo}`}>
      <span className="font-bold">
        {pf.titulo} {pf.emoji}
      </span>
      <span>— {pf.accao}</span>
    </p>
  );
}

function ProximaChamada({
  cliente: c,
  hoje,
  pedir,
  onGravado,
}: {
  cliente: Cartao;
  hoje: string;
  pedir: Pedir;
  onGravado: (resultado: string, r: RespostaRegistar) => void;
}) {
  const pf = perfil(c.etiqueta);
  const nome = primeiroNome(c.nome);
  const tel = telHref(c.telefone);
  const ofertas = c.aSeguir?.ofertas || [];
  const [produto, setProduto] = useState("");
  const [ligou, setLigou] = useState(false);
  const oferta = ofertas.find((o) => o.codigo === produto) || ofertas[0] || null;
  const passos = guiaoCurto(c, oferta);
  const chave = fraseChave(c);
  const resultadosRef = useRef<HTMLElement>(null);
  const dias = textoDias(diasDesde(c.ultimaViagem, hoje));

  return (
    <article data-testid="proxima" data-ref={c.ref} className="crm-cartao-entra flex flex-col gap-4">
      <div className={`${PLACA} flex flex-col gap-4 p-5`}>
        <p className="text-sm font-semibold text-[var(--sinal)]">A próxima chamada</p>
        <Selo etiqueta={c.etiqueta} />
        <div>
          <h1 data-testid="nome" className="crm-display text-5xl leading-none font-extrabold break-words">
            {nome || "Cliente sem nome"}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-lg">
            <span aria-hidden className="text-2xl">
              {BANDEIRAS[c.lingua] || "🌐"}
            </span>
            Fala {(NOMES_LINGUA[c.lingua] || String(c.lingua || "—")).toLowerCase()}
          </p>
        </div>
        <ul className="flex flex-col gap-1.5 text-lg" data-testid="factos">
          {dias && <li>🧳 {dias}{c.viagens > 1 ? ` · ${c.viagens} viagens connosco` : ""}</li>}
          {c.nota !== null && c.nota !== undefined && (
            <li>
              <Estrelas n={c.nota} /> <span className="text-[var(--sinal)]">a nota que deu</span>
            </li>
          )}
          <li data-testid="comprados">
            🛍️ {c.produtos.length ? `Já comprou: ${c.produtos.map(nomeProduto).join(", ")}` : "Ainda não comprou nada"}
          </li>
        </ul>

        {tel ? (
          <a
            href={tel}
            data-testid="ligar"
            onClick={() => {
              setLigou(true);
              setTimeout(() => resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
            }}
            className={`${ligou ? BOTAO_LINHA : BOTAO_AMARELO} min-h-20 text-2xl font-bold`}
          >
            <Phone aria-hidden className="size-7" strokeWidth={2.5} />
            {ligou ? "Ligar outra vez" : "Ligar agora"}
          </a>
        ) : (
          <p className="rounded-2xl bg-[var(--betao)] p-4 text-[var(--sinal)]">Sem número. Registe «Número errado».</p>
        )}
      </div>

      <section data-testid="guiao" className={`${PLACA} p-5`} aria-labelledby="t-guiao">
        <h2 id="t-guiao" className="crm-display text-2xl font-bold">
          O que dizer
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {passos.map((s, i) => (
            <li key={i} className="flex gap-3 text-lg leading-snug">
              <span aria-hidden className="crm-display flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--asfalto)] text-base font-bold text-white">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div data-testid="frase-chave" lang={chave.lang} className="mt-4 rounded-2xl border-l-[6px] border-[var(--amarelo)] bg-[var(--amarelo-claro)] p-4">
          <p lang="pt-PT" className="text-sm font-semibold text-[var(--sinal)]">
            {BANDEIRAS[chave.lingua]} A frase-chave, em {(NOMES_LINGUA[chave.lingua] || chave.lingua).toLowerCase()}
          </p>
          <p className="mt-1 text-xl leading-snug font-semibold">
            {chave.ola} {chave.frase}
          </p>
        </div>
      </section>

      <Registar
        ref={resultadosRef}
        cliente={c}
        destaque={ligou}
        pedeNota={pf.pedeNota}
        produto={produto}
        setProduto={setProduto}
        pedir={pedir}
        onGravado={onGravado}
        nome={nome}
      />

      <Historico refCliente={c.ref} pedir={pedir} />
    </article>
  );
}

function Estrelas({ n }: { n: number }) {
  return (
    <span aria-label={`${n} de 5 estrelas`} className="tracking-wider text-[#d9a400]">
      {"★".repeat(n)}
      <span className="text-[#d9dce0]">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

// ── Registar a chamada ───────────────────────────────────────────

function diaMais(hoje: string, n: number) {
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function Registar({
  ref,
  cliente: c,
  destaque,
  pedeNota,
  produto,
  setProduto,
  pedir,
  onGravado,
  nome,
}: {
  ref: React.Ref<HTMLElement>;
  cliente: Cartao;
  destaque: boolean;
  pedeNota: boolean;
  produto: string;
  setProduto: (p: string) => void;
  pedir: Pedir;
  onGravado: (resultado: string, r: RespostaRegistar) => void;
  nome: string;
}) {
  const [resultado, setResultado] = useState("");
  const [ligarEm, setLigarEm] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [aceitaLink, setAceitaLink] = useState(false);
  const [nota, setNota] = useState("");
  const [comNota, setComNota] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState("");
  const [carrinho, setCarrinho] = useState<RespostaCarrinho | null>(null);
  const [erroCarrinho, setErroCarrinho] = useState("");
  const [aCriar, setACriar] = useState(false);
  const ofertas = c.aSeguir?.ofertas || [];
  const pct = c.aSeguir?.presente?.pct || 10;
  const hoje = hojeLisboa();
  const atendeu = !!resultado && resultado !== "NAO_ATENDEU" && resultado !== "NUMERO_ERRADO";
  const falaProduto = resultado === "COMPROU" || resultado === "INTERESSADO";

  const podeEnviar = !!resultado && (resultado !== "LIGAR_DEPOIS" || !!ligarEm) && !aEnviar;

  const enviar = async () => {
    if (!podeEnviar) return;
    setAEnviar(true);
    setErro("");
    const corpo: Record<string, unknown> = { action: "crmRegistar", ref: c.ref, resultado };
    if (resultado === "LIGAR_DEPOIS") corpo.ligarEm = ligarEm;
    if (produto && falaProduto) corpo.produto = produto;
    if (nota.trim()) corpo.nota = nota.trim();
    if (atendeu && avaliacao) {
      corpo.avaliacao = avaliacao;
      if (avaliacao < 5 && motivo.trim()) corpo.motivo = motivo.trim();
      if (avaliacao === 5) corpo.aceitaLink = aceitaLink;
    }
    try {
      const r = await pedir<RespostaRegistar>(corpo);
      onGravado(resultado, r);
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
      setAEnviar(false);
    }
  };

  const criarCarrinho = async () => {
    if (!produto || aCriar) return;
    setACriar(true);
    setErroCarrinho("");
    try {
      setCarrinho(await pedir<RespostaCarrinho>({ action: "crmCarrinho", ref: c.ref, produto }));
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErroCarrinho(e instanceof CrmErro ? e.message : "Erro no sistema.");
    } finally {
      setACriar(false);
    }
  };

  return (
    <section
      ref={ref}
      data-testid="registar"
      aria-labelledby="t-registar"
      className={`${PLACA} scroll-mt-4 p-5 transition-shadow ${destaque ? "ring-2 ring-[var(--amarelo)]" : ""}`}
    >
      <h2 id="t-registar" className="crm-display text-2xl font-bold">
        Como correu a chamada?
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3" role="group" aria-label="Resultado da chamada">
        {RESULTADOS_UI.map(({ codigo, texto, Icone }) => {
          const sel = resultado === codigo;
          const comprou = codigo === "COMPROU";
          const ultimo = codigo === "NUMERO_ERRADO";
          return (
            <button
              key={codigo}
              type="button"
              data-testid={`resultado-${codigo}`}
              aria-pressed={sel}
              onClick={() => setResultado(codigo)}
              className={`${BOTAO} min-h-20 flex-col gap-1 border-2 text-base ${comprou ? "col-span-2 min-h-16 flex-row text-xl" : ultimo ? "col-span-2 min-h-14 flex-row" : ""} ${
                sel ? "border-[var(--asfalto)] bg-[var(--asfalto)] text-white" : comprou ? "border-[var(--amarelo)] bg-[var(--amarelo-claro)]" : "border-[var(--linha)] bg-white"
              }`}
            >
              <Icone aria-hidden className="size-7" strokeWidth={2} />
              {texto}
            </button>
          );
        })}
      </div>

      {resultado && (
        <div className="crm-celebrar mt-5 flex flex-col gap-5 border-t border-[var(--linha)] pt-5">
          {resultado === "LIGAR_DEPOIS" && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-lg font-semibold">Quando volto a ligar?</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { t: "Amanhã", d: diaMais(hoje, 1) },
                  { t: "Daqui a 3 dias", d: diaMais(hoje, 3) },
                ].map((o) => (
                  <button
                    key={o.t}
                    type="button"
                    aria-pressed={ligarEm === o.d}
                    onClick={() => setLigarEm(o.d)}
                    className={`${BOTAO} border-2 text-base ${ligarEm === o.d ? "border-[var(--asfalto)] bg-[var(--asfalto)] text-white" : "border-[var(--linha)] bg-white"}`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-1 text-base text-[var(--sinal)]">
                Ou escolha o dia
                <input
                  type="date"
                  data-testid="ligar-em"
                  min={hoje}
                  value={ligarEm}
                  onChange={(e) => setLigarEm(e.target.value)}
                  className="min-h-14 rounded-2xl border-2 border-[var(--linha)] bg-white px-4 text-lg text-[var(--asfalto)]"
                />
              </label>
            </fieldset>
          )}

          {atendeu && (
            <fieldset>
              <legend className="mb-2 text-lg font-semibold">
                {pedeNota ? "Que nota deu à viagem?" : "Deu uma nota nova?"} <span className="font-normal text-[var(--sinal)]">(se perguntou)</span>
              </legend>
              <div role="radiogroup" aria-label="Nota de 1 a 5" className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={avaliacao === n}
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                    data-testid={`estrela-${n}`}
                    onClick={() => setAvaliacao(avaliacao === n ? 0 : n)}
                    className={`min-h-14 rounded-2xl border-2 text-3xl ${FOCO} ${
                      avaliacao >= n ? "border-[#e5b800] bg-[var(--amarelo-claro)] text-[#d9a400]" : "border-[var(--linha)] bg-white text-[#cfd3d8]"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {avaliacao > 0 && avaliacao < 5 && (
                <label className="mt-3 flex flex-col gap-2">
                  <span className="text-lg font-semibold">O que correu mal?</span>
                  <textarea
                    data-testid="motivo"
                    value={motivo}
                    maxLength={300}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={2}
                    className="rounded-2xl border-2 border-[var(--linha)] bg-white p-3 text-lg"
                  />
                </label>
              )}
              {avaliacao === 5 && (
                <label className="mt-3 flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--betao)] px-4 text-lg">
                  <input
                    type="checkbox"
                    data-testid="aceita-link"
                    checked={aceitaLink}
                    onChange={(e) => setAceitaLink(e.target.checked)}
                    className="size-7 accent-[#0b0c0c]"
                  />
                  {nome || "O cliente"} aceita o link do Google
                </label>
              )}
            </fieldset>
          )}

          {falaProduto && ofertas.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-lg font-semibold">{resultado === "COMPROU" ? "O que comprou?" : "Do que gostou?"}</legend>
              <div className="flex flex-col gap-2">
                {ofertas.map((o) => (
                  <button
                    key={o.codigo}
                    type="button"
                    data-testid={`produto-${o.codigo}`}
                    aria-pressed={produto === o.codigo}
                    onClick={() => {
                      setProduto(produto === o.codigo ? "" : o.codigo);
                      setCarrinho(null);
                    }}
                    className={`${BOTAO} justify-start border-2 text-left ${
                      produto === o.codigo ? "border-[var(--asfalto)] bg-[var(--asfalto)] text-white" : "border-[var(--linha)] bg-white"
                    }`}
                  >
                    {produto === o.codigo && <Check aria-hidden className="size-5" />}
                    {o.nome}
                  </button>
                ))}
              </div>
              {produto && (
                <div className="mt-3 flex flex-col gap-2">
                  {!carrinho && (
                    <button type="button" data-testid="criar-carrinho" disabled={aCriar} onClick={criarCarrinho} className={BOTAO_LINHA}>
                      🛒 {aCriar ? "A criar…" : `Criar carrinho com ${pct}%`}
                    </button>
                  )}
                  {erroCarrinho && (
                    <p role="alert" data-testid="erro-carrinho" className="text-lg font-semibold text-[#b42318]">
                      {erroCarrinho}
                    </p>
                  )}
                  {carrinho && (
                    <div data-testid="carrinho" role="status" className="rounded-2xl border-2 border-[var(--amarelo)] bg-[var(--amarelo-claro)] p-4 text-center">
                      {carrinho.ensaio && <p className="mb-1 text-base font-semibold">Ensaio: o carrinho não foi criado.</p>}
                      <p className="text-base text-[var(--sinal)]">Peça o link no posto com esta referência:</p>
                      <p data-testid="ref-carrinho" className="crm-display my-1 text-4xl font-extrabold tracking-wider select-all">
                        {carrinho.refCliente}
                      </p>
                      <p className="text-sm text-[var(--sinal)]">
                        Carrinho {carrinho.carrinho}
                        {typeof carrinho.total === "number" ? ` · ${carrinho.total.toFixed(2).replace(".", ",")} €` : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {comNota ? (
            <label className="flex flex-col gap-2">
              <span className="text-lg font-semibold">Nota</span>
              <textarea
                data-testid="nota"
                value={nota}
                maxLength={300}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="O que ficou combinado…"
                className="rounded-2xl border-2 border-[var(--linha)] bg-white p-3 text-lg placeholder:text-[#b4b9bf]"
              />
            </label>
          ) : (
            <button type="button" data-testid="abrir-nota" onClick={() => setComNota(true)} className={`self-start text-base font-semibold underline underline-offset-4 ${FOCO}`}>
              ✏️ Escrever uma nota
            </button>
          )}

          {erro && (
            <p role="alert" data-testid="erro-registar" className="text-lg font-semibold text-[#b42318]">
              {erro}
            </p>
          )}

          <button type="button" data-testid="gravar" disabled={!podeEnviar} onClick={enviar} className={`${BOTAO_ESCURO} min-h-16 text-xl`}>
            {aEnviar ? "A gravar…" : "Gravar e seguir"}
          </button>
        </div>
      )}
    </section>
  );
}

// ── O que já aconteceu (só quando se abre) ───────────────────────

function Historico({ refCliente, pedir }: { refCliente: string; pedir: Pedir }) {
  const [dados, setDados] = useState<RespostaCliente | null>(null);
  const [erro, setErro] = useState("");
  const pedido = useRef(false);

  const abrir = async (aberto: boolean) => {
    if (!aberto || pedido.current) return;
    pedido.current = true;
    try {
      setDados(await pedir<RespostaCliente>({ action: "crmCliente", ref: refCliente }));
    } catch (e) {
      pedido.current = false;
      if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
    }
  };

  return (
    <details data-testid="historico" className={`${PLACA} group p-5`} onToggle={(e) => abrir((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between text-lg font-semibold ${FOCO}`}>
        O que já aconteceu
        <span aria-hidden className="transition group-open:rotate-90">
          ›
        </span>
      </summary>
      {erro && <p className="mt-3 text-[#b42318]">{erro}</p>}
      {!dados && !erro && <p className="mt-3 text-[var(--sinal)]">A abrir…</p>}
      {dados &&
        (dados.eventos.length ? (
          <ol data-testid="eventos" className="mt-3 flex flex-col gap-3">
            {dados.eventos.map((e, i) => (
              <li key={i} className="border-l-4 border-[var(--linha)] pl-3">
                <p className="text-sm text-[var(--sinal)]">{dataPt(e.quando)}</p>
                <p className="text-base">{eventoSimples(e)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-[var(--sinal)]">Ainda nada registado.</p>
        ))}
    </details>
  );
}

// ── A lista toda ─────────────────────────────────────────────────

const FORA: Record<string, string> = {
  STOP: "pediram STOP",
  NAO_QUER: "não querem (60 dias)",
  LIGAR_DEPOIS: "ligar noutro dia",
  NUMERO_ERRADO: "número errado",
  JA_CHAMADO_HOJE: "já ligados hoje",
};

function Lista({
  fila,
  hoje,
  foraDaFila,
  onVoltar,
  onEscolher,
}: {
  fila: Cartao[];
  hoje: string;
  foraDaFila: Record<string, number>;
  onVoltar: () => void;
  onEscolher: (ref: string) => void;
}) {
  const fora = Object.entries(foraDaFila || {}).filter(([, n]) => n > 0);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="t-lista">
      <button type="button" data-testid="voltar" onClick={onVoltar} className={`${BOTAO_LINHA} self-start pr-5 pl-3`}>
        <ChevronLeft aria-hidden className="size-6" /> A próxima chamada
      </button>
      <h1 id="t-lista" className="crm-display text-3xl font-bold">
        Por ligar hoje ({fila.length})
      </h1>
      <ol data-testid="lista" className="flex flex-col gap-3">
        {fila.map((c, i) => (
          <li key={c.ref}>
            <button
              type="button"
              data-testid="item-lista"
              data-ref={c.ref}
              onClick={() => onEscolher(c.ref)}
              className={`${PLACA} flex w-full flex-col items-start gap-2 p-4 text-left ${FOCO}`}
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className="crm-display text-2xl font-bold">
                  {primeiroNome(c.nome) || "Cliente sem nome"} <span aria-hidden>{BANDEIRAS[c.lingua] || "🌐"}</span>
                </span>
                {i === 0 && <span className="text-sm font-semibold text-[var(--sinal)]">a seguir</span>}
              </span>
              <Selo etiqueta={c.etiqueta} />
              <span className="text-base text-[var(--sinal)]">{textoDias(diasDesde(c.ultimaViagem, hoje))}</span>
            </button>
          </li>
        ))}
      </ol>
      {fora.length > 0 && (
        <p className="px-1 text-sm text-[var(--sinal)]">Fora da fila hoje: {fora.map(([k, n]) => `${n} ${FORA[k] || k.toLowerCase().replace(/_/g, " ")}`).join(", ")}</p>
      )}
    </section>
  );
}

// ── Celebração ───────────────────────────────────────────────────

const CORES_CONFETE = ["#f2cf32", "#0b0c0c", "#f2cf32", "#15803d", "#ffffff"];

function Celebracao({ festa, onSeguir }: { festa: Festa; onSeguir: () => void }) {
  const venda = festa.resultado === "COMPROU" && !festa.ensaio;
  const confetes = useMemo(
    () =>
      venda || festa.meta
        ? Array.from({ length: 36 }, (_, i) => ({
            left: `${(i * 97) % 100}%`,
            cor: CORES_CONFETE[i % CORES_CONFETE.length],
            atraso: `${(i % 9) * 0.06}s`,
            dx: `${((i * 37) % 120) - 60}px`,
            rot: `${360 + ((i * 53) % 540)}deg`,
          }))
        : [],
    [venda, festa.meta],
  );
  const titulo = festa.ensaio ? "Ensaio: nada foi gravado" : festa.meta ? "Meta cumprida 🎉" : venda ? "Venda feita! 🎉" : "Chamada gravada";
  const sub = festa.ensaio ? "Passamos ao cliente seguinte." : festa.meta ? "Cumpriu a meta do dia. Excelente trabalho!" : venda ? "Muito bem. Vamos à próxima." : "Vamos à próxima.";
  return (
    <div
      data-testid="celebracao"
      data-resultado={festa.resultado}
      role="status"
      aria-live="assertive"
      onClick={onSeguir}
      className={`crm-celebrar fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6 ${venda || festa.meta ? "bg-[var(--amarelo)]" : "bg-[rgba(241,242,244,0.94)]"}`}
    >
      {confetes.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="crm-confete"
          style={{ left: c.left, background: c.cor, animationDelay: c.atraso, ["--dx" as string]: c.dx, ["--rot" as string]: c.rot }}
        />
      ))}
      <div className={`${PLACA} crm-selo-ok relative flex w-full max-w-sm flex-col items-center gap-3 p-8 text-center`}>
        <span className={`flex size-20 items-center justify-center rounded-full ${festa.ensaio ? "bg-[var(--betao)]" : "bg-[var(--asfalto)]"}`}>
          {festa.ensaio ? <span className="text-4xl">⚠️</span> : <Check aria-hidden className="size-11 text-[var(--amarelo)]" strokeWidth={3} />}
        </span>
        <p className="crm-display text-4xl leading-none font-extrabold">{titulo}</p>
        <p className="text-lg text-[var(--sinal)]">{sub}</p>
        {festa.link && <p className="text-base">{festa.link}</p>}
        {festa.avisos.map((a, i) => (
          <p key={i} className="text-base text-[var(--sinal)]">
            {a}
          </p>
        ))}
      </div>
    </div>
  );
}
