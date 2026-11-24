// Demonstração da «Ajuda» entre motoristas — SÓ em desenvolvimento (npm run dev).
// Em produção dá 404: nenhum motorista vê dados inventados.
import { notFound } from "next/navigation";
import AjudaDemo from "@/components/driver/ajuda/AjudaDemo";

export const metadata = { title: "Ajuda (demo) — HUB Transfer", robots: { index: false } };

export default function AjudaDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AjudaDemo />;
}
