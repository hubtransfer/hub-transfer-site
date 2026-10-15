"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LISTA_MARCAS, MAIS_ANTIGO, MARCAS, OUTRA_MARCA, OUTRO_MODELO, listaAnos, normalizar } from "../_lib/carros";

/* Passo 2 em estilo de quiz: uma pergunta por ecrã, barra de progresso, sempre com "Voltar".
   Quem não tem carro salta diretamente para o regime. Só no fim se envia tudo (e só aí dispara o evento). */

export type RespostasPasso2 = {
  carro: string;
  marca: string;
  modelo: string;
  ano: string;
  lugares: string;
  regime: string;
  turnos: string[];
};

type Ecra = "carro" | "marca" | "modelo" | "ano" | "lugares" | "regime" | "turnos";

const CARROS = ["Próprio", "De frota", "Não tenho"] as const;
const REGIMES = ["Part-time", "Full-time"] as const;
const TURNOS = ["Madrugada", "Manhã", "Tarde", "Noite"] as const;
const LUGARES = ["5", "7"] as const;

const VAZIO: RespostasPasso2 = { carro: "", marca: "", modelo: "", ano: "", lugares: "", regime: "", turnos: [] };

export default function QuizPasso2({
  aEnviar,
  onConcluir,
  onSaltar,
}: {
  aEnviar: boolean;
  onConcluir: (r: RespostasPasso2) => void;
  onSaltar: () => void;
}) {
  const [r, setR] = useState<RespostasPasso2>(VAZIO);
  const [i, setI] = useState(0);
  const [marcaOutra, setMarcaOutra] = useState(false);
  const [modeloOutro, setModeloOutro] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeiraVez = useRef(true);

  const ecras: Ecra[] = useMemo(
    () => (r.carro === "Não tenho" ? ["carro", "regime", "turnos"] : ["carro", "marca", "modelo", "ano", "lugares", "regime", "turnos"]),
    [r.carro]
  );
  const ecra = ecras[i];
  const anos = useMemo(() => listaAnos(), []);

  // a cada ecrã novo, o foco vai para a pergunta (leitores de ecrã anunciam-na)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    titulo.current?.focus();
  }, [i]);

  const seguinte = () => setI((x) => Math.min(x + 1, ecras.length - 1));
  const voltar = () => setI((x) => Math.max(x - 1, 0));

  /** Escolha única: grava e avança logo. */
  const escolher = (campo: keyof RespostasPasso2, valor: string, extra?: Partial<RespostasPasso2>) => {
    setR((atual) => ({ ...atual, [campo]: valor, ...extra }));
    window.setTimeout(seguinte, 160);
  };

  const escolherCarro = (v: string) => {
    if (v === "Não tenho") {
      setMarcaOutra(false);
      setModeloOutro(false);
      setR((a) => ({ ...a, carro: v, marca: "", modelo: "", ano: "", lugares: "" }));
    } else {
      setR((a) => ({ ...a, carro: v }));
    }
    window.setTimeout(() => setI(1), 160);
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
    setModeloOutro(false);
    escolher("modelo", m);
  };

  const alternarTurno = (t: string) =>
    setR((a) => ({ ...a, turnos: a.turnos.includes(t) ? a.turnos.filter((x) => x !== t) : [...a.turnos, t] }));

  const marcasFiltradas = useMemo(() => {
    const q = normalizar(pesquisa);
    return q ? LISTA_MARCAS.filter((m) => normalizar(m).includes(q)) : LISTA_MARCAS;
  }, [pesquisa]);

  const modelos = r.marca && MARCAS[r.marca] ? MARCAS[r.marca] : [];
  const progresso = Math.round(((i + 1) / ecras.length) * 100);

  const pergunta = (texto: string) => (
    <h3 ref={titulo} tabIndex={-1} className="inv-quiz-q inv-display">
      {texto}
    </h3>
  );

  return (
    <div className="inv-quiz">
      <div className="inv-quiz-top">
        <button type="button" className="inv-quiz-back" onClick={voltar} disabled={i === 0} aria-label="Voltar à pergunta anterior">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Voltar
        </button>
        <span className="inv-quiz-count">
          {i + 1} de {ecras.length}
        </span>
      </div>
      <div className="inv-quiz-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso} aria-label="Progresso">
        <span style={{ width: `${progresso}%` }} />
      </div>

      {ecra === "carro" && (
        <>
          {pergunta("Tens carro?")}
          <div className="inv-options">
            {CARROS.map((c) => (
              <button key={c} type="button" className="inv-option" aria-pressed={r.carro === c} onClick={() => escolherCarro(c)}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {ecra === "marca" && (
        <>
          {pergunta("Qual é a marca?")}
          {!marcaOutra ? (
            <>
              <input
                className="inv-input inv-search"
                type="search"
                placeholder="Procurar marca"
                aria-label="Procurar marca"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
              <div className="inv-options inv-options-grid inv-options-scroll">
                {marcasFiltradas.map((m) => (
                  <button key={m} type="button" className="inv-option" aria-pressed={r.marca === m} onClick={() => escolherMarca(m)}>
                    {m}
                  </button>
                ))}
                <button type="button" className="inv-option" onClick={() => escolherMarca(OUTRA_MARCA)}>
                  {OUTRA_MARCA}
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (r.marca.trim().length >= 2) seguinte();
              }}
            >
              <label className="inv-legend" htmlFor="inv-marca-outra">
                Escreve a marca
              </label>
              <input
                id="inv-marca-outra"
                className="inv-input"
                autoFocus
                maxLength={40}
                value={r.marca}
                onChange={(e) => setR((a) => ({ ...a, marca: e.target.value }))}
              />
              <button type="submit" className="inv-btn inv-btn-next" disabled={r.marca.trim().length < 2}>
                Continuar
              </button>
              <button type="button" className="inv-link-btn" onClick={() => { setMarcaOutra(false); setModeloOutro(false); setR((a) => ({ ...a, marca: "" })); }}>
                Ver a lista de marcas
              </button>
            </form>
          )}
        </>
      )}

      {ecra === "modelo" && (
        <>
          {pergunta(`Que modelo${r.marca && !marcaOutra ? ` ${r.marca}` : ""}?`)}
          {!modeloOutro && modelos.length > 0 ? (
            <div className="inv-options inv-options-grid inv-options-scroll">
              {modelos.map((m) => (
                <button key={m} type="button" className="inv-option" aria-pressed={r.modelo === m} onClick={() => escolherModelo(m)}>
                  {m}
                </button>
              ))}
              <button type="button" className="inv-option" onClick={() => escolherModelo(OUTRO_MODELO)}>
                {OUTRO_MODELO}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (r.modelo.trim().length >= 1) seguinte();
              }}
            >
              <label className="inv-legend" htmlFor="inv-modelo-outro">
                Escreve o modelo
              </label>
              <input
                id="inv-modelo-outro"
                className="inv-input"
                autoFocus
                maxLength={40}
                value={r.modelo}
                onChange={(e) => setR((a) => ({ ...a, modelo: e.target.value }))}
              />
              <button type="submit" className="inv-btn inv-btn-next" disabled={r.modelo.trim().length < 1}>
                Continuar
              </button>
              {modelos.length > 0 && (
                <button type="button" className="inv-link-btn" onClick={() => setModeloOutro(false)}>
                  Ver a lista de modelos
                </button>
              )}
            </form>
          )}
        </>
      )}

      {ecra === "ano" && (
        <>
          {pergunta("De que ano é?")}
          <div className="inv-options inv-options-years">
            {anos.map((a) => (
              <button
                key={a}
                type="button"
                className={`inv-option${a === MAIS_ANTIGO ? " inv-option-wide" : ""}`}
                aria-pressed={r.ano === a}
                onClick={() => escolher("ano", a)}
              >
                {a}
              </button>
            ))}
          </div>
        </>
      )}

      {ecra === "lugares" && (
        <>
          {pergunta("Quantos lugares tem?")}
          <div className="inv-options inv-options-grid">
            {LUGARES.map((l) => (
              <button key={l} type="button" className="inv-option" aria-pressed={r.lugares === l} onClick={() => escolher("lugares", l)}>
                {l} lugares
              </button>
            ))}
          </div>
        </>
      )}

      {ecra === "regime" && (
        <>
          {pergunta("Como queres trabalhar?")}
          <div className="inv-options">
            {REGIMES.map((g) => (
              <button key={g} type="button" className="inv-option" aria-pressed={r.regime === g} onClick={() => escolher("regime", g)}>
                {g}
              </button>
            ))}
          </div>
        </>
      )}

      {ecra === "turnos" && (
        <>
          {pergunta("Em que turnos estás livre?")}
          <p className="inv-quiz-hint">Podes escolher vários.</p>
          <div className="inv-options inv-options-grid">
            {TURNOS.map((t) => (
              <button key={t} type="button" className="inv-option" aria-pressed={r.turnos.includes(t)} onClick={() => alternarTurno(t)}>
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inv-btn inv-btn-next"
            disabled={aEnviar || r.turnos.length === 0}
            onClick={() => onConcluir(r)}
          >
            {aEnviar ? "A guardar…" : "Concluir inscrição"}
          </button>
        </>
      )}

      <button type="button" className="inv-link-btn" onClick={onSaltar}>
        Agora não, fica só o contacto
      </button>
    </div>
  );
}
