/**
 * Candidatos Inverno — recebe as pré-inscrições de hubtransfer.pt/inverno.
 *
 * Vive numa folha Google própria ("Candidatos Inverno"), separada da HUB Central.
 * Passo 1: cria a linha e avisa por WhatsApp (Z-API) e por e-mail.
 * Passo 2: completa a mesma linha (carro, marca, modelo, ano, lugares, regime, turnos).
 *
 * Propriedades do script (Definições do projeto → Propriedades do script):
 *   TOKEN              segredo partilhado com o site (o mesmo valor de INSCRICOES_TOKEN no Vercel)
 *   AVISO_EMAIL        e-mail que recebe o aviso
 *   AVISO_WHATSAPP     número que recebe o aviso, só dígitos, com indicativo (ex.: 351912345678)
 *   ZAPI_INSTANCE      instância Z-API
 *   ZAPI_TOKEN         token da instância Z-API
 *   ZAPI_CLIENT_TOKEN  Client-Token da conta Z-API
 * Se faltar alguma das Z-API, o aviso vai só por e-mail.
 */

var SEPARADOR = 'Inscrições';
var CABECALHOS = [
  'Data', 'ID', 'Nome', 'WhatsApp', 'Concelho', 'Carro', 'Marca', 'Modelo', 'Ano', 'Lugares', 'Regime', 'Turnos',
  'Passo', 'Consentimento', 'Página', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'Atualizado', 'Estado'
];

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return resposta({ ok: false, erro: 'json' });
  }
  if (!d.token || d.token !== props.getProperty('TOKEN')) return resposta({ ok: false, erro: 'token' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var folha = obterFolha();
    if (d.acao === 'passo1') {
      if (!procurarLinha(folha, d.leadId)) {        // um reenvio do mesmo passo não duplica a linha
        var agora = new Date();
        folha.appendRow([
          agora, d.leadId, seguro(d.nome), "'" + seguro(d.whatsapp), seguro(d.concelho), '', '', '', '', '', '', '', 1,
          seguro(d.consentimento), seguro(d.pagina), seguro(d.utm_source), seguro(d.utm_medium),
          seguro(d.utm_campaign), seguro(d.utm_content), agora, 'Novo'
        ]);
        avisar(d, folha);
      }
      return resposta({ ok: true });
    }
    if (d.acao === 'passo2') {
      var linha = procurarLinha(folha, d.leadId);
      if (!linha) return resposta({ ok: false, erro: 'id' });
      // colunas 6 a 13: Carro, Marca, Modelo, Ano, Lugares, Regime, Turnos, Passo
      folha.getRange(linha, 6, 1, 8).setValues([[
        seguro(d.carro), seguro(d.marca), seguro(d.modelo), seguro(d.ano), seguro(d.lugares),
        seguro(d.regime), seguro(d.turnos), 2
      ]]);
      folha.getRange(linha, 20).setValue(new Date());           // Atualizado
      return resposta({ ok: true });
    }
    return resposta({ ok: false, erro: 'acao' });
  } finally {
    lock.releaseLock();
  }
}

/** Abrir o endereço do web app no browser deve mostrar {"ok":true}. */
function doGet() {
  return resposta({ ok: true, servico: 'candidatos-inverno' });
}

function obterFolha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var folha = ss.getSheetByName(SEPARADOR) || ss.insertSheet(SEPARADOR);
  if (folha.getLastRow() === 0) {
    folha.appendRow(CABECALHOS);
    folha.setFrozenRows(1);
    folha.getRange(1, 1, 1, CABECALHOS.length).setFontWeight('bold');
  }
  return folha;
}

function procurarLinha(folha, id) {
  if (!id || folha.getLastRow() < 2) return 0;
  var ids = folha.getRange(2, 2, folha.getLastRow() - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === id) return i + 2;
  }
  return 0;
}

/** Texto limpo e sem fórmulas (um valor começado por = + - @ não é executado pela folha). */
function seguro(v) {
  var s = String(v === undefined || v === null ? '' : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function avisar(d, folha) {
  var props = PropertiesService.getScriptProperties();
  var digitos = String(d.whatsapp || '').replace(/\D/g, '');
  if (digitos.length === 9) digitos = '351' + digitos;
  var origem = d.utm_campaign ? '\nCampanha: ' + d.utm_campaign + (d.utm_content ? ' / ' + d.utm_content : '') : '';
  var texto =
    'Nova pré-inscrição de motorista (inverno)\n' +
    'Nome: ' + d.nome + '\n' +
    'WhatsApp: ' + d.whatsapp + ' — https://wa.me/' + digitos + '\n' +
    'Concelho: ' + d.concelho + origem + '\n' +
    'Folha: ' + folha.getParent().getUrl();

  var inst = props.getProperty('ZAPI_INSTANCE');
  var tok = props.getProperty('ZAPI_TOKEN');
  var cli = props.getProperty('ZAPI_CLIENT_TOKEN');
  var para = props.getProperty('AVISO_WHATSAPP');
  if (inst && tok && cli && para) {
    try {
      UrlFetchApp.fetch('https://api.z-api.io/instances/' + inst + '/token/' + tok + '/send-text', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Client-Token': cli },
        payload: JSON.stringify({ phone: para, message: texto }),
        muteHttpExceptions: true
      });
    } catch (err) {
      console.error('Aviso WhatsApp falhou: ' + err);
    }
  }

  var email = props.getProperty('AVISO_EMAIL');
  if (email) {
    try {
      MailApp.sendEmail(email, 'Nova pré-inscrição de motorista: ' + d.nome, texto);
    } catch (err) {
      console.error('Aviso por e-mail falhou: ' + err);
    }
  }
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Correr uma vez no editor para autorizar o script e testar os avisos. */
function testarAviso() {
  avisar({ nome: 'Teste', whatsapp: '912 345 678', concelho: 'Amadora' }, obterFolha());
}
