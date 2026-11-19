"use client";

import { useEffect, useId, useRef, useState } from "react";
import { medir } from "@/lib/lisboa/medicao";
import { aoAbrirMesa, hoje, mensagemMesa, type PedidoMesa } from "@/lib/lisboa/mesa";
import type { Textos } from "@/lib/lisboa/textos";
import type { Lingua } from "@/lib/lisboa/tipos";

/* Formulário da mesa: abre por cima da página (folha em baixo no telemóvel, cartão ao centro no computador).
   Só abre o WhatsApp com a mensagem completa; nada é enviado para o servidor. */

type Campos = { rest: string; data: string; hora: string; pessoas: string; nome: string; transporte: boolean };
type Erros = Partial<Record<"data" | "hora" | "pessoas" | "nome", string>>;

const INICIAL: Campos = { rest: "", data: "", hora: "20:00", pessoas: "2", nome: "", transporte: false };

export default function FormularioMesa({ lingua, t }: { lingua: Lingua; t: Textos }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [pedido, setPedido] = useState<PedidoMesa | null>(null);
  const [fixo, setFixo] = useState<PedidoMesa["restaurante"]>();
  const [c, setC] = useState<Campos>(INICIAL);
  const [erros, setErros] = useState<Erros>({});
  const [minimo, setMinimo] = useState("");

  useEffect(
    () =>
      aoAbrirMesa((p) => {
        setPedido(p);
        setFixo(p.restaurante);
        setErros({});
        setMinimo(hoje());
        setC((v) => {
          const n = { ...v, rest: "", transporte: false };
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
        const d = dialogo.current;
        if (d && !d.open) d.showModal();
      }),
    []
  );

  const mudar = (p: Partial<Campos>) => setC((v) => ({ ...v, ...p }));
  const fechar = () => dialogo.current?.close();

  const validar = (): Erros => {
    const e: Erros = {};
    if (!c.data || c.data < hoje()) e.data = t.eDia;
    if (!/^\d{2}:\d{2}$/.test(c.hora)) e.hora = t.eHora;
    const n = Number(c.pessoas);
    if (!Number.isInteger(n) || n < 1 || n > 20) e.pessoas = t.ePessoas;
    if (!c.nome.trim()) e.nome = t.eNome;
    return e;
  };

  const enviar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!pedido) return;
    const e = validar();
    setErros(e);
    const primeiro = (["data", "hora", "pessoas", "nome"] as const).find((k) => e[k]);
    if (primeiro) {
      document.getElementById(`${id}-${primeiro}`)?.focus();
      return;
    }
    const { link } = mensagemMesa(t, lingua, {
      prato: pedido.prato,
      restaurante: fixo,
      restauranteLivre: c.rest,
      data: c.data,
      hora: c.hora,
      pessoas: Number(c.pessoas),
      nome: c.nome,
      transporte: c.transporte,
    });
    medir("PedirMesa", {
      prato: pedido.prato?.n ?? "-",
      restaurante: fixo?.codigo ?? (pedido.prato || c.rest.trim() ? "LIVRE" : "-"),
      transporte: c.transporte ? "sim" : "nao",
      origem: pedido.origem,
      lingua,
    });
    const janela = window.open(link, "_blank");
    if (janela) janela.opener = null;
    else window.location.href = link;
    fechar();
  };

  const erro = (k: keyof Erros) =>
    erros[k] ? (
      <small id={`${id}-${k}-erro`} className="lx-erro">
        {erros[k]}
      </small>
    ) : null;
  const ligar = (k: keyof Erros) => ({
    id: `${id}-${k}`,
    "aria-invalid": erros[k] ? true : undefined,
    "aria-describedby": erros[k] ? `${id}-${k}-erro` : undefined,
  });

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
      <form className="lx-folha-in" onSubmit={enviar} noValidate>
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

        {fixo ? (
          <div className="lx-escolhido">
            <span>{t.fRest}</span>
            <div>
              <b>{fixo.nome}</b>
              <small>{fixo.bairro}</small>
            </div>
            <button type="button" className="lx-mudar" onClick={() => setFixo(undefined)}>
              {t.fMudar}
            </button>
          </div>
        ) : (
          <label className="lx-campo-largo">
            <span>{t.fRest}</span>
            <input value={c.rest} placeholder={t.fRestPh} maxLength={80} autoComplete="off" onChange={(e) => mudar({ rest: e.target.value })} />
          </label>
        )}

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
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={c.pessoas}
              onChange={(e) => mudar({ pessoas: e.target.value })}
              {...ligar("pessoas")}
            />
            {erro("pessoas")}
          </label>
          <label>
            <span>{t.fNome}</span>
            <input
              value={c.nome}
              placeholder={t.fNomePh}
              maxLength={40}
              autoComplete="given-name"
              onChange={(e) => mudar({ nome: e.target.value })}
              {...ligar("nome")}
            />
            {erro("nome")}
          </label>
        </div>

        <label className="lx-transporte">
          <input type="checkbox" checked={c.transporte} onChange={(e) => mudar({ transporte: e.target.checked })} />
          <span>{t.fTransp}</span>
        </label>

        <button type="submit" className="lx-cta lx-folha-botao">
          {t.fBotao}
          <span className="lx-sr"> ({t.aWhats})</span>
        </button>
        <p className="lx-privado">{t.fPriv}</p>
      </form>
    </dialog>
  );
}
