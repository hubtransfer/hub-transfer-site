// npm run fotos-guia — prepara as fotografias do guia em PDF (pedido E19).
//
// Lê os ORIGINAIS SEM MARCA DE ÁGUA da pasta _pedidos/ (fora do git; só existem no computador do Junior),
// corta cada um à volta do seu ponto de foco (src/lib/lisboa/enquadramentos-guia.json) na proporção exata
// de cada uso no guia e, SÓ DEPOIS DO CORTE, grava a marca de água HUB inteira no canto superior direito.
// Grava em public/guia/fotos/ (vai para o git). Depois: npm run build && npm run guias.
//
// Proporções (px da página de 390 de largura; os ficheiros saem com o dobro, para o ecrã retina):
//   pratos e lugares 390×325 (6:5, igual em todas) · capa 390×380 · mesa 390×200 · como usar 390×220 · jantar 390×340

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const RAIZ = process.cwd();
const ORIGENS = path.join(RAIZ, "_pedidos");
const DESTINO = path.join(RAIZ, "public", "guia", "fotos");
const { fotos } = JSON.parse(fs.readFileSync(path.join(RAIZ, "src", "lib", "lisboa", "enquadramentos-guia.json"), "utf8"));
const ESCALA = 2;

/** [ficheiro de saída, foto do enquadramento, largura, altura] — a página usa exatamente estas medidas */
export const USOS = [
  ...Array.from({ length: 8 }, (_, i) => [`prato-${String(i + 1).padStart(2, "0")}`, `prato-${String(i + 1).padStart(2, "0")}`, 390, 325]),
  ...Array.from({ length: 21 }, (_, i) => [`lugar-${String(i + 1).padStart(2, "0")}`, `lugar-${String(i + 1).padStart(2, "0")}`, 390, 325]),
  ["capa", "hero", 390, 380],
  ["mesa", "hero", 390, 200],
  ["como", "lugar-07", 390, 220],
  ["jantar", "prato-08", 390, 340],
];

// a marca: o logótipo HUB em branco (com uma sombra leve para se ler sobre o céu claro), 22% da largura, margem 4%
async function marca(largura) {
  const w = Math.round(largura * 0.22);
  const alfa = await sharp(path.join(RAIZ, "public", "images", "logo.png")).resize(w).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  const { width, height } = alfa.info;
  const cor = (v, opac) => {
    const px = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
      px[i * 4 + 3] = Math.round(alfa.data[i] * opac);
    }
    return sharp(px, { raw: { width, height, channels: 4 } }).png().toBuffer();
  };
  const branco = await cor(255, 0.85);
  const sombra = await sharp(await cor(0, 0.45)).blur(Math.max(1, w / 90)).toBuffer();
  return { branco, sombra, width, height };
}

fs.mkdirSync(DESTINO, { recursive: true });
const marcas = new Map();
let total = 0;
for (const [nome, chave, w, h] of USOS) {
  const f = fotos[chave];
  if (!f) throw new Error(`Falta o enquadramento de «${chave}» em enquadramentos-guia.json`);
  const origem = path.join(ORIGENS, f.origem);
  if (!fs.existsSync(origem)) throw new Error(`Falta o original sem marca: _pedidos/${f.origem}`);
  const { width: ow, height: oh } = await sharp(origem).metadata();
  // o maior retângulo com a proporção w:h, centrado no ponto de foco e sem sair da foto
  const r = w / h;
  const cw = Math.round(Math.min(ow, oh * r));
  const ch = Math.round(cw / r);
  const left = Math.round(Math.min(Math.max((f.x / 100) * ow - cw / 2, 0), ow - cw));
  const top = Math.round(Math.min(Math.max((f.y / 100) * oh - ch / 2, 0), oh - ch));
  const W = w * ESCALA;
  const H = h * ESCALA;
  if (!marcas.has(W)) marcas.set(W, await marca(W));
  const m = marcas.get(W);
  const mx = W - m.width - Math.round(W * 0.04);
  const my = Math.round(W * 0.04);
  const saida = path.join(DESTINO, `${nome}.jpg`);
  await sharp(origem)
    .extract({ left, top, width: cw, height: ch })
    .resize(W, H)
    .composite([
      { input: m.sombra, left: mx, top: my },
      { input: m.branco, left: mx, top: my },
    ])
    .jpeg({ quality: 64, mozjpeg: true })
    .toFile(saida);
  const kb = fs.statSync(saida).size / 1024;
  total += kb;
  console.log(`✓ ${nome}.jpg  ${W}×${H}  corte ${cw}×${ch} em (${left}, ${top})  ${kb.toFixed(0)} KB`);
}
console.log(`${USOS.length} fotografias, ${(total / 1024).toFixed(2)} MB`);
