"use client";

import { useEffect } from "react";
import { medir, type EventoLisboa } from "@/lib/lisboa/medicao";
import { abrirMesa, type PedidoMesa } from "@/lib/lisboa/mesa";

type Props = {
  pedido: PedidoMesa;
  className?: string;
  /** evento extra no clique (ex.: EscolherRestaurante) */
  evento?: { nome: EventoLisboa; dados: Record<string, string | number> };
  children: React.ReactNode;
};

/** Botão que abre o formulário da mesa nesta página. */
export default function BotaoMesa({ pedido, className, evento, children }: Props) {
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => {
        if (evento) medir(evento.nome, evento.dados);
        abrirMesa(pedido);
      }}
    >
      {children}
    </button>
  );
}

/** Regista um evento quando a página abre (ex.: VerPrato). */
export function MedirAoAbrir({ evento, dados }: { evento: EventoLisboa; dados: Record<string, string | number> }) {
  useEffect(() => {
    medir(evento, dados);
    // só uma vez por página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
