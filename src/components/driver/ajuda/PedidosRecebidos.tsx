"use client";

// Os pedidos de ajuda que este motorista recebeu — no topo das viagens dele.
// Pedido a um colega: «Sim, faço» (com confirmação a deslizar) ou «Não posso».
// Pedido ao grupo: só «Aceitar». Fica reservada para quem aceitar primeiro,
// que recebe a mensagem privada da segunda confirmação (10 min).
// Antes de ficar com a viagem NÃO vê o nome nem o telefone do cliente,
// nem o motivo (o PedidoRecebido nem os tem).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, Users, HandHelping, Info, Clock, MessageCircle, AlertTriangle } from "lucide-react";
import type { MotoristaRef, PedidoRecebido } from "@/lib/ajuda/tipos";
import { textoDoErro } from "@/lib/ajuda/hubCentral";
import { useClienteAjuda } from "./contexto";
import { estadoEfectivo, horaDoPrazo, minutosAteExpirar, pedidosPorResponder, reservasMinhas } from "@/lib/ajuda/regras";
import { T, textoQuemPede, textoConfirmarFicar, textoFicou, textoPrazoReserva, textoNaoPode } from "@/lib/ajuda/textos";
import DeslizarConfirmar from "./DeslizarConfirmar";
import { ResumoViagem, Caixa } from "./partes";

export type Desfecho = "feito" | "ja_ficou" | "outro_a_confirmar" | "cancelado" | "expirou";

function haQuanto(iso: string, agora: number): string {
  const min = Math.max(0, Math.floor((agora - Date.parse(iso)) / 60000));
  return min < 1 ? "agora" : min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
}

/** O desfecho que o próprio pedido já diz (sem o motorista ter feito nada agora). */
export function desfechoDoPedido(p: PedidoRecebido, eu: MotoristaRef, agora: number): Desfecho | undefined {
  if (p.ficouCom) return p.ficouCom.id === eu.id ? "feito" : "ja_ficou";
  if (p.estado === "cancelado") return "cancelado";
  const est = estadoEfectivo(p, agora);
  if (est === "reservada" && !p.reservadaParaMim) return "outro_a_confirmar";
  if (p.tipo === "colega" && est === "sem_resposta") return "expirou";
  return undefined;
}

export default function PedidosRecebidos({
  recebidos, eu, agora, onMudou,
}: {
  recebidos: PedidoRecebido[];
  eu: MotoristaRef;
  agora: number;
  onMudou?: () => void;
}) {
  const [desfechos, setDesfechos] = useState<Record<string, Desfecho>>({});
  const [dispensados, setDispensados] = useState<Set<string>>(new Set());
  const vistos = useRef<Set<string>>(new Set());
  const minhasReservas = useRef<Set<string>>(new Set());

  const porResponder = pedidosPorResponder(recebidos, agora);
  const reservas = reservasMinhas(recebidos, agora);
  useEffect(() => {
    porResponder.forEach((p) => vistos.current.add(p.id));
    reservas.forEach((p) => minhasReservas.current.add(p.id));
  });

  // Mostra: os que pedem resposta, as minhas reservas, e os que já se viram e mudaram
  const visiveis = recebidos.filter((p) => {
    if (dispensados.has(p.id)) return false;
    if (desfechos[p.id]) return true;
    if (porResponder.some((q) => q.id === p.id)) return true;
    if (reservas.some((q) => q.id === p.id)) return true;
    return vistos.current.has(p.id) && !!p.ficouCom && p.ficouCom.id !== eu.id;
  });

  const dispensar = useCallback((id: string) => {
    setDispensados((s) => new Set(s).add(id));
  }, []);

  if (visiveis.length === 0) return null;

  return (
    <div className="space-y-2">
      {visiveis.map((p) => {
        // A minha reserva caiu (10 min sem a segunda confirmação): avisa e deixa aceitar outra vez
        const caiu = minhasReservas.current.has(p.id) && !p.reservadaParaMim && estadoEfectivo(p, agora) === "a_espera";
        return (
          <CartaoRecebido key={p.id} p={p} eu={eu} agora={agora}
            desfecho={desfechos[p.id] ?? desfechoDoPedido(p, eu, agora)}
            aviso={caiu ? T.prazoAcabou : undefined}
            onDesfecho={(d) => { setDesfechos((x) => ({ ...x, [p.id]: d })); onMudou?.(); }}
            onDispensar={() => dispensar(p.id)}
            onNaoPosso={() => { dispensar(p.id); onMudou?.(); }}
            onReservou={() => { minhasReservas.current.add(p.id); onMudou?.(); }} />
        );
      })}
    </div>
  );
}

export function CartaoRecebido({
  p, eu, agora, desfecho, aviso, naoPode, onDesfecho, onDispensar, onNaoPosso, onReservou, faseInicial = "pedido",
}: {
  p: PedidoRecebido;
  eu: MotoristaRef;
  agora: number;
  desfecho?: Desfecho;
  /** aviso por cima do pedido (ex.: «O prazo acabou: o pedido voltou ao grupo.») */
  aviso?: string;
  /** grupo, pelo link: o backend disse que este motorista não pode aceitar, e porquê */
  naoPode?: string;
  onDesfecho: (d: Desfecho) => void;
  onDispensar: () => void;
  onNaoPosso: () => void;
  /** grupo: «Aceitar» correu bem — agora é esperar pela mensagem privada */
  onReservou?: () => void;
  /** só para a página de demonstração */
  faseInicial?: "pedido" | "confirmar";
}) {
  const [fase, setFase] = useState<"pedido" | "confirmar">(faseInicial);
  const ajuda = useClienteAjuda();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const grupo = p.tipo === "grupo";

  const responder = useCallback(async (resposta: "sim" | "nao") => {
    setOcupado(true); setErro("");
    try {
      // Quem responde é o do crachá: a resposta não leva «motorista»
      const r = await ajuda.responder({ pedidoId: p.id, resposta });
      // Só se mostra que deu certo quando o backend disse ok
      if (!r.ok) { onDesfecho(r.motivo === "reservada" ? "outro_a_confirmar" : (r.motivo ?? "ja_ficou")); return; }
      if (resposta === "nao") { onNaoPosso(); return; }
      if (grupo) onReservou?.(); else onDesfecho("feito");
    } catch (e) {
      // Recusado (nao_pode com a razão, sessão, sem rede…): fica como estava e diz porquê
      setErro(textoDoErro(e, T.erroResponder));
    }
    finally { setOcupado(false); }
  }, [p.id, grupo, onDesfecho, onNaoPosso, onReservou, ajuda]);

  const caixaErro = erro && (
    <p role="alert" className="rounded-lg px-3 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#FCA5A5] flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {erro}
    </p>
  );

  const moldura = "rounded-2xl border border-l-4 px-4 py-3.5 space-y-3";

  if (desfecho === "feito") {
    const f = textoFicou();
    return (
      <Caixa cor="#22C55E" icone={<CheckCircle className="w-8 h-8" />} titulo={f.titulo} frase={f.frase}>
        <button type="button" onClick={onDispensar} className="mt-1 font-mono text-xs text-white/50 underline underline-offset-2">OK</button>
      </Caixa>
    );
  }
  if (desfecho) {
    const t = desfecho === "cancelado" ? T.recebidoCancelado
      : desfecho === "expirou" ? T.recebidoExpirou
      : desfecho === "outro_a_confirmar" ? T.outroAConfirmar
      : T.jaFicou;
    return (
      <div className={`${moldura} bg-[#151515] border-[#2A2A2A]`} style={{ borderLeftColor: "#555" }}>
        <p className={`flex items-start gap-2 ${desfecho === "ja_ficou" ? "text-base font-bold text-white" : "text-sm text-[#BDBDBD]"}`}>
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" /> {t}
        </p>
        <ResumoViagem r={p.viagem} compacto />
        <button type="button" onClick={onDispensar} className="w-full h-10 font-mono text-xs text-white/50 underline underline-offset-2">OK</button>
      </div>
    );
  }

  // Grupo, reservada para mim: falta a segunda confirmação (na mensagem privada)
  if (grupo && p.reservadaParaMim && estadoEfectivo(p, agora) === "reservada") {
    return (
      <div className={`${moldura} bg-[#0B1A10] border-[#22C55E]/30 ring-1 ring-[#22C55E]/20`} style={{ borderLeftColor: "#22C55E" }}>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#22C55E] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {T.recebidoGrupoTitulo}
        </span>
        <div>
          <p className="text-base font-bold text-[#22C55E]">{T.reservadaTitulo}</p>
          <p className="text-sm text-white leading-snug flex items-start gap-1.5 mt-0.5">
            <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#25D366]" /> {T.reservadaFrase}
          </p>
        </div>
        <ResumoViagem r={p.viagem} compacto />
        <p className="font-mono text-[11px] text-[#BDBDBD] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {textoPrazoReserva(horaDoPrazo(p.reservaExpiraEm), minutosAteExpirar(p.reservaExpiraEm, agora))}
        </p>
        <p className="font-mono text-[11px] text-[#888]">{T.semCliente}</p>
      </div>
    );
  }

  return (
    <div className={`${moldura} bg-[#1A1A00] border-[#F0D030]/30 ring-1 ring-[#F0D030]/20`} style={{ borderLeftColor: "#F0D030" }}>
      {aviso && (
        <p className="rounded-lg px-3 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-sm text-[#FCD34D] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {aviso}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] flex items-center gap-1.5">
          {grupo ? <Users className="w-3.5 h-3.5" /> : <HandHelping className="w-3.5 h-3.5" />}
          {grupo ? T.recebidoGrupoTitulo : T.recebidoTitulo}
        </span>
        <span className="font-mono text-[10px] text-[#888]">{haQuanto(p.criadoEm, agora)}</span>
      </div>
      <p className="text-base font-bold text-white leading-snug">{textoQuemPede(p)}</p>
      <ResumoViagem r={p.viagem} compacto />

      {caixaErro}
      {grupo ? (
        naoPode ? (
          <p className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-sm text-[#BDBDBD] flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" /> {textoNaoPode(naoPode)}
          </p>
        ) : (
        <>
          <p className="font-mono text-[11px] text-[#888] leading-snug">{T.grupoComoFunciona}</p>
          <button type="button" disabled={ocupado} onClick={() => responder("sim")}
            className="w-full h-14 rounded-xl bg-[#F0D030] text-black font-mono text-base font-bold active:bg-[#D4B820] disabled:opacity-60">
            {ocupado ? T.aAceitar : T.aceitar}
          </button>
        </>
        )
      ) : fase === "pedido" ? (
        <>
          <p className="font-mono text-[11px] text-[#888]">{T.semCliente}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" disabled={ocupado} onClick={() => responder("nao")}
              className="h-14 rounded-xl bg-transparent border border-white/15 text-white/80 font-mono text-base font-bold active:bg-white/10 disabled:opacity-60">
              {T.naoPosso}
            </button>
            <button type="button" disabled={ocupado} onClick={() => setFase("confirmar")}
              className="h-14 rounded-xl bg-[#F0D030] text-black font-mono text-base font-bold active:bg-[#D4B820] disabled:opacity-60">
              {T.simFaco}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3 pt-1">
          <div>
            <p className="text-sm font-bold text-white">{T.confirmarTitulo}</p>
            <p className="text-sm text-[#BDBDBD] leading-snug">{textoConfirmarFicar(p.de.nome)}</p>
          </div>
          <DeslizarConfirmar texto={T.deslizarFicar} cor="#22C55E" ocupado={ocupado} onConfirmar={() => responder("sim")} />
          <button type="button" disabled={ocupado} onClick={() => setFase("pedido")}
            className="w-full h-10 font-mono text-xs text-white/50 underline underline-offset-2">
            {T.voltar}
          </button>
        </div>
      )}
    </div>
  );
}
