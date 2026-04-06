// Authentication via GAS backend

import { HUB_CENTRAL_URL } from "./trips";

export interface AuthSession {
  name: string;
  role: "admin" | "driver" | "hotel";
  code?: string;
  phone?: string;
  expiresAt?: number; // timestamp — session expires after 8 hours
}

const SESSION_KEY = "hub_session";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    // Validate required fields
    if (!session.name || !session.role) { clearSession(); return null; }
    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) { clearSession(); return null; }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

/** Check session exists AND has the correct role for a route */
export function requireSession(expectedRole: "admin" | "driver" | "hotel"): AuthSession | null {
  const session = getSession();
  if (!session) return null;
  if (session.role !== expectedRole) return null;
  return session;
}

export function setSession(session: AuthSession): void {
  // Add expiry if not set
  if (!session.expiresAt) {
    session.expiresAt = Date.now() + SESSION_TTL;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also set legacy keys for backward compatibility
  if (session.role === "driver") {
    localStorage.setItem("hub_driver_name", session.name);
  } else if (session.role === "hotel") {
    localStorage.setItem("hub_hotel_name", session.name);
    if (session.code) localStorage.setItem("hub_hotel_code", session.code);
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* */ }
  try {
    localStorage.removeItem("hub_driver_name");
    localStorage.removeItem("hub_hotel_name");
    localStorage.removeItem("hub_hotel_code");
  } catch { /* */ }
}

/** Frontend validation before sending to backend */
export function validateLoginInput(name: string, password: string): string | null {
  if (name.trim().length < 2) return "Insira o seu nome.";
  if (password.trim().length < 2) return "Insira a senha.";
  return null;
}

export function getRedirectPath(role: string): string {
  switch (role) {
    case "admin": return "/admin/trips";
    case "driver": return "/driver/trips";
    case "hotel": return "/portal";
    default: return "/login";
  }
}

const LS_ADMIN_EMAIL = "hub_admin_email";

export function getAdminEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_ADMIN_EMAIL) || "";
}

export function setAdminEmail(email: string): void {
  localStorage.setItem(LS_ADMIN_EMAIL, email);
}

/** @deprecated No-op — passwords are validated 100% on the backend */
export function getLocalAdminPassword(): string | null {
  return null;
}

/** @deprecated No-op — passwords are validated 100% on the backend */
export function setLocalAdminPassword(_pwd: string): void {
  // No-op: passwords should never be stored in localStorage
}

export async function validateLogin(
  name: string,
  password: string,
): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
  // Minimal frontend validation
  const validationError = validateLoginInput(name, password);
  if (validationError) return { success: false, message: validationError };

  // 100% backend validation — no localStorage, no blocked lists
  try {
    const url = `${HUB_CENTRAL_URL}?action=validateLogin&name=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (data.success) {
      const session: AuthSession = {
        name: data.name || name,
        role: data.role,
        code: data.code,
        phone: data.phone,
      };
      return { success: true, session };
    }
    return { success: false, message: data.message || "Nome ou senha incorrectos" };
  } catch {
    return { success: false, message: "Erro de conexão. Tente novamente." };
  }
}

// ─── Hotel URL management (backend-first, local fallback) ───

const FALLBACK_HOTEL_URLS: Record<string, string> = {
  ELH: "https://script.google.com/macros/s/AKfycbzt67dsRUlVfhTUHUtpdCUCN6ejEkU_CKlQ-JJ0PLrPboikkHSdWF0_6unIkVykkxxSog/exec",
  EMH: "https://script.google.com/macros/s/AKfycbxiEN9sN8MynFS4DOsfwOqVcB_3y1FobWeOk_Dl8ftJ318LCDixBSi0T82TnNgca_UuEA/exec",
};

/** Fetch hotel URL from backend, fallback to hardcoded if network fails */
export async function fetchHotelUrl(code: string): Promise<string> {
  try {
    const url = `${HUB_CENTRAL_URL}?action=getHotelUrl&code=${encodeURIComponent(code.toUpperCase())}&t=${Date.now()}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.success && data.url) return data.url;
  } catch { /* network error — use fallback */ }
  return FALLBACK_HOTEL_URLS[code.toUpperCase()] || "";
}

/** Synchronous fallback for initial renders (hardcoded only) */
export function getHotelUrlSync(code: string): string {
  return FALLBACK_HOTEL_URLS[code.toUpperCase()] || "";
}

/** Save hotel URL to backend */
export async function saveHotelUrl(
  code: string,
  newUrl: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${HUB_CENTRAL_URL}?action=updateHotelUrl&code=${encodeURIComponent(code.toUpperCase())}&url=${encodeURIComponent(newUrl)}&t=${Date.now()}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return { success: !!data.success, message: data.message || "" };
  } catch {
    return { success: false, message: "Erro de conexão. Tente novamente." };
  }
}

export interface Partner {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  hasPassword?: boolean;
  rowIndex?: string;
}

export interface Hotel {
  code: string;
  name: string;
  hasPassword?: boolean;
  rowIndex?: string;
  gasUrl?: string;
}

export async function getPartners(): Promise<{ drivers: Partner[]; hotels: Hotel[] }> {
  try {
    const url = `${HUB_CENTRAL_URL}?action=getPartners&t=${Date.now()}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return {
      drivers: data.drivers || [],
      hotels: data.hotels || [],
    };
  } catch {
    return { drivers: [], hotels: [] };
  }
}

export async function updatePassword(
  type: "driver" | "hotel",
  rowIndex: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${HUB_CENTRAL_URL}?action=updatePassword&type=${type}&rowIndex=${encodeURIComponent(rowIndex)}&newPassword=${encodeURIComponent(newPassword)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return { success: !!data.success, message: data.message || "" };
  } catch (e) {
    return { success: false, message: "Erro de conexão" };
  }
}
