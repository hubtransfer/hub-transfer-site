// ───────────────────────────────────────────────────────────────
//  crm/crm.ts — o CRM da assistente (E20): tipos da API (E17,
//  CRM_ASSISTENTE.js), a sessão no navegador, as etiquetas, os
//  eventos em linguagem simples, o guião curto por etiqueta (E21)
//  e o placar do dia.
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
  /** opcional: os contadores do dia vindos do backend (mandam sobre os do aparelho) */
  placar?: PlacarBackend;
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

// ── O guião curto (E21): só o desta etiqueta, em PT, + a frase-chave na língua do cliente ──

export interface Perfil {
  /** «Gostou muito» — o que aconteceu, em linguagem simples */
  titulo: string;
  emoji: string;
  /** «agradecer e propor» — o que fazer */
  accao: string;
  /** classes do selo (tema claro) */
  selo: string;
  /** pede as estrelas na hora de registar */
  pedeNota: boolean;
}

export const PERFIS: Record<string, Perfil> = {
  QUENTE: { titulo: "Gostou muito", emoji: "⭐", accao: "agradecer e propor", selo: "bg-[#e3f5e9] text-[#14532d]", pedeNota: false },
  RECUPERAR: { titulo: "Ficou desiludido", emoji: "🛠️", accao: "pedir desculpa", selo: "bg-[#fde8dc] text-[#7c2d12]", pedeNota: false },
  AVALIAR_CHAMADA: { titulo: "Ainda não avaliou", emoji: "📞", accao: "perguntar a nota", selo: "bg-[#e0edfb] text-[#1e3a8a]", pedeNota: true },
  MORNO: { titulo: "Já viajou", emoji: "🌤️", accao: "saber como correu", selo: "bg-[#eceef1] text-[#33383e]", pedeNota: true },
};
export const PERFIL_SEM_ETIQUETA: Perfil = { titulo: "Cliente", emoji: "👤", accao: "saber como correu", selo: "bg-[#eceef1] text-[#33383e]", pedeNota: true };
export const perfil = (etiqueta: string): Perfil => PERFIS[String(etiqueta).toUpperCase()] || PERFIL_SEM_ETIQUETA;

/** Só o primeiro nome (nunca o nome completo no ecrã). */
export const primeiroNome = (nome: string) => String(nome || "").trim().split(/\s+/)[0] || "";

/** Dias inteiros entre «yyyy-MM-dd…» e hoje (Lisboa). null se não houver data. */
export function diasDesde(data: string, hoje = hojeLisboa()): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data || ""));
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(hoje);
  if (!a || !b) return null;
  const d = (Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86_400_000;
  return Math.max(0, Math.round(d));
}

export function textoDias(n: number | null): string {
  if (n === null) return "";
  if (n === 0) return "Viajou hoje";
  if (n === 1) return "Viajou ontem";
  return `Viajou há ${n} dias`;
}

/** Os produtos comprados, em linguagem simples. */
const NOMES_PRODUTO: Record<string, string> = { TRANSFER: "Transfer", MESA: "Mesa num restaurante", TOUR: "Tour" };
export const nomeProduto = (p: string) =>
  NOMES_PRODUTO[String(p).toUpperCase()] ||
  String(p)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

/** Três passos curtos, em PT, só para esta etiqueta. */
export function guiaoCurto(c: Cartao, oferta?: Oferta | null): string[] {
  const pct = c.aSeguir?.presente?.pct || 10;
  const proposta = oferta?.nome || "uma mesa para jantar, com transporte à porta";
  switch (String(c.etiqueta).toUpperCase()) {
    case "QUENTE":
      return ["Agradeça as 5 estrelas.", "Peça a nota no Google: o link vai pelo WhatsApp e demora 10 segundos.", `Proponha: ${proposta}.`];
    case "RECUPERAR":
      return [
        c.motivo ? `Peça desculpa por «${c.motivo}».` : "Peça desculpa pelo que correu mal.",
        `Ofereça ${pct}% de desconto: ${oferta?.nome || "na próxima reserva"}.`,
        "Se disser «vou pensar», combine o dia para voltar a ligar.",
      ];
    case "AVALIAR_CHAMADA":
      return [
        "Apresente-se: HUB Transfer, quem o levou em Lisboa.",
        "Pergunte a nota da viagem, de 1 a 5.",
        `Nota 5: peça o Google. Nota baixa: peça desculpa e ofereça ${pct}%.`,
      ];
    default:
      return ["Pergunte como correu a viagem e a estadia.", "Peça a nota, de 1 a 5.", `Proponha: ${proposta}.`];
  }
}

type Frases = Record<"PT" | "EN" | "ES" | "FR" | "IT", string>;

const OLA: Frases = {
  PT: "Olá {nome}, fala da HUB Transfer.",
  EN: "Hello {nome}, this is HUB Transfer.",
  ES: "Hola {nome}, le llamo de HUB Transfer.",
  FR: "Bonjour {nome}, ici HUB Transfer.",
  IT: "Buongiorno {nome}, sono di HUB Transfer.",
};

const CHAVE: Record<string, Frases> = {
  QUENTE: {
    PT: "Posso mandar-lhe o link para deixar as 5 estrelas no Google?",
    EN: "May I send you the link to leave your 5 stars on Google?",
    ES: "¿Le puedo enviar el enlace para dejar sus 5 estrellas en Google?",
    FR: "Puis-je vous envoyer le lien pour laisser vos 5 étoiles sur Google ?",
    IT: "Posso mandarle il link per lasciare le sue 5 stelle su Google?",
  },
  RECUPERAR: {
    PT: "Pedimos desculpa. Queremos oferecer-lhe {pct}% na próxima reserva.",
    EN: "We're very sorry. We'd like to offer you {pct}% off your next booking.",
    ES: "Lo sentimos mucho. Queremos ofrecerle un {pct}% de descuento en su próxima reserva.",
    FR: "Toutes nos excuses. Nous aimerions vous offrir {pct} % sur votre prochaine réservation.",
    IT: "Ci scusiamo molto. Vorremmo offrirle il {pct}% di sconto sulla prossima prenotazione.",
  },
  AVALIAR_CHAMADA: {
    PT: "De 1 a 5, como foi a sua viagem connosco?",
    EN: "From 1 to 5, how was your ride with us?",
    ES: "Del 1 al 5, ¿qué tal fue su viaje con nosotros?",
    FR: "De 1 à 5, comment s'est passé votre trajet avec nous ?",
    IT: "Da 1 a 5, com'è andato il viaggio con noi?",
  },
  MORNO: {
    PT: "Como correu a sua estadia em Lisboa?",
    EN: "How was your stay in Lisbon?",
    ES: "¿Qué tal su estancia en Lisboa?",
    FR: "Comment s'est passé votre séjour à Lisbonne ?",
    IT: "Com'è andato il soggiorno a Lisbona?",
  },
};

const LANG_HTML: Record<string, string> = { PT: "pt-PT", EN: "en", ES: "es", FR: "fr", IT: "it" };

/** A frase-chave na língua do cliente (cumprimento + pedido). Línguas desconhecidas → inglês. */
export function fraseChave(c: Cartao): { lingua: string; lang: string; ola: string; frase: string } {
  const l = (["PT", "EN", "ES", "FR", "IT"].includes(String(c.lingua)) ? c.lingua : "EN") as keyof Frases;
  const nome = primeiroNome(c.nome);
  const pct = String(c.aSeguir?.presente?.pct || 10);
  const ola = nome ? OLA[l].replace("{nome}", nome) : OLA[l].replace(" {nome}", "");
  const frases = CHAVE[String(c.etiqueta).toUpperCase()] || CHAVE.MORNO;
  return { lingua: l, lang: LANG_HTML[l], ola, frase: frases[l].replace("{pct}", pct) };
}

// ── O placar do dia (contadores da assistente) ──────────────────
// Se o backend mandar «placar» no crmFila, manda o backend. Senão, conta-se neste aparelho
// (localStorage, só números e refs C-…; nunca o crachá nem dados do cliente).

export const META_DIARIA = 20;
export const CHAVE_PLACAR = "hub_crm_placar";

export interface Dia {
  chamadas: number;
  atendidas: number;
  vendas: number;
  /** refs C-… já ligadas hoje (para não voltarem à fila neste aparelho) */
  refs: string[];
}

export interface PlacarBackend {
  chamadas?: number;
  atendidas?: number;
  vendasHoje?: number;
  vendasSemana?: number;
  meta?: number;
}

const DIA_VAZIO = (): Dia => ({ chamadas: 0, atendidas: 0, vendas: 0, refs: [] });

function lerTudo(): Record<string, Dia> {
  try {
    const o = JSON.parse(localStorage.getItem(CHAVE_PLACAR) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

export function lerDia(dia = hojeLisboa()): Dia {
  const d = lerTudo()[dia];
  return d ? { ...DIA_VAZIO(), ...d } : DIA_VAZIO();
}

/** Vendas dos últimos 7 dias (hoje incluído), contadas neste aparelho. */
export function vendasSemana(dia = hojeLisboa()): number {
  const fim = Date.parse(`${dia}T12:00:00Z`);
  return Object.entries(lerTudo()).reduce((s, [k, v]) => {
    const t = Date.parse(`${k}T12:00:00Z`);
    return Number.isFinite(t) && fim - t >= 0 && fim - t < 7 * 86_400_000 ? s + (Number(v?.vendas) || 0) : s;
  }, 0);
}

const NAO_ATENDIDAS = new Set(["NAO_ATENDEU", "NUMERO_ERRADO"]);

export function contarChamada(ref: string, resultado: string, dia = hojeLisboa()): Dia {
  const tudo = lerTudo();
  const d = { ...DIA_VAZIO(), ...(tudo[dia] || {}) };
  d.chamadas += 1;
  if (!NAO_ATENDIDAS.has(resultado)) d.atendidas += 1;
  if (resultado === "COMPROU") d.vendas += 1;
  if (!d.refs.includes(ref)) d.refs = [...d.refs, ref];
  tudo[dia] = d;
  for (const k of Object.keys(tudo).sort().slice(0, -8)) delete tudo[k]; // só os últimos 8 dias
  try {
    localStorage.setItem(CHAVE_PLACAR, JSON.stringify(tudo));
  } catch {
    /* sem armazenamento: conta só nesta página */
  }
  return d;
}

/** A frase de incentivo, conforme o progresso. */
export function incentivo(feitas: number, meta: number): string {
  if (meta > 0 && feitas >= meta) return "Meta cumprida 🎉";
  if (feitas === 0) return "Vamos a isso! A primeira chamada abre o dia.";
  const r = feitas / Math.max(1, meta);
  if (r < 0.5) return "Bom começo!";
  if (r < 0.75) return "A meio caminho!";
  return "Falta pouco!";
}

/** «Bom dia» / «Boa tarde» / «Boa noite», à hora de Lisboa. */
export function saudacao(agora = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", hourCycle: "h23" }).format(agora));
  return h < 6 ? "Boa noite" : h < 13 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
}

/** Hoje em Lisboa, «yyyy-MM-dd» (para o mínimo do campo «Ligar em»). */
export function hojeLisboa(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}
