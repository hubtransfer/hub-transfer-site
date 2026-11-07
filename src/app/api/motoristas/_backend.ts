/* Ligação ao Apps Script "Candidatos Motoristas" (docs/motoristas/apps-script-motoristas.gs).
   Variáveis: MOTORISTAS_WEBAPP_URL (URL /exec do web app) e MOTORISTAS_TOKEN (segredo partilhado com o script).
   MOTORISTAS_SIMULAR=1 (só fora de produção): não chama o Apps Script; responde como ele, para testar em local
   sem escrever na folha verdadeira. */

export type RespostaBackend = { ok: boolean; codigo?: string; url?: string; erro?: string };

const simular = () => process.env.MOTORISTAS_SIMULAR === "1" && process.env.VERCEL_ENV !== "production";

/* Memória do modo simulado (só vive enquanto o servidor local está ligado). */
const g = globalThis as unknown as { __motoristasSim?: Map<string, string> };
const sim = (g.__motoristasSim ??= new Map());

function codigoAoAcaso() {
  const ch = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L
  let c = "HUB-";
  for (let k = 0; k < 4; k++) c += ch[Math.floor(Math.random() * ch.length)];
  return c;
}

function simulado(dados: Record<string, unknown>): RespostaBackend {
  const { imagem, ...resto } = dados;
  console.info("[motoristas] SIMULADO:", JSON.stringify({ ...resto, imagem: imagem ? `${String(imagem).length} car. base64` : undefined }));
  const leadId = String(dados.leadId);
  if (dados.acao === "passo1") {
    if (!sim.has(leadId)) sim.set(leadId, codigoAoAcaso());
    return { ok: true, codigo: sim.get(leadId) };
  }
  if (!sim.has(leadId)) return { ok: false, erro: "id" };
  if (dados.acao === "foto") return { ok: true, url: `https://drive.google.com/simulado/${sim.get(leadId)}/${dados.tipo}.jpg` };
  return { ok: true };
}

export async function chamarBackend(dados: Record<string, unknown>): Promise<RespostaBackend> {
  if (simular()) return simulado(dados);

  const destino = process.env.MOTORISTAS_WEBAPP_URL;
  if (!destino) {
    console.error("[motoristas] MOTORISTAS_WEBAPP_URL por definir — candidatura NÃO guardada");
    return { ok: false, erro: "config" };
  }
  try {
    const r = await fetch(destino, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, token: process.env.MOTORISTAS_TOKEN || "" }),
      redirect: "follow",
      signal: AbortSignal.timeout(dados.acao === "foto" ? 40000 : 15000),
    });
    const j = (await r.json().catch(() => null)) as RespostaBackend | null;
    if (!r.ok || !j?.ok) {
      console.error("[motoristas] Apps Script recusou:", dados.acao, r.status, j?.erro);
      return { ok: false, erro: j?.erro || String(r.status) };
    }
    return j;
  } catch (err) {
    console.error("[motoristas] Apps Script inacessível:", dados.acao, (err as Error).message);
    return { ok: false, erro: "rede" };
  }
}
