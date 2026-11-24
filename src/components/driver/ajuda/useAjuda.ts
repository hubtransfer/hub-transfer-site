"use client";

// Os pedidos de ajuda do motorista da sessão: os que fez (por viagem) e os
// que recebeu — e se a ajuda está LIGADA para ele.
//
// Quem decide é o HUB-Central: a primeira leitura (ajudaMeusPedidos) responde
// ok só se a ajuda estiver em TESTE com o nome dele, ou LIGADA. Desligada,
// fora do teste ou recusada → `ligada` fica false e a página não mostra nada.
//
// Actualiza de 30 em 30 s (com pedidos em curso) ou de 60 em 60 s, só com a
// app aberta e à vista; escondida, volta a perguntar de 5 em 5 min.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PedidoAjuda, PedidoRecebido } from "@/lib/ajuda/tipos";
import {
  criarActualizador, haPedidosEmCurso, intervaloDaAjuda, ligacaoDoErro, proximaLigada,
} from "@/lib/ajuda/hubCentral";
import { useClienteAjuda } from "./contexto";

export function useAjuda(activo: boolean, relogio: () => number = Date.now) {
  const cliente = useClienteAjuda();
  const [ligada, setLigada] = useState(false);
  const [verificada, setVerificada] = useState(false); // já houve uma resposta (ligada ou não)
  const [meus, setMeus] = useState<Record<string, PedidoAjuda>>({});
  const [recebidos, setRecebidos] = useState<PedidoRecebido[]>([]);
  const [agora, setAgora] = useState(() => relogio());
  const relogioRef = useRef(relogio);
  useEffect(() => { relogioRef.current = relogio; }, [relogio]);
  const anterior = useRef("");
  const ligadaRef = useRef(false);
  const emCursoRef = useRef(false);

  const aplicar = useCallback((m: PedidoAjuda[], r: PedidoRecebido[]) => {
    emCursoRef.current = haPedidosEmCurso(m, r);
    // Refresh silencioso: só muda o estado se os dados mudaram
    const chave = JSON.stringify([m, r]);
    if (chave === anterior.current) return;
    anterior.current = chave;
    const porViagem: Record<string, PedidoAjuda> = {};
    for (const p of m) porViagem[p.viagemRef] = p;
    setMeus(porViagem);
    setRecebidos(r);
  }, []);

  const carregar = useCallback(async () => {
    setAgora(relogioRef.current());
    if (!activo) return;
    let l: ReturnType<typeof ligacaoDoErro> | "ligada";
    let m: PedidoAjuda[] = [];
    let r: PedidoRecebido[] = [];
    try {
      m = await cliente.meusPedidos();
      r = await cliente.recebidos();
      l = "ligada";
    } catch (e) {
      l = ligacaoDoErro(e);
    }
    const nova = proximaLigada(ligadaRef.current, l);
    ligadaRef.current = nova;
    setLigada(nova);
    if (l !== "sem_rede") setVerificada(true);
    if (l === "ligada") aplicar(m, r);
    else if (!nova) aplicar([], []);
  }, [activo, cliente, aplicar]);

  const carregarRef = useRef(carregar);
  useEffect(() => { carregarRef.current = carregar; }, [carregar]);
  const actualizador = useRef<ReturnType<typeof criarActualizador> | null>(null);

  useEffect(() => {
    if (!activo) {
      ligadaRef.current = false;
      setLigada(false); setVerificada(false); aplicar([], []);
      return;
    }
    const a = criarActualizador({
      carregar: () => carregarRef.current(),
      intervalo: () => intervaloDaAjuda(ligadaRef.current, emCursoRef.current),
      visivel: () => typeof document === "undefined" || document.visibilityState === "visible",
      agendar: (f, ms) => setTimeout(f, ms),
      cancelar: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    actualizador.current = a;
    void a.iniciar();
    const onVis = () => { void a.mudouVisibilidade(); };
    document.addEventListener("visibilitychange", onVis);
    const desligar = cliente.aoMudar?.(() => { void a.agora(); });
    return () => {
      a.parar();
      actualizador.current = null;
      document.removeEventListener("visibilitychange", onVis);
      desligar?.();
    };
  }, [activo, cliente, aplicar]);

  /** Depois de um botão: actualiza já. */
  const recarregar = useCallback(() => {
    if (actualizador.current) void actualizador.current.agora();
    else void carregarRef.current();
  }, []);

  return { ligada, verificada, meus, recebidos, agora, recarregar };
}
