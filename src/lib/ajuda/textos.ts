// ───────────────────────────────────────────────────────────────
//  ajuda/textos.ts — TODOS os textos dos ecrãs da «Ajuda» passam
//  por aqui, para os testes confirmarem que nenhum mostra a operadora,
//  o código dela ou a referência da reserva (tests/ajuda.test.mjs).
//  Sem «ele/ela»: a app não sabe o género de quem está do outro lado.
//  Tom: o do cartão do motorista («consigo», «Deslize»).
// ───────────────────────────────────────────────────────────────
import type { ColegaPossivel, MotivoAjuda, PedidoAjuda, PedidoRecebido, ResumoViagemAjuda } from "./tipos";

export const T = {
  botao: "Ajuda",
  titulo: "Pedir ajuda",
  // as duas escolhas no topo
  escolhaTitulo: "Quem pode ficar com esta viagem?",
  pedirColega: "Pedir a um colega",
  pedirColegaDica: "Escolhe um colega livre, com o carro certo",
  pedirGrupo: "Pedir ao grupo",
  pedirGrupoDica: "Fica com quem aceitar primeiro e confirmar",
  // a lista
  subtitulo: "Colegas que podem fazer esta viagem",
  aCarregar: "A procurar colegas…",
  erro: "Não foi possível ver os colegas. Tente outra vez.",
  tentar: "Tentar outra vez",
  nenhum: "Nenhum colega pode fazer esta viagem.",
  nenhumDica: "Peça ao grupo: fica com quem aceitar primeiro.",
  // o motivo
  motivoTitulo: "Porque precisa de ajuda?",
  motivoDica: "Só a gestão vê o motivo. Os colegas não.",
  motivoFalta: "Escolha o motivo para poder enviar.",
  deslizarGrupo: "Deslize para pedir ao grupo",
  // navegação
  voltar: "Voltar",
  fechar: "Fechar",
  cancelar: "Cancelar pedido",
  aCancelar: "A cancelar…",
  pedirOutro: "Pedir a outro colega",
  voltarViagens: "Voltar às viagens",
  erroEnviar: "Não foi possível enviar o pedido. Tente outra vez.",
  erroCancelar: "Não foi possível cancelar o pedido. Tente outra vez.",
  erroResponder: "Não foi possível enviar a resposta. Tente outra vez.",
  erroLink: "Não foi possível abrir o pedido. Tente outra vez.",
  // quem pediu, grupo
  grupoEspera: "Pedido enviado ao grupo",
  grupoEsperaDica: "A viagem continua consigo até um colega aceitar e confirmar.",
  grupoReservada: "Um colega aceitou",
  grupoReservadaDica: "Falta a confirmação dele. A viagem continua consigo até lá.",
  cancelado: "Pedido cancelado. A viagem continua consigo.",
  // quem recebe
  recebidoTitulo: "Pedido de ajuda",
  recebidoGrupoTitulo: "Pedido ao grupo",
  simFaco: "Sim, faço",
  naoPosso: "Não posso",
  aceitar: "Aceitar",
  aAceitar: "A aceitar…",
  // o aviso do tempo (24/11): o texto vem do HUB-Central; estes são só o título e os botões
  avisoTitulo: "Atenção ao tempo",
  aceitarMesmoAssim: "Aceitar mesmo assim",
  avisoVermelhoPadrao: "Pelas nossas contas, chega bastante atrasado a esta viagem ou à seguinte.",
  confirmarTitulo: "Ficar com esta viagem?",
  deslizarFicar: "Deslize para ficar com a viagem",
  semCliente: "O nome e o contacto do cliente aparecem depois de ficar com a viagem.",
  grupoComoFunciona: "Fica com quem aceitar primeiro. Depois confirma na mensagem que recebe no WhatsApp.",
  jaFicou: "Já ficou com um colega.",
  outroAConfirmar: "Um colega já aceitou e está a confirmar. Se não confirmar, o pedido volta ao grupo.",
  recebidoCancelado: "O pedido foi cancelado.",
  recebidoExpirou: "Este pedido já não está à espera de resposta.",
  recusadoPorMim: "Respondeu «Não posso».",
  // a segunda confirmação (grupo)
  reservadaTitulo: "Reservada para si",
  reservadaFrase: "Confirme na mensagem que recebeu no WhatsApp.",
  segundaTitulo: "Confirmar a viagem",
  segundaFrase: "Aceitou esta viagem no grupo. Só depois desta confirmação a viagem passa para si.",
  deslizarSegunda: "Confirmo que faço esta viagem",
  prazoAcabou: "O prazo acabou: o pedido voltou ao grupo.",
  prazoAcabouDica: "Ainda pode aceitar outra vez, se o pedido continuar no grupo.",
  // entrada pelo link
  linkACarregar: "A abrir o pedido…",
  linkNaoExiste: "Este pedido já não existe ou não é para si.",
  linkProprio: "Este pedido é seu. Acompanhe-o no cartão da viagem.",
} as const;

/** Os motivos, como aparecem nos botões. */
export const NOME_MOTIVO: Record<MotivoAjuda, string> = {
  doente: "Doente",
  carro_avariado: "Carro avariado",
  atrasado: "Atrasado",
  outro: "Outro",
};

/** «Deslize para pedir a Rui Costa» */
export function textoDeslizarColega(nome: string): string {
  return `Deslize para pedir a ${nome}`;
}

/** Linha do colega na lista: só a categoria do carro («MPV»). Sem horas. */
export function linhaColega(c: Pick<ColegaPossivel, "categoria">): string {
  return c.categoria;
}

/** Cartão à espera: título e frase. */
export function textoEspera(nome: string): { titulo: string; frase: string } {
  return {
    titulo: `À espera de ${nome}`,
    frase: `A viagem continua consigo até ${nome} aceitar.`,
  };
}

/** Contagem até ao aviso dos 15 minutos. */
export function textoFaltam(min: number): string {
  return min <= 1
    ? "Sem resposta, avisamos dentro de 1 min"
    : `Sem resposta, avisamos daqui a ${min} min`;
}

/** Prazo da segunda confirmação: «Tem até às 14:35 · faltam 7 min». */
export function textoPrazoReserva(hora: string, min: number): string {
  const falta = min <= 1 ? "falta 1 min" : `faltam ${min} min`;
  return hora ? `Tem até às ${hora} · ${falta}` : `Tem ${min <= 1 ? "1 min" : `${min} min`}`;
}

/** Quem pediu, com o pedido reservado no grupo: «Se não confirmar em 7 min, o pedido volta ao grupo». */
export function textoReservaQuemPediu(min: number): string {
  return `Se não confirmar em ${Math.max(1, min)} min, o pedido volta ao grupo`;
}

/** A pílula no cartão da viagem, conforme o pedido. */
export function textoPilula(
  p: { tipo: "colega" | "grupo"; para?: { nome: string }; ficouCom?: { nome: string } } | null,
  estado: string | null,
): { texto: string; tom: "normal" | "espera" | "alerta" | "feito" } {
  if (!p || !estado || estado === "cancelado" || estado === "recusado") return { texto: T.botao, tom: "normal" };
  if (estado === "aceite" && p.ficouCom) return { texto: `Passou para ${primeiroNome(p.ficouCom.nome)}`, tom: "feito" };
  if (estado === "sem_resposta") return { texto: "Sem resposta", tom: "alerta" };
  if (estado === "reservada") return { texto: "Aceite · a confirmar", tom: "espera" };
  if (p.tipo === "grupo") return { texto: "Pedido ao grupo", tom: "espera" };
  return { texto: `À espera · ${primeiroNome(p.para?.nome ?? "")}`, tom: "espera" };
}

function primeiroNome(n: string): string {
  return String(n || "").trim().split(/\s+/)[0] ?? "";
}

/** Aviso dos 15 minutos. */
export function textoSemResposta(nome: string): { titulo: string; frase: string } {
  return {
    titulo: `${nome} não respondeu`,
    frase: "Passaram 15 minutos sem resposta. A viagem continua consigo.",
  };
}

/** Resultado: aceite / recusado. */
export function textoAceite(nome: string): { titulo: string; frase: string } {
  return {
    titulo: `${nome} ficou com a viagem`,
    frase: "A viagem saiu da sua lista. Obrigado por avisar a tempo.",
  };
}
/** «nao_pode»: o backend diz porquê este motorista não pode ficar com a viagem. */
export function textoNaoPode(razao: string): string {
  return `Não pode ficar com esta viagem: ${String(razao || "").trim().replace(/\.$/, "")}.`;
}
export function textoRecusado(nome: string): string {
  return `${nome} não pode fazer esta viagem. Escolha outro colega.`;
}

/** Quem recebe: «Rui Costa pede-lhe esta viagem» / «Rui Costa pede ajuda ao grupo» */
export function textoQuemPede(p: Pick<PedidoRecebido, "tipo" | "de">): string {
  return p.tipo === "grupo" ? `${p.de.nome} pede ajuda ao grupo` : `${p.de.nome} pede-lhe esta viagem`;
}

/** Depois de «Sim, faço» confirmado, ou da segunda confirmação do grupo. */
export function textoFicou(): { titulo: string; frase: string } {
  return {
    titulo: "A viagem é sua",
    frase: "Já está na sua lista, com o nome e o contacto do cliente.",
  };
}

/** Frase da confirmação antes de ficar com a viagem. */
export function textoConfirmarFicar(deNome: string): string {
  return `A viagem passa para si e sai da lista de ${deNome}.`;
}

/** «€35» ou "" — o valor só aparece se o cartão o mostra. */
export function textoValor(valor: number): string {
  return valor > 0 ? `€${Math.round(valor)}` : "";
}

/** «Voo TP1352» ou "" */
export function textoVoo(voo: string | undefined): string {
  const v = String(voo ?? "").trim();
  return v ? `Voo ${v}` : "";
}

/** Todas as frases de um resumo de viagem, como aparecem no ecrã. */
export function linhasResumo(r: ResumoViagemAjuda): string[] {
  return [r.rotulo, r.hora, r.data, textoVoo(r.voo), r.origem, r.destino, textoValor(r.valor)].filter(Boolean);
}

/**
 * Todos os textos que um pedido pode pôr no ecrã, de um lado e do outro.
 * Serve aos testes: nenhum pode ter a operadora nem a referência.
 */
export function textosDoPedido(p: PedidoAjuda | PedidoRecebido): string[] {
  const out: string[] = [];
  const nomePara = "para" in p && p.para ? p.para.nome : "";
  if (nomePara) {
    out.push(textoDeslizarColega(nomePara));
    const e = textoEspera(nomePara); out.push(e.titulo, e.frase);
    const s = textoSemResposta(nomePara); out.push(s.titulo, s.frase);
    out.push(textoRecusado(nomePara));
  }
  if ("motivo" in p && p.motivo) out.push(NOME_MOTIVO[p.motivo]);
  if (p.ficouCom) { const a = textoAceite(p.ficouCom.nome); out.push(a.titulo, a.frase); }
  if ("viagem" in p) {
    out.push(textoQuemPede(p), textoConfirmarFicar(p.de.nome), ...linhasResumo(p.viagem));
  }
  return out;
}
