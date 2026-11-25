// Testes do aviso da Stripe (src/lib/pagamento/webhook.ts), sem rede: nem a Stripe nem o backend verdadeiros.
// Correr: node --test tests/pagamento-webhook.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { assinaturaValida, corpoDoEvento, curto, tratarAviso, Vistos } from "../src/lib/pagamento/webhook.ts";

const SEG_STRIPE = "whsec_teste_inventado";
const SEG_HUB = "segredo-hub-inventado";
const AGORA = 1_795_000_000;

const assinar = (corpo, t = AGORA, seg = SEG_STRIPE) =>
  `t=${t},v1=${createHmac("sha256", seg).update(`${t}.${corpo}`).digest("hex")}`;

const evento = (extra = {}, sessao = {}) =>
  JSON.stringify({
    id: "evt_1TesteInventado",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_inventada",
        payment_status: "paid",
        amount_total: 12500,
        currency: "eur",
        client_reference_id: "K-0012",
        metadata: { hub: "P-0042", carrinho: "K-0012", pedido: "M-0007" },
        ...sessao,
      },
    },
    ...extra,
  });

function deps(over = {}) {
  const enviados = [];
  const registos = [];
  const tarefas = [];
  const d = {
    env: { segredoStripe: SEG_STRIPE, segredoHub: SEG_HUB, urlBackend: "http://backend.falso/exec" },
    vistos: new Vistos(),
    agoraS: () => AGORA,
    enviar: async (url, corpo) => {
      enviados.push({ url, corpo });
      return { ok: true };
    },
    agendar: (t) => tarefas.push(t),
    registar: (l) => registos.push(l),
    ...over,
  };
  const correr = async () => {
    while (tarefas.length) await tarefas.shift()();
  };
  return { d, enviados, registos, correr };
}

test("assinatura certa passa; errada, sem cabeçalho, outro segredo ou fora do prazo não", () => {
  const c = evento();
  assert.equal(assinaturaValida(c, assinar(c), SEG_STRIPE, AGORA), true);
  assert.equal(assinaturaValida(c, assinar(c), SEG_STRIPE, AGORA + 299), true);
  assert.equal(assinaturaValida(c, assinar(c), SEG_STRIPE, AGORA + 301), false);
  assert.equal(assinaturaValida(c, null, SEG_STRIPE, AGORA), false);
  assert.equal(assinaturaValida(c, assinar(c, AGORA, "whsec_outro"), SEG_STRIPE, AGORA), false);
  assert.equal(assinaturaValida(c + " ", assinar(c), SEG_STRIPE, AGORA), false);
  assert.equal(assinaturaValida(c, "t=abc,v1=00", SEG_STRIPE, AGORA), false);
  // várias v1 (rotação do segredo na Stripe): basta uma certa
  assert.equal(assinaturaValida(c, `${assinar(c)},v1=deadbeef`.replace("v1=", "v1=00,v1="), SEG_STRIPE, AGORA), true);
});

test("evento pago: responde 200 já e manda ao backend exactamente o contrato do HIBRIDO_HUB", async () => {
  const { d, enviados, correr } = deps();
  const c = evento();
  const r = tratarAviso(c, assinar(c), d);
  assert.equal(r.status, 200);
  assert.equal(enviados.length, 0, "o backend só é chamado depois de responder");
  await correr();
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].url, "http://backend.falso/exec");
  assert.deepEqual(enviados[0].corpo, {
    action: "pagamentoConfirmado",
    segredo: SEG_HUB,
    hub: "P-0042",
    carrinho: "K-0012",
    pedido: "M-0007",
    evento: "evt_1TesteInventado",
    sessao: "cs_test_inventada",
    valorCent: 12500,
    moeda: "eur",
  });
});

test("async_payment_succeeded também segue", async () => {
  const { d, enviados, correr } = deps();
  const c = evento({ type: "checkout.session.async_payment_succeeded", id: "evt_async" });
  assert.equal(tratarAviso(c, assinar(c), d).status, 200);
  await correr();
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].corpo.evento, "evt_async");
});

test("assinatura errada: 400 e nada segue", async () => {
  const { d, enviados, correr } = deps();
  const c = evento();
  const r = tratarAviso(c, assinar(c, AGORA, "whsec_errado"), d);
  assert.equal(r.status, 400);
  await correr();
  assert.equal(enviados.length, 0);
});

test("evento repetido: 200 e o backend só recebe uma vez", async () => {
  const { d, enviados, correr } = deps();
  const c = evento();
  assert.equal(tratarAviso(c, assinar(c), d).status, 200);
  await correr();
  const r2 = tratarAviso(c, assinar(c), d);
  assert.equal(r2.status, 200);
  assert.equal(r2.corpo.repetido, true);
  await correr();
  assert.equal(enviados.length, 1);
});

test("evento não pago, sem metadata útil ou de outro tipo: 200 ignorado, nada segue", async () => {
  const { d, enviados, correr } = deps();
  for (const c of [
    evento({}, { payment_status: "unpaid" }),
    evento({}, { payment_status: "no_payment_required" }),
    evento({ type: "checkout.session.expired" }),
    evento({ type: "checkout.session.async_payment_failed" }),
    evento({ type: "payment_intent.succeeded" }),
  ]) {
    const r = tratarAviso(c, assinar(c), d);
    assert.equal(r.status, 200);
    assert.equal(r.corpo.ignorado, true);
  }
  await correr();
  assert.equal(enviados.length, 0);
});

test("o backend falhou: o evento é esquecido e uma repetição volta a tentar", async () => {
  let n = 0;
  const { d, enviados, correr } = deps({
    enviar: async (url, corpo) => {
      n++;
      if (n === 1) throw new Error("rede");
      enviados.push(corpo);
      return { ok: true };
    },
  });
  const c = evento();
  tratarAviso(c, assinar(c), d);
  await correr();
  assert.equal(enviados.length, 0);
  assert.equal(tratarAviso(c, assinar(c), d).corpo.repetido, undefined);
  await correr();
  assert.equal(enviados.length, 1);
});

test("sem STRIPE_WEBHOOK_SECRET ou sem HIBRIDO_PAGAR_SEGREDO: 500 (a Stripe tenta de novo mais tarde)", () => {
  const c = evento();
  assert.equal(tratarAviso(c, assinar(c), deps({ env: { segredoStripe: "", segredoHub: SEG_HUB, urlBackend: "x" } }).d).status, 500);
  assert.equal(tratarAviso(c, assinar(c), deps({ env: { segredoStripe: SEG_STRIPE, segredoHub: "", urlBackend: "x" } }).d).status, 500);
});

test("os registos só levam os 6 primeiros caracteres dos ids e nunca os segredos", async () => {
  const { d, registos, correr } = deps();
  const c = evento();
  tratarAviso(c, assinar(c), d);
  await correr();
  const tudo = registos.join("\n");
  assert.ok(tudo.includes("evt_1T…"));
  assert.ok(!tudo.includes("evt_1Te"));
  assert.ok(!tudo.includes("cs_test_inv"));
  assert.ok(!tudo.includes(SEG_HUB) && !tudo.includes(SEG_STRIPE));
  assert.equal(curto("abcdefghij"), "abcdef…");
});

test("corpoDoEvento lê o metadata e os valores da sessão", () => {
  const c = corpoDoEvento(JSON.parse(evento({}, { metadata: { carrinho: "K-0012-B" } })), "s");
  assert.equal(c.carrinho, "K-0012-B");
  assert.equal(c.hub, "");
  assert.equal(c.pedido, "");
});
