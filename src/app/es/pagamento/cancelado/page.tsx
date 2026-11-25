import PaginaPagamento, { metadadosPagamento, viewportPagamento, type SearchParams } from "@/components/pagamento/PaginaPagamento";

/* Pagamento — cancelado (es, /es/pagamento/cancelado?k=K-0012). As cinco versões: /pagamento/cancelado (en) · /pt · /es · /fr · /it. Sem preços; noindex. */
export const metadata = metadadosPagamento("cancelado", "es");
export const viewport = viewportPagamento;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <PaginaPagamento pagina="cancelado" lingua="es" searchParams={searchParams} />;
}
