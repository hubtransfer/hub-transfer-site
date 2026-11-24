// ───────────────────────────────────────────────────────────────
//  ajuda/simulado.ts — FAZ DE HUB-CENTRAL, com dados inventados.
//  Nomes, viagens, horas e valores são todos inventados. Nada aqui
//  chama o Apps Script, a Z-API nem outro serviço: vive na memória
//  do browser e desaparece ao recarregar a página.
//
//  SÓ para a página de demonstração (dev), pelo AjudaClienteContexto.
//  A app verdadeira usa o cliente do HUB-Central (hubCentral.ts).
//  Aqui, ao contrário do backend, o «motorista» vai nos pedidos: o
//  simulado não tem crachá. clienteSimuladoPara(eu) esconde-o da app.
// ───────────────────────────────────────────────────────────────
import type {
  CancelarPedido as CancelarSemQuem,
  ClienteAjuda,
  ConfirmarReserva as ConfirmarSemQuem,
  MotoristaNoDia,
  MotoristaRef,
  PedidoAjuda,
  PedidoRecebido,
  PedirAColega as PedirAColegaSemQuem,
  PedirAoGrupo as PedirAoGrupoSemQuem,
  ResponderPedido as ResponderSemQuem,
  RespostaColegas,
  RespostaResponder,
  ResumoViagemAjuda,
  ViagemParaAjuda,
} from "./tipos";
import { colegasPossiveis, prazoDoPedido, prazoDaReserva, estadoEfectivo, motivoValido } from "./regras";

// Os pedidos do simulado levam quem pede / responde (o simulado não tem crachá)
type PedirAColega = PedirAColegaSemQuem & { de: string };
type PedirAoGrupo = PedirAoGrupoSemQuem & { de: string };
type CancelarPedido = CancelarSemQuem & { de: string };
type ResponderPedido = ResponderSemQuem & { motorista: string };
type ConfirmarReserva = ConfirmarSemQuem & { motorista: string };

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
  { id: "sofia-ramos", nome: "Sofia Ramos", categoria: "Business", trabalhaNoDia: true, turnoInicio: "06:00", turnoFim: "22:00",
    viagens: [] },
  { id: "bruno-teixeira", nome: "Bruno Teixeira", categoria: "MPV", trabalhaNoDia: true, turnoInicio: "12:00", turnoFim: "23:59",
    viagens: [{ hora: "14:20", duracaoMin: 60 }] },
];

/** Viagens inventadas usadas nos pedidos recebidos de exemplo. */
export const RESUMOS_INVENTADOS: Record<string, ResumoViagemAjuda> = {
  "demo-101": { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", voo: "XZ4821", origem: "Aeroporto de Lisboa", destino: "Hotel Jardim do Rio", valor: 35 },
  "demo-102": { rotulo: "PARTIDA · Sedan", data: "24/11/2026", hora: "10:15", origem: "Hotel Colina Azul", destino: "Aeroporto de Lisboa", valor: 28 },
  "demo-103": { rotulo: "CHEGADA · Sedan", data: "24/11/2026", hora: "21:00", voo: "XZ7310", origem: "Aeroporto de Lisboa", destino: "Hotel Miradouro", valor: 32 },
  "demo-104": { rotulo: "TRANSFER · Business", data: "24/11/2026", hora: "18:00", origem: "Cascais", destino: "Sintra", valor: 0 },
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
/** Id opaco, como o backend o vai gerar: não diz nada da viagem nem da operadora. */
function novoId(): string {
  seq += 1;
  return `aj${seq.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
/** Reserva do grupo que passou dos 10 min: volta ao grupo (o backend faz o mesmo). */
function normalizar(r: Registo) {
  if (r.estado === "reservada" && estadoEfectivo(r, relogio()) === "a_espera") {
    r.estado = "a_espera"; delete r.reservadaPara; delete r.reservaExpiraEm;
  }
}
function semResumo(r: Registo): PedidoAjuda {
  normalizar(r);
  const { resumo, ...p } = r; void resumo; return copia(p);
}
/** O que um colega recebe: sem motivo, sem cliente, sem a identidade de quem reservou. */
function paraRecebido(r: Registo, motoristaId: string): PedidoRecebido {
  normalizar(r);
  const minha = r.estado === "reservada" && r.reservadaPara?.id === motoristaId;
  return copia({
    id: r.id, tipo: r.tipo, de: r.de, viagem: r.resumo, estado: r.estado,
    criadoEm: r.criadoEm, ...(r.expiraEm ? { expiraEm: r.expiraEm } : {}),
    ...(minha ? { reservadaParaMim: true, reservaExpiraEm: r.reservaExpiraEm } : {}),
    ...(r.ficouCom ? { ficouCom: r.ficouCom } : {}),
  });
}
/** O pedido activo (o último) de uma viagem. */
function ultimoDaViagem(viagemRef: string): Registo | undefined {
  let ult: Registo | undefined;
  pedidos.forEach((p) => { if (p.viagemRef === viagemRef && (!ult || p.criadoEm >= ult.criadoEm)) ult = p; });
  return ult;
}

/** O motor do simulado (com ids explícitos). A app usa clienteSimuladoPara(eu). */
export const clienteSimulado = {
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
    if (!motivoValido(p.motivo)) throw new Error("simulado: falta o motivo");
    const criadoEm = agoraISO();
    const r: Registo = {
      id: novoId(), viagemRef: p.viagemRef, tipo: "colega", motivo: p.motivo,
      de: { id: p.de, nome: deNome }, para: { id: p.para, nome: nomeDe(p.para) },
      estado: "a_espera", criadoEm, expiraEm: prazoDoPedido(criadoEm), resumo,
    };
    pedidos.set(r.id, r); avisar();
    return semResumo(r);
  },

  async pedirAoGrupo(p: PedirAoGrupo, resumo: ResumoViagemAjuda, deNome: string): Promise<PedidoAjuda> {
    await espera();
    if (!motivoValido(p.motivo)) throw new Error("simulado: falta o motivo");
    const r: Registo = {
      id: novoId(), viagemRef: p.viagemRef, tipo: "grupo", motivo: p.motivo,
      de: { id: p.de, nome: deNome }, estado: "a_espera", criadoEm: agoraISO(), resumo,
    };
    pedidos.set(r.id, r); avisar();
    return semResumo(r);
  },

  async cancelar(p: CancelarPedido): Promise<PedidoAjuda> {
    await espera();
    const r = pedidos.get(p.pedidoId);
    if (!r || r.de.id !== p.de) throw new Error("simulado: pedido não encontrado");
    normalizar(r);
    if (r.estado === "a_espera" || r.estado === "reservada") {
      r.estado = "cancelado"; r.respondidoEm = agoraISO(); delete r.reservadaPara; delete r.reservaExpiraEm;
    }
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
      out.push(paraRecebido(r, motoristaId));
    });
    return out;
  },

  async recebido(pedidoId: string, motoristaId: string): Promise<PedidoRecebido | null> {
    await espera(300);
    const r = pedidos.get(pedidoId);
    if (!r) return null;
    if (r.tipo === "colega" && r.para?.id !== motoristaId && r.de.id !== motoristaId) return null;
    return paraRecebido(r, motoristaId);
  },

  async responder(p: ResponderPedido): Promise<RespostaResponder> {
    await espera();
    const r = pedidos.get(p.pedidoId);
    if (!r) throw new Error("simulado: pedido não encontrado");
    normalizar(r);
    const out = (ok: boolean, motivo?: RespostaResponder["motivo"]): RespostaResponder =>
      ({ ok, ...(motivo ? { motivo } : {}), pedido: paraRecebido(r, p.motorista) });
    if (r.estado === "cancelado") return out(false, "cancelado");
    if (r.ficouCom) return out(false, "ja_ficou");
    const quem = { id: p.motorista, nome: nomeDe(p.motorista) };

    if (r.tipo === "grupo") {
      // No grupo só há «Aceitar». Fica reservada para o primeiro; o HUB-Central
      // manda-lhe a mensagem privada da segunda confirmação (10 min).
      if (p.resposta !== "sim") return out(true);
      if (r.estado === "reservada") return r.reservadaPara?.id === p.motorista ? out(true) : out(false, "reservada");
      const agora = agoraISO();
      r.estado = "reservada"; r.reservadaPara = quem; r.reservaExpiraEm = prazoDaReserva(agora); r.respondidoEm = agora;
      avisar();
      return out(true);
    }

    // Pedido a um colega: «Sim, faço» (já confirmado a deslizar) ou «Não posso».
    // Fora dos 15 min, enquanto ninguém pediu a outro, a resposta conta na mesma.
    if (p.resposta === "sim") { r.estado = "aceite"; r.ficouCom = quem; }
    else r.estado = "recusado";
    r.respondidoEm = agoraISO();
    avisar();
    return out(true);
  },

  async confirmar(p: ConfirmarReserva): Promise<RespostaResponder> {
    await espera();
    const r = pedidos.get(p.pedidoId);
    if (!r) throw new Error("simulado: pedido não encontrado");
    const caiu = r.estado === "reservada" && estadoEfectivo(r, relogio()) === "a_espera";
    normalizar(r);
    const out = (ok: boolean, motivo?: RespostaResponder["motivo"]): RespostaResponder =>
      ({ ok, ...(motivo ? { motivo } : {}), pedido: paraRecebido(r, p.motorista) });
    if (r.estado === "cancelado") return out(false, "cancelado");
    if (r.ficouCom) return r.ficouCom.id === p.motorista ? out(true) : out(false, "ja_ficou");
    if (caiu || r.estado !== "reservada" || r.reservadaPara?.id !== p.motorista) {
      avisar();
      return out(false, r.estado === "reservada" ? "reservada" : "expirou");
    }
    r.estado = "aceite"; r.ficouCom = r.reservadaPara; r.respondidoEm = agoraISO();
    delete r.reservaExpiraEm;
    avisar();
    return out(true);
  },

  aoMudar(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f); }; },
};

/** O simulado com a interface da app (ClienteAjuda), como se `eu` estivesse no crachá. */
export function clienteSimuladoPara(eu: MotoristaRef): ClienteAjuda {
  const m = clienteSimulado;
  return {
    colegas: (v) => m.colegas(v, eu),
    pedirAColega: (p, resumo) => m.pedirAColega({ ...p, de: eu.id }, resumo, eu.nome),
    pedirAoGrupo: (p, resumo) => m.pedirAoGrupo({ ...p, de: eu.id }, resumo, eu.nome),
    cancelar: (p) => m.cancelar({ ...p, de: eu.id }),
    meusPedidos: () => m.meusPedidos(eu.id),
    recebidos: () => m.recebidos(eu.id),
    recebido: async (id) => ({ pedido: await m.recebido(id, eu.id) }),
    responder: (p) => m.responder({ ...p, motorista: eu.id }),
    confirmar: (p) => m.confirmar({ ...p, motorista: eu.id }),
    aoMudar: (f) => m.aoMudar(f),
  };
}

// ── Só para a página de demonstração (dev): mexer no «outro lado» ──

export const simular = {
  /** Põe o relógio do simulado a andar n minutos à frente (15 min / 10 min). */
  avancarMinutos(n: number) {
    const base = relogio; relogio = () => base() + n * 60000; avisar();
  },
  agora(): number { return relogio(); },
  /** Fixa o relógio do simulado (para as imagens). */
  fixarRelogio(t: number) { relogio = () => t; avisar(); },
  /** O colega do pedido activo desta viagem responde (no grupo: a Ana aceita e confirma). */
  respostaDoColega(viagemRef: string, resposta: "sim" | "nao") {
    const r = ultimoDaViagem(viagemRef);
    if (!r || r.estado !== "a_espera") return;
    if (r.tipo === "colega") { void clienteSimulado.responder({ pedidoId: r.id, motorista: r.para!.id, resposta }); return; }
    if (resposta === "sim") {
      void clienteSimulado.responder({ pedidoId: r.id, motorista: "ana-ferreira", resposta: "sim" })
        .then(() => clienteSimulado.confirmar({ pedidoId: r.id, motorista: "ana-ferreira" }));
    }
  },
  /** Cria um pedido recebido por `paraId` (ou pelo grupo, sem `paraId`). Devolve o id opaco. */
  receber(viagemRef: string, deId: string, paraId?: string, minutosAtras = 2, id?: string): string {
    const resumo = RESUMOS_INVENTADOS[viagemRef];
    const criadoEm = new Date(relogio() - minutosAtras * 60000).toISOString();
    const r: Registo = {
      id: id ?? novoId(), viagemRef, tipo: paraId ? "colega" : "grupo", motivo: "doente",
      de: { id: deId, nome: nomeDe(deId) },
      ...(paraId ? { para: { id: paraId, nome: nomeDe(paraId) }, expiraEm: prazoDoPedido(criadoEm) } : {}),
      estado: "a_espera", criadoEm, resumo,
    };
    pedidos.set(r.id, r); avisar();
    return r.id;
  },
  /** No grupo: `quemId` carregou «Aceitar» há `minutosAtras` minutos (fica reservada). */
  reservar(pedidoId: string, quemId: string, minutosAtras = 0) {
    const r = pedidos.get(pedidoId);
    if (!r) return;
    const em = new Date(relogio() - minutosAtras * 60000).toISOString();
    r.estado = "reservada"; r.reservadaPara = { id: quemId, nome: nomeDe(quemId) };
    r.reservaExpiraEm = prazoDaReserva(em); r.respondidoEm = em; avisar();
  },
  /** Outro colega ficou com a viagem (já confirmou). */
  outroFicou(pedidoId: string, quemId: string) {
    const r = pedidos.get(pedidoId);
    if (!r) return;
    r.estado = "aceite"; r.ficouCom = { id: quemId, nome: nomeDe(quemId) }; r.respondidoEm = agoraISO();
    delete r.reservadaPara; delete r.reservaExpiraEm; avisar();
  },
  /** Regista já uma recusa (para a lista deixar de mostrar esse colega). */
  registarRecusa(viagemRef: string, deId: string, paraId: string) {
    const criadoEm = agoraISO();
    const r: Registo = {
      id: novoId(), viagemRef, tipo: "colega", motivo: "carro_avariado",
      de: { id: deId, nome: nomeDe(deId) }, para: { id: paraId, nome: nomeDe(paraId) },
      estado: "recusado", criadoEm, expiraEm: prazoDoPedido(criadoEm), respondidoEm: criadoEm,
      resumo: RESUMOS_INVENTADOS["demo-101"],
    };
    pedidos.set(r.id, r); avisar();
  },
  limpar() { pedidos.clear(); relogio = () => Date.now(); avisar(); },
};
