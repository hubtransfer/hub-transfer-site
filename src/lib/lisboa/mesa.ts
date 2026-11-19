/* Formulário da mesa: como se abre e que mensagem leva para o WhatsApp.
   Nada é guardado no servidor: os dados vão só na mensagem. */

import { linkWhatsapp, type OrigemWhats } from "./config";
import type { Textos } from "./textos";
import type { Lingua } from "./tipos";

/** De onde o formulário foi aberto (vai para a medição). */
export type OrigemMesa = "topo" | "barra" | "restaurante" | "livre" | "deixe-connosco" | "vista";

export type PedidoMesa = {
  origem: OrigemMesa;
  prato?: { n: number; nome: string };
  restaurante?: { codigo: string; nome: string; bairro: string };
};

const EVENTO = "lx-mesa";

/** Abre o formulário da página (o componente FormularioMesa está a ouvir). */
export function abrirMesa(pedido: PedidoMesa) {
  window.dispatchEvent(new CustomEvent<PedidoMesa>(EVENTO, { detail: pedido }));
}

export function aoAbrirMesa(fn: (p: PedidoMesa) => void) {
  const h = (e: Event) => fn((e as CustomEvent<PedidoMesa>).detail);
  window.addEventListener(EVENTO, h);
  return () => window.removeEventListener(EVENTO, h);
}

export type DadosMesa = {
  prato?: { n: number; nome: string };
  /** escolhido em «Escolher este» */
  restaurante?: { codigo: string; nome: string };
  /** escrito pelo cliente (pode ficar em branco: escolhemos nós) */
  restauranteLivre: string;
  /** AAAA-MM-DD */
  data: string;
  hora: string;
  pessoas: number;
  nome: string;
  transporte: boolean;
};

const LOCALE: Record<Lingua, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES" };

/** «sábado, 22/11» */
export function diaPorExtenso(data: string, lingua: Lingua): string {
  const [a, m, d] = data.split("-").map(Number);
  const dia = new Date(a, m - 1, d);
  const semana = new Intl.DateTimeFormat(LOCALE[lingua], { weekday: "long" }).format(dia);
  return `${semana}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/** Hoje no relógio do cliente, AAAA-MM-DD. */
export function hoje(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** Nome do prato a meio da frase: só a primeira letra desce («bacalhau à Brás», «amêijoas à Bulhão Pato»);
    nomes que começam por um nome próprio ficam como estão («Portuguese steak»). */
function nomeNaFrase(nome: string): string {
  if (/^(Portuguese)\b/.test(nome)) return nome;
  return nome.charAt(0).toLowerCase() + nome.slice(1);
}

export function mensagemMesa(t: Textos, lingua: Lingua, d: DadosMesa): { texto: string; origem: OrigemWhats; link: string } {
  const abertura = d.prato
    ? d.prato.n === 8
      ? t.msgMesaP8
      : t.msgMesaPrato.replace("{d}", nomeNaFrase(d.prato.nome))
    : t.msgMesa;
  const restaurante = d.restaurante?.nome || d.restauranteLivre.trim() || t.mRestHub;
  const texto = [
    abertura,
    `${t.mRest}: ${restaurante}`,
    `${t.mDia}: ${diaPorExtenso(d.data, lingua)} · ${t.mHora}: ${d.hora} · ${t.mPessoas}: ${d.pessoas} · ${t.mNome}: ${d.nome.trim()}`,
    `${t.mTransp}: ${d.transporte ? t.sim : t.nao}`,
  ].join("\n");
  const origem: OrigemWhats = { tipo: "MESA", prato: d.prato?.n, restaurante: d.restaurante?.codigo };
  return { texto, origem, link: linkWhatsapp(texto, origem, lingua) };
}
