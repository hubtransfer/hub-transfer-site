/* Imagens da página «Lisboa à sua mesa» — só para o servidor (lê a pasta public/lisboa no momento do build).
   Cada prato e cada lugar pode ter até 4 imagens: a (principal), b (pormenor), c (ambiente), d (outro momento).
   A página mostra as que existirem: basta pôr o ficheiro com o nome certo e publicar de novo.
     public/lisboa/hero/hero-mesa-a.jpg (-b, -c)
     public/lisboa/pratos/prato-01-a.jpg … prato-08-d.jpg
     public/lisboa/lugares/lugar-01-a.jpg … lugar-21-d.jpg
   Para testar a página sem imagens: LISBOA_SEM_IMAGENS=1 npm run dev */

import fs from "node:fs";
import path from "node:path";

const LETRAS = ["a", "b", "c", "d"] as const;
const PASTA = path.join(process.cwd(), "public", "lisboa");

function existentes(pasta: string, prefixo: string, max = 4): string[] {
  if (process.env.LISBOA_SEM_IMAGENS === "1") return [];
  return LETRAS.slice(0, max)
    .map((l) => `${prefixo}-${l}.jpg`)
    .filter((f) => fs.existsSync(path.join(PASTA, pasta, f)))
    .map((f) => `/lisboa/${pasta}/${f}`);
}

const dois = (n: number) => String(n).padStart(2, "0");

export const imagensHero = () => existentes("hero", "hero-mesa", 3);
export const imagensPrato = (n: number) => existentes("pratos", `prato-${dois(n)}`);
export const imagensLugar = (n: number) => existentes("lugares", `lugar-${dois(n)}`);
