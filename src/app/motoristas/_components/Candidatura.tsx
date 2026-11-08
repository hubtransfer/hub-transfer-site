"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { idsMeta, lerConsentimento, novoEventId, registarEvento } from "../_lib/medicao";
import { reduzirFoto } from "../_lib/fotos";
import {
  AEROPORTOS,
  CARROS,
  INGLES,
  LISTA_MARCAS,
  LUGARES,
  MARCAS,
  OUTRA_MARCA,
  OUTRO_MODELO,
  REGIMES,
  RESPOSTAS_VAZIAS,
  SIM_NAO,
  TURNOS,
  listaAnos,
  type Respostas,
} from "../_lib/ficha";

/* Ficha de candidatura em dois passos (visual do protótipo claro).
   Passo 1 guarda logo o contacto. Passo 2: quiz de uma pergunta por ecrã e, no fim, duas fotos do carro.
   O candidato nunca vê o estado nem a prioridade. Nunca se pergunta idade, nacionalidade, origem, género nem situação de imigração. */

const PERGUNTAS = ["base", "carro", "marca", "modelo", "ano", "lugares", "carta", "aeroporto", "trabalho", "ingles", "regime", "turnos"] as const;
type Pergunta = (typeof PERGUNTAS)[number];
type Ecra = "p1" | Pergunta | "fotos" | "semCarro" | "final";
type TipoFoto = "lado" | "bagageira";
type Foto = { estado: "vazio" | "a-preparar" | "a-enviar" | "enviada" | "erro"; preview?: string; progresso?: number; msg?: string };

const TOTAL = PERGUNTAS.length + 2; // passo 1 + perguntas + fotos

/** Sugestões do campo "Concelho" (o campo continua livre): Grande Lisboa, Grande Porto e Algarve. */
const CONCELHOS = [
  // Grande Lisboa e Setúbal
  "Lisboa", "Sintra", "Oeiras", "Cascais", "Loures", "Odivelas", "Vila Franca de Xira", "Mafra",
  "Almada", "Seixal", "Barreiro", "Moita", "Montijo", "Alcochete", "Palmela", "Sesimbra", "Setúbal",
  // Grande Porto
  "Porto", "Vila Nova de Gaia", "Matosinhos", "Maia", "Gondomar", "Valongo", "Póvoa de Varzim", "Vila do Conde",
  "Santo Tirso", "Trofa", "Paredes", "Espinho", "Santa Maria da Feira", "São João da Madeira", "Oliveira de Azeméis",
  "Arouca", "Vale de Cambra",
  // Algarve
  "Faro", "Loulé", "Albufeira", "Portimão", "Olhão", "Lagoa", "Lagos", "Silves", "Tavira", "São Brás de Alportel",
  "Vila Real de Santo António", "Castro Marim", "Alcoutim", "Aljezur", "Monchique", "Vila do Bispo",
];

const digitos = (v: string) => v.replace(/\D/g, "");
const letra = (i: number) => String.fromCharCode(65 + i);

/** Número com +351 por omissão; quem escreve +XX ou 00XX fica com o indicativo que escreveu. */
function numeroCompleto(v: string) {
  const t = v.trim();
  return /^(\+|00)/.test(t) ? t : `+351 ${t}`;
}

async function enviarJson(corpo: Record<string, unknown>) {
  const r = await fetch("/api/motoristas/candidatura", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...corpo, url: window.location.href, ...idsMeta() }),
  });
  const j = (await r.json().catch(() => null)) as { ok?: boolean; codigo?: string } | null;
  if (!r.ok || !j?.ok) throw new Error(String(r.status));
  return j;
}

/** Envio de uma foto com progresso real (XHR, porque o fetch não dá o progresso do upload). */
function enviarFoto(leadId: string, tipo: TipoFoto, blob: Blob, onProgresso: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("leadId", leadId);
    fd.append("tipo", tipo);
    fd.append("foto", blob, `${tipo}.jpg`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/motoristas/foto");
    xhr.timeout = 60000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgresso(Math.round((e.loaded / e.total) * 95));
    xhr.onload = () => {
      let ok = false;
      try {
        ok = xhr.status === 200 && JSON.parse(xhr.responseText).ok === true;
      } catch {
        /* resposta inválida */
      }
      if (ok) resolve();
      else reject(new Error(String(xhr.status)));
    };
    xhr.onerror = () => reject(new Error("rede"));
    xhr.ontimeout = () => reject(new Error("tempo"));
    xhr.send(fd);
  });
}

const IconeCamara = ({ size = 34, sw = 1.8 }: { size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

const IconeVisto = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export default function Candidatura() {
  const [ecra, setEcra] = useState<Ecra>("p1");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [concelho, setConcelho] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [erro1, setErro1] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [r, setR] = useState<Respostas>(RESPOSTAS_VAZIAS);
  const [marcaOutra, setMarcaOutra] = useState(false);
  const [modeloOutro, setModeloOutro] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [fotos, setFotos] = useState<Record<TipoFoto, Foto>>({ lado: { estado: "vazio" }, bagageira: { estado: "vazio" } });

  const leadId = useRef("");
  const leadRegistado = useRef(false);
  const cartao = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeiraVez = useRef(true);
  const anos = useMemo(() => listaAnos(), []);

  const primeiroNome = nome.trim().split(/\s+/)[0] || "";

  // a cada ecrã novo: o cartão sobe ao topo e o foco vai para a pergunta (leitores de ecrã anunciam-na)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    cartao.current?.scrollIntoView({ block: "start", behavior: "instant" }); // troca de ecrã, sem deslizar
    titulo.current?.focus({ preventScroll: true });
  }, [ecra]);

  const indice = ecra === "p1" ? 0 : ecra === "fotos" ? TOTAL - 1 : PERGUNTAS.indexOf(ecra as Pergunta) + 1;
  const progresso = Math.round(((indice + 1) / (TOTAL + 1)) * 100);

  /* ── Passo 1 ── */
  async function submeterPasso1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hp = (e.currentTarget.elements.namedItem("empresa") as HTMLInputElement | null)?.value || "";
    const d = digitos(whatsapp);
    if (nome.trim().length < 2 || d.length < 9 || d.length > 15 || concelho.trim().length < 2 || !consentimento) {
      setErro1(true);
      return;
    }
    setErro1(false);
    setErroEnvio("");
    setAEnviar(true);
    leadId.current = leadId.current || novoEventId();
    const eventId = novoEventId();
    try {
      const j = await enviarJson({
        acao: "passo1",
        leadId: leadId.current,
        eventId,
        nome: nome.trim(),
        whatsapp: numeroCompleto(whatsapp),
        concelho: concelho.trim(),
        consentimentoDados: true,
        consentimentoCookies: lerConsentimento() === "sim" && !leadRegistado.current,
        empresa: hp,
      });
      if (j.codigo) setCodigo(j.codigo);
      if (!leadRegistado.current) {
        leadRegistado.current = true;
        registarEvento("Lead", eventId);
      }
      setEcra(PERGUNTAS[0]);
    } catch {
      setErroEnvio("Não conseguimos guardar os teus dados. Verifica a ligação à internet e tenta outra vez.");
    } finally {
      setAEnviar(false);
    }
  }

  /* ── Quiz ── */
  const irPara = (e: Ecra) => setEcra(e);
  const seguinteDe = (p: Pergunta): Ecra => {
    const i = PERGUNTAS.indexOf(p);
    return i + 1 < PERGUNTAS.length ? PERGUNTAS[i + 1] : "fotos";
  };

  const guardarRespostas = (resp: Respostas) =>
    enviarJson({ acao: "respostas", leadId: leadId.current, ...resp }).catch(() => {
      /* volta a ir tudo no "Enviar candidatura" */
    });

  /** Escolha única: grava, marca o botão e avança logo. */
  const escolher = (p: Pergunta, valor: string, extra?: Partial<Respostas>) => {
    setR((a) => ({ ...a, [p]: valor, ...extra }));
    window.setTimeout(() => irPara(seguinteDe(p)), 180);
  };

  const escolherCarro = (v: string) => {
    if (v === "Não tenho") {
      const novo = { ...RESPOSTAS_VAZIAS, base: r.base, carro: v };
      setR(novo);
      setMarcaOutra(false);
      setModeloOutro(false);
      void guardarRespostas(novo);
      window.setTimeout(() => irPara("semCarro"), 180);
      return;
    }
    escolher("carro", v);
  };

  const escolherMarca = (m: string) => {
    if (m === OUTRA_MARCA) {
      setMarcaOutra(true);
      setModeloOutro(true);
      setR((a) => ({ ...a, marca: "", modelo: "" }));
      return; // fica no ecrã para escrever
    }
    setMarcaOutra(false);
    setModeloOutro(false);
    escolher("marca", m, { modelo: r.marca === m ? r.modelo : "" });
  };

  const escolherModelo = (m: string) => {
    if (m === OUTRO_MODELO) {
      setModeloOutro(true);
      setR((a) => ({ ...a, modelo: "" }));
      return;
    }
    escolher("modelo", m);
  };

  const alternarTurno = (t: string) =>
    setR((a) => ({ ...a, turnos: a.turnos.includes(t) ? a.turnos.filter((x) => x !== t) : [...a.turnos, t] }));

  const irParaFotos = () => {
    void guardarRespostas(r);
    irPara("fotos");
  };

  const voltar = () => {
    if (ecra === "semCarro") return irPara("carro");
    if (ecra === "fotos") return irPara("turnos");
    const i = PERGUNTAS.indexOf(ecra as Pergunta);
    if (i > 0) irPara(PERGUNTAS[i - 1]);
    else if (i === 0) irPara("p1");
  };

  /* ── Fotos ── */
  const mudarFoto = (tipo: TipoFoto, f: Foto) => setFotos((a) => ({ ...a, [tipo]: f }));

  async function escolherFoto(tipo: TipoFoto, file: File | undefined) {
    if (!file) return;
    setErroEnvio("");
    const anterior = fotos[tipo].preview;
    if (anterior) URL.revokeObjectURL(anterior);
    mudarFoto(tipo, { estado: "a-preparar" });

    let blob: Blob;
    try {
      blob = await reduzirFoto(file);
    } catch {
      mudarFoto(tipo, { estado: "erro", msg: "Não conseguimos abrir esta foto. Tira outra com a câmara ou escolhe outra da galeria." });
      return;
    }
    const preview = URL.createObjectURL(blob);
    mudarFoto(tipo, { estado: "a-enviar", preview, progresso: 0 });

    const tentar = () => enviarFoto(leadId.current, tipo, blob, (p) => mudarFoto(tipo, { estado: "a-enviar", preview, progresso: p }));
    try {
      await tentar().catch(tentar); // uma segunda tentativa automática, para falhas breves da rede
      mudarFoto(tipo, { estado: "enviada", preview });
    } catch {
      mudarFoto(tipo, { estado: "erro", preview, msg: "A foto não foi enviada. Toca para tentar outra vez." });
    }
  }

  const fotosProntas = fotos.lado.estado === "enviada" && fotos.bagageira.estado === "enviada";

  async function concluir() {
    if (!fotosProntas) return;
    setAEnviar(true);
    setErroEnvio("");
    const eventId = novoEventId();
    try {
      await enviarJson({
        acao: "concluir",
        leadId: leadId.current,
        eventId,
        ...r,
        consentimentoCookies: lerConsentimento() === "sim",
      });
      registarEvento("CompleteRegistration", eventId);
      irPara("final");
    } catch {
      setErroEnvio("Não conseguimos enviar a candidatura. Verifica a ligação à internet e tenta outra vez.");
    } finally {
      setAEnviar(false);
    }
  }

  /* ── Peças do ecrã ── */
  const topo = (n: string) => (
    <>
      <div className="mot-cartao-topo">
        <strong>Ficha de candidatura</strong>
        <span>{n}</span>
      </div>
      <div className="mot-progresso" aria-hidden="true">
        <i style={{ width: `${progresso}%` }} />
      </div>
    </>
  );

  const pergunta = (texto: string) => (
    <h3 ref={titulo} tabIndex={-1} className="mot-pergunta">
      {texto}
    </h3>
  );

  const botaoVoltar = (
    <button type="button" className="mot-voltar" onClick={voltar}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Voltar
    </button>
  );

  /** Lista de opções de escolha única. Com letras (A, B, C) nas listas curtas; sem letras nas grelhas. */
  const opcoes = (p: Pergunta, lista: readonly string[], tipo: "" | "duas" | "grelha" | "anos", rotulo?: (o: string) => string) => (
    <div className={`mot-opcoes${tipo ? ` mot-${tipo}` : ""}`}>
      {lista.map((o, k) => (
        <button
          key={o}
          type="button"
          className="mot-opcao"
          aria-pressed={(r[p] as string) === o}
          onClick={() => (p === "carro" ? escolherCarro(o) : escolher(p, o))}
        >
          {tipo !== "grelha" && tipo !== "anos" && <span className="mot-tecla" aria-hidden="true">{letra(k)}</span>}
          {rotulo ? rotulo(o) : o}
        </button>
      ))}
    </div>
  );

  const modelos = r.marca && MARCAS[r.marca] ? MARCAS[r.marca] : [];

  const tile = (tipo: TipoFoto, rotulo: string) => {
    const f = fotos[tipo];
    return (
      <label className={`mot-tile${f.estado === "enviada" ? " mot-feita" : ""}${f.estado === "erro" ? " mot-tile-erro" : ""}`}>
        <IconeCamara />
        <span>
          {rotulo}
          <small>Câmara ou galeria</small>
        </span>
        <input
          type="file"
          accept="image/*"
          aria-label={rotulo}
          disabled={f.estado === "a-preparar" || f.estado === "a-enviar"}
          onChange={(e) => {
            void escolherFoto(tipo, e.target.files?.[0]);
            e.target.value = ""; // permite escolher a mesma foto outra vez
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {f.preview && <img src={f.preview} alt="" />}
        {f.estado !== "vazio" && (
          <div className="mot-estado" role="status">
            {f.estado === "a-preparar" && <span>A preparar</span>}
            {f.estado === "a-enviar" && (
              <>
                <span>A enviar</span>
                <div className="mot-barra">
                  <i style={{ width: `${f.progresso || 0}%` }} />
                </div>
              </>
            )}
            {f.estado === "enviada" && (
              <>
                <IconeVisto />
                <span>Foto enviada</span>
              </>
            )}
            {f.estado === "erro" && <span className="mot-estado-erro">{f.msg}</span>}
          </div>
        )}
      </label>
    );
  };

  return (
    <div className="mot-cartao" ref={cartao}>
      {ecra === "p1" && (
        <>
          {topo("1 de 2")}
          <form onSubmit={submeterPasso1} noValidate>
            <h3 ref={titulo} tabIndex={-1} className="mot-sr">
              Ficha de candidatura, 1 de 2
            </h3>
            <div className="mot-campo">
              <label htmlFor="mot-nome">Nome</label>
              <input id="mot-nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="mot-campo">
              <label htmlFor="mot-tel">WhatsApp</label>
              <div className="mot-telefone">
                <span aria-hidden="true">+351</span>
                <input
                  id="mot-tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="9XX XXX XXX"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
            <div className="mot-campo">
              <label htmlFor="mot-conc">Concelho onde moras</label>
              <input id="mot-conc" list="mot-concelhos" autoComplete="address-level2" value={concelho} onChange={(e) => setConcelho(e.target.value)} />
              <datalist id="mot-concelhos">
                {CONCELHOS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* armadilha para robôs: invisível para pessoas */}
            <div className="mot-hp" aria-hidden="true">
              <label htmlFor="mot-empresa">Empresa</label>
              <input id="mot-empresa" name="empresa" tabIndex={-1} autoComplete="off" />
            </div>

            <label className="mot-consentimento">
              <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} />
              <span>
                Autorizo a HUB Transfer a guardar os dados e as fotos desta candidatura e a contactar-me por WhatsApp ou telefone
                sobre ela. Li a{" "}
                <Link href="/motoristas/privacidade" prefetch={false}>
                  política de privacidade
                </Link>
                .
              </span>
            </label>
            {erro1 && (
              <p className="mot-erro" role="alert">
                Preenche o nome, o WhatsApp e o concelho, e marca a autorização.
              </p>
            )}
            <button className="mot-cta" type="submit" disabled={aEnviar}>
              {aEnviar ? "A guardar…" : "Continuar"}
            </button>
            {erroEnvio && (
              <p className="mot-erro mot-erro-baixo" role="alert">
                {erroEnvio}
              </p>
            )}
          </form>
        </>
      )}

      {ecra === "base" && (
        <>
          {topo("2 de 2")}
          {pergunta("Em que aeroporto queres trabalhar?")}
          {opcoes("base", AEROPORTOS, "")}
          {botaoVoltar}
        </>
      )}

      {ecra === "carro" && (
        <>
          {topo("2 de 2")}
          {pergunta("Tens carro?")}
          {opcoes("carro", CARROS, "")}
          {botaoVoltar}
        </>
      )}

      {ecra === "marca" && (
        <>
          {topo("2 de 2")}
          {pergunta("De que marca é o teu carro?")}
          {!marcaOutra ? (
            <div className="mot-opcoes mot-grelha">
              {LISTA_MARCAS.map((m) => (
                <button key={m} type="button" className="mot-opcao" aria-pressed={r.marca === m} onClick={() => escolherMarca(m)}>
                  {m}
                </button>
              ))}
              <button type="button" className="mot-opcao" onClick={() => escolherMarca(OUTRA_MARCA)}>
                {OUTRA_MARCA}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (r.marca.trim().length >= 2) irPara("modelo");
              }}
            >
              <div className="mot-campo">
                <label htmlFor="mot-marca-outra">Escreve a marca</label>
                <input id="mot-marca-outra" autoFocus maxLength={40} value={r.marca} onChange={(e) => setR((a) => ({ ...a, marca: e.target.value }))} />
              </div>
              <button type="submit" className="mot-cta mot-seguir" disabled={r.marca.trim().length < 2}>
                Continuar
              </button>
              <button
                type="button"
                className="mot-voltar"
                onClick={() => {
                  setMarcaOutra(false);
                  setModeloOutro(false);
                  setR((a) => ({ ...a, marca: "" }));
                }}
              >
                Ver a lista de marcas
              </button>
            </form>
          )}
          {botaoVoltar}
        </>
      )}

      {ecra === "modelo" && (
        <>
          {topo("2 de 2")}
          {pergunta("E o modelo?")}
          {!modeloOutro && modelos.length > 0 ? (
            <div className="mot-opcoes mot-grelha">
              {modelos.map((m) => (
                <button key={m} type="button" className="mot-opcao" aria-pressed={r.modelo === m} onClick={() => escolherModelo(m)}>
                  {m}
                </button>
              ))}
              <button type="button" className="mot-opcao" onClick={() => escolherModelo(OUTRO_MODELO)}>
                {OUTRO_MODELO}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (r.modelo.trim().length >= 1) irPara("ano");
              }}
            >
              <div className="mot-campo">
                <label htmlFor="mot-modelo" className="mot-sr">
                  Modelo
                </label>
                <input
                  id="mot-modelo"
                  autoFocus
                  maxLength={40}
                  placeholder="Ex.: Corolla"
                  value={r.modelo}
                  onChange={(e) => setR((a) => ({ ...a, modelo: e.target.value }))}
                />
              </div>
              <button type="submit" className="mot-cta mot-seguir" disabled={r.modelo.trim().length < 1}>
                Continuar
              </button>
              {modelos.length > 0 && (
                <button type="button" className="mot-voltar" onClick={() => setModeloOutro(false)}>
                  Ver a lista de modelos
                </button>
              )}
            </form>
          )}
          {botaoVoltar}
        </>
      )}

      {ecra === "ano" && (
        <>
          {topo("2 de 2")}
          {pergunta("De que ano é?")}
          {opcoes("ano", anos, "anos")}
          {botaoVoltar}
        </>
      )}

      {ecra === "lugares" && (
        <>
          {topo("2 de 2")}
          {pergunta("Quantos lugares tem?")}
          {opcoes("lugares", LUGARES, "duas", (o) => `${o} lugares`)}
          {botaoVoltar}
        </>
      )}

      {ecra === "carta" && (
        <>
          {topo("2 de 2")}
          {pergunta("Tens carta há mais de um ano?")}
          {opcoes("carta", SIM_NAO, "duas")}
          {botaoVoltar}
        </>
      )}

      {ecra === "aeroporto" && (
        <>
          {topo("2 de 2")}
          {pergunta("Já fazes transfers ou trabalhas no aeroporto?")}
          {opcoes("aeroporto", SIM_NAO, "duas")}
          {botaoVoltar}
        </>
      )}

      {ecra === "trabalho" && (
        <>
          {topo("2 de 2")}
          {pergunta("Além da condução, tens outro trabalho ou negócio?")}
          {opcoes("trabalho", SIM_NAO, "duas")}
          {botaoVoltar}
        </>
      )}

      {ecra === "ingles" && (
        <>
          {topo("2 de 2")}
          {pergunta("Falas inglês?")}
          {opcoes("ingles", INGLES, "")}
          {botaoVoltar}
        </>
      )}

      {ecra === "regime" && (
        <>
          {topo("2 de 2")}
          {pergunta("Procuras part-time ou full-time?")}
          {opcoes("regime", REGIMES, "duas")}
          {botaoVoltar}
        </>
      )}

      {ecra === "turnos" && (
        <>
          {topo("2 de 2")}
          {pergunta("Em que turnos estás livre?")}
          <p className="mot-ajuda">Podes escolher vários.</p>
          <div className="mot-opcoes">
            {TURNOS.map((t, k) => (
              <button key={t} type="button" className="mot-opcao" aria-pressed={r.turnos.includes(t)} onClick={() => alternarTurno(t)}>
                <span className="mot-tecla" aria-hidden="true">
                  {letra(k)}
                </span>
                {t}
              </button>
            ))}
          </div>
          <button type="button" className="mot-cta mot-seguir" disabled={r.turnos.length === 0} onClick={irParaFotos}>
            Continuar
          </button>
          {botaoVoltar}
        </>
      )}

      {ecra === "fotos" && (
        <>
          {topo("2 de 2")}
          {pergunta("Fotos do carro")}
          <p className="mot-ajuda mot-ajuda-fotos">
            Tira duas fotos: o carro inteiro, de lado, e a bagageira aberta. É com elas que analisamos a tua candidatura.
          </p>
          <div className="mot-fotos">
            {tile("lado", "Foto do carro de lado")}
            {tile("bagageira", "Foto da bagageira aberta")}
          </div>
          <button className="mot-cta" type="button" disabled={!fotosProntas || aEnviar} onClick={concluir}>
            {aEnviar ? "A enviar…" : "Enviar candidatura"}
          </button>
          {erroEnvio && (
            <p className="mot-erro mot-erro-baixo" role="alert">
              {erroEnvio}
            </p>
          )}
          {botaoVoltar}
        </>
      )}

      {ecra === "semCarro" && (
        <>
          <div className="mot-final">
            {pergunta(`Obrigado pelo interesse, ${primeiroNome}.`)}
            <p>Esta vaga é só para quem tem carro próprio.</p>
          </div>
          {botaoVoltar}
        </>
      )}

      {ecra === "final" && (
        <div className="mot-final">
          {pergunta(`Candidatura recebida, ${primeiroNome}.`)}
          <p>
            A tua ficha <span className="mot-codigo-placa">{codigo}</span> está em análise.
          </p>
          <p>Se fores selecionado, o responsável pela contratação fala contigo pelo WhatsApp da HUB Transfer.</p>
        </div>
      )}
    </div>
  );
}
