/**
 * BACKEND_resetTrip.gs
 * ====================
 * Adicionar ao doGet() no CONFIG_E_CONSTANTES.gs
 *
 * Recebe: ?action=resetTrip&rowIndex=735&t=XXX
 * Limpa as colunas de status do motorista e status da viagem:
 *   - R  (col 18) = status da viagem → vazio
 *   - BG (col 59) = statusViagem do motorista → vazio
 *   - BH (col 60) = latitude → vazio
 *   - BI (col 61) = longitude → vazio
 *   - BJ (col 62) = timestamp → vazio
 *
 * GERADO EM: 2026-04-04
 */

/*
  case 'resetTrip': {
    var rowIndex = parseInt(e.parameter.rowIndex || '0');
    if (!rowIndex) {
      return jsonResponse({ success: false, message: 'rowIndex em falta' });
    }

    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName('HUB-Central') || ss.getSheets()[0];
      var row = rowIndex; // rowIndex já é 1-based do frontend

      // Limpar status da viagem (coluna R = 18)
      sheet.getRange(row, 18).setValue('');

      // Limpar campos de tracking do motorista
      sheet.getRange(row, 59).setValue('');  // BG - statusViagem
      sheet.getRange(row, 60).setValue('');  // BH - latitude
      sheet.getRange(row, 61).setValue('');  // BI - longitude
      sheet.getRange(row, 62).setValue('');  // BJ - timestamp

      Logger.log('resetTrip: row=' + row + ' limpa com sucesso');
      return jsonResponse({ success: true, message: 'Viagem resetada com sucesso' });
    } catch (err) {
      Logger.log('resetTrip error: ' + err.toString());
      return jsonResponse({ success: false, message: 'Erro: ' + err.message });
    }
  }
*/

// NOTAS:
// 1. Verificar se rowIndex no frontend é 0-based ou 1-based
//    Se 0-based, usar: var row = rowIndex + 1;
// 2. Verificar os índices das colunas na planilha real
// 3. Coluna R pode não ser o status — ajustar conforme a planilha
