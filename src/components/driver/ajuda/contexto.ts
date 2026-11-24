"use client";

// Qual cliente da ajuda os ecrãs usam: por omissão o do HUB-Central.
// Só a página de demonstração (dev) põe o simulado, com dados inventados.
import { createContext, useContext } from "react";
import type { ClienteAjuda } from "@/lib/ajuda/tipos";
import { clienteHubCentral } from "@/lib/ajuda/cliente";

export const AjudaClienteContexto = createContext<ClienteAjuda>(clienteHubCentral);

export function useClienteAjuda(): ClienteAjuda {
  return useContext(AjudaClienteContexto);
}
