import PaginaPagamento, { metadadosPagamento, viewportPagamento, type SearchParams } from "@/components/pagamento/PaginaPagamento";

/* Pagamento — obrigado (es, /es/pagamento/obrigado?k=K-0012). As cinco versões: /pagamento/obrigado (en) · /pt · /es · /fr · /it. Sem preços; noindex. */
export const metadata = metadadosPagamento("obrigado", "es");
export const viewport = viewportPagamento;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <PaginaPagamento pagina="obrigado" lingua="es" searchParams={searchParams} />;
}
