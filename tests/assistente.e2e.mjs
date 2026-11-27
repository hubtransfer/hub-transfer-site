// Testes de ponta a ponta do pedido E20 (CRM da assistente, /assistente), no site construído.
// Antes: npm run build. Correr: node --test tests/assistente.e2e.mjs
// Arranca o «next start» na porta 3108 com um backend FALSO local (porta 3198) que imita as acções
// crm* do CRM_ASSISTENTE.js: nada chama o HUB-Central verdadeiro. Dados todos inventados.
// Capturas (opcional): ASSISTENTE_CAPTURAS=pasta
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { chromium, webkit, devices } from "playwright";

const PORTA = 3108;
const PORTA_BACK = 3198;
const BASE = `http://127.0.0.1:${PORTA}`;
const CAPTURAS = process.env.ASSISTENTE_CAPTURAS || "";
const CODIGO = "ABCD-EFGH-JKLM";
const CRACHA = "cracha-falso-e2e";

// ── O backend falso ──────────────────────────────────────────────────────────────────────

let modo = "ligado"; // ligado | ensaio
let falhas = 0;
const recebidos = [];

const presente = { pct: 10 };
const ofertas = [
  { codigo: "MESA", nome: "Mesa num restaurante", tipo: "MESA", momento: "jantar" },
  { codigo: "TOUR_SINTRA", nome: "Tour a Sintra", tipo: "TOUR", momento: "dia livre" },
];
const CLIENTES = [
  { ref: "C-0101", nome: "Marta", lingua: "PT", telefone: "351910000101", viagens: 3, ultimaViagem: "2026-11-25 09:40", canal: "DIRECTO", etiqueta: "QUENTE", nota: 5, notaEm: "2026-11-25 12:00", motivo: "", produtos: ["TRANSFER"], ultimasOfertas: [], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente: null } },
  { ref: "C-0102", nome: "James", lingua: "EN", telefone: "447700900102", viagens: 1, ultimaViagem: "2026-11-24 18:10", canal: "OPERADORA", etiqueta: "RECUPERAR", nota: 3, notaEm: "2026-11-24 21:00", motivo: "o atraso na recolha", produtos: [], ultimasOfertas: [{ produto: "MESA", em: "2026-11-24 19:00", resultado: "sem resposta" }], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente } },
  { ref: "C-0103", nome: "Lucía", lingua: "ES", telefone: "34600000103", viagens: 2, ultimaViagem: "2026-11-23 07:15", canal: "DIRECTO", etiqueta: "AVALIAR_CHAMADA", nota: null, notaEm: "", motivo: "", produtos: [], ultimasOfertas: [], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente } },
  { ref: "C-0104", nome: "", lingua: "FR", telefone: "33600000104", viagens: 1, ultimaViagem: "2026-11-20", canal: "DIRECTO", etiqueta: "MORNO", nota: null, notaEm: "", motivo: "", produtos: [], ultimasOfertas: [], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente: null } },
];
const RESULTADOS = ["NAO_ATENDEU", "LIGAR_DEPOIS", "INTERESSADO", "COMPROU", "NAO_QUER", "NUMERO_ERRADO"];

function crm(p) {
  if (p.action === "crmEntrar") {
    if (falhas >= 5) return { ok: false, motivo: "tentativas", message: "Demasiadas tentativas. Tente daqui a 10 minutos." };
    if (String(p.codigo || "").trim().toUpperCase() !== CODIGO) {
      falhas++;
      return { ok: false, motivo: "codigo", message: "Código incorrecto.", tentativasRestantes: Math.max(0, 5 - falhas) };
    }
    falhas = 0;
    return { ok: true, cracha: CRACHA, nome: "Assistente", papel: "assistente", expiraEm: new Date(Date.now() + 12 * 3600e3).toISOString() };
  }
  if (!p.cracha) return { ok: false, motivo: "sem_cracha", message: "Sem acesso." };
  if (p.cracha !== CRACHA) return { ok: false, motivo: "cracha", message: "Sem acesso." };
  const achar = () => CLIENTES.find((c) => c.ref === p.ref);
  if (p.action === "crmFila")
    return { ok: true, hoje: "2026-11-27", total: 6, mostrados: CLIENTES.length, foraDaFila: { STOP: 1, NAO_QUER: 1 }, clientes: CLIENTES, quem: "Assistente" };
  if (p.action === "crmCliente") {
    const c = achar();
    if (!c) return { ok: false, motivo: "cliente_nao_encontrado" };
    return {
      ok: true,
      cliente: c,
      naFila: true,
      quem: "Assistente",
      ficha: { "Ref C": c.ref, Nome: c.nome || "—", Idioma: c.lingua, "Nº viagens": c.viagens, "Última viagem": c.ultimaViagem, Avaliação: c.nota ?? "", Motivo: c.motivo, "Directo/Operadora": c.canal },
      eventos: [
        { quando: "2026-11-24 21:00", viagem: "V-9001", tipo: "AVALIACAO", produto: "", resultado: "3/5", quem: "cliente", resumo: "" },
        { quando: "2026-11-24 19:00", viagem: "V-9001", tipo: "OFERTA", produto: "MESA", resultado: "", quem: "IA", resumo: "" },
        { quando: "2026-11-24 18:10", viagem: "V-9001", tipo: "NO_LOCAL", produto: "", resultado: "", quem: "sistema", resumo: "" },
      ],
    };
  }
  if (p.action === "crmRegistar") {
    const c = achar();
    if (!c) return { ok: false, motivo: "cliente_nao_encontrado" };
    if (!RESULTADOS.includes(p.resultado)) return { ok: false, motivo: "resultado_invalido", aceites: RESULTADOS };
    if (p.resultado === "LIGAR_DEPOIS" && !p.ligarEm) return { ok: false, motivo: "ligarEm_em_falta" };
    const etiqueta = p.avaliacao === 5 ? "QUENTE" : p.avaliacao ? "RECUPERAR" : c.etiqueta;
    const link = p.avaliacao === 5 && p.aceitaLink ? { ok: true, motivo: "na fila" } : null;
    if (modo === "ensaio") return { ok: true, ensaio: true, gravaria: { ficha: {}, eventos: ["CHAMADA"], link: !!link }, etiqueta, avisos: [] };
    return { ok: true, etiqueta, link, avisos: [] };
  }
  if (p.action === "crmCarrinho") {
    if (!achar()) return { ok: false, motivo: "cliente_nao_encontrado" };
    if (!ofertas.some((o) => o.codigo === p.produto)) return { ok: false, motivo: "produto_desconhecido" };
    return { ok: true, carrinho: "K-0012", refCliente: "HUB-0012", total: 76.5, aDefinir: [], desconto: { pct: 10 } };
  }
  return { ok: false, motivo: "acao_desconhecida" };
}

// ── Arranque ─────────────────────────────────────────────────────────────────────────────

let site;
let backend;

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
      let p = {};
      try {
        p = JSON.parse(b);
      } catch {
        p = { invalido: b };
      }
      p._metodo = req.method;
      recebidos.push(p);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(crm(p)));
    });
  });
  await new Promise((r) => backend.listen(PORTA_BACK, "127.0.0.1", r));
  site = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORTA), "-H", "127.0.0.1"], {
    env: { ...process.env, GAS_WEBAPP_URL: `http://127.0.0.1:${PORTA_BACK}/exec` },
    stdio: "ignore",
  });
  await esperar(`${BASE}/assistente`);
});

after(async () => {
  site?.kill();
  await new Promise((r) => backend?.close(r));
});

// ── Ajudas ───────────────────────────────────────────────────────────────────────────────

const ECRAS = [
  { nome: "iphone", motor: webkit, ctx: { ...devices["iPhone 13"] } },
  { nome: "computador", motor: chromium, ctx: { viewport: { width: 1280, height: 860 } } },
];

const ultimo = (accao) => [...recebidos].reverse().find((r) => r.action === accao);

async function entrar(page) {
  await page.goto(`${BASE}/assistente`);
  await page.getByTestId("codigo").fill(CODIGO.toLowerCase());
  await page.getByTestId("entrar").click();
  await page.getByTestId("cartao").first().waitFor();
}

async function abrirFicha(page, ref) {
  await page.locator(`[data-testid="cartao"][data-ref="${ref}"]`).getByTestId("abrir").click();
  await page.getByTestId("guiao").waitFor();
}

async function semDeslize(page, onde) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  assert.ok(sw <= w, `${onde}: deslize horizontal ${sw} > ${w}`);
}

// ── Testes ───────────────────────────────────────────────────────────────────────────────

test("a página e a rota nunca são indexadas; a rota só aceita as acções do CRM", async () => {
  const r = await fetch(`${BASE}/assistente`);
  assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
  assert.match(await r.text(), /<meta name="robots" content="noindex/);
  const a = await fetch(`${BASE}/api/assistente`, { method: "POST", body: JSON.stringify({ action: "getViagens" }) });
  assert.equal(a.status, 400);
  assert.match(a.headers.get("x-robots-tag") || "", /noindex/);
  const n = recebidos.length;
  await fetch(`${BASE}/api/assistente`, { method: "POST", body: "não é json" });
  assert.equal(recebidos.length, n, "nada chega ao backend");
});

for (const ecra of ECRAS) {
  test(`CRM da assistente · ${ecra.nome}`, async (t) => {
    const browser = await ecra.motor.launch();
    const ctx = await browser.newContext(ecra.ctx);
    const page = await ctx.newPage();
    const foto = async (nome) => CAPTURAS && page.screenshot({ path: `${CAPTURAS}/${ecra.nome}-${nome}.png`, fullPage: true });
    try {
      modo = "ligado";
      falhas = 0;

      await t.test("entrada: código errado, depois certo", async () => {
        await page.goto(`${BASE}/assistente`);
        await foto("1-entrada");
        await page.getByTestId("codigo").fill("XXXX-0000-YYYY");
        await page.getByTestId("entrar").click();
        await assert.doesNotReject(page.getByTestId("erro-entrada").waitFor());
        assert.match(await page.getByTestId("erro-entrada").innerText(), /Código incorrecto\. Restam 4 tentativas\./);
        const pedido = ultimo("crmEntrar");
        assert.equal(pedido._metodo, "POST", "crmEntrar só por POST");
        assert.equal(pedido.codigo, "XXXX-0000-YYYY");

        await page.getByTestId("codigo").fill(CODIGO.toLowerCase());
        await page.getByTestId("entrar").click();
        await page.getByTestId("cartao").first().waitFor();
        assert.equal(ultimo("crmEntrar").codigo, CODIGO, "o código vai em maiúsculas");
        // o crachá vive só no sessionStorage, nunca no localStorage
        const [ses, loc] = await page.evaluate(() => [sessionStorage.getItem("hub_crm_sessao"), JSON.stringify(localStorage)]);
        assert.match(ses, new RegExp(CRACHA));
        assert.ok(!loc.includes(CRACHA));
      });

      await t.test("fila do dia: ordem da API, etiquetas, Ligar", async () => {
        const refs = await page.getByTestId("cartao").evaluateAll((els) => els.map((e) => e.getAttribute("data-ref")));
        assert.deepEqual(refs, ["C-0101", "C-0102", "C-0103", "C-0104"]);
        const etiquetas = await page.getByTestId("fila").getByTestId("etiqueta").allInnerTexts();
        assert.deepEqual(
          etiquetas.map((s) => s.replace(/\s+/g, " ").trim()),
          ["⭐ QUENTE", "🛠️ RECUPERAR", "📞 AVALIAR POR CHAMADA", "🌤️ MORNO"],
        );
        const c2 = page.locator('[data-testid="cartao"][data-ref="C-0102"]');
        assert.equal(await c2.getByTestId("ligar").getAttribute("href"), "tel:+447700900102");
        const txt = await c2.innerText();
        assert.match(txt, /James/);
        assert.match(txt, /🇬🇧/);
        assert.match(txt, /24\/11\/2026 18:10/);
        assert.match(txt, /o atraso na recolha/);
        assert.match(await page.getByTestId("resumo-fila").innerText(), /27\/11\/2026 · 4 de 6/);
        assert.equal(ultimo("crmFila").cracha, CRACHA);
        await semDeslize(page, "fila");
        if (ecra.nome === "iphone") {
          const caixa = await c2.getByTestId("ligar").boundingBox();
          assert.ok(caixa.height >= 48, `botão Ligar pequeno: ${caixa.height}`);
        }
        await foto("2-fila");
      });

      await t.test("ficha: guião PT+EN, presente, ofertas, eventos simples", async () => {
        await abrirFicha(page, "C-0102");
        assert.equal(ultimo("crmCliente").ref, "C-0102");
        const g = page.getByTestId("guiao");
        const ab = await g.getByTestId("fala-abertura").innerText();
        assert.match(ab, /Olá James, fala da HUB Transfer, quem o levou em Lisboa\. Tem um minuto\?/);
        assert.match(ab, /Hello James, this is HUB Transfer, we drove you in Lisbon\. Do you have a minute\?/);
        const rec = await g.getByTestId("fala-recuperar").innerText();
        assert.match(rec, /peço-lhe desculpa por o atraso na recolha\. Para compensar, queria oferecer-lhe 10% em Mesa num restaurante\./);
        assert.match(rec, /I'm sorry about o atraso na recolha\. To make it up to you, I'd like to offer you 10% off Mesa num restaurante\./);
        assert.equal(await g.getByTestId("fala-nota").count(), 0);
        assert.equal(await g.getByTestId("fala-google").count(), 0);
        for (const id of ["oferta", "fecho", "pensar"]) assert.equal(await g.getByTestId(`fala-${id}`).count(), 1);
        assert.match(await page.getByTestId("presente").innerText(), /10%/);
        assert.match(await page.getByTestId("ofertas").innerText(), /Tour a Sintra/);
        const ev = await page.getByTestId("eventos").innerText();
        assert.match(ev, /Recebeu uma oferta · MESA/);
        assert.match(ev, /O motorista chegou ao local/);
        assert.match(await page.getByTestId("ficha").innerText(), /Directo\/Operadora/);
        await semDeslize(page, "ficha");
        await foto("3-ficha-recuperar");

        // o guião muda com a etiqueta
        await page.getByTestId("voltar").click();
        await abrirFicha(page, "C-0101");
        assert.match(await page.getByTestId("fala-google").innerText(), /5 estrelas no Google/);
        assert.equal(await page.getByTestId("presente").count(), 0);
        await page.getByTestId("voltar").click();
        await abrirFicha(page, "C-0104");
        assert.match(await page.getByTestId("fala-nota").innerText(), /De 1 a 5, como foi a sua viagem connosco\?/);
        assert.match(await page.getByTestId("fala-abertura").innerText(), /Olá, fala da HUB Transfer/);
        await page.getByTestId("voltar").click();
        await page.getByTestId("cartao").first().waitFor();
      });

      await t.test("registar: cada um dos seis resultados", async () => {
        for (const r of RESULTADOS) {
          await abrirFicha(page, "C-0103");
          const gravar = page.getByTestId("gravar");
          assert.ok(await gravar.isDisabled(), "sem resultado não grava");
          await page.getByTestId(`resultado-${r}`).click();
          if (r === "LIGAR_DEPOIS") {
            assert.ok(await gravar.isDisabled(), "Ligar depois sem data não grava");
            await page.getByTestId("ligar-em").fill("2026-12-15");
          }
          await page.getByTestId("nota").fill(`chamada ${r}`);
          await gravar.click();
          await page.getByTestId("feito").waitFor();
          assert.match(await page.getByTestId("feito").innerText(), /Chamada gravada/);
          assert.ok(await gravar.isDisabled(), "não grava duas vezes");
          const p = ultimo("crmRegistar");
          assert.equal(p.resultado, r);
          assert.equal(p.ref, "C-0103");
          assert.equal(p.cracha, CRACHA);
          assert.equal(p.nota, `chamada ${r}`);
          assert.equal(p.ligarEm, r === "LIGAR_DEPOIS" ? "2026-12-15" : undefined);
          assert.equal(p.avaliacao, undefined);
          await page.getByTestId("voltar").click();
          await page.getByTestId("cartao").first().waitFor();
        }
      });

      await t.test("registar com nota: 3★ com motivo, 5★ com link; produto falado", async () => {
        await abrirFicha(page, "C-0103");
        await page.getByTestId("resultado-INTERESSADO").click();
        await page.getByTestId("perguntou-nota").check();
        assert.ok(await page.getByTestId("gravar").isDisabled(), "perguntou a nota sem estrelas não grava");
        await page.getByTestId("estrela-3").click();
        await page.getByTestId("motivo").fill("carro pequeno para as malas");
        assert.equal(await page.getByTestId("aceita-link").count(), 0, "o link só aparece com 5");
        await page.getByTestId("produto").selectOption("TOUR_SINTRA");
        await page.getByTestId("gravar").click();
        await page.getByTestId("feito").waitFor();
        let p = ultimo("crmRegistar");
        assert.equal(p.avaliacao, 3);
        assert.equal(p.motivo, "carro pequeno para as malas");
        assert.equal(p.aceitaLink, undefined);
        assert.equal(p.produto, "TOUR_SINTRA");
        assert.match(await page.getByTestId("feito").innerText(), /RECUPERAR/);
        await page.getByTestId("voltar").click();

        await abrirFicha(page, "C-0103");
        await page.getByTestId("resultado-COMPROU").click();
        await page.getByTestId("perguntou-nota").check();
        await page.getByTestId("estrela-5").click();
        assert.equal(await page.getByTestId("motivo").count(), 0);
        await page.getByTestId("aceita-link").check();
        await page.getByTestId("gravar").click();
        await page.getByTestId("feito").waitFor();
        p = ultimo("crmRegistar");
        assert.equal(p.avaliacao, 5);
        assert.equal(p.aceitaLink, true);
        assert.equal(p.motivo, undefined);
        const feito = await page.getByTestId("feito").innerText();
        assert.match(feito, /QUENTE/);
        assert.match(feito, /Link do Google: vai pelo WhatsApp/);
        await page.getByTestId("voltar").click();
      });

      await t.test("carrinho com 10%: mostra o HUB-…", async () => {
        await abrirFicha(page, "C-0102");
        assert.ok(await page.getByTestId("criar-carrinho").isDisabled(), "sem produto não cria");
        await page.getByTestId("produto").selectOption("MESA");
        assert.match(await page.getByTestId("criar-carrinho").innerText(), /Criar carrinho com 10%/);
        await page.getByTestId("criar-carrinho").click();
        await page.getByTestId("carrinho").waitFor();
        assert.equal(await page.getByTestId("ref-carrinho").innerText(), "HUB-0012");
        assert.match(await page.getByTestId("carrinho").innerText(), /K-0012 · 76,50 €/);
        const p = ultimo("crmCarrinho");
        assert.deepEqual({ ref: p.ref, produto: p.produto, desconto: p.desconto, cracha: p.cracha }, { ref: "C-0102", produto: "MESA", desconto: undefined, cracha: CRACHA });
        await page.getByTestId("voltar").click();
      });

      await t.test("ensaio: faixa amarela «nada foi gravado»", async () => {
        modo = "ensaio";
        await abrirFicha(page, "C-0104");
        assert.equal(await page.getByTestId("faixa-ensaio").count(), 0);
        await page.getByTestId("resultado-NAO_ATENDEU").click();
        await page.getByTestId("gravar").click();
        await page.getByTestId("faixa-ensaio").waitFor();
        assert.match(await page.getByTestId("faixa-ensaio").innerText(), /Modo de ensaio: nada foi gravado/);
        assert.match(await page.getByTestId("feito").innerText(), /Ensaio: a chamada não foi gravada/);
        modo = "ligado";
        await page.getByTestId("voltar").click();
      });

      await t.test("sair; sessão de mais de 12 h; crachá recusado", async () => {
        await page.getByTestId("sair").click();
        await page.getByTestId("codigo").waitFor();
        assert.equal(await page.evaluate(() => sessionStorage.getItem("hub_crm_sessao")), null);

        // sessão expirada no armazenamento → volta à entrada
        await page.evaluate(() =>
          sessionStorage.setItem("hub_crm_sessao", JSON.stringify({ cracha: "cracha-falso-e2e", nome: "A", fim: Date.now() - 1000 })),
        );
        await page.reload();
        await page.getByTestId("codigo").waitFor();

        // crachá que o backend recusa → volta à entrada com aviso
        await page.evaluate(() =>
          sessionStorage.setItem("hub_crm_sessao", JSON.stringify({ cracha: "cracha-velho", nome: "A", fim: Date.now() + 3600e3 })),
        );
        await page.reload();
        await page.getByTestId("codigo").waitFor();
        assert.match(await page.locator("main").innerText(), /A sessão terminou/);
        assert.equal(await page.evaluate(() => sessionStorage.getItem("hub_crm_sessao")), null);
      });
    } finally {
      await browser.close();
    }
  });
}
