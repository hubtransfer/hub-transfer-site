// ───────────────────────────────────────────────────────────────
//  ajuda/tipos.ts — «Ajuda»: um motorista pede a um colega (ou ao
//  grupo) que faça uma viagem dele. Pedidos 97 e 98 do Junior, 23/11/2026.
//
//  Estes são os dados que a app vai PEDIR AO HUB-CENTRAL. Por agora
//  quem responde é src/lib/ajuda/simulado.ts (dados inventados);
//  o sítio onde se liga ao backend é src/lib/ajuda/cliente.ts.
//
//  Regra de ouro: nada do que um COLEGA recebe leva a operadora, o
//  código dela, a referência da reserva, o nome ou o telefone do
//  cliente, nem o motivo do pedido. O motorista identifica a viagem
//  pelo rótulo do cartão («CHEGADA · MPV»), o dia, a hora, o voo e o
//  «de onde → para onde».
//
//  Ninguém vê a agenda dos outros: a lista de colegas leva só o nome
//  e a categoria do carro (sem horas, sem quem não pode, sem contagens).
// ───────────────────────────────────────────────────────────────

/** Categorias de carro que o motorista vê (iguais a CATEGORIAS_VISIVEIS). */
export type CategoriaCarro = "Sedan" | "MPV" | "Business" | "Luxo";

/** Um motorista como os colegas o vêem: só o nome. */
export interface MotoristaRef {
  /** chave estável do motorista no HUB-Central (ex.: a chaveMotorista do nome) */
  id: string;
  nome: string;
}

/**
 * A referência da viagem para o HUB-Central: o ID DA VIAGEM (coluna A da
 * Central), nunca o número da linha — as linhas mudam de lugar.
 * ATENÇÃO: o ID da coluna A pode trazer a referência da reserva
 * («TLX-…», «WT-…»), por isso NUNCA se mostra e NUNCA vai num link.
 * Os links usam só o id do pedido (PedidoId), que é opaco.
 */
export type ViagemId = string;

/**
 * O id de um pedido de ajuda: OPACO e aleatório, gerado pelo HUB-Central
 * (ex.: «aj7Kq2mX9p»). Nunca derivado do ID da viagem, da linha, da
 * operadora ou do motorista — é ele que vai nos links do WhatsApp.
 */
export type PedidoId = string;

/**
 * O resumo da viagem que aparece nos ecrãs da ajuda — dos dois lados.
 * NÃO tem: operadora, referência, ID da viagem, cliente, telefone, motivo.
 */
export interface ResumoViagemAjuda {
  /** rótulo do cartão do motorista: «CHEGADA · MPV», «PARTIDA · Sedan» */
  rotulo: string;
  /** DD/MM/AAAA */
  data: string;
  /** HH:MM — a hora da recolha */
  hora: string;
  /** número do voo («TP1352»), se houver; vazio = sem voo */
  voo?: string;
  /** nome curto do sítio de recolha («Aeroporto de Lisboa») */
  origem: string;
  /** nome curto do destino («Hotel Avenida») */
  destino: string;
  /** valor ao motorista em euros, só se o cartão o mostra (0 = não mostrar) */
  valor: number;
}

// ── O motivo (só a gestão o vê) ─────────────────────────────────

/** Um toque obrigatório antes de enviar. Os colegas NUNCA o vêem. */
export type MotivoAjuda = "doente" | "carro_avariado" | "atrasado" | "outro";

// ── 1. Colegas possíveis de uma viagem ──────────────────────────

/**
 * GET ?action=ajudaColegas&viagem=<ViagemId>&motorista=<quem pede>
 * Um colega que PODE fazer a viagem: trabalha nesse dia, tem um carro
 * igual ou maior (regra em CARROS_QUE_SERVEM) e está livre à hora.
 * Só o nome e a categoria: sem «livre até», sem «próxima viagem».
 * O backend já filtra; a app volta a filtrar a categoria por segurança.
 */
export interface ColegaPossivel extends MotoristaRef {
  categoria: CategoriaCarro;
}

/** Resposta do backend à lista de colegas. */
export interface RespostaColegas {
  viagemRef: ViagemId;          // nunca se mostra
  resumo: ResumoViagemAjuda;
  colegas: ColegaPossivel[];
}

/**
 * O que o BACKEND sabe de cada motorista num dia — é daqui que sai a
 * lista de colegas possíveis (a regra está em colegasPossiveis()).
 * Nunca vai para a app de outro motorista.
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

/** POST ?action=ajudaPedir  { viagemRef, de, para, motivo } */
export interface PedirAColega {
  viagemRef: ViagemId;
  de: string;    // id de quem pede
  para: string;  // id do colega escolhido
  motivo: MotivoAjuda;
}

/** POST ?action=ajudaPedirGrupo  { viagemRef, de, motivo } */
export interface PedirAoGrupo {
  viagemRef: ViagemId;
  de: string;
  motivo: MotivoAjuda;
}

/** POST ?action=ajudaCancelar  { pedidoId, de } — só quem pediu cancela */
export interface CancelarPedido {
  pedidoId: PedidoId;
  de: string;
}

// ── 3. O estado do pedido ───────────────────────────────────────

/**
 * a_espera      — enviado, ainda sem resposta (a viagem continua com quem pediu)
 * reservada     — SÓ NO GRUPO: alguém carregou «Aceitar»; recebeu a mensagem
 *                 privada e tem 10 minutos para a segunda confirmação. A viagem
 *                 continua com quem pediu. Se o prazo acabar, volta a «a_espera».
 * aceite        — a viagem passou de mãos (colega: «Sim, faço» confirmado;
 *                 grupo: a segunda confirmação feita)
 * recusado      — o colega disse «Não posso» (no grupo não há recusa)
 * sem_resposta  — pedido a um colega: 15 minutos sem resposta
 * cancelado     — quem pediu cancelou
 */
export type EstadoPedido = "a_espera" | "reservada" | "aceite" | "recusado" | "sem_resposta" | "cancelado";

export type TipoPedido = "colega" | "grupo";

/**
 * O pedido como QUEM PEDIU o vê (e a gestão).
 * GET ?action=ajudaPedido&viagem=<ViagemId>   → o pedido em curso de uma viagem
 * GET ?action=ajudaMeusPedidos&motorista=<id> → PedidoAjuda[] (o último de cada
 * viagem de quem pede — é com isto que o cartão mostra «À espera de …»).
 * Também é a resposta de pedir / pedir ao grupo / cancelar.
 */
export interface PedidoAjuda {
  id: PedidoId;
  viagemRef: ViagemId;
  tipo: TipoPedido;
  de: MotoristaRef;
  /** só no pedido a um colega */
  para?: MotoristaRef;
  /** o motivo — quem pediu e a gestão; NUNCA vai para os colegas */
  motivo: MotivoAjuda;
  estado: EstadoPedido;
  /** ISO — quando foi pedido */
  criadoEm: string;
  /** ISO — criadoEm + 15 min (pedido a um colega) */
  expiraEm?: string;
  /** ISO — quando houve resposta */
  respondidoEm?: string;
  /** grupo, estado «reservada»: quem aceitou e até quando tem para confirmar */
  reservadaPara?: MotoristaRef;
  /** ISO — momento do «Aceitar» + 10 min */
  reservaExpiraEm?: string;
  /** quem ficou com a viagem (estado «aceite») */
  ficouCom?: MotoristaRef;
}

// ── 4. Os pedidos que um motorista recebeu ──────────────────────

/**
 * GET ?action=ajudaRecebidos&motorista=<id>      → PedidoRecebido[]
 * GET ?action=ajudaRecebido&pedido=<PedidoId>&motorista=<id> → PedidoRecebido
 *     (a entrada pelo link do WhatsApp; o motorista é o da sessão/crachá)
 *
 * Antes de ficar com a viagem, o colega NÃO vê o nome nem o telefone do
 * cliente, nem o motivo: este tipo nem os tem. Depois, a viagem aparece-lhe
 * na lista normal (getViagens), com tudo.
 */
export interface PedidoRecebido {
  id: PedidoId;
  tipo: TipoPedido;
  de: MotoristaRef;
  viagem: ResumoViagemAjuda;
  estado: EstadoPedido;
  criadoEm: string;
  expiraEm?: string;
  /** grupo: reservada para este motorista? (o backend só diz «para si» ou nada) */
  reservadaParaMim?: boolean;
  /** ISO — fim do prazo da segunda confirmação, quando reservadaParaMim */
  reservaExpiraEm?: string;
  /** alguém já ficou com a viagem */
  ficouCom?: MotoristaRef;
}

/**
 * POST ?action=ajudaResponder  { pedidoId, motorista, resposta }
 * Pedido a um colega: «Sim, faço» → "sim" (já confirmado a deslizar); «Não posso» → "nao".
 * Pedido ao grupo: só «Aceitar» → "sim". Fica reservada para quem chegou
 * primeiro e o HUB-Central manda-lhe a mensagem privada da segunda confirmação.
 */
export interface ResponderPedido {
  pedidoId: PedidoId;
  motorista: string;
  resposta: "sim" | "nao";
}

/**
 * POST ?action=ajudaConfirmar  { pedidoId, motorista }
 * A segunda confirmação (grupo), pelo link da mensagem privada:
 * «Confirmo que faço esta viagem». Só aqui a viagem muda de mãos.
 */
export interface ConfirmarReserva {
  pedidoId: PedidoId;
  motorista: string;
}

/**
 * Resposta do backend a responder / confirmar.
 * ja_ficou  — outro colega foi mais rápido (ou já confirmou)
 * reservada — no grupo, outro colega está a confirmar
 * expirou   — o prazo (15 min do colega, ou 10 min da reserva) acabou
 * cancelado — quem pediu cancelou
 */
export interface RespostaResponder {
  ok: boolean;
  motivo?: "ja_ficou" | "reservada" | "cancelado" | "expirou";
  pedido: PedidoRecebido;
}
