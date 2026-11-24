// ───────────────────────────────────────────────────────────────
//  ajuda/hubCentral.ts — o cliente VERDADEIRO da «Ajuda»: fala com o
//  HUB-Central (AJUDA_MOTORISTAS.js, acções ajuda…).
//
//  Puro de propósito (sem imports de valores, sem window): o fetch, o
//  crachá e o aviso da sessão entram por parâmetro, para os testes
//  correrem com `node --test` e dados inventados (tests/ajuda-ligada.test.mjs).
//
//  Regras:
//   · quem é o motorista diz-o SÓ o crachá: nenhum pedido leva «de» nem
//     «motorista» (semQuem tira-os, mesmo que alguém os ponha);
//   · leituras por GET (&cracha=…, como os outros pedidos do motorista),
//     escritas por POST com o crachá no corpo (como o alterarSenha);
//   · { ok:false, motivo:"sessao" } → avisa a página (volta à senha) e
//     falha: nenhum botão mostra que deu certo;
//   · os outros erros chegam como AjudaErro, com o texto do backend.
// ───────────────────────────────────────────────────────────────
import type {
  CancelarPedido,
  ClienteAjuda,
  ConfirmarReserva,
  PedidoAjuda,
  PedidoRecebido,
  PedirAColega,
  PedirAoGrupo,
  ResponderPedido,
  RespostaColegas,
  RespostaRecebido,
  RespostaResponder,
  ViagemParaAjuda,
} from "./tipos";

export const TEXTO_SEM_REDE = "Sem ligação ao HUB Central. Tente outra vez.";
export const TEXTO_SESSAO = "A sessão terminou. Entre outra vez com a sua senha.";
export const TEXTO_ERRO = "Erro no sistema. Tente outra vez.";

/** Um erro da ajuda: o motivo do backend e o texto para mostrar. */
export class AjudaErro extends Error {
  motivo: string;
  texto: string;
  razao?: string;
  pedido?: unknown;
  constructor(motivo: string, texto: string, razao?: string, pedido?: unknown) {
    super(texto);
    this.name = "AjudaErro";
    this.motivo = motivo;
    this.texto = texto;
    if (razao) this.razao = razao;
    if (pedido !== undefined) this.pedido = pedido;
  }
}

/**
 * Lê a resposta do HUB-Central: { ok:true, … } passa; o resto falha.
 * A recusa do crachá avisa a página (avisarSessao) antes de falhar.
 */
export function lerResposta(json: unknown, avisarSessao: (j: unknown) => boolean): Record<string, unknown> {
  if (!json || typeof json !== "object" || Array.isArray(json)) throw new AjudaErro("resposta", TEXTO_ERRO);
  const j = json as Record<string, unknown>;
  if (j.ok === true) return j;
  if (j.motivo === "sessao") {
    avisarSessao(j);
    throw new AjudaErro("sessao", TEXTO_SESSAO);
  }
  const motivo = typeof j.motivo === "string" && j.motivo ? j.motivo : "erro";
  const texto = typeof j.texto === "string" && j.texto.trim() ? j.texto.trim() : TEXTO_ERRO;
  const razao = typeof j.razao === "string" && j.razao.trim() ? j.razao.trim() : undefined;
  throw new AjudaErro(motivo, texto, razao, j.pedido);
}

/**
 * O texto a mostrar para um erro. É o do backend; no «nao_pode» leva
 * sempre a razão. Um erro que não veio do backend → `padrao`.
 */
export function textoDoErro(e: unknown, padrao: string): string {
  if (!(e instanceof AjudaErro)) return padrao;
  if (e.motivo === "nao_pode" && e.razao && !e.texto.includes(e.razao)) {
    return `Não pode ficar com esta viagem: ${e.razao}.`;
  }
  return e.texto || padrao;
}

/** Tira «de» e «motorista» de um pedido: quem é o motorista diz-o só o crachá. */
export function semQuem<T extends object>(o: T): Omit<T, "de" | "motorista"> {
  const c = { ...o } as Record<string, unknown>;
  delete c.de;
  delete c.motorista;
  return c as Omit<T, "de" | "motorista">;
}

// ── A ajuda está ligada para este motorista? ────────────────────

/**
 * O que a app conclui da primeira leitura (ajudaMeusPedidos):
 *   ligada    — respondeu ok: o botão e os pedidos aparecem;
 *   escondida — DESLIGADA, em TESTE sem o nome dele, ou outra recusa: nada aparece;
 *   sessao    — o crachá foi recusado: a página volta à senha;
 *   sem_rede  — não se sabe: fica como estava (no início, escondida).
 */
export type Ligacao = "ligada" | "escondida" | "sessao" | "sem_rede";

export function ligacaoDoErro(e: unknown): Ligacao {
  if (!(e instanceof AjudaErro)) return "sem_rede";
  if (e.motivo === "sessao") return "sessao";
  if (e.motivo === "sem_rede") return "sem_rede";
  return "escondida";
}

/** Depois de uma leitura: mostra-se a ajuda? (sem rede mantém o que havia) */
export function proximaLigada(antes: boolean, l: Ligacao): boolean {
  if (l === "ligada") return true;
  if (l === "sem_rede") return antes;
  return false;
}

// ── De quanto em quanto tempo se actualiza ──────────────────────

/** Com pedidos em curso (meus ou para responder): 30 s. */
export const AJUDA_POLL_ACTIVO_MS = 30_000;
/** Ligada, sem nada em curso: 60 s. */
export const AJUDA_POLL_MS = 60_000;
/** Escondida: volta a perguntar se já está ligada de 5 em 5 min (e ao voltar à app). */
export const AJUDA_VER_SE_LIGADA_MS = 5 * 60_000;

/** Há algum pedido à espera ou reservado, dos meus ou dos que recebi? */
export function haPedidosEmCurso(
  meus: ReadonlyArray<Pick<PedidoAjuda, "estado">>,
  recebidos: ReadonlyArray<Pick<PedidoRecebido, "estado">>,
): boolean {
  const vivo = (e: string) => e === "a_espera" || e === "reservada";
  return meus.some((p) => vivo(p.estado)) || recebidos.some((p) => vivo(p.estado));
}

export function intervaloDaAjuda(ligada: boolean, emCurso: boolean): number {
  if (!ligada) return AJUDA_VER_SE_LIGADA_MS;
  return emCurso ? AJUDA_POLL_ACTIVO_MS : AJUDA_POLL_MS;
}

/**
 * O relógio das actualizações: só corre com a app aberta e À VISTA.
 * Escondida (outra app, ecrã desligado), não pergunta nada; ao voltar,
 * actualiza logo e volta ao ritmo. Nunca há duas leituras ao mesmo tempo.
 */
export function criarActualizador(o: {
  carregar: () => Promise<void>;
  intervalo: () => number;
  visivel: () => boolean;
  agendar: (f: () => void, ms: number) => unknown;
  cancelar: (h: unknown) => void;
}) {
  let h: unknown = null;
  let parado = true;
  let aCorrer = false;
  const limpar = () => { if (h !== null) { o.cancelar(h); h = null; } };
  const agendarProximo = () => {
    limpar();
    if (!parado && o.visivel()) h = o.agendar(() => { h = null; void tique(); }, o.intervalo());
  };
  const tique = async (): Promise<void> => {
    if (parado || !o.visivel()) { limpar(); return; }
    if (!aCorrer) {
      aCorrer = true;
      try { await o.carregar(); } catch { /* fica o que havia */ } finally { aCorrer = false; }
    }
    agendarProximo();
  };
  return {
    iniciar(): Promise<void> { parado = false; return tique(); },
    parar(): void { parado = true; limpar(); },
    /** chamar no «visibilitychange» */
    mudouVisibilidade(): Promise<void> | void {
      if (o.visivel()) return tique();
      limpar();
    },
    /** actualizar já (depois de um botão) */
    agora(): Promise<void> { return tique(); },
    get agendado(): boolean { return h !== null; },
  };
}

// ── O cliente ───────────────────────────────────────────────────

/** O mínimo do fetch que o cliente usa (o do browser, ou um falso nos testes). */
export type Buscar = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; redirect?: "follow" },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const RESPOSTAS_CONHECIDAS = new Set(["ja_ficou", "reservada", "cancelado", "expirou"]);

function lista<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

export function criarClienteHubCentral(o: {
  url: string;
  buscar: Buscar;
  /** «&cracha=…» ou "" */
  crachaParam: () => string;
  /** { cracha } ou {} */
  crachaCampo: () => { cracha?: string };
  /** avisa a página que o crachá foi recusado (avisarSeRecusada) */
  avisarSessao: (j: unknown) => boolean;
  relogio?: () => number;
}): ClienteAjuda {
  const relogio = o.relogio ?? Date.now;

  async function pedir(url: string, init?: Parameters<Buscar>[1]): Promise<Record<string, unknown>> {
    let json: unknown;
    try {
      const res = await o.buscar(url, { redirect: "follow", ...init });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    } catch {
      throw new AjudaErro("sem_rede", TEXTO_SEM_REDE);
    }
    return lerResposta(json, o.avisarSessao);
  }

  function get(action: string, params: Record<string, string> = {}) {
    const q = new URLSearchParams({ action, ...semQuem(params) as Record<string, string>, t: String(relogio()) });
    return pedir(`${o.url}?${q.toString()}${o.crachaParam()}`);
  }

  function post(action: string, corpo: object) {
    return pedir(o.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ ...semQuem(corpo), action, ...o.crachaCampo() }),
    });
  }

  /** responder / confirmar: as recusas conhecidas voltam como { ok:false, motivo, pedido } */
  async function resposta(action: string, corpo: object): Promise<RespostaResponder> {
    try {
      const j = await post(action, corpo);
      return { ok: true, pedido: j.pedido as PedidoRecebido };
    } catch (e) {
      if (e instanceof AjudaErro && RESPOSTAS_CONHECIDAS.has(e.motivo) && e.pedido && typeof e.pedido === "object") {
        return { ok: false, motivo: e.motivo as RespostaResponder["motivo"], pedido: e.pedido as PedidoRecebido };
      }
      throw e;
    }
  }

  return {
    async colegas(v: ViagemParaAjuda): Promise<RespostaColegas> {
      const j = await get("ajudaColegas", { viagemRef: v.viagemRef });
      return {
        viagemRef: String(j.viagemRef ?? v.viagemRef),
        resumo: (j.resumo as RespostaColegas["resumo"]) ?? v.resumo,
        colegas: lista(j.colegas),
      };
    },
    async pedirAColega(p: PedirAColega): Promise<PedidoAjuda> {
      const j = await post("ajudaPedir", { viagemRef: p.viagemRef, para: p.para, motivo: p.motivo });
      return j.pedido as PedidoAjuda;
    },
    async pedirAoGrupo(p: PedirAoGrupo): Promise<PedidoAjuda> {
      const j = await post("ajudaPedirGrupo", { viagemRef: p.viagemRef, motivo: p.motivo });
      return j.pedido as PedidoAjuda;
    },
    async cancelar(p: CancelarPedido): Promise<PedidoAjuda> {
      const j = await post("ajudaCancelar", { pedidoId: p.pedidoId });
      return j.pedido as PedidoAjuda;
    },
    async meusPedidos(): Promise<PedidoAjuda[]> {
      return lista<PedidoAjuda>((await get("ajudaMeusPedidos")).pedidos);
    },
    async recebidos(): Promise<PedidoRecebido[]> {
      return lista<PedidoRecebido>((await get("ajudaRecebidos")).pedidos);
    },
    async recebido(pedidoId: string): Promise<RespostaRecebido> {
      const j = await get("ajudaRecebido", { pedido: pedidoId });
      const out: RespostaRecebido = { pedido: (j.pedido as PedidoRecebido | null) ?? null };
      if (typeof j.podeAceitar === "boolean") out.podeAceitar = j.podeAceitar;
      if (typeof j.razao === "string" && j.razao.trim()) out.razao = j.razao.trim();
      return out;
    },
    responder(p: ResponderPedido): Promise<RespostaResponder> {
      return resposta("ajudaResponder", { pedidoId: p.pedidoId, resposta: p.resposta });
    },
    confirmar(p: ConfirmarReserva): Promise<RespostaResponder> {
      return resposta("ajudaConfirmar", { pedidoId: p.pedidoId });
    },
  };
}
