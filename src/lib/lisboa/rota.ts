/* Tempos de carro entre lugares e ordem do dia.
   Hoje: estimativa pela distância em linha reta (como no protótipo).
   Mais tarde: tempos reais do Google calculados no servidor. Para isso basta passar a `planearDia`
   uma função `tempo` que leia uma tabela pré-calculada (ex.: /api/lisboa/tempos devolve {"a>b": minutos});
   quando um par faltar na tabela, cai na estimativa. Nada no resto da página muda. */

import type { Ponto } from "./tipos";

export type FuncaoTempo = (a: Ponto, b: Ponto) => number;

/** Minutos de carro estimados: distância × 1,35 (as ruas não são retas), 22 km/h na cidade, 55 km/h fora; arredonda a 5 min e soma 5 de estacionar. */
export const tempoEstimado: FuncaoTempo = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h)) * 1.35;
  return Math.max(5, Math.round(((km / (km > 12 ? 55 : 22)) * 60) / 5) * 5 + 5);
};

/** Tabela de tempos reais (chave "lat,lng>lat,lng"), com a estimativa como reserva. */
export function tempoDeTabela(tabela: Record<string, number>): FuncaoTempo {
  const chave = (p: Ponto) => `${p.lat},${p.lng}`;
  return (a, b) => tabela[`${chave(a)}>${chave(b)}`] ?? tempoEstimado(a, b);
}

export type Plano<T extends Ponto> = { paragens: T[]; trajetos: number[]; regresso: number };

export function planearDia<T extends Ponto>(inicio: Ponto, paragens: T[], tempo: FuncaoTempo = tempoEstimado): Plano<T> {
  let pos: Ponto = inicio;
  const trajetos: number[] = [];
  for (const p of paragens) {
    trajetos.push(tempo(pos, p));
    pos = p;
  }
  return { paragens, trajetos, regresso: paragens.length ? tempo(pos, inicio) : 0 };
}

/** «Ordenar pelo caminho mais curto»: vai sempre ao lugar mais perto de onde está (como no protótipo). */
export function ordenarMaisCurto<T extends Ponto>(inicio: Ponto, paragens: T[], tempo: FuncaoTempo = tempoEstimado): T[] {
  const resto = [...paragens];
  const out: T[] = [];
  let pos: Ponto = inicio;
  while (resto.length) {
    resto.sort((a, b) => tempo(pos, a) - tempo(pos, b));
    const prox = resto.shift()!;
    out.push(prox);
    pos = prox;
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatarMin(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? " " + pad(r) : ""}` : `${r} min`;
}

export function somarHora(hhmm: string, m: number): string {
  const [h, mm] = (hhmm || "10:00").split(":").map(Number);
  const t = h * 60 + mm + m;
  return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
}
