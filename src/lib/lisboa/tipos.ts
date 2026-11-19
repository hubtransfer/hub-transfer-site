/* Tipos da página «Lisboa à sua mesa» (/lisboa, /en/lisboa, /es/lisboa). */

export const LINGUAS = ["pt", "en", "es"] as const;
export type Lingua = (typeof LINGUAS)[number];

export type TextoLugar = { nome: string; txt: string; hist: string };

export type Lugar = {
  n: number;
  id: string;
  zona: string;
  lat: number;
  lng: number;
  /** minutos sugeridos no local */
  min: number;
  pt: TextoLugar;
  en: TextoLugar;
  es: TextoLugar;
  /** descrição usada para criar as imagens; nunca vai para a página */
  promptImagem?: string;
};

/** [nome, frase] */
export type TextoPrato = [string, string];

export type Prato = {
  n: number;
  pt: TextoPrato;
  en: TextoPrato;
  es: TextoPrato;
};

export type EstiloJantar = {
  id: string;
  pt: TextoPrato;
  en: TextoPrato;
  es: TextoPrato;
};

export type Ponto = { lat: number; lng: number };
