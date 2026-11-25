import { NextResponse } from "next/server";

/* Cliente identificado da /lisboa (pedido E8, ponto 3) — SÓ PREPARADO: por agora devolve sempre vazio
   e a página funciona como sem cliente.

   Quando o backend existir (outro pedido), esta rota pergunta ao HUB-Central pelo código curto e devolve
   APENAS estes três campos (nunca o nome completo, o telefone, o e-mail, a viagem ou preços):
     { "primeiroNome": "Ana", "lingua": "en", "hotel": "Hotel Avenida Palace" }
   Código: 8 a 12 letras e números aleatórios (/lisboa?c=XXXXXXXX). Um código que não existe → {}. */

const CODIGO = /^[A-Za-z0-9]{8,12}$/;

export type ClienteLisboa = { primeiroNome?: string; lingua?: string; hotel?: string };

export async function GET(req: Request) {
  const c = new URL(req.url).searchParams.get("c") ?? "";
  const vazio: ClienteLisboa = {};
  if (!CODIGO.test(c)) return NextResponse.json(vazio, { status: 400, headers: { "Cache-Control": "no-store" } });
  // TODO (backend): procurar o código no HUB-Central e devolver só { primeiroNome, lingua, hotel }.
  return NextResponse.json(vazio, { headers: { "Cache-Control": "no-store" } });
}
