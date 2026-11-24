// Testes da «Ajuda» (src/lib/ajuda/regras.ts, textos.ts e mensagens.ts). Dados inventados.
// Correr: node --test tests/ajuda.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colegasPossiveis,
  carroServe,
  CARROS_QUE_SERVEM,
  estadoEfectivo,
  reservaCaiu,
  minutosAteExpirar,
  prazoDoPedido,
  prazoDaReserva,
  horaDoPrazo,
  podePedirAjuda,
  pedidosPorResponder,
  reservasMinhas,
  viagemSaiDeQuemPediu,
  nomeCurto,
  deOndeParaOnde,
  minutosDoDia,
  hhmm,
  MOTIVOS,
  motivoValido,
  linkDoPedido,
  lerLinkDoPedido,
  pedidoIdValido,
} from "../src/lib/ajuda/regras.ts";
import {
  T,
  NOME_MOTIVO,
  textoDeslizarColega,
  linhaColega,
  textoEspera,
  textoSemResposta,
  textoAceite,
  textoRecusado,
  textoQuemPede,
  textoConfirmarFicar,
  textoFicou,
  textoFaltam,
  textoPrazoReserva,
  textoPilula,
  textoValor,
  textoVoo,
  linhasResumo,
  textosDoPedido,
} from "../src/lib/ajuda/textos.ts";
import { mensagemAoColega, mensagemAoGrupo, mensagemSegundaConfirmacao } from "../src/lib/ajuda/mensagens.ts";
import { rotuloMotorista } from "../src/lib/rotuloViagem.ts";

const M = (id, nome, categoria, extra = {}) => ({
  id, nome, categoria, trabalhaNoDia: true, turnoInicio: "06:00", turnoFim: "22:00", viagens: [], ...extra,
});

// ── colegas possíveis ──────────────────────────────────────────

test("só quem trabalha no dia, com o carro certo e livre à hora", () => {
  const motoristas = [
    M("a", "Alberto Lima", "MPV"),
    M("b", "Beatriz Rocha", "Sedan"),                                       // carro menor
    M("c", "Carlos Dias", "MPV", { trabalhaNoDia: false }),                 // folga
    M("d", "Diana Faria", "MPV", { viagens: [{ hora: "14:10", duracaoMin: 40 }] }), // ocupada
    M("e", "Eduardo Pinto", "MPV", { turnoFim: "14:45" }),                  // turno acaba antes
    M("f", "Filipa Melo", "MPV", { turnoInicio: "14:20" }),                 // entra tarde
    M("g", "Gil Santos", "Business"),                                       // Business não faz MPV
    M("eu", "Eu Mesmo", "MPV"),                                             // quem pede
  ];
  const r = colegasPossiveis({ hora: "14:30", categoria: "MPV" }, motoristas, "eu");
  assert.deepEqual(r.map((c) => c.id), ["a"]);
});

test("carro igual ou maior: Sedan aceita Sedan, MPV e Business; MPV só MPV; Business só Business", () => {
  for (const carro of ["Sedan", "MPV", "Business"]) assert.equal(carroServe("Sedan", carro), true, `Sedan ← ${carro}`);
  assert.equal(carroServe("Sedan", "Luxo"), false);
  assert.equal(carroServe("MPV", "MPV"), true);
  assert.equal(carroServe("mpv", "MPV"), true);
  for (const carro of ["Sedan", "Business", "Luxo"]) assert.equal(carroServe("MPV", carro), false, `MPV ← ${carro}`);
  assert.equal(carroServe("Business", "Business"), true);
  for (const carro of ["Sedan", "MPV", "Luxo"]) assert.equal(carroServe("Business", carro), false, `Business ← ${carro}`);
  assert.deepEqual(CARROS_QUE_SERVEM.Sedan, ["Sedan", "MPV", "Business"]);
  assert.equal(carroServe("", "Sedan"), true);          // viagem sem categoria: qualquer carro
  assert.equal(carroServe("Talixo", "Sedan"), false);   // categoria estranha: ninguém
});

test("a lista só tem o nome e a categoria (sem horas); a mesma categoria primeiro, depois pelo nome", () => {
  const ms = [
    M("x", "Xavier Reis", "Sedan", { viagens: [{ hora: "15:40", duracaoMin: 30 }] }), // começa logo a seguir → ocupado
    M("y", "Yara Brito", "Sedan", { viagens: [{ hora: "17:00", duracaoMin: 30 }] }),
    M("z", "Zé Matos", "Sedan", { turnoFim: "20:00" }),
    M("m", "Miguel Alves", "MPV"),
    M("b", "Bia Couto", "Business"),
  ];
  const r = colegasPossiveis({ hora: "14:30", categoria: "Sedan" }, ms, "eu");
  assert.deepEqual(r.map((c) => c.id), ["y", "z", "b", "m"]);
  for (const c of r) assert.deepEqual(Object.keys(c).sort(), ["categoria", "id", "nome"]);
  assert.equal(linhaColega(r[0]), "Sedan");
  assert.ok(!/\d{1,2}:\d{2}/.test(r.map(linhaColega).join(" ")), "a lista não pode mostrar horas");
});

test("hora inválida → lista vazia; horas", () => {
  assert.deepEqual(colegasPossiveis({ hora: "", categoria: "MPV" }, [M("a", "A", "MPV")], "eu"), []);
  assert.equal(minutosDoDia("07:05"), 425);
  assert.equal(minutosDoDia("25:00"), null);
  assert.equal(hhmm(425), "07:05");
});

// ── o motivo ──────────────────────────────────────────────────

test("motivo: quatro, obrigatório; nunca vai para o colega", () => {
  assert.deepEqual(MOTIVOS, ["doente", "carro_avariado", "atrasado", "outro"]);
  assert.deepEqual(MOTIVOS.map((m) => NOME_MOTIVO[m]), ["Doente", "Carro avariado", "Atrasado", "Outro"]);
  for (const m of MOTIVOS) assert.equal(motivoValido(m), true);
  for (const m of [undefined, null, "", "Doente", "ferias", 3]) assert.equal(motivoValido(m), false, String(m));
});

// ── estado do pedido, 15 minutos e reserva de 10 minutos ──────

test("15 minutos sem resposta → sem_resposta; grupo à espera não expira", () => {
  const criado = "2026-11-24T10:00:00.000Z";
  const expira = prazoDoPedido(criado);
  assert.equal(expira, "2026-11-24T10:15:00.000Z");
  const p = { estado: "a_espera", tipo: "colega", expiraEm: expira };
  assert.equal(estadoEfectivo(p, Date.parse("2026-11-24T10:14:59Z")), "a_espera");
  assert.equal(estadoEfectivo(p, Date.parse("2026-11-24T10:15:00Z")), "sem_resposta");
  assert.equal(estadoEfectivo({ ...p, estado: "aceite" }, Date.parse("2026-11-24T11:00:00Z")), "aceite");
  assert.equal(estadoEfectivo({ estado: "a_espera", tipo: "grupo" }, Date.parse("2026-11-25T00:00:00Z")), "a_espera");
  assert.equal(minutosAteExpirar(expira, Date.parse("2026-11-24T10:03:30Z")), 12);
  assert.equal(minutosAteExpirar(expira, Date.parse("2026-11-24T10:30:00Z")), 0);
});

test("grupo: «Aceitar» reserva por 10 minutos; sem a segunda confirmação volta ao grupo", () => {
  const aceite = "2026-11-24T10:20:00.000Z";
  const prazo = prazoDaReserva(aceite);
  assert.equal(prazo, "2026-11-24T10:30:00.000Z");
  const p = { estado: "reservada", tipo: "grupo", reservaExpiraEm: prazo };
  assert.equal(estadoEfectivo(p, Date.parse("2026-11-24T10:29:59Z")), "reservada");
  assert.equal(reservaCaiu(p, Date.parse("2026-11-24T10:29:59Z")), false);
  assert.equal(estadoEfectivo(p, Date.parse("2026-11-24T10:30:00Z")), "a_espera");
  assert.equal(reservaCaiu(p, Date.parse("2026-11-24T10:30:00Z")), true);
  assert.equal(minutosAteExpirar(prazo, Date.parse("2026-11-24T10:23:10Z")), 7);
  assert.equal(horaDoPrazo(prazo), "10:30");                       // Lisboa, em Novembro = UTC
  assert.equal(horaDoPrazo("2026-07-01T10:30:00.000Z"), "11:30");  // Lisboa, no Verão = UTC+1
  assert.equal(textoPrazoReserva("10:30", 7), "Tem até às 10:30 · faltam 7 min");
  assert.equal(textoPrazoReserva("10:30", 1), "Tem até às 10:30 · falta 1 min");
});

test("só se pede ajuda em viagens que não acabaram nem estão em curso", () => {
  assert.equal(podePedirAjuda({ statusMotorista: "AGUARDANDO" }), true);
  assert.equal(podePedirAjuda({ statusMotorista: "NO_LOCAL" }), true);
  assert.equal(podePedirAjuda({ statusMotorista: "EM_VIAGEM" }), false);
  assert.equal(podePedirAjuda({ statusMotorista: "FINALIZADO" }), false);
  assert.equal(podePedirAjuda({ concluida: true }), false);
  assert.equal(podePedirAjuda({ status: "CONCLUIDA" }), false);
  assert.equal(podePedirAjuda({ cancelada: true }), false);
  assert.equal(podePedirAjuda({ noShow: true }), false);
});

test("pedidos por responder: à espera, dentro do prazo, sem dono; reserva caída volta; a de outro não", () => {
  const agora = Date.parse("2026-11-24T10:10:00Z");
  const base = { de: { id: "r", nome: "Rui" }, viagem: {}, tipo: "colega" };
  const lista = [
    { ...base, id: "2", estado: "a_espera", criadoEm: "2026-11-24T10:05:00Z", expiraEm: "2026-11-24T10:20:00Z" },
    { ...base, id: "1", estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z", expiraEm: "2026-11-24T10:15:00Z" },
    { ...base, id: "3", estado: "a_espera", criadoEm: "2026-11-24T09:00:00Z", expiraEm: "2026-11-24T09:15:00Z" }, // expirou
    { ...base, id: "4", estado: "aceite", criadoEm: "2026-11-24T10:01:00Z" },
    { ...base, id: "5", tipo: "grupo", estado: "a_espera", criadoEm: "2026-11-24T08:00:00Z" },
    { ...base, id: "6", tipo: "grupo", estado: "a_espera", criadoEm: "2026-11-24T08:00:00Z", ficouCom: { id: "a", nome: "A" } },
    { ...base, id: "7", tipo: "grupo", estado: "reservada", criadoEm: "2026-11-24T08:30:00Z" },                           // de outro
    { ...base, id: "8", tipo: "grupo", estado: "reservada", criadoEm: "2026-11-24T08:40:00Z", reservaExpiraEm: "2026-11-24T10:05:00Z" }, // caiu
    { ...base, id: "9", tipo: "grupo", estado: "reservada", criadoEm: "2026-11-24T08:50:00Z", reservadaParaMim: true, reservaExpiraEm: "2026-11-24T10:12:00Z" },
  ];
  assert.deepEqual(pedidosPorResponder(lista, agora).map((p) => p.id), ["5", "8", "1", "2"]);
  assert.deepEqual(reservasMinhas(lista, agora).map((p) => p.id), ["9"]);
  assert.deepEqual(reservasMinhas(lista, Date.parse("2026-11-24T10:12:00Z")).map((p) => p.id), []);
});

test("aceite → a viagem sai de quem pediu; recusado e reservada não", () => {
  assert.equal(viagemSaiDeQuemPediu({ estado: "aceite", ficouCom: { id: "a", nome: "A" } }), true);
  assert.equal(viagemSaiDeQuemPediu({ estado: "recusado" }), false);
  assert.equal(viagemSaiDeQuemPediu({ estado: "a_espera" }), false);
  assert.equal(viagemSaiDeQuemPediu({ estado: "reservada" }), false);
});

// ── links do WhatsApp ─────────────────────────────────────────

test("links: só o id opaco do pedido; o passo da segunda confirmação; ids estranhos recusados", () => {
  const base = "https://exemplo.invalid/";
  assert.equal(linkDoPedido(base, "aj3k9xq2"), "https://exemplo.invalid/driver/trips?ajuda=aj3k9xq2");
  assert.equal(linkDoPedido(base, "aj3k9xq2", "confirmar"), "https://exemplo.invalid/driver/trips?ajuda=aj3k9xq2&passo=confirmar");
  assert.deepEqual(lerLinkDoPedido("?ajuda=aj3k9xq2"), { pedidoId: "aj3k9xq2", passo: "pedido" });
  assert.deepEqual(lerLinkDoPedido("ajuda=aj3k9xq2&passo=confirmar"), { pedidoId: "aj3k9xq2", passo: "confirmar" });
  assert.deepEqual(lerLinkDoPedido("?ajuda=aj3k9xq2&passo=outro"), { pedidoId: "aj3k9xq2", passo: "pedido" });
  for (const mau of ["", "?x=1", "?ajuda=", "?ajuda=a b", "?ajuda=TLX%20-%2048931", "?ajuda=<script>", `?ajuda=${"a".repeat(65)}`]) {
    assert.equal(lerLinkDoPedido(mau), null, mau);
  }
  assert.equal(pedidoIdValido("aj1"), false);
  assert.equal(pedidoIdValido("aj3k9xq2"), true);
});

test("textos: nome curto, rota, valor, voo, faltam, pílula", () => {
  assert.equal(nomeCurto("Rui Martins Costa"), "Rui Costa");
  assert.equal(nomeCurto("  Ana  "), "Ana");
  assert.equal(deOndeParaOnde({ origem: "Aeroporto de Lisboa", destino: "Hotel Sol" }), "Aeroporto de Lisboa → Hotel Sol");
  assert.equal(textoValor(35), "€35");
  assert.equal(textoValor(0), "");
  assert.equal(textoVoo("XZ4821"), "Voo XZ4821");
  assert.equal(textoVoo(""), "");
  assert.equal(textoFaltam(12), "Sem resposta, avisamos daqui a 12 min");
  assert.equal(textoFaltam(0), "Sem resposta, avisamos dentro de 1 min");
  assert.deepEqual(textoPilula(null, null), { texto: "Ajuda", tom: "normal" });
  assert.deepEqual(textoPilula({ tipo: "colega", para: { nome: "Rui Costa" } }, "a_espera"), { texto: "À espera · Rui", tom: "espera" });
  assert.deepEqual(textoPilula({ tipo: "colega", para: { nome: "Rui Costa" } }, "sem_resposta"), { texto: "Sem resposta", tom: "alerta" });
  assert.deepEqual(textoPilula({ tipo: "grupo" }, "a_espera"), { texto: "Pedido ao grupo", tom: "espera" });
  assert.deepEqual(textoPilula({ tipo: "grupo" }, "reservada"), { texto: "Aceite · a confirmar", tom: "espera" });
  assert.deepEqual(textoPilula({ tipo: "grupo", ficouCom: { nome: "Ana Ferreira" } }, "aceite"), { texto: "Passou para Ana", tom: "feito" });
  assert.deepEqual(textoPilula({ tipo: "colega", para: { nome: "Rui Costa" } }, "recusado"), { texto: "Ajuda", tom: "normal" });
  assert.equal(textoDeslizarColega("Rui Costa"), "Deslize para pedir a Rui Costa");
  assert.equal(textoEspera("Rui Costa").frase, "A viagem continua consigo até Rui Costa aceitar.");
  assert.equal(T.deslizarSegunda, "Confirmo que faço esta viagem");
  assert.equal(T.prazoAcabou, "O prazo acabou: o pedido voltou ao grupo.");
  assert.equal(T.jaFicou, "Já ficou com um colega.");
  assert.deepEqual(linhasResumo({ rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", voo: "XZ4821", origem: "A", destino: "B", valor: 35 }),
    ["CHEGADA · MPV", "14:30", "24/11/2026", "Voo XZ4821", "A", "B", "€35"]);
});

// ── nenhum texto mostra a operadora, o código dela nem a referência ──

const OPERADORAS = [
  { codigo: "HEY", nome: "Heycars", ref: "HEY - 7731" },
  { codigo: "TLX", nome: "Talixo", ref: "Talixo - 48931" },
  { codigo: "TALIXO", nome: "Talixo", ref: "TLX-48931" },
  { codigo: "WT", nome: "World Transfer", ref: "WT - 5520" },
  { codigo: "LIOZ", nome: "Lioz", ref: "LIOZ - 118" },
  { codigo: "ELH", nome: "Empire Lisbon", ref: "ELH-0042" },
  { codigo: "EMH", nome: "Empire Marques", ref: "EMH-0007" },
  { codigo: "GDA", nome: "Gota d'Água", ref: "GDA-0003" },
];

function semOperadora(texto, op, onde) {
  const palavras = texto.split(/[\s·→,.«»:()*\n]+/).filter(Boolean);
  assert.ok(!palavras.includes(op.codigo), `${onde}: «${texto}» tem o código ${op.codigo}`);
  assert.ok(!texto.toLowerCase().includes(op.nome.toLowerCase()), `${onde}: «${texto}» tem o nome ${op.nome}`);
  assert.ok(!texto.includes(op.ref), `${onde}: «${texto}» tem a referência ${op.ref}`);
  const num = op.ref.replace(/\D/g, "");
  assert.ok(!texto.includes(num), `${onde}: «${texto}» tem o número da reserva ${num}`);
}

function semCliente(texto, onde) {
  for (const c of ["Helena Duarte", "351900000000", "+351 900 000 000"]) {
    assert.ok(!texto.includes(c), `${onde}: tem dados do cliente (${c})`);
  }
  for (const m of Object.values(NOME_MOTIVO)) {
    assert.ok(!new RegExp(`\\b${m}\\b`).test(texto), `${onde}: mostra o motivo «${m}» ao colega`);
  }
}

test("cada operadora: nenhum texto dos ecrãs nem das mensagens da ajuda a mostra", () => {
  const tipos = ["CHEGADA", "RECOLHA", "TRANSFER"];
  for (const op of OPERADORAS) {
    for (const tipo of tipos) {
      // A viagem como vem do HUB-Central, com a operadora em todo o lado (até no ID da coluna A)
      const viagem = {
        id: op.ref, platform: op.nome, platformCode: op.codigo, sourceLabel: op.codigo,
        tipo, categoriaNome: op.codigo, // até com a categoria estragada
      };
      const resumo = {
        rotulo: rotuloMotorista({ tipo: viagem.tipo, categoriaNome: viagem.categoriaNome }),
        data: "24/11/2026", hora: "14:30", voo: "XZ4821", origem: "Aeroporto de Lisboa", destino: "Hotel Jardim do Rio", valor: 35,
      };
      const de = { id: "rui-costa", nome: "Rui Costa" };
      const para = { id: "ana-ferreira", nome: "Ana Ferreira" };
      const pedido = {
        id: "aj3k9xq2", viagemRef: viagem.id, tipo: "colega", de, para, motivo: "doente", estado: "aceite",
        criadoEm: "2026-11-24T10:00:00Z", expiraEm: "2026-11-24T10:15:00Z", ficouCom: para,
      };
      const recebido = { id: "aj3k9xq2", tipo: "colega", de, viagem: resumo, estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z" };
      const recebidoGrupo = { ...recebido, tipo: "grupo", estado: "reservada", reservadaParaMim: true, reservaExpiraEm: "2026-11-24T10:30:00Z" };

      const link = linkDoPedido("https://exemplo.invalid", pedido.id);
      const link2 = linkDoPedido("https://exemplo.invalid", pedido.id, "confirmar");
      const mensagens = [
        mensagemAoColega(de.nome, resumo, link),
        mensagemAoGrupo(de.nome, resumo, link),
        mensagemSegundaConfirmacao(resumo, "10:30", link2),
      ];

      const textos = [
        ...Object.values(T),
        ...textosDoPedido(pedido).filter((t) => t !== NOME_MOTIVO.doente), // o motivo só quem pediu o vê
        ...textosDoPedido(recebido),
        ...textosDoPedido(recebidoGrupo),
        ...linhasResumo(resumo),
        linhaColega({ categoria: "MPV" }),
        textoQuemPede(recebido), textoQuemPede(recebidoGrupo),
        textoConfirmarFicar(de.nome), textoFicou().titulo, textoFicou().frase,
        textoSemResposta(para.nome).titulo, textoAceite(para.nome).titulo, textoRecusado(para.nome),
        textoPrazoReserva("10:30", 7),
        link, link2,
        ...mensagens,
        // o que vai no pedido recebido, serializado (é o que o colega recebe)
        JSON.stringify(recebido), JSON.stringify(recebidoGrupo),
      ];
      for (const t of textos) semOperadora(String(t), op, `${op.codigo}/${tipo}`);
      for (const t of [...mensagens, JSON.stringify(recebido), JSON.stringify(recebidoGrupo)]) semCliente(t, `${op.codigo}/${tipo}`);
      // o link nunca leva o ID da viagem
      for (const l of [link, link2]) assert.ok(!l.includes(encodeURIComponent(viagem.id)) && !l.includes(viagem.id), `link com o ID da viagem: ${l}`);
    }
  }
});

test("o pedido recebido não leva o cliente nem o motivo", () => {
  const recebido = {
    id: "aj9", tipo: "grupo", de: { id: "rui-costa", nome: "Rui Costa" },
    viagem: { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", voo: "XZ4821", origem: "Aeroporto de Lisboa", destino: "Hotel Sol", valor: 35 },
    estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z",
  };
  const chaves = JSON.stringify(recebido);
  for (const k of ["client", "cliente", "phone", "telefone", "contacto", "motivo", "viagemRef", "rowIndex"]) {
    assert.ok(!chaves.includes(`"${k}"`), `o pedido recebido tem o campo ${k}`);
  }
});

test("as três mensagens levam o link e o que é preciso para decidir", () => {
  const r = { rotulo: "CHEGADA · Sedan", data: "24/11/2026", hora: "21:00", voo: "XZ7310", origem: "Aeroporto de Lisboa", destino: "Hotel Miradouro", valor: 32 };
  const l = linkDoPedido("https://exemplo.invalid", "aj7q2m");
  const g = mensagemAoGrupo("Rui Costa", r, l);
  for (const parte of ["CHEGADA · Sedan", "24/11/2026", "21:00", "Voo XZ7310", "Aeroporto de Lisboa → Hotel Miradouro", "€32", l, "«Aceitar»"]) {
    assert.ok(g.includes(parte), `grupo sem «${parte}»`);
  }
  assert.ok(mensagemAoColega("Rui Costa", r, l).includes("«Sim, faço» ou «Não posso»"));
  const c = mensagemSegundaConfirmacao(r, "21:40", linkDoPedido("https://exemplo.invalid", "aj7q2m", "confirmar"));
  assert.ok(c.includes("até às 21:40") && c.includes("passo=confirmar") && c.includes("volta ao grupo"));
  // sem valor no cartão → sem valor na mensagem; sem voo → sem linha de voo
  const sem = mensagemAoGrupo("Rui Costa", { ...r, valor: 0, voo: "" }, l);
  assert.ok(!sem.includes("€") && !sem.includes("Voo"));
});
