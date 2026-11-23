"use client";

// Os pedidos de ajuda de um motorista: os que fez (por viagem) e os que recebeu.
// Polling a cada AJUDA_POLL_S + aviso imediato do simulado (aoMudar).
import { useCallback, useEffect, useRef, useState } from "react";
import { ajuda, AJUDA_POLL_S } from "@/lib/ajuda/cliente";
import type { MotoristaRef, PedidoAjuda, PedidoRecebido } from "@/lib/ajuda/tipos";

export function useAjuda(eu: MotoristaRef | null, relogio: () => number = Date.now) {
  const [meus, setMeus] = useState<Record<string, PedidoAjuda>>({});
  const [recebidos, setRecebidos] = useState<PedidoRecebido[]>([]);
  const [agora, setAgora] = useState(() => relogio());
  const relogioRef = useRef(relogio);
  useEffect(() => { relogioRef.current = relogio; }, [relogio]);
  const anterior = useRef("");

  const recarregar = useCallback(async () => {
    setAgora(relogioRef.current());
    if (!eu?.id) return;
    try {
      const [m, r] = await Promise.all([ajuda.meusPedidos(eu.id), ajuda.recebidos(eu.id)]);
      // Refresh silencioso: só muda o estado se os dados mudaram
      const chave = JSON.stringify([m, r]);
      if (chave === anterior.current) return;
      anterior.current = chave;
      const porViagem: Record<string, PedidoAjuda> = {};
      for (const p of m) porViagem[p.viagemRef] = p;
      setMeus(porViagem);
      setRecebidos(r);
    } catch { /* sem rede: fica o que havia */ }
  }, [eu?.id]);

  useEffect(() => {
    void recarregar();
    const id = setInterval(() => void recarregar(), AJUDA_POLL_S * 1000);
    const desligar = ajuda.aoMudar?.(() => void recarregar());
    return () => { clearInterval(id); desligar?.(); };
  }, [recarregar]);

  return { meus, recebidos, agora, recarregar };
}
