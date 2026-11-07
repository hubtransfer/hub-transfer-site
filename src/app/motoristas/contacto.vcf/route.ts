/* Cartão de contacto do responsável pela contratação, para o botão "Guardar o número nos contactos".
   Um ficheiro .vcf servido pelo site abre o "Adicionar contacto" no iPhone e no Android (um link data: não funciona no Safari).
   O número vem de MOTORISTAS_WHATSAPP_CONTRATACAO (ex.: +351 963 705 509). */

export const dynamic = "force-dynamic";

export function GET() {
  const numero = process.env.MOTORISTAS_WHATSAPP_CONTRATACAO?.trim();
  if (!numero) return new Response("Número por definir", { status: 404 });
  let tel = numero.replace(/[^\d+]/g, "");
  if (!tel.startsWith("+")) tel = tel.length === 9 ? `+351${tel}` : `+${tel}`;

  const vcard = ["BEGIN:VCARD", "VERSION:3.0", "N:;HUB Transfer Contratação;;;", "FN:HUB Transfer Contratação", "ORG:HUB Transfer", `TEL;TYPE=CELL:${tel}`, "END:VCARD", ""].join("\r\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="HUB-Transfer-Contratacao.vcf"',
      "Cache-Control": "no-store",
    },
  });
}
