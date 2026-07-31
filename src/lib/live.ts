// LIVE — feed liveHotel do HUB Central (GAS)
// Feed sem preços por contrato: nunca inventar campos de dinheiro aqui.

import { HUB_CENTRAL_URL } from "./trips";

// ── Tipos do feed ────────────────────────────────────────────

export interface LivePasso {
  chave: string;   // ex.: AGENDADA / A_CAMINHO / NO_LOCAL / EM_VIAGEM / FIM / NO_SHOW
  rotulo: string;  // rótulo humano vindo do backend
  n: number;       // 1..5 — último passo CONFIRMADO
}

export interface LiveTsPassos {
  acaminho?: string;
  nolocal?: string;
  emviagem?: string;
  fim?: string;
}

export interface LivePos {
  min: number;   // minutos desde a última posição conhecida
  maps: string;  // link Google Maps
}

export interface LiveViagem {
  cliente: string;
  dia: string;
  hora: string;
  voo?: string;
  rota?: string;
  motorista?: string;
  passo: LivePasso;
  tsPassos?: LiveTsPassos;
  pos?: LivePos | null;
  plataforma?: string;
}

export interface LivePing {
  ok: boolean;
  h?: string;
  quente?: boolean;
  erro?: string;
}

export interface LiveFeed {
  ok: boolean;
  sigla?: string;
  atualizado?: string;
  viagens?: LiveViagem[];
  erro?: string;
}

// ── Fetch ────────────────────────────────────────────────────

function liveUrl(codigo: string, senha: string, formato: "ping" | "json"): string {
  return `${HUB_CENTRAL_URL}?action=liveHotel&codigo=${encodeURIComponent(codigo)}&senha=${encodeURIComponent(senha)}&formato=${formato}&t=${Date.now()}`;
}

export async function fetchLivePing(codigo: string, senha: string): Promise<LivePing> {
  const res = await fetch(liveUrl(codigo, senha, "ping"), { redirect: "follow" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as LivePing;
}

export async function fetchLiveJson(codigo: string, senha: string): Promise<LiveFeed> {
  const res = await fetch(liveUrl(codigo, senha, "json"), { redirect: "follow" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as LiveFeed;
}

// ── Credencial do LIVE (sessionStorage — morre ao fechar o separador) ──
// A sessão de login (hub_session) NÃO guarda senha por política do auth.ts.
// O LIVE pede a senha uma vez por separador e guarda-a aqui, isolada.

const LIVE_CRED_KEY = "hub_live_cred";

export function getLiveCred(codigo: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LIVE_CRED_KEY);
    if (!raw) return null;
    const cred = JSON.parse(raw) as { codigo?: string; senha?: string };
    if (cred.codigo === codigo && cred.senha) return cred.senha;
    return null;
  } catch {
    return null;
  }
}

export function setLiveCred(codigo: string, senha: string): void {
  try { sessionStorage.setItem(LIVE_CRED_KEY, JSON.stringify({ codigo, senha })); } catch { /* */ }
}

export function clearLiveCred(): void {
  try { sessionStorage.removeItem(LIVE_CRED_KEY); } catch { /* */ }
}

// ── Helpers de apresentação ──────────────────────────────────

/** 5 pontos da faixa. tsKey liga cada ponto ao campo de tsPassos. */
export const LIVE_STEPS: { label: string; tsKey: keyof LiveTsPassos | null }[] = [
  { label: "Agendada", tsKey: null },
  { label: "A caminho", tsKey: "acaminho" },
  { label: "No local", tsKey: "nolocal" },
  { label: "Cliente a bordo", tsKey: "emviagem" },
  { label: "Concluída", tsKey: "fim" },
];

/**
 * Mapeia o statusMotorista do feed `viagens` (BD/56) para o passo da faixa.
 * Aliases aceites: CHEGOU→NO_LOCAL, CLIENTE_COMIGO→EM_VIAGEM.
 * NO_SHOW: carro parado no ponto 3 ("No local"), vermelho — nunca até ao fim.
 */
export function statusMotoristaToPasso(status?: string): { n: number; noShow: boolean } {
  const u = (status || "").toUpperCase().replace(/[^A-Z]+/g, "_");
  if (u.includes("NO_SHOW") || u.replace(/_/g, "").includes("NOSHOW")) return { n: 3, noShow: true };
  if (u.includes("FINALIZADO") || u.includes("FINALIZOU") || u.includes("CONCLUIDA")) return { n: 5, noShow: false };
  if (u.includes("EM_VIAGEM") || u.includes("CLIENTE_COMIGO") || u.includes("INICIOU")) return { n: 4, noShow: false };
  if (u.includes("NO_LOCAL") || u.includes("CHEGOU")) return { n: 3, noShow: false };
  if (u.includes("A_CAMINHO")) return { n: 2, noShow: false };
  return { n: 1, noShow: false }; // AGUARDANDO / vazio → Agendada
}

/** Rótulo do passo ACTUAL (um só — para a faixa compacta em telemóvel). */
export function rotuloPassoAtual(n: number, noShow?: boolean): { texto: string; cor: string } {
  if (noShow) return { texto: "🚫 Cliente não compareceu", cor: "#EF4444" };
  if (n >= 5) return { texto: "✅ Concluída", cor: "#4CAF50" };
  if (n === 4) return { texto: "🧳 Cliente a bordo", cor: "#D4A017" };
  if (n === 3) return { texto: "📍 No local", cor: "#D4A017" };
  if (n === 2) return { texto: "🚗 A caminho", cor: "#D4A017" };
  return { texto: "🕐 Agendada", cor: "#9CA3AF" };
}

export function isNoShow(v: LiveViagem): boolean {
  const chave = (v.passo?.chave || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (chave.includes("NOSHOW")) return true;
  return (v.passo?.rotulo || "").toLowerCase().includes("não compareceu");
}

/** Normaliza um timestamp do feed para HH:MM (aceita ISO ou texto com hora). */
export function tsToHora(ts?: string): string {
  if (!ts) return "";
  const m = ts.match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function firstName(nome?: string): string {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

/** Separa o feed em HOJE e AMANHÃ pelo campo `dia`. */
export function splitDia(viagens: LiveViagem[]): { hoje: LiveViagem[]; amanha: LiveViagem[] } {
  const hoje: LiveViagem[] = [];
  const amanha: LiveViagem[] = [];
  const d = new Date();
  const hojeFmt = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  for (const v of viagens) {
    const dia = (v.dia || "").toUpperCase();
    if (dia.includes("AMAN")) { amanha.push(v); continue; }
    if (dia.includes("HOJE")) { hoje.push(v); continue; }
    const data = dia.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];
    if (data && data !== hojeFmt) { amanha.push(v); continue; }
    hoje.push(v);
  }
  const byHora = (a: LiveViagem, b: LiveViagem) => (a.hora || "").localeCompare(b.hora || "");
  hoje.sort(byHora);
  amanha.sort(byHora);
  return { hoje, amanha };
}
