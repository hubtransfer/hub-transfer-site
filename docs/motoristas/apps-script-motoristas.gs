/**
 * Candidatos Motoristas — recebe as candidaturas de hubtransfer.pt/motoristas.
 *
 * Projeto Apps Script PRÓPRIO (separado do da /inverno, que fica intacto).
 * Escreve no separador "Candidatos Motoristas" da folha "Candidatos Inverno" e guarda as fotos no Google Drive.
 *
 * Ações (todas com o TOKEN):
 *   passo1     cria a linha (ou atualiza nome/WhatsApp/concelho se a pessoa voltou atrás) e devolve o código HUB-XXXX
 *   respostas  grava as respostas do quiz
 *   foto       guarda uma foto (lado | bagageira) na subpasta da ficha e põe o link na folha
 *   concluir   grava as respostas, confirma as duas fotos, calcula o estado e avisa por WhatsApp e e-mail
 *
 * Propriedades do script (Definições do projeto → Propriedades do script):
 *   TOKEN              segredo partilhado com o site (o mesmo valor de MOTORISTAS_TOKEN no Vercel)
 *   FOLHA_ID           ID da folha "Candidatos Inverno" (o pedaço do endereço entre /d/ e /edit)
 *   AVISO_EMAIL        e-mail que recebe o aviso
 *   AVISO_WHATSAPP     número que recebe o aviso, só dígitos, com indicativo (ex.: 351968698138)
 *   ZAPI_INSTANCE, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN   (se faltar alguma, o aviso vai só por e-mail)
 *   PASTA_FOTOS_ID     criada sozinha na primeira foto; não é preciso preencher
 */

var SEPARADOR = 'Candidatos Motoristas';
var NOME_PASTA = 'Candidaturas Motoristas · Fotos';

var CABECALHOS = [
  'Data', 'Código', 'Nome', 'WhatsApp', 'Concelho',
  'Carro', 'Marca', 'Modelo', 'Ano', 'Lugares',
  'Carta há mais de 1 ano', 'Já faz transfers ou trabalha no aeroporto', 'Outro trabalho ou negócio', 'Inglês',
  'Regime', 'Turnos',
  'Foto de lado', 'Foto da bagageira', 'Pasta das fotos',
  'Estado', 'Prioridade',
  'Consentimento', 'Página', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'Atualizado', 'Estado automático', 'Aviso enviado', 'ID interno'
];

var ESTADOS = [
  'Ficha incompleta', 'Em análise', 'Ver com atenção', 'Selecionado', 'Entrevista marcada',
  'Lista de espera', 'Em formação', 'Ativo', 'Não avança'
];

/** Número da coluna (1, 2, …) pelo nome do cabeçalho. */
function col(nome) {
  var i = CABECALHOS.indexOf(nome);
  if (i < 0) throw new Error('Coluna desconhecida: ' + nome);
  return i + 1;
}

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
  lock.waitLock(20000);
  try {
    var folha = obterFolha();
    if (d.acao === 'passo1') return resposta(passo1(folha, d));

    var linha = procurarLinha(folha, d.leadId);
    if (!linha) return resposta({ ok: false, erro: 'id' });

    if (d.acao === 'respostas') {
      gravarRespostas(folha, linha, d);
      atualizarEstado(folha, linha);
      return resposta({ ok: true });
    }
    if (d.acao === 'foto') return resposta(guardarFoto(folha, linha, d));
    if (d.acao === 'concluir') return resposta(concluir(folha, linha, d));
    return resposta({ ok: false, erro: 'acao' });
  } finally {
    lock.releaseLock();
  }
}

/** Abrir o endereço do web app no browser deve mostrar {"ok":true,...}. */
function doGet() {
  return resposta({ ok: true, servico: 'candidatos-motoristas' });
}

/* ── Ações ── */

function passo1(folha, d) {
  var linha = procurarLinha(folha, d.leadId);
  var agora = new Date();
  if (linha) {
    // a pessoa voltou ao passo 1 e corrigiu algo: atualiza, não duplica
    folha.getRange(linha, col('Nome')).setValue(seguro(d.nome));
    folha.getRange(linha, col('WhatsApp')).setValue("'" + seguro(d.whatsapp));
    folha.getRange(linha, col('Concelho')).setValue(seguro(d.concelho));
    folha.getRange(linha, col('Atualizado')).setValue(agora);
    return { ok: true, codigo: folha.getRange(linha, col('Código')).getValue() };
  }
  var codigo = novoCodigo(folha);
  var v = {};
  v['Data'] = agora;
  v['Código'] = codigo;
  v['Nome'] = seguro(d.nome);
  v['WhatsApp'] = "'" + seguro(d.whatsapp);
  v['Concelho'] = seguro(d.concelho);
  v['Estado'] = 'Ficha incompleta';
  v['Estado automático'] = 'Ficha incompleta';
  v['Consentimento'] = seguro(d.consentimento);
  v['Página'] = seguro(d.pagina);
  v['utm_source'] = seguro(d.utm_source);
  v['utm_medium'] = seguro(d.utm_medium);
  v['utm_campaign'] = seguro(d.utm_campaign);
  v['utm_content'] = seguro(d.utm_content);
  v['Atualizado'] = agora;
  v['ID interno'] = d.leadId;
  folha.appendRow(CABECALHOS.map(function (c) { return v[c] === undefined ? '' : v[c]; }));
  folha.getRange(folha.getLastRow(), col('Estado')).setDataValidation(regraEstados());
  return { ok: true, codigo: codigo };
}

var CAMPOS_RESPOSTAS = [
  ['carro', 'Carro'], ['marca', 'Marca'], ['modelo', 'Modelo'], ['ano', 'Ano'], ['lugares', 'Lugares'],
  ['carta', 'Carta há mais de 1 ano'], ['aeroporto', 'Já faz transfers ou trabalha no aeroporto'],
  ['trabalho', 'Outro trabalho ou negócio'], ['ingles', 'Inglês'], ['regime', 'Regime'], ['turnos', 'Turnos']
];

function gravarRespostas(folha, linha, d) {
  CAMPOS_RESPOSTAS.forEach(function (p) {
    folha.getRange(linha, col(p[1])).setValue(seguro(d[p[0]]));
  });
  folha.getRange(linha, col('Prioridade')).setValue(d.trabalho === 'Sim' ? 'Sim' : '');
  folha.getRange(linha, col('Atualizado')).setValue(new Date());
}

function guardarFoto(folha, linha, d) {
  if (d.tipo !== 'lado' && d.tipo !== 'bagageira') return { ok: false, erro: 'tipo' };
  var bytes;
  try {
    bytes = Utilities.base64Decode(String(d.imagem || ''));
  } catch (err) {
    return { ok: false, erro: 'imagem' };
  }
  if (!bytes.length || bytes.length > 1500000) return { ok: false, erro: 'tamanho' };

  var pasta = pastaDaFicha(folha, linha);
  var nomeFicheiro = d.tipo + '.jpg';
  var antigos = pasta.getFilesByName(nomeFicheiro);
  while (antigos.hasNext()) antigos.next().setTrashed(true); // a pessoa trocou a foto: fica só a última

  var ficheiro = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', nomeFicheiro));
  var coluna = d.tipo === 'lado' ? 'Foto de lado' : 'Foto da bagageira';
  folha.getRange(linha, col(coluna)).setValue(ficheiro.getUrl());
  folha.getRange(linha, col('Pasta das fotos')).setValue(pasta.getUrl());
  folha.getRange(linha, col('Atualizado')).setValue(new Date());
  return { ok: true };
}

function concluir(folha, linha, d) {
  gravarRespostas(folha, linha, d);
  var temFotos = folha.getRange(linha, col('Foto de lado')).getValue() && folha.getRange(linha, col('Foto da bagageira')).getValue();
  if (!temFotos) return { ok: false, erro: 'fotos' };
  var estado = atualizarEstado(folha, linha);

  if (!folha.getRange(linha, col('Aviso enviado')).getValue()) {
    avisar(folha, linha, estado);
    folha.getRange(linha, col('Aviso enviado')).setValue(new Date());
  }
  return { ok: true };
}

/* ── Estado automático ── */

/**
 * Regras (por esta ordem):
 *   Não avança        sem carro, carro anterior a 2010, carta há menos de 1 ano, ou já faz transfers / trabalha no aeroporto
 *   Ficha incompleta  faltam as fotos
 *   Ver com atenção   carro alugado ou de frota
 *   Em análise        todos os outros casos
 */
function calcularEstado(r, temFotos) {
  if (r.carro === 'Não tenho') return 'Não avança';
  if (r.ano === 'Antes de 2010' || r.carta === 'Não' || r.aeroporto === 'Sim') return 'Não avança';
  if (!temFotos) return 'Ficha incompleta';
  if (r.carro === 'Alugado ou de frota') return 'Ver com atenção';
  return 'Em análise';
}

/**
 * Recalcula o estado a partir do que está na folha. Só o muda se ninguém lhe mexeu à mão
 * (o valor atual é igual ao último valor automático); assim nunca apaga uma decisão tua.
 */
function atualizarEstado(folha, linha) {
  var val = function (c) { return String(folha.getRange(linha, col(c)).getValue() || ''); };
  var r = {
    carro: val('Carro'), ano: val('Ano'), carta: val('Carta há mais de 1 ano'),
    aeroporto: val('Já faz transfers ou trabalha no aeroporto')
  };
  var temFotos = !!(val('Foto de lado') && val('Foto da bagageira'));
  var novo = calcularEstado(r, temFotos);
  var atual = val('Estado');
  var ultimoAuto = val('Estado automático');
  if (atual === ultimoAuto || atual === '') {
    folha.getRange(linha, col('Estado')).setValue(novo);
    folha.getRange(linha, col('Estado automático')).setValue(novo);
    return novo;
  }
  return atual;
}

/* ── Folha, código e Drive ── */

function obterFolha() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('FOLHA_ID'));
  var folha = ss.getSheetByName(SEPARADOR);
  if (!folha) folha = ss.insertSheet(SEPARADOR);
  if (folha.getLastRow() === 0) {
    folha.appendRow(CABECALHOS);
    folha.setFrozenRows(1);
    folha.getRange(1, 1, 1, CABECALHOS.length).setFontWeight('bold');
    folha.getRange(2, col('Estado'), folha.getMaxRows() - 1, 1).setDataValidation(regraEstados());
    // colunas técnicas escondidas (servem ao script, não a ti)
    folha.hideColumns(col('Estado automático'), 3);
  }
  return folha;
}

/** A coluna Estado é uma lista: só aceita os valores de ESTADOS. */
function regraEstados() {
  return SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(false).build();
}

function procurarLinha(folha, id) {
  if (!id || folha.getLastRow() < 2) return 0;
  var ids = folha.getRange(2, col('ID interno'), folha.getLastRow() - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === id) return i + 2;
  }
  return 0;
}

/** "HUB-" + 4 letras ou números ao acaso (sem 0/O, 1/I/L), nunca repetido nem sequencial. */
function novoCodigo(folha) {
  var ch = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var existentes = {};
  if (folha.getLastRow() > 1) {
    folha.getRange(2, col('Código'), folha.getLastRow() - 1, 1).getValues().forEach(function (r) { existentes[r[0]] = true; });
  }
  for (var t = 0; t < 50; t++) {
    var c = 'HUB-';
    for (var k = 0; k < 4; k++) c += ch.charAt(Math.floor(Math.random() * ch.length));
    if (!existentes[c]) return c;
  }
  throw new Error('Sem códigos livres');
}

function pastaPrincipal() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PASTA_FOTOS_ID');
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      /* a pasta foi apagada: cria outra */
    }
  }
  var pasta = DriveApp.createFolder(NOME_PASTA);
  props.setProperty('PASTA_FOTOS_ID', pasta.getId());
  return pasta;
}

function pastaDaFicha(folha, linha) {
  var codigo = String(folha.getRange(linha, col('Código')).getValue());
  var mae = pastaPrincipal();
  var it = mae.getFoldersByName(codigo);
  return it.hasNext() ? it.next() : mae.createFolder(codigo);
}

/** Texto limpo e sem fórmulas (um valor começado por = + - @ não é executado pela folha). */
function seguro(v) {
  var s = String(v === undefined || v === null ? '' : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/* ── Aviso de ficha completa ── */

function avisar(folha, linha, estado) {
  var props = PropertiesService.getScriptProperties();
  var val = function (c) { return String(folha.getRange(linha, col(c)).getDisplayValue() || ''); };
  var whatsapp = val('WhatsApp');
  var digitos = whatsapp.replace(/\D/g, '');
  if (digitos.length === 9) digitos = '351' + digitos;
  var carro = [val('Marca'), val('Modelo'), val('Ano')].filter(String).join(' ') +
    (val('Lugares') ? ', ' + val('Lugares') + ' lugares' : '') + ' (' + val('Carro') + ')';
  var origem = val('utm_campaign') ? '\nCampanha: ' + val('utm_campaign') + (val('utm_content') ? ' / ' + val('utm_content') : '') : '';
  var prioridade = val('Prioridade') === 'Sim' ? '\nPrioridade: Sim (tem outro trabalho ou negócio)' : '';

  var texto =
    'Nova candidatura de motorista (ficha completa)\n' +
    'Ficha: ' + val('Código') + '\n' +
    'Nome: ' + val('Nome') + '\n' +
    'WhatsApp: ' + whatsapp + ' — https://wa.me/' + digitos + '\n' +
    'Carro: ' + carro + '\n' +
    'Estado: ' + estado + prioridade + origem + '\n' +
    'Fotos: ' + val('Pasta das fotos') + '\n' +
    'Folha: ' + folha.getParent().getUrl() + '#gid=' + folha.getSheetId();

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
      MailApp.sendEmail(email, 'Nova candidatura de motorista: ' + val('Nome') + ' (' + val('Código') + ')', texto);
    } catch (err) {
      console.error('Aviso por e-mail falhou: ' + err);
    }
  }
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Correr uma vez no editor: autoriza o script (folha, Drive, e-mail, Z-API), cria o separador, a pasta das fotos
 * e uma ficha de teste completa ("Teste HUB"), e envia o aviso. Apaga depois essa linha e a subpasta de teste.
 */
function testarTudo() {
  var folha = obterFolha();
  var leadId = 'teste-' + new Date().getTime();
  var r = passo1(folha, { leadId: leadId, nome: 'Teste HUB', whatsapp: '912 345 678', concelho: 'Amadora', consentimento: 'Teste' });
  var linha = procurarLinha(folha, leadId);
  var pixel = Utilities.base64Decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==');
  guardarFoto(folha, linha, { tipo: 'lado', imagem: Utilities.base64Encode(pixel) });
  guardarFoto(folha, linha, { tipo: 'bagageira', imagem: Utilities.base64Encode(pixel) });
  concluir(folha, linha, { carro: 'Próprio', marca: 'Toyota', modelo: 'Corolla', ano: '2019', lugares: '5', carta: 'Sim', aeroporto: 'Não', trabalho: 'Sim', ingles: 'Bem', regime: 'Part-time', turnos: 'Manhã, Tarde' });
  console.log('Ficha de teste: ' + r.codigo + ' na linha ' + linha);
}
