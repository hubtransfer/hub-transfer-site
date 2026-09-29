// =====================================================
// Google Sheets API Integration (via Google Apps Script)
// =====================================================

import {
  type Transfer,
  WEBAPP_URL,
  TEST_EMAIL,
  normalizeTransfer,
} from "./transfers";
import { getSession, ehHubCentral, crachaPara } from "./auth";
import { comCracha, crachaCampo } from "./cracha";

function getWebAppUrl(): string {
  if (typeof window === "undefined") return WEBAPP_URL;
  // O override "webappUrl" só vale com sessão de hotel activa (cada hotel
  // grava no GAS dele). Sem ela, o valor é resto de uma sessão antiga e
  // mandava as viagens do admin para o script errado — limpa-se e grava-se
  // sempre no HUB Central.
  const session = getSession();
  if (session?.role !== "hotel") {
    try { localStorage.removeItem("webappUrl"); } catch { /* */ }
    return WEBAPP_URL;
  }
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
    const response = await fetch(url + "?action=test" + crachaPara(url), {
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
        body: JSON.stringify(ehHubCentral(url) ? comCracha({ action: "test" }) : { action: "test" }),
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
    await fetch(url + "?ping=true" + crachaPara(url), { method: "GET", mode: "no-cors" });
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "test",
        message: "HUB Transfer funcionando",
        timestamp: new Date().toISOString(),
        ...(ehHubCentral(url) ? crachaCampo() : {}),
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
      `${url}?action=getAllData&_t=${Date.now()}${crachaPara(url)}`,
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

/** Resposta do backend endurecido ao addTransfer. `ok: false` = rede/parse
 *  falhou (a viagem fica local com id provisório). Os restantes campos seguem
 *  o contrato do GAS: transfer.id é o ID que ficou de facto na folha. */
export interface BackendSaveResult {
  ok: boolean;
  sucesso?: boolean;
  status?: string;            // "apagada" — lápide: remover localmente, não reenviar
  reaproveitada?: boolean;    // já existia na folha — adoptar transferId
  desviadaParaNova?: boolean; // id ocupado — adoptar idNovo
  idNovo?: number | string;
  transferId?: number | string;
  motivo?: string;            // "edicao_sem_identidade" | "trava_erro" — não re-tentar
  message?: string;
}

export async function sendToSheets(
  serviceData: Transfer
): Promise<BackendSaveResult> {
  const url = getWebAppUrl();
  if (!url) return { ok: false, message: "URL não configurada" };

  // O id local (tmp-...) nunca segue como definitivo — vai à parte, como
  // idProvisorio, e o backend decide o ID real (guarda de duplicados).
  const { id: idProvisorio, ...dados } = serviceData;

  try {
    // text/plain mantém o pedido "simples" (sem preflight, que o GAS não
    // responde) mas em modo cors a resposta já é legível.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        ...dados,
        idProvisorio,
        emailDestino: TEST_EMAIL,
        action: "addTransfer",
        ...(ehHubCentral(url) ? crachaCampo() : {}),
      }),
      mode: "cors",
      redirect: "follow",
    });

    const text = await response.text();
    const result = JSON.parse(text) as Record<string, unknown>;
    const transfer = result.transfer as Record<string, unknown> | undefined;

    return {
      ok: true,
      sucesso: (result.sucesso ?? result.success) as boolean | undefined,
      status: result.status as string | undefined,
      reaproveitada: result.reaproveitada === true,
      desviadaParaNova: result.desviadaParaNova === true,
      idNovo: result.idNovo as number | string | undefined,
      transferId: transfer?.id as number | string | undefined,
      motivo: result.motivo as string | undefined,
      message: (result.message || result.mensagem) as string | undefined,
    };
  } catch {
    return { ok: false, message: "Sem resposta legível do servidor" };
  }
}
