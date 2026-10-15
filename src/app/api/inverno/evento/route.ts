import { NextResponse } from "next/server";
import { dadosPedido, enviarEventoMeta, texto } from "../_meta";

/* Visita à página (PageView) para a API de Conversões, com o mesmo eventID do pixel.
   Só é chamada pelo browser depois de a pessoa aceitar os cookies. */

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const eventId = texto(b.eventId, 64);
  if (b.evento !== "PageView" || b.consentimento !== true || !/^[A-Za-z0-9-]{8,64}$/.test(eventId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { ip, userAgent } = dadosPedido(req);
  await enviarEventoMeta({
    nome: "PageView",
    eventId,
    url: texto(b.url, 600),
    ip,
    userAgent,
    fbp: texto(b.fbp, 200) || undefined,
    fbc: texto(b.fbc, 300) || undefined,
  });
  return NextResponse.json({ ok: true });
}
