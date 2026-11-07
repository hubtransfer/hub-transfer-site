/**
 * Candidatos Motoristas — recebe as candidaturas de hubtransfer.pt/motoristas.
 *
 * Projeto Apps Script PRÓPRIO, ligado à folha "Candidatos Motoristas" (Extensões → Apps Script), só dos motoristas.
 * Não usa a folha "Candidatos Inverno" nem o script da /inverno, que ficam intactos.
 * Fuso horário: Europe/Lisbon (no projeto e na folha; o script acerta o da folha na primeira vez).
 * Escreve no separador "Candidatos Motoristas" dessa folha e guarda as fotos no Google Drive, uma pasta por ficha:
 * "AAAA-MM-DD — Nome — HUB-XXXX", com as duas fotos e a FICHA.txt (todas as respostas).
 *
 * Ações (todas com o TOKEN):
 *   passo1     cria a linha (ou atualiza nome/WhatsApp/concelho se a pessoa voltou atrás) e devolve o código HUB-XXXX
 *   respostas  grava as respostas do quiz
 *   foto       guarda uma foto (lado | bagageira) na pasta da ficha e põe o link na folha
 *   concluir   grava as respostas, confirma as duas fotos, calcula o estado, escreve a FICHA.txt e avisa por WhatsApp e e-mail
 *
 * Instalação: correr configurar() uma vez (e sempre que se quiser repor o formato; não apaga dados).
 * Grava as propriedades abaixo e formata a folha. Depois, testarTudo().
 *
 * Propriedades do script (gravadas pelo configurar(); não é preciso escrevê-las à mão):
 *   TOKEN              segredo partilhado com o site (o mesmo valor de MOTORISTAS_TOKEN no Vercel). Nunca fica no
 *                      código: chega uma vez num ficheiro temporário _token.gs (TOKEN_TEMPORARIO), que sai logo a seguir
 *   ZAPI_*             também segredos: chegam uma vez num ficheiro temporário _segredos.gs (SEGREDOS_TEMPORARIOS),
 *                      que sai logo a seguir; a mesma instância da Z-API dos outros sistemas da HUB
 *   FOLHA_ID           ID da folha "Candidatos Motoristas" (o pedaço do endereço entre /d/ e /edit); obrigatório
 *   AVISO_EMAIL        e-mail que recebe o aviso
 *   AVISO_WHATSAPP     número que recebe o aviso, só dígitos, com indicativo (ex.: 351963705509)
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

/** Valores fixos que o configurar() grava nas propriedades (não são segredo). */
var CONFIG = {
  FOLHA_ID: '1EkRnToNGdN51lWkQDxja-SXxPJgbLweU6mbLLDFSbRo',
  AVISO_EMAIL: 'juniorgutierezbega@gmail.com',
  AVISO_WHATSAPP: '351963705509'
};

/** Cores suaves da coluna Estado: [fundo, letra]. */
var CORES_ESTADO = {
  'Em análise': ['#FFF4C2', '#5C4A00'],
  'Ficha incompleta': ['#FFE2C2', '#6B3A00'],
  'Ver com atenção': ['#FFE2C2', '#6B3A00'],
  'Selecionado': ['#D6F0DC', '#1E5631'],
  'Entrevista marcada': ['#D6F0DC', '#1E5631'],
  'Em formação': ['#D6F0DC', '#1E5631'],
  'Ativo': ['#D6F0DC', '#1E5631'],
  'Lista de espera': ['#DCEBFA', '#1D4370'],
  'Não avança': ['#E6E6E6', '#5F5F5F']
};

var LARGURAS = {
  'Data': 120, 'Código': 90, 'Nome': 180, 'WhatsApp': 130, 'Concelho': 120,
  'Carro': 130, 'Marca': 100, 'Modelo': 110, 'Ano': 100, 'Lugares': 70,
  'Carta há mais de 1 ano': 90, 'Já faz transfers ou trabalha no aeroporto': 120, 'Outro trabalho ou negócio': 110,
  'Inglês': 90, 'Regime': 110, 'Turnos': 150,
  'Foto de lado': 160, 'Foto da bagageira': 160, 'Pasta das fotos': 160,
  'Estado': 150, 'Prioridade': 85,
  'Consentimento': 130, 'Página': 120, 'utm_source': 100, 'utm_medium': 100, 'utm_campaign': 130, 'utm_content': 130,
  'Atualizado': 120, 'Estado automático': 120, 'Aviso enviado': 120, 'ID interno': 120
};

var COLUNAS_DATA = ['Data', 'Atualizado', 'Aviso enviado'];
var COLUNAS_LINK = ['Foto de lado', 'Foto da bagageira', 'Pasta das fotos'];

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
    var existente = pastaExistente(folha, linha);
    if (existente) existente.setName(nomePasta(folha, linha));
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
  // o appendRow não herda o formato da coluna: as datas da linha nova em dd/mm/aaaa hh:mm
  COLUNAS_DATA.forEach(function (c) { folha.getRange(folha.getLastRow(), col(c)).setNumberFormat('dd/mm/yyyy hh:mm'); });
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
  porLink(folha.getRange(linha, col(coluna)), ficheiro.getUrl());
  porLink(folha.getRange(linha, col('Pasta das fotos')), pasta.getUrl());
  folha.getRange(linha, col('Atualizado')).setValue(new Date());
  return { ok: true };
}

function concluir(folha, linha, d) {
  gravarRespostas(folha, linha, d);
  var temFotos = folha.getRange(linha, col('Foto de lado')).getValue() && folha.getRange(linha, col('Foto da bagageira')).getValue();
  if (!temFotos) return { ok: false, erro: 'fotos' };
  var estado = atualizarEstado(folha, linha);
  escreverFicha(folha, linha, estado);

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
  var id = props.getProperty('FOLHA_ID');
  if (!id) throw new Error('Falta a propriedade FOLHA_ID (o ID da folha "Candidatos Motoristas")');
  var ss = SpreadsheetApp.openById(id);
  var folha = ss.getSheetByName(SEPARADOR);
  if (!folha) folha = ss.insertSheet(SEPARADOR, 0);
  if (folha.getLastRow() === 0) {
    folha.appendRow(CABECALHOS);
    formatarFolha(folha);
  }
  return folha;
}

/** O link fica clicável e o texto da célula continua a ser o endereço (o script lê-o de volta). */
function porLink(celula, url) {
  celula.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(url).setLinkUrl(url).build());
}

/* ── Instalação ── */

/**
 * Correr uma vez no editor (pode voltar a correr-se: só acerta propriedades e formato, nunca apaga linhas).
 *   - grava FOLHA_ID, AVISO_EMAIL e AVISO_WHATSAPP; grava o TOKEN se ainda não existir (vem de _token.gs);
 *   - formata a folha com o visual da HUB e pinta a coluna Estado;
 *   - esconde as colunas técnicas e apaga o separador "Página1" se estiver vazio.
 */
function configurar() {
  var props = PropertiesService.getScriptProperties();
  Object.keys(CONFIG).forEach(function (k) { props.setProperty(k, CONFIG[k]); });

  var novo = typeof TOKEN_TEMPORARIO !== 'undefined' ? String(TOKEN_TEMPORARIO) : '';
  var atual = props.getProperty('TOKEN');
  var estadoToken;
  if (!atual && novo) { props.setProperty('TOKEN', novo); estadoToken = 'gravado agora'; }
  else if (!atual) estadoToken = 'EM FALTA (falta o _token.gs)';
  else if (!novo || novo === atual) estadoToken = 'já estava gravado' + (novo ? ' (igual ao do .env.local)' : '');
  else estadoToken = 'já existia e é DIFERENTE do _token.gs (não o substituí)';

  var zapi = 'sem _segredos.gs (ficou como estava)';
  if (typeof SEGREDOS_TEMPORARIOS !== 'undefined') {
    ['ZAPI_INSTANCE', 'ZAPI_TOKEN', 'ZAPI_CLIENT_TOKEN'].forEach(function (k) {
      if (SEGREDOS_TEMPORARIOS[k]) props.setProperty(k, String(SEGREDOS_TEMPORARIOS[k]));
    });
    zapi = 'gravada';
  }

  var folha = obterFolha(); // cria o separador e os cabeçalhos se faltarem
  formatarFolha(folha);

  var ss = folha.getParent();
  var p1 = ss.getSheetByName('Página1');
  var pagina1 = 'não existe';
  if (p1 && p1.getSheetId() !== folha.getSheetId()) {
    if (p1.getLastRow() === 0 && p1.getLastColumn() === 0) { ss.deleteSheet(p1); pagina1 = 'apagado'; }
    else pagina1 = 'tem dados: ficou';
  }
  console.log('configurar(): FOLHA_ID, AVISO_EMAIL e AVISO_WHATSAPP gravados; TOKEN ' + estadoToken + '; Z-API ' + zapi +
    '; folha "' + SEPARADOR + '" formatada (' + Math.max(folha.getLastRow() - 1, 0) + ' fichas, nenhuma apagada); Página1: ' + pagina1 + '.');

  // aviso de teste, sem criar ficha
  var r = enviarAviso('Teste do aviso de candidaturas (sem ficha)',
    'Teste do aviso das candidaturas de motoristas (hubtransfer.pt/motoristas).\n' +
    'Se recebeste isto, o aviso de ficha completa vai chegar aqui. Não foi criada nenhuma ficha.');
  console.log('Aviso de teste: e-mail para ' + props.getProperty('AVISO_EMAIL') + ': ' + r.email +
    '; WhatsApp para ' + props.getProperty('AVISO_WHATSAPP') + ': ' + r.whatsapp + '.');
}

/** O visual da HUB. Idempotente: pode correr sempre que se quiser. */
function formatarFolha(folha) {
  var ss = folha.getParent();
  if (ss.getSpreadsheetTimeZone() !== 'Europe/Lisbon') ss.setSpreadsheetTimeZone('Europe/Lisbon');
  var n = CABECALHOS.length;
  if (folha.getMaxColumns() < n) folha.insertColumnsAfter(folha.getMaxColumns(), n - folha.getMaxColumns());
  var linhas = folha.getMaxRows() - 1;

  // os cabeçalhos certos na linha 1 (só escreve se algum estiver diferente; os dados não mexem)
  var cab = folha.getRange(1, 1, 1, n);
  if (cab.getValues()[0].join('|') !== CABECALHOS.join('|')) cab.setValues([CABECALHOS]);

  cab.setBackground('#000000').setFontColor('#FFFFFF').setFontWeight('bold')
    .setVerticalAlignment('middle').setWrap(true);
  folha.setRowHeight(1, 42);
  folha.setFrozenRows(1);
  folha.setFrozenColumns(col('Nome')); // Data, Código e Nome ficam à vista

  CABECALHOS.forEach(function (c, i) { folha.setColumnWidth(i + 1, LARGURAS[c] || 110); });
  if (linhas > 0) {
    folha.getRange(2, 1, linhas, n).setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    COLUNAS_DATA.forEach(function (c) { folha.getRange(2, col(c), linhas, 1).setNumberFormat('dd/mm/yyyy hh:mm'); });
    folha.getRange(2, col('Estado'), linhas, 1).setDataValidation(regraEstados());
  }

  // links clicáveis nas fotos e na pasta (os que ainda estão como texto simples)
  var ultima = folha.getLastRow();
  if (ultima > 1) {
    COLUNAS_LINK.forEach(function (c) {
      var r = folha.getRange(2, col(c), ultima - 1, 1);
      var vals = r.getValues();
      var ricos = r.getRichTextValues();
      vals.forEach(function (v, i) {
        var url = String(v[0] || '');
        if (/^https?:\/\//.test(url) && !(ricos[i][0] && ricos[i][0].getLinkUrl())) porLink(r.getCell(i + 1, 1), url);
      });
    });
  }

  // filtro nos cabeçalhos (só cria se não houver: não apaga os filtros que tenhas escolhido)
  if (!folha.getFilter()) folha.getRange(1, 1, folha.getMaxRows(), n).createFilter();

  // cores do Estado: troca só as regras da coluna Estado (as deste script); as outras ficam
  var colEstado = col('Estado');
  var outras = folha.getConditionalFormatRules().filter(function (regra) {
    return !regra.getRanges().some(function (g) { return g.getColumn() === colEstado && g.getNumColumns() === 1; });
  });
  var alvo = folha.getRange(2, colEstado, Math.max(linhas, 1), 1);
  var minhas = Object.keys(CORES_ESTADO).map(function (estado) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(estado)
      .setBackground(CORES_ESTADO[estado][0]).setFontColor(CORES_ESTADO[estado][1]).setRanges([alvo]).build();
  });
  folha.setConditionalFormatRules(outras.concat(minhas));

  // colunas técnicas escondidas (servem ao script, não a ti)
  folha.hideColumns(col('Estado automático'), 3);
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

/** "AAAA-MM-DD — Nome — HUB-XXXX" (a data é a do passo 1, na hora de Lisboa). */
function nomePasta(folha, linha) {
  var data = folha.getRange(linha, col('Data')).getValue();
  var dia = Utilities.formatDate(data instanceof Date ? data : new Date(), 'Europe/Lisbon', 'yyyy-MM-dd');
  var nome = String(folha.getRange(linha, col('Nome')).getValue()).replace(/^'/, '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  return dia + ' — ' + (nome || 'Sem nome') + ' — ' + folha.getRange(linha, col('Código')).getValue();
}

/** A pasta já criada para esta ficha (pelo link na folha), ou null. */
function pastaExistente(folha, linha) {
  var url = String(folha.getRange(linha, col('Pasta das fotos')).getValue() || '');
  var m = url.match(/folders\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    var p = DriveApp.getFolderById(m[1]);
    return p.isTrashed() ? null : p;
  } catch (err) {
    return null;
  }
}

function pastaDaFicha(folha, linha) {
  var p = pastaExistente(folha, linha);
  if (p) return p;
  p = pastaPrincipal().createFolder(nomePasta(folha, linha));
  porLink(folha.getRange(linha, col('Pasta das fotos')), p.getUrl());
  return p;
}

/** FICHA.txt na pasta da ficha: tudo o que a pessoa respondeu, para ler sem abrir a folha. */
function escreverFicha(folha, linha, estado) {
  var val = function (c) { return String(folha.getRange(linha, col(c)).getDisplayValue() || ''); };
  var linhas = [
    'Ficha ' + val('Código') + ' — candidatura de motorista',
    '',
    'Data: ' + val('Data'),
    'Nome: ' + val('Nome'),
    'WhatsApp: ' + val('WhatsApp'),
    'Concelho: ' + val('Concelho'),
    ''
  ];
  CAMPOS_RESPOSTAS.forEach(function (p) { linhas.push(p[1] + ': ' + val(p[1])); });
  linhas.push('', 'Estado: ' + estado, 'Prioridade: ' + (val('Prioridade') || 'Não'),
    '', 'Consentimento: ' + val('Consentimento'), 'Página: ' + val('Página'));
  if (val('utm_campaign')) linhas.push('Campanha: ' + val('utm_campaign') + (val('utm_content') ? ' / ' + val('utm_content') : ''));
  var pasta = pastaDaFicha(folha, linha);
  var antigos = pasta.getFilesByName('FICHA.txt');
  while (antigos.hasNext()) antigos.next().setTrashed(true);
  pasta.createFile('FICHA.txt', linhas.join('\n'), MimeType.PLAIN_TEXT);
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

  var r = enviarAviso('Nova candidatura de motorista: ' + val('Nome') + ' (' + val('Código') + ')', texto);
  if (r.whatsapp !== 'saiu') console.error('Aviso WhatsApp: ' + r.whatsapp);
  if (r.email !== 'saiu') console.error('Aviso por e-mail: ' + r.email);
}

/**
 * Envia o aviso por WhatsApp (Z-API) e por e-mail. Devolve { whatsapp, email }: "saiu", "não configurado" ou "erro: …".
 * Nunca escreve no registo o token nem o Client-Token.
 */
function enviarAviso(assunto, texto) {
  var props = PropertiesService.getScriptProperties();
  var out = { whatsapp: 'não configurado', email: 'não configurado' };

  var inst = props.getProperty('ZAPI_INSTANCE');
  var tok = props.getProperty('ZAPI_TOKEN');
  var cli = props.getProperty('ZAPI_CLIENT_TOKEN');
  var para = props.getProperty('AVISO_WHATSAPP');
  if (inst && tok && cli && para) {
    try {
      var res = UrlFetchApp.fetch('https://api.z-api.io/instances/' + inst + '/token/' + tok + '/send-text', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Client-Token': cli },
        payload: JSON.stringify({ phone: para, message: texto }),
        muteHttpExceptions: true
      });
      var corpo = res.getContentText();
      out.whatsapp = res.getResponseCode() === 200 && /messageId|zaapId/.test(corpo)
        ? 'saiu'
        : 'erro: HTTP ' + res.getResponseCode() + ' ' + corpo.slice(0, 160);
    } catch (err) {
      out.whatsapp = 'erro: ' + String(err).slice(0, 160);
    }
  }

  var email = props.getProperty('AVISO_EMAIL');
  if (email) {
    try {
      MailApp.sendEmail(email, assunto, texto);
      out.email = 'saiu';
    } catch (err) {
      out.email = 'erro: ' + String(err).slice(0, 160);
    }
  }
  return out;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Correr uma vez no editor: autoriza o script (folha, Drive, e-mail, Z-API), cria o separador, a pasta das fotos
 * e uma ficha de teste completa ("Teste HUB", com a pasta, as duas fotos e a FICHA.txt), e envia o aviso.
 * Apaga depois essa linha e a pasta de teste.
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
