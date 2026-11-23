// ───────────────────────────────────────────────────────────────
//  ajuda/textos.ts — TODOS os textos dos ecrãs da «Ajuda» passam
//  por aqui, para os testes confirmarem que nenhum mostra a operadora,
//  o código dela ou a referência da reserva (tests/ajuda.test.mjs).
//  Sem «ele/ela»: a app não sabe o género de quem está do outro lado.
//  Tom: o do cartão do motorista («consigo», «Deslize»).
// ───────────────────────────────────────────────────────────────
import type { ColegaPossivel, PedidoAjuda, PedidoRecebido, ResumoViagemAjuda } from "./tipos";

export const T = {
  botao: "Ajuda",
  titulo: "Pedir ajuda",
  subtitulo: "Quem pode fazer esta viagem",
  aCarregar: "A procurar colegas livres…",
  erro: "Não foi possível ver os colegas. Tente outra vez.",
  tentar: "Tentar outra vez",
  nenhum: "Nenhum colega está livre para esta viagem.",
  nenhumDica: "Peça ao grupo: fica com a viagem quem carregar primeiro em «Fico eu».",
  pedirGrupo: "Pedir ao grupo",
  pedirGrupoDica: "Fica com quem carregar primeiro em «Fico eu»",
  deslizarGrupo: "Deslize para pedir ao grupo",
  voltar: "Voltar",
  fechar: "Fechar",
  cancelar: "Cancelar pedido",
  aCancelar: "A cancelar…",
  pedirOutro: "Pedir a outro colega",
  voltarViagens: "Voltar às viagens",
  grupoEspera: "Pedido enviado ao grupo",
  grupoEsperaDica: "A viagem continua consigo até alguém carregar em «Fico eu».",
  cancelado: "Pedido cancelado. A viagem continua consigo.",
  // quem recebe
  recebidoTitulo: "Pedido de ajuda",
  recebidoGrupoTitulo: "Pedido ao grupo",
  simFaco: "Sim, faço",
  naoPosso: "Não posso",
  ficoEu: "Fico eu",
  confirmarTitulo: "Ficar com esta viagem?",
  deslizarFicar: "Deslize para ficar com a viagem",
  semCliente: "O nome e o contacto do cliente aparecem depois de aceitar.",
  jaFicou: "Esta viagem já ficou com um colega.",
  recebidoCancelado: "O pedido foi cancelado.",
  recebidoExpirou: "Este pedido já não está à espera de resposta.",
  recusadoPorMim: "Respondeu «Não posso».",
} as const;

/** «Deslize para pedir a Rui Costa» */
export function textoDeslizarColega(nome: string): string {
  return `Deslize para pedir a ${nome}`;
}

/** Linha do colega na lista: «MPV · livre até 18:00» / «Sedan · próxima viagem às 16:30» */
export function linhaColega(c: Pick<ColegaPossivel, "categoria" | "livreAte" | "proximaViagem">): string {
  const extra = c.proximaViagem
    ? `próxima viagem às ${c.proximaViagem}`
    : c.livreAte
      ? `livre até ${c.livreAte}`
      : "livre o resto do dia";
  return `${c.categoria} · ${extra}`;
}

/** Cartão à espera: título e frase. */
export function textoEspera(nome: string): { titulo: string; frase: string } {
  return {
    titulo: `À espera de ${nome}`,
    frase: `A viagem continua consigo até ${nome} aceitar.`,
  };
}

/** «Faltam 12 min para o aviso» */
export function textoFaltam(min: number): string {
  return min <= 1 ? "Falta menos de 1 min" : `Faltam ${min} min`;
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
export function textoRecusado(nome: string): string {
  return `${nome} não pode fazer esta viagem. Escolha outro colega.`;
}

/** Quem recebe: «Rui Costa pede-lhe esta viagem» / «Rui Costa pede ajuda ao grupo» */
export function textoQuemPede(p: Pick<PedidoRecebido, "tipo" | "de">): string {
  return p.tipo === "grupo" ? `${p.de.nome} pede ajuda ao grupo` : `${p.de.nome} pede-lhe esta viagem`;
}

/** Depois de «Sim, faço» / «Fico eu» confirmado. */
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

/** Todas as frases de um resumo de viagem, como aparecem no ecrã. */
export function linhasResumo(r: ResumoViagemAjuda): string[] {
  return [r.rotulo, r.hora, r.data, r.origem, r.destino, textoValor(r.valor)].filter(Boolean);
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
  if (p.ficouCom) { const a = textoAceite(p.ficouCom.nome); out.push(a.titulo, a.frase); }
  if ("viagem" in p) {
    out.push(textoQuemPede(p), textoConfirmarFicar(p.de.nome), ...linhasResumo(p.viagem));
  }
  return out;
}
