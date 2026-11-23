"use client";

// Página de demonstração da «Ajuda» (só em desenvolvimento): cada ecrã e cada
// estado lado a lado, numa moldura de telemóvel. TUDO inventado: nomes, viagens,
// horas e valores. Não chama o HUB-Central nem nenhum outro serviço.

import React, { useEffect, useState } from "react";
import type { HubViagem } from "@/lib/trips";
import type { MotoristaRef, PedidoAjuda, PedidoRecebido } from "@/lib/ajuda/tipos";
import type { ViagemParaAjuda } from "@/lib/ajuda/cliente";
import { simular, RESUMOS_INVENTADOS } from "@/lib/ajuda/simulado";
import { textoPilula } from "@/lib/ajuda/textos";
import DriverTripCard from "@/components/driver/DriverTripCard";
import EcraPedirAjuda, { type Fase } from "./EcraPedirAjuda";
import { CartaoRecebido } from "./PedidosRecebidos";

const EU: MotoristaRef = { id: "eu-demo", nome: "Joaquim Prates" };
const AGORA = Date.parse("2026-11-24T10:04:00Z");
const CRIADO = "2026-11-24T10:00:00.000Z";
const EXPIRA = "2026-11-24T10:15:00.000Z";
const RUI: MotoristaRef = { id: "rui-costa", nome: "Rui Costa" };
const ANA: MotoristaRef = { id: "ana-ferreira", nome: "Ana Ferreira" };
const PAULO: MotoristaRef = { id: "paulo-nunes", nome: "Paulo Nunes" };

const RESUMO = RESUMOS_INVENTADOS["demo-101"];
const V = (ref: string): ViagemParaAjuda => ({ viagemRef: ref, categoria: "MPV", resumo: RESUMO });

const viagemCartao = (o: Partial<HubViagem>): HubViagem => ({
  id: "demo", rowIndex: "demo", client: "Sra. Helena Duarte", phone: "351900000000",
  origin: "Aeroporto de Lisboa", destination: "Hotel Jardim do Rio, Rua Inventada 12, Lisboa",
  pickupTime: "14:30", flight: "", language: "PT", pax: "4", bags: "4", driver: EU.nome,
  platform: "", concluida: false, tipoViagem: "CHEGADA", categoriaNome: "MPV", comissao: 35,
  statusMotorista: "AGUARDANDO", date: "24/11/2026", ...o,
});

const pedido = (o: Partial<PedidoAjuda>): PedidoAjuda => ({
  id: "aj-demo", viagemRef: "demo-101", tipo: "colega", de: EU, para: RUI,
  estado: "a_espera", criadoEm: CRIADO, expiraEm: EXPIRA, ...o,
});

const recebido = (o: Partial<PedidoRecebido>): PedidoRecebido => ({
  id: "rc-demo", tipo: "colega", de: PAULO, viagem: RESUMOS_INVENTADOS["demo-102"],
  estado: "a_espera", criadoEm: "2026-11-24T10:01:00.000Z", expiraEm: "2026-11-24T10:16:00.000Z", ...o,
});

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
        <DriverTripCard viagem={viagemCartao({ id: "c2", pickupTime: "16:10", client: "Mr. Oliver Grant", tipoViagem: "RECOLHA", categoriaNome: "Sedan", origin: "Hotel Colina Azul", destination: "Aeroporto de Lisboa", comissao: 28 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({}), "a_espera")} />
        <DriverTripCard viagem={viagemCartao({ id: "c3", pickupTime: "18:45", client: "Família Moreau", categoriaNome: "MPV", comissao: 40 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({}), "sem_resposta")} />
        <DriverTripCard viagem={viagemCartao({ id: "c4", pickupTime: "20:00", client: "Sr. Tomás Abreu", tipoViagem: "TRANSFER", categoriaNome: "Business", origin: "Cascais", destination: "Sintra", comissao: 0 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({ tipo: "grupo", para: undefined }), "a_espera")} />
        <DriverTripCard viagem={viagemCartao({ id: "c5", pickupTime: "21:30", client: "Sra. Clara Vidal", comissao: 35 })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(pedido({ estado: "aceite", ficouCom: ANA }), "aceite")} />
        <DriverTripCard viagem={viagemCartao({ id: "c6", pickupTime: "08:00", client: "Mr. Ken Ito", concluida: true, status: "CONCLUIDA", statusMotorista: "FINALIZADO" })}
          onDarBaixa={nada} onShowNameplate={nada} ajuda={p(null, null)} />
      </div>
    </div>
  );
}

function Ecra(props: { refViagem: string; pedido?: PedidoAjuda | null; fase?: Fase }) {
  return (
    <EcraPedirAjuda embutido viagem={V(props.refViagem)} eu={EU} pedido={props.pedido ?? null}
      agora={AGORA} onFechar={nada} faseInicial={props.fase} />
  );
}

function Recebido(props: { p: PedidoRecebido; fase?: "pedido" | "confirmar"; desfecho?: "feito" | "ja_ficou" }) {
  return (
    <ListaCartoes topo={
      <CartaoRecebido p={props.p} eu={EU} agora={AGORA} desfecho={props.desfecho}
        faseInicial={props.fase} onDesfecho={nada} onDispensar={nada} onNaoPosso={nada} />
    } />
  );
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

  return (
    <SoUm.Provider value={so}>
    <main className={so ? "min-h-screen bg-black text-white" : "min-h-screen bg-[#0A0A0A] text-white p-6"}>
      {!so && (
        <>
          <h1 className="text-xl font-bold text-[#F0D030] mb-1">Ajuda entre motoristas — todos os ecrãs</h1>
          <p className="font-mono text-xs text-white/50 mb-6">Demonstração com dados inventados. Só existe em desenvolvimento.</p>
        </>
      )}
      <div className="flex flex-wrap gap-8">
        <Moldura id="01-cartoes" titulo="01 · Cartões: «Ajuda», à espera, sem resposta, grupo, passou; acabada sem botão">
          <ListaCartoes />
        </Moldura>
        <Moldura id="02-lista" titulo="02 · Pedir ajuda: colegas possíveis + «Pedir ao grupo»">
          <Ecra refViagem="demo-101" />
        </Moldura>
        <Moldura id="03-sem-colegas" titulo="03 · Pedir ajuda: nenhum colega possível">
          <Ecra refViagem="demo-sem-colegas" />
        </Moldura>
        <Moldura id="04-erro" titulo="04 · Pedir ajuda: sem ligação">
          <Ecra refViagem="demo-erro" />
        </Moldura>
        <Moldura id="05-confirmar" titulo="05 · Confirmar a deslizar (colega)">
          <Ecra refViagem="demo-101" fase={{ t: "confirmar", colega: { ...ANA, categoria: "MPV", livreAte: "20:00" } }} />
        </Moldura>
        <Moldura id="06-confirmar-grupo" titulo="06 · Confirmar a deslizar (grupo)">
          <Ecra refViagem="demo-101" fase={{ t: "confirmarGrupo" }} />
        </Moldura>
        <Moldura id="07-espera" titulo="07 · À espera do colega, com «Cancelar pedido»">
          <Ecra refViagem="demo-101" pedido={pedido({})} />
        </Moldura>
        <Moldura id="08-espera-grupo" titulo="08 · À espera do grupo">
          <Ecra refViagem="demo-101" pedido={pedido({ tipo: "grupo", para: undefined, expiraEm: undefined })} />
        </Moldura>
        <Moldura id="09-sem-resposta" titulo="09 · 15 minutos sem resposta → «Pedir a outro colega»">
          <Ecra refViagem="demo-101" pedido={pedido({ expiraEm: "2026-11-24T10:03:00.000Z" })} />
        </Moldura>
        <Moldura id="10-aceite" titulo="10 · Aceite: a viagem sai da lista">
          <Ecra refViagem="demo-101" pedido={pedido({ estado: "aceite", ficouCom: RUI })} />
        </Moldura>
        <Moldura id="11-recusado" titulo="11 · Recusado: volta à lista dos colegas">
          <Ecra refViagem="demo-recusado" pedido={pedido({ viagemRef: "demo-recusado", estado: "recusado" })} />
        </Moldura>
        <Moldura id="12-recebido" titulo="12 · Quem recebe: «Sim, faço» / «Não posso»">
          <Recebido p={recebido({})} />
        </Moldura>
        <Moldura id="13-recebido-confirmar" titulo="13 · Quem recebe: confirmar antes de ficar">
          <Recebido p={recebido({})} fase="confirmar" />
        </Moldura>
        <Moldura id="14-recebido-feito" titulo="14 · Quem recebe: a viagem é sua">
          <Recebido p={recebido({})} desfecho="feito" />
        </Moldura>
        <Moldura id="15-grupo" titulo="15 · Pedido do grupo: «Fico eu»">
          <Recebido p={recebido({ tipo: "grupo", de: RUI, viagem: RESUMOS_INVENTADOS["demo-103"], expiraEm: undefined })} />
        </Moldura>
        <Moldura id="16-grupo-ja-ficou" titulo="16 · Pedido do grupo: outro colega foi mais rápido">
          <Recebido p={recebido({ tipo: "grupo", de: RUI, viagem: RESUMOS_INVENTADOS["demo-103"], ficouCom: ANA })} desfecho="ja_ficou" />
        </Moldura>
      </div>
    </main>
    </SoUm.Provider>
  );
}
