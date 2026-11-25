/* Tipos da página «Lisboa à sua mesa»: /lisboa (inglês), /pt/lisboa, /es/lisboa, /fr/lisboa, /it/lisboa. */

/** Ordem do seletor (a mesma da página inicial). O inglês é a língua principal. */
export const LINGUAS = ["en", "pt", "es", "fr", "it"] as const;
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
  /** tradução por rever (lugares-fr-it.ts) */
  fr: TextoLugar;
  it: TextoLugar;
  /** descrição usada para criar as imagens; nunca vai para a página */
  promptImagem?: string;
};

/** [nome, frase] */
export type TextoPrato = [string, string];

export type Prato = {
  n: number;
  /** endereço da página do prato, igual nas cinco línguas: /lisboa/prato/{slug}, /pt/lisboa/prato/{slug}… */
  slug: string;
  pt: TextoPrato;
  en: TextoPrato;
  es: TextoPrato;
  /** tradução por rever (pratos-fr-it.ts) */
  fr: TextoPrato;
  it: TextoPrato;
  /** 3 ou 4 linhas da página do prato: o que é, como se come, quando sabe melhor */
  sobre: Record<Lingua, string[]>;
};

export type EstiloJantar = {
  id: string;
  pt: TextoPrato;
  en: TextoPrato;
  es: TextoPrato;
  fr: TextoPrato;
  it: TextoPrato;
};

/** As línguas escritas à mão nos ficheiros de dados; o francês e o italiano juntam-se a seguir (traduções por rever). */
export type SemFrIt<T> = Omit<T, "fr" | "it">;

export type Ponto = { lat: number; lng: number };
