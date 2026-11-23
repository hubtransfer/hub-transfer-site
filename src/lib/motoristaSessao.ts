// Quem está na app do motorista: só o motorista do crachá que o login devolveu.
// Funções puras (sem imports, sem window) para se testarem com `node --test`.
//
// Regras (correcção de 23/11/2026, caso de 21/11):
//  - o motorista vem SÓ da sessão do login (papel driver + crachá dentro do prazo);
//  - nada guardado no telemóvel decide quem é o motorista (hub_driver_identity,
//    hub_driver_name, cache das viagens): entrar e sair apagam tudo isso;
//  - não há forma de escolher outro nome: se o nome do login não está na lista
//    oficial, a app diz «Peça ajuda à gestão»;
//  - crachá fora do prazo → a app pede outra vez a senha.

/** Quanto dura a sessão do motorista: 7 dias (decisão do Junior, 23/11/2026 — a
 *  senha uma vez por semana). A gestão e os hotéis ficam com o prazo de sempre.
 *  Enquanto o crachá do backend durar menos, manda o prazo mais curto. */
export const SESSAO_MOTORISTA_MS = 7 * 24 * 60 * 60 * 1000;

/** O prazo de uma sessão nova: 7 dias para o motorista; para os outros papéis, o de sempre. */
export function prazoSessaoNova(papel: unknown, agora: number, ttlOutros: number): number {
  return agora + (papel === "driver" ? SESSAO_MOTORISTA_MS : ttlOutros);
}

/** O HUB-Central recusou o crachá: { ok: false, motivo: "sessao" } (senha mudou, inactivo…). */
export function crachaRecusado(resposta: unknown): boolean {
  if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) return false;
  const r = resposta as { ok?: unknown; motivo?: unknown };
  return r.ok === false && r.motivo === "sessao";
}

/** Erro lançado quando o HUB-Central recusa o crachá: a app apaga a sessão e volta à senha. */
export class SessaoRecusadaErro extends Error {
  constructor() {
    super("sessao");
    this.name = "SessaoRecusadaErro";
  }
}

/** As chaves do localStorage que guardam dados de um motorista (nunca a sessão). */
export const CHAVES_DADOS_MOTORISTA = [
  "hub_driver_identity",   // nome escolhido no antigo «Quem és tu?» — já não se usa
  "hub_driver_name",       // chave antiga — já não se usa
  "hub_trips_cache",       // viagens guardadas (trips-cache.ts)
  "hub_driver_last_sync",  // hora do último sync
] as const;

/** O mínimo da sessão que estas funções lêem (AuthSession em auth.ts). */
export interface SessaoMotoristaLida {
  name?: unknown;
  role?: unknown;
  cracha?: unknown;
  expiresAt?: unknown;
}

/** O mesmo que chaveMotorista (trips.ts): sem acentos, minúsculas, espaços simples. */
export function chaveNome(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Base64 web-safe → texto (UTF-8). null se não der. */
function base64UrlParaTexto(b64: string): string | null {
  try {
    let s = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * O que o crachá diz (sem conferir a assinatura — isso é do backend):
 * quem (q), prazo em ms (e) e papel (p). null se não for um crachá legível.
 */
export function lerCracha(cracha: unknown): { quem: string; prazo: number; papel: string } | null {
  if (typeof cracha !== "string" || !cracha) return null;
  const partes = cracha.split(".");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  const txt = base64UrlParaTexto(partes[0]);
  if (!txt) return null;
  try {
    const d = JSON.parse(txt) as { q?: unknown; e?: unknown; p?: unknown };
    const prazo = Number(d.e);
    if (typeof d.q !== "string" || !Number.isFinite(prazo)) return null;
    return { quem: d.q, prazo, papel: typeof d.p === "string" ? d.p : "" };
  } catch {
    return null;
  }
}

export type MotivoSemMotorista =
  | "sem_sessao"
  | "nao_e_motorista"
  | "sem_cracha"
  | "cracha_ilegivel"
  | "cracha_de_outro"
  | "expirou";

/**
 * O motorista da sessão do login, ou o motivo para voltar a pedir a senha.
 * Só a sessão conta: o nome tem de vir do login e bater com o do crachá
 * (o crachá leva até 40 caracteres do nome), dentro dos dois prazos.
 */
export function motoristaDaSessao(
  sessao: SessaoMotoristaLida | null | undefined,
  agora: number,
): { ok: true; nome: string; prazo: number } | { ok: false; motivo: MotivoSemMotorista } {
  if (!sessao || typeof sessao.name !== "string" || !sessao.name.trim()) return { ok: false, motivo: "sem_sessao" };
  if (sessao.role !== "driver") return { ok: false, motivo: "nao_e_motorista" };
  if (typeof sessao.cracha !== "string" || !sessao.cracha) return { ok: false, motivo: "sem_cracha" };
  const c = lerCracha(sessao.cracha);
  if (!c) return { ok: false, motivo: "cracha_ilegivel" };
  if (c.papel && c.papel !== "driver") return { ok: false, motivo: "nao_e_motorista" };
  const nome = sessao.name.trim();
  if (chaveNome(c.quem) !== chaveNome(nome.substring(0, 40))) return { ok: false, motivo: "cracha_de_outro" };
  const fimSessao = typeof sessao.expiresAt === "number" && Number.isFinite(sessao.expiresAt) ? sessao.expiresAt : Infinity;
  const prazo = Math.min(c.prazo, fimSessao);
  if (agora >= prazo) return { ok: false, motivo: "expirou" };
  return { ok: true, nome, prazo };
}

/**
 * O nome oficial (da lista ?action=motoristas) do motorista do login, ou null.
 * Nunca devolve outro nome: só o que corresponde ao do login.
 */
export function nomeOficial(nomeLogin: string, lista: ReadonlyArray<{ name: string }>): string | null {
  const k = chaveNome(nomeLogin);
  if (!k) return null;
  const m = lista.find((d) => chaveNome(d.name) === k);
  return m ? m.name : null;
}

export type EstadoIdentidade =
  | { estado: "login"; motivo: MotivoSemMotorista }     // volta a pedir a senha
  | { estado: "a_confirmar"; nome: string }              // à espera da lista oficial
  | { estado: "sem_ligacao"; nome: string }              // lista indisponível: nunca mostra viagens
  | { estado: "pede_ajuda"; nome: string }               // não está na lista: «Peça ajuda à gestão»
  | { estado: "ok"; nome: string; prazo: number };       // o motorista do crachá

/** Quem está na app, a partir só da sessão e da lista oficial. */
export function resolverIdentidade(
  sessao: SessaoMotoristaLida | null | undefined,
  lista: ReadonlyArray<{ name: string }> | null,
  listaFalhou: boolean,
  agora: number,
): EstadoIdentidade {
  const m = motoristaDaSessao(sessao, agora);
  if (!m.ok) return { estado: "login", motivo: m.motivo };
  if (!lista) return listaFalhou ? { estado: "sem_ligacao", nome: m.nome } : { estado: "a_confirmar", nome: m.nome };
  const oficial = nomeOficial(m.nome, lista);
  if (!oficial) return { estado: "pede_ajuda", nome: m.nome };
  return { estado: "ok", nome: oficial, prazo: m.prazo };
}

/** O mínimo de um Storage que estas funções usam. */
export interface ArmazemSimples {
  removeItem(k: string): void;
}

/** Apaga o nome guardado e as viagens guardadas (de qualquer motorista). Nunca falha. */
export function apagarDadosMotorista(armazem: ArmazemSimples | null | undefined): void {
  if (!armazem) return;
  for (const k of CHAVES_DADOS_MOTORISTA) {
    try { armazem.removeItem(k); } catch { /* */ }
  }
}
