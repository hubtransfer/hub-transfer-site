// Do cartão (HubViagem) para o que os ecrãs da ajuda mostram.
// Só passam campos escolhidos: nunca a operadora, a referência, o cliente nem o telefone.
import type { HubViagem } from "@/lib/trips";
import { detectTipo, cleanHora, splitLocation, calcDriverPrice, isCanceladaViagem, isNoShowViagem } from "@/lib/trips";
import { rotuloMotorista, categoriaVisivel } from "@/lib/rotuloViagem";
import { podePedirAjuda } from "@/lib/ajuda/regras";
import type { ViagemParaAjuda } from "@/lib/ajuda/cliente";

/**
 * A referência da viagem para o HUB-Central: o ID DA VIAGEM (coluna A,
 * `id` no getViagens) — NÃO o rowIndex, porque as linhas mudam de lugar.
 * Este ID pode trazer a referência da reserva: nunca se mostra nem vai em links.
 * Sem ID → "" (e a viagem não mostra «Ajuda»).
 */
export function refDaViagem(v: HubViagem): string {
  return String(v.id ?? "").trim();
}

function nomeDoSitio(raw: string): string {
  const s = splitLocation(raw || "");
  return (s.name || s.full || "").trim();
}

/** Só o número do voo («TP 1352» → «TP1352»); nada mais do campo. */
function numeroDoVoo(raw: string | undefined): string {
  const m = /\b([A-Z0-9]{2})\s?(\d{1,4}[A-Z]?)\b/i.exec(String(raw ?? "").trim());
  return m ? `${m[1]}${m[2]}`.toUpperCase() : "";
}

export function viagemParaAjuda(v: HubViagem): ViagemParaAjuda {
  const tipo = detectTipo(v.origin || "", v.flight || "", v.type, v.tipoViagem);
  return {
    viagemRef: refDaViagem(v),
    categoria: categoriaVisivel(v.categoriaNome),
    resumo: {
      rotulo: rotuloMotorista({ tipo, categoriaNome: v.categoriaNome }),
      data: String(v.date || v.flightDate || "").trim(),
      hora: cleanHora(v.pickupTime || ""),
      voo: numeroDoVoo(v.flight),
      origem: nomeDoSitio(v.origin),
      destino: nomeDoSitio(v.destination),
      valor: isCanceladaViagem(v) ? 0 : calcDriverPrice(v),
    },
  };
}

export function viagemAceitaAjuda(v: HubViagem): boolean {
  if (!refDaViagem(v)) return false;
  return podePedirAjuda({
    concluida: v.concluida,
    status: v.status,
    statusMotorista: v.statusMotorista,
    cancelada: isCanceladaViagem(v),
    noShow: isNoShowViagem(v),
  });
}
