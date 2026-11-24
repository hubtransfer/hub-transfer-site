// Os 12 ecrãs da «Ajuda» para o vídeo dos motoristas (24/11/2026).
// Componentes VERDADEIROS da app, com dados TODOS inventados: nomes, viagens,
// voos, horas e valores. Nenhuma operadora. Sem aviso do tempo (desligado no servidor).
// Não chama nenhum serviço: o cliente da ajuda é falso e o fetch está bloqueado.
// O ecrã escolhe-se pelo #id do endereço (ex.: ecras.html#05).

import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { HubViagem } from "@/lib/trips";
import type {
  ClienteAjuda, ColegaPossivel, MotoristaRef, PedidoAjuda, PedidoRecebido, ResumoViagemAjuda, ViagemParaAjuda,
} from "@/lib/ajuda/tipos";
import { AjudaClienteContexto } from "@/components/driver/ajuda/contexto";
import { textoPilula } from "@/lib/ajuda/textos";
import DriverTripCard from "@/components/driver/DriverTripCard";
import EcraPedirAjuda, { type Fase } from "@/components/driver/ajuda/EcraPedirAjuda";
import { CartaoRecebido } from "@/components/driver/ajuda/PedidosRecebidos";
import EcraPedidoPorLink from "@/components/driver/ajuda/EcraPedidoPorLink";

// Nada sai daqui para a rede
window.fetch = () => Promise.reject(new Error("sem rede (ecrãs do vídeo)"));
// O deslizar chama setPointerCapture; com eventos inventados não há ponteiro verdadeiro
Element.prototype.setPointerCapture = function () { /* */ };

const ANA: MotoristaRef = { id: "ana-alves", nome: "Ana Alves" };      // quem pede
const BRUNO: MotoristaRef = { id: "bruno-braga", nome: "Bruno Braga" }; // o colega
const CARLA: MotoristaRef = { id: "carla-cunha", nome: "Carla Cunha" }; // abre o link do grupo
const DIOGO: MotoristaRef = { id: "diogo-dias", nome: "Diogo Dias" };   // chega tarde

const COLEGAS: ColegaPossivel[] = [
  { ...BRUNO, categoria: "MPV" },
  { ...CARLA, categoria: "MPV" },
  { ...DIOGO, categoria: "Business" },
  { id: "eva-esteves", nome: "Eva Esteves", categoria: "MPV" },
];

const AGORA = Date.parse("2026-11-24T10:04:00Z");
const CRIADO = "2026-11-24T10:02:00.000Z";
const EXPIRA = "2026-11-24T10:17:00.000Z";
const RESERVA_ATE = "2026-11-24T10:12:00.000Z";

const RESUMO: ResumoViagemAjuda = {
  rotulo: "CHEGADA · MPV", data: "24/11/2026", hora: "14:30", voo: "XZ4821",
  origem: "Aeroporto de Lisboa", destino: "Hotel Jardim do Rio", valor: 35,
};
const VIAGEM: ViagemParaAjuda = { viagemRef: "video-101", categoria: "MPV", resumo: RESUMO };

// O cliente da ajuda, falso: responde logo, sem aviso do tempo
const FALSO: ClienteAjuda = {
  colegas: async (v) => ({ viagemRef: v.viagemRef, resumo: v.resumo, colegas: COLEGAS }),
  pedirAColega: async () => pedido({}),
  pedirAoGrupo: async () => pedido({ tipo: "grupo", para: undefined }),
  cancelar: async () => pedido({ estado: "cancelado" }),
  meusPedidos: async () => [],
  recebidos: async () => [],
  recebido: async () => ({ pedido: null }),
  responder: async () => ({ ok: true }),
  confirmar: async () => ({ ok: true }),
};

const viagemCartao = (eu: MotoristaRef, o: Partial<HubViagem>): HubViagem => ({
  id: "v", rowIndex: "v", client: "Sra. Helena Duarte", phone: "351900000000",
  origin: "Aeroporto de Lisboa", destination: "Hotel Jardim do Rio, Rua Inventada 12, Lisboa",
  pickupTime: "14:30", flight: "XZ4821", language: "PT", pax: "4", bags: "4", driver: eu.nome,
  platform: "", concluida: false, tipoViagem: "CHEGADA", categoriaNome: "MPV", comissao: 35,
  statusMotorista: "AGUARDANDO", date: "24/11/2026", ...o,
});

function pedido(o: Partial<PedidoAjuda>): PedidoAjuda {
  return { id: "ajVideo1", viagemRef: "video-101", tipo: "colega", de: ANA, para: BRUNO, motivo: "doente",
    estado: "a_espera", criadoEm: CRIADO, expiraEm: EXPIRA, ...o };
}
const recebido = (o: Partial<PedidoRecebido>): PedidoRecebido => ({
  id: "ajVideo1", tipo: "colega", de: ANA, viagem: RESUMO, estado: "a_espera", criadoEm: CRIADO, expiraEm: EXPIRA, ...o,
});
const recebidoGrupo = (o: Partial<PedidoRecebido> = {}): PedidoRecebido =>
  recebido({ id: "ajVideo2", tipo: "grupo", expiraEm: undefined, ...o });

const nada = () => {};
const ajudaPilula = { ...textoPilula(null, null), onAbrir: nada };

/** A lista das viagens de um motorista: cabeçalho, (pedido no topo) e os cartões. */
function Lista({ eu, topo, viagens }: { eu: MotoristaRef; topo?: React.ReactNode; viagens: HubViagem[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/95 border-b border-white/5 px-4 py-3">
        <p className="text-[#F0D030] font-bold text-base">{eu.nome}</p>
        <p className="font-mono text-[10px] text-white/40">Viagens de 24/11/2026</p>
      </header>
      <div className="px-4 py-3 space-y-2">
        {topo}
        {viagens.map((v, i) => (
          <DriverTripCard key={v.id} viagem={v} onDarBaixa={nada} onShowNameplate={nada} ajuda={ajudaPilula} isNext={i === 0} />
        ))}
      </div>
    </div>
  );
}

const VIAGENS_ANA = [
  viagemCartao(ANA, { id: "a1" }),
  viagemCartao(ANA, { id: "a2", pickupTime: "17:40", client: "Mr. Oliver Grant", tipoViagem: "RECOLHA", categoriaNome: "MPV",
    origin: "Hotel Colina Azul", destination: "Aeroporto de Lisboa", flight: "", comissao: 28 }),
  viagemCartao(ANA, { id: "a3", pickupTime: "20:15", client: "Família Moreau", flight: "XZ7310", comissao: 40 }),
];
const VIAGENS_BRUNO = [
  viagemCartao(BRUNO, { id: "b1", pickupTime: "12:10", client: "Sr. Ivo Neves", tipoViagem: "RECOLHA",
    origin: "Hotel Miradouro", destination: "Aeroporto de Lisboa", flight: "", comissao: 30 }),
  viagemCartao(BRUNO, { id: "b2", pickupTime: "19:00", client: "Sra. Clara Vidal", flight: "XZ5502", comissao: 35 }),
];
const VIAGENS_DIOGO = [viagemCartao(DIOGO, { id: "d1", pickupTime: "16:20", client: "Mr. Ken Ito", tipoViagem: "RECOLHA", categoriaNome: "Business",
  origin: "Hotel Miradouro", destination: "Aeroporto de Lisboa", flight: "", comissao: 45 })];
// Depois do «Sim, faço»: a viagem da Ana já está na lista do Bruno, com tudo
const VIAGENS_BRUNO_DEPOIS = [VIAGENS_BRUNO[0], viagemCartao(BRUNO, { id: "b3" }), VIAGENS_BRUNO[1]];

function Pedir(props: { fase?: Fase; colega?: boolean; motivo?: "doente" | "carro_avariado"; pedido?: PedidoAjuda }) {
  return (
    <EcraPedirAjuda embutido viagem={VIAGEM} eu={ANA} pedido={props.pedido ?? null} agora={AGORA}
      onFechar={nada} faseInicial={props.fase} motivoInicial={props.motivo ?? null} />
  );
}

function Recebido(props: { eu: MotoristaRef; p: PedidoRecebido; desfecho?: "feito" | "ja_ficou"; viagens?: HubViagem[] }) {
  return (
    <Lista eu={props.eu} viagens={props.viagens ?? VIAGENS_BRUNO} topo={
      <CartaoRecebido p={props.p} eu={props.eu} agora={AGORA} desfecho={props.desfecho}
        onDesfecho={nada} onDispensar={nada} onNaoPosso={nada} />
    } />
  );
}

/** Arrasta o polegar do deslizar até ~2/3, sem largar (para o ecrã 04). */
function ArrastarAMeio() {
  useEffect(() => {
    const t = setTimeout(() => {
      const b = document.querySelector<HTMLButtonElement>("button.cursor-grab");
      if (!b) return;
      const r = b.getBoundingClientRect();
      const x0 = r.left + r.width / 2, y = r.top + r.height / 2;
      const ev = (tipo: string, x: number) =>
        b.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, clientX: x, clientY: y }));
      ev("pointerdown", x0);
      setTimeout(() => ev("pointermove", x0 + 190), 60);
    }, 200);
    return () => clearTimeout(t);
  }, []);
  return null;
}

const colegaBruno = COLEGAS[0];

export const ECRAS: Record<string, () => React.ReactNode> = {
  "01": () => <Lista eu={ANA} viagens={VIAGENS_ANA} />,
  "02": () => <Pedir fase={{ t: "lista" }} />,
  "03": () => <Pedir fase={{ t: "confirmar", colega: colegaBruno }} motivo="doente" />,
  "04": () => <><Pedir fase={{ t: "confirmar", colega: colegaBruno }} motivo="doente" /><ArrastarAMeio /></>,
  "05": () => <Pedir pedido={pedido({})} />,
  "06": () => <Recebido eu={BRUNO} p={recebido({})} />,
  "07": () => <EcraPedidoPorLink embutido pedidoId="ajVideo1" passo="pedido" eu={BRUNO} agora={AGORA} onFechar={nada} inicial={recebido({})} />,
  "08": () => <Recebido eu={BRUNO} p={recebido({})} desfecho="feito" viagens={VIAGENS_BRUNO_DEPOIS} />,
  "09": () => <Pedir fase={{ t: "confirmarGrupo" }} motivo="carro_avariado" />,
  "10": () => <EcraPedidoPorLink embutido pedidoId="ajVideo2" passo="pedido" eu={CARLA} agora={AGORA} onFechar={nada} inicial={recebidoGrupo()} />,
  "11": () => (
    <EcraPedidoPorLink embutido pedidoId="ajVideo2" passo="confirmar" eu={CARLA} agora={AGORA} onFechar={nada}
      inicial={recebidoGrupo({ estado: "reservada", reservadaParaMim: true, reservaExpiraEm: RESERVA_ATE })} />
  ),
  "12": () => <Recebido eu={DIOGO} p={recebidoGrupo({ estado: "aceite", ficouCom: CARLA })} desfecho="ja_ficou" viagens={VIAGENS_DIOGO} />,
};

function App() {
  const id = (location.hash || "#01").slice(1);
  const ecra = ECRAS[id];
  return (
    <AjudaClienteContexto.Provider value={FALSO}>
      <div className="relative w-[390px] h-[844px] overflow-hidden bg-black text-white">
        {ecra ? ecra() : <p className="p-6 font-mono text-sm">Ecrã {id} não existe.</p>}
      </div>
    </AjudaClienteContexto.Provider>
  );
}

createRoot(document.getElementById("raiz")!).render(<App />);
