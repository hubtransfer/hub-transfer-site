import type { LandingLang } from "./landing-translations";

/* ==================================================================
   REVIEWS REAIS DO GOOGLE — HUB Transfer
   ------------------------------------------------------------------
   REGRA DE INTEGRIDADE (inegociável):
   - Os textos originais são COPIADOS EXATAMENTE do Google.
     Pontuação irregular, espaços, maiúsculas e emojis fazem parte
     do original e NÃO se alteram. Cortes só com "…".
   - As traduções são estáticas e curadas manualmente (sem APIs).
     Não gerar novas nem editar as existentes.
   - Um review sem texto confirmado tem active:false e fica FORA do
     render (ver Nehoony John).
   ================================================================== */

export type ReviewLang = "en" | "pt" | "es" | "fr" | "it";

export interface ReviewItem {
  id: string;
  name: string;
  initials: string;
  /** Língua original do texto — determina a bandeira do card. */
  lang: ReviewLang;
  /** Texto original EXATO do Google. Nunca traduzir/editar. */
  text: string;
  /** Traduções curadas para as restantes línguas do site. */
  translations: Partial<Record<ReviewLang, string>>;
  /** Rótulo de objeção traduzido (chave em landing-translations). */
  objKey?:
    | "reviewObjFeatured"
    | "reviewObjAirport"
    | "reviewObjRoundtrip"
    | "reviewObjSafe"
    | "reviewObjPunctual";
  /** Rótulo de objeção fixo (prova multilingue — igual em todos os idiomas). */
  objFixed?: string;
  /** Se false, não é renderizado (texto ainda não confirmado). */
  active: boolean;
}

/* Nome de cada língua, na língua ativa do site — para aria-label
   "Avaliação escrita em inglês" / "Review written in English" / etc. */
export const LANG_NAMES: Record<LandingLang, Record<ReviewLang, string>> = {
  PT: { en: "inglês", pt: "português", es: "espanhol", fr: "francês", it: "italiano" },
  EN: { en: "English", pt: "Portuguese", es: "Spanish", fr: "French", it: "Italian" },
  ES: { en: "inglés", pt: "portugués", es: "español", fr: "francés", it: "italiano" },
  FR: { en: "anglais", pt: "portugais", es: "espagnol", fr: "français", it: "italien" },
  IT: { en: "inglese", pt: "portoghese", es: "spagnolo", fr: "francese", it: "italiano" },
};

/** Converte a língua ativa do site (uppercase) para o código do review (lowercase). */
export function siteLangToReviewLang(lang: LandingLang): ReviewLang {
  return lang.toLowerCase() as ReviewLang;
}

/** Link do perfil Google (destino de "Ver todas as avaliações →"). */
export const GOOGLE_PROFILE_URL = "https://maps.app.goo.gl/Ngfah6uG74qhUCPe6";

/* ------------------------------------------------------------------
   FEATURED — card de destaque (largura maior, primeiro elemento)
   ------------------------------------------------------------------ */
export const FEATURED_REVIEW: ReviewItem = {
  id: "becky-fitzpatrick",
  name: "Becky Fitzpatrick",
  initials: "BF",
  lang: "en",
  text: "Taxi service was amazing. Our flight was delayed, but he was there exactly where he messaged to say he would be (photos included in directions) and he had phoned multiple times to make sure we were heading in the right direction. Drive to the hotel was in good time but relaxing.",
  translations: {
    pt: "O serviço de táxi foi fantástico. O nosso voo atrasou, mas ele estava exatamente onde tinha indicado por mensagem (com fotos nas indicações) e telefonou várias vezes para garantir que íamos na direção certa. A viagem até ao hotel foi rápida e tranquila.",
    es: "El servicio de taxi fue increíble. Nuestro vuelo se retrasó, pero él estaba exactamente donde había indicado por mensaje (con fotos en las indicaciones) y llamó varias veces para asegurarse de que íbamos en la dirección correcta. El trayecto hasta el hotel fue rápido y relajante.",
    fr: "Le service de taxi était formidable. Notre vol a été retardé, mais il était exactement là où il l'avait indiqué par message (photos incluses dans les indications) et il a appelé plusieurs fois pour s'assurer que nous allions dans la bonne direction. Le trajet jusqu'à l'hôtel a été rapide et reposant.",
    it: "Il servizio taxi è stato fantastico. Il nostro volo era in ritardo, ma lui era esattamente dove aveva indicato per messaggio (foto incluse nelle indicazioni) e ha telefonato più volte per assicurarsi che stessimo andando nella direzione giusta. Il viaggio fino all'hotel è stato rapido ma rilassante.",
  },
  objKey: "reviewObjFeatured",
  active: true,
};

/* ------------------------------------------------------------------
   GRELHA — ordem fixa. Cards 5-7 (Patrizia/Ruth/Zoë) formam a prova
   multilingue e ficam juntos na última fila do desktop.
   ------------------------------------------------------------------ */
export const GRID_REVIEWS: ReviewItem[] = [
  {
    id: "sue-foo",
    name: "Sue Foo",
    initials: "SF",
    lang: "en",
    text: "The driver, Junior Gutierez, was waiting for us at the airport. He gave clear instructions on how to connect prior to our flight. …",
    translations: {
      pt: "O motorista, Junior Gutierez, estava à nossa espera no aeroporto. Antes do voo, deu instruções claras sobre como nos encontraríamos. …",
      es: "El conductor, Junior Gutierez, nos estaba esperando en el aeropuerto. Antes del vuelo, nos dio instrucciones claras sobre cómo encontrarnos. …",
      fr: "Le chauffeur, Junior Gutierez, nous attendait à l'aéroport. Avant le vol, il nous a donné des instructions claires pour nous retrouver. …",
      it: "L'autista, Junior Gutierez, ci stava aspettando in aeroporto. Prima del volo ci ha dato istruzioni chiare su come incontrarci. …",
    },
    objKey: "reviewObjAirport",
    active: true,
  },
  {
    id: "julie-bellifemine",
    name: "Julie Bellifemine",
    initials: "JB",
    lang: "en",
    text: "Had an amazing experience with this company, used for both arrival and departure transfers to Airport and was seamless. …",
    translations: {
      pt: "Tive uma experiência fantástica com esta empresa, usei-a nos transfers de chegada e de partida do aeroporto e correu tudo na perfeição. …",
      es: "Tuve una experiencia increíble con esta empresa, la usé para los traslados de llegada y salida al aeropuerto y todo fue impecable. …",
      fr: "J'ai eu une expérience formidable avec cette entreprise, pour les transferts à l'arrivée comme au départ de l'aéroport, et tout s'est déroulé sans accroc. …",
      it: "Ho avuto un'esperienza fantastica con questa azienda, l'ho usata per i transfer di arrivo e di partenza dall'aeroporto ed è andato tutto alla perfezione. …",
    },
    objKey: "reviewObjRoundtrip",
    active: true,
  },
  {
    // Texto ainda NÃO confirmado → fora do render. Ativar quando o texto exato for colado.
    id: "nehoony-john",
    name: "Nehoony John",
    initials: "NJ",
    lang: "pt",
    text: "",
    translations: {},
    objKey: "reviewObjSafe",
    active: false,
  },
  {
    id: "karin-v",
    name: "Karin V",
    initials: "KV",
    lang: "en",
    text: "On time, welcoming, professional. Would book again.",
    translations: {
      pt: "Pontual, acolhedor, profissional. Voltaria a reservar.",
      es: "Puntual, acogedor, profesional. Volvería a reservar.",
      fr: "Ponctuel, accueillant, professionnel. Je réserverais à nouveau.",
      it: "Puntuale, accogliente, professionale. Prenoterei di nuovo.",
    },
    objKey: "reviewObjPunctual",
    active: true,
  },
  {
    id: "patrizia-alivernini",
    name: "Patrizia Alivernini",
    initials: "PA",
    lang: "it",
    text: "Driver professionale, amichevole, puntualissimo, consiglio!!",
    translations: {
      pt: "Motorista profissional, simpático, pontualíssimo, recomendo!!",
      en: "Professional, friendly, extremely punctual driver — I recommend!!",
      es: "Conductor profesional, amable, puntualísimo, ¡lo recomiendo!",
      fr: "Chauffeur professionnel, sympathique, d'une ponctualité irréprochable, je recommande !!",
    },
    objFixed: "PUNTUALISSIMO",
    active: true,
  },
  {
    id: "ruth-fontaneda",
    name: "Ruth Fontaneda",
    initials: "RF",
    lang: "es",
    text: "Un conductor muy amable . Un buen servicio. Gracias",
    translations: {
      pt: "Um motorista muito simpático. Um bom serviço. Obrigada.",
      en: "A very friendly driver. Good service. Thank you.",
      fr: "Un chauffeur très aimable. Un bon service. Merci.",
      it: "Un autista molto gentile. Un buon servizio. Grazie.",
    },
    objFixed: "BUEN SERVICIO",
    active: true,
  },
  {
    id: "zoe-hermans",
    name: "Zoë Hermans",
    initials: "ZH",
    lang: "fr",
    text: "Un service très agréable et une excellente communication. Je recommande vivement ! 😊",
    translations: {
      pt: "Um serviço muito agradável e uma excelente comunicação. Recomendo vivamente! 😊",
      en: "A very pleasant service and excellent communication. I highly recommend! 😊",
      es: "Un servicio muy agradable y una excelente comunicación. ¡Lo recomiendo encarecidamente! 😊",
      it: "Un servizio molto piacevole e un'ottima comunicazione. Lo consiglio vivamente! 😊",
    },
    objFixed: "COMMUNICATION",
    active: true,
  },
];
