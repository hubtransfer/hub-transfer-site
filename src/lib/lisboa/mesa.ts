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

/** De onde sai o cliente (ida) ou para onde volta (volta). */
export type Sitio =
  | { tipo: "hotel"; nome: string } // o hotel do cliente identificado
  | { tipo: "morada"; texto: string } // escrito pelo cliente
  | { tipo: "gps"; lat: number; lng: number }; // «Usar a minha localização»

/** Ida: a HUB leva-me · vou por mim · ainda não sei. Volta: sim · não. */
export type Ida = "hub" | "eu" | "naosei";
export type Volta = "sim" | "nao";

export type DadosMesa = {
  prato?: { n: number; nome: string };
  /** escolhido em «Escolher este» ou na lista do «Mudar» */
  restaurante?: { codigo: string; nome: string };
  /** escrito pelo cliente em «Outro restaurante» (pode ficar em branco: escolhemos nós) */
  restauranteLivre: string;
  /** AAAA-MM-DD */
  data: string;
  hora: string;
  pessoas: number;
  nome: string;
  ida: Ida;
  /** só com ida = "hub" */
  idaDe?: Sitio;
  volta: Volta;
  /** só com volta = "sim" */
  voltaHora?: string;
  voltaPara?: Sitio;
  /** código curto do cliente identificado (/lisboa?c=…); nunca o nome completo, o telefone ou o e-mail */
  ref?: string;
};

/** O que o pedido leva: M só mesa · I mesa e ida · V mesa e volta · IV mesa, ida e volta. */
export type Servico = "M" | "I" | "V" | "IV";

export function servicoDe(d: Pick<DadosMesa, "ida" | "volta">): Servico {
  const i = d.ida === "hub";
  const v = d.volta === "sim";
  return i && v ? "IV" : i ? "I" : v ? "V" : "M";
}

/** Recolha estimada: hora da mesa menos 30 minutos. Regresso por defeito: hora da mesa mais 2 horas. */
export function somarMinutos(hhmm: string, m: number): string {
  const [h, mi] = hhmm.split(":").map(Number);
  const t = (((h * 60 + mi + m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Ligação do Google Maps para as coordenadas (sem API paga: é só uma ligação). */
export const ligacaoMapa = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

/** Como o sítio aparece no resumo (no ecrã). */
export function sitioNoEcra(s: Sitio, t: Textos): string {
  if (s.tipo === "hotel") return s.nome;
  if (s.tipo === "morada") return s.texto.trim();
  return t.iGpsOk;
}

/** Como o sítio vai na mensagem: com a localização, a ligação do Google Maps. */
function sitioNaMensagem(s: Sitio): string {
  if (s.tipo === "hotel") return s.nome;
  if (s.tipo === "morada") return s.texto.trim();
  return ligacaoMapa(s.lat, s.lng);
}

const LOCALE: Record<Lingua, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", it: "it-IT" };

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

export function mensagemMesa(t: Textos, lingua: Lingua, d: DadosMesa): { texto: string; origem: OrigemWhats; servico: Servico; link: string } {
  const abertura = d.prato
    ? d.prato.n === 8
      ? t.msgMesaP8
      : t.msgMesaPrato.replace("{d}", nomeNaFrase(d.prato.nome))
    : t.msgMesa;
  const restaurante = d.restaurante?.nome || d.restauranteLivre.trim() || t.mRestHub;
  const servico = servicoDe(d);
  const linhas = [
    abertura,
    `${t.mRest}: ${restaurante}`,
    `${t.mDia}: ${diaPorExtenso(d.data, lingua)} · ${t.mHora}: ${d.hora} · ${t.mPessoas}: ${d.pessoas} · ${t.mNome}: ${d.nome.trim()}`,
  ];
  if (d.ida === "hub" && d.idaDe)
    linhas.push(`${t.mIda}: ${sitioNaMensagem(d.idaDe)} → ${restaurante}, ${t.mPorVolta} ${somarMinutos(d.hora, -30)}`);
  else if (d.ida === "naosei") linhas.push(t.mIdaNaoSei);
  if (d.volta === "sim" && d.voltaPara && d.voltaHora)
    linhas.push(`${t.mVolta}: ${restaurante} → ${sitioNaMensagem(d.voltaPara)}, ${t.mPorVolta} ${d.voltaHora}`);
  const pedido = [t.mMesaS];
  if (servico.includes("I")) pedido.push(t.mIdaS);
  if (servico.includes("V")) pedido.push(t.mVoltaS);
  linhas.push(`${t.mPedido}: ${pedido.join(" + ")}`);
  if (d.ref) linhas.push(`${t.mRef}: ${d.ref}`);
  const texto = linhas.join("\n");
  const origem: OrigemWhats = { tipo: "MESA", prato: d.prato?.n, restaurante: d.restaurante?.codigo, servico };
  return { texto, origem, servico, link: linkWhatsapp(texto, origem, lingua) };
}
