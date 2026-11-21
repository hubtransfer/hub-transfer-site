// ─────────────────────────────────────────────────────────────
//  rotuloViagem.ts — o rótulo do cartão da viagem (decisão do
//  Junior, 22/11/2026). Funções puras, sem imports: os testes em
//  tests/rotulo-viagem.test.mjs correm-nas com o node, sem build.
//
//  Motorista: «CHEGADA · MPV», «PARTIDA · Sedan», «TRANSFER · Sedan».
//             NUNCA a operadora (código, nome ou referência).
//  Gestor:    «HEY · CHEGADA · MPV» — a operadora à frente.
//  Sem categoriaNome: motorista «CHEGADA»; gestor «HEY · CHEGADA».
// ─────────────────────────────────────────────────────────────

/**
 * Os nomes de categoria que o motorista pode ver (vêm em «categoriaNome»
 * desde a versão 329 do HUB-Central). São iguais em todas as línguas.
 * Lista fechada de propósito: um valor estranho (um erro no backend que
 * metesse lá «Talixo» ou uma referência) nunca chega ao ecrã do motorista.
 * Categoria nova no backend → acrescentar aqui o nome.
 */
export const CATEGORIAS_VISIVEIS = ["Sedan", "MPV", "Business", "Luxo"] as const;

/** No cartão, uma RECOLHA aparece como PARTIDA; os outros tipos ficam iguais. */
export function tipoNoCartao(tipo: string): string {
  const t = String(tipo || "").trim().toUpperCase();
  return t === "RECOLHA" ? "PARTIDA" : t;
}

/** «categoriaNome» já validado contra a lista; "" se vier vazio ou estranho. */
export function categoriaVisivel(categoriaNome: unknown): string {
  const c = String(categoriaNome ?? "").trim().toLowerCase();
  if (!c) return "";
  return CATEGORIAS_VISIVEIS.find((n) => n.toLowerCase() === c) ?? "";
}

/** Rótulo do cartão para o MOTORISTA: tipo + categoria, nunca a operadora. */
export function rotuloMotorista(v: { tipo: string; categoriaNome?: unknown }): string {
  return [tipoNoCartao(v.tipo), categoriaVisivel(v.categoriaNome)].filter(Boolean).join(" · ");
}

/** Rótulo do cartão para o GESTOR: operadora + tipo + categoria. */
export function rotuloGestor(v: { tipo: string; categoriaNome?: unknown; operadora?: string }): string {
  const op = String(v.operadora || "").trim().toUpperCase();
  return [op, rotuloMotorista(v)].filter(Boolean).join(" · ");
}
