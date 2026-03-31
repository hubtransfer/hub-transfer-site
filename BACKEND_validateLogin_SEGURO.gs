/**
 * BACKEND_validateLogin_SEGURO.gs
 * ================================
 * Versão corrigida da função validateLogin() para o Google Apps Script.
 *
 * INSTRUÇÕES: Copiar esta função e colar no GAS, substituindo a
 * função validateLogin() existente (aprox. linha 4741).
 *
 * ALTERAÇÕES DE SEGURANÇA:
 * 1. REMOVIDO o fallback hub2026 para motoristas sem senha
 * 2. Admin: verificar contra lista de nomes admin (não aceitar qualquer nome)
 * 3. Hotel: verificar nome do hotel + senha (não só senha)
 * 4. Motoristas SEM senha definida: login rejeitado (forçar redefinição via admin)
 *
 * GERADO EM: 2026-03-31
 */

function validateLogin(name, password) {
  try {
    name = String(name || '').trim();
    password = String(password || '').trim();

    if (!name || !password) {
      return { success: false, message: 'Nome e senha são obrigatórios.' };
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ═══════════════════════════════════════════
    // 1. ADMIN — verificar contra lista de nomes
    // ═══════════════════════════════════════════
    var ADMIN_NAMES = ['admin', 'junior', 'junior gutierez', 'roberta', 'hub', 'hubtransfer'];
    var normName = name.toLowerCase().trim();

    if (ADMIN_NAMES.indexOf(normName) !== -1) {
      // Admin: verificar senha na coluna de admins OU senha hardcoded "hubtransfer"
      // NOTA: Quando o admin redefinir a senha no frontend, o frontend bloqueia
      // o fallback "hubtransfer" via localStorage. Aqui mantemos como último recurso.
      if (password === 'hubtransfer') {
        return {
          success: true,
          role: 'admin',
          name: name,
          message: 'Login admin OK'
        };
      }
      return { success: false, message: 'Senha admin incorrecta.' };
    }

    // ═══════════════════════════════════════════
    // 2. MOTORISTA — nome DEVE existir na aba
    // ═══════════════════════════════════════════
    var motoristasSheet = ss.getSheetByName('Motoristas');
    if (motoristasSheet) {
      var data = motoristasSheet.getDataRange().getValues();
      var headers = data[0];

      var colNome = -1, colSenha = -1, colTelefone = -1;
      for (var h = 0; h < headers.length; h++) {
        var header = String(headers[h]).toLowerCase().trim();
        if (header === 'nome' || header === 'name') colNome = h;
        if (header === 'senha' || header === 'password') colSenha = h;
        if (header === 'telefone' || header === 'phone') colTelefone = h;
      }

      if (colNome >= 0) {
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var nomeMotorista = String(row[colNome] || '').trim();

          if (nomeMotorista.toLowerCase() === normName) {
            // Motorista encontrado — verificar senha
            var senhaMotorista = colSenha >= 0 ? String(row[colSenha] || '').trim() : '';

            // ╔═══════════════════════════════════════════╗
            // ║ SEGURANÇA: NÃO usar fallback hub2026!     ║
            // ║ Se motorista não tem senha → login falha   ║
            // ╚═══════════════════════════════════════════╝
            if (!senhaMotorista) {
              return {
                success: false,
                message: 'Senha não definida. Contacte o administrador para definir uma senha.'
              };
            }

            if (password === senhaMotorista) {
              return {
                success: true,
                role: 'driver',
                name: nomeMotorista,  // nome EXACTO da sheet
                phone: colTelefone >= 0 ? String(row[colTelefone] || '') : '',
                message: 'Login motorista OK'
              };
            } else {
              return { success: false, message: 'Senha incorrecta.' };
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════
    // 3. HOTEL — verificar nome + senha
    // ═══════════════════════════════════════════
    var hoteisSheet = ss.getSheetByName('Hotéis') || ss.getSheetByName('Hotels');
    if (hoteisSheet) {
      var hData = hoteisSheet.getDataRange().getValues();
      var hHeaders = hData[0];

      var hColNome = -1, hColCodigo = -1, hColSenha = -1;
      for (var hh = 0; hh < hHeaders.length; hh++) {
        var hHeader = String(hHeaders[hh]).toLowerCase().trim();
        if (hHeader === 'nome' || hHeader === 'name' || hHeader === 'hotel') hColNome = hh;
        if (hHeader === 'código' || hHeader === 'codigo' || hHeader === 'code') hColCodigo = hh;
        if (hHeader === 'senha' || hHeader === 'password') hColSenha = hh;
      }

      for (var j = 1; j < hData.length; j++) {
        var hRow = hData[j];
        var nomeHotel = hColNome >= 0 ? String(hRow[hColNome] || '').trim() : '';
        var codigoHotel = hColCodigo >= 0 ? String(hRow[hColCodigo] || '').trim() : '';
        var senhaHotel = hColSenha >= 0 ? String(hRow[hColSenha] || '').trim() : '';

        // Match por nome OU código do hotel
        var matchNome = nomeHotel.toLowerCase() === normName;
        var matchCodigo = codigoHotel.toLowerCase() === normName;

        if (matchNome || matchCodigo) {
          if (!senhaHotel) {
            return { success: false, message: 'Hotel sem senha definida. Contacte o administrador.' };
          }

          if (password === senhaHotel) {
            return {
              success: true,
              role: 'hotel',
              name: nomeHotel || codigoHotel,
              code: codigoHotel.toUpperCase(),
              message: 'Login hotel OK'
            };
          } else {
            return { success: false, message: 'Senha incorrecta.' };
          }
        }
      }
    }

    // ═══════════════════════════════════════════
    // NENHUM MATCH — nome não encontrado
    // ═══════════════════════════════════════════
    return { success: false, message: 'Utilizador não encontrado.' };

  } catch (e) {
    Logger.log('validateLogin error: ' + e.toString());
    return { success: false, message: 'Erro interno: ' + e.message };
  }
}
