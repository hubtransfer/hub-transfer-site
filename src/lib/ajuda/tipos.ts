// ───────────────────────────────────────────────────────────────
//  ajuda/tipos.ts — «Ajuda»: um motorista pede a um colega (ou ao
//  grupo) que faça uma viagem dele. Pedidos 97 e 98 do Junior, 23/11/2026.
//
//  Estes são os dados que a app pede ao HUB-CENTRAL (AJUDA_MOTORISTAS.js),
//  pelo cliente de src/lib/ajuda/hubCentral.ts. O simulado (dados
//  inventados) só serve a página de demonstração.
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
 * GET ?action=ajudaColegas&viagemRef=<ViagemId>&cracha=… (quem pede é o do crachá)
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

// Quem pede, responde ou confirma é SEMPRE o motorista do crachá: nenhum
// pedido leva «de» nem «motorista» (o HUB-Central recusa-os se não forem do crachá).

/** POST action=ajudaPedir  { viagemRef, para, motivo, cracha } */
export interface PedirAColega {
  viagemRef: ViagemId;
  para: string;  // id (chave do nome) do colega escolhido
  motivo: MotivoAjuda;
}

/** POST action=ajudaPedirGrupo  { viagemRef, motivo, cracha } */
export interface PedirAoGrupo {
  viagemRef: ViagemId;
  motivo: MotivoAjuda;
}

/** POST action=ajudaCancelar  { pedidoId, cracha } — só quem pediu cancela */
export interface CancelarPedido {
  pedidoId: PedidoId;
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
 * GET ?action=ajudaMeusPedidos&cracha=… → PedidoAjuda[] (o último de cada
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
 * GET ?action=ajudaRecebidos&cracha=…      → PedidoRecebido[]
 * GET ?action=ajudaRecebido&pedido=<PedidoId>&cracha=… → RespostaRecebido
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
 * POST action=ajudaResponder  { pedidoId, resposta, cracha }
 * Pedido a um colega: «Sim, faço» → "sim" (já confirmado a deslizar); «Não posso» → "nao".
 * Pedido ao grupo: só «Aceitar» → "sim". Fica reservada para quem chegou
 * primeiro e o HUB-Central manda-lhe a mensagem privada da segunda confirmação.
 */
export interface ResponderPedido {
  pedidoId: PedidoId;
  resposta: "sim" | "nao";
  /** 24/11: o motorista viu o aviso vermelho e aceita mesmo assim («Aceitar mesmo assim») */
  avisoVisto?: boolean;
}

// ── O aviso do tempo (24/11) ────────────────────────────────────

/**
 * O tempo já não impede ninguém de aceitar: o HUB-Central faz as contas
 * com as outras viagens de quem vai aceitar e avisa.
 *   verde    — folga boa: não se mostra nada (vem sem texto);
 *   amarelo  — apertado ou atraso pequeno: o texto numa caixa amarela;
 *   vermelho — atraso grande: caixa vermelha e «Aceitar mesmo assim»,
 *              que repete o ajudaResponder com avisoVisto: true.
 * Vem no ajudaRecebido (a entrada pelo link) e no ajudaResponder.
 */
export type CorAviso = "verde" | "amarelo" | "vermelho";

export interface AvisoTempo {
  cor: CorAviso;
  /** o número do texto, arredondado a 5 */
  minutos: number;
  atraso: boolean;
  folga: number;
  conta: "anterior" | "seguinte" | "";
  /** os minutos de atraso a partir dos quais é vermelho */
  limite: number;
  /** vazio no verde */
  texto: string;
}

/**
 * POST action=ajudaConfirmar  { pedidoId, cracha }
 * A segunda confirmação (grupo), pelo link da mensagem privada:
 * «Confirmo que faço esta viagem». Só aqui a viagem muda de mãos.
 */
export interface ConfirmarReserva {
  pedidoId: PedidoId;
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
  /** aviso (24/11): vermelho sem o sinal — nada mudou; mostra-se o aviso e o «Aceitar mesmo assim» */
  motivo?: "ja_ficou" | "reservada" | "cancelado" | "expirou" | "aviso";
  /** no motivo «aviso» pode não vir */
  pedido?: PedidoRecebido;
  /** o aviso do tempo (no ok, se o backend o mandou; no motivo «aviso», sempre vermelho) */
  aviso?: AvisoTempo;
}

/**
 * GET action=ajudaRecebido&pedido=<PedidoId>&cracha=… — a entrada pelo link.
 * pedido null = não existe ou não é para este motorista. No grupo à espera,
 * o backend diz só a ele se pode aceitar e, se não puder, porquê (razao).
 */
export interface RespostaRecebido {
  pedido: PedidoRecebido | null;
  podeAceitar?: boolean;
  razao?: string;
  /** 24/11: o aviso do tempo para este motorista (só quando pode aceitar) */
  aviso?: AvisoTempo;
}

// ── 5. O cliente: o que a app pede ao HUB-Central ───────────────

/** O que a app sabe da viagem quando pede a lista de colegas. */
export interface ViagemParaAjuda {
  /** ID da viagem (coluna A da Central), NÃO o rowIndex — nunca se mostra nem vai em links */
  viagemRef: string;
  /** categoriaNome do cartão («MPV»); vazio = qualquer carro */
  categoria: string;
  duracaoMin?: number;
  resumo: ResumoViagemAjuda;
}

/**
 * As acções da ajuda. Nenhuma leva quem é o motorista: é o crachá da sessão
 * que o diz ao HUB-Central. O verdadeiro está em hubCentral.ts; o simulado
 * (dados inventados) só na página de demonstração.
 * Um erro do backend chega como AjudaErro (hubCentral.ts) com o texto dele.
 */
export interface ClienteAjuda {
  colegas(v: ViagemParaAjuda): Promise<RespostaColegas>;
  pedirAColega(p: PedirAColega, resumo: ResumoViagemAjuda): Promise<PedidoAjuda>;
  pedirAoGrupo(p: PedirAoGrupo, resumo: ResumoViagemAjuda): Promise<PedidoAjuda>;
  cancelar(p: CancelarPedido): Promise<PedidoAjuda>;
  /** o último pedido de cada viagem minha (dos últimos dias) */
  meusPedidos(): Promise<PedidoAjuda[]>;
  /** os pedidos que me chegaram */
  recebidos(): Promise<PedidoRecebido[]>;
  /** a entrada pelo link do WhatsApp */
  recebido(pedidoId: PedidoId): Promise<RespostaRecebido>;
  /** ja_ficou / reservada / cancelado / expirou / aviso voltam como { ok: false, motivo }; os outros erros são AjudaErro */
  responder(p: ResponderPedido): Promise<RespostaResponder>;
  /** a segunda confirmação do grupo (mesmas regras do responder) */
  confirmar(p: ConfirmarReserva): Promise<RespostaResponder>;
  /** só o simulado: avisa logo quando algo muda */
  aoMudar?(f: () => void): () => void;
}
