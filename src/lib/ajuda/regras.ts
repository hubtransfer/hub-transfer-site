// ───────────────────────────────────────────────────────────────
//  ajuda/regras.ts — regras puras da «Ajuda» (sem imports de valores:
//  os testes em tests/ajuda.test.mjs correm-nas com o node, sem build).
// ───────────────────────────────────────────────────────────────
import type {
  CategoriaCarro,
  ColegaPossivel,
  EstadoPedido,
  MotoristaNoDia,
  PedidoAjuda,
  PedidoRecebido,
  ResumoViagemAjuda,
} from "./tipos";

/** Minutos sem resposta até quem pediu ser avisado (decisão do Junior). */
export const MINUTOS_SEM_RESPOSTA = 15;

/** Duração prevista quando a viagem não traz nenhuma. */
export const DURACAO_PADRAO_MIN = 60;

/** Folga antes da recolha: o colega tem de estar livre a partir daqui. */
export const FOLGA_ANTES_MIN = 30;

/**
 * Que carros podem fazer cada categoria de viagem.
 * Por agora: só a mesma categoria (o pedido diz «o carro certo»).
 * DÚVIDA PARA O JUNIOR: um Business pode fazer uma viagem Sedan?
 * Se sim, basta acrescentar aqui (ex.: Sedan: ["Sedan", "Business"]).
 */
export const CARROS_QUE_SERVEM: Record<CategoriaCarro, CategoriaCarro[]> = {
  Sedan: ["Sedan"],
  MPV: ["MPV"],
  Business: ["Business"],
  Luxo: ["Luxo"],
};

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
 * Os colegas que podem fazer uma viagem: trabalham nesse dia, têm o
 * carro certo e estão livres à hora (de FOLGA_ANTES_MIN antes da
 * recolha até ao fim previsto). Nunca inclui quem pede.
 * Ordem: quem fica livre mais tempo primeiro; depois pelo nome.
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

  const lista: (ColegaPossivel & { _livre: number })[] = [];
  for (const m of motoristas) {
    if (!m.trabalhaNoDia) continue;
    if (m.id === quemPede) continue;
    if (!carroServe(viagem.categoria, m.categoria)) continue;

    const tIni = minutosDoDia(m.turnoInicio);
    const tFim = minutosDoDia(m.turnoFim);
    if (tIni !== null && precisaDe < tIni) continue;
    if (tFim !== null && ateAs > tFim) continue;

    let ocupado = false;
    let proxima: number | null = null;
    for (const v of m.viagens) {
      const vi = minutosDoDia(v.hora);
      if (vi === null) continue;
      const vf = vi + (v.duracaoMin > 0 ? v.duracaoMin : DURACAO_PADRAO_MIN);
      // sobrepõe-se ao intervalo [precisaDe, ateAs + folga para a próxima]
      if (vi < ateAs + FOLGA_ANTES_MIN && vf > precisaDe) { ocupado = true; break; }
      if (vi >= ateAs && (proxima === null || vi < proxima)) proxima = vi;
    }
    if (ocupado) continue;

    const livre = proxima ?? tFim ?? 24 * 60;
    lista.push({
      id: m.id,
      nome: m.nome,
      categoria: m.categoria,
      ...(proxima !== null ? { proximaViagem: hhmm(proxima) } : {}),
      ...(proxima === null && tFim !== null ? { livreAte: hhmm(tFim) } : {}),
      _livre: livre,
    });
  }
  lista.sort((a, b) => b._livre - a._livre || a.nome.localeCompare(b.nome, "pt"));
  return lista.map(({ _livre, ...c }) => { void _livre; return c; });
}

/**
 * O estado que conta AGORA: um pedido «à espera» cujo prazo passou
 * passa a «sem resposta», mesmo antes de o backend o dizer.
 * Pedidos ao grupo não expiram (ficam até alguém carregar «Fico eu»).
 */
export function estadoEfectivo(
  p: { estado: EstadoPedido; tipo: "colega" | "grupo"; expiraEm?: string },
  agora: number,
): EstadoPedido {
  if (p.estado !== "a_espera" || p.tipo !== "colega" || !p.expiraEm) return p.estado;
  const t = Date.parse(p.expiraEm);
  return Number.isFinite(t) && agora >= t ? "sem_resposta" : "a_espera";
}

/** Minutos que faltam para os 15 (arredondado para cima; nunca negativo). */
export function minutosAteExpirar(expiraEm: string | undefined, agora: number): number {
  const t = Date.parse(String(expiraEm ?? ""));
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.ceil((t - agora) / 60000));
}

/** ISO de criadoEm + 15 min */
export function prazoDoPedido(criadoEm: string): string {
  return new Date(Date.parse(criadoEm) + MINUTOS_SEM_RESPOSTA * 60000).toISOString();
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

/** Os pedidos recebidos que ainda pedem resposta, os mais antigos primeiro. */
export function pedidosPorResponder(lista: PedidoRecebido[], agora: number): PedidoRecebido[] {
  return lista
    .filter((p) => estadoEfectivo(p, agora) === "a_espera" && !p.ficouCom)
    .sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm));
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
