// Testes de ponta a ponta do CRM da assistente (/assistente): E20 + E21 (tema claro, «a próxima chamada»).
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
const ligadosHoje = new Set(); // como o verdadeiro: quem já foi ligado hoje sai da fila

const presente = { pct: 10 };
const ofertas = [
  { codigo: "MESA", nome: "Mesa num restaurante", tipo: "MESA", momento: "jantar" },
  { codigo: "TOUR_SINTRA", nome: "Tour a Sintra", tipo: "TOUR", momento: "dia livre" },
];
const CLIENTES = [
  { ref: "C-0101", nome: "Marta Ribeiro Lopes", lingua: "PT", telefone: "351910000101", viagens: 3, ultimaViagem: "2026-11-25 09:40", canal: "DIRECTO", etiqueta: "QUENTE", nota: 5, notaEm: "2026-11-25 12:00", motivo: "", produtos: ["TRANSFER"], ultimasOfertas: [], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente: null } },
  { ref: "C-0102", nome: "James Whitaker", lingua: "EN", telefone: "447700900102", viagens: 1, ultimaViagem: "2026-11-24 18:10", canal: "OPERADORA", etiqueta: "RECUPERAR", nota: 3, notaEm: "2026-11-24 21:00", motivo: "o atraso na recolha", produtos: [], ultimasOfertas: [{ produto: "MESA", em: "2026-11-24 19:00", resultado: "sem resposta" }], ultimaChamada: "", resultadoChamada: "", ligarEm: "", aSeguir: { ofertas, presente } },
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
    return { ok: true, cracha: CRACHA, nome: "Rita Assistente", papel: "assistente", expiraEm: new Date(Date.now() + 12 * 3600e3).toISOString() };
  }
  if (!p.cracha) return { ok: false, motivo: "sem_cracha", message: "Sem acesso." };
  if (p.cracha !== CRACHA) return { ok: false, motivo: "cracha", message: "Sem acesso." };
  const achar = () => CLIENTES.find((c) => c.ref === p.ref);
  if (p.action === "crmFila") {
    const clientes = CLIENTES.filter((c) => !ligadosHoje.has(c.ref));
    return {
      ok: true,
      hoje: "2026-11-27",
      total: clientes.length,
      mostrados: clientes.length,
      foraDaFila: { STOP: 1, NAO_QUER: 1, JA_CHAMADO_HOJE: ligadosHoje.size },
      clientes,
      quem: "Rita Assistente",
    };
  }
  if (p.action === "crmCliente") {
    const c = achar();
    if (!c) return { ok: false, motivo: "cliente_nao_encontrado" };
    return {
      ok: true,
      cliente: c,
      naFila: true,
      quem: "Rita Assistente",
      ficha: { "Ref C": c.ref, Nome: c.nome || "—", Idioma: c.lingua },
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
    ligadosHoje.add(c.ref);
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
const limpo = (s) => s.replace(/\s+/g, " ").trim();

function amanhaLisboa() {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function semDeslize(page, onde) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  assert.ok(sw <= w, `${onde}: deslize horizontal ${sw} > ${w}`);
}

async function proxima(page) {
  const c = page.getByTestId("proxima");
  await c.waitFor();
  return c;
}

/** Espera pela celebração, confirma o texto e espera que passe sozinha. */
async function celebrar(page, texto, foto) {
  const cel = page.getByTestId("celebracao");
  await cel.waitFor();
  assert.match(await cel.innerText(), texto);
  if (foto) {
    await page.waitForTimeout(450); // depois de a animação de entrada acabar
    await foto();
  }
  await cel.waitFor({ state: "detached", timeout: 8000 });
}

async function contadores(page) {
  return {
    contagem: limpo(await page.getByTestId("contagem").innerText()),
    incentivo: limpo(await page.getByTestId("incentivo").innerText()),
    atendidas: await page.getByTestId("cont-atendidas").innerText(),
    vendasHoje: await page.getByTestId("cont-vendas-hoje").innerText(),
    vendasSemana: await page.getByTestId("cont-vendas-semana").innerText(),
  };
}

async function escolherNaLista(page, ref) {
  await page.getByTestId("ver-lista").click();
  await page.locator(`[data-testid="item-lista"][data-ref="${ref}"]`).click();
  await page.locator(`[data-testid="proxima"][data-ref="${ref}"]`).waitFor();
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
    const foto = async (nome, inteira = true) => CAPTURAS && page.screenshot({ path: `${CAPTURAS}/${ecra.nome}-${nome}.png`, fullPage: inteira });
    try {
      modo = "ligado";
      falhas = 0;
      ligadosHoje.clear();

      await t.test("entrada: código errado, depois certo", async () => {
        await page.goto(`${BASE}/assistente`);
        assert.equal(
          await page.evaluate(() => getComputedStyle(document.querySelector("main")).backgroundColor),
          "rgb(241, 242, 244)",
          "tema claro",
        );
        await foto("0-entrada");
        await page.getByTestId("codigo").fill("XXXX-0000-YYYY");
        await page.getByTestId("entrar").click();
        await page.getByTestId("erro-entrada").waitFor();
        assert.match(await page.getByTestId("erro-entrada").innerText(), /Código incorrecto\. Restam 4 tentativas\./);
        const pedido = ultimo("crmEntrar");
        assert.equal(pedido._metodo, "POST", "crmEntrar só por POST");
        assert.equal(pedido.codigo, "XXXX-0000-YYYY");

        await page.getByTestId("codigo").fill(CODIGO.toLowerCase());
        await page.getByTestId("entrar").click();
        await proxima(page);
        assert.equal(ultimo("crmEntrar").codigo, CODIGO, "o código vai em maiúsculas");
        const [ses, loc] = await page.evaluate(() => [sessionStorage.getItem("hub_crm_sessao"), JSON.stringify(localStorage)]);
        assert.match(ses, new RegExp(CRACHA));
        assert.ok(!loc.includes(CRACHA), "o crachá nunca vai para o localStorage");
      });

      await t.test("ecrã principal: progresso, contadores e UM cliente", async () => {
        assert.match(await page.getByTestId("saudacao").innerText(), /^(Bom dia|Boa tarde|Boa noite), Rita$/);
        assert.deepEqual(await contadores(page), {
          contagem: "0 de 4 chamadas",
          incentivo: "Vamos a isso! A primeira chamada abre o dia.",
          atendidas: "0",
          vendasHoje: "0",
          vendasSemana: "0",
        });
        assert.equal(await page.getByTestId("proxima").count(), 1, "só um cliente no ecrã");
        const c = await proxima(page);
        assert.equal(await c.getAttribute("data-ref"), "C-0101");
        assert.equal(await page.getByTestId("nome").innerText(), "Marta", "só o primeiro nome");
        assert.equal(limpo(await c.getByTestId("etiqueta").innerText()), "Gostou muito ⭐ — agradecer e propor");
        const txt = await c.innerText();
        assert.match(txt, /Fala português/);
        assert.match(txt, /Viajou há 2 dias · 3 viagens connosco/);
        assert.match(txt, /Já comprou: Transfer/);
        assert.match(txt, /Agradeça as 5 estrelas\./);
        assert.match(await page.getByTestId("frase-chave").innerText(), /Olá Marta, fala da HUB Transfer\. Posso mandar-lhe o link para deixar as 5 estrelas no Google\?/);
        // o telefone só no botão Ligar; nada de apelido nem ref no ecrã
        const ligar = page.getByTestId("ligar");
        assert.equal(await ligar.getAttribute("href"), "tel:+351910000101");
        assert.match(await ligar.innerText(), /Ligar agora/);
        const tudo = await page.locator("main").innerText();
        for (const proibido of ["910000101", "351910000101", "Ribeiro", "C-0101"]) assert.ok(!tudo.includes(proibido), `no ecrã: ${proibido}`);
        assert.equal(ultimo("crmFila").cracha, CRACHA);
        await semDeslize(page, "principal");
        if (ecra.nome === "iphone") {
          const caixa = await ligar.boundingBox();
          assert.ok(caixa.height >= 64, `botão Ligar pequeno: ${caixa.height}`);
          assert.ok(caixa.width >= 300, `botão Ligar estreito: ${caixa.width}`);
        }
        await foto("1-principal");
      });

      await t.test("a lista toda; o guião e a frase-chave mudam com a etiqueta e a língua", async () => {
        await page.getByTestId("ver-lista").click();
        const refs = await page.getByTestId("item-lista").evaluateAll((els) => els.map((e) => e.getAttribute("data-ref")));
        assert.deepEqual(refs, ["C-0101", "C-0102", "C-0103", "C-0104"]);
        const etiquetas = (await page.getByTestId("lista").getByTestId("etiqueta").allInnerTexts()).map(limpo);
        assert.deepEqual(etiquetas, [
          "Gostou muito ⭐ — agradecer e propor",
          "Ficou desiludido 🛠️ — pedir desculpa",
          "Ainda não avaliou 📞 — perguntar a nota",
          "Já viajou 🌤️ — saber como correu",
        ]);
        assert.ok(!(await page.getByTestId("lista").innerText()).includes("Whitaker"));
        await semDeslize(page, "lista");
        await page.getByTestId("voltar").click();
        await proxima(page);

        await escolherNaLista(page, "C-0102");
        assert.equal(await page.getByTestId("nome").innerText(), "James");
        assert.match(await page.getByTestId("guiao").innerText(), /Peça desculpa por «o atraso na recolha»\./);
        assert.match(await page.getByTestId("frase-chave").innerText(), /Hello James, this is HUB Transfer\. We're very sorry\. We'd like to offer you 10% off your next booking\./);
        assert.equal(await page.getByTestId("frase-chave").getAttribute("lang"), "en");

        await escolherNaLista(page, "C-0103");
        assert.match(await page.getByTestId("frase-chave").innerText(), /Hola Lucía, le llamo de HUB Transfer\. Del 1 al 5, ¿qué tal fue su viaje con nosotros\?/);
        assert.match(await page.getByTestId("proxima").innerText(), /Ainda não comprou nada/);

        await escolherNaLista(page, "C-0104");
        assert.equal(await page.getByTestId("nome").innerText(), "Cliente sem nome");
        assert.match(await page.getByTestId("frase-chave").innerText(), /Bonjour, ici HUB Transfer\. Comment s'est passé votre séjour à Lisbonne \?/);

        // o histórico só se pede quando se abre
        const antes = recebidos.filter((r) => r.action === "crmCliente").length;
        await page.getByTestId("historico").locator("summary").click();
        await page.getByTestId("eventos").waitFor();
        assert.match(await page.getByTestId("eventos").innerText(), /Recebeu uma oferta · MESA/);
        assert.equal(recebidos.filter((r) => r.action === "crmCliente").length, antes + 1);
      });

      await t.test("venda: Comprou + produto + carrinho → celebração e passa sozinho ao seguinte", async () => {
        await escolherNaLista(page, "C-0102");
        const gravar = () => page.getByTestId("gravar");
        assert.equal(await gravar().count(), 0, "sem resultado não há botão de gravar");
        await page.getByTestId("resultado-COMPROU").click();
        await page.getByTestId("produto-MESA").click();
        await page.getByTestId("criar-carrinho").click();
        await page.getByTestId("carrinho").waitFor();
        assert.equal(await page.getByTestId("ref-carrinho").innerText(), "HUB-0012");
        assert.match(await page.getByTestId("carrinho").innerText(), /K-0012 · 76,50 €/);
        const pc = ultimo("crmCarrinho");
        assert.deepEqual({ ref: pc.ref, produto: pc.produto, cracha: pc.cracha }, { ref: "C-0102", produto: "MESA", cracha: CRACHA });
        await semDeslize(page, "registar");
        await page.getByTestId("registar").scrollIntoViewIfNeeded();
        await foto("2-registar-chamada");
        if (ecra.nome === "iphone") await foto("2b-registar-ecra", false);
        await gravar().click();
        await celebrar(page, /Venda feita!/, () => foto("3-venda", false));
        const p = ultimo("crmRegistar");
        assert.deepEqual({ ref: p.ref, resultado: p.resultado, produto: p.produto, avaliacao: p.avaliacao }, { ref: "C-0102", resultado: "COMPROU", produto: "MESA", avaliacao: undefined });
        const c = await proxima(page);
        assert.equal(await c.getAttribute("data-ref"), "C-0101", "James saiu da fila");
        assert.deepEqual(await contadores(page), { contagem: "1 de 4 chamadas", incentivo: "Bom começo!", atendidas: "1", vendasHoje: "1", vendasSemana: "1" });
      });

      await t.test("Ligar depois: precisa do dia («Amanhã»)", async () => {
        await page.getByTestId("resultado-LIGAR_DEPOIS").click();
        assert.ok(await page.getByTestId("gravar").isDisabled(), "Ligar depois sem dia não grava");
        await page.getByRole("button", { name: "Amanhã" }).click();
        await page.getByTestId("gravar").click();
        await celebrar(page, /Chamada gravada/);
        const p = ultimo("crmRegistar");
        assert.deepEqual({ ref: p.ref, resultado: p.resultado, ligarEm: p.ligarEm }, { ref: "C-0101", resultado: "LIGAR_DEPOIS", ligarEm: amanhaLisboa() });
        assert.equal((await contadores(page)).incentivo, "A meio caminho!");
        assert.equal(await (await proxima(page)).getAttribute("data-ref"), "C-0103");
      });

      await t.test("ensaio: faixa amarela, nada conta, o cliente vai para o fim", async () => {
        modo = "ensaio";
        await page.getByTestId("resultado-NAO_ATENDEU").click();
        assert.equal(await page.getByTestId("estrela-1").count(), 0, "não atendeu: sem estrelas");
        await page.getByTestId("gravar").click();
        await celebrar(page, /Ensaio: nada foi gravado/);
        await page.getByTestId("faixa-ensaio").waitFor();
        assert.match(await page.getByTestId("faixa-ensaio").innerText(), /Modo de ensaio: nada foi gravado/);
        assert.equal(await page.getByTestId("faixa-ensaio").count(), 1);
        assert.equal((await contadores(page)).contagem, "2 de 4 chamadas");
        assert.equal(await (await proxima(page)).getAttribute("data-ref"), "C-0104");
        modo = "ligado";
      });

      await t.test("Interessado com nota 3, motivo e nota escrita", async () => {
        await page.getByTestId("resultado-INTERESSADO").click();
        await page.getByTestId("estrela-3").click();
        await page.getByTestId("motivo").fill("carro pequeno para as malas");
        assert.equal(await page.getByTestId("aceita-link").count(), 0, "o link só aparece com 5");
        await page.getByTestId("produto-TOUR_SINTRA").click();
        await page.getByTestId("abrir-nota").click();
        await page.getByTestId("nota").fill("volta em março");
        await page.getByTestId("gravar").click();
        await celebrar(page, /Chamada gravada/);
        const p = ultimo("crmRegistar");
        assert.deepEqual(
          { ref: p.ref, resultado: p.resultado, avaliacao: p.avaliacao, motivo: p.motivo, aceitaLink: p.aceitaLink, produto: p.produto, nota: p.nota },
          { ref: "C-0104", resultado: "INTERESSADO", avaliacao: 3, motivo: "carro pequeno para as malas", aceitaLink: undefined, produto: "TOUR_SINTRA", nota: "volta em março" },
        );
        assert.equal((await contadores(page)).incentivo, "Falta pouco!");
        assert.equal(await page.getByTestId("faixa-ensaio").count(), 0, "a faixa sai quando volta a gravar a sério");
      });

      await t.test("última chamada: 5★ com link → «Meta cumprida 🎉»", async () => {
        assert.equal(await (await proxima(page)).getAttribute("data-ref"), "C-0103");
        await page.getByTestId("resultado-COMPROU").click();
        await page.getByTestId("estrela-5").click();
        assert.equal(await page.getByTestId("motivo").count(), 0);
        await page.getByTestId("aceita-link").check();
        await page.getByTestId("gravar").click();
        await celebrar(page, /Meta cumprida 🎉[\s\S]*O link do Google vai pelo WhatsApp/, () => foto("4-meta-celebracao", false));
        const p = ultimo("crmRegistar");
        assert.deepEqual({ ref: p.ref, avaliacao: p.avaliacao, aceitaLink: p.aceitaLink, motivo: p.motivo }, { ref: "C-0103", avaliacao: 5, aceitaLink: true, motivo: undefined });
        await page.getByTestId("fila-vazia").waitFor();
        assert.deepEqual(await contadores(page), {
          contagem: "4 de 4 chamadas",
          incentivo: "Meta cumprida 🎉",
          atendidas: "4",
          vendasHoje: "2",
          vendasSemana: "2",
        });
        await semDeslize(page, "meta");
        await foto("5-meta-cumprida");
        // a contagem fica neste aparelho depois de recarregar
        await page.reload();
        await page.getByTestId("fila-vazia").waitFor();
        assert.equal((await contadores(page)).contagem, "4 de 4 chamadas");
      });

      await t.test("sair; sessão de mais de 12 h; crachá recusado", async () => {
        await page.getByTestId("sair").click();
        await page.getByTestId("codigo").waitFor();
        assert.equal(await page.evaluate(() => sessionStorage.getItem("hub_crm_sessao")), null);

        await page.evaluate(() =>
          sessionStorage.setItem("hub_crm_sessao", JSON.stringify({ cracha: "cracha-falso-e2e", nome: "A", fim: Date.now() - 1000 })),
        );
        await page.reload();
        await page.getByTestId("codigo").waitFor();

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
