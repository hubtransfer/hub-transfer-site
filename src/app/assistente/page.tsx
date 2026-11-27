"use client";

// /assistente — o CRM da assistente (E20). Pensado para o telemóvel: letra grande, botões grandes.
// Entrada com o código → fila do dia → ficha do cliente (guião + registar + carrinho).
// O crachá vive só no sessionStorage e acaba ao fim de 12 h (ou no botão «Sair»).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BANDEIRAS,
  CrmErro,
  ETIQUETAS,
  NOMES_LINGUA,
  RESULTADOS,
  apagarSessao,
  dataPt,
  ehSessaoRecusada,
  eventoSimples,
  gravarSessao,
  guiao,
  hojeLisboa,
  lerSessao,
  pedirCrm,
  telHref,
  textoResultado,
  type Cartao,
  type Oferta,
  type RespostaBase,
  type RespostaCarrinho,
  type RespostaCliente,
  type RespostaFila,
  type RespostaRegistar,
  type Sessao,
} from "@/lib/crm/crm";

const BOTAO =
  "min-h-14 rounded-2xl px-5 text-lg font-semibold transition active:scale-[0.98] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hub-gold";
const BOTAO_OURO = `${BOTAO} bg-hub-gold text-hub-black`;
const BOTAO_LINHA = `${BOTAO} border border-hub-gray-700 bg-hub-black-card text-hub-white`;
const CARTAO = "rounded-2xl border border-hub-gray-800 bg-hub-black-card p-4";

// ─────────────────────────────────────────────────────────────────

export default function PaginaAssistente() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ensaio, setEnsaio] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    setSessao(lerSessao());
    setPronto(true);
  }, []);

  const sair = useCallback((msg = "") => {
    apagarSessao();
    setSessao(null);
    setAberto(null);
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

  // O botão «voltar» do telemóvel fecha a ficha.
  useEffect(() => {
    const voltar = () => setAberto(null);
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);

  const pedir = useCallback(
    async <T extends RespostaBase>(corpo: Record<string, unknown>): Promise<T> => {
      try {
        const r = await pedirCrm<T>({ ...corpo, cracha: sessao?.cracha || "" });
        if (r.ensaio === true) setEnsaio(true);
        return r;
      } catch (e) {
        if (ehSessaoRecusada(e)) sair((e as CrmErro).message);
        throw e;
      }
    },
    [sessao, sair],
  );

  const abrir = (ref: string) => {
    window.history.pushState({ ficha: ref }, "");
    setAberto(ref);
    window.scrollTo(0, 0);
  };
  const fechar = () => {
    if (window.history.state?.ficha) window.history.back();
    else setAberto(null);
  };

  return (
    <main className="min-h-dvh bg-hub-black pb-[max(2rem,env(safe-area-inset-bottom))] text-[18px] leading-relaxed text-hub-white">
      {ensaio && (
        <div
          data-testid="faixa-ensaio"
          role="status"
          className="sticky top-0 z-30 bg-yellow-300 px-4 py-3 text-center text-base font-bold text-black"
        >
          ⚠️ Modo de ensaio: nada foi gravado
        </div>
      )}
      <div className="mx-auto w-full max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {!pronto ? null : !sessao ? (
          <Entrada
            aviso={aviso}
            onEntrar={(s) => {
              setAviso("");
              setSessao(s);
            }}
          />
        ) : aberto ? (
          <Ficha key={aberto} refCliente={aberto} pedir={pedir} onVoltar={fechar} />
        ) : (
          <Fila sessao={sessao} pedir={pedir} onAbrir={abrir} onSair={() => sair("")} />
        )}
      </div>
    </main>
  );
}

type Pedir = <T extends RespostaBase>(corpo: Record<string, unknown>) => Promise<T>;

// ── Entrada ──────────────────────────────────────────────────────

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
    <section className="flex min-h-[80dvh] flex-col justify-center gap-6">
      <div>
        <p className="font-mono text-sm tracking-[0.25em] text-hub-gold">HUB TRANSFER</p>
        <h1 className="mt-2 text-4xl font-bold">CRM da assistente</h1>
        <p className="mt-2 text-hub-white-dim">Escreva o código que recebeu para começar.</p>
      </div>
      {aviso && (
        <p role="status" className="rounded-2xl border border-hub-gray-700 bg-hub-black-card p-4 text-hub-white-muted">
          {aviso}
        </p>
      )}
      <form onSubmit={entrar} className="flex flex-col gap-4">
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
          className="min-h-16 rounded-2xl border border-hub-gray-700 bg-hub-black-card px-4 font-mono text-2xl tracking-widest text-hub-white placeholder:text-hub-gray-700 focus:border-hub-gold focus:outline-none"
        />
        {erro && (
          <p data-testid="erro-entrada" role="alert" className="text-lg font-semibold text-red-300">
            {erro}
          </p>
        )}
        <button type="submit" data-testid="entrar" disabled={!codigo.trim() || aEnviar} className={BOTAO_OURO}>
          {aEnviar ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}

// ── Fila do dia ──────────────────────────────────────────────────

const FORA: Record<string, string> = {
  STOP: "pediram STOP",
  NAO_QUER: "não querem (60 dias)",
  LIGAR_DEPOIS: "ligar noutro dia",
  NUMERO_ERRADO: "número errado",
  JA_CHAMADO_HOJE: "já ligados hoje",
};

function Fila({ sessao, pedir, onAbrir, onSair }: { sessao: Sessao; pedir: Pedir; onAbrir: (ref: string) => void; onSair: () => void }) {
  const [dados, setDados] = useState<RespostaFila | null>(null);
  const [erro, setErro] = useState("");
  const [aCarregar, setACarregar] = useState(true);

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro("");
    try {
      setDados(await pedir<RespostaFila>({ action: "crmFila" }));
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
    } finally {
      setACarregar(false);
    }
  }, [pedir]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fora = Object.entries(dados?.foraDaFila || {}).filter(([, n]) => n > 0);

  return (
    <section className="flex flex-col gap-4 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base text-hub-white-dim">Olá, {sessao.nome}</p>
          <h1 className="text-3xl font-bold">Fila do dia</h1>
          {dados && (
            <p data-testid="resumo-fila" className="font-mono text-sm text-hub-white-dim">
              {dataPt(dados.hoje)} · {dados.mostrados} de {dados.total} clientes
            </p>
          )}
        </div>
        <button type="button" data-testid="sair" onClick={onSair} className={`${BOTAO_LINHA} min-h-12 shrink-0 px-4 text-base`}>
          Sair
        </button>
      </header>

      <button type="button" onClick={carregar} disabled={aCarregar} className={BOTAO_LINHA}>
        {aCarregar ? "A carregar…" : "↻ Actualizar"}
      </button>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-lg text-red-200">
          {erro}
        </p>
      )}

      {dados && dados.clientes.length === 0 && (
        <p className={`${CARTAO} text-center text-lg text-hub-white-muted`}>Não há ninguém para ligar hoje. 🎉</p>
      )}

      <ol className="flex flex-col gap-4" data-testid="fila">
        {dados?.clientes.map((c) => (
          <li key={c.ref} data-testid="cartao" data-ref={c.ref} className={`${CARTAO} flex flex-col gap-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <EtiquetaBadge etiqueta={c.etiqueta} />
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-2xl font-bold">
                {c.nome || "Cliente"}{" "}
                <span aria-label={NOMES_LINGUA[c.lingua] || c.lingua} title={NOMES_LINGUA[c.lingua] || c.lingua}>
                  {BANDEIRAS[c.lingua] || "🌐"}
                </span>
              </h2>
              <span className="font-mono text-sm text-hub-white-dim">{c.ref}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-base">
              <dt className="text-hub-white-dim">Viagens</dt>
              <dd className="font-mono">{c.viagens}</dd>
              <dt className="text-hub-white-dim">Última viagem</dt>
              <dd className="font-mono">{dataPt(c.ultimaViagem) || "—"}</dd>
              {c.nota !== null && (
                <>
                  <dt className="text-hub-white-dim">Nota</dt>
                  <dd>
                    <Estrelas n={c.nota} />
                  </dd>
                </>
              )}
            </dl>
            {c.motivo && <p className="rounded-xl bg-hub-black px-3 py-2 text-base text-hub-white-muted">«{c.motivo}»</p>}
            <div className="grid grid-cols-2 gap-3">
              {telHref(c.telefone) ? (
                <a href={telHref(c.telefone)} data-testid="ligar" className={`${BOTAO_OURO} flex items-center justify-center`}>
                  📞 Ligar
                </a>
              ) : (
                <span className={`${BOTAO_LINHA} flex items-center justify-center opacity-40`}>Sem número</span>
              )}
              <button type="button" data-testid="abrir" onClick={() => onAbrir(c.ref)} className={BOTAO_LINHA}>
                Abrir
              </button>
            </div>
          </li>
        ))}
      </ol>

      {fora.length > 0 && (
        <p className="text-sm text-hub-white-dim">
          Fora da fila hoje: {fora.map(([k, n]) => `${n} ${FORA[k] || k.toLowerCase().replace(/_/g, " ")}`).join(" · ")}
        </p>
      )}
    </section>
  );
}

function EtiquetaBadge({ etiqueta }: { etiqueta: string }) {
  const e = ETIQUETAS[String(etiqueta).toUpperCase()];
  if (!e) return null;
  return (
    <span data-testid="etiqueta" className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold tracking-wide ${e.classe}`}>
      <span aria-hidden>{e.emoji}</span> {e.texto}
    </span>
  );
}

function Estrelas({ n }: { n: number }) {
  return (
    <span aria-label={`${n} de 5`} className="text-hub-gold">
      {"★".repeat(n)}
      <span className="text-hub-gray-700">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

// ── Ficha do cliente ─────────────────────────────────────────────

function Ficha({ refCliente, pedir, onVoltar }: { refCliente: string; pedir: Pedir; onVoltar: () => void }) {
  const [dados, setDados] = useState<RespostaCliente | null>(null);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState("");

  const carregar = useCallback(async () => {
    setErro("");
    try {
      setDados(await pedir<RespostaCliente>({ action: "crmCliente", ref: refCliente }));
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
    }
  }, [pedir, refCliente]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const c = dados?.cliente;
  const ofertas = c?.aSeguir?.ofertas || [];
  const ofertaEscolhida = ofertas.find((o) => o.codigo === produto) || ofertas[0] || null;

  return (
    <section className="flex flex-col gap-5 pt-2">
      <button type="button" data-testid="voltar" onClick={onVoltar} className={`${BOTAO_LINHA} self-start`}>
        ← Fila
      </button>

      {erro && (
        <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-lg text-red-200">
          {erro}
        </p>
      )}
      {!c && !erro && <p className="text-hub-white-dim">A abrir a ficha…</p>}

      {c && (
        <>
          <header className="flex flex-col gap-2">
            <EtiquetaBadge etiqueta={c.etiqueta} />
            <h1 className="text-3xl font-bold" data-testid="nome-ficha">
              {c.nome || "Cliente"} <span>{BANDEIRAS[c.lingua] || "🌐"}</span>
            </h1>
            <p className="font-mono text-sm text-hub-white-dim">
              {c.ref} · {NOMES_LINGUA[c.lingua] || c.lingua} · {c.canal === "OPERADORA" ? "Operadora" : c.canal === "DIRECTO" ? "Directo" : c.canal || "—"}
            </p>
            {telHref(c.telefone) && (
              <a href={telHref(c.telefone)} data-testid="ligar-ficha" className={`${BOTAO_OURO} flex items-center justify-center text-xl`}>
                📞 Ligar
              </a>
            )}
          </header>

          <Guiao cliente={c} oferta={ofertaEscolhida} />

          <Bloco titulo="Resumo">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
              <Linha t="Viagens" v={String(c.viagens)} />
              <Linha t="Última viagem" v={dataPt(c.ultimaViagem)} />
              {c.nota !== null && (
                <>
                  <dt className="text-hub-white-dim">Nota</dt>
                  <dd>
                    <Estrelas n={c.nota} /> {c.notaEm && <span className="font-mono text-sm text-hub-white-dim">({dataPt(c.notaEm)})</span>}
                  </dd>
                </>
              )}
              <Linha t="Motivo" v={c.motivo} />
              <Linha t="Última chamada" v={c.ultimaChamada ? `${dataPt(c.ultimaChamada)}${c.resultadoChamada ? ` · ${textoResultado(c.resultadoChamada)}` : ""}` : ""} />
              <Linha t="Ligar em" v={dataPt(c.ligarEm)} />
              <Linha t="Na fila hoje" v={dados?.naFila ? "Sim" : "Não"} />
            </dl>
          </Bloco>

          <Bloco titulo="O que já comprou">
            {c.produtos.length ? (
              <ul className="flex flex-wrap gap-2" data-testid="comprados">
                {c.produtos.map((p) => (
                  <li key={p} className="rounded-full border border-hub-gray-700 px-3 py-1 font-mono text-sm">
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-hub-white-dim">Ainda nada.</p>
            )}
            {c.ultimasOfertas.length > 0 && (
              <>
                <h3 className="mt-3 text-base font-semibold text-hub-white-muted">Últimas ofertas</h3>
                <ul className="mt-1 flex flex-col gap-1 text-base">
                  {c.ultimasOfertas.map((o, i) => (
                    <li key={i}>
                      <span className="font-mono text-sm text-hub-white-dim">{dataPt(o.em)}</span> · {o.produto}
                      {o.resultado ? ` · ${o.resultado}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Bloco>

          <Bloco titulo="Ofertas sugeridas">
            {c.aSeguir.presente && (
              <p data-testid="presente" className="mb-3 rounded-xl border border-hub-gold/40 bg-hub-gold-muted px-3 py-2 text-lg font-semibold text-hub-gold">
                🎁 Presente: {c.aSeguir.presente.pct}% de desconto
              </p>
            )}
            {ofertas.length ? (
              <ul className="flex flex-col gap-2" data-testid="ofertas">
                {ofertas.map((o) => (
                  <li key={o.codigo}>
                    <button
                      type="button"
                      onClick={() => setProduto(o.codigo)}
                      aria-pressed={produto === o.codigo}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-lg ${
                        produto === o.codigo ? "border-hub-gold bg-hub-gold-muted" : "border-hub-gray-700 bg-hub-black"
                      }`}
                    >
                      <span className="font-semibold">{o.nome}</span>
                      <span className="block font-mono text-sm text-hub-white-dim">
                        {o.codigo}
                        {o.tipo ? ` · ${o.tipo}` : ""}
                        {o.momento ? ` · ${o.momento}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-hub-white-dim">Sem ofertas para este cliente.</p>
            )}
          </Bloco>

          <Registar cliente={c} ofertas={ofertas} produto={produto} setProduto={setProduto} pedir={pedir} />

          <Bloco titulo="Histórico">
            {dados!.eventos.length ? (
              <ol className="flex flex-col gap-3" data-testid="eventos">
                {dados!.eventos.map((e, i) => (
                  <li key={i} className="border-l-2 border-hub-gray-700 pl-3">
                    <p className="font-mono text-sm text-hub-white-dim">
                      {dataPt(e.quando)}
                      {e.viagem ? ` · viagem ${e.viagem}` : ""}
                    </p>
                    <p className="text-base">{eventoSimples(e)}</p>
                    {e.resumo && <p className="text-sm text-hub-white-dim">{e.resumo}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-hub-white-dim">Sem registos.</p>
            )}
          </Bloco>

          <Bloco titulo="Ficha completa">
            <dl className="grid grid-cols-1 gap-y-2 text-base sm:grid-cols-[auto_1fr] sm:gap-x-4" data-testid="ficha">
              {Object.entries(dados!.ficha)
                .filter(([, v]) => v !== "" && v !== null && v !== undefined)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-sm text-hub-white-dim sm:text-base">{k}</dt>
                    <dd className="break-words">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          </Bloco>
        </>
      )}
    </section>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className={CARTAO}>
      <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

function Linha({ t, v }: { t: string; v: string }) {
  if (!v) return null;
  return (
    <>
      <dt className="text-hub-white-dim">{t}</dt>
      <dd className="break-words">{v}</dd>
    </>
  );
}

// ── Guião ────────────────────────────────────────────────────────

function Guiao({ cliente, oferta }: { cliente: Cartao; oferta: Oferta | null }) {
  const falas = guiao(cliente, oferta);
  const ingles = cliente.lingua !== "PT";
  return (
    <section data-testid="guiao" className="rounded-2xl border border-hub-gold/40 bg-hub-black-card p-4">
      <h2 className="text-xl font-bold text-hub-gold">Guião da chamada</h2>
      <p className="mb-3 text-sm text-hub-white-dim">
        Cliente em {NOMES_LINGUA[cliente.lingua] || cliente.lingua} {BANDEIRAS[cliente.lingua] || ""} —{" "}
        {ingles ? "fale em inglês (a versão em destaque)." : "fale em português (a versão em destaque)."}
      </p>
      <ol className="flex flex-col gap-4">
        {falas.map((f) => (
          <li key={f.id} data-testid={`fala-${f.id}`}>
            <h3 className="mb-1 text-sm font-bold tracking-wide text-hub-white-muted uppercase">{f.titulo}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Versao bandeira="🇵🇹" lingua="PT" texto={f.pt} destaque={!ingles} />
              <Versao bandeira="🇬🇧" lingua="EN" texto={f.en} destaque={ingles} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Versao({ bandeira, lingua, texto, destaque }: { bandeira: string; lingua: string; texto: string; destaque: boolean }) {
  return (
    <p
      lang={lingua === "PT" ? "pt-PT" : "en"}
      className={`rounded-xl px-3 py-2 ${
        destaque ? "order-first border border-hub-gold/60 bg-hub-gold-muted text-lg text-hub-white sm:order-none" : "border border-hub-gray-800 text-base text-hub-white-dim"
      }`}
    >
      <span className="mr-1 font-mono text-xs">
        {bandeira} {lingua}
      </span>{" "}
      {texto}
    </p>
  );
}

// ── Registar a chamada + carrinho ────────────────────────────────

function Registar({
  cliente,
  ofertas,
  produto,
  setProduto,
  pedir,
}: {
  cliente: Cartao;
  ofertas: Oferta[];
  produto: string;
  setProduto: (p: string) => void;
  pedir: Pedir;
}) {
  const [resultado, setResultado] = useState("");
  const [ligarEm, setLigarEm] = useState("");
  const [perguntou, setPerguntou] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [aceitaLink, setAceitaLink] = useState(false);
  const [nota, setNota] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState<RespostaRegistar | null>(null);
  const [carrinho, setCarrinho] = useState<RespostaCarrinho | null>(null);
  const [erroCarrinho, setErroCarrinho] = useState("");
  const [aCriar, setACriar] = useState(false);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const pct = cliente.aSeguir?.presente?.pct || 10;

  const podeEnviar = !!resultado && (resultado !== "LIGAR_DEPOIS" || !!ligarEm) && (!perguntou || avaliacao > 0) && !aEnviar && !feito;

  const enviar = async () => {
    if (!podeEnviar) return;
    setAEnviar(true);
    setErro("");
    const corpo: Record<string, unknown> = { action: "crmRegistar", ref: cliente.ref, resultado };
    if (resultado === "LIGAR_DEPOIS") corpo.ligarEm = ligarEm;
    if (produto) corpo.produto = produto;
    if (nota.trim()) corpo.nota = nota.trim();
    if (perguntou && avaliacao) {
      corpo.avaliacao = avaliacao;
      if (avaliacao < 5 && motivo.trim()) corpo.motivo = motivo.trim();
      if (avaliacao === 5) corpo.aceitaLink = aceitaLink;
    }
    try {
      setFeito(await pedir<RespostaRegistar>(corpo));
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErro(e instanceof CrmErro ? e.message : "Erro no sistema.");
    } finally {
      setAEnviar(false);
    }
  };

  const criarCarrinho = async () => {
    if (!produto || aCriar) return;
    setACriar(true);
    setErroCarrinho("");
    try {
      setCarrinho(await pedir<RespostaCarrinho>({ action: "crmCarrinho", ref: cliente.ref, produto }));
    } catch (e) {
      if (!ehSessaoRecusada(e)) setErroCarrinho(e instanceof CrmErro ? e.message : "Erro no sistema.");
    } finally {
      setACriar(false);
    }
  };

  return (
    <section data-testid="registar" className={`${CARTAO} flex flex-col gap-5`}>
      <h2 className="text-xl font-bold">Registar a chamada</h2>

      <fieldset>
        <legend className="mb-2 text-lg font-semibold">Resultado</legend>
        <div className="grid grid-cols-2 gap-3">
          {RESULTADOS.map((r) => (
            <button
              key={r.codigo}
              type="button"
              data-testid={`resultado-${r.codigo}`}
              aria-pressed={resultado === r.codigo}
              onClick={() => setResultado(r.codigo)}
              className={`${BOTAO} border ${
                resultado === r.codigo ? "border-hub-gold bg-hub-gold text-hub-black" : "border-hub-gray-700 bg-hub-black text-hub-white"
              }`}
            >
              <span aria-hidden>{r.emoji}</span> {r.texto}
            </button>
          ))}
        </div>
      </fieldset>

      {resultado === "LIGAR_DEPOIS" && (
        <label className="flex flex-col gap-2">
          <span className="text-lg font-semibold">Ligar no dia</span>
          <input
            type="date"
            data-testid="ligar-em"
            min={hojeLisboa()}
            value={ligarEm}
            onChange={(e) => setLigarEm(e.target.value)}
            className="min-h-14 rounded-2xl border border-hub-gray-700 bg-hub-black px-4 text-lg text-hub-white [color-scheme:dark]"
          />
        </label>
      )}

      <label className="flex min-h-14 items-center gap-3 text-lg">
        <input
          type="checkbox"
          data-testid="perguntou-nota"
          checked={perguntou}
          onChange={(e) => {
            setPerguntou(e.target.checked);
            if (!e.target.checked) setAvaliacao(0);
          }}
          className="size-7 accent-[var(--hub-gold)]"
        />
        Perguntei a nota da viagem
      </label>

      {perguntou && (
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Nota de 1 a 5" className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={avaliacao === n}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                data-testid={`estrela-${n}`}
                onClick={() => setAvaliacao(n)}
                className={`min-h-14 rounded-2xl border text-3xl ${
                  avaliacao >= n ? "border-hub-gold text-hub-gold" : "border-hub-gray-700 text-hub-gray-700"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {avaliacao > 0 && avaliacao < 5 && (
            <label className="flex flex-col gap-2">
              <span className="text-lg font-semibold">O que correu mal?</span>
              <textarea
                data-testid="motivo"
                value={motivo}
                maxLength={300}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="rounded-2xl border border-hub-gray-700 bg-hub-black p-3 text-lg text-hub-white"
              />
            </label>
          )}
          {avaliacao === 5 && (
            <label className="flex min-h-14 items-center gap-3 text-lg">
              <input
                type="checkbox"
                data-testid="aceita-link"
                checked={aceitaLink}
                onChange={(e) => setAceitaLink(e.target.checked)}
                className="size-7 accent-[var(--hub-gold)]"
              />
              Aceita receber o link do Google
            </label>
          )}
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Produto falado</span>
        <select
          data-testid="produto"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          className="min-h-14 appearance-none rounded-2xl border border-hub-gray-700 bg-hub-black px-4 text-lg text-hub-white [color-scheme:dark]"
        >
          <option value="">— Nenhum —</option>
          {ofertas.map((o) => (
            <option key={o.codigo} value={o.codigo}>
              {o.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Nota</span>
        <textarea
          data-testid="nota"
          value={nota}
          maxLength={300}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          placeholder="O que ficou combinado…"
          className="rounded-2xl border border-hub-gray-700 bg-hub-black p-3 text-lg text-hub-white placeholder:text-hub-gray-700"
        />
      </label>

      {erro && (
        <p role="alert" data-testid="erro-registar" className="text-lg font-semibold text-red-300">
          {erro}
        </p>
      )}

      <button type="button" data-testid="gravar" disabled={!podeEnviar} onClick={enviar} className={BOTAO_OURO}>
        {aEnviar ? "A gravar…" : "Gravar a chamada"}
      </button>

      {feito && (
        <div ref={resultadoRef} data-testid="feito" role="status" className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4">
          <p className="text-lg font-bold text-emerald-200">{feito.ensaio ? "Ensaio: a chamada não foi gravada." : "✅ Chamada gravada."}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-base">
            Etiqueta agora: {ETIQUETAS[String(feito.etiqueta).toUpperCase()] ? <EtiquetaBadge etiqueta={feito.etiqueta} /> : <span>sem etiqueta</span>}
          </p>
          {feito.link && (
            <p className="mt-1 text-base">
              Link do Google: {feito.link.ok ? "vai pelo WhatsApp" : "não saiu"} {feito.link.motivo ? `(${feito.link.motivo})` : ""}
            </p>
          )}
          {feito.avisos && feito.avisos.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-base text-hub-white-muted">
              {feito.avisos.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-hub-gray-800 pt-5">
        <button type="button" data-testid="criar-carrinho" disabled={!produto || aCriar} onClick={criarCarrinho} className={BOTAO_LINHA}>
          🛒 {aCriar ? "A criar…" : `Criar carrinho com ${pct}%`}
        </button>
        {!produto && <p className="text-sm text-hub-white-dim">Escolha primeiro o produto falado.</p>}
        {erroCarrinho && (
          <p role="alert" data-testid="erro-carrinho" className="text-lg font-semibold text-red-300">
            {erroCarrinho}
          </p>
        )}
        {carrinho && (
          <div data-testid="carrinho" role="status" className="rounded-2xl border border-hub-gold/50 bg-hub-gold-muted p-4 text-center">
            {carrinho.ensaio && <p className="mb-2 text-base font-semibold text-yellow-200">Ensaio: o carrinho não foi criado.</p>}
            <p className="text-base text-hub-white-muted">Peça o link no posto com esta referência:</p>
            <p data-testid="ref-carrinho" className="my-2 font-mono text-4xl font-bold tracking-wider text-hub-gold select-all">
              {carrinho.refCliente}
            </p>
            <p className="font-mono text-sm text-hub-white-dim">
              Carrinho {carrinho.carrinho}
              {typeof carrinho.total === "number" ? ` · ${carrinho.total.toFixed(2).replace(".", ",")} €` : ""}
            </p>
            {Array.isArray(carrinho.aDefinir) && carrinho.aDefinir.length > 0 && (
              <p className="mt-1 text-sm text-hub-white-dim">Preço a definir: {carrinho.aDefinir.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
