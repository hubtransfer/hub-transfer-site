import PaginaLisboa from "@/components/lisboa/PaginaLisboa";
import { metadadosLisboa, viewportLisboa } from "@/lib/lisboa/metadados";

/* «Lisboa à sua mesa» — pt. As três versões ligam-se entre si (pt /lisboa, en /en/lisboa, es /es/lisboa). */
export const metadata = metadadosLisboa("pt");
export const viewport = viewportLisboa;

export default function Page() {
  return <PaginaLisboa lingua="pt" />;
}
