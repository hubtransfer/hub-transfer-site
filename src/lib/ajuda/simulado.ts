// ───────────────────────────────────────────────────────────────
//  ajuda/simulado.ts — FAZ DE HUB-CENTRAL, com dados inventados.
//  Nomes, viagens, horas e valores são todos inventados. Nada aqui
//  chama o Apps Script, a Z-API nem outro serviço: vive na memória
//  do browser e desaparece ao recarregar a página.
//
//  Quando o backend existir, quem o substitui é src/lib/ajuda/cliente.ts
//  (ver «LIGAR AO HUB-CENTRAL AQUI»).
// ───────────────────────────────────────────────────────────────
import type {
  CancelarPedido,
  MotoristaNoDia,
  MotoristaRef,
  PedidoAjuda,
  PedidoRecebido,
  PedirAColega,
  PedirAoGrupo,
  ResponderPedido,
  RespostaColegas,
  RespostaResponder,
  ResumoViagemAjuda,
} from "./tipos";
import { colegasPossiveis, prazoDoPedido, estadoEfectivo } from "./regras";
import type { ClienteAjuda, ViagemParaAjuda } from "./cliente";

/** Motoristas inventados para um dia qualquer. */
export const MOTORISTAS_INVENTADOS: MotoristaNoDia[] = [
  { id: "rui-costa", nome: "Rui Costa", categoria: "MPV", trabalhaNoDia: true, turnoInicio: "06:00", turnoFim: "18:00",
    viagens: [{ hora: "07:15", duracaoMin: 50 }, { hora: "16:30", duracaoMin: 45 }] },
  { id: "ana-ferreira", nome: "Ana Ferreira", categoria: "MPV", trabalhaNoDia: true, turnoInicio: "08:00", turnoFim: "20:00",
    viagens: [{ hora: "09:00", duracaoMin: 40 }] },
  { id: "tiago-lopes", nome: "Tiago Lopes", categoria: "Sedan", trabalhaNoDia: true, turnoInicio: "05:00", turnoFim: "15:00",
    viagens: [] },
  { id: "marta-sousa", nome: "Marta Sousa", categoria: "Sedan", trabalhaNoDia: true, turnoInicio: "10:00", turnoFim: "22:00",
    viagens: [{ hora: "19:00", duracaoMin: 60 }] },
  { id: "paulo-nunes", nome: "Paulo Nunes", categoria: "Business", trabalhaNoDia: true, turnoInicio: "07:00", turnoFim: "19:00",
    viagens: [{ hora: "11:40", duracaoMin: 45 }] },
  { id: "ines-carvalho", nome: "Inês Carvalho", categoria: "MPV", trabalhaNoDia: false, viagens: [] },
  { id: "bruno-teixeira", nome: "Bruno Teixeira", categoria: "MPV", trabalhaNoDia: true, turnoInicio: "12:00", turnoFim: "23:59",
    viagens: [{ hora: "14:20", duracaoMin: 60 }] },
];

/** Viagens inventadas usadas nos pedidos recebidos de exemplo. */
export const RESUMOS_INVENTADOS: Record<string, ResumoViagemAjuda> = {
  "demo-101": { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", origem: "Aeroporto de Lisboa", destino: "Hotel Jardim do Rio", valor: 35 },
  "demo-102": { rotulo: "PARTIDA · Sedan", data: "24/11/2026", hora: "10:15", origem: "Hotel Colina Azul", destino: "Aeroporto de Lisboa", valor: 28 },
  "demo-103": { rotulo: "TRANSFER · Business", data: "24/11/2026", hora: "21:00", origem: "Cascais", destino: "Sintra", valor: 0 },
};

type Registo = PedidoAjuda & { resumo: ResumoViagemAjuda };

const pedidos = new Map<string, Registo>();
const ouvintes = new Set<() => void>();
let seq = 0;
let relogio: () => number = () => Date.now();

function avisar() { ouvintes.forEach((f) => { try { f(); } catch { /* */ } }); }
function agoraISO() { return new Date(relogio()).toISOString(); }
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));
function copia<T>(x: T): T { return JSON.parse(JSON.stringify(x)) as T; }
function nomeDe(id: string): string {
  return MOTORISTAS_INVENTADOS.find((m) => m.id === id)?.nome ?? id;
}
function semResumo(r: Registo): PedidoAjuda {
  const { resumo, ...p } = r; void resumo; return copia(p);
}
function paraRecebido(r: Registo): PedidoRecebido {
  return copia({
    id: r.id, tipo: r.tipo, de: r.de, viagem: r.resumo, estado: r.estado,
    criadoEm: r.criadoEm, ...(r.expiraEm ? { expiraEm: r.expiraEm } : {}),
    ...(r.ficouCom ? { ficouCom: r.ficouCom } : {}),
  });
}
/** O pedido activo (o último que não foi cancelado) de uma viagem. */
function ultimoDaViagem(viagemRef: string): Registo | undefined {
  let ult: Registo | undefined;
  pedidos.forEach((p) => { if (p.viagemRef === viagemRef && (!ult || p.criadoEm >= ult.criadoEm)) ult = p; });
  return ult;
}

/** O cliente simulado — mesma interface que o cliente real terá. */
export const clienteSimulado: ClienteAjuda = {
  async colegas(v: ViagemParaAjuda, quem: MotoristaRef): Promise<RespostaColegas> {
    await espera(500);
    if (v.viagemRef.includes("sem-colegas")) return { viagemRef: v.viagemRef, resumo: v.resumo, colegas: [] };
    if (v.viagemRef.includes("erro")) throw new Error("simulado: sem ligação");
    // Recusas anteriores tiram o colega da lista (não se volta a pedir a quem disse que não)
    const recusaram = new Set<string>();
    pedidos.forEach((p) => { if (p.viagemRef === v.viagemRef && p.estado === "recusado" && p.para) recusaram.add(p.para.id); });
    const lista = colegasPossiveis(
      { hora: v.resumo.hora, categoria: v.categoria, duracaoMin: v.duracaoMin },
      MOTORISTAS_INVENTADOS, quem.id,
    ).filter((c) => !recusaram.has(c.id));
    return { viagemRef: v.viagemRef, resumo: v.resumo, colegas: lista };
  },

  async pedirAColega(p: PedirAColega, resumo: ResumoViagemAjuda, deNome: string): Promise<PedidoAjuda> {
    await espera();
    const criadoEm = agoraISO();
    const r: Registo = {
      id: `aj-${++seq}`, viagemRef: p.viagemRef, tipo: "colega",
      de: { id: p.de, nome: deNome }, para: { id: p.para, nome: nomeDe(p.para) },
      estado: "a_espera", criadoEm, expiraEm: prazoDoPedido(criadoEm), resumo,
    };
    pedidos.set(r.id, r); avisar();
    return semResumo(r);
  },

  async pedirAoGrupo(p: PedirAoGrupo, resumo: ResumoViagemAjuda, deNome: string): Promise<PedidoAjuda> {
    await espera();
    const r: Registo = {
      id: `aj-${++seq}`, viagemRef: p.viagemRef, tipo: "grupo",
      de: { id: p.de, nome: deNome }, estado: "a_espera", criadoEm: agoraISO(), resumo,
    };
    pedidos.set(r.id, r); avisar();
    return semResumo(r);
  },

  async cancelar(p: CancelarPedido): Promise<PedidoAjuda> {
    await espera();
    const r = pedidos.get(p.pedidoId);
    if (!r || r.de.id !== p.de) throw new Error("simulado: pedido não encontrado");
    if (r.estado === "a_espera") { r.estado = "cancelado"; r.respondidoEm = agoraISO(); }
    avisar();
    return semResumo(r);
  },

  async pedidoDaViagem(viagemRef: string): Promise<PedidoAjuda | null> {
    const r = ultimoDaViagem(viagemRef);
    return r ? semResumo(r) : null;
  },

  async meusPedidos(motoristaId: string): Promise<PedidoAjuda[]> {
    const refs = new Set<string>();
    pedidos.forEach((p) => { if (p.de.id === motoristaId) refs.add(p.viagemRef); });
    return [...refs].map((ref) => semResumo(ultimoDaViagem(ref)!));
  },

  async recebidos(motoristaId: string): Promise<PedidoRecebido[]> {
    const out: PedidoRecebido[] = [];
    pedidos.forEach((r) => {
      if (r.de.id === motoristaId) return;
      if (r.estado === "cancelado") return;
      if (r.tipo === "colega" && r.para?.id !== motoristaId) return;
      out.push(paraRecebido(r));
    });
    return out;
  },

  async responder(p: ResponderPedido): Promise<RespostaResponder> {
    await espera();
    const r = pedidos.get(p.pedidoId);
    if (!r) throw new Error("simulado: pedido não encontrado");
    const estado = estadoEfectivo(r, relogio());
    if (r.estado === "cancelado") return { ok: false, motivo: "cancelado", pedido: paraRecebido(r) };
    if (r.ficouCom) return { ok: false, motivo: "ja_ficou", pedido: paraRecebido(r) };
    if (estado === "sem_resposta") {
      // Fora de prazo mas ainda ninguém pediu a outro: a resposta conta na mesma.
      // DÚVIDA PARA O JUNIOR: aceitar fora dos 15 min, ou fechar o pedido?
    }
    const quem = { id: p.motorista, nome: nomeDe(p.motorista) };
    if (p.resposta === "sim") {
      r.estado = "aceite"; r.ficouCom = quem;
    } else if (r.tipo === "colega") {
      r.estado = "recusado";
    }
    r.respondidoEm = agoraISO();
    avisar();
    return { ok: true, pedido: paraRecebido(r) };
  },

  aoMudar(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f); }; },
};

// ── Só para a página de demonstração (dev): mexer no «outro lado» ──

export const simular = {
  /** Põe o relógio do simulado a andar n minutos à frente (para os 15 min). */
  avancarMinutos(n: number) {
    const base = relogio; relogio = () => base() + n * 60000; avisar();
  },
  agora(): number { return relogio(); },
  /** O colega do pedido activo desta viagem responde. */
  respostaDoColega(viagemRef: string, resposta: "sim" | "nao") {
    const r = ultimoDaViagem(viagemRef);
    if (!r || r.estado !== "a_espera") return;
    const id = r.tipo === "colega" ? r.para!.id : "ana-ferreira";
    void clienteSimulado.responder({ pedidoId: r.id, motorista: id, resposta });
  },
  /** Cria um pedido recebido por `paraId` (ou pelo grupo, sem `paraId`). */
  receber(viagemRef: string, deId: string, paraId?: string, minutosAtras = 2): string {
    const resumo = RESUMOS_INVENTADOS[viagemRef];
    const criadoEm = new Date(relogio() - minutosAtras * 60000).toISOString();
    const r: Registo = {
      id: `aj-${++seq}`, viagemRef, tipo: paraId ? "colega" : "grupo",
      de: { id: deId, nome: nomeDe(deId) },
      ...(paraId ? { para: { id: paraId, nome: nomeDe(paraId) }, expiraEm: prazoDoPedido(criadoEm) } : {}),
      estado: "a_espera", criadoEm, resumo,
    };
    pedidos.set(r.id, r); avisar();
    return r.id;
  },
  /** No pedido ao grupo, outro colega foi mais rápido. */
  outroFicou(pedidoId: string, quemId: string) {
    const r = pedidos.get(pedidoId);
    if (!r) return;
    r.estado = "aceite"; r.ficouCom = { id: quemId, nome: nomeDe(quemId) }; r.respondidoEm = agoraISO(); avisar();
  },
  /** Regista já uma recusa (para a lista deixar de mostrar esse colega). */
  registarRecusa(viagemRef: string, deId: string, paraId: string) {
    const criadoEm = agoraISO();
    const r: Registo = {
      id: `aj-${++seq}`, viagemRef, tipo: "colega",
      de: { id: deId, nome: nomeDe(deId) }, para: { id: paraId, nome: nomeDe(paraId) },
      estado: "recusado", criadoEm, expiraEm: prazoDoPedido(criadoEm), respondidoEm: criadoEm,
      resumo: RESUMOS_INVENTADOS["demo-101"],
    };
    pedidos.set(r.id, r); avisar();
  },
  limpar() { pedidos.clear(); relogio = () => Date.now(); avisar(); },
};
