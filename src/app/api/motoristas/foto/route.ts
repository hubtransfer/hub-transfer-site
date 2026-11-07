import { NextResponse } from "next/server";
import { chamarBackend } from "../_backend";
import { ID_VALIDO } from "../_meta";

/* Uma foto do carro de cada vez (multipart: leadId, tipo, foto).
   O telemóvel já a reduziu para JPEG < 1 MB; aqui confirma-se que é mesmo um JPEG pequeno antes de a passar ao Apps Script,
   que a guarda no Google Drive (subpasta da ficha) e põe o link na folha. */

const TIPOS = ["lado", "bagageira"];
const MAX_BYTES = 1_500_000;

export const maxDuration = 60;

export async function POST(req: Request) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const leadId = String(fd.get("leadId") || "");
  const tipo = String(fd.get("tipo") || "");
  const foto = fd.get("foto");
  if (!ID_VALIDO.test(leadId) || !TIPOS.includes(tipo) || !(foto instanceof Blob)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (foto.size === 0 || foto.size > MAX_BYTES) return NextResponse.json({ ok: false }, { status: 413 });

  const bytes = Buffer.from(await foto.arrayBuffer());
  // JPEG começa sempre por FF D8 FF
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return NextResponse.json({ ok: false }, { status: 415 });
  }

  const res = await chamarBackend({ acao: "foto", leadId, tipo, imagem: bytes.toString("base64") });
  if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json({ ok: true });
}
