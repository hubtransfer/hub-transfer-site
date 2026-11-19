import PaginaLisboa from "@/components/lisboa/PaginaLisboa";
import { metadadosLisboa, viewportLisboa } from "@/lib/lisboa/metadados";

/* «Lisboa à sua mesa» — es. As três versões ligam-se entre si (pt /lisboa, en /en/lisboa, es /es/lisboa). */
export const metadata = metadadosLisboa("es");
export const viewport = viewportLisboa;

export default function Page() {
  return <PaginaLisboa lingua="es" />;
}
