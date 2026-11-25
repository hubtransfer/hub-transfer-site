import PaginaLisboa from "@/components/lisboa/PaginaLisboa";
import { metadadosLisboa, viewportLisboa } from "@/lib/lisboa/metadados";

/* «Lisboa à sua mesa» — italiano (tradução por rever) (/it/lisboa). As cinco versões ligam-se entre si:
   en /lisboa · pt /pt/lisboa · es /es/lisboa · fr /fr/lisboa · it /it/lisboa. */
export const metadata = metadadosLisboa("it");
export const viewport = viewportLisboa;

export default function Page() {
  return <PaginaLisboa lingua="it" />;
}
