// Testes de ponta a ponta do pedido E11 (páginas de pagamento + aviso da Stripe), no site construído.
// Antes: npm run build. Correr: node --test tests/pagamento.e2e.mjs
// Arranca o «next start» na porta 3107 com segredos inventados e um backend FALSO local (porta 3197):
// nada chama a Stripe nem o HUB-Central verdadeiros. Capturas (opcional): PAGAMENTO_CAPTURAS=pasta
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { chromium, webkit } from "playwright";

const PORTA = 3107;
const PORTA_BACK = 3197;
const BASE = `http://127.0.0.1:${PORTA}`;
const SEG_STRIPE = "whsec_teste_e2e_inventado";
const SEG_HUB = "segredo-hub-e2e-inventado";
const CAPTURAS = process.env.PAGAMENTO_CAPTURAS || "";

const LINGUAS = ["en", "pt", "es", "fr", "it"];
const rota = (l, p) => `${l === "en" ? "" : "/" + l}/pagamento/${p}`;
const TITULO = {
  obrigado: { en: "Thank you", pt: "Obrigado", es: "Gracias", fr: "Merci", it: "Grazie" },
  cancelado: { en: "not completed", pt: "não foi concluído", es: "no se ha completado", fr: "pas été finalisé", it: "non è stato completato" },
};
const AJUDA = { en: "help with the payment", pt: "ajuda com o pagamento", es: "ayuda con el pago", fr: "aide pour le paiement", it: "aiuto con il pagamento" };

let site;
let backend;
const recebidos = [];

async function esperar(url, ms = 60_000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {
      /* ainda a arrancar */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("o site não arrancou");
}

before(async () => {
  backend = createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        recebidos.push(JSON.parse(b));
      } catch {
        recebidos.push({ invalido: b });
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise((r) => backend.listen(PORTA_BACK, "127.0.0.1", r));
  site = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORTA), "-H", "127.0.0.1"], {
    env: {
      ...process.env,
      STRIPE_WEBHOOK_SECRET: SEG_STRIPE,
      HIBRIDO_PAGAR_SEGREDO: SEG_HUB,
      GAS_WEBAPP_URL: `http://127.0.0.1:${PORTA_BACK}/exec`,
    },
    stdio: "ignore",
  });
  await esperar(`${BASE}/pagamento/obrigado`);
});

after(async () => {
  site?.kill();
  await new Promise((r) => backend?.close(r));
});

// ── Páginas ──────────────────────────────────────────────────────────────────────────────

const ECRAS = [
  { nome: "telemóvel", viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true },
  { nome: "computador", viewport: { width: 1280, height: 800 } },
];

for (const [nomeMotor, motor] of [["chromium", chromium], ["webkit", webkit]]) {
  for (const ecra of ECRAS) {
    test(`páginas de pagamento · ${nomeMotor} · ${ecra.nome}`, async () => {
      const browser = await motor.launch();
      const ctx = await browser.newContext({ viewport: ecra.viewport, isMobile: ecra.isMobile, hasTouch: ecra.hasTouch });
      const page = await ctx.newPage();
      try {
        for (const l of LINGUAS) {
          for (const p of ["obrigado", "cancelado"]) {
            for (const k of ["K-0012", "K-0012-B", "K-12", "K-0012-A", "<script>", ""]) {
              const valida = /^K-\d{4}(-[B-Z])?$/.test(k);
              const url = `${BASE}${rota(l, p)}${k ? `?k=${encodeURIComponent(k)}` : ""}`;
              const resp = await page.goto(url);
              const onde = `${nomeMotor} ${ecra.nome} ${url}`;
              assert.equal(resp.status(), 200, onde);
              assert.match(resp.headers()["x-robots-tag"] || "", /noindex/, onde);
              assert.match((await page.locator('meta[name="robots"]').getAttribute("content")) || "", /noindex/, onde);
              assert.equal(await page.getAttribute("div.lx", "lang"), l, onde);

              const h1 = await page.locator("h1").innerText();
              assert.ok(h1.includes(TITULO[p][l]), `${onde}: h1 «${h1}»`);

              const ref = page.getByTestId("referencia");
              if (valida) assert.equal(await ref.innerText(), k, onde);
              else assert.equal(await ref.count(), 0, onde);

              const href = await page.getByTestId("whatsapp").getAttribute("href");
              const u = new URL(href);
              assert.equal(u.origin + u.pathname, "https://wa.me/351928121564", onde);
              const texto = u.searchParams.get("text") || "";
              if (p === "obrigado") assert.equal(texto, valida ? k : "", onde);
              else assert.equal(texto, valida ? `${k} — ${AJUDA[l]}` : AJUDA[l], onde);

              const corpo = await page.locator("body").innerText();
              assert.ok(!/€|EUR|\d+[.,]\d{2}/.test(corpo), `${onde}: preço na página`);
              assert.ok(!corpo.includes("<script>"), onde);

              // sem deslizar para o lado; o botão cabe no ecrã e tem área de toque
              const larg = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
              assert.ok(larg[0] <= larg[1], `${onde}: deslize horizontal ${larg}`);
              const caixa = await page.getByTestId("whatsapp").boundingBox();
              assert.ok(caixa && caixa.x >= 0 && caixa.x + caixa.width <= ecra.viewport.width && caixa.height >= 44, onde);

              // o seletor de línguas leva a mesma referência (se válida)
              const outra = await page.locator(`a.lx-lingua[hreflang="${l === "it" ? "es" : "it"}"]`).first().getAttribute("href");
              assert.equal(outra.includes("?k="), valida, `${onde}: seletor ${outra}`);

              if (CAPTURAS && k === "K-0012" && (l === "en" || l === "pt"))
                await page.screenshot({ path: `${CAPTURAS}/${nomeMotor}-${ecra.nome}-${l}-${p}.png`, fullPage: true });
            }
          }
        }
      } finally {
        await browser.close();
      }
    });
  }
}

// ── O aviso da Stripe, pela rota verdadeira ─────────────────────────────────────────────────

const assinar = (corpo, seg = SEG_STRIPE, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac("sha256", seg).update(`${t}.${corpo}`).digest("hex")}`;

const evento = (id, extra = {}, sessao = {}) =>
  JSON.stringify({
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${id}`,
        payment_status: "paid",
        amount_total: 9000,
        currency: "eur",
        metadata: { hub: "P-0050", carrinho: "K-0013", pedido: "M-0009" },
        ...sessao,
      },
    },
    ...extra,
  });

const enviar = (corpo, assinatura) =>
  fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(assinatura ? { "Stripe-Signature": assinatura } : {}) },
    body: corpo,
  });

const doEvento = (id) => recebidos.filter((r) => r.evento === id);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

test("webhook: assinatura certa → 200 e o backend (falso) recebe o contrato", async () => {
  const c = evento("evt_e2e_certo");
  const r = await enviar(c, assinar(c));
  assert.equal(r.status, 200);
  await pausa(1500);
  const lst = doEvento("evt_e2e_certo");
  assert.equal(lst.length, 1);
  assert.deepEqual(lst[0], {
    action: "pagamentoConfirmado",
    segredo: SEG_HUB,
    hub: "P-0050",
    carrinho: "K-0013",
    pedido: "M-0009",
    evento: "evt_e2e_certo",
    sessao: "cs_test_evt_e2e_certo",
    valorCent: 9000,
    moeda: "eur",
  });
});

test("webhook: assinatura errada ou em falta → 400 e nada segue", async () => {
  const c = evento("evt_e2e_errado");
  assert.equal((await enviar(c, assinar(c, "whsec_outro"))).status, 400);
  assert.equal((await enviar(c, null)).status, 400);
  const velho = Math.floor(Date.now() / 1000) - 3600;
  assert.equal((await enviar(c, assinar(c, SEG_STRIPE, velho))).status, 400);
  await pausa(800);
  assert.equal(doEvento("evt_e2e_errado").length, 0);
});

test("webhook: evento repetido → 200 e o backend só recebe uma vez", async () => {
  const c = evento("evt_e2e_repetido");
  for (let i = 0; i < 3; i++) assert.equal((await enviar(c, assinar(c))).status, 200);
  await pausa(1500);
  assert.equal(doEvento("evt_e2e_repetido").length, 1);
});

test("webhook: async_payment_succeeded segue; não pago ou expirado → 200 e nada segue", async () => {
  const a = evento("evt_e2e_async", { type: "checkout.session.async_payment_succeeded" });
  const n = evento("evt_e2e_naopago", {}, { payment_status: "unpaid" });
  const x = evento("evt_e2e_expirado", { type: "checkout.session.expired" }, { payment_status: "unpaid" });
  assert.equal((await enviar(a, assinar(a))).status, 200);
  for (const c of [n, x]) {
    const r = await enviar(c, assinar(c));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).ignorado, true);
  }
  await pausa(1500);
  assert.equal(doEvento("evt_e2e_async").length, 1);
  assert.equal(doEvento("evt_e2e_naopago").length, 0);
  assert.equal(doEvento("evt_e2e_expirado").length, 0);
});
