"use client";

// Página de demonstração da «Ajuda» (só em desenvolvimento): cada ecrã e cada
// estado lado a lado, numa moldura de telemóvel. TUDO inventado: nomes, viagens,
// voos, horas e valores. Não chama o HUB-Central nem nenhum outro serviço.
// ?ecra=<id> mostra um só ecrã do tamanho do telemóvel (para as imagens).

import React, { useEffect, useState } from "react";
import type { HubViagem } from "@/lib/trips";
import type { MotivoAjuda, MotoristaRef, PedidoAjuda, PedidoRecebido } from "@/lib/ajuda/tipos";
import type { ViagemParaAjuda } from "@/lib/ajuda/tipos";
import { simular, RESUMOS_INVENTADOS, clienteSimuladoPara } from "@/lib/ajuda/simulado";
import { AjudaClienteContexto } from "./contexto";
import { textoPilula } from "@/lib/ajuda/textos";
import DriverTripCard from "@/components/driver/DriverTripCard";
import EcraPedirAjuda, { type Fase } from "./EcraPedirAjuda";
import { CartaoRecebido, type Desfecho } from "./PedidosRecebidos";
import EcraPedidoPorLink from "./EcraPedidoPorLink";

const EU: MotoristaRef = { id: "eu-demo", nome: "Joaquim Prates" };
const AGORA = Date.parse("2026-11-24T10:04:00Z");
const CRIADO = "2026-11-24T10:00:00.000Z";
const EXPIRA = "2026-11-24T10:15:00.000Z";
const RESERVA_ATE = "2026-11-24T10:11:00.000Z"; // aceitou às 10:01 → 7 min para confirmar
// Os ecrãs da demo falam com o simulado (dados inventados), nunca com o HUB-Central
const SIMULADO = clienteSimuladoPara(EU);
const RUI: MotoristaRef = { id: "rui-costa", nome: "Rui Costa" };
const ANA: MotoristaRef = { id: "ana-ferreira", nome: "Ana Ferreira" };
const PAULO: MotoristaRef = { id: "paulo-nunes", nome: "Paulo Nunes" };

const V = (ref: string, resumo = "demo-101", categoria = "MPV"): ViagemParaAjuda =>
  ({ viagemRef: ref, categoria, resumo: RESUMOS_INVENTADOS[resumo] });

const viagemCartao = (o: Partial<HubViagem>): HubViagem => ({
  id: "demo", rowIndex: "demo", client: "Sra. Helena Duarte", phone: "351900000000",
  origin: "Aeroporto de Lisboa", destination: "Hotel Jardim do Rio, Rua Inventada 12, Lisboa",
  pickupTime: "14:30", flight: "XZ4821", language: "PT", pax: "4", bags: "4", driver: EU.nome,
  platform: "", concluida: false, tipoViagem: "CHEGADA", categoriaNome: "MPV", comissao: 35,
  statusMotorista: "AGUARDANDO", date: "24/11/2026", ...o,
});

const pedido = (o: Partial<PedidoAjuda>): PedidoAjuda => ({
  id: "aj1demo", viagemRef: "demo-101", tipo: "colega", de: EU, para: RUI, motivo: "doente",
  estado: "a_espera", criadoEm: CRIADO, expiraEm: EXPIRA, ...o,
});
const pedidoGrupo = (o: Partial<PedidoAjuda> = {}): PedidoAjuda =>
  pedido({ tipo: "grupo", para: undefined, expiraEm: undefined, ...o });

const recebido = (o: Partial<PedidoRecebido>): PedidoRecebido => ({
  id: "aj2demo", tipo: "colega", de: PAULO, viagem: RESUMOS_INVENTADOS["demo-102"],
  estado: "a_espera", criadoEm: "2026-11-24T10:01:00.000Z", expiraEm: "2026-11-24T10:16:00.000Z", ...o,
});
const recebidoGrupo = (o: Partial<PedidoRecebido> = {}): PedidoRecebido =>
  recebido({ id: "aj3demo", tipo: "grupo", de: RUI, viagem: RESUMOS_INVENTADOS["demo-103"], expiraEm: undefined, ...o });

/** ?ecra=07-espera → só esse ecrã, do tamanho do telemóvel (para as imagens). */
const SoUm = React.createContext<string>("");

function Moldura({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  const so = React.useContext(SoUm);
  if (so) {
    return so === id ? (
      <div className="fixed left-0 top-0 w-[390px] overflow-hidden bg-black" style={{ height: typeof window !== "undefined" && /[?&]alto=1/.test(window.location.search) ? 2000 : 780 }}>
        <style>{"nextjs-portal{display:none!important}"}</style>
        {children}
      </div>
    ) : null;
  }
  return (
    <figure id={id} data-ecra={id} className="flex-shrink-0">
      <figcaption className="font-mono text-xs text-[#F0D030] mb-2 max-w-[390px]">{titulo}</figcaption>
      <div className="relative w-[390px] h-[780px] rounded-[2rem] border border-[#333] overflow-hidden bg-black">
        {children}
      </div>
    </figure>
  );
}

const nada = () => {};

/** Lista de viagens com o cartão do motorista e a pílula «Ajuda» em cada estado. */
function ListaCartoes({ topo }: { topo?: React.ReactNode }) {
  const p = (pd: PedidoAjuda | null, est: string | null) => ({ ...textoPilula(pd, est), onAbrir: nada });
  return (
    <div className="absolute inset-0 overflow-y-auto bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/95 border-b border-white/5 px-4 py-3">
        <p className="text-[#F0D030] font-bold text-base">{EU.nome}</p>
        <p className="font-mono text-[10px] text-white/40">Viagens de 24/11/2026 · dados inventados</p>
      </header>
      <div className="px-4 py-3 space-y-2">
        {topo}
        <DriverTripCard viagem={viagemCartao({ id: "c1" })} onDarBaixa={nada} onShowNameplate={nada} ajuda={p(null, null)} isNext />
        <DriverTripCard viagem={viagemCartao({ id: "c2", pickupTime: "16:10", client: "Mr. Oliver Grant", tipoViagem: "RECOLHA", categoriaNome: "Sedan", origin: "Hotel Colina Azul", destination: "Aeroporto de Lisboa", flight: "", comissao: 28 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({}), "a_espera")} />
        <DriverTripCard viagem={viagemCartao({ id: "c3", pickupTime: "18:45", client: "Família Moreau", categoriaNome: "MPV", comissao: 40 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({}), "sem_resposta")} />
        <DriverTripCard viagem={viagemCartao({ id: "c4", pickupTime: "20:00", client: "Sr. Tomás Abreu", tipoViagem: "TRANSFER", categoriaNome: "Business", origin: "Cascais", destination: "Sintra", flight: "", comissao: 0 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedidoGrupo(), "a_espera")} />
        <DriverTripCard viagem={viagemCartao({ id: "c5", pickupTime: "21:00", client: "Sr. Ivo Neves", categoriaNome: "Sedan", flight: "XZ7310", comissao: 32 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedidoGrupo({ estado: "reservada" }), "reservada")} />
        <DriverTripCard viagem={viagemCartao({ id: "c6", pickupTime: "21:30", client: "Sra. Clara Vidal", comissao: 35 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({ estado: "aceite", ficouCom: ANA }), "aceite")} />
        <DriverTripCard viagem={viagemCartao({ id: "c7", pickupTime: "08:00", client: "Mr. Ken Ito", concluida: true, status: "CONCLUIDA", statusMotorista: "FINALIZADO" })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(null, null)} />
      </div>
    </div>
  );
}

function Ecra(props: { v: ViagemParaAjuda; pedido?: PedidoAjuda | null; fase?: Fase; motivo?: MotivoAjuda }) {
  return (
    <EcraPedirAjuda embutido viagem={props.v} eu={EU} pedido={props.pedido ?? null}
      agora={AGORA} onFechar={nada} faseInicial={props.fase} motivoInicial={props.motivo ?? null} />
  );
}

function Recebido(props: { p: PedidoRecebido; fase?: "pedido" | "confirmar"; desfecho?: Desfecho; aviso?: string }) {
  return (
    <ListaCartoes topo={
      <CartaoRecebido p={props.p} eu={EU} agora={AGORA} desfecho={props.desfecho} aviso={props.aviso}
        faseInicial={props.fase} onDesfecho={nada} onDispensar={nada} onNaoPosso={nada} />
    } />
  );
}

function PorLink(props: { p: PedidoRecebido | null; passo: "pedido" | "confirmar" }) {
  return <EcraPedidoPorLink embutido pedidoId={props.p?.id ?? "ajNaoExiste"} passo={props.passo} eu={EU} agora={AGORA} onFechar={nada} inicial={props.p} />;
}

export default function AjudaDemo() {
  const [pronto, setPronto] = useState(false);
  const [so, setSo] = useState("");
  useEffect(() => {
    simular.limpar();
    simular.registarRecusa("demo-recusado", EU.id, RUI.id);
    try { setSo(new URLSearchParams(window.location.search).get("ecra") || ""); } catch { /* */ }
    setPronto(true);
  }, []);
  if (!pronto) return null;

  const colegaAna = { ...ANA, categoria: "MPV" as const };
  const reservadaMinha = recebidoGrupo({ estado: "reservada", reservadaParaMim: true, reservaExpiraEm: RESERVA_ATE });

  return (
    <AjudaClienteContexto.Provider value={SIMULADO}>
    <SoUm.Provider value={so}>
    <main className={so ? "min-h-screen bg-black text-white" : "min-h-screen bg-[#0A0A0A] text-white p-6"}>
      {!so && (
        <>
          <h1 className="text-xl font-bold text-[#F0D030] mb-1">Ajuda entre motoristas — todos os ecrãs</h1>
          <p className="font-mono text-xs text-white/50 mb-6">Demonstração com dados inventados. Só existe em desenvolvimento.</p>
        </>
      )}
      <div className="flex flex-wrap gap-8">
        {/* ── O cartão ── */}
        <Moldura id="01-cartoes" titulo="01 · Cartões: «Ajuda», à espera, sem resposta, grupo, a confirmar, passou; acabada sem botão">
          <ListaCartoes />
        </Moldura>

        {/* ── Quem pede ── */}
        <Moldura id="02-escolha" titulo="02 · Pedir ajuda: as duas escolhas no topo">
          <Ecra v={V("demo-101")} />
        </Moldura>
        <Moldura id="03-lista" titulo="03 · Pedir a um colega: só o nome e a categoria (viagem Sedan: Sedan, MPV, Business)">
          <Ecra v={V("demo-103", "demo-103", "Sedan")} fase={{ t: "lista" }} />
        </Moldura>
        <Moldura id="04-sem-colegas" titulo="04 · Nenhum colega pode: só «Pedir ao grupo»">
          <Ecra v={V("demo-sem-colegas")} fase={{ t: "lista" }} />
        </Moldura>
        <Moldura id="05-erro" titulo="05 · Sem ligação">
          <Ecra v={V("demo-erro")} fase={{ t: "lista" }} />
        </Moldura>
        <Moldura id="06-motivo" titulo="06 · O motivo: falta escolher (não desliza)">
          <Ecra v={V("demo-101")} fase={{ t: "confirmar", colega: colegaAna }} />
        </Moldura>
        <Moldura id="07-motivo-escolhido" titulo="07 · Motivo escolhido: «Deslize para pedir a …»">
          <Ecra v={V("demo-101")} fase={{ t: "confirmar", colega: colegaAna }} motivo="doente" />
        </Moldura>
        <Moldura id="08-motivo-grupo" titulo="08 · Pedir ao grupo: motivo e deslizar">
          <Ecra v={V("demo-101")} fase={{ t: "confirmarGrupo" }} motivo="carro_avariado" />
        </Moldura>
        <Moldura id="09-espera" titulo="09 · À espera do colega, com «Cancelar pedido»">
          <Ecra v={V("demo-101")} pedido={pedido({})} />
        </Moldura>
        <Moldura id="10-espera-grupo" titulo="10 · À espera do grupo">
          <Ecra v={V("demo-101")} pedido={pedidoGrupo()} />
        </Moldura>
        <Moldura id="11-grupo-a-confirmar" titulo="11 · Grupo: um colega aceitou e está a confirmar">
          <Ecra v={V("demo-101")} pedido={pedidoGrupo({ estado: "reservada", reservadaPara: ANA, reservaExpiraEm: RESERVA_ATE })} />
        </Moldura>
        <Moldura id="12-sem-resposta" titulo="12 · 15 minutos sem resposta → «Pedir a outro colega»">
          <Ecra v={V("demo-101")} pedido={pedido({ expiraEm: "2026-11-24T10:03:00.000Z" })} />
        </Moldura>
        <Moldura id="13-aceite" titulo="13 · Aceite: a viagem sai da lista">
          <Ecra v={V("demo-101")} pedido={pedido({ estado: "aceite", ficouCom: RUI })} />
        </Moldura>
        <Moldura id="14-recusado" titulo="14 · Recusado: volta à lista dos colegas">
          <Ecra v={V("demo-recusado")} pedido={pedido({ viagemRef: "demo-recusado", estado: "recusado" })} />
        </Moldura>

        {/* ── Quem recebe: pedido a um colega ── */}
        <Moldura id="15-recebido" titulo="15 · Pedido a um colega: «Sim, faço» / «Não posso»">
          <Recebido p={recebido({})} />
        </Moldura>
        <Moldura id="16-recebido-confirmar" titulo="16 · «Sim, faço»: confirmar a deslizar">
          <Recebido p={recebido({})} fase="confirmar" />
        </Moldura>
        <Moldura id="17-recebido-feito" titulo="17 · A viagem é sua">
          <Recebido p={recebido({})} desfecho="feito" />
        </Moldura>

        {/* ── Quem recebe: pedido ao grupo ── */}
        <Moldura id="18-grupo" titulo="18 · Pedido ao grupo: tudo para decidir e só «Aceitar»">
          <Recebido p={recebidoGrupo()} />
        </Moldura>
        <Moldura id="19-reservada" titulo="19 · Reservada para si: confirme na mensagem que recebeu">
          <Recebido p={reservadaMinha} />
        </Moldura>
        <Moldura id="20-prazo-acabou" titulo="20 · O prazo acabou: o pedido voltou ao grupo">
          <Recebido p={recebidoGrupo()} aviso="O prazo acabou: o pedido voltou ao grupo." />
        </Moldura>
        <Moldura id="21-outro-a-confirmar" titulo="21 · Chegou depois: outro colega está a confirmar">
          <Recebido p={recebidoGrupo()} desfecho="outro_a_confirmar" />
        </Moldura>
        <Moldura id="22-ja-ficou" titulo="22 · Chegou tarde: já ficou com um colega">
          <Recebido p={recebidoGrupo({ estado: "aceite", ficouCom: ANA })} />
        </Moldura>

        {/* ── Entradas pelo link do WhatsApp ── */}
        <Moldura id="23-link-grupo" titulo="23 · Link do grupo (?ajuda=…): abre o pedido com «Aceitar»">
          <PorLink p={recebidoGrupo()} passo="pedido" />
        </Moldura>
        <Moldura id="24-segunda" titulo="24 · Link privado (?ajuda=…&passo=confirmar): segunda confirmação">
          <PorLink p={reservadaMinha} passo="confirmar" />
        </Moldura>
        <Moldura id="25-segunda-feito" titulo="25 · Segunda confirmação feita: a viagem é sua">
          <PorLink p={recebidoGrupo({ estado: "aceite", ficouCom: EU })} passo="confirmar" />
        </Moldura>
        <Moldura id="26-segunda-prazo" titulo="26 · Segunda confirmação tarde: o prazo acabou">
          <PorLink p={recebidoGrupo()} passo="confirmar" />
        </Moldura>
        <Moldura id="27-link-invalido" titulo="27 · Link de um pedido que já não existe">
          <PorLink p={null} passo="pedido" />
        </Moldura>
      </div>
    </main>
    </SoUm.Provider>
    </AjudaClienteContexto.Provider>
  );
}
