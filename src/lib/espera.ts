/**
 * Controlo de espera — leitura do campo `esperaEstado` do action=viagens.
 *
 * O backend (HUB-CENTRAL, PACOTE 11) escreve uma sequência de marcas separadas
 * por " · ", por ordem cronológica. Aqui só se LÊ: nada é inventado, marcas
 * desconhecidas ignoram-se, e se o texto vier vazio não há chip nem painel.
 *
 * Exemplo real:
 *   ESPERA desde 10:25 · incluída até 11:55 · PERG 3 · 11:05 · R1 NÃO 10:46 ·
 *   REGRA TALIXO 10:46 · R2 NÃO 10:56 · EQUIPA 11:16 · R3 SIM 11:20
 */

export type EsperaEvento =
  | { kind: "resposta"; n: number; sim: boolean; hora: string }
  | { kind: "regra"; operadora: string; hora: string }
  | { kind: "equipa"; hora: string }
  | { kind: "mudo"; hora: string }
  | { kind: "ligar"; hora: string }
  | { kind: "limite"; hora: string }
  | { kind: "paga"; hora: string }
  | { kind: "recusou"; hora: string }
  | { kind: "libertado"; hora: string }
  | { kind: "fim"; hora: string; extraMin: number | null; valor: string };

export type EsperaCor = "verde" | "vermelho" | "laranja" | "cinza" | "neutro";

export interface EsperaResposta { n: number; sim: boolean; hora: string }

export interface EsperaInfo {
  vazio: boolean;
  desde: string;             // "ESPERA desde HH:mm"
  incluidaAte: string;       // "incluída até HH:mm"
  perguntas: number;         // "PERG n" — nº da última pergunta
  ultimaPergunta: string;    // hora da última pergunta
  eventos: EsperaEvento[];   // linha do tempo, na ordem do texto
  respostas: EsperaResposta[];
  ultimaResposta: EsperaResposta | null;
  naoCount: number;
  link: string;              // "https://…" do envio do link de pagamento
  semLink: boolean;          // backend escreveu "sem link" (sem provedor)
  terminado: boolean;        // FIM ou LIBERTADO
  horaFim: string;           // hora do FIM/LIBERTADO (fixa o contador)
  pagaDecidida: boolean;     // PAGA / RECUSOU / LIBERTADO / FIM
  podeDecidirPaga: boolean;  // LIGAR ou LIMITE presente e ainda sem decisão
  equipaSemSim: boolean;     // EQUIPA/MUDO sem SIM a seguir
  cor: EsperaCor;
}

const HORA = "(\\d{1,2}:\\d{2})";
const reHora = new RegExp(`^${HORA}$`);
const reDesde = new RegExp(`^ESPERA\\s+desde\\s+${HORA}$`, "i");
const reIncluida = new RegExp(`^inclu[ií]da\\s+at[ée]\\s+${HORA}$`, "i");
const rePerg = /^PERG\s+(\d+)(?:\s+(\d{1,2}:\d{2}))?$/i;
const reResp = new RegExp(`^R(\\d+)\\s+(N[ÃA]O|SIM)\\s+${HORA}$`, "i");
const reRegra = new RegExp(`^REGRA\\s+(.+?)\\s+${HORA}$`, "i");
const reSimples = new RegExp(`^(EQUIPA|MUDO|LIGAR|LIMITE|PAGA|RECUSOU|LIBERTADO|FIM)\\s+${HORA}\\b`, "i");
const reExtra = /^extra\s+(\d+)\s*min$/i;
const reValor = /^€\s*[\d.,]+$/;
const reLink = /^https?:\/\/\S+$/i;

function pad(h: string): string {
  const [hh, mm] = h.split(":");
  return `${hh.padStart(2, "0")}:${mm}`;
}

export function parseEspera(texto: string | undefined | null): EsperaInfo {
  const raw = String(texto ?? "").trim();
  const info: EsperaInfo = {
    vazio: !raw,
    desde: "", incluidaAte: "", perguntas: 0, ultimaPergunta: "",
    eventos: [], respostas: [], ultimaResposta: null, naoCount: 0,
    link: "", semLink: false, terminado: false, horaFim: "",
    pagaDecidida: false, podeDecidirPaga: false, equipaSemSim: false,
    cor: "neutro",
  };
  if (!raw) return info;

  const tokens = raw.split(/\s*·\s*/).map((t) => t.trim()).filter(Boolean);
  let alertaAberto = false; // EQUIPA/MUDO visto sem SIM depois
  let temLigarOuLimite = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    let m: RegExpMatchArray | null;

    if ((m = t.match(reDesde))) { info.desde = pad(m[1]); continue; }
    if ((m = t.match(reIncluida))) { info.incluidaAte = pad(m[1]); continue; }

    if ((m = t.match(rePerg))) {
      info.perguntas = parseInt(m[1], 10) || 0;
      if (m[2]) info.ultimaPergunta = pad(m[2]);
      else if (tokens[i + 1] && reHora.test(tokens[i + 1])) { info.ultimaPergunta = pad(tokens[i + 1]); i++; }
      continue;
    }

    if ((m = t.match(reResp))) {
      const sim = m[2].toUpperCase() === "SIM";
      const r = { n: parseInt(m[1], 10) || info.respostas.length + 1, sim, hora: pad(m[3]) };
      info.respostas.push(r);
      info.eventos.push({ kind: "resposta", ...r });
      if (sim) alertaAberto = false;
      continue;
    }

    if ((m = t.match(reRegra))) {
      info.eventos.push({ kind: "regra", operadora: m[1].trim(), hora: pad(m[2]) });
      continue;
    }

    if ((m = t.match(reSimples))) {
      const kind = m[1].toUpperCase();
      const hora = pad(m[2]);
      switch (kind) {
        case "EQUIPA": info.eventos.push({ kind: "equipa", hora }); alertaAberto = true; break;
        case "MUDO": info.eventos.push({ kind: "mudo", hora }); alertaAberto = true; break;
        case "LIGAR": info.eventos.push({ kind: "ligar", hora }); temLigarOuLimite = true; break;
        case "LIMITE": info.eventos.push({ kind: "limite", hora }); temLigarOuLimite = true; break;
        case "PAGA": info.eventos.push({ kind: "paga", hora }); info.pagaDecidida = true; break;
        case "RECUSOU": info.eventos.push({ kind: "recusou", hora }); info.pagaDecidida = true; break;
        case "LIBERTADO":
          info.eventos.push({ kind: "libertado", hora });
          info.pagaDecidida = true; info.terminado = true; info.horaFim = hora;
          break;
        case "FIM": {
          const ev: EsperaEvento = { kind: "fim", hora, extraMin: null, valor: "" };
          // "FIM HH:mm · extra N min · €X" — os dois seguintes pertencem ao FIM
          while (tokens[i + 1]) {
            const nx = tokens[i + 1];
            const me = nx.match(reExtra);
            if (me) { ev.extraMin = parseInt(me[1], 10); i++; continue; }
            if (reValor.test(nx)) { ev.valor = nx.replace(/\s+/g, ""); i++; continue; }
            break;
          }
          info.eventos.push(ev);
          info.pagaDecidida = true; info.terminado = true; info.horaFim = hora;
          break;
        }
      }
      continue;
    }

    if (reLink.test(t)) { info.link = t; continue; }
    if (/sem\s+link/i.test(t)) { info.semLink = true; continue; }
    // marca desconhecida (ex.: texto do envio do link) — ignora-se
  }

  info.ultimaResposta = info.respostas.length ? info.respostas[info.respostas.length - 1] : null;
  info.naoCount = info.respostas.filter((r) => !r.sim).length;
  info.equipaSemSim = alertaAberto;
  info.podeDecidirPaga = temLigarOuLimite && !info.pagaDecidida;

  if (info.terminado) info.cor = "cinza";
  else if (info.equipaSemSim) info.cor = "laranja";
  else if (info.ultimaResposta) info.cor = info.ultimaResposta.sim ? "verde" : "vermelho";
  else info.cor = "neutro";

  return info;
}

/** HH:mm actual em Lisboa — as horas do backend são Europe/Lisbon. */
export function horaLisboa(agora: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(agora).replace(/^24/, "00");
  } catch {
    return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  }
}

function toMin(h: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(h.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/**
 * Minutos desde o "ESPERA desde". Se já terminou (FIM/LIBERTADO), fixa na
 * hora do fim. Tolera passagem da meia-noite. Sem "desde" → null.
 */
export function esperaMinutos(info: EsperaInfo, agora: Date = new Date()): number | null {
  const ini = toMin(info.desde);
  if (ini === null) return null;
  const fim = toMin(info.terminado && info.horaFim ? info.horaFim : horaLisboa(agora));
  if (fim === null) return null;
  return (fim - ini + 1440) % 1440;
}

/** Texto do chip: "⏳ 55 · ❌ NÃO ×2" / "⏳ 55 · ✅ SIM 11:20" / "⏳ 55 · ❓ ×3". */
export function esperaChipTexto(info: EsperaInfo, agora: Date = new Date()): string {
  const min = esperaMinutos(info, agora);
  const cabeca = min === null ? "⏳" : `⏳ ${min}`;
  const r = info.ultimaResposta;
  if (r) return r.sim ? `${cabeca} · ✅ SIM ${r.hora}` : `${cabeca} · ❌ NÃO ×${info.naoCount}`;
  if (info.perguntas > 0) return `${cabeca} · ❓ ×${info.perguntas}`;
  return cabeca;
}

/** "TALIXO" → "Talixo", "HEYCARS" → "Heycars" (nome vem da marca REGRA …). */
export function nomeOperadora(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
