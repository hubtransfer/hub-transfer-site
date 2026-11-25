// npm run guias — faz os 5 guias em PDF «Lisboa à sua mesa» a partir do site (pedido E9, Fase B).
//
//   npm run build && npm run guias          arranca o site (next start), faz os PDF e desliga-o
//   npm run guias -- --url http://localhost:3000   usa um site que já esteja a correr (ex.: npm run dev)
//
// Grava sempre nos mesmos endereços: public/guia/HUB-Transfer-Lisboa-EN.pdf, -PT, -ES, -FR e -IT.
// A4, com os fundos e com as ligações clicáveis. Cada PDF tem de ficar abaixo dos 5 MB (para o WhatsApp):
// se passar, o comando falha e diz qual.
// Primeira vez neste computador: npx playwright install chromium

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const LINGUAS = ["en", "pt", "es", "fr", "it"];
const PASTA = path.join(process.cwd(), "public", "guia");
const LIMITE = 5 * 1024 * 1024;

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
  const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 } });
  // As fotografias em JPEG (não AVIF/WebP): o PDF guarda o JPEG como vem e fica leve.
  await ctx.route("**/_next/image**", (rota) =>
    rota.continue({ headers: { ...rota.request().headers(), accept: "image/jpeg,image/*;q=0.8" } })
  );
  const page = await ctx.newPage();
  for (const l of LINGUAS) {
    await page.goto(`${base}/guia/${l}`, { waitUntil: "networkidle" });
    // todas as fotografias carregadas antes de imprimir (uma em falta ficaria em branco no PDF)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const fotos = await page.evaluate(() => document.images.length);
    await page.emulateMedia({ media: "print" });
    const ficheiro = path.join(PASTA, `HUB-Transfer-Lisboa-${l.toUpperCase()}.pdf`);
    await page.pdf({ path: ficheiro, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const tamanho = fs.statSync(ficheiro).size;
    const mb = (tamanho / 1024 / 1024).toFixed(2);
    if (tamanho >= LIMITE) {
      falhou = true;
      console.error(`✗ ${path.relative(process.cwd(), ficheiro)} — ${mb} MB (acima dos 5 MB)`);
    } else console.log(`✓ ${path.relative(process.cwd(), ficheiro)} — ${mb} MB, ${fotos} imagens`);
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
