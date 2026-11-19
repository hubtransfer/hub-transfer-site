"use client";

import { medir, type EventoLisboa } from "@/lib/lisboa/medicao";

type Props = {
  href: string;
  evento: EventoLisboa;
  dados?: Record<string, string | number>;
  className?: string;
  /** texto extra só para leitores de ecrã (ex.: «abre o WhatsApp») */
  extra?: string;
  children: React.ReactNode;
};

/** Ligação para o WhatsApp da HUB com a frase já escrita; regista o clique. */
export default function BotaoWhats({ href, evento, dados, className, extra, children }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener" className={className} onClick={() => medir(evento, dados)}>
      {children}
      {extra && <span className="lx-sr"> ({extra})</span>}
    </a>
  );
}
