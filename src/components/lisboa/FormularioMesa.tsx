"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { obterCliente, type Cliente } from "@/lib/lisboa/cliente";
import type { RestauranteLista } from "@/lib/lisboa/formulario";
import { medir } from "@/lib/lisboa/medicao";
import {
  aoAbrirMesa,
  diaPorExtenso,
  hoje,
  ligacaoMapa,
  mensagemMesa,
  servicoDe,
  sitioNoEcra,
  somarMinutos,
  type Ida,
  type PedidoMesa,
  type Sitio,
  type Volta,
} from "@/lib/lisboa/mesa";
import type { Textos } from "@/lib/lisboa/textos";
import type { Lingua } from "@/lib/lisboa/tipos";

/* Pedido da mesa em 4 passos no mesmo painel (pedido E8): 1 a mesa → 2 como vai → 3 como volta → 4 resumo.
   Abre por cima da página (folha em baixo no telemóvel, cartão ao centro no computador).
   No fim só abre o WhatsApp com a mensagem completa: nada é guardado no servidor. Sem preços. */

type Passo = 1 | 2 | 3 | 4;
type Campos = {
  /** restaurante escrito em «Outro restaurante» (em branco: escolhemos nós) */
  outro: string;
  data: string;
  hora: string;
  pessoas: string;
  nome: string;
  ida?: Ida;
  idaDe?: Sitio;
  volta?: Volta;
  voltaHora: string;
  /** o cliente mudou a hora do regresso (deixa de seguir a hora da mesa + 2 h) */
  voltaHoraMexida: boolean;
  voltaPara?: Sitio;
};
type Chave = "data" | "hora" | "pessoas" | "nome" | "ida" | "idaDe" | "volta" | "voltaHora" | "voltaPara";
type Erros = Partial<Record<Chave, string>>;

const INICIAL: Campos = { outro: "", data: "", hora: "20:00", pessoas: "2", nome: "", voltaHora: "22:00", voltaHoraMexida: false };
const HORA = /^\d{2}:\d{2}$/;

const sitioValido = (s?: Sitio) => !!s && (s.tipo !== "morada" || s.texto.trim().length >= 2);

export default function FormularioMesa({ lingua, t, restaurantes }: { lingua: Lingua; t: Textos; restaurantes: RestauranteLista[] }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [pedido, setPedido] = useState<PedidoMesa | null>(null);
  const [fixo, setFixo] = useState<PedidoMesa["restaurante"]>();
  const [lista, setLista] = useState(false);
  const [rascunhoOutro, setRascunhoOutro] = useState("");
  const [passo, setPasso] = useState<Passo>(1);
  const [c, setC] = useState<Campos>(INICIAL);
  const [erros, setErros] = useState<Erros>({});
  const [minimo, setMinimo] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [gps, setGps] = useState<"" | "a-obter" | "erro">("");

  /* Cliente identificado (/lisboa?c=…): primeiro nome e hotel. Sem resposta, o formulário é o de sempre. */
  useEffect(() => {
    let vivo = true;
    obterCliente().then((cl) => vivo && setCliente(cl));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(
    () =>
      aoAbrirMesa((p) => {
        setPedido(p);
        setFixo(p.restaurante);
        setLista(false);
        setPasso(1);
        setErros({});
        setGps("");
        setMinimo(hoje());
        setC((v) => {
          const n = { ...v, outro: "" };
          // Se o cliente já preencheu «O seu dia», aproveita o dia, as pessoas e o nome.
          try {
            const dia = JSON.parse(sessionStorage.getItem("hub-lisboa-dia") || "{}") as Partial<Record<string, string>>;
            if (!n.data && dia.data && dia.data >= hoje()) n.data = dia.data;
            if (!n.nome && dia.nome) n.nome = dia.nome;
            if (dia.pax && v === INICIAL) n.pessoas = dia.pax;
          } catch {
            /* nada */
          }
          return n;
        });
        medir("MesaPasso", { passo: 1, lingua });
        const d = dialogo.current;
        if (d && !d.open) d.showModal();
      }),
    [lingua]
  );

  /* Primeiro nome e hotel do cliente identificado, quando chegarem. */
  useEffect(() => {
    if (!cliente) return;
    setC((v) => ({
      ...v,
      nome: v.nome || cliente.primeiroNome || "",
      idaDe: v.idaDe ?? (cliente.hotel ? { tipo: "hotel", nome: cliente.hotel } : undefined),
    }));
  }, [cliente]);

  const mudar = (p: Partial<Campos>) => setC((v) => ({ ...v, ...p }));
  const fechar = () => dialogo.current?.close();
  const restauranteNome = fixo?.nome || c.outro.trim() || t.fRestHub;

  const irPara = (p: Passo) => {
    setErros({});
    setPasso(p);
    // a hora do regresso segue a da mesa (+2 h) enquanto o cliente não a mudar
    if (p === 3 && !c.voltaHoraMexida && HORA.test(c.hora)) mudar({ voltaHora: somarMinutos(c.hora, 120) });
    if (p === 3 && !c.voltaPara) {
      const para = c.ida === "hub" && sitioValido(c.idaDe) ? c.idaDe : cliente?.hotel ? ({ tipo: "hotel", nome: cliente.hotel } as Sitio) : undefined;
      if (para) mudar({ voltaPara: para });
    }
    medir("MesaPasso", { passo: p, lingua });
    dialogo.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById(`${id}-passo`)?.focus({ preventScroll: true }));
  };

  const validar = (p: Passo): Erros => {
    const e: Erros = {};
    if (p === 1) {
      if (!c.data || c.data < hoje()) e.data = t.eDia;
      if (!HORA.test(c.hora)) e.hora = t.eHora;
      const n = Number(c.pessoas);
      if (!Number.isInteger(n) || n < 1 || n > 20) e.pessoas = t.ePessoas;
      if (!c.nome.trim()) e.nome = t.eNome;
    }
    if (p === 2) {
      if (!c.ida) e.ida = t.eEscolha;
      else if (c.ida === "hub" && !sitioValido(c.idaDe)) e.idaDe = t.eDe;
    }
    if (p === 3) {
      if (!c.volta) e.volta = t.eEscolha;
      else if (c.volta === "sim") {
        if (!HORA.test(c.voltaHora)) e.voltaHora = t.eHora;
        if (!sitioValido(c.voltaPara)) e.voltaPara = t.ePara;
      }
    }
    return e;
  };

  const ORDEM: Chave[] = ["data", "hora", "pessoas", "nome", "ida", "idaDe", "volta", "voltaHora", "voltaPara"];

  const continuar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!pedido) return;
    const e = validar(passo);
    setErros(e);
    const primeiro = ORDEM.find((k) => e[k]);
    if (primeiro) {
      document.getElementById(`${id}-${primeiro}`)?.focus();
      return;
    }
    if (passo < 4) {
      irPara((passo + 1) as Passo);
      return;
    }
    enviar();
  };

  const dados = () => ({
    prato: pedido?.prato,
    restaurante: fixo,
    restauranteLivre: c.outro,
    data: c.data,
    hora: c.hora,
    pessoas: Number(c.pessoas),
    nome: c.nome,
    ida: c.ida ?? "eu",
    idaDe: c.ida === "hub" ? c.idaDe : undefined,
    volta: c.volta ?? "nao",
    voltaHora: c.volta === "sim" ? c.voltaHora : undefined,
    voltaPara: c.volta === "sim" ? c.voltaPara : undefined,
    ref: cliente?.codigo,
  });

  const enviar = () => {
    if (!pedido) return;
    const { link, servico } = mensagemMesa(t, lingua, dados());
    const restaurante = fixo?.codigo ?? (pedido.prato || c.outro.trim() ? "LIVRE" : "-");
    medir("PedirMesa", { prato: pedido.prato?.n ?? "-", restaurante, servico, origem: pedido.origem, lingua });
    medir("EnviarPedido", { servico, cliente: cliente ? "sim" : "nao", lingua });
    const janela = window.open(link, "_blank");
    if (janela) janela.opener = null;
    else window.location.href = link;
    fechar();
  };

  const usarLocalizacao = (campo: "idaDe" | "voltaPara") => {
    if (!("geolocation" in navigator)) {
      setGps("erro");
      return;
    }
    setGps("a-obter");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps("");
        mudar({ [campo]: { tipo: "gps", lat: p.coords.latitude, lng: p.coords.longitude } } as Partial<Campos>);
      },
      () => setGps("erro"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const erro = (k: Chave) =>
    erros[k] ? (
      <small id={`${id}-${k}-erro`} className="lx-erro">
        {erros[k]}
      </small>
    ) : null;
  const ligar = (k: Chave) => ({
    id: `${id}-${k}`,
    "aria-invalid": erros[k] ? true : undefined,
    "aria-describedby": erros[k] ? `${id}-${k}-erro` : undefined,
  });

  /* «De onde sai?» / «Para onde?»: o hotel ou a localização (com «Mudar»), ou o campo «Hotel ou morada». */
  const campoSitio = (campo: "idaDe" | "voltaPara", pergunta: string) => {
    const s = c[campo];
    if (s && s.tipo !== "morada")
      return (
        <div className="lx-escolhido" id={`${id}-${campo}`} tabIndex={-1}>
          <span>{pergunta}</span>
          <div>
            <b>{s.tipo === "hotel" ? t.iHotel.replace("{h}", s.nome) : t.iGpsOk}</b>
            {s.tipo === "gps" && (
              <small>
                <a href={ligacaoMapa(s.lat, s.lng)} target="_blank" rel="noopener noreferrer">
                  {t.iGpsVer}
                </a>
              </small>
            )}
          </div>
          <button type="button" className="lx-mudar" onClick={() => mudar({ [campo]: { tipo: "morada", texto: "" } } as Partial<Campos>)}>
            {t.fMudar}
          </button>
        </div>
      );
    return (
      <div className="lx-sitio">
        <p className="lx-sitio-pergunta">{pergunta}</p>
        <label className="lx-campo-largo">
          <span>{t.iMorada}</span>
          <input
            value={s?.tipo === "morada" ? s.texto : ""}
            placeholder={t.iMoradaPh}
            maxLength={120}
            autoComplete="street-address"
            onChange={(e) => mudar({ [campo]: { tipo: "morada", texto: e.target.value } } as Partial<Campos>)}
            {...ligar(campo)}
          />
          {erro(campo)}
        </label>
        <button type="button" className="lx-gps" onClick={() => usarLocalizacao(campo)} disabled={gps === "a-obter"}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          {gps === "a-obter" ? t.iGpsA : t.iGps}
        </button>
        {gps === "erro" && (
          <small className="lx-erro" role="status">
            {t.iGpsErro}
          </small>
        )}
      </div>
    );
  };

  const opcao = <V extends string>(nome: string, valor: V, atual: V | undefined, aoMudar: (v: V) => void, titulo: string, sub?: string, destaque?: boolean) => (
    <label className={`lx-opcao${destaque ? " lx-opcao--destaque" : ""}`}>
      <input type="radio" name={`${id}-${nome}`} value={valor} checked={atual === valor} onChange={() => aoMudar(valor)} />
      <span>
        <b>{titulo}</b>
        {sub && <small>{sub}</small>}
      </span>
    </label>
  );

  const NOMES_PASSOS = [t.pPasso1, t.pPasso2, t.pPasso3, t.pPasso4];
  const recolha = HORA.test(c.hora) ? somarMinutos(c.hora, -30) : "";
  const servico = servicoDe({ ida: c.ida ?? "eu", volta: c.volta ?? "nao" });

  return (
    <dialog
      ref={dialogo}
      className="lx-folha"
      aria-labelledby={`${id}-titulo`}
      onClick={(e) => {
        // tocar fora do cartão fecha
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <form className="lx-folha-in" onSubmit={continuar} noValidate>
        <div className="lx-folha-topo">
          <div>
            <h2 id={`${id}-titulo`} className="lx-h3">
              {t.fTitulo}
            </h2>
            {pedido?.prato && <p className="lx-folha-prato">{pedido.prato.nome}</p>}
          </div>
          <button type="button" className="lx-fechar" aria-label={t.fFechar} onClick={fechar}>
            ×
          </button>
        </div>

        {/* Barra de 4 pontos */}
        <ol className="lx-etapas" aria-label={t.aPasso.replace("{i}", String(passo)).replace("{p}", NOMES_PASSOS[passo - 1])}>
          {NOMES_PASSOS.map((nome, i) => (
            <li key={nome} data-estado={i + 1 < passo ? "feito" : i + 1 === passo ? "atual" : undefined} aria-current={i + 1 === passo ? "step" : undefined}>
              <span className="lx-etapa-ponto" aria-hidden="true" />
              <span className="lx-etapa-nome">{nome}</span>
            </li>
          ))}
        </ol>

        <div id={`${id}-passo`} tabIndex={-1} className="lx-etapa" aria-live="polite">
          {passo === 1 && (
            <>
              {lista ? (
                <div className="lx-lista-rest">
                  <p className="lx-lista-titulo">{t.fLista}</p>
                  <ul>
                    {restaurantes.map((r) => (
                      <li key={r.codigo}>
                        <button
                          type="button"
                          className="lx-item-rest"
                          aria-pressed={fixo?.codigo === r.codigo}
                          onClick={() => {
                            setFixo({ codigo: r.codigo, nome: r.nome, bairro: r.bairro });
                            mudar({ outro: "" });
                            setLista(false);
                            medir("EscolherRestaurante", { prato: pedido?.prato?.n ?? "-", restaurante: r.codigo, lingua });
                          }}
                        >
                          <span className="lx-miniatura" data-vazio={r.foto ? undefined : true}>
                            {r.foto && <Image src={r.foto} alt="" fill sizes="56px" quality={55} draggable={false} />}
                          </span>
                          <span>
                            <b>{r.nome}</b>
                            <small>
                              {r.bairro} · {r.pratos}
                            </small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="lx-outro">
                    <label className="lx-campo-largo">
                      <span>{t.fOutro}</span>
                      <input value={rascunhoOutro} placeholder={t.fOutroPh} maxLength={80} autoComplete="off" onChange={(e) => setRascunhoOutro(e.target.value)} />
                    </label>
                    <button
                      type="button"
                      className="lx-btn lx-btn--ink"
                      onClick={() => {
                        setFixo(undefined);
                        mudar({ outro: rascunhoOutro.trim() });
                        setLista(false);
                      }}
                    >
                      {t.fOutroOk}
                    </button>
                  </div>
                  <button type="button" className="lx-mudar" onClick={() => setLista(false)}>
                    ← {t.fVoltar}
                  </button>
                </div>
              ) : (
                <>
                  <div className="lx-escolhido">
                    <span>{t.fRest}</span>
                    <div>
                      <b>{restauranteNome}</b>
                      {fixo && <small>{fixo.bairro}</small>}
                    </div>
                    <button
                      type="button"
                      className="lx-mudar"
                      aria-haspopup="true"
                      onClick={() => {
                        setRascunhoOutro(c.outro);
                        setLista(true);
                      }}
                    >
                      {t.fMudar}
                    </button>
                  </div>

                  <div className="lx-campos">
                    <label>
                      <span>{t.fDia}</span>
                      <input type="date" min={minimo || undefined} value={c.data} onChange={(e) => mudar({ data: e.target.value })} {...ligar("data")} />
                      {erro("data")}
                    </label>
                    <label>
                      <span>{t.fHora}</span>
                      <input type="time" value={c.hora} onChange={(e) => mudar({ hora: e.target.value })} {...ligar("hora")} />
                      {erro("hora")}
                    </label>
                    <label>
                      <span>{t.fPessoas}</span>
                      <input type="number" inputMode="numeric" min={1} max={20} value={c.pessoas} onChange={(e) => mudar({ pessoas: e.target.value })} {...ligar("pessoas")} />
                      {erro("pessoas")}
                    </label>
                    <label>
                      <span>{t.fNome}</span>
                      <input value={c.nome} placeholder={t.fNomePh} maxLength={40} autoComplete="given-name" onChange={(e) => mudar({ nome: e.target.value })} {...ligar("nome")} />
                      {erro("nome")}
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          {passo === 2 && (
            <fieldset className="lx-grupo">
              <legend className="lx-h3 lx-pergunta">{t.iTitulo}</legend>
              <div className="lx-opcoes" id={`${id}-ida`} tabIndex={-1}>
                {opcao("ida", "hub", c.ida, (v) => (mudar({ ida: v }), medir("EscolheIda", { escolha: "sim", lingua })), t.iHub, t.iHubSub, true)}
                {opcao("ida", "eu", c.ida, (v) => (mudar({ ida: v }), medir("EscolheIda", { escolha: "nao", lingua })), t.iEu)}
                {opcao("ida", "naosei", c.ida, (v) => (mudar({ ida: v }), medir("EscolheIda", { escolha: "naosei", lingua })), t.iNaoSei)}
              </div>
              {erro("ida")}
              {c.ida === "hub" && (
                <div className="lx-detalhe">
                  {campoSitio("idaDe", t.iDe)}
                  {recolha && (
                    <p className="lx-nota">
                      <b>{t.iRecolha.replace("{h}", recolha)}</b> {t.iConfirma}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {passo === 3 && (
            <fieldset className="lx-grupo">
              <legend className="lx-h3 lx-pergunta">{t.rTitulo}</legend>
              <p className="lx-t lx-texto-passo">{t.rTexto}</p>
              <div className="lx-opcoes" id={`${id}-volta`} tabIndex={-1}>
                {opcao("volta", "sim", c.volta, (v) => (mudar({ volta: v }), medir("EscolheVolta", { escolha: "sim", lingua })), t.rSim, undefined, true)}
                {opcao("volta", "nao", c.volta, (v) => (mudar({ volta: v }), medir("EscolheVolta", { escolha: "nao", lingua })), t.rNao)}
              </div>
              {erro("volta")}
              {c.volta === "sim" && (
                <div className="lx-detalhe">
                  <label className="lx-campo-hora">
                    <span>{t.rHora}</span>
                    <input type="time" value={c.voltaHora} onChange={(e) => mudar({ voltaHora: e.target.value, voltaHoraMexida: true })} {...ligar("voltaHora")} />
                    {erro("voltaHora")}
                  </label>
                  <p className="lx-nota">{t.rAvise}</p>
                  {campoSitio("voltaPara", t.rPara)}
                </div>
              )}
            </fieldset>
          )}

          {passo === 4 && (
            <div className="lx-resumo">
              <h3 className="lx-h3 lx-pergunta">{t.sTitulo}</h3>
              <dl>
                <div>
                  <dt>{t.sMesa}</dt>
                  <dd>
                    <b>{restauranteNome}</b>
                    <span>
                      {c.data && diaPorExtenso(c.data, lingua)} · {c.hora} · {t.fPessoas}: {c.pessoas}
                    </span>
                  </dd>
                  <button type="button" className="lx-mudar" onClick={() => irPara(1)}>
                    {t.fMudar}
                  </button>
                </div>
                <div>
                  <dt>{t.sIda}</dt>
                  <dd>
                    {c.ida === "hub" && c.idaDe ? (
                      <>
                        <b>
                          {sitioNoEcra(c.idaDe, t)} → {restauranteNome}
                        </b>
                        <span>{t.sPorVolta.replace("{h}", recolha)}</span>
                      </>
                    ) : (
                      <b>{c.ida === "naosei" ? t.sIdaNaoSei : t.sIdaEu}</b>
                    )}
                  </dd>
                  <button type="button" className="lx-mudar" onClick={() => irPara(2)}>
                    {t.fMudar}
                  </button>
                </div>
                <div>
                  <dt>{t.sVolta}</dt>
                  <dd>
                    {c.volta === "sim" && c.voltaPara ? (
                      <>
                        <b>
                          {restauranteNome} → {sitioNoEcra(c.voltaPara, t)}
                        </b>
                        <span>{t.sPorVolta.replace("{h}", c.voltaHora)}</span>
                      </>
                    ) : (
                      <b>{t.sVoltaEu}</b>
                    )}
                  </dd>
                  <button type="button" className="lx-mudar" onClick={() => irPara(3)}>
                    {t.fMudar}
                  </button>
                </div>
              </dl>
              <p className="lx-nota">
                {t.sGratis}
                {servico !== "M" && ` ${t.sViagens}`}
              </p>
            </div>
          )}
        </div>

        {!(passo === 1 && lista) && (
          <div className="lx-folha-acoes">
            {passo > 1 && (
              <button type="button" className="lx-btn lx-folha-voltar" onClick={() => irPara((passo - 1) as Passo)}>
                {t.fVoltar}
              </button>
            )}
            <button type="submit" className="lx-cta lx-folha-botao">
              {passo < 4 ? t.fContinuar : t.fEnviar}
              {passo === 4 && <span className="lx-sr"> ({t.aWhats})</span>}
            </button>
          </div>
        )}
        <p className="lx-privado">{t.fPriv}</p>
      </form>
    </dialog>
  );
}
