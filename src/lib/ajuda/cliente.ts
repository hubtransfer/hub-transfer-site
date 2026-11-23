// ───────────────────────────────────────────────────────────────
//  ajuda/cliente.ts — o único sítio onde a app fala com quem guarda
//  os pedidos de ajuda. Hoje: o simulado (dados inventados).
//
//  ╔══════════════════════════════════════════════════════════════╗
//  ║  LIGAR AO HUB-CENTRAL AQUI                                     ║
//  ║  1. Escrever `clienteHubCentral: ClienteAjuda` com fetch ao    ║
//  ║     HUB_CENTRAL_URL (actions em src/lib/ajuda/tipos.ts),       ║
//  ║     sempre com crachaParam() como os outros pedidos.           ║
//  ║  2. Trocar `ajuda = clienteSimulado` por `clienteHubCentral`.  ║
//  ║  3. Trocar AJUDA_ACTIVA para `true` quando for para o ar.      ║
//  ╚══════════════════════════════════════════════════════════════╝
// ───────────────────────────────────────────────────────────────
import type {
  CancelarPedido,
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
import { clienteSimulado } from "./simulado";

/** O que a app sabe da viagem quando pede a lista de colegas. */
export interface ViagemParaAjuda {
  /** rowIndex da viagem no HUB-Central — nunca se mostra */
  viagemRef: string;
  /** categoriaNome do cartão («MPV»); vazio = qualquer carro */
  categoria: string;
  duracaoMin?: number;
  resumo: ResumoViagemAjuda;
}

export interface ClienteAjuda {
  colegas(v: ViagemParaAjuda, quem: MotoristaRef): Promise<RespostaColegas>;
  pedirAColega(p: PedirAColega, resumo: ResumoViagemAjuda, deNome: string): Promise<PedidoAjuda>;
  pedirAoGrupo(p: PedirAoGrupo, resumo: ResumoViagemAjuda, deNome: string): Promise<PedidoAjuda>;
  cancelar(p: CancelarPedido): Promise<PedidoAjuda>;
  pedidoDaViagem(viagemRef: string): Promise<PedidoAjuda | null>;
  recebidos(motoristaId: string): Promise<PedidoRecebido[]>;
  responder(p: ResponderPedido): Promise<RespostaResponder>;
  /** opcional: avisar a app quando algo muda (o real faz polling) */
  aoMudar?(f: () => void): () => void;
}

/**
 * A «Ajuda» só aparece fora de produção enquanto os dados forem
 * inventados — assim, mesmo que este ramo vá para o ar por engano,
 * nenhum motorista vê colegas inventados.
 */
export const AJUDA_ACTIVA = process.env.NODE_ENV !== "production";

/** Intervalo do polling dos pedidos (s) — o real; o simulado avisa logo. */
export const AJUDA_POLL_S = 15;

export const ajuda: ClienteAjuda = clienteSimulado;
