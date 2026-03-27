// Authentication via GAS backend

import { HUB_CENTRAL_URL } from "./trips";

export interface AuthSession {
  name: string;
  role: "admin" | "driver" | "hotel";
  code?: string;
  phone?: string;
}

const SESSION_KEY = "hub_session";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also set legacy keys for backward compatibility
  if (session.role === "driver") {
    localStorage.setItem("hub_driver_name", session.name);
  } else if (session.role === "hotel") {
    localStorage.setItem("hub_hotel_name", session.name);
    if (session.code) localStorage.setItem("hub_hotel_code", session.code);
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("hub_driver_name");
  localStorage.removeItem("hub_hotel_name");
  localStorage.removeItem("hub_hotel_code");
}

export function getRedirectPath(role: string): string {
  switch (role) {
    case "admin": return "/admin/trips";
    case "driver": return "/driver/trips";
    case "hotel": return "/portal";
    default: return "/login";
  }
}

const LS_ADMIN_PWD = "hub_admin_password";
const LS_ADMIN_EMAIL = "hub_admin_email";

export function getAdminEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_ADMIN_EMAIL) || "";
}

export function setAdminEmail(email: string): void {
  localStorage.setItem(LS_ADMIN_EMAIL, email);
}

export function getLocalAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_ADMIN_PWD);
}

export function setLocalAdminPassword(pwd: string): void {
  localStorage.setItem(LS_ADMIN_PWD, pwd);
}

export async function validateLogin(
  name: string,
  password: string,
): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
  // 1. Check local admin password override first
  const localAdminPwd = getLocalAdminPassword();
  if (localAdminPwd && password === localAdminPwd) {
    const norm = name.toLowerCase().trim();
    // Accept common admin names
    if (norm === "admin" || norm === "junior" || norm === "junior gutierez" || norm === "roberta" || norm === "hub" || norm === "hubtransfer") {
      return { success: true, session: { name, role: "admin" } };
    }
  }

  // 2. Call GAS backend
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
