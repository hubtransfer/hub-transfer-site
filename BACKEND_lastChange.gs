/**
 * ============================================================
 *  BACKEND: lastChange (ping leve para polling baseado em eventos)
 *  Cola este código no script.google.com da HUB-Central.
 * ============================================================
 *
 *  SETUP:
 *  1. Abrir a folha HUB-Central no Google Sheets
 *  2. Ir à coluna CZ (coluna 104) e colocar header em CZ1:
 *     "Última Alteração"
 *  3. Colar este código no Apps Script
 *  4. Ctrl+S → Implantar → Nova versão → Implantar
 *
 *  COMO FUNCIONA:
 *  - O frontend faz ping a cada 15s (hotel) / 30s (admin) / 60s (driver)
 *  - O ping chama ?action=lastChange que lê APENAS a célula CZ1
 *  - Se o timestamp não mudou desde o último ping, o frontend não faz nada
 *  - Se mudou, o frontend chama ?action=viagens para obter os dados completos
 *  - Isto reduz drasticamente a quota GAS consumida
 *
 *  ACTUALIZAÇÃO DA CÉLULA:
 *  - updateDriverStatus actualiza CZ1 após gravar os dados do swipe
 *  - resetTrip actualiza CZ1 após limpar as colunas BD-BJ
 *  - Futuramente: addTransfer, flight tracking, etc.
 */

// ============================================================
//  1) Adicionar ao SWITCH do doGet (antes do default):
// ============================================================
//
//  case 'lastChange':
//    var lcSS = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//    var lcSheet = lcSS.getSheetByName('HUB-Central');
//    var lcValue = lcSheet.getRange(1, 104).getValue();
//    return createJsonResponse({ lastChange: lcValue ? lcValue.toString() : '' });
//

// ============================================================
//  2) Função helper (colar no topo do ficheiro):
// ============================================================

/**
 * Actualiza o timestamp de última alteração na célula CZ1.
 * Chamar após qualquer gravação que afecte viagens/status.
 */
function touchLastChange() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName('HUB-Central');
    sheet.getRange(1, 104).setValue(new Date().toISOString());
  } catch (e) {
    Logger.log('[touchLastChange] erro: ' + e);
  }
}

// ============================================================
//  3) Chamar touchLastChange() no fim de updateDriverStatus:
// ============================================================
//
//  function updateDriverStatus(params) {
//    // ... código existente que grava BD-BJ ...
//
//    touchLastChange();  // ← adicionar esta linha no fim, antes do return
//    return createJsonResponse({ success: true });
//  }

// ============================================================
//  4) Chamar touchLastChange() no fim de resetTrip:
// ============================================================
//
//  function resetTrip(params) {
//    // ... código existente que limpa R(18) + BD-BJ(56-62) ...
//
//    touchLastChange();  // ← adicionar esta linha no fim, antes do return
//    return createJsonResponse({ success: true });
//  }
