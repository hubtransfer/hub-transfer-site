import PaginaPagamento, { metadadosPagamento, viewportPagamento, type SearchParams } from "@/components/pagamento/PaginaPagamento";

/* Pagamento — obrigado (fr, /fr/pagamento/obrigado?k=K-0012). As cinco versões: /pagamento/obrigado (en) · /pt · /es · /fr · /it. Sem preços; noindex. */
export const metadata = metadadosPagamento("obrigado", "fr");
export const viewport = viewportPagamento;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <PaginaPagamento pagina="obrigado" lingua="fr" searchParams={searchParams} />;
}
