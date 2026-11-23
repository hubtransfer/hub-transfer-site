// Do cartão (HubViagem) para o que os ecrãs da ajuda mostram.
// Só passam campos escolhidos: nunca a operadora, a referência, o cliente nem o telefone.
import type { HubViagem } from "@/lib/trips";
import { detectTipo, cleanHora, splitLocation, calcDriverPrice, isCanceladaViagem, isNoShowViagem } from "@/lib/trips";
import { rotuloMotorista, categoriaVisivel } from "@/lib/rotuloViagem";
import { podePedirAjuda } from "@/lib/ajuda/regras";
import type { ViagemParaAjuda } from "@/lib/ajuda/cliente";

/** A referência interna da viagem para o HUB-Central (rowIndex). Nunca se mostra. */
export function refDaViagem(v: HubViagem): string {
  return String(v.rowIndex || v.id || "").trim();
}

function nomeDoSitio(raw: string): string {
  const s = splitLocation(raw || "");
  return (s.name || s.full || "").trim();
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
      origem: nomeDoSitio(v.origin),
      destino: nomeDoSitio(v.destination),
      valor: isCanceladaViagem(v) ? 0 : calcDriverPrice(v),
    },
  };
}

export function viagemAceitaAjuda(v: HubViagem): boolean {
  return podePedirAjuda({
    concluida: v.concluida,
    status: v.status,
    statusMotorista: v.statusMotorista,
    cancelada: isCanceladaViagem(v),
    noShow: isNoShowViagem(v),
  });
}
