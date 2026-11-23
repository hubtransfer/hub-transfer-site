// ───────────────────────────────────────────────────────────────
//  ajuda/tipos.ts — «Ajuda»: um motorista pede a um colega (ou ao
//  grupo) que faça uma viagem dele. Pedido do Junior, 23/11/2026.
//
//  Estes são os dados que a app vai PEDIR AO HUB-CENTRAL. Por agora
//  quem responde é src/lib/ajuda/simulado.ts (dados inventados);
//  o sítio onde se liga ao backend é src/lib/ajuda/cliente.ts.
//
//  Regra de ouro: nada aqui leva a operadora, o código dela, a
//  referência da reserva, nem o nome ou o telefone do cliente.
//  O motorista identifica a viagem pelo rótulo do cartão
//  («CHEGADA · MPV»), a hora e o «de onde → para onde».
// ───────────────────────────────────────────────────────────────

/** Categorias de carro que o motorista vê (iguais a CATEGORIAS_VISIVEIS). */
export type CategoriaCarro = "Sedan" | "MPV" | "Business" | "Luxo";

/** Um motorista como os colegas o vêem: só o nome e o carro. */
export interface MotoristaRef {
  /** chave estável do motorista no HUB-Central (ex.: a chaveMotorista do nome) */
  id: string;
  nome: string;
}

/**
 * O resumo da viagem que aparece nos ecrãs da ajuda — dos dois lados.
 * NÃO tem: operadora, referência, id da reserva, cliente, telefone.
 */
export interface ResumoViagemAjuda {
  /** rótulo do cartão do motorista: «CHEGADA · MPV», «PARTIDA · Sedan» */
  rotulo: string;
  /** DD/MM/AAAA */
  data: string;
  /** HH:MM — a hora da recolha */
  hora: string;
  /** nome curto do sítio de recolha («Aeroporto de Lisboa») */
  origem: string;
  /** nome curto do destino («Hotel Avenida») */
  destino: string;
  /** valor ao motorista em euros, só se o cartão o mostra (0 = não mostrar) */
  valor: number;
}

// ── 1. Colegas possíveis de uma viagem ──────────────────────────

/**
 * GET ?action=ajudaColegas&viagem=<rowIndex>&motorista=<quem pede>
 * Um colega que PODE fazer a viagem: trabalha nesse dia, tem a
 * categoria certa e está livre à hora. O backend já filtra; a app
 * volta a filtrar com colegasPossiveis() por segurança.
 */
export interface ColegaPossivel extends MotoristaRef {
  categoria: CategoriaCarro;
  /** HH:MM — até quando está livre depois desta viagem (fim do turno ou próxima viagem) */
  livreAte?: string;
  /** HH:MM — hora da próxima viagem dele nesse dia, se tiver */
  proximaViagem?: string;
}

/** Resposta do backend à lista de colegas. */
export interface RespostaColegas {
  viagemRef: string;            // identificador interno (rowIndex) — nunca se mostra
  resumo: ResumoViagemAjuda;
  colegas: ColegaPossivel[];
}

/**
 * O que o backend sabe de cada motorista num dia — é daqui que sai a
 * lista de colegas possíveis (a regra está em colegasPossiveis()).
 */
export interface MotoristaNoDia extends MotoristaRef {
  categoria: CategoriaCarro;
  trabalhaNoDia: boolean;
  /** HH:MM — início e fim do turno (opcionais: sem turno = dia inteiro) */
  turnoInicio?: string;
  turnoFim?: string;
  /** viagens já atribuídas nesse dia: hora de recolha e duração prevista (min) */
  viagens: { hora: string; duracaoMin: number }[];
}

// ── 2. Pedir, pedir ao grupo, cancelar ──────────────────────────

/** POST ?action=ajudaPedir  { viagemRef, de, para } */
export interface PedirAColega {
  viagemRef: string;
  de: string;    // id de quem pede
  para: string;  // id do colega escolhido
}

/** POST ?action=ajudaPedirGrupo  { viagemRef, de } */
export interface PedirAoGrupo {
  viagemRef: string;
  de: string;
}

/** POST ?action=ajudaCancelar  { pedidoId, de } — só quem pediu cancela */
export interface CancelarPedido {
  pedidoId: string;
  de: string;
}

// ── 3. O estado do pedido ───────────────────────────────────────

/**
 * a_espera      — enviado, ainda sem resposta (a viagem continua com quem pediu)
 * aceite        — o colega aceitou: a viagem passou para ele
 * recusado      — o colega disse «Não posso»
 * sem_resposta  — passaram 15 minutos sem resposta (quem pediu é avisado)
 * cancelado     — quem pediu cancelou
 */
export type EstadoPedido = "a_espera" | "aceite" | "recusado" | "sem_resposta" | "cancelado";

export type TipoPedido = "colega" | "grupo";

/**
 * GET ?action=ajudaPedido&viagem=<rowIndex>  → o pedido em curso de uma viagem
 * (o que quem pediu vê). Também é a resposta de pedir/pedir ao grupo/cancelar.
 */
export interface PedidoAjuda {
  id: string;
  viagemRef: string;
  tipo: TipoPedido;
  de: MotoristaRef;
  /** só no pedido a um colega */
  para?: MotoristaRef;
  estado: EstadoPedido;
  /** ISO — quando foi pedido */
  criadoEm: string;
  /** ISO — criadoEm + 15 min (pedido a um colega) */
  expiraEm?: string;
  /** ISO — quando houve resposta */
  respondidoEm?: string;
  /** quem ficou com a viagem (aceite; no grupo, o primeiro «Fico eu») */
  ficouCom?: MotoristaRef;
}

// ── 4. Os pedidos que um motorista recebeu ──────────────────────

/**
 * GET ?action=ajudaRecebidos&motorista=<id>
 * Antes de aceitar, o colega NÃO vê o nome nem o telefone do cliente:
 * este tipo nem os tem. Depois de aceitar, a viagem aparece-lhe na
 * lista normal (getViagens), com tudo.
 */
export interface PedidoRecebido {
  id: string;
  tipo: TipoPedido;
  de: MotoristaRef;
  viagem: ResumoViagemAjuda;
  estado: EstadoPedido;
  criadoEm: string;
  expiraEm?: string;
  /** no pedido ao grupo: alguém já ficou com a viagem */
  ficouCom?: MotoristaRef;
}

/** POST ?action=ajudaResponder  { pedidoId, motorista, resposta } */
export interface ResponderPedido {
  pedidoId: string;
  motorista: string;
  /** «Sim, faço» / «Fico eu» → "sim"; «Não posso» → "nao" */
  resposta: "sim" | "nao";
}

/** Resposta do backend ao responder. «ja_ficou» = no grupo, outro foi mais rápido. */
export interface RespostaResponder {
  ok: boolean;
  motivo?: "ja_ficou" | "cancelado" | "expirou";
  pedido: PedidoRecebido;
}
