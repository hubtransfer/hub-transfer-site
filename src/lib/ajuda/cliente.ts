// ───────────────────────────────────────────────────────────────
//  ajuda/cliente.ts — o cliente da «Ajuda» que a app do motorista usa:
//  o do HUB-Central (hubCentral.ts), com o crachá da sessão.
//
//  Não há interruptor aqui: é o HUB-Central que diz se a ajuda está
//  ligada para este motorista (DESLIGADA ou TESTE sem o nome dele →
//  { ok:false, motivo:"desligada" | "fora_do_teste" } → nada aparece).
//  Ver useAjuda.ts.
//
//  O simulado (dados inventados) só entra na página de demonstração,
//  pelo AjudaClienteContexto — nunca é importado daqui.
// ───────────────────────────────────────────────────────────────
import type { ClienteAjuda } from "./tipos";
import { criarClienteHubCentral } from "./hubCentral";
import { HUB_CENTRAL_URL } from "@/lib/trips";
import { crachaParam, crachaCampo } from "@/lib/cracha";
import { avisarSeRecusada } from "@/lib/motoristaSessao";

export type { ClienteAjuda, ViagemParaAjuda } from "./tipos";

export const clienteHubCentral: ClienteAjuda = criarClienteHubCentral({
  url: HUB_CENTRAL_URL,
  buscar: (url, init) => fetch(url, init),
  crachaParam,
  crachaCampo,
  avisarSessao: (j) => avisarSeRecusada(j),
});
