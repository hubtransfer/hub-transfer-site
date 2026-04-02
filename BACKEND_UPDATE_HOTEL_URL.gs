/**
 * BACKEND_UPDATE_HOTEL_URL.gs
 * ===========================
 * Funções a adicionar ao CONFIG_E_CONSTANTES.gs para gerir URLs dos hotéis.
 *
 * INSTRUÇÕES:
 * 1. No doGet(), adicionar case 'getHotelUrl' (se não existir já)
 * 2. No doPost(), adicionar case 'updateHotelUrl'
 * 3. Adicionar a função auxiliar getOrCreateConfigSheet()
 *
 * A aba "Config_Hotels" no HUB-Central armazena as URLs centralmente.
 * Formato: Código | Nome | URL GAS | Última Actualização
 *
 * GERADO EM: 2026-04-02
 */

// ═══════════════════════════════════════════════
// PASSO 1: Adicionar ao doGet() — case 'getHotelUrl'
// (pode já existir — verificar antes de duplicar)
// ═══════════════════════════════════════════════

/*
  case 'getHotelUrl': {
    var code = (e.parameter.code || '').toUpperCase().trim();
    if (!code) return jsonResponse({ success: false, message: 'Código do hotel em falta' });

    var sheet = getOrCreateConfigSheet();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase().trim() === code) {
        return jsonResponse({ success: true, url: String(data[i][2] || ''), name: String(data[i][1] || '') });
      }
    }

    // Não encontrado — retornar vazio (frontend usa fallback)
    return jsonResponse({ success: true, url: '', name: '' });
  }
*/


// ═══════════════════════════════════════════════
// PASSO 2: Adicionar ao doPost() — case 'updateHotelUrl'
// ═══════════════════════════════════════════════

/*
  case 'updateHotelUrl': {
    var payload = JSON.parse(e.postData.contents || '{}');
    var code = (payload.hotelCode || payload.code || '').toUpperCase().trim();
    var newUrl = (payload.url || '').trim();

    if (!code) return jsonResponse({ success: false, message: 'Código do hotel em falta' });
    if (!newUrl) return jsonResponse({ success: false, message: 'URL em falta' });

    var sheet = getOrCreateConfigSheet();
    var data = sheet.getDataRange().getValues();
    var found = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase().trim() === code) {
        // Actualizar URL existente
        sheet.getRange(i + 1, 3).setValue(newUrl);
        sheet.getRange(i + 1, 4).setValue(new Date().toLocaleString('pt-PT'));
        found = true;
        break;
      }
    }

    if (!found) {
      // Adicionar nova linha
      sheet.appendRow([code, code, newUrl, new Date().toLocaleString('pt-PT')]);
    }

    return jsonResponse({ success: true, message: 'URL guardada com sucesso' });
  }
*/


// ═══════════════════════════════════════════════
// PASSO 3: Função auxiliar — getOrCreateConfigSheet()
// Adicionar como função global no GAS
// ═══════════════════════════════════════════════

/*
function getOrCreateConfigSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Config_Hotels');

  if (!sheet) {
    sheet = ss.insertSheet('Config_Hotels');
    sheet.appendRow(['Código', 'Nome', 'URL GAS', 'Última Actualização']);
    // Formatar header
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#F0D030').setFontColor('#000000');
    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 500);
    sheet.setColumnWidth(4, 180);

    // Pré-popular com hotéis conhecidos
    var hotels = [
      ['ELH', 'Empire Lisbon Hotel', '', ''],
      ['EMH', 'Empire Marques Hotel', '', ''],
      ['GDA', 'Gota d\'Água', '', ''],
      ['LIOZ', 'Hotel Lioz', '', ''],
      ['TEST', 'Teste Sistema Validado', '', ''],
    ];
    for (var i = 0; i < hotels.length; i++) {
      sheet.appendRow(hotels[i]);
    }
  }

  return sheet;
}
*/


// ═══════════════════════════════════════════════
// NOTA: O doGet() existente já pode ter case 'getHotelUrl'
// usando GET params (?action=getHotelUrl&code=ELH).
// Verificar se o case já existe antes de adicionar.
//
// O doPost() pode precisar de parsing do body:
//   var payload = JSON.parse(e.postData.contents || '{}');
//
// Se o doPost usa GET params em vez de body, adaptar:
//   case 'updateHotelUrl': {
//     var code = (e.parameter.code || '').toUpperCase();
//     var newUrl = (e.parameter.url || '');
//     ...
//   }
//
// O frontend actual (saveHotelUrl em auth.ts) usa GET params:
//   ?action=updateHotelUrl&code=ELH&url=https://...
// Portanto o case deve estar no doGet(), não no doPost().
// ═══════════════════════════════════════════════
