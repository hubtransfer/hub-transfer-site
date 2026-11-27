// npm run guias — faz os 5 guias em PDF «Lisboa à sua mesa» a partir do site (pedido E9, Fase B; formato de telemóvel no E18).
//
//   npm run build && npm run guias          arranca o site (next start), faz os PDF e desliga-o
//   npm run guias -- --url http://localhost:3000   usa um site que já esteja a correr (ex.: npm run dev)
//
// Grava sempre nos mesmos endereços: public/guia/HUB-Transfer-Lisboa-EN.pdf, -PT, -ES, -FR e -IT.
// Páginas de 390×760 (cabem inteiras no ecrã de um iPhone, entre as barras do leitor), uma só coluna, com os fundos e com as ligações clicáveis
// (as do índice saltam dentro do PDF). Cada PDF deve ficar abaixo dos 3 MB (aviso) e tem de ficar abaixo dos 5 MB
// (para o WhatsApp; se passar, o comando falha e diz qual). Se o texto de alguma página não couber nela, também falha.
// Primeira vez neste computador: npx playwright install chromium

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const LINGUAS = ["en", "pt", "es", "fr", "it"];
const PASTA = path.join(process.cwd(), "public", "guia");
const LIMITE = 5 * 1024 * 1024;
const PREFERIDO = 3 * 1024 * 1024;
const LARGURA = 390;
const ALTURA = 760;

const arg = process.argv.indexOf("--url");
let base = arg > -1 ? process.argv[arg + 1].replace(/\/$/, "") : "";
let servidor = null;

async function esperar(url, segundos = 60) {
  for (let i = 0; i < segundos * 2; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* ainda a arrancar */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`O site não respondeu em ${url}`);
}

if (!base) {
  if (!fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
    console.error("Falta o build do site. Corra primeiro: npm run build");
    process.exit(1);
  }
  const porta = 3399;
  base = `http://localhost:${porta}`;
  // o próprio Next, sem shell no meio: assim, no fim, desliga-se de certeza
  const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  servidor = spawn(process.execPath, [next, "start", "-p", String(porta)], { stdio: "ignore" });
  await esperar(`${base}/guia/en`);
}

fs.mkdirSync(PASTA, { recursive: true });
const browser = await chromium.launch();
let falhou = false;
try {
  const ctx = await browser.newContext({ viewport: { width: LARGURA + 1, height: ALTURA } /* +1: o PDF arredonda a página a 293 pt (390,7 px) */ });
  // As fotografias são JPEG já cortados e com a marca de água (public/guia/fotos, npm run fotos-guia): o PDF guarda-os tal como vêm.
  const page = await ctx.newPage();
  for (const l of LINGUAS) {
    await page.goto(`${base}/guia/${l}`, { waitUntil: "networkidle" });
    // todas as fotografias carregadas antes de imprimir (uma em falta ficaria em branco no PDF)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const fotos = await page.evaluate(() => document.images.length);
    // nenhuma página pode ter texto a mais (ficaria cortado no PDF)
    const cortadas = await page.evaluate(() =>
      [...document.querySelectorAll(".gx-folha")]
        .map((f, i) => ({ i: i + 1, a: [f, ...f.querySelectorAll(".gx-item-corpo, .gx-mesa-texto, .gx-capa-texto, .gx-indice, .gx-passos, .gx-jantar, .gx-entrada-lista, .gx-entrada-numeros")].some((e) => e.scrollHeight > e.clientHeight + 1) }))
        .filter((x) => x.a)
        .map((x) => x.i)
    );
    // nenhuma fotografia pode ser cortada pelo browser: a proporção do ficheiro tem de ser a da caixa
    // (o corte é feito antes, por npm run fotos-guia, para a marca de água ficar inteira)
    const tortas = await page.evaluate(() =>
      [...document.querySelectorAll("img.gx-img")]
        .filter((img) => Math.abs(img.naturalWidth / img.naturalHeight - img.clientWidth / img.clientHeight) > 0.01)
        .map((img) => `${img.getAttribute("src")} (${img.clientWidth}×${img.clientHeight})`)
    );
    if (tortas.length) {
      falhou = true;
      console.error(`✗ /guia/${l}: fotografias com proporção diferente da caixa: ${tortas.join(", ")}`);
    }
    // nenhum rodapé pode ficar por cima do texto ou do botão
    const tapadas = await page.evaluate(() =>
      [...document.querySelectorAll(".gx-folha")]
        .map((f, i) => {
          const r = f.querySelector(".gx-rodape");
          if (!r) return 0;
          const topo = r.getBoundingClientRect().top;
          const fundo = Math.max(...[...f.querySelectorAll(".gx-item-corpo, .gx-passos, .gx-indice, .gx-entrada-lista, .gx-entrada-numeros, .gx-exemplo-foto, .gx-faixa")].map((e) => e.getBoundingClientRect().bottom), -Infinity);
          return fundo > topo + 1 ? i + 1 : 0;
        })
        .filter(Boolean)
    );
    if (tapadas.length) {
      falhou = true;
      console.error(`✗ /guia/${l}: o rodapé tapa conteúdo na(s) página(s) ${tapadas.join(", ")}`);
    }
    if (cortadas.length) {
      falhou = true;
      console.error(`✗ /guia/${l}: o texto não cabe na(s) página(s) ${cortadas.join(", ")}`);
    }
    await page.emulateMedia({ media: "print" });
    const ficheiro = path.join(PASTA, `HUB-Transfer-Lisboa-${l.toUpperCase()}.pdf`);
    await page.pdf({ path: ficheiro, width: `${293 / 72}in`, height: `${570 / 72}in` /* 293 × 570 pt, como o @page do guia.css */, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const tamanho = fs.statSync(ficheiro).size;
    const mb = (tamanho / 1024 / 1024).toFixed(2);
    if (tamanho >= LIMITE) {
      falhou = true;
      console.error(`✗ ${path.relative(process.cwd(), ficheiro)} — ${mb} MB (acima dos 5 MB)`);
    } else if (tamanho >= PREFERIDO) console.warn(`! ${path.relative(process.cwd(), ficheiro)} — ${mb} MB (acima dos 3 MB preferidos), ${fotos} imagens`);
    else console.log(`✓ ${path.relative(process.cwd(), ficheiro)} — ${mb} MB, ${fotos} imagens`);
    await page.emulateMedia({ media: "screen" });
  }
} finally {
  await browser.close();
  if (servidor) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"], { stdio: "ignore" });
    else servidor.kill();
  }
}
process.exit(falhou ? 1 : 0);
