import PaginaPagamento, { metadadosPagamento, viewportPagamento, type SearchParams } from "@/components/pagamento/PaginaPagamento";

/* Pagamento — cancelado (fr, /fr/pagamento/cancelado?k=K-0012). As cinco versões: /pagamento/cancelado (en) · /pt · /es · /fr · /it. Sem preços; noindex. */
export const metadata = metadadosPagamento("cancelado", "fr");
export const viewport = viewportPagamento;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <PaginaPagamento pagina="cancelado" lingua="fr" searchParams={searchParams} />;
}
