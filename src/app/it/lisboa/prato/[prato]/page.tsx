import { notFound } from "next/navigation";
import PaginaPrato from "@/components/lisboa/PaginaPrato";
import { metadadosPrato, paramsPratos, viewportLisboa } from "@/lib/lisboa/metadados";
import { pratoPorSlug } from "@/lib/lisboa/pratos";

/* Página de um prato — italiano (tradução por rever) (/it/lisboa/prato/{slug}). O endereço do prato é o mesmo nas cinco línguas. */
type Props = { params: Promise<{ prato: string }> };

export const dynamicParams = false;
export const generateStaticParams = paramsPratos;
export const viewport = viewportLisboa;

export async function generateMetadata({ params }: Props) {
  return metadadosPrato("it", (await params).prato);
}

export default async function Page({ params }: Props) {
  const prato = pratoPorSlug((await params).prato);
  if (!prato) notFound();
  return <PaginaPrato lingua="it" prato={prato} />;
}
