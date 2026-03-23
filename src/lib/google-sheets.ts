// =====================================================
// Google Sheets API Integration (via Google Apps Script)
// =====================================================

import {
  type Transfer,
  WEBAPP_URL,
  TEST_EMAIL,
  normalizeTransfer,
} from "./transfers";

function getWebAppUrl(): string {
  if (typeof window === "undefined") return WEBAPP_URL;
  const saved = localStorage.getItem("webappUrl");
  return saved?.trim() || WEBAPP_URL;
}

export function saveWebappUrl(url: string): void {
  if (url) localStorage.setItem("webappUrl", url);
}

export async function testConnection(
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl?.trim() || getWebAppUrl();
  if (!url) return { success: false, message: "URL não configurada" };

  try {
    const response = await fetch(url + "?action=test", {
      method: "GET",
      mode: "cors",
    });
    if (response.ok) {
      await response.json();
      saveWebappUrl(url);
      return { success: true, message: "Conexão funcionando perfeitamente!" };
    }
    throw new Error("Resposta não OK");
  } catch {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "test" }),
        mode: "no-cors",
      });
      saveWebappUrl(url);
      return { success: true, message: "Conexão estabelecida (modo limitado)" };
    } catch {
      return { success: false, message: "Erro ao conectar. Verifique a URL e o deploy" };
    }
  }
}

export async function testBasicConnectivity(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = getWebAppUrl();
  try {
    await fetch(url + "?ping=true", { method: "GET", mode: "no-cors" });
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "test",
        message: "HUB Transfer funcionando",
        timestamp: new Date().toISOString(),
      }),
      mode: "no-cors",
    });
    return { success: true, message: "Conectividade OK - Sistema funcionando" };
  } catch (error) {
    return {
      success: false,
      message: `Erro de conectividade: ${error instanceof Error ? error.message : "desconhecido"}`,
    };
  }
}

export async function loadTransfersFromSheets(): Promise<{
  success: boolean;
  data: Transfer[];
  message: string;
}> {
  const url = getWebAppUrl();
  if (!url) {
    return { success: false, data: [], message: "URL do WebApp não configurada" };
  }

  try {
    const response = await fetch(
      `${url}?action=getAllData&_t=${Date.now()}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
        cache: "no-cache",
        redirect: "follow",
      }
    );

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Resposta do servidor não é JSON válido");
    }

    if (!data.success && !data.sucesso) {
      throw new Error(
        (data.error as string) || (data.erro as string) || "Erro ao carregar dados"
      );
    }

    const transfersArray = (data.data || data.dados || []) as Record<string, unknown>[];
    if (!Array.isArray(transfersArray)) {
      return { success: false, data: [], message: "Nenhum dado encontrado no servidor" };
    }

    const normalized = transfersArray.map((t) => normalizeTransfer(t));
    return {
      success: true,
      data: normalized,
      message: `${normalized.length} transfers sincronizados`,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `Erro ao sincronizar: ${error instanceof Error ? error.message : "desconhecido"}`,
    };
  }
}

export async function sendToSheets(
  serviceData: Transfer
): Promise<boolean> {
  const url = getWebAppUrl();
  if (!url) return false;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        ...serviceData,
        emailDestino: TEST_EMAIL,
        action: "addTransfer",
      }),
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}

export async function clearAllDataFromSheets(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = getWebAppUrl();
  if (!url)
    return { success: false, message: "URL não configurada" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clearAllData",
        timestamp: new Date().toISOString(),
      }),
      mode: "cors",
    });
    const result = await response.json();
    if (result.status === "success") {
      return { success: true, message: "Dados limpos no Google Sheets" };
    }
    return { success: false, message: result.message || "Erro desconhecido" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro de conexão",
    };
  }
}

export async function clearTestDataFromSheets(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = getWebAppUrl();
  if (!url)
    return { success: false, message: "URL não configurada" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clearTestData",
        timestamp: new Date().toISOString(),
      }),
      mode: "cors",
    });
    const result = await response.json();
    if (result.status === "success") {
      return { success: true, message: "Dados de teste limpos" };
    }
    return { success: false, message: result.message || "Erro desconhecido" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro de conexão",
    };
  }
}
