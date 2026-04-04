/**
 * BACKEND_updateDriverStatus.gs
 * =============================
 * Handler para actualizar o status do motorista via SwipeBar.
 * Adicionar ao doGet() no CONFIG_E_CONSTANTES.gs
 *
 * Recebe: ?action=updateDriverStatus&rowIndex=XX&status=NO_LOCAL&lat=38.7&lng=-9.1&t=XXX
 * Grava nas colunas da planilha HUB-Central:
 *   - BG (col 59) = statusViagem (NO_LOCAL / EM_VIAGEM / FINALIZADO)
 *   - BH (col 60) = latitude
 *   - BI (col 61) = longitude
 *   - BJ (col 62) = timestamp da actualização
 *
 * GERADO EM: 2026-04-04
 */

/*
  case 'updateDriverStatus': {
    var rowIndex = parseInt(e.parameter.rowIndex || '0');
    var status = (e.parameter.status || '').trim();
    var lat = e.parameter.lat || '';
    var lng = e.parameter.lng || '';

    if (!rowIndex || !status) {
      return jsonResponse({ success: false, message: 'rowIndex e status são obrigatórios' });
    }

    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sheet = ss.getSheetByName('HUB-Central') || ss.getSheets()[0];
      var row = rowIndex + 1; // rowIndex is 0-based, sheet is 1-based

      // Verificar se as colunas existem (ajustar índices conforme a planilha)
      // BG=59, BH=60, BI=61, BJ=62 (1-based)
      sheet.getRange(row, 59).setValue(status);           // statusViagem
      sheet.getRange(row, 60).setValue(lat);              // latitude
      sheet.getRange(row, 61).setValue(lng);              // longitude
      sheet.getRange(row, 62).setValue(new Date());       // timestamp

      Logger.log('updateDriverStatus: row=' + row + ' status=' + status + ' lat=' + lat + ' lng=' + lng);

      return jsonResponse({ success: true, message: 'Status actualizado: ' + status });
    } catch (err) {
      Logger.log('updateDriverStatus error: ' + err.toString());
      return jsonResponse({ success: false, message: 'Erro: ' + err.message });
    }
  }
*/

// NOTAS:
// 1. Verificar os índices das colunas BG/BH/BI/BJ na planilha real
// 2. O rowIndex vem do frontend (viagem.rowIndex) — corresponde à linha na planilha
// 3. Se a planilha usar headers diferentes, ajustar os índices
// 4. Os status possíveis são: NO_LOCAL, EM_VIAGEM, FINALIZADO
// 5. As coordenadas podem estar vazias se o GPS não estiver disponível
