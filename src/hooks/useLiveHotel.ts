"use client";

// Polling poupança do feed liveHotel (padrão lastChange da casa):
// ping leve → só se o hash `h` mudar é que vem o json completo.
// quente=25s / calmo=3min · document.hidden PÁRA tudo · ao voltar, tick imediato.

import { useEffect, useRef, useState } from "react";
import { fetchLivePing, fetchLiveJson, type LiveViagem } from "@/lib/live";

const INTERVAL_QUENTE = 25_000;
const INTERVAL_CALMO = 180_000;

export type LiveStatus = "idle" | "loading" | "ok" | "error" | "unauthorized";

export interface LiveHotelState {
  status: LiveStatus;
  viagens: LiveViagem[];
  sigla: string;
  atualizado: string;
  syncedAt: string; // hora local do último sync com dados novos
}

export function useLiveHotel(codigo: string, senha: string | null): LiveHotelState {
  const [state, setState] = useState<LiveHotelState>({
    status: "idle", viagens: [], sigla: "", atualizado: "", syncedAt: "",
  });

  // O hash do último json aplicado vive num ref para sobreviver aos re-renders
  const lastHashRef = useRef("");

  useEffect(() => {
    if (!codigo || !senha) {
      setState((s) => (s.status === "idle" ? s : { ...s, status: "idle" }));
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    lastHashRef.current = "";
    setState((s) => ({ ...s, status: "loading" }));

    const schedule = (ms: number) => {
      if (stopped || document.hidden) return; // escondido → zero rede até voltar
      timer = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (stopped || document.hidden) return;
      let nextMs = INTERVAL_CALMO;
      try {
        const ping = await fetchLivePing(codigo, senha);
        if (stopped) return;
        if (!ping.ok) {
          // Auth recusada ou feed indisponível — o board decide o que mostrar
          setState((s) => ({ ...s, status: "unauthorized" }));
          return; // não reagenda: sem credencial válida não há polling
        }
        nextMs = ping.quente ? INTERVAL_QUENTE : INTERVAL_CALMO;
        const h = ping.h || "";
        if (h && h === lastHashRef.current) {
          // Nada mudou — saltar o fetch completo
          setState((s) => (s.status === "ok" ? s : { ...s, status: "ok" }));
        } else {
          const feed = await fetchLiveJson(codigo, senha);
          if (stopped) return;
          if (feed.ok) {
            lastHashRef.current = h;
            setState({
              status: "ok",
              viagens: feed.viagens || [],
              sigla: feed.sigla || "",
              atualizado: feed.atualizado || "",
              syncedAt: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            });
          } else {
            setState((s) => ({ ...s, status: "unauthorized" }));
            return;
          }
        }
      } catch {
        if (stopped) return;
        // Erro de rede/GAS: mantém os dados que já tem, marca erro, tenta mais tarde
        setState((s) => ({ ...s, status: "error" }));
      }
      schedule(nextMs);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) { clearTimeout(timer); timer = null; }
      } else {
        if (timer) { clearTimeout(timer); timer = null; }
        void tick(); // ao voltar, tick imediato
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    void tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [codigo, senha]);

  return state;
}
