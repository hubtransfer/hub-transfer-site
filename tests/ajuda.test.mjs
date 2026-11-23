// Testes da «Ajuda» (src/lib/ajuda/regras.ts e textos.ts). Dados inventados.
// Correr: node --test tests/ajuda.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colegasPossiveis,
  carroServe,
  estadoEfectivo,
  minutosAteExpirar,
  prazoDoPedido,
  podePedirAjuda,
  pedidosPorResponder,
  viagemSaiDeQuemPediu,
  nomeCurto,
  deOndeParaOnde,
  minutosDoDia,
  hhmm,
} from "../src/lib/ajuda/regras.ts";
import {
  T,
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
  textoValor,
  linhasResumo,
  textosDoPedido,
} from "../src/lib/ajuda/textos.ts";
import { rotuloMotorista } from "../src/lib/rotuloViagem.ts";

const M = (id, nome, categoria, extra = {}) => ({
  id, nome, categoria, trabalhaNoDia: true, turnoInicio: "06:00", turnoFim: "22:00", viagens: [], ...extra,
});

// ── colegas possíveis ──────────────────────────────────────────

test("só quem trabalha no dia, com o carro certo e livre à hora", () => {
  const motoristas = [
    M("a", "Alberto Lima", "MPV"),
    M("b", "Beatriz Rocha", "Sedan"),                                       // carro errado
    M("c", "Carlos Dias", "MPV", { trabalhaNoDia: false }),                 // folga
    M("d", "Diana Faria", "MPV", { viagens: [{ hora: "14:10", duracaoMin: 40 }] }), // ocupada
    M("e", "Eduardo Pinto", "MPV", { turnoFim: "14:45" }),                  // turno acaba antes
    M("f", "Filipa Melo", "MPV", { turnoInicio: "14:20" }),                 // entra tarde
    M("eu", "Eu Mesmo", "MPV"),                                             // quem pede
  ];
  const r = colegasPossiveis({ hora: "14:30", categoria: "MPV" }, motoristas, "eu");
  assert.deepEqual(r.map((c) => c.id), ["a"]);
});

test("viagem à mesma hora ou logo a seguir conta como ocupado; mais tarde é a próxima viagem", () => {
  const ms = [
    M("x", "Xavier Reis", "Sedan", { viagens: [{ hora: "15:40", duracaoMin: 30 }] }), // começa 10 min depois do fim → ocupado
    M("y", "Yara Brito", "Sedan", { viagens: [{ hora: "17:00", duracaoMin: 30 }] }),
    M("z", "Zé Matos", "Sedan", { turnoFim: "20:00" }),
  ];
  const r = colegasPossiveis({ hora: "14:30", categoria: "Sedan" }, ms, "eu");
  assert.deepEqual(r.map((c) => c.id), ["z", "y"]);           // quem fica livre mais tempo primeiro
  assert.equal(r[0].livreAte, "20:00");
  assert.equal(r[1].proximaViagem, "17:00");
  assert.equal(r[1].livreAte, undefined);
});

test("categoria: igual serve; vazia serve a todos; estranha a ninguém", () => {
  assert.equal(carroServe("MPV", "MPV"), true);
  assert.equal(carroServe("mpv", "MPV"), true);
  assert.equal(carroServe("MPV", "Sedan"), false);
  assert.equal(carroServe("Sedan", "Business"), false);
  assert.equal(carroServe("", "Sedan"), true);
  assert.equal(carroServe("Talixo", "Sedan"), false);
});

test("hora inválida → lista vazia; horas", () => {
  assert.deepEqual(colegasPossiveis({ hora: "", categoria: "MPV" }, [M("a", "A", "MPV")], "eu"), []);
  assert.equal(minutosDoDia("07:05"), 425);
  assert.equal(minutosDoDia("25:00"), null);
  assert.equal(hhmm(425), "07:05");
});

// ── estado do pedido e 15 minutos ─────────────────────────────

test("15 minutos sem resposta → sem_resposta; grupo não expira", () => {
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

test("pedidos por responder: só à espera, dentro do prazo, sem dono; mais antigos primeiro", () => {
  const agora = Date.parse("2026-11-24T10:10:00Z");
  const base = { de: { id: "r", nome: "Rui" }, viagem: {}, tipo: "colega" };
  const lista = [
    { ...base, id: "2", estado: "a_espera", criadoEm: "2026-11-24T10:05:00Z", expiraEm: "2026-11-24T10:20:00Z" },
    { ...base, id: "1", estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z", expiraEm: "2026-11-24T10:15:00Z" },
    { ...base, id: "3", estado: "a_espera", criadoEm: "2026-11-24T09:00:00Z", expiraEm: "2026-11-24T09:15:00Z" }, // expirou
    { ...base, id: "4", estado: "aceite", criadoEm: "2026-11-24T10:01:00Z" },
    { ...base, id: "5", tipo: "grupo", estado: "a_espera", criadoEm: "2026-11-24T08:00:00Z" },
    { ...base, id: "6", tipo: "grupo", estado: "a_espera", criadoEm: "2026-11-24T08:00:00Z", ficouCom: { id: "a", nome: "A" } },
  ];
  assert.deepEqual(pedidosPorResponder(lista, agora).map((p) => p.id), ["5", "1", "2"]);
});

test("aceite → a viagem sai de quem pediu; recusado não", () => {
  assert.equal(viagemSaiDeQuemPediu({ estado: "aceite", ficouCom: { id: "a", nome: "A" } }), true);
  assert.equal(viagemSaiDeQuemPediu({ estado: "recusado" }), false);
  assert.equal(viagemSaiDeQuemPediu({ estado: "a_espera" }), false);
});

test("textos: nome curto, rota, valor, faltam", () => {
  assert.equal(nomeCurto("Rui Martins Costa"), "Rui Costa");
  assert.equal(nomeCurto("  Ana  "), "Ana");
  assert.equal(deOndeParaOnde({ origem: "Aeroporto de Lisboa", destino: "Hotel Sol" }), "Aeroporto de Lisboa → Hotel Sol");
  assert.equal(textoValor(35), "€35");
  assert.equal(textoValor(0), "");
  assert.equal(textoFaltam(12), "Faltam 12 min");
  assert.equal(textoFaltam(1), "Falta menos de 1 min");
  assert.equal(linhaColega({ categoria: "MPV", livreAte: "18:00" }), "MPV · livre até 18:00");
  assert.equal(linhaColega({ categoria: "Sedan", proximaViagem: "16:30" }), "Sedan · próxima viagem às 16:30");
  assert.equal(textoDeslizarColega("Rui Costa"), "Deslize para pedir a Rui Costa");
  assert.equal(textoEspera("Rui Costa").frase, "A viagem continua consigo até Rui Costa aceitar.");
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
  const palavras = texto.split(/[\s·→,.«»:()]+/).filter(Boolean);
  assert.ok(!palavras.includes(op.codigo), `${onde}: «${texto}» tem o código ${op.codigo}`);
  assert.ok(!texto.toLowerCase().includes(op.nome.toLowerCase()), `${onde}: «${texto}» tem o nome ${op.nome}`);
  assert.ok(!texto.includes(op.ref), `${onde}: «${texto}» tem a referência ${op.ref}`);
  const num = op.ref.replace(/\D/g, "");
  assert.ok(!texto.includes(num), `${onde}: «${texto}» tem o número da reserva ${num}`);
}

test("cada operadora: nenhum texto dos ecrãs da ajuda a mostra", () => {
  const tipos = ["CHEGADA", "RECOLHA", "TRANSFER"];
  for (const op of OPERADORAS) {
    for (const tipo of tipos) {
      // A viagem como vem do HUB-Central, com a operadora em todo o lado
      const viagem = {
        id: op.ref, platform: op.nome, platformCode: op.codigo, sourceLabel: op.codigo,
        tipo, categoriaNome: op.codigo, // até com a categoria estragada
      };
      const resumo = {
        rotulo: rotuloMotorista({ tipo: viagem.tipo, categoriaNome: viagem.categoriaNome }),
        data: "24/11/2026", hora: "14:30", origem: "Aeroporto de Lisboa", destino: "Hotel Jardim do Rio", valor: 35,
      };
      const de = { id: "rui-costa", nome: "Rui Costa" };
      const para = { id: "ana-ferreira", nome: "Ana Ferreira" };
      const pedido = {
        id: "aj-1", viagemRef: "735", tipo: "colega", de, para, estado: "aceite",
        criadoEm: "2026-11-24T10:00:00Z", expiraEm: "2026-11-24T10:15:00Z", ficouCom: para,
      };
      const recebido = { id: "aj-1", tipo: "colega", de, viagem: resumo, estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z" };
      const recebidoGrupo = { ...recebido, tipo: "grupo", ficouCom: para };

      const textos = [
        ...Object.values(T),
        ...textosDoPedido(pedido),
        ...textosDoPedido(recebido),
        ...textosDoPedido(recebidoGrupo),
        ...linhasResumo(resumo),
        linhaColega({ categoria: "MPV", livreAte: "18:00" }),
        textoQuemPede(recebido), textoQuemPede(recebidoGrupo),
        textoConfirmarFicar(de.nome), textoFicou().titulo, textoFicou().frase,
        textoSemResposta(para.nome).titulo, textoAceite(para.nome).titulo, textoRecusado(para.nome),
        // o que vai no pedido recebido, serializado (é o que o colega recebe)
        JSON.stringify(recebido),
      ];
      for (const t of textos) semOperadora(String(t), op, `${op.codigo}/${tipo}`);
    }
  }
});

test("o pedido recebido não leva o nome nem o telefone do cliente", () => {
  const recebido = {
    id: "aj-9", tipo: "colega", de: { id: "rui-costa", nome: "Rui Costa" },
    viagem: { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", origem: "Aeroporto de Lisboa", destino: "Hotel Sol", valor: 35 },
    estado: "a_espera", criadoEm: "2026-11-24T10:00:00Z",
  };
  const chaves = JSON.stringify(recebido);
  for (const k of ["client", "cliente", "phone", "telefone", "contacto"]) {
    assert.ok(!chaves.includes(`"${k}"`), `o pedido recebido tem o campo ${k}`);
  }
});
