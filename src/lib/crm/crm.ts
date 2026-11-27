// ───────────────────────────────────────────────────────────────
//  crm/crm.ts — o CRM da assistente (E20): tipos da API (E17,
//  CRM_ASSISTENTE.js), a sessão no navegador, as etiquetas, os
//  eventos em linguagem simples e o guião da chamada (PT + EN).
// ───────────────────────────────────────────────────────────────

export type Etiqueta = "QUENTE" | "RECUPERAR" | "AVALIAR_CHAMADA" | "MORNO" | "";
export type Lingua = "PT" | "EN" | "ES" | "FR" | "IT";

export interface Oferta {
  codigo: string;
  nome: string;
  tipo: string;
  momento: string;
}

export interface Cartao {
  ref: string;
  nome: string;
  lingua: Lingua | string;
  telefone: string;
  viagens: number;
  ultimaViagem: string;
  canal: string;
  etiqueta: Etiqueta | string;
  nota: number | null;
  notaEm: string;
  motivo: string;
  produtos: string[];
  ultimasOfertas: { produto: string; em: string; resultado: string }[];
  ultimaChamada: string;
  resultadoChamada: string;
  ligarEm: string;
  aSeguir: { ofertas: Oferta[]; presente: { pct: number } | null };
}

export interface Evento {
  quando: string;
  viagem: string;
  tipo: string;
  produto: string;
  resultado: string;
  quem: string;
  resumo: string;
}

export interface RespostaBase {
  ok: boolean;
  motivo?: string;
  message?: string;
  ensaio?: boolean;
  [k: string]: unknown;
}

export interface RespostaFila extends RespostaBase {
  hoje: string;
  total: number;
  mostrados: number;
  foraDaFila: Record<string, number>;
  clientes: Cartao[];
}

export interface RespostaCliente extends RespostaBase {
  cliente: Cartao;
  ficha: Record<string, unknown>;
  eventos: Evento[];
  naFila: boolean;
}

export interface RespostaRegistar extends RespostaBase {
  etiqueta: string;
  link?: { ok: boolean; motivo: string } | null;
  avisos?: string[];
  gravaria?: unknown;
  aceites?: string[];
}

export interface RespostaCarrinho extends RespostaBase {
  carrinho: string;
  refCliente: string;
  total: number;
  aDefinir: unknown;
  desconto: unknown;
}

// ── A sessão (só no sessionStorage; 12 h no máximo) ─────────────

export const CHAVE_SESSAO = "hub_crm_sessao";
export const DOZE_HORAS = 12 * 60 * 60 * 1000;

export interface Sessao {
  cracha: string;
  nome: string;
  /** ms: o que vier primeiro — o expiraEm do backend ou 12 h depois de entrar */
  fim: number;
}

export function lerSessao(agora = Date.now()): Sessao | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || "null") as Sessao | null;
    if (!s || typeof s.cracha !== "string" || !s.cracha || typeof s.fim !== "number" || agora >= s.fim) {
      sessionStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function gravarSessao(cracha: string, nome: string, expiraEm: unknown, agora = Date.now()): Sessao {
  const doBackend = typeof expiraEm === "string" || typeof expiraEm === "number" ? new Date(expiraEm).getTime() : NaN;
  const fim = Math.min(agora + DOZE_HORAS, Number.isFinite(doBackend) ? doBackend : Infinity);
  const s: Sessao = { cracha, nome, fim };
  try {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  } catch {
    /* sem armazenamento: a sessão vive só nesta página */
  }
  return s;
}

export function apagarSessao() {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    /* nada */
  }
}

// ── O pedido à rota do site ─────────────────────────────────────

export class CrmErro extends Error {
  motivo: string;
  resposta: RespostaBase;
  constructor(motivo: string, texto: string, resposta: RespostaBase) {
    super(texto);
    this.motivo = motivo;
    this.resposta = resposta;
  }
}

const TEXTOS_ERRO: Record<string, string> = {
  rede: "Sem ligação ao sistema. Tente outra vez.",
  desligado: "O CRM está desligado neste momento.",
  cracha: "A sessão terminou. Entre outra vez com o seu código.",
  sem_cracha: "A sessão terminou. Entre outra vez com o seu código.",
  codigo: "Código incorrecto.",
  tentativas: "Demasiadas tentativas. Tente daqui a 10 minutos.",
  cliente_nao_encontrado: "Cliente não encontrado.",
  resultado_invalido: "Escolha o resultado da chamada.",
  ligarEm_em_falta: "Escolha o dia para voltar a ligar.",
  ligarEm_no_passado: "O dia para voltar a ligar já passou.",
  ligarEm_longe_demais: "O dia para voltar a ligar está a mais de um ano.",
  produto_desconhecido: "Esse produto não existe no catálogo.",
  produto_inactivo: "Esse produto não está activo.",
  avaliacao_invalida: "A nota tem de ser de 1 a 5.",
  carrinho_desligado: "Os carrinhos estão desligados neste momento.",
  nao_oferecer: "Não se pode oferecer a este cliente (pediu STOP ou já comprou).",
  desconto_invalido: "Desconto inválido.",
  ocupado: "O sistema está ocupado. Tente outra vez daqui a pouco.",
  erro: "Erro no sistema. Tente outra vez.",
};

export function textoErro(r: RespostaBase): string {
  const m = String(r.motivo || "erro");
  if (m === "codigo" && typeof r.tentativasRestantes === "number")
    return `Código incorrecto. Restam ${r.tentativasRestantes} tentativa${r.tentativasRestantes === 1 ? "" : "s"}.`;
  if (m === "limite" && r.message) return String(r.message);
  return TEXTOS_ERRO[m] || (typeof r.message === "string" && r.message) || TEXTOS_ERRO.erro;
}

export async function pedirCrm<T extends RespostaBase>(corpo: Record<string, unknown>): Promise<T> {
  let r: RespostaBase;
  try {
    const res = await fetch("/api/assistente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      cache: "no-store",
    });
    r = (await res.json()) as RespostaBase;
  } catch {
    r = { ok: false, motivo: "rede" };
  }
  if (!r || r.ok !== true) {
    const rr = r || { ok: false, motivo: "erro" };
    throw new CrmErro(String(rr.motivo || "erro"), textoErro(rr), rr);
  }
  return r as T;
}

export const ehSessaoRecusada = (e: unknown) =>
  e instanceof CrmErro && (e.motivo === "cracha" || e.motivo === "sem_cracha");

// ── Etiquetas, línguas, resultados ──────────────────────────────

export const ETIQUETAS: Record<string, { emoji: string; texto: string; classe: string }> = {
  QUENTE: { emoji: "⭐", texto: "QUENTE", classe: "bg-emerald-500/15 text-emerald-300 border-emerald-400/50" },
  RECUPERAR: { emoji: "🛠️", texto: "RECUPERAR", classe: "bg-orange-500/15 text-orange-300 border-orange-400/50" },
  AVALIAR_CHAMADA: { emoji: "📞", texto: "AVALIAR POR CHAMADA", classe: "bg-sky-500/15 text-sky-300 border-sky-400/50" },
  MORNO: { emoji: "🌤️", texto: "MORNO", classe: "bg-zinc-500/20 text-zinc-300 border-zinc-400/40" },
};

export const BANDEIRAS: Record<string, string> = { PT: "🇵🇹", EN: "🇬🇧", ES: "🇪🇸", FR: "🇫🇷", IT: "🇮🇹" };
export const NOMES_LINGUA: Record<string, string> = { PT: "Português", EN: "Inglês", ES: "Espanhol", FR: "Francês", IT: "Italiano" };

export const RESULTADOS = [
  { codigo: "NAO_ATENDEU", texto: "Não atendeu", emoji: "📵" },
  { codigo: "LIGAR_DEPOIS", texto: "Ligar depois", emoji: "🕑" },
  { codigo: "INTERESSADO", texto: "Interessado", emoji: "👍" },
  { codigo: "COMPROU", texto: "Comprou", emoji: "✅" },
  { codigo: "NAO_QUER", texto: "Não quer", emoji: "✋" },
  { codigo: "NUMERO_ERRADO", texto: "Número errado", emoji: "❌" },
] as const;

export const textoResultado = (c: string) => RESULTADOS.find((r) => r.codigo === String(c).toUpperCase())?.texto || c;

/** O número para o botão «Ligar»: só algarismos; com indicativo, leva «+». */
export function telHref(digitos: string): string {
  const d = String(digitos || "").replace(/\D/g, "");
  if (!d) return "";
  return d.length > 9 ? `tel:+${d}` : `tel:${d}`;
}

/** «2026-11-20 14:30» ou «2026-11-20» → «20/11/2026 14:30» / «20/11/2026». Outros textos ficam como estão. */
export function dataPt(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(String(s || ""));
  if (!m) return String(s || "");
  return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}` : ""}`;
}

// ── Os eventos em linguagem simples ─────────────────────────────

const TIPOS_EVENTO: Record<string, string> = {
  CONFIRMACAO: "Recebeu a confirmação da viagem",
  LEMBRETE: "Recebeu o lembrete da viagem",
  SEGUNDA: "Recebeu a segunda mensagem",
  T5: "Recebeu uma mensagem automática",
  TERCEIRA: "Recebeu a terceira mensagem",
  ATRASO: "Recebeu um aviso de atraso",
  PDF: "Recebeu o guia em PDF",
  OK_RECEBIDO: "Respondeu a confirmar",
  OFERTA: "Recebeu uma oferta",
  RESPOSTA_OFERTA: "Respondeu a uma oferta",
  PEDIDO: "Fez um pedido",
  COMPRA: "Comprou",
  PAGAMENTO: "Pagou",
  STOP: "Pediu para não receber mais mensagens",
  AVALIACAO: "Avaliação da viagem",
  NOTA_HUMANO: "Nota da equipa",
  VIAGEM_CRIADA: "Viagem marcada",
  NO_LOCAL: "O motorista chegou ao local",
  CHAMADA: "Chamada da assistente",
};

export function eventoSimples(e: Evento): string {
  const base = TIPOS_EVENTO[String(e.tipo).toUpperCase()] || String(e.tipo || "Registo");
  const partes = [base];
  if (e.produto) partes.push(e.produto);
  if (e.resultado) partes.push(String(e.tipo).toUpperCase() === "CHAMADA" ? textoResultado(e.resultado) : e.resultado);
  return partes.join(" · ");
}

// ── O guião da chamada ──────────────────────────────────────────

export interface Fala {
  id: string;
  titulo: string;
  pt: string;
  en: string;
}

export function guiao(c: Cartao, oferta?: Oferta | null): Fala[] {
  const nome = c.nome || "";
  const ola = (s: string) => (nome ? s.replace("{nome}", nome) : s.replace(" {nome}", ""));
  const motivoPt = c.motivo || "o que correu mal";
  const motivoEn = c.motivo || "what went wrong";
  const pct = c.aSeguir?.presente?.pct || 10;
  const ofertaPt = oferta?.nome || "na sua próxima reserva";
  const ofertaEn = oferta?.nome || "your next booking";
  const falas: Fala[] = [
    {
      id: "abertura",
      titulo: "Abertura",
      pt: ola("Olá {nome}, fala da HUB Transfer, quem o levou em Lisboa. Tem um minuto?"),
      en: ola("Hello {nome}, this is HUB Transfer, we drove you in Lisbon. Do you have a minute?"),
    },
  ];
  const et = String(c.etiqueta).toUpperCase();
  if (et === "AVALIAR_CHAMADA" || et === "MORNO") {
    falas.push({ id: "nota", titulo: "Pedir a nota", pt: "De 1 a 5, como foi a sua viagem connosco?", en: "From 1 to 5, how was your ride with us?" });
  } else if (et === "QUENTE") {
    falas.push({
      id: "google",
      titulo: "Nota 5 — pedir o Google",
      pt: "Muito obrigado! Posso mandar-lhe pelo WhatsApp o link para deixar essas 5 estrelas no Google? Demora 10 segundos.",
      en: "Thank you so much! May I send you the link on WhatsApp to leave those 5 stars on Google? It takes 10 seconds.",
    });
  } else if (et === "RECUPERAR") {
    falas.push({
      id: "recuperar",
      titulo: "Recuperar",
      pt: `Vi a sua avaliação e peço-lhe desculpa por ${motivoPt}. Para compensar, queria oferecer-lhe ${pct}% em ${ofertaPt}.`,
      en: `I saw your rating and I'm sorry about ${motivoEn}. To make it up to you, I'd like to offer you ${pct}% off ${ofertaEn}.`,
    });
  }
  falas.push(
    {
      id: "oferta",
      titulo: "Oferta",
      pt: "Já tem mesa para jantar em Lisboa? Reservamos por si e levamo-lo à porta.",
      en: "Do you already have a table for dinner in Lisbon? We book it for you and take you to the door.",
    },
    { id: "fecho", titulo: "Fecho", pt: "Posso enviar-lhe agora o link para confirmar?", en: "Shall I send you the link now to confirm?" },
    {
      id: "pensar",
      titulo: "Se disser «vou pensar»",
      pt: "Claro. Quando lhe posso ligar para decidirmos?",
      en: "Of course. When can I call you back to decide?",
    },
  );
  return falas;
}

/** Hoje em Lisboa, «yyyy-MM-dd» (para o mínimo do campo «Ligar em»). */
export function hojeLisboa(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}
