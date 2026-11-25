import PaginaPagamento, { metadadosPagamento, viewportPagamento, type SearchParams } from "@/components/pagamento/PaginaPagamento";

/* Pagamento — cancelado (pt, /pt/pagamento/cancelado?k=K-0012). As cinco versões: /pagamento/cancelado (en) · /pt · /es · /fr · /it. Sem preços; noindex. */
export const metadata = metadadosPagamento("cancelado", "pt");
export const viewport = viewportPagamento;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <PaginaPagamento pagina="cancelado" lingua="pt" searchParams={searchParams} />;
}
