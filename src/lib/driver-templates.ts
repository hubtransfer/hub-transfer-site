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
      `Olá, ${c}! 👋 Sou o ${m}, da HUB Transfer, o seu motorista de hoje.\nBoas-vindas a Portugal! 🇵🇹 Espero que tenha tido um bom voo.\n\nPode avisar-me assim que tiver as malas consigo? Quando o fizer, envio-lhe a foto do nosso ponto de encontro, para que chegue facilmente até mim.\n\nAté já! Se precisar de alguma coisa, é só escrever-me por aqui.`,
    EN: (c, m) =>
      `Hi ${c}! 👋 I'm ${m}, your driver today from HUB Transfer.\nWelcome to Portugal! 🇵🇹 I hope you had a pleasant flight.\n\nCould you let me know once you have your luggage with you? As soon as you do, I'll send you a photo of our meeting point, so you can find your way to me easily.\n\nSee you very soon! If you need anything, just message me here.`,
    ES: (c, m) =>
      `¡Hola, ${c}! 👋 Soy ${m}, tu conductor de hoy de HUB Transfer.\n¡Bienvenido(a) a Portugal! 🇵🇹 Espero que hayas tenido un buen vuelo.\n\n¿Puedes avisarme en cuanto tengas tus maletas contigo? Cuando lo hagas, te envío una foto de nuestro punto de encuentro, para que llegues fácilmente hasta mí.\n\n¡Nos vemos muy pronto! Si necesitas algo, escríbeme por aquí.`,
    FR: (c, m) =>
      `Bonjour ${c} ! 👋 C'est ${m}, votre chauffeur du jour, de HUB Transfer.\nBienvenue au Portugal ! 🇵🇹 J'espère que vous avez fait un bon vol.\n\nPouvez-vous me prévenir dès que vous avez récupéré vos bagages ? Dès que ce sera fait, je vous envoie une photo de notre point de rencontre, pour que vous me trouviez facilement.\n\nÀ très vite ! Si vous avez besoin de quoi que ce soit, écrivez-moi ici.`,
    IT: (c, m) =>
      `Ciao ${c}! 👋 Sono ${m}, il tuo autista di oggi, di HUB Transfer.\nBenvenuto(a) in Portogallo! 🇵🇹 Spero che tu abbia fatto un buon volo.\n\nPuoi avvisarmi appena hai ritirato i bagagli? Quando lo fai, ti invio una foto del nostro punto d'incontro, così mi trovi facilmente.\n\nA prestissimo! Se hai bisogno di qualcosa, scrivimi qui.`,
  },
  RECOLHA: {
    PT: (c, m, o, h) =>
      `Olá, ${c}! 👋 Sou o ${m}, da HUB Transfer, o seu motorista de hoje.\n\n📍 Estarei em *${o || "o local combinado"}* à hora combinada: *${h}*.\n\nMando-lhe uma mensagem assim que chegar. Se precisar de alguma coisa, é só escrever-me por aqui.`,
    EN: (c, m, o, h) =>
      `Hello, ${c}! 👋 I'm ${m}, your driver today from HUB Transfer.\n\n📍 I'll be at *${o || "the agreed location"}* at the agreed time: *${h}*.\n\nI'll message you as soon as I arrive. If you need anything, just write to me here.`,
    ES: (c, m, o, h) =>
      `¡Hola, ${c}! 👋 Soy ${m}, tu conductor de hoy de HUB Transfer.\n\n📍 Estaré en *${o || "el lugar acordado"}* a la hora acordada: *${h}*.\n\nTe escribo en cuanto llegue. Si necesitas algo, escríbeme por aquí.`,
    FR: (c, m, o, h) =>
      `Bonjour ${c} ! 👋 C'est ${m}, votre chauffeur du jour, de HUB Transfer.\n\n📍 Je serai à *${o || "le lieu convenu"}* à l'heure convenue : *${h}*.\n\nJe vous écris dès que j'arrive. Si vous avez besoin de quoi que ce soit, écrivez-moi ici.`,
    IT: (c, m, o, h) =>
      `Ciao ${c}! 👋 Sono ${m}, il tuo autista di oggi, di HUB Transfer.\n\n📍 Sarò a *${o || "il luogo concordato"}* all'orario concordato: *${h}*.\n\nTi scrivo appena arrivo. Se hai bisogno di qualcosa, scrivimi qui.`,
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
