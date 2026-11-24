// Testes da «Ajuda» ligada ao HUB-Central (src/lib/ajuda/hubCentral.ts).
// Só dados inventados: nomes, crachás, viagens e pedidos. Nenhum pedido sai
// do computador — o «HUB-Central» aqui é um fetch falso.
// Correr: node --test tests/ajuda-ligada.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AjudaErro,
  criarClienteHubCentral,
  criarActualizador,
  ligacaoDoErro,
  proximaLigada,
  textoDoErro,
  intervaloDaAjuda,
  haPedidosEmCurso,
  AJUDA_POLL_ACTIVO_MS,
  AJUDA_POLL_MS,
  AJUDA_VER_SE_LIGADA_MS,
  TEXTO_SESSAO,
} from "../src/lib/ajuda/hubCentral.ts";
import { lerLinkDoPedido, linkDoPedido } from "../src/lib/ajuda/regras.ts";
import { textoNaoPode } from "../src/lib/ajuda/textos.ts";

const URL_FALSA = "https://exemplo.invalid/exec";
const CRACHA = "eyJxIjoiWmV6aW5obyBUZXN0ZSJ9.assinaturaInventada";
const VIAGEM_REF = "TLX-INVENTADA-0001"; // como uma coluna A com a referência: nunca pode sair da app
const RESUMO = { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", voo: "XZ4821", origem: "Aeroporto", destino: "Hotel Inventado", valor: 0 };
const PEDIDO_RECEBIDO = {
  id: "ajInventado000001", tipo: "grupo", de: { id: "ana teste", nome: "Ana Teste" }, viagem: RESUMO,
  estado: "a_espera", criadoEm: "2026-11-24T10:00:00.000Z",
};
const MEU_PEDIDO = {
  id: "ajInventado000002", viagemRef: VIAGEM_REF, tipo: "colega", de: { id: "zezinho teste", nome: "Zezinho Teste" },
  para: { id: "rui teste", nome: "Rui Teste" }, motivo: "doente", estado: "a_espera", criadoEm: "2026-11-24T10:00:00.000Z",
};

/** Um HUB-Central falso: `responder(accao, params)` devolve o JSON. Regista cada pedido. */
function hubFalso(responder, { semRede = false } = {}) {
  const pedidos = [];
  const buscar = async (url, init = {}) => {
    let accao, params;
    if (init.method === "POST") {
      params = JSON.parse(init.body);
      accao = params.action;
    } else {
      const u = new URL(url);
      params = Object.fromEntries(u.searchParams.entries());
      accao = params.action;
    }
    pedidos.push({ url, metodo: init.method || "GET", accao, params, corpo: init.body ?? "" });
    if (semRede) throw new TypeError("Failed to fetch");
    const json = responder(accao, params);
    return { ok: true, status: 200, json: async () => json };
  };
  let avisos = 0;
  const cliente = criarClienteHubCentral({
    url: URL_FALSA,
    buscar,
    crachaParam: () => `&cracha=${encodeURIComponent(CRACHA)}`,
    crachaCampo: () => ({ cracha: CRACHA }),
    avisarSessao: (j) => { if (j && j.motivo === "sessao") { avisos++; return true; } return false; },
    relogio: () => 1_000,
  });
  return { cliente, pedidos, avisos: () => avisos };
}

/** O que a página faz na primeira leitura: devolve se mostra a ajuda. */
async function mostraAjuda(cliente, antes = false) {
  try {
    await cliente.meusPedidos();
    await cliente.recebidos();
    return proximaLigada(antes, "ligada");
  } catch (e) {
    return proximaLigada(antes, ligacaoDoErro(e));
  }
}

// ── Ligada ou não: o botão e os pedidos só aparecem se o backend disser ok ──

test("desligada: nada aparece", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "desligada", texto: "A ajuda entre motoristas está desligada." }));
  assert.equal(await mostraAjuda(h.cliente), false);
  assert.equal(await mostraAjuda(h.cliente, true), false, "se for desligada depois de ligada, desaparece");
  assert.equal(h.pedidos.length, 2, "uma leitura falhada não pede mais nada");
});

test("em TESTE, para quem não está no teste: nada aparece", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "fora_do_teste", texto: "A ajuda ainda está em teste." }));
  assert.equal(await mostraAjuda(h.cliente), false);
});

test("sem crachá, motorista desconhecido ou backend antigo: nada aparece (e não volta à senha)", async () => {
  for (const motivo of ["sem_cracha", "motorista_desconhecido", "accao_desconhecida", "erro", "ocupado"]) {
    const h = hubFalso(() => ({ ok: false, motivo, texto: "Inventado." }));
    assert.equal(await mostraAjuda(h.cliente), false, motivo);
    assert.equal(h.avisos(), 0, `${motivo} não é «sessao»`);
  }
});

test("ligada (TESTE com o nome dele, ou LIGADA): o botão aparece e os pedidos chegam", async () => {
  const h = hubFalso((accao) =>
    accao === "ajudaMeusPedidos" ? { ok: true, pedidos: [MEU_PEDIDO] }
    : accao === "ajudaRecebidos" ? { ok: true, pedidos: [PEDIDO_RECEBIDO] }
    : { ok: false, motivo: "accao_desconhecida" });
  assert.equal(await mostraAjuda(h.cliente), true);
  assert.deepEqual(await h.cliente.recebidos(), [PEDIDO_RECEBIDO]);
  assert.equal((await h.cliente.meusPedidos())[0].id, MEU_PEDIDO.id);
});

test("sem rede: fica como estava (escondida no início, ligada se já estava)", async () => {
  const h = hubFalso(() => ({ ok: true, pedidos: [] }), { semRede: true });
  assert.equal(await mostraAjuda(h.cliente, false), false);
  assert.equal(await mostraAjuda(h.cliente, true), true);
  await assert.rejects(h.cliente.meusPedidos(), (e) => e instanceof AjudaErro && e.motivo === "sem_rede");
});

// ── «sessao»: volta à senha e nada mostra que deu certo ──

test("«sessao»: avisa a página (volta à senha), falha e esconde a ajuda", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "sessao", texto: "A sessão terminou." }));
  assert.equal(await mostraAjuda(h.cliente, true), false);
  assert.equal(h.avisos(), 1);
  for (const f of [
    () => h.cliente.pedirAoGrupo({ viagemRef: VIAGEM_REF, motivo: "doente" }, RESUMO),
    () => h.cliente.responder({ pedidoId: PEDIDO_RECEBIDO.id, resposta: "sim" }),
    () => h.cliente.confirmar({ pedidoId: PEDIDO_RECEBIDO.id }),
    () => h.cliente.cancelar({ pedidoId: MEU_PEDIDO.id }),
  ]) {
    await assert.rejects(f(), (e) => e instanceof AjudaErro && e.motivo === "sessao" && e.texto === TEXTO_SESSAO);
  }
  assert.equal(h.avisos(), 5, "cada botão recusado avisa a página");
  assert.equal(ligacaoDoErro(new AjudaErro("sessao", TEXTO_SESSAO)), "sessao");
});

// ── nao_pode e reservada ──

test("nao_pode: falha com a razão do backend, e o texto mostra-a", async () => {
  const razao = "tem outra viagem a essa hora";
  const h = hubFalso(() => ({ ok: false, motivo: "nao_pode", texto: `Não pode ficar com esta viagem: ${razao}.`, razao, pedido: PEDIDO_RECEBIDO }));
  let erro;
  await assert.rejects(h.cliente.responder({ pedidoId: PEDIDO_RECEBIDO.id, resposta: "sim" }), (e) => { erro = e; return true; });
  assert.ok(erro instanceof AjudaErro);
  assert.equal(erro.motivo, "nao_pode");
  assert.equal(erro.razao, razao);
  assert.ok(textoDoErro(erro, "padrão").includes(razao));
  // mesmo que o texto do backend venha sem a razão, ela aparece
  assert.ok(textoDoErro(new AjudaErro("nao_pode", "Não pode.", razao), "padrão").includes(razao));
  assert.equal(textoNaoPode(razao + "."), `Não pode ficar com esta viagem: ${razao}.`);
});

test("reservada: não é erro, volta { ok:false, motivo:'reservada' } com o pedido (o botão não diz que deu certo)", async () => {
  const pedido = { ...PEDIDO_RECEBIDO, estado: "reservada" };
  const h = hubFalso(() => ({ ok: false, motivo: "reservada", texto: "Um colega está a confirmar esta viagem.", pedido }));
  const r = await h.cliente.responder({ pedidoId: PEDIDO_RECEBIDO.id, resposta: "sim" });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, "reservada");
  assert.equal(r.pedido.estado, "reservada");
  const c = await h.cliente.confirmar({ pedidoId: PEDIDO_RECEBIDO.id });
  assert.equal(c.ok, false);
});

test("os outros erros mostram o texto do backend", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "ja_ha_pedido", texto: "Já há um pedido em curso para esta viagem." }));
  await assert.rejects(h.cliente.pedirAColega({ viagemRef: VIAGEM_REF, para: "rui teste", motivo: "doente" }, RESUMO),
    (e) => textoDoErro(e, "padrão") === "Já há um pedido em curso para esta viagem.");
  assert.equal(textoDoErro(new Error("qualquer"), "padrão"), "padrão");
});

// ── O crachá decide quem é: nunca «motorista» nem «de» ──

test("todas as acções vão ao HUB-Central com o crachá e sem «motorista» nem «de»", async () => {
  const h = hubFalso((accao) => ({ ok: true, pedidos: [], colegas: [], pedido: accao === "ajudaRecebido" ? null : MEU_PEDIDO }));
  const c = h.cliente;
  // mesmo que alguém os ponha à força, não saem
  await c.colegas({ viagemRef: VIAGEM_REF, categoria: "MPV", resumo: RESUMO, motorista: "outro" });
  await c.pedirAColega({ viagemRef: VIAGEM_REF, para: "rui teste", motivo: "doente", de: "outro" }, RESUMO);
  await c.pedirAoGrupo({ viagemRef: VIAGEM_REF, motivo: "atrasado", de: "outro" }, RESUMO);
  await c.cancelar({ pedidoId: MEU_PEDIDO.id, de: "outro" });
  await c.meusPedidos();
  await c.recebidos();
  await c.recebido(PEDIDO_RECEBIDO.id);
  await c.responder({ pedidoId: PEDIDO_RECEBIDO.id, resposta: "nao", motorista: "outro" });
  await c.confirmar({ pedidoId: PEDIDO_RECEBIDO.id, motorista: "outro" });

  assert.deepEqual(h.pedidos.map((p) => p.accao), [
    "ajudaColegas", "ajudaPedir", "ajudaPedirGrupo", "ajudaCancelar", "ajudaMeusPedidos",
    "ajudaRecebidos", "ajudaRecebido", "ajudaResponder", "ajudaConfirmar",
  ]);
  for (const p of h.pedidos) {
    assert.ok(p.url.startsWith(URL_FALSA), `${p.accao}: vai ao HUB-Central`);
    assert.equal(p.params.cracha, CRACHA, `${p.accao}: leva o crachá`);
    assert.ok(!("motorista" in p.params), `${p.accao}: não leva motorista`);
    assert.ok(!("de" in p.params), `${p.accao}: não leva de`);
  }
  // as leituras por GET, as escritas por POST (crachá no corpo, não no endereço)
  const metodo = Object.fromEntries(h.pedidos.map((p) => [p.accao, p.metodo]));
  for (const a of ["ajudaColegas", "ajudaMeusPedidos", "ajudaRecebidos", "ajudaRecebido"]) assert.equal(metodo[a], "GET", a);
  for (const a of ["ajudaPedir", "ajudaPedirGrupo", "ajudaCancelar", "ajudaResponder", "ajudaConfirmar"]) {
    assert.equal(metodo[a], "POST", a);
    assert.ok(!h.pedidos.find((p) => p.accao === a).url.includes("cracha"), `${a}: crachá fora do endereço`);
  }
  assert.equal(h.pedidos[1].params.para, "rui teste");
  assert.equal(h.pedidos[6].params.pedido, PEDIDO_RECEBIDO.id);
});

test("entrada pelo link: pedido, podeAceitar e razão como o backend os diz", async () => {
  const h = hubFalso(() => ({ ok: true, pedido: PEDIDO_RECEBIDO, podeAceitar: false, razao: "o seu turno não cobre essa hora" }));
  const r = await h.cliente.recebido(PEDIDO_RECEBIDO.id);
  assert.equal(r.pedido.id, PEDIDO_RECEBIDO.id);
  assert.equal(r.podeAceitar, false);
  assert.equal(r.razao, "o seu turno não cobre essa hora");
  const h2 = hubFalso(() => ({ ok: true, pedido: null }));
  assert.deepEqual(await h2.cliente.recebido("ajNaoExiste00"), { pedido: null });
});

// ── Os links das mensagens: o backend escreve-os como a app os lê ──

// Cópia exacta das funções PURAS do backend (AJUDA_MOTORISTAS.js, versão 332):
// HUB_AJUDA.SITE e hubAjudaLink_. Se o backend mudar, este teste tem de mudar com ele.
const HUB_AJUDA = { SITE: "https://hubtransfer.pt", CAMINHO: "/driver/trips" };
function hubAjudaLink_(site, pedidoId, passo) {
  return String(site || "").replace(/\/+$/, "") + HUB_AJUDA.CAMINHO + "?ajuda=" + encodeURIComponent(pedidoId) + (passo === "confirmar" ? "&passo=confirmar" : "");
}
// Como o backend gera os ids: «aj» + 16 letras/números
const ID_INVENTADO = "aj" + "0123456789abcdef";

test("links: a app lê exactamente o que o backend escreve (site verdadeiro, só o id do pedido)", () => {
  for (const passo of ["pedido", "confirmar"]) {
    const link = hubAjudaLink_(HUB_AJUDA.SITE, ID_INVENTADO, passo);
    const u = new URL(link);
    assert.equal(u.origin, "https://hubtransfer.pt");
    assert.equal(u.pathname, "/driver/trips");
    assert.deepEqual(lerLinkDoPedido(u.search), { pedidoId: ID_INVENTADO, passo });
    assert.equal(linkDoPedido("https://hubtransfer.pt/", ID_INVENTADO, passo), link, "a app e o backend fazem o mesmo link");
    assert.ok(!link.includes(VIAGEM_REF) && !/TLX|WT-|viagem|motorista|cracha/i.test(link), "o link só leva o id do pedido");
  }
  // com o endereço do site com «/» no fim (HUB_AJUDA_SITE), igual
  assert.equal(hubAjudaLink_("https://hubtransfer.pt/", ID_INVENTADO), "https://hubtransfer.pt/driver/trips?ajuda=" + ID_INVENTADO);
  // um id que não é do backend não abre nada
  assert.equal(lerLinkDoPedido("?ajuda=" + encodeURIComponent("TLX 123/45")), null);
});

test("a referência da viagem nunca vai num link nem num GET além do ajudaColegas", async () => {
  const h = hubFalso(() => ({ ok: true, pedidos: [MEU_PEDIDO], colegas: [], pedido: PEDIDO_RECEBIDO }));
  await h.cliente.meusPedidos();
  await h.cliente.recebidos();
  await h.cliente.recebido(PEDIDO_RECEBIDO.id);
  for (const p of h.pedidos) assert.ok(!p.url.includes(VIAGEM_REF), `${p.accao}: sem a referência no endereço`);
});

// ── A actualização: 30/60 s, só com a app à vista ──

test("intervalos: 30 s com pedidos em curso, 60 s sem, 5 min escondida", () => {
  assert.equal(intervaloDaAjuda(true, true), AJUDA_POLL_ACTIVO_MS);
  assert.equal(intervaloDaAjuda(true, false), AJUDA_POLL_MS);
  assert.equal(intervaloDaAjuda(false, true), AJUDA_VER_SE_LIGADA_MS);
  assert.equal(AJUDA_POLL_ACTIVO_MS, 30_000);
  assert.equal(AJUDA_POLL_MS, 60_000);
  assert.equal(haPedidosEmCurso([{ estado: "a_espera" }], []), true);
  assert.equal(haPedidosEmCurso([], [{ estado: "reservada" }]), true);
  assert.equal(haPedidosEmCurso([{ estado: "aceite" }], [{ estado: "cancelado" }]), false);
});

/** Relógio falso para o actualizador. */
function relogioFalso() {
  let agora = 0; let seq = 0; const fila = new Map();
  return {
    agendar: (f, ms) => { const id = ++seq; fila.set(id, { f, quando: agora + ms }); return id; },
    cancelar: (id) => { fila.delete(id); },
    pendentes: () => fila.size,
    async avancar(ms) {
      agora += ms;
      for (const [id, t] of [...fila]) if (t.quando <= agora) { fila.delete(id); t.f(); }
      await new Promise((r) => setImmediate(r));
    },
  };
}

test("a actualização pára quando a app fica escondida e volta quando fica à vista", async () => {
  const r = relogioFalso();
  let visivel = true; let leituras = 0;
  const a = criarActualizador({
    carregar: async () => { leituras++; },
    intervalo: () => 60_000,
    visivel: () => visivel,
    agendar: r.agendar, cancelar: r.cancelar,
  });
  await a.iniciar();
  assert.equal(leituras, 1, "lê ao abrir");
  await r.avancar(60_000);
  assert.equal(leituras, 2, "lê ao fim de 60 s");

  visivel = false; a.mudouVisibilidade();
  assert.equal(r.pendentes(), 0, "escondida: nada agendado");
  await r.avancar(10 * 60_000);
  assert.equal(leituras, 2, "escondida: não lê");

  visivel = true; await a.mudouVisibilidade();
  assert.equal(leituras, 3, "ao voltar, lê logo");
  assert.equal(r.pendentes(), 1, "e volta ao ritmo");

  a.parar();
  assert.equal(r.pendentes(), 0);
  await r.avancar(120_000);
  assert.equal(leituras, 3, "parado: não lê");
});

test("o actualizador nunca faz duas leituras ao mesmo tempo nem duplica o relógio", async () => {
  const r = relogioFalso();
  let soltar; let leituras = 0;
  const a = criarActualizador({
    carregar: () => { leituras++; return new Promise((ok) => { soltar = ok; }); },
    intervalo: () => 30_000, visivel: () => true, agendar: r.agendar, cancelar: r.cancelar,
  });
  const p1 = a.iniciar();
  const p2 = a.agora(); // um botão pede actualização enquanto a primeira corre
  assert.equal(leituras, 1);
  soltar(); await p1; await p2;
  assert.equal(r.pendentes(), 1);
  a.parar();
});
