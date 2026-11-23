// ───────────────────────────────────────────────────────────────
//  ajuda/regras.ts — regras puras da «Ajuda» (sem imports de valores:
//  os testes em tests/ajuda.test.mjs correm-nas com o node, sem build).
// ───────────────────────────────────────────────────────────────
import type {
  CategoriaCarro,
  ColegaPossivel,
  EstadoPedido,
  MotivoAjuda,
  MotoristaNoDia,
  PedidoAjuda,
  PedidoRecebido,
  ResumoViagemAjuda,
} from "./tipos";

/** Minutos sem resposta até quem pediu ser avisado (decisão do Junior). */
export const MINUTOS_SEM_RESPOSTA = 15;

/** Grupo: minutos para a segunda confirmação depois do «Aceitar» (decisão do Junior). */
export const MINUTOS_RESERVA = 10;

/** Duração prevista quando a viagem não traz nenhuma. */
export const DURACAO_PADRAO_MIN = 60;

/** Folga antes da recolha: o colega tem de estar livre a partir daqui. */
export const FOLGA_ANTES_MIN = 30;

/**
 * Que carros podem fazer cada categoria de viagem — decisão do Junior
 * (pedido 98): serve um carro IGUAL OU MAIOR.
 *   Viagem Sedan    → Sedan, MPV ou Business
 *   Viagem MPV      → só MPV
 *   Viagem Business → só Business
 * O motorista recebe sempre pelo tipo da viagem, não pelo carro que leva.
 * Luxo não entrou na decisão: fica só Luxo (dúvida no relatório).
 */
export const CARROS_QUE_SERVEM: Record<CategoriaCarro, CategoriaCarro[]> = {
  Sedan: ["Sedan", "MPV", "Business"],
  MPV: ["MPV"],
  Business: ["Business"],
  Luxo: ["Luxo"],
};

/** Os motivos, pela ordem dos botões. Só a gestão os vê. */
export const MOTIVOS: MotivoAjuda[] = ["doente", "carro_avariado", "atrasado", "outro"];

/** O motivo é um dos quatro? (obrigatório antes de enviar) */
export function motivoValido(m: unknown): m is MotivoAjuda {
  return typeof m === "string" && (MOTIVOS as string[]).includes(m);
}

/** "14:05" → 845; inválido → null */
export function minutosDoDia(hhmm: string | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** 845 → "14:05" */
export function hhmm(min: number): string {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** A categoria da viagem serve a este carro? Viagem sem categoria → qualquer carro. */
export function carroServe(categoriaViagem: string, carro: CategoriaCarro): boolean {
  const cv = String(categoriaViagem || "").trim().toLowerCase();
  if (!cv) return true;
  const chave = (Object.keys(CARROS_QUE_SERVEM) as CategoriaCarro[]).find((k) => k.toLowerCase() === cv);
  if (!chave) return false; // categoria estranha: ninguém, para não mandar o carro errado
  return CARROS_QUE_SERVEM[chave].includes(carro);
}

/**
 * Os colegas que podem fazer uma viagem: trabalham nesse dia, têm um carro
 * igual ou maior e estão livres à hora (de FOLGA_ANTES_MIN antes da recolha
 * até ao fim previsto, mais a folga para a viagem seguinte). Nunca inclui
 * quem pede.
 * Devolve SÓ o nome e a categoria — ninguém vê a agenda dos outros.
 * Ordem: primeiro o carro da categoria da viagem, depois pelo nome
 * (a ordem não pode deixar adivinhar quem está mais livre).
 */
export function colegasPossiveis(
  viagem: { hora: string; categoria: string; duracaoMin?: number },
  motoristas: MotoristaNoDia[],
  quemPede: string,
): ColegaPossivel[] {
  const ini = minutosDoDia(viagem.hora);
  if (ini === null) return [];
  const dur = viagem.duracaoMin && viagem.duracaoMin > 0 ? viagem.duracaoMin : DURACAO_PADRAO_MIN;
  const precisaDe = ini - FOLGA_ANTES_MIN;
  const ateAs = ini + dur;
  const catViagem = String(viagem.categoria || "").trim().toLowerCase();

  const lista: ColegaPossivel[] = [];
  for (const m of motoristas) {
    if (!m.trabalhaNoDia) continue;
    if (m.id === quemPede) continue;
    if (!carroServe(viagem.categoria, m.categoria)) continue;

    const tIni = minutosDoDia(m.turnoInicio);
    const tFim = minutosDoDia(m.turnoFim);
    if (tIni !== null && precisaDe < tIni) continue;
    if (tFim !== null && ateAs > tFim) continue;

    const ocupado = m.viagens.some((v) => {
      const vi = minutosDoDia(v.hora);
      if (vi === null) return false;
      const vf = vi + (v.duracaoMin > 0 ? v.duracaoMin : DURACAO_PADRAO_MIN);
      // sobrepõe-se ao intervalo [precisaDe, ateAs + folga para a próxima]
      return vi < ateAs + FOLGA_ANTES_MIN && vf > precisaDe;
    });
    if (ocupado) continue;

    lista.push({ id: m.id, nome: m.nome, categoria: m.categoria });
  }
  const mesma = (c: ColegaPossivel) => (c.categoria.toLowerCase() === catViagem ? 0 : 1);
  return lista.sort((a, b) => mesma(a) - mesma(b) || a.nome.localeCompare(b.nome, "pt"));
}

/**
 * O estado que conta AGORA, mesmo antes de o backend o dizer:
 * - colega «à espera» com o prazo dos 15 min passado → «sem resposta»;
 * - grupo «reservada» com os 10 min da segunda confirmação passados →
 *   volta a «à espera» (o pedido voltou ao grupo).
 * Pedidos ao grupo à espera não expiram (ficam até alguém aceitar).
 */
export function estadoEfectivo(
  p: { estado: EstadoPedido; tipo: "colega" | "grupo"; expiraEm?: string; reservaExpiraEm?: string },
  agora: number,
): EstadoPedido {
  if (p.estado === "reservada") {
    return prazoPassou(p.reservaExpiraEm, agora) ? "a_espera" : "reservada";
  }
  if (p.estado !== "a_espera" || p.tipo !== "colega" || !p.expiraEm) return p.estado;
  return prazoPassou(p.expiraEm, agora) ? "sem_resposta" : "a_espera";
}

function prazoPassou(iso: string | undefined, agora: number): boolean {
  const t = Date.parse(String(iso ?? ""));
  return Number.isFinite(t) && agora >= t;
}

/** A reserva do grupo acabou sem a segunda confirmação? */
export function reservaCaiu(
  p: { estado: EstadoPedido; reservaExpiraEm?: string },
  agora: number,
): boolean {
  return p.estado === "reservada" && prazoPassou(p.reservaExpiraEm, agora);
}

/** Minutos que faltam para um prazo (arredondado para cima; nunca negativo). */
export function minutosAteExpirar(expiraEm: string | undefined, agora: number): number {
  const t = Date.parse(String(expiraEm ?? ""));
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.ceil((t - agora) / 60000));
}

/** ISO de criadoEm + 15 min */
export function prazoDoPedido(criadoEm: string): string {
  return new Date(Date.parse(criadoEm) + MINUTOS_SEM_RESPOSTA * 60000).toISOString();
}

/** ISO do «Aceitar» + 10 min (prazo da segunda confirmação) */
export function prazoDaReserva(aceiteEm: string): string {
  return new Date(Date.parse(aceiteEm) + MINUTOS_RESERVA * 60000).toISOString();
}

/** «14:35» — a hora de Lisboa em que acaba um prazo ISO. */
export function horaDoPrazo(iso: string | undefined): string {
  const t = Date.parse(String(iso ?? ""));
  if (!Number.isFinite(t)) return "";
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Lisbon",
    }).format(new Date(t));
  } catch { return ""; }
}

/** A viagem ainda aceita pedidos de ajuda? (não acabou, não está em curso) */
export function podePedirAjuda(v: {
  concluida?: boolean;
  status?: string;
  statusMotorista?: string;
  cancelada?: boolean;
  noShow?: boolean;
}): boolean {
  if (v.concluida || v.cancelada || v.noShow) return false;
  const st = String(v.status || "").toUpperCase();
  if (st === "CONCLUIDA" || st === "FINALIZOU") return false;
  const sm = String(v.statusMotorista || "").toUpperCase();
  // Com o cliente no carro já não se passa a viagem a outro
  return sm !== "EM_VIAGEM" && sm !== "FINALIZADO";
}

/**
 * Os pedidos recebidos que ainda pedem resposta, os mais antigos primeiro:
 * à espera (dentro do prazo, sem dono). No grupo, uma reserva que caiu
 * volta a contar como à espera; a reserva de OUTRO colega não aparece
 * (pode voltar se ele não confirmar).
 */
export function pedidosPorResponder(lista: PedidoRecebido[], agora: number): PedidoRecebido[] {
  return lista
    .filter((p) => estadoEfectivo(p, agora) === "a_espera" && !p.ficouCom)
    .sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm));
}

/** As reservas minhas (grupo) à espera da segunda confirmação, dentro do prazo. */
export function reservasMinhas(lista: PedidoRecebido[], agora: number): PedidoRecebido[] {
  return lista.filter((p) => !!p.reservadaParaMim && estadoEfectivo(p, agora) === "reservada" && !p.ficouCom);
}

/** Quem pediu deixa de ter a viagem? (aceite → sai da lista dele) */
export function viagemSaiDeQuemPediu(p: Pick<PedidoAjuda, "estado" | "ficouCom">): boolean {
  return p.estado === "aceite" && !!p.ficouCom;
}

/** Nome curto: «Rui Martins Costa» → «Rui Costa»; um nome só fica igual. */
export function nomeCurto(nome: string): string {
  const p = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (p.length <= 2) return p.join(" ");
  return `${p[0]} ${p[p.length - 1]}`;
}

/** «Aeroporto de Lisboa → Hotel Avenida» */
export function deOndeParaOnde(r: Pick<ResumoViagemAjuda, "origem" | "destino">): string {
  return [r.origem, r.destino].map((s) => String(s || "").trim()).filter(Boolean).join(" → ");
}

// ── Os links do WhatsApp para a app ─────────────────────────────
//
//  Ao colega escolhido:        <site>/driver/trips?ajuda=<PedidoId>
//  Ao grupo («Aceitar»):       <site>/driver/trips?ajuda=<PedidoId>
//  Privado (2.ª confirmação):  <site>/driver/trips?ajuda=<PedidoId>&passo=confirmar
//
//  Só levam o id OPACO do pedido: nunca o ID da viagem (pode trazer a
//  referência da reserva), a linha, a operadora ou o motorista. Quem abre
//  o link é sempre o motorista da sessão: é por ela que o HUB-Central sabe
//  quem aceitou.

/** Caminho da app que os links abrem. */
export const CAMINHO_LINK = "/driver/trips";

export type PassoLink = "pedido" | "confirmar";

/** Ids de pedido aceites num link: letras, números, «-» e «_», de 4 a 64. */
export function pedidoIdValido(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{4,64}$/.test(id);
}

/** O link de um pedido. `base` = o endereço do site (com ou sem «/» no fim). */
export function linkDoPedido(base: string, pedidoId: string, passo: PassoLink = "pedido"): string {
  const b = String(base || "").replace(/\/+$/, "");
  const q = `ajuda=${encodeURIComponent(pedidoId)}${passo === "confirmar" ? "&passo=confirmar" : ""}`;
  return `${b}${CAMINHO_LINK}?${q}`;
}

/** Lê o pedido de um «?ajuda=…&passo=…»; inválido → null. */
export function lerLinkDoPedido(search: string): { pedidoId: string; passo: PassoLink } | null {
  const q = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const id = q.get("ajuda");
  if (!pedidoIdValido(id)) return null;
  return { pedidoId: id, passo: q.get("passo") === "confirmar" ? "confirmar" : "pedido" };
}
