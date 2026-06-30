// =====================================================
// Driver WhatsApp/SMS Templates — Smart language + type
// =====================================================

type SupportedLang = "PT" | "EN" | "ES" | "FR" | "IT";
type TripType = "CHEGADA" | "RECOLHA";
type TemplateFn = (cliente: string, motorista: string, origem?: string, hora?: string) => string;

// ─── Detect trip type from origin + backend type ───

const AIRPORT_KW = [
  "aeroporto", "airport", "aeropuerto", "aéroport", "flughafen",
  "terminal", "humberto delgado", "portela", "arrivals", "departures",
];

export function detectTripType(origin: string, type?: string): TripType {
  // Tours use RECOLHA template (pickup-style)
  if (type && /tour/i.test(type)) return "RECOLHA";
  // If origin is airport → CHEGADA (arrival)
  const o = (origin || "").toLowerCase();
  if (AIRPORT_KW.some((kw) => o.includes(kw)) || /\b(lis|opo|fao)\b/i.test(o)) {
    return "CHEGADA";
  }
  return "RECOLHA";
}

// ─── Resolve language with fallback ───

export function getDriverLanguage(language?: string): SupportedLang {
  const supported: SupportedLang[] = ["PT", "EN", "ES", "FR", "IT"];
  const upper = (language || "").toUpperCase().trim();
  if (supported.includes(upper as SupportedLang)) return upper as SupportedLang;
  return "EN";
}

// ─── Templates ───

export const DRIVER_TEMPLATES: Record<TripType, Record<SupportedLang, TemplateFn>> = {
  CHEGADA: {
    PT: (c, m) =>
      `Olá, ${c}! 👋 Sou o ${m}, da HUB Transfer, o seu motorista de hoje.\nBoas-vindas a Portugal! 🇵🇹 Espero que tenha tido um bom voo.\n\nEnvio-lhe abaixo uma foto do nosso ponto de encontro, para que chegue facilmente até mim.\n\nQuando puder, avise-me assim que:\n1️⃣ Passar o controlo de passaportes\n2️⃣ Tiver as malas consigo\n\nAté já! Se precisar de alguma coisa, é só escrever-me por aqui.`,
    EN: (c, m) =>
      `Hi ${c}! 👋 I'm ${m}, your driver today from HUB Transfer.\nWelcome to Portugal! 🇵🇹 I hope you had a pleasant flight.\n\nI'm sending a photo of our meeting point below, so you can find your way to me easily.\n\nWhen you can, just let me know once you've:\n1️⃣ Cleared passport control\n2️⃣ Got your luggage with you\n\nSee you very soon! If you need anything, just message me here.`,
    ES: (c, m) =>
      `¡Hola, ${c}! 👋 Soy ${m}, tu conductor de hoy de HUB Transfer.\n¡Bienvenido(a) a Portugal! 🇵🇹 Espero que hayas tenido un buen vuelo.\n\nTe envío abajo una foto de nuestro punto de encuentro, para que llegues fácilmente hasta mí.\n\nCuando puedas, avísame en cuanto:\n1️⃣ Pases el control de pasaportes\n2️⃣ Tengas tus maletas contigo\n\n¡Nos vemos muy pronto! Si necesitas algo, escríbeme por aquí.`,
    FR: (c, m) =>
      `Bonjour ${c} ! 👋 C'est ${m}, votre chauffeur du jour, de HUB Transfer.\nBienvenue au Portugal ! 🇵🇹 J'espère que vous avez fait un bon vol.\n\nJe vous envoie ci-dessous une photo de notre point de rencontre, pour que vous me trouviez facilement.\n\nQuand vous pourrez, prévenez-moi dès que :\n1️⃣ Vous avez passé le contrôle des passeports\n2️⃣ Vous avez récupéré vos bagages\n\nÀ très vite ! Si vous avez besoin de quoi que ce soit, écrivez-moi ici.`,
    IT: (c, m) =>
      `Ciao ${c}! 👋 Sono ${m}, il tuo autista di oggi, di HUB Transfer.\nBenvenuto(a) in Portogallo! 🇵🇹 Spero che tu abbia fatto un buon volo.\n\nTi invio qui sotto una foto del nostro punto d'incontro, così mi trovi facilmente.\n\nQuando puoi, avvisami appena:\n1️⃣ Hai passato il controllo passaporti\n2️⃣ Hai ritirato i bagagli\n\nA prestissimo! Se hai bisogno di qualcosa, scrivimi qui.`,
  },
  RECOLHA: {
    PT: (c, m, o, h) =>
      `Olá, ${c}! 👋 Sou o ${m}, da HUB Transfer, o seu motorista de hoje.\n\n📍 Estarei em *${o}* à hora combinada: *${h}*.\n\nMando-lhe uma mensagem assim que chegar. Se precisar de alguma coisa ou houver qualquer alteração, é só escrever-me por aqui.`,
    EN: (c, m, o, h) =>
      `Hello, ${c}! 👋 I'm ${m}, your driver today from HUB Transfer.\n\n📍 I'll be at *${o}* at the agreed time: *${h}*.\n\nI'll message you as soon as I arrive. If you need anything or there's any change, just write to me here.`,
    ES: (c, m, o, h) =>
      `¡Hola, ${c}! 👋 Soy ${m}, tu conductor de hoy de HUB Transfer.\n\n📍 Estaré en *${o}* a la hora acordada: *${h}*.\n\nTe escribo en cuanto llegue. Si necesitas algo o hay algún cambio, escríbeme por aquí.`,
    FR: (c, m, o, h) =>
      `Bonjour ${c} ! 👋 C'est ${m}, votre chauffeur du jour, de HUB Transfer.\n\n📍 Je serai à *${o}* à l'heure convenue : *${h}*.\n\nJe vous écris dès que j'arrive. Si vous avez besoin de quoi que ce soit ou en cas de changement, écrivez-moi ici.`,
    IT: (c, m, o, h) =>
      `Ciao ${c}! 👋 Sono ${m}, il tuo autista di oggi, di HUB Transfer.\n\n📍 Sarò a *${o}* all'orario concordato: *${h}*.\n\nTi scrivo appena arrivo. Se hai bisogno di qualcosa o c'è qualche cambiamento, scrivimi qui.`,
  },
};

// ─── Generate WhatsApp URL ───

export interface TripData {
  phone: string;
  client: string;
  origin: string;
  destination: string;
  pickupTime: string;
  type?: string;
  language: string;
}

export function generateDriverWhatsAppURL(trip: TripData, driverName: string): string {
  const tripType = detectTripType(trip.origin, trip.type);
  const lang = getDriverLanguage(trip.language);
  const fn = DRIVER_TEMPLATES[tripType][lang];
  const hora = cleanTime(trip.pickupTime);
  const msg = fn(trip.client, driverName, trip.origin, hora);
  const phone = trip.phone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function generateDriverSmsURL(trip: TripData, driverName: string): string {
  const tripType = detectTripType(trip.origin, trip.type);
  const lang = getDriverLanguage(trip.language);
  const fn = DRIVER_TEMPLATES[tripType][lang];
  const hora = cleanTime(trip.pickupTime);
  const msg = fn(trip.client, driverName, trip.origin, hora);
  const phone = trip.phone.replace(/\D/g, "");
  return `sms:${phone}?&body=${encodeURIComponent(msg)}`;
}

function cleanTime(h: string): string {
  if (!h) return "—";
  const m = String(h).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : h.slice(0, 5) || "—";
}
