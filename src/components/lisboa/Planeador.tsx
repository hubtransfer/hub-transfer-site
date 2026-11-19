"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Carrossel from "./Carrossel";
import { CONFIG_LISBOA, linkWhatsapp } from "@/lib/lisboa/config";
import { abrirMesa } from "@/lib/lisboa/mesa";
import { medir } from "@/lib/lisboa/medicao";
import { formatarMin, ordenarMaisCurto, planearDia, somarHora } from "@/lib/lisboa/rota";
import type { Textos } from "@/lib/lisboa/textos";
import type { EstiloJantar, Lingua } from "@/lib/lisboa/tipos";

/* «Monte a sua Lisboa» + «O seu dia» + «Acabe o dia à mesa» + barra fixa.
   Tudo o que o cliente escolhe fica neste componente (e na sessão do browser, para não se perder ao mudar de língua). */

export type LugarVista = {
  n: number;
  id: string;
  zona: string;
  lat: number;
  lng: number;
  min: number;
  nome: string;
  txt: string;
  hist: string;
  imagens: string[];
};

type Props = {
  lingua: Lingua;
  t: Textos;
  lugares: LugarVista[];
  estilos: EstiloJantar[];
};

type Escolhas = {
  rota: string[];
  mins: Record<string, number>;
  data: string;
  saida: string;
  pax: string;
  nome: string;
  jantar: boolean;
  estilo: string;
  jhora: string;
  jpref: string;
};

const INICIAL: Escolhas = {
  rota: [],
  mins: {},
  data: "",
  saida: "10:00",
  pax: "2",
  nome: "",
  jantar: false,
  estilo: "equipa",
  jhora: "20:00",
  jpref: "",
};

const CHAVE_SESSAO = "hub-lisboa-dia";
const TODAS = "all";

function semMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Planeador({ lingua, t, lugares, estilos }: Props) {
  const [e, setE] = useState<Escolhas>(INICIAL);
  const [zona, setZona] = useState(TODAS);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [carregado, setCarregado] = useState(false);
  const voo = useRef<{ n: number; de: DOMRect } | null>(null);
  const rolarPara = useRef<number | null>(null);

  const porId = useMemo(() => Object.fromEntries(lugares.map((l) => [l.id, l])), [lugares]);
  const zonas = useMemo(() => [TODAS, ...Array.from(new Set(lugares.map((l) => l.zona)))], [lugares]);
  const mudar = (parcial: Partial<Escolhas>) => setE((a) => ({ ...a, ...parcial }));

  /* Recupera o dia desta sessão (ex.: depois de mudar de língua). */
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(CHAVE_SESSAO);
      if (s) {
        const g = JSON.parse(s) as Partial<Escolhas>;
        setE((a) => ({ ...a, ...g, rota: (g.rota ?? []).filter((id) => porId[id]) }));
      }
    } catch {
      /* sem armazenamento: começa do zero */
    }
    setCarregado(true);
  }, [porId]);

  useEffect(() => {
    if (!carregado) return;
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(e));
    } catch {
      /* nada */
    }
  }, [e, carregado]);

  /* #p-1 … #p-21 (guias em PDF): abre a história desse lugar e leva o cliente até ele. */
  useEffect(() => {
    const doEndereco = () => {
      const m = window.location.hash.match(/^#p-(\d+)$/);
      const l = m && lugares.find((x) => x.n === Number(m[1]));
      if (!l) return;
      setZona(TODAS);
      setAbertos((a) => ({ ...a, [l.id]: true }));
      rolarPara.current = l.n;
    };
    doEndereco();
    window.addEventListener("hashchange", doEndereco);
    return () => window.removeEventListener("hashchange", doEndereco);
  }, [lugares]);

  useEffect(() => {
    if (rolarPara.current == null) return;
    const el = document.getElementById(`p-${rolarPara.current}`);
    rolarPara.current = null;
    el?.scrollIntoView({ behavior: semMovimento() ? "auto" : "smooth", block: "center" });
  }, [zona, abertos]);

  /* O número salta do cartão para a barra de baixo. */
  useEffect(() => {
    const v = voo.current;
    voo.current = null;
    if (!v || semMovimento()) return;
    const alvo = document.querySelector<HTMLElement>(`.lx-bar [data-n="${v.n}"]`);
    if (!alvo) return;
    const para = alvo.getBoundingClientRect();
    const bola = document.createElement("span");
    bola.textContent = String(v.n);
    bola.setAttribute("aria-hidden", "true");
    Object.assign(bola.style, {
      position: "fixed",
      left: `${v.de.left}px`,
      top: `${v.de.top}px`,
      width: `${v.de.width}px`,
      height: `${v.de.height}px`,
      borderRadius: "50%",
      background: "#FACF09",
      color: "#111110",
      font: "800 15px/1 var(--lx-font), system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "60",
      pointerEvents: "none",
      boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    });
    document.body.appendChild(bola);
    const dx = para.left + para.width / 2 - (v.de.left + v.de.width / 2);
    const dy = para.top + para.height / 2 - (v.de.top + v.de.height / 2);
    const anim = bola.animate(
      [
        { transform: "translate(0,0) scale(1)" },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.1)`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 0.4 },
      ],
      { duration: 650, easing: "cubic-bezier(.3,.7,.3,1)" }
    );
    anim.onfinish = () => bola.remove();
    anim.oncancel = () => bola.remove();
  }, [e.rota]);

  const alternar = useCallback(
    (l: LugarVista, botao: HTMLElement) => {
      const dentro = e.rota.includes(l.id);
      if (!dentro) {
        const num = botao.closest("article")?.querySelector(".lx-num");
        if (num) voo.current = { n: l.n, de: num.getBoundingClientRect() };
        medir("AdicionarLugar", { lugar: l.n, lingua });
      }
      mudar({ rota: dentro ? e.rota.filter((x) => x !== l.id) : [...e.rota, l.id] });
    },
    [e.rota, lingua]
  );

  const minsDe = (l: LugarVista) => e.mins[l.id] ?? l.min;
  const paragens = e.rota.map((id) => porId[id]).filter(Boolean);
  const plano = planearDia(CONFIG_LISBOA.hotel, paragens);

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= e.rota.length) return;
    const r = [...e.rota];
    [r[i], r[j]] = [r[j], r[i]];
    mudar({ rota: r });
  };

  const segunda = !!e.data && new Date(`${e.data}T12:00:00`).getDay() === 1 && e.rota.includes("jeronimos");
  const nome = e.nome.trim();

  const mensagem = () => {
    const linhas = [t.msgDay, ""];
    if (nome) linhas.push(`👤 ${nome}`);
    linhas.push(`📅 ${e.data || "—"} · ${e.saida} · ${e.pax} ${t.msgPax}`);
    for (const p of paragens) linhas.push(`${p.n}. ${p.nome} (${formatarMin(minsDe(p))})`);
    if (e.jantar) {
      const est = estilos.find((x) => x.id === e.estilo) ?? estilos[0];
      linhas.push(`🍽 ${t.msgDinner}: ${est[lingua][0]} · ${e.jhora}${e.jpref ? " · " + e.jpref : ""}`);
    }
    return linhas.join("\n");
  };

  const temDia = paragens.length > 0 || e.jantar;
  const visiveis = lugares.filter((l) => zona === TODAS || l.zona === zona);
  const rotulos = { anterior: t.aAnterior, seguinte: t.aSeguinte, imagem: t.aImagem };
  const com = (s: string, p: string) => s.replace("{p}", p);

  let relogio = e.saida || "10:00";

  return (
    <>
      {/* d) Monte a sua Lisboa */}
      <section className="lx-sec" aria-labelledby="lx-escolher">
        <h2 id="lx-escolher" className="lx-h2">
          {t.choose}
        </h2>
        <p className="lx-sub">{t.chooseSub}</p>

        <div className="lx-zonas" role="group" aria-label={t.aZonas}>
          {zonas.map((z) => (
            <button key={z} type="button" aria-pressed={z === zona} onClick={() => setZona(z)}>
              {z === TODAS ? t.all : z}
            </button>
          ))}
        </div>

        <div className="lx-grelha">
          {visiveis.map((l) => {
            const sel = e.rota.includes(l.id);
            const aberto = !!abertos[l.id];
            return (
              <article key={l.id} id={`p-${l.n}`} className={`lx-card lx-lugar${sel ? " sel" : ""}${aberto ? " aberto" : ""}`} data-revelar>
                <Carrossel imagens={l.imagens} alt={l.nome} rotulos={rotulos} sizes="(min-width: 1040px) 240px, (min-width: 640px) 33vw, (min-width: 560px) 50vw, 80vw">
                  <span className="lx-num" aria-hidden="true">
                    {l.n}
                  </span>
                  <span className="lx-zona">{l.zona}</span>
                </Carrossel>
                <div className="lx-card-body">
                  <h3>
                    <span className="lx-sr">{l.n}. </span>
                    {l.nome}
                  </h3>
                  <p className="lx-t">{l.txt}</p>
                  <div className="lx-hist" id={`hist-${l.n}`} inert={!aberto}>
                    <div>
                      <p>{l.hist}</p>
                    </div>
                  </div>
                  <span className="lx-dur">
                    ≈ {minsDe(l)} {t.min}
                  </span>
                  <div className="lx-acoes">
                    <button
                      type="button"
                      className={sel ? "lx-btn lx-btn--sel" : "lx-btn lx-btn--ink"}
                      aria-pressed={sel}
                      onClick={(ev) => alternar(l, ev.currentTarget)}
                    >
                      {sel ? `✓ ${t.added}` : `+ ${t.add}`}
                      <span className="lx-sr">: {l.nome}</span>
                    </button>
                    <button
                      type="button"
                      className="lx-btn"
                      aria-expanded={aberto}
                      aria-controls={`hist-${l.n}`}
                      onClick={() => setAbertos((a) => ({ ...a, [l.id]: !a[l.id] }))}
                    >
                      {aberto ? t.less : t.more}
                      <span className="lx-sr">: {l.nome}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* e) O seu dia */}
      <section className="lx-sec" aria-labelledby="lx-dia">
        <h2 id="lx-dia" className="lx-h2">
          {t.route}
        </h2>
        <p className="lx-sub">{t.routeSub}</p>
        <div className="lx-caixa">
          <div className="lx-campos">
            <label>
              <span>{t.date}</span>
              <input type="date" value={e.data} onChange={(ev) => mudar({ data: ev.target.value })} />
            </label>
            <label>
              <span>{t.start}</span>
              <input type="time" value={e.saida} onChange={(ev) => mudar({ saida: ev.target.value })} />
            </label>
            <label>
              <span>{t.pax}</span>
              <select value={e.pax} onChange={(ev) => mudar({ pax: ev.target.value })}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{t.name}</span>
              <input
                value={e.nome}
                placeholder={t.namePh}
                autoComplete="given-name"
                maxLength={40}
                onChange={(ev) => mudar({ nome: ev.target.value })}
              />
            </label>
          </div>

          <div className="lx-rota" aria-live="polite">
            {paragens.length === 0 ? (
              <p className="lx-vazio">{t.empty}</p>
            ) : (
              <>
                <ol>
                  <li className="lx-paragem">
                    <span className="lx-num lx-num--casa" aria-hidden="true">
                      ⌂
                    </span>
                    <div className="lx-info">
                      <b>{t.pickup}</b>
                      <span>{relogio}</span>
                    </div>
                  </li>
                  {paragens.map((p, i) => {
                    const trajeto = plano.trajetos[i];
                    relogio = somarHora(relogio, trajeto);
                    const chegada = relogio;
                    const m = minsDe(p);
                    relogio = somarHora(relogio, m);
                    return (
                      <li key={p.id} className="lx-paragem-bloco">
                        <div className="lx-trajeto">
                          ≈ {formatarMin(trajeto)} {t.drive}
                        </div>
                        <div className="lx-paragem">
                          <span className="lx-num" aria-hidden="true">
                            {p.n}
                          </span>
                          <div className="lx-info">
                            <b>{p.nome}</b>
                            <span>
                              {chegada} – {relogio}
                            </span>
                            <div className="lx-mini">
                              <button type="button" aria-label={com(t.aSubir, p.nome)} disabled={i === 0} onClick={() => mover(i, -1)}>
                                ↑ {t.up}
                              </button>
                              <button
                                type="button"
                                aria-label={com(t.aDescer, p.nome)}
                                disabled={i === paragens.length - 1}
                                onClick={() => mover(i, 1)}
                              >
                                ↓ {t.down}
                              </button>
                              <button type="button" aria-label={com(t.aTirar, p.nome)} onClick={() => mudar({ rota: e.rota.filter((x) => x !== p.id) })}>
                                ✕ {t.remove}
                              </button>
                            </div>
                          </div>
                          <div className="lx-passo">
                            <button
                              type="button"
                              aria-label={com(t.aMenos, p.nome)}
                              onClick={() => mudar({ mins: { ...e.mins, [p.id]: Math.max(15, m - 15) } })}
                            >
                              −
                            </button>
                            <span>{formatarMin(m)}</span>
                            <button
                              type="button"
                              aria-label={com(t.aMais, p.nome)}
                              onClick={() => mudar({ mins: { ...e.mins, [p.id]: Math.min(300, m + 15) } })}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  <li className="lx-paragem-bloco">
                    <div className="lx-trajeto">
                      ≈ {formatarMin(plano.regresso)} {t.drive}
                    </div>
                    <div className="lx-paragem">
                      <span className="lx-num lx-num--casa" aria-hidden="true">
                        ⌂
                      </span>
                      <div className="lx-info">
                        <b>{t.back}</b>
                        <span>{somarHora(relogio, plano.regresso)}</span>
                      </div>
                    </div>
                  </li>
                </ol>
                {paragens.length > 2 && (
                  <button
                    type="button"
                    className="lx-btn lx-otimizar"
                    onClick={() => mudar({ rota: ordenarMaisCurto(CONFIG_LISBOA.hotel, paragens).map((p) => p.id) })}
                  >
                    {t.optimize}
                  </button>
                )}
                {segunda && <p className="lx-aviso">{t.monday}</p>}
                {e.rota.includes("pena") && <p className="lx-aviso">{t.sintra}</p>}
              </>
            )}
          </div>
        </div>
      </section>

      {/* f) Acabe o dia à mesa */}
      <section className="lx-jantar" aria-labelledby="lx-jantar">
        <h2 id="lx-jantar" className="lx-h3">
          {t.eT}
        </h2>
        <p>{t.eS}</p>
        <label className="lx-juntar">
          <input type="checkbox" checked={e.jantar} onChange={(ev) => mudar({ jantar: ev.target.checked })} />
          <b>{t.dTitle}</b>
        </label>
        <div className="lx-jantar-mais" inert={!e.jantar} data-aberto={e.jantar || undefined}>
          <div>
            <fieldset className="lx-estilos">
              <legend className="lx-sr">{t.dTitle}</legend>
              {estilos.map((s) => (
                <label key={s.id} className="lx-estilo">
                  <input type="radio" name="lx-estilo" value={s.id} checked={e.estilo === s.id} onChange={() => mudar({ estilo: s.id })} />
                  <b>{s[lingua][0]}</b>
                  <span>{s[lingua][1]}</span>
                </label>
              ))}
            </fieldset>
            <div className="lx-campos">
              <label>
                <span>{t.dtime}</span>
                <input type="time" value={e.jhora} onChange={(ev) => mudar({ jhora: ev.target.value })} />
              </label>
              <label className="lx-largo">
                <span>{t.dpref}</span>
                <input value={e.jpref} placeholder={t.dprefPh} maxLength={80} onChange={(ev) => mudar({ jpref: ev.target.value })} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* h) Barra fixa */}
      <div className="lx-bar">
        <div className="lx-bar-in">
          <div className="lx-bar-resumo" aria-live="polite">
            {paragens.length > 0 ? (
              <>
                <b>{nome ? t.yourDay.replace("{n}", nome) : t.route}</b>
                <span className="lx-bar-nums">
                  {paragens.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && <span aria-hidden="true"> → </span>}
                      <span data-n={p.n} className="lx-bar-n">
                        {p.n}
                      </span>
                    </span>
                  ))}
                  {e.jantar && <span aria-hidden="true"> → 🍽</span>}
                </span>
              </>
            ) : e.jantar ? (
              <>
                <b>
                  <span aria-hidden="true">🍽 </span>
                  {t.eT}
                </b>
              </>
            ) : (
              <>
                <b>{t.free}</b>
                <span>{t.freeSub}</span>
              </>
            )}
          </div>
          {temDia ? (
            <a
              className="lx-cta"
              href={linkWhatsapp(mensagem(), { tipo: "ROTA", lugares: paragens.map((p) => p.n) }, lingua)}
              target="_blank"
              rel="noopener"
              onClick={() => medir("FalarConsultor", { lugares: paragens.length, lingua })}
            >
              {t.cta}
              <span className="lx-sr"> ({t.aWhats})</span>
            </a>
          ) : (
            // «Pedir a minha mesa»: abre o formulário da mesa (sem prato, restaurante em branco)
            <button type="button" className="lx-cta" aria-haspopup="dialog" onClick={() => abrirMesa({ origem: "barra" })}>
              {t.own2}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
