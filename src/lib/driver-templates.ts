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
      `Oi, ${c}! 👋 Aqui é o ${m}, da HUB Transfer.\nBem-vindo(a) a Portugal! 🇵🇹 Espero que o voo tenha sido tranquilo.\nVou te ajudar a sair do aeroporto sem stress.\n\nEstou enviando a foto abaixo para facilitar chegar no nosso ponto de encontro.\n\nPor favor, me avisa quando:\n1️⃣ Passar pelo controle de passaportes\n2️⃣ Estiver com as malas na mão\n\nTe vejo em breve! Se precisar de algo, pode me enviar uma mensagem. 👍`,
    EN: (c, m) =>
      `Hi ${c}! 👋 I'm ${m}, from HUB Transfer.\nWelcome to Portugal! 🇵🇹 I hope you had a pleasant flight.\nI'm here to make your arrival stress-free.\n\nI'm sending the photo below to help you find our meeting point.\n\nPlease let me know when:\n1️⃣ You pass through passport control\n2️⃣ You have your luggage ready\n\nSee you soon! If you need anything, just send me a message. 👍`,
    ES: (c, m) =>
      `¡Hola, ${c}! 👋 Soy ${m}, de HUB Transfer.\n¡Bienvenido(a) a Portugal! 🇵🇹 Espero que el vuelo haya sido tranquilo.\nTe ayudaré a salir del aeropuerto sin estrés.\n\nTe envío la foto abajo para facilitar que llegues a nuestro punto de encuentro.\n\nPor favor, avísame cuando:\n1️⃣ Pases el control de pasaportes\n2️⃣ Tengas tus maletas contigo\n\n¡Te veo pronto! Si necesitas algo, puedes enviarme un mensaje. 👍`,
    FR: (c, m) =>
      `Bonjour ${c} ! 👋 C'est ${m}, de HUB Transfer.\nBienvenue au Portugal ! 🇵🇹 J'espère que vous avez fait un bon vol.\nJe vais vous aider à quitter l'aéroport sans stress.\n\nJe vous envoie la photo ci-dessous pour vous aider à trouver notre point de rencontre.\n\nMerci de me prévenir quand :\n1️⃣ Vous passez le contrôle des passeports\n2️⃣ Vous avez récupéré vos bagages\n\nÀ très vite ! Si vous avez besoin de quelque chose, envoyez-moi un message. 👍`,
    IT: (c, m) =>
      `Ciao ${c}! 👋 Sono ${m}, di HUB Transfer.\nBenvenuto(a) in Portogallo! 🇵🇹 Spero che il volo sia stato tranquillo.\nTi aiuterò a uscire dall'aeroporto senza stress.\n\nTi invio la foto qui sotto per aiutarti a trovare il nostro punto di incontro.\n\nPer favore, avvisami quando:\n1️⃣ Passi il controllo passaporti\n2️⃣ Hai preso i bagagli\n\nCi vediamo presto! Se hai bisogno di qualcosa, mandami un messaggio. 👍`,
  },
  RECOLHA: {
    PT: (c, m, o, h) =>
      `Olá, ${c}! 👋 Aqui é o ${m}, da HUB Transfer.\nSou o motorista responsável pelo seu transfer de hoje.\n\n📍 Estarei em *${o || "o local combinado"}* no horário combinado: *${h || "—"}*\n\nQuando eu chegar, vou te avisar por aqui! 😄\n\nSe precisar de algo ou houver qualquer alteração, me avise por aqui. 👍`,
    EN: (c, m, o, h) =>
      `Hello, ${c}! 👋 I'm ${m}, from HUB Transfer.\nI'm the driver for your transfer today.\n\n📍 I'll be at *${o || "the agreed location"}* at the scheduled time: *${h || "—"}*\n\nI'll let you know when I arrive! 😄\n\nIf you need anything or there are any changes, just message me here. 👍`,
    ES: (c, m, o, h) =>
      `¡Hola, ${c}! 👋 Soy ${m}, de HUB Transfer.\nSoy el conductor de su transfer de hoy.\n\n📍 Estaré en *${o || "el lugar acordado"}* a la hora acordada: *${h || "—"}*\n\n¡Te avisaré cuando llegue! 😄\n\nSi necesita algo o hay algún cambio, escríbame por aquí. 👍`,
    FR: (c, m, o, h) =>
      `Bonjour ${c} ! 👋 C'est ${m}, de HUB Transfer.\nJe suis le chauffeur pour votre transfert aujourd'hui.\n\n📍 Je serai à *${o || "le lieu convenu"}* à l'heure prévue : *${h || "—"}*\n\nJe vous préviendrai quand j'arriverai ! 😄\n\nSi vous avez besoin de quoi que ce soit, envoyez-moi un message ici. 👍`,
    IT: (c, m, o, h) =>
      `Ciao ${c}! 👋 Sono ${m}, di HUB Transfer.\nSono l'autista per il tuo transfer di oggi.\n\n📍 Sarò a *${o || "il luogo concordato"}* all'orario previsto: *${h || "—"}*\n\nTi avviserò quando arrivo! 😄\n\nSe hai bisogno di qualcosa o ci sono cambiamenti, scrivimi qui. 👍`,
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
