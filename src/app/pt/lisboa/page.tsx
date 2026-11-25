import PaginaLisboa from "@/components/lisboa/PaginaLisboa";
import { metadadosLisboa, viewportLisboa } from "@/lib/lisboa/metadados";

/* «Lisboa à sua mesa» — português (/pt/lisboa). As cinco versões ligam-se entre si:
   en /lisboa · pt /pt/lisboa · es /es/lisboa · fr /fr/lisboa · it /it/lisboa. */
export const metadata = metadadosLisboa("pt");
export const viewport = viewportLisboa;

export default function Page() {
  return <PaginaLisboa lingua="pt" />;
}
