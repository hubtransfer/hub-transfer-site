/* Opções da ficha de candidatura, partilhadas pelo formulário e pela rota que as valida.
   As marcas e modelos vêm da lista da /inverno (só lida, nunca alterada). */

export { MARCAS, LISTA_MARCAS, OUTRA_MARCA, OUTRO_MODELO } from "../../inverno/_lib/carros";

export const CARROS = ["Próprio", "Alugado ou de frota", "Não tenho"] as const;
export const SIM_NAO = ["Sim", "Não"] as const;
export const INGLES = ["Bem", "Um pouco", "Não"] as const;
export const REGIMES = ["Part-time", "Full-time"] as const;
export const TURNOS = ["Madrugada", "Manhã", "Tarde", "Noite"] as const;
export const LUGARES = ["5", "7"] as const;
export const ANO_MINIMO = 2010;
export const ANTES_2010 = "Antes de 2010";

/** Anos de hoje até 2010, mais "Antes de 2010". */
export function listaAnos(anoAtual = new Date().getFullYear()): string[] {
  const anos: string[] = [];
  for (let a = anoAtual; a >= ANO_MINIMO; a--) anos.push(String(a));
  anos.push(ANTES_2010);
  return anos;
}

export type Respostas = {
  carro: string;
  marca: string;
  modelo: string;
  ano: string;
  lugares: string;
  carta: string;
  aeroporto: string;
  trabalho: string;
  ingles: string;
  regime: string;
  turnos: string[];
};

export const RESPOSTAS_VAZIAS: Respostas = {
  carro: "",
  marca: "",
  modelo: "",
  ano: "",
  lugares: "",
  carta: "",
  aeroporto: "",
  trabalho: "",
  ingles: "",
  regime: "",
  turnos: [],
};
