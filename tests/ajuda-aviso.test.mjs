// Testes do aviso do tempo na «Ajuda» (24/11/2026): verde, amarelo, vermelho,
// o «Aceitar mesmo assim» com o sinal avisoVisto e o motivo «aviso».
// Só dados inventados: nomes, crachás, viagens e pedidos. Nenhum pedido sai
// do computador — o «HUB-Central» aqui é um fetch falso. Os ecrãs são
// desenhados em HTML com o react-dom/server (empacotados com o esbuild que já
// vem com o projecto), sem browser.
// Correr: node --test tests/ajuda-aviso.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AjudaErro,
  comoMostrarAviso,
  criarClienteHubCentral,
  lerAviso,
  ligacaoDoErro,
  pedidoDeResposta,
  proximaLigada,
  TEXTO_SESSAO,
} from "../src/lib/ajuda/hubCentral.ts";
import { T } from "../src/lib/ajuda/textos.ts";

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const URL_FALSA = "https://exemplo.invalid/exec";
const CRACHA = "eyJxIjoiQ2FybG9zIEludmVudGFkbyJ9.assinaturaInventada";
const RESUMO = { rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "16:35", voo: "XZ4821", origem: "Aeroporto", destino: "Hotel Inventado", valor: 0 };
const EU = { id: "carlos inventado", nome: "Carlos Inventado" };
const AGORA = Date.parse("2026-11-24T12:05:00.000Z");
const pedido = (tipo) => ({
  id: tipo === "grupo" ? "ajInventadoGrupo01" : "ajInventadoColega1", tipo, de: { id: "rita inventada", nome: "Rita Inventada" },
  viagem: RESUMO, estado: "a_espera", criadoEm: "2026-11-24T12:00:00.000Z",
  ...(tipo === "colega" ? { expiraEm: "2026-11-24T12:15:00.000Z" } : {}),
});

const VERDE = { cor: "verde", minutos: 0, atraso: false, folga: 40, conta: "", limite: 20, texto: "" };
const AMARELO = { cor: "amarelo", minutos: 30, atraso: false, folga: 30, conta: "anterior", limite: 20,
  texto: "Fica apertado: tem cerca de 30 min entre o fim da sua viagem das 08:30 e esta recolha." };
const VERMELHO = { cor: "vermelho", minutos: 35, atraso: true, folga: -35, conta: "anterior", limite: 20,
  texto: "Atenção: pelas nossas contas, chega cerca de 35 min atrasado a esta recolha. A sua viagem das 15:40 acaba por volta das 16:40." };
const SEM_SINAL = VERMELHO.texto + " Para aceitar mesmo assim, a app tem de lhe pedir que confirme que viu este aviso.";

/** Um HUB-Central falso: `responder(accao, params)` devolve o JSON. Regista cada pedido. */
function hubFalso(responder) {
  const pedidos = [];
  const buscar = async (url, init = {}) => {
    const params = init.method === "POST" ? JSON.parse(init.body) : Object.fromEntries(new URL(url).searchParams.entries());
    pedidos.push({ metodo: init.method || "GET", accao: params.action, params });
    const json = responder(params.action, params);
    return { ok: true, status: 200, json: async () => json };
  };
  let avisos = 0;
  const cliente = criarClienteHubCentral({
    url: URL_FALSA, buscar,
    crachaParam: () => `&cracha=${encodeURIComponent(CRACHA)}`,
    crachaCampo: () => ({ cracha: CRACHA }),
    avisarSessao: (j) => { if (j && j.motivo === "sessao") { avisos++; return true; } return false; },
    relogio: () => 1_000,
  });
  return { cliente, pedidos, avisos: () => avisos };
}

// ── Os ecrãs, desenhados em HTML ─────────────────────────────────

let ecras;
before(async () => {
  const esbuild = require("esbuild");
  const pasta = mkdtempSync(join(tmpdir(), "ajuda-aviso-"));
  const saida = join(pasta, "ecras.cjs");
  await esbuild.build({
    stdin: {
      contents: `
        import React from "react";
        import { renderToStaticMarkup } from "react-dom/server";
        import { CartaoRecebido, CaixaAvisoTempo } from "@/components/driver/ajuda/PedidosRecebidos";
        import { AjudaClienteContexto } from "@/components/driver/ajuda/contexto";
        const falso = { recebido: async () => ({ pedido: null }) };
        const nada = () => {};
        export function cartao(p, eu, agora, avisoTempo, extra = {}) {
          return renderToStaticMarkup(React.createElement(AjudaClienteContexto.Provider, { value: falso },
            React.createElement(CartaoRecebido, { p, eu, agora, avisoTempo, onDesfecho: nada, onDispensar: nada, onNaoPosso: nada, ...extra })));
        }
        export function caixa(aviso) { return renderToStaticMarkup(React.createElement(CaixaAvisoTempo, { aviso })); }
      `,
      resolveDir: RAIZ,
      loader: "tsx",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    tsconfig: join(RAIZ, "tsconfig.json"),
    outfile: saida,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  ecras = require(saida);
  rmSync(pasta, { recursive: true, force: true });
});

const botoes = (html) => [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());

// ── 1. Verde: não mostra nada ────────────────────────────────────

test("verde: sem caixa, os botões como antes (colega e grupo)", () => {
  assert.equal(ecras.caixa(VERDE), "");
  assert.deepEqual(comoMostrarAviso(lerAviso(VERDE), "x"), { tipo: "nenhum" });
  const colega = ecras.cartao(pedido("colega"), EU, AGORA, lerAviso(VERDE));
  assert.ok(!colega.includes("data-aviso"));
  assert.deepEqual(botoes(colega), [T.naoPosso, T.simFaco]);
  const grupo = ecras.cartao(pedido("grupo"), EU, AGORA, lerAviso(VERDE));
  assert.ok(!grupo.includes("data-aviso"));
  assert.deepEqual(botoes(grupo), [T.aceitar]);
  // sem aviso nenhum (backend antigo), também igual
  assert.deepEqual(botoes(ecras.cartao(pedido("grupo"), EU, AGORA, null)), [T.aceitar]);
});

// ── 2. Amarelo: a caixa amarela, os botões normais ───────────────

test("amarelo: o texto numa caixa amarela e os botões normais", () => {
  const colega = ecras.cartao(pedido("colega"), EU, AGORA, lerAviso(AMARELO));
  assert.ok(colega.includes('data-aviso="amarelo"'));
  assert.ok(colega.includes(AMARELO.texto));
  assert.ok(!colega.includes(T.avisoTitulo), "sem o título do vermelho");
  assert.deepEqual(botoes(colega), [T.naoPosso, T.simFaco]);
  const grupo = ecras.cartao(pedido("grupo"), EU, AGORA, lerAviso(AMARELO));
  assert.ok(grupo.includes('data-aviso="amarelo"'));
  assert.deepEqual(botoes(grupo), [T.aceitar]);
  // o «Sim, faço» com amarelo não leva o sinal
  assert.deepEqual(pedidoDeResposta("ajX", "sim", false), { pedidoId: "ajX", resposta: "sim" });
});

test("amarelo sem texto: nada aparece", () => {
  assert.equal(ecras.caixa({ ...AMARELO, texto: "" }), "");
});

// ── 3. Vermelho: caixa vermelha, «Atenção ao tempo», «Aceitar mesmo assim» ──

test("vermelho: a caixa vermelha com o título e o «Aceitar mesmo assim»; o «Não posso» fica igual", () => {
  const colega = ecras.cartao(pedido("colega"), EU, AGORA, lerAviso(VERMELHO));
  assert.ok(colega.includes('data-aviso="vermelho"'));
  assert.ok(colega.includes("Atenção ao tempo"));
  assert.ok(colega.includes(VERMELHO.texto));
  assert.deepEqual(botoes(colega), [T.naoPosso, "Aceitar mesmo assim"]);
  const grupo = ecras.cartao(pedido("grupo"), EU, AGORA, lerAviso(VERMELHO));
  assert.ok(grupo.includes('data-aviso="vermelho"') && grupo.includes("Atenção ao tempo"));
  assert.deepEqual(botoes(grupo), ["Aceitar mesmo assim"]);
});

test("vermelho, no passo de deslizar (colega): a caixa continua à vista", () => {
  const html = ecras.cartao(pedido("colega"), EU, AGORA, lerAviso(VERMELHO), { faseInicial: "confirmar" });
  assert.ok(html.includes('data-aviso="vermelho"'));
});

test("vermelho: o «Aceitar mesmo assim» manda avisoVisto: true; o «Não posso» nunca", async () => {
  assert.deepEqual(pedidoDeResposta("ajX", "sim", true), { pedidoId: "ajX", resposta: "sim", avisoVisto: true });
  assert.deepEqual(pedidoDeResposta("ajX", "nao", true), { pedidoId: "ajX", resposta: "nao" });
  const h = hubFalso(() => ({ ok: true, pedido: pedido("colega"), aviso: VERMELHO }));
  await h.cliente.responder(pedidoDeResposta("ajInventadoColega1", "sim", true));
  await h.cliente.responder(pedidoDeResposta("ajInventadoColega1", "nao", true));
  await h.cliente.responder({ pedidoId: "ajInventadoColega1", resposta: "nao", avisoVisto: true });
  assert.equal(h.pedidos[0].params.avisoVisto, true);
  assert.equal(h.pedidos[0].params.cracha, CRACHA);
  assert.ok(!("avisoVisto" in h.pedidos[1].params));
  assert.ok(!("avisoVisto" in h.pedidos[2].params), "nem que alguém o ponha num «nao»");
  // sem o vermelho, o «sim» não leva o sinal
  await h.cliente.responder({ pedidoId: "ajInventadoColega1", resposta: "sim" });
  assert.ok(!("avisoVisto" in h.pedidos[3].params));
});

test("vermelho sem texto: a caixa mostra um texto de reserva, nunca vazia", () => {
  const html = ecras.caixa({ ...VERMELHO, texto: "" });
  assert.ok(html.includes(T.avisoVermelhoPadrao));
});

// ── O aviso que chega do ajudaRecebido ───────────────────────────

test("ajudaRecebido: o aviso chega lido; uma cor desconhecida ou lixo ficam de fora", async () => {
  for (const [aviso, cor] of [[VERDE, "verde"], [AMARELO, "amarelo"], [VERMELHO, "vermelho"]]) {
    const h = hubFalso(() => ({ ok: true, pedido: pedido("grupo"), podeAceitar: true, aviso }));
    const r = await h.cliente.recebido("ajInventadoGrupo01");
    assert.equal(r.aviso.cor, cor);
    assert.equal(r.aviso.texto, aviso.texto);
  }
  for (const lixo of [{ cor: "roxo", texto: "x" }, "vermelho", null, [1], undefined]) {
    const h = hubFalso(() => ({ ok: true, pedido: pedido("grupo"), aviso: lixo }));
    assert.equal((await h.cliente.recebido("ajInventadoGrupo01")).aviso, undefined);
  }
  assert.equal(lerAviso({ cor: "VERMELHO", minutos: "35", texto: " t " }).cor, "vermelho");
  assert.equal(lerAviso({ cor: "vermelho", minutos: "35", texto: " t " }).minutos, 35);
});

// ── 4. O motivo «aviso» depois de carregar, e o segundo envio com o sinal ──

test("motivo «aviso» no «Aceitar» do grupo: não dá certo, mostra o aviso; o segundo envio leva o sinal", async () => {
  const h = hubFalso((accao, params) => params.avisoVisto === true
    ? { ok: true, pedido: { ...pedido("grupo"), estado: "reservada", reservadaParaMim: true }, aviso: VERMELHO }
    : { ok: false, motivo: "aviso", texto: SEM_SINAL, aviso: VERMELHO, pedido: pedido("grupo") });

  // 1.º toque, sem sinal (a app ainda não sabia do vermelho)
  const r1 = await h.cliente.responder(pedidoDeResposta("ajInventadoGrupo01", "sim", false));
  assert.equal(r1.ok, false, "nada mostra que deu certo");
  assert.equal(r1.motivo, "aviso");
  assert.equal(r1.aviso.cor, "vermelho");
  assert.equal(r1.aviso.texto, VERMELHO.texto, "mostra-se o texto do aviso, não a frase para apps antigas");
  assert.ok(!("avisoVisto" in h.pedidos[0].params));

  // o ecrã passa a mostrar a caixa vermelha e o «Aceitar mesmo assim»
  const html = ecras.cartao(pedido("grupo"), EU, AGORA, r1.aviso);
  assert.ok(html.includes("Atenção ao tempo"));
  assert.deepEqual(botoes(html), ["Aceitar mesmo assim"]);

  // 2.º toque, com o sinal
  const r2 = await h.cliente.responder(pedidoDeResposta("ajInventadoGrupo01", "sim", comoMostrarAviso(r1.aviso, "").tipo === "vermelho"));
  assert.equal(h.pedidos[1].params.avisoVisto, true);
  assert.equal(r2.ok, true);
  assert.equal(r2.pedido.reservadaParaMim, true);
  assert.equal(h.pedidos.length, 2);
});

test("motivo «aviso» no «Sim, faço» do colega: igual, e sem pedido na resposta também serve", async () => {
  const h = hubFalso((accao, params) => params.avisoVisto === true
    ? { ok: true, pedido: { ...pedido("colega"), estado: "aceite", ficouCom: EU } }
    : { ok: false, motivo: "aviso", texto: SEM_SINAL, aviso: VERMELHO });
  const r1 = await h.cliente.responder({ pedidoId: "ajInventadoColega1", resposta: "sim" });
  assert.deepEqual([r1.ok, r1.motivo, r1.pedido], [false, "aviso", undefined]);
  const r2 = await h.cliente.responder(pedidoDeResposta("ajInventadoColega1", "sim", true));
  assert.equal(r2.ok, true);
  assert.equal(r2.pedido.ficouCom.id, EU.id);
});

test("motivo «aviso» sem um aviso que se leia: falha com o texto do backend (nunca «deu certo»)", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "aviso", texto: SEM_SINAL, aviso: { cor: "roxo" } }));
  await assert.rejects(h.cliente.responder({ pedidoId: "ajX", resposta: "sim" }),
    (e) => e instanceof AjudaErro && e.motivo === "aviso" && e.texto === SEM_SINAL);
});

test("motivo «aviso» vem sempre como vermelho (é o vermelho que pede o sinal)", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "aviso", texto: SEM_SINAL, aviso: { ...VERMELHO, cor: "amarelo" } }));
  const r = await h.cliente.responder({ pedidoId: "ajX", resposta: "sim" });
  assert.equal(r.aviso.cor, "vermelho");
});

test("«sessao» no «Aceitar mesmo assim»: volta à senha e falha", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "sessao", texto: "A sessão terminou." }));
  await assert.rejects(h.cliente.responder(pedidoDeResposta("ajX", "sim", true)),
    (e) => e instanceof AjudaErro && e.motivo === "sessao" && e.texto === TEXTO_SESSAO);
  assert.equal(h.avisos(), 1);
});

test("a segunda confirmação do grupo não leva o sinal", async () => {
  const h = hubFalso(() => ({ ok: true, pedido: { ...pedido("grupo"), estado: "aceite", ficouCom: EU } }));
  await h.cliente.confirmar({ pedidoId: "ajInventadoGrupo01", avisoVisto: true });
  assert.ok(!("avisoVisto" in h.pedidos[0].params));
});

// ── 5. Com a ajuda desligada, nada aparece ───────────────────────

test("desligada: a ajuda fica escondida e não se pede o aviso a ninguém", async () => {
  const h = hubFalso(() => ({ ok: false, motivo: "desligada", texto: "A ajuda entre motoristas está desligada." }));
  let ligada = false;
  try { await h.cliente.meusPedidos(); ligada = true; } catch (e) { ligada = proximaLigada(false, ligacaoDoErro(e)); }
  assert.equal(ligada, false);
  assert.equal(h.pedidos.length, 1);
  assert.ok(h.pedidos.every((p) => p.accao !== "ajudaRecebido" && p.accao !== "ajudaResponder"));
  // e um aviso que ainda viesse de um recebido falhado não chega ao ecrã
  await assert.rejects(h.cliente.recebido("ajX"), (e) => e instanceof AjudaErro && e.motivo === "desligada");
});

// ── Os textos novos não falam de cliente, operadora nem referência ──

test("os textos do aviso: sem «tu», sem operadora nem referência", () => {
  for (const t of [T.avisoTitulo, T.aceitarMesmoAssim, T.avisoVermelhoPadrao]) {
    assert.ok(!/\btu\b|talixo|heycars|booking|TLX|WT-/i.test(t), t);
  }
  assert.equal(T.avisoTitulo, "Atenção ao tempo");
  assert.equal(T.aceitarMesmoAssim, "Aceitar mesmo assim");
});
