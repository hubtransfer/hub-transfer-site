// Gera as imagens da «Ajuda» para o vídeo dos motoristas.
// Correr (na raiz do projecto): node docs/ajuda-video/fonte/gerar.mjs
//   1. empacota ecras.tsx (componentes verdadeiros, dados inventados) com o esbuild;
//   2. gera o CSS com o Tailwind do projecto e embute as letras;
//   3. escreve fonte/ecras.html (autónomo, vê-se sem internet; #01 … #12 escolhe o ecrã);
//   4. fotografa cada ecrã com o Chromium sem interface do Playwright (390 × 844, escala 3),
//      com a rede bloqueada. Não arranca o servidor do Next.js.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "package.json"));
const AQUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = join(AQUI, "..");
const RAIZ = join(VIDEO, "..", "..");

export const NOMES = {
  "01": "01-lista-viagens",
  "02": "02-pedir-ajuda",
  "03": "03-colega-e-motivo",
  "04": "04-deslizar",
  "05": "05-a-espera",
  "06": "06-colega-recebe",
  "07": "07-sim-faco-nao-posso",
  "08": "08-viagem-do-colega",
  "09": "09-pedir-ao-grupo",
  "10": "10-link-do-grupo",
  "11": "11-segunda-confirmacao",
  "12": "12-ja-ficou",
};

// 1. JS
const esbuild = require("esbuild");
const js = (await esbuild.build({
  entryPoints: [join(AQUI, "ecras.tsx")],
  bundle: true, write: false, minify: true, format: "iife", platform: "browser",
  jsx: "automatic", tsconfig: join(RAIZ, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
})).outputFiles[0].text;

// 2. CSS
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const entrada = `@import "${join(RAIZ, "src", "styles", "globals.css").replace(/\\/g, "/")}";\n` +
  `@source "${join(RAIZ, "src").replace(/\\/g, "/")}";\n@source "${AQUI.replace(/\\/g, "/")}";\n`;
const css = (await postcss([tailwind({ base: RAIZ })]).process(entrada, { from: join(AQUI, "entrada.css") })).css;
const letra = (f) => readFileSync(join(AQUI, "letras", f)).toString("base64");
const letras = `
@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:200 800;src:url(data:font/woff2;base64,${letra("plus-jakarta-sans-latin.woff2")}) format("woff2");}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:100 800;src:url(data:font/woff2;base64,${letra("jetbrains-mono-latin.woff2")}) format("woff2");}
html,body{margin:0;background:#000;width:390px;height:844px;overflow:hidden}`;

// 3. HTML autónomo
const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8">
<meta name="viewport" content="width=390, initial-scale=1"><title>Ajuda — ecrãs do vídeo</title>
<style>${letras}\n${css}</style></head><body><div id="raiz"></div>
<script>window.addEventListener("hashchange",()=>location.reload());</script>
<script>${js.replace(/<\/script/g, "<\\/script")}</script></body></html>`;
const pagina = join(AQUI, "ecras.html");
writeFileSync(pagina, html);
console.log(`ecras.html: ${(html.length / 1024).toFixed(0)} KB`);

// 4. Fotografias
const pw = join(homedir(), "AppData", "Local", "ms-playwright");
const pasta = existsSync(pw) && readdirSync(pw).find((d) => d.startsWith("chromium_headless_shell"));
const chrome = pasta && join(pw, pasta, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!chrome || !existsSync(chrome)) { console.log("Sem Chromium sem interface: ficam só os HTML."); process.exit(0); }

const so = process.argv.slice(2);
for (const [id, nome] of Object.entries(NOMES)) {
  if (so.length && !so.includes(id)) continue;
  const png = join(VIDEO, `${nome}.png`);
  const r = spawnSync(chrome, [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--disable-extensions",
    "--host-resolver-rules=MAP * ~NOTFOUND",
    "--window-size=390,844", "--force-device-scale-factor=3",
    "--virtual-time-budget=4000", "--run-all-compositor-stages-before-draw",
    `--screenshot=${png}`, `${pathToFileURL(pagina).href}#${id}`,
  ], { encoding: "utf8", timeout: 60000 });
  console.log(existsSync(png) ? `ok  ${nome}.png` : `FALHOU ${nome}: ${r.stderr?.slice(-300)}`);
}
