"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDriverStore } from "@/hooks/useDriverStore";
import DriverTripCard from "@/components/driver/DriverTripCard";
import DriverNameplate from "@/components/driver/DriverNameplate";
import NoShowModal from "@/components/driver/NoShowModal";
import { SkeletonList } from "@/components/trips/SkeletonCard";
import { getSession, clearSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/auth";
import { resolverIdentidade, apagarDadosMotorista, SessaoRecusadaErro, EVENTO_SESSAO_RECUSADA } from "@/lib/motoristaSessao";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";
import {
  HUB_CENTRAL_URL,
  detectTipo,
  calcDriverPrice,
  cleanHora,
  todayStr,
  dateToISO,
  isNoShowViagem,
  isCanceladaViagem,
  fetchMotoristas,
  chaveMotorista,
} from "@/lib/trips";
import type { HubViagem, Driver } from "@/lib/trips";
import { estadoEfectivo } from "@/lib/ajuda/regras";
import { textoPilula } from "@/lib/ajuda/textos";
import { useAjuda } from "@/components/driver/ajuda/useAjuda";
import EcraPedirAjuda from "@/components/driver/ajuda/EcraPedirAjuda";
import PedidosRecebidos from "@/components/driver/ajuda/PedidosRecebidos";
import { viagemParaAjuda, viagemAceitaAjuda, refDaViagem } from "@/components/driver/ajuda/viagemParaAjuda";
import EcraPedidoPorLink from "@/components/driver/ajuda/EcraPedidoPorLink";
import { lerLinkDoPedido, type PassoLink } from "@/lib/ajuda/regras";

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function DriverTripsPage() {
  const store = useDriverStore();
  const router = useRouter();

  /* ── Quem está na app: só o motorista do crachá deste login ──
     Nada guardado no telemóvel decide quem é o motorista e não há forma
     de escolher outro nome (caso de 21/11). Se o nome do login não está na
     lista oficial: «Peça ajuda à gestão». Crachá fora do prazo: login. */
  const [sessao, setSessao] = useState<AuthSession | null | undefined>(undefined); // undefined = ainda não lida
  const [agora, setAgora] = useState(0);
  const [officialDrivers, setOfficialDrivers] = useState<Driver[] | null>(null);
  const [driversFailed, setDriversFailed] = useState(false);
  const [recusada, setRecusada] = useState(false); // o HUB-Central recusou o crachá

  const [changePwdOpen, setChangePwdOpen] = useState(false);

  /* ── Nameplate ── */
  const [nameplateOpen, setNameplateOpen] = useState(false);
  const [nameplateName, setNameplateName] = useState("");
  const [nameplateDest, setNameplateDest] = useState("");

  /* ── Anexar provas a um no-show já marcado (linhas compactas) ── */
  const [proofTrip, setProofTrip] = useState<HubViagem | null>(null);

  /* ── Ler a sessão agora e de 30 em 30 s (e ao voltar à app): o prazo conta ── */
  const lerSessao = useCallback(() => {
    setSessao(getSession());
    setAgora(Date.now());
  }, []);
  useEffect(() => {
    lerSessao();
    const t = setInterval(lerSessao, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") lerSessao(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [lerSessao]);

  const identidade = useMemo(
    () => (sessao === undefined ? null : resolverIdentidade(sessao, officialDrivers, driversFailed, agora)),
    [sessao, officialDrivers, driversFailed, agora],
  );
  const estado = identidade?.estado ?? null;
  const nomeConfirmado = identidade?.estado === "ok" ? identidade.nome : "";

  /* ── Lista oficial de motoristas (só para confirmar o nome do login) ── */
  const loadOfficialDrivers = useCallback(async () => {
    setDriversFailed(false);
    try {
      setOfficialDrivers(await fetchMotoristas());
    } catch (e) {
      if (e instanceof SessaoRecusadaErro) setRecusada(true);
      else setDriversFailed(true);
    }
  }, []);
  const temMotorista = estado !== null && estado !== "login";
  useEffect(() => {
    if (temMotorista && !officialDrivers) loadOfficialDrivers();
  }, [temMotorista]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Um botão (estados da viagem, no-show, dar baixa, mensagem, senha) teve a sessão recusada ── */
  useEffect(() => {
    const recusou = () => setRecusada(true);
    window.addEventListener(EVENTO_SESSAO_RECUSADA, recusou);
    return () => window.removeEventListener(EVENTO_SESSAO_RECUSADA, recusou);
  }, []);

  /* ── O HUB-Central recusou o crachá (senha mudou, inactivo…): apaga a sessão e volta à senha ── */
  useEffect(() => {
    if (!recusada && !store.sessaoRecusada) return;
    store.setDriverName("");
    clearSession();
    router.replace("/login");
  }, [recusada, store.sessaoRecusada]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sem motorista válido: apaga tudo e volta ao login ── */
  useEffect(() => {
    if (identidade?.estado !== "login") return;
    // Outro papel (ex.: o gestor) não perde a sessão dele; só sai desta página.
    if (identidade.motivo === "nao_e_motorista") {
      try { apagarDadosMotorista(localStorage); } catch { /* */ }
    } else {
      clearSession();
    }
    router.replace("/login");
  }, [identidade, router]);

  /* ── O store só conhece o motorista confirmado; sem ele, pára e esvazia ── */
  useEffect(() => {
    if (store.driverName !== nomeConfirmado) store.setDriverName(nomeConfirmado);
  }, [nomeConfirmado]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-sync silencioso: intervalo gerido pelo useDriverStore com ping lastChange ── */

  /* ── Logout: o clearSession apaga a sessão, o nome e as viagens guardadas ── */
  const handleLogout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  /* ── Nameplate ── */
  const openNameplate = useCallback((name: string, destination?: string) => {
    setNameplateName(name);
    setNameplateDest(destination || "");
    setNameplateOpen(true);
  }, []);
  const closeNameplate = useCallback(() => {
    setNameplateOpen(false);
    setNameplateName("");
    setNameplateDest("");
  }, []);

  /* ── Date navigation ── */
  const shiftDate = useCallback(
    (days: number) => {
      const current = store.selectedDate
        ? new Date(dateToISO(store.selectedDate))
        : new Date();
      current.setDate(current.getDate() + days);
      const dd = String(current.getDate()).padStart(2, "0");
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const yyyy = current.getFullYear();
      store.loadDate(`${dd}/${mm}/${yyyy}`);
    },
    [store],
  );

  /* ── Driver's trips (already filtered by useDriverStore) ── */
  const driverTrips = store.sortedViagens;

  /* ── Stats ── */
  const stats = useMemo(() => {
    let chegadas = 0;
    let recolhas = 0;
    let totalPay = 0;
    let done = 0;
    // Cancelada não conta: nem no total nem no valor do dia (o no-show fica como está)
    const contam = driverTrips.filter((v) => !isCanceladaViagem(v));
    for (const v of contam) {
      const tipo = detectTipo(v.origin || "", v.flight || "", v.type, v.tipoViagem);
      if (tipo === "CHEGADA") chegadas++;
      else recolhas++;
      totalPay += calcDriverPrice(v);
      if (v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU") done++;
    }
    return { total: contam.length, chegadas, recolhas, totalPay, done };
  }, [driverTrips]);

  /* ── Ajuda entre motoristas ──
     Só aparece se o HUB-Central disser que está ligada para ESTE motorista
     (em TESTE só os nomes do teste; LIGADA todos). Desligada, fora do teste,
     sem resposta ou recusada → nem o botão nem os pedidos aparecem.
     Quem pede/responde é o do crachá; `eu` serve só para comparar nomes. */
  const eu = useMemo(
    () => (nomeConfirmado ? { id: chaveMotorista(nomeConfirmado), nome: nomeConfirmado } : null),
    [nomeConfirmado],
  );
  const ajudaDados = useAjuda(!!eu && estado === "ok" && !recusada && !store.sessaoRecusada);
  const ajudaLigada = !!eu && ajudaDados.ligada;
  const [ajudaViagem, setAjudaViagem] = useState<HubViagem | null>(null);
  const ajudaResumo = useMemo(() => (ajudaViagem ? viagemParaAjuda(ajudaViagem) : null), [ajudaViagem]);
  // Viagens que passaram para um colega: saem já da lista (o getViagens confirma no próximo sync)
  const [passaram, setPassaram] = useState<Set<string>>(new Set());
  const ajudaDoCartao = useCallback((v: HubViagem) => {
    if (!ajudaLigada || !viagemAceitaAjuda(v)) return undefined;
    const p = ajudaDados.meus[refDaViagem(v)] ?? null;
    const pil = textoPilula(p, p ? estadoEfectivo(p, ajudaDados.agora) : null);
    return { ...pil, onAbrir: () => setAjudaViagem(v) };
  }, [ajudaLigada, ajudaDados.meus, ajudaDados.agora]);

  // Entrada pelo link do WhatsApp: ?ajuda=<id do pedido>[&passo=confirmar].
  // Guarda-se já na sessão do browser (se ainda não entrou, o login leva-o daqui
  // e o link não se perde); abre-se quando houver motorista. Tira-se do endereço.
  const [linkAjuda, setLinkAjuda] = useState<{ pedidoId: string; passo: PassoLink } | null>(null);
  useEffect(() => {
    try {
      const l = lerLinkDoPedido(window.location.search);
      if (l) {
        sessionStorage.setItem("hub_ajuda_link", JSON.stringify(l));
        const u = new URL(window.location.href);
        u.searchParams.delete("ajuda"); u.searchParams.delete("passo");
        window.history.replaceState(null, "", u.pathname + u.search + u.hash);
      }
    } catch { /* */ }
  }, []);
  // Só depois de o HUB-Central responder: ligada → abre; desligada → o link esquece-se.
  useEffect(() => {
    if (!eu || !ajudaDados.verificada) return;
    try {
      const raw = sessionStorage.getItem("hub_ajuda_link");
      if (!raw) return;
      sessionStorage.removeItem("hub_ajuda_link");
      if (!ajudaDados.ligada) return;
      const j = JSON.parse(raw) as { pedidoId?: string; passo?: string };
      const l = lerLinkDoPedido(`ajuda=${encodeURIComponent(String(j.pedidoId ?? ""))}${j.passo === "confirmar" ? "&passo=confirmar" : ""}`);
      if (l) setLinkAjuda(l);
    } catch { /* */ }
  }, [eu, ajudaDados.verificada, ajudaDados.ligada]);

  /* ── (heroId removed — cards self-expand on tap) ── */

  /* ================================================================ */
  /*  SEM IDENTIDADE VALIDADA → ZERO CARTÕES                           */
  /* ================================================================ */

  if (estado !== "ok" || !nomeConfirmado || recusada || store.sessaoRecusada) {
    // Nunca há lista de nomes para escolher: o motorista é só o do login.
    if (estado === "pede_ajuda") {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-10 text-center">
          <img src="/images/logo.png" alt="HUB Transfer" className="h-8 w-auto opacity-60 mb-8" />
          <h1 className="text-2xl font-bold text-[#F0D030] mb-3">Peça ajuda à gestão</h1>
          <p className="text-sm text-white/60 max-w-xs leading-relaxed font-mono">
            O seu nome não está na lista de motoristas da HUB, por isso não é possível mostrar viagens.
            Fale com a gestão para confirmar o seu registo.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 px-5 py-2.5 bg-white/5 text-white/70 rounded-lg text-sm font-mono active:bg-white/10 transition-colors"
          >
            Sair
          </button>
        </div>
      );
    }

    // Lista oficial indisponível (sem rede) → nunca mostrar viagens
    if (estado === "sem_ligacao") {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
          <p className="text-white/60 text-sm font-mono mb-4 text-center">
            Sem ligação ao HUB Central.<br />Não é possível confirmar o seu nome.
          </p>
          <button
            type="button"
            onClick={loadOfficialDrivers}
            className="px-5 py-2.5 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-sm font-bold font-mono active:bg-[#F0D030]/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    // A ler a sessão, a confirmar o nome, ou a caminho do login
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#F0D030]/30 border-t-[#F0D030] rounded-full animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /*  MAIN DRIVER VIEW                                                 */
  /* ================================================================ */

  // NO_SHOW dá baixa: sai das ativas e junta-se às terminadas (com selo próprio)
  const nonDoneTrips = driverTrips.filter(
    (v) =>
      !passaram.has(refDaViagem(v)) &&
      !isNoShowViagem(v) &&
      !v.concluida &&
      v.status !== "CONCLUIDA" &&
      v.status !== "FINALIZOU",
  );
  // Canceladas ficam visíveis (com selo) mas no fim das activas: nunca «Próxima viagem»
  const activeTrips = [
    ...nonDoneTrips.filter((v) => !isCanceladaViagem(v)),
    ...nonDoneTrips.filter((v) => isCanceladaViagem(v)),
  ];
  const nActivas = activeTrips.filter((v) => !isCanceladaViagem(v)).length;
  const doneTrips = driverTrips.filter(
    (v) =>
      isNoShowViagem(v) || v.concluida || v.status === "CONCLUIDA" || v.status === "FINALIZOU",
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[#F0D030] font-bold text-base truncate block"
            title="Sair"
          >
            {nomeConfirmado}
          </button>
          <img src="/images/logo.png" alt="HUB Transfer" className="h-5 w-auto opacity-50 mt-0.5" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {store.isLoading ? (
            <span className="text-xs text-[#F0D030]/60 animate-pulse font-mono">A sincronizar...</span>
          ) : store.isFromCache ? (
            <span className="text-xs text-[#D4D4D4] font-mono">Cache · {store.cacheAge}</span>
          ) : null}
          <span className="text-xs text-white/50 tabular-nums font-mono flex items-center gap-1.5">
            {store.backgroundRefreshing && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="A sincronizar em segundo plano" />
            )}
            {store.lastSyncTime ? `Sync: ${store.lastSyncTime}` : "Sync: --:--:--"}
          </span>
          <button onClick={() => setChangePwdOpen(true)} title="Alterar senha" className="text-white/40 hover:text-[#F0D030] transition-colors">⚙️</button>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-[#F0D030]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#F0D030] font-mono">
              {stats.total}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Total
            </div>
          </div>
          <div className="flex-1 bg-[#D4A847]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#D4A847] font-mono">
              {stats.chegadas}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Chegadas
            </div>
          </div>
          <div className="flex-1 bg-[#8B9DAF]/10 rounded-lg px-3 py-2.5 text-center">
            <div className="text-xl font-bold text-[#8B9DAF] font-mono">
              {stats.recolhas}
            </div>
            <div className="text-xs text-[#D0D0D0] uppercase font-mono">
              Recolhas
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[#F0D030]">
            €{stats.totalPay.toFixed(0)}
          </span>
          <span className="text-xs text-white/30 font-mono">
            {store.selectedDate || todayStr()}
            {store.lastSyncTime && (
              <span className="ml-2 text-white/20">
                sync {store.lastSyncTime}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── DATE PICKER ── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors font-mono"
          >
            ◀ Ontem
          </button>
          <button
            onClick={() => store.loadDate("")}
            className="h-10 px-4 bg-[#F0D030]/20 text-[#F0D030] rounded-lg text-xs font-bold active:bg-[#F0D030]/30 transition-colors font-mono"
          >
            📅 Hoje
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="h-10 px-3 bg-white/5 rounded-lg text-xs text-white/60 active:bg-white/10 transition-colors font-mono"
          >
            Amanhã ▶
          </button>
          <input
            type="date"
            value={
              store.selectedDate ? dateToISO(store.selectedDate) : ""
            }
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-");
              store.loadDate(`${d}/${m}/${y}`);
            }}
            className="h-10 flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:border-[#F0D030]/40 focus:outline-none"
          />
        </div>
      </div>

      {/* ── TRIP CARDS ── */}
      <div className="px-4 pb-8 space-y-2">
        {/* ── PEDIDOS DE AJUDA RECEBIDOS — no topo ── */}
        {eu && ajudaLigada && (
          <PedidosRecebidos recebidos={ajudaDados.recebidos} eu={eu} agora={ajudaDados.agora} onMudou={ajudaDados.recarregar} />
        )}
        {driverTrips.length === 0 && store.isLoading ? (
          <SkeletonList count={3} />
        ) : driverTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🚕</div>
            <p className="text-[#E5E5E5] text-sm font-mono">
              Nenhuma viagem para hoje
            </p>
            <button type="button" onClick={() => store.syncViagens()}
              className="mt-3 text-[#F0D030] text-xs font-mono underline underline-offset-2 cursor-pointer">
              Sincronizar
            </button>
          </div>
        ) : (
          <>
            {activeTrips.map((viagem, i) => {
              const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
              return (
                <React.Fragment key={vId}>
                  {i === 0 && nActivas > 0 && activeTrips.length > 1 && (
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#F0D030] px-1">
                      Próxima viagem
                    </p>
                  )}
                  {i === 1 && nActivas > 1 && (
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#666] px-1 pt-1">
                      Mais tarde
                    </p>
                  )}
                  <DriverTripCard
                    viagem={viagem}
                    driverName={store.driverName}
                    onDarBaixa={store.darBaixa}
                    onShowNameplate={openNameplate}
                    onRefresh={store.syncViagensSilent}
                    ajuda={ajudaDoCartao(viagem)}
                    isNext={i === 0 && nActivas > 0}
                  />
                </React.Fragment>
              );
            })}

            {doneTrips.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                    {(() => {
                      const noShows = doneTrips.filter((v) => isNoShowViagem(v)).length;
                      const done = doneTrips.length - noShows;
                      return noShows > 0 ? `Concluídas (${done}) · No-show (${noShows})` : `Concluídas (${done})`;
                    })()}
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {doneTrips.map((viagem) => {
                  const vId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
                  const tipo = detectTipo(viagem.origin || "", viagem.flight || "", viagem.type, viagem.tipoViagem);
                  const hora = cleanHora(viagem.pickupTime || "");
                  const typeColor = tipo === "CHEGADA" ? "#D4A847" : tipo === "RECOLHA" ? "#8B9DAF" : tipo === "TRANSFER" ? "#2DD4BF" : "#C17E4A";
                  const noShow = isNoShowViagem(viagem);
                  return (
                    <div
                      key={vId}
                      className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] px-4 py-3 flex items-center gap-3 opacity-50"
                      style={{ borderLeftWidth: "3px", borderLeftColor: noShow ? "#7F1D1D" : typeColor, ...(noShow ? { filter: "grayscale(0.55)" } : {}) }}
                    >
                      <span className="font-mono text-sm font-bold text-[#666]">{hora}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#999] truncate">{viagem.client}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                      >
                        {tipo}
                      </span>
                      {noShow ? (
                        <>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7F1D1D]/50 text-[#F87171]">
                            🚫 Cliente não compareceu
                          </span>
                          <button type="button" onClick={() => setProofTrip(viagem)} title="Anexar provas do no-show"
                            className="text-sm px-1.5 py-0.5 rounded border border-[#7F1D1D]/60 text-[#F87171] hover:bg-[#7F1D1D]/30 active:bg-[#7F1D1D]/40 transition-colors">
                            📎
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E]">
                          CONCLUÍDA
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* ── PROVAS DO NO-SHOW (viagem já marcada — só anexa, não re-marca) ── */}
      {proofTrip && (
        <NoShowModal
          isOpen
          tripId={String(proofTrip.id ?? "")}
          clientName={String(proofTrip.client ?? "")}
          driverName={store.driverName}
          gasUrl={HUB_CENTRAL_URL}
          date={String(proofTrip.date || proofTrip.flightDate || "")}
          onClose={() => setProofTrip(null)}
          onSubmit={() => { setProofTrip(null); store.syncViagensSilent(); }}
        />
      )}

      {/* ── PEDIDO ABERTO PELO LINK DO WHATSAPP (ecrã inteiro) ── */}
      {eu && ajudaLigada && linkAjuda && (
        <EcraPedidoPorLink
          pedidoId={linkAjuda.pedidoId}
          passo={linkAjuda.passo}
          eu={eu}
          agora={ajudaDados.agora}
          onFechar={() => { setLinkAjuda(null); store.syncViagensSilent(); }}
          onMudou={ajudaDados.recarregar}
        />
      )}

      {/* ── PEDIR AJUDA (ecrã inteiro) ── */}
      {eu && ajudaLigada && ajudaResumo && (
        <EcraPedirAjuda
          viagem={ajudaResumo}
          eu={eu}
          pedido={ajudaDados.meus[ajudaResumo.viagemRef] ?? null}
          agora={ajudaDados.agora}
          onFechar={() => setAjudaViagem(null)}
          onViagemSaiu={(ref) => { setPassaram((s) => new Set(s).add(ref)); store.syncViagensSilent(); }}
          onMudou={ajudaDados.recarregar}
        />
      )}

      {/* ── NAMEPLATE ── */}
      <DriverNameplate
        isOpen={nameplateOpen}
        name={nameplateName}
        destination={nameplateDest}
        onClose={closeNameplate}
      />

      <ChangePasswordModal isOpen={changePwdOpen} onClose={() => setChangePwdOpen(false)} tipo="motorista" userId={store.driverName} />
    </div>
  );
}
