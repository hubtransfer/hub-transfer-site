/* Lista dos restaurantes recomendados para o «Mudar» do formulário da mesa (E8) — só no servidor (lê as imagens).
   Miniatura: a fotografia do restaurante (campo foto, quando houver parceria) ou a do prato principal desse
   restaurante; nos restaurantes «com vista», a de um lugar nosso dessa zona. Sem preços e sem a forma de reservar. */

import { imagensLugar, imagensPrato } from "./imagens";
import { PRATOS } from "./pratos";
import { LUGAR_DA_VISTA, RESTAURANTES } from "./restaurantes";
import { TEXTOS } from "./textos";
import type { Lingua } from "./tipos";

export type RestauranteLista = { codigo: string; nome: string; bairro: string; pratos: string; foto?: string };

export function listaRestaurantes(lingua: Lingua): RestauranteLista[] {
  return RESTAURANTES.map((r) => {
    const numeros = r.pratos.filter((p): p is number => typeof p === "number");
    const nomes = numeros.map((n) => PRATOS.find((p) => p.n === n)?.[lingua][0]).filter(Boolean) as string[];
    if (r.pratos.includes("vista")) nomes.push(TEXTOS[lingua].vT);
    const foto =
      r.foto ?? (numeros.length ? imagensPrato(numeros[0])[0] : LUGAR_DA_VISTA[r.codigo] ? imagensLugar(LUGAR_DA_VISTA[r.codigo])[0] : undefined);
    return { codigo: r.codigo, nome: r.nome, bairro: r.bairro, pratos: nomes.join(" · "), foto };
  });
}
