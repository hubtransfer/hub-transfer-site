/* Medição da campanha de inverno: consentimento, Pixel da Meta (browser) e eventos para a API de Conversões.
   Nada da Meta é carregado nem enviado sem consentimento. */

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const CHAVE_CONSENTIMENTO = "hub_inverno_cookies";
export const EVENTO_ABRIR_COOKIES = "inv-cookies-abrir";

export type Consentimento = "sim" | "nao" | null;

export function lerConsentimento(): Consentimento {
  try {
    const v = window.localStorage.getItem(CHAVE_CONSENTIMENTO);
    return v === "sim" || v === "nao" ? v : null;
  } catch {
    return null;
  }
}

export function gravarConsentimento(v: "sim" | "nao") {
  try {
    window.localStorage.setItem(CHAVE_CONSENTIMENTO, v);
  } catch {
    /* sem armazenamento (navegação privada): o aviso volta a aparecer na próxima visita */
  }
}

export function novoEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function lerCookie(nome: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Identificadores da Meta para a API de Conversões (_fbp, _fbc ou o fbclid do anúncio). */
export function idsMeta(): { fbp?: string; fbc?: string } {
  const fbp = lerCookie("_fbp");
  let fbc = lerCookie("_fbc");
  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp, fbc };
}

let pixelIniciado = false;

/** Carrega o pixel (só depois do "Aceitar") e regista a visita no browser e no servidor. */
export function iniciarPixel() {
  if (pixelIniciado || !PIXEL_ID) return;
  pixelIniciado = true;

  if (!window.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }

  window.fbq!("init", PIXEL_ID);
  const eventId = novoEventId();
  window.fbq!("track", "PageView", {}, { eventID: eventId });
  void enviarEventoServidor("PageView", eventId);
}

/** Evento no browser, com o mesmo eventID que o servidor envia (a Meta junta os dois). */
export function registarEvento(nome: "Lead" | "CompleteRegistration", eventId: string) {
  if (lerConsentimento() !== "sim" || !window.fbq) return;
  window.fbq("track", nome, {}, { eventID: eventId });
}

async function enviarEventoServidor(evento: "PageView", eventId: string) {
  try {
    await fetch("/api/inverno/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ evento, eventId, url: window.location.href, consentimento: true, ...idsMeta() }),
    });
  } catch {
    /* a medição nunca impede a página de funcionar */
  }
}
