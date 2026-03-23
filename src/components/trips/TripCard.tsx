"use client";

import React, { useMemo } from "react";
import type { HubViagem, Driver } from "@/lib/trips";
import {
  detectTipo,
  splitLocation,
  cleanHora,
  calcFlightProgress,
  calcDriverPrice,
  resolveLanguage,
  getIataInfo,
  regionLabel,
  guessDepAirport,
  getMapUrl,
  getWazeUrl,
} from "@/lib/trips";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TripCardProps {
  viagem: HubViagem;
  drivers: Driver[];
  onSetDriver: (cardId: string, driver: string) => void;
  onDarBaixa: (id: string, rowIndex: string, cardId: string) => void;
  onDispatch: (
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
  ) => void;
  onClientMsg: (
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
    phone: string,
  ) => void;
  onSmsMsg: (
    cardId: string,
    type: string,
    client: string,
    lang: string,
    origin: string,
    hora: string,
    phone: string,
  ) => void;
  onShowNameplate: (name: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const typeColor: Record<string, string> = {
  CHEGADA: "text-amber-500",
  RECOLHA: "text-emerald-500",
  TOUR: "text-purple-500",
};

const typeBg: Record<string, string> = {
  CHEGADA: "bg-amber-500/10",
  RECOLHA: "bg-emerald-500/10",
  TOUR: "bg-purple-500/10",
};

const borderLeft: Record<string, string> = {
  CHEGADA: "border-l-4 border-l-amber-500",
  RECOLHA: "border-l-4 border-l-emerald-500",
  TOUR: "border-l-4 border-l-purple-500",
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Tag pill                                                           */
/* ------------------------------------------------------------------ */

function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-xs px-2 py-0.5 rounded bg-hub-black-elevated border border-hub-gold/10 whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav button (Maps / Waze)                                           */
/* ------------------------------------------------------------------ */

function NavBtn({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: "blue" | "cyan";
}) {
  const colors =
    color === "blue"
      ? "bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/25"
      : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${colors}`}
    >
      {label === "Maps" ? (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm3.5 14.5l-5-3V7h1.5v5.8l4.3 2.55-.8 1.15z" />
        </svg>
      )}
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Address row                                                        */
/* ------------------------------------------------------------------ */

function AddressRow({
  label,
  address,
  icon,
}: {
  label: string;
  address: string;
  icon?: React.ReactNode;
}) {
  if (!address) return null;
  const loc = splitLocation(address);
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
          {label}
        </p>
        {loc.name && <p className="text-sm font-bold text-white/90 leading-snug">{loc.name}</p>}
        <p className="text-xs text-white/50 leading-snug">{loc.addr}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <NavBtn href={getMapUrl(address)} label="Maps" color="blue" />
        <NavBtn href={getWazeUrl(address)} label="Waze" color="cyan" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flight progress bar                                                */
/* ------------------------------------------------------------------ */

function FlightProgress({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white shadow-sm shadow-white/50"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function TripCard({
  viagem,
  drivers,
  onSetDriver,
  onDarBaixa,
  onDispatch,
  onClientMsg,
  onSmsMsg,
  onShowNameplate,
}: TripCardProps) {
  const cardId = viagem.id || (viagem.client || "x").replace(/\W/g, "");
  const tipo = detectTipo(viagem.origin || "", viagem.flight || "");
  const hora = cleanHora(viagem.pickupTime || "");
  const lang = resolveLanguage(viagem.language || "", viagem.phone);
  const price = calcDriverPrice(viagem.platform || "");
  const isDone = viagem.concluida || viagem.status === "CONCLUIDA" || viagem.status === "FINALIZOU";

  const flightProgress = useMemo(() => {
    if (tipo !== "CHEGADA") return 0;
    return calcFlightProgress(viagem.depTime || "", viagem.arrTime || "");
  }, [tipo, viagem.depTime, viagem.arrTime]);

  const depAirport = useMemo(() => {
    if (tipo !== "CHEGADA") return null;
    return guessDepAirport(viagem.flight || "");
  }, [tipo, viagem]);

  const arrIata = useMemo(() => {
    if (tipo !== "CHEGADA" || !viagem.flight) return null;
    return getIataInfo(viagem.flight);
  }, [tipo, viagem.flight]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className={`
        bg-hub-black-card rounded-2xl border border-hub-gold/10 overflow-hidden
        ${borderLeft[tipo] ?? "border-l-4 border-l-gray-500"}
        ${isDone ? "opacity-40" : ""}
        transition-opacity duration-300
      `}
    >
      {/* ============================================================ */}
      {/*  TOP ROW: timebox | info | nav                               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-4 pb-3">
        {/* Timebox */}
        <div
          className={`bg-hub-black-elevated rounded-xl px-4 py-3 flex flex-col items-center justify-center min-w-[80px] ${typeBg[tipo] ?? ""}`}
        >
          <span
            className={`font-mono text-2xl font-bold leading-none ${typeColor[tipo] ?? "text-gray-400"}`}
          >
            {hora}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-widest mt-1 ${typeColor[tipo] ?? "text-gray-400"} opacity-70`}
          >
            {tipo}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-2 min-w-0">
          {/* Client name */}
          <button
            type="button"
            onClick={() => onShowNameplate(viagem.client)}
            className="text-lg font-bold text-white text-left truncate hover:text-hub-gold transition-colors"
          >
            {viagem.client}
          </button>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5">
            {viagem.driver ? (
              <Tag className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                {viagem.driver}
              </Tag>
            ) : (
              <Tag className="bg-red-500/10 border-red-500/20 text-red-400">
                Sem motorista
              </Tag>
            )}
            {viagem.flight && (
              <Tag>
                <span className="text-amber-400">{viagem.flight}</span>
              </Tag>
            )}
            <Tag>
              <span className="text-white/60">{lang}</span>
            </Tag>
            {viagem.pax && (
              <Tag>
                <span className="text-white/60">{viagem.pax} pax</span>
              </Tag>
            )}
            {viagem.bags && (
              <Tag>
                <span className="text-white/60">{viagem.bags} bags</span>
              </Tag>
            )}
            {price > 0 && (
              <Tag>
                <span className="text-hub-gold">{price}&euro;</span>
              </Tag>
            )}
          </div>
        </div>

        {/* Nav buttons (origin) */}
        <div className="flex flex-col gap-1.5 justify-center">
          {viagem.origin && (
            <>
              <NavBtn
                href={getMapUrl(viagem.origin)}
                label="Maps"
                color="blue"
              />
              <NavBtn
                href={getWazeUrl(viagem.origin)}
                label="Waze"
                color="cyan"
              />
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  MIDDLE SECTION — type-specific                              */}
      {/* ============================================================ */}
      <div className="px-4 pb-3">
        {/* ── CHEGADA ── */}
        {tipo === "CHEGADA" && (
          <div className="space-y-3">
            {/* Flight info block */}
            <div className="bg-hub-black-elevated rounded-xl p-3 space-y-2 border border-amber-500/10">
              <div className="flex items-center justify-between text-xs">
                <div className="text-center">
                  <p className="font-mono text-amber-400 font-bold text-sm">
                    {(viagem.depAirport || viagem.depIata || depAirport || "???").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {viagem.depCity || "Partida"}
                  </p>
                  {viagem.depTime && (
                    <p className="font-mono text-[10px] text-white/50 mt-0.5">
                      {viagem.depTime}
                    </p>
                  )}
                </div>
                <div className="flex-1 mx-3">
                  <FlightProgress progress={flightProgress} />
                  {viagem.flight && (
                    <p className="text-center font-mono text-[10px] text-amber-400/60 mt-1">
                      {viagem.flight}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-mono text-amber-400 font-bold text-sm">
                    {(viagem.arrAirport || viagem.arrIata || "LIS").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {viagem.arrCity || "Lisboa"}
                  </p>
                  {viagem.arrTime && (
                    <p className="font-mono text-[10px] text-white/50 mt-0.5">
                      {viagem.arrTime}
                    </p>
                  )}
                </div>
              </div>
              {(viagem.depTerminal || viagem.arrTerminal) && (
                <div className="flex justify-between font-mono text-[10px] text-white/30">
                  {viagem.depTerminal && (
                    <span>T{viagem.depTerminal}</span>
                  )}
                  {viagem.arrTerminal && (
                    <span>T{viagem.arrTerminal}</span>
                  )}
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="divide-y divide-white/5">
              <AddressRow
                label="Origem"
                address={viagem.origin}
                icon={
                  <span className="text-amber-500 text-lg leading-none">
                    &#9992;
                  </span>
                }
              />
              <AddressRow
                label="Destino"
                address={viagem.destination}
                icon={
                  <span className="text-emerald-500 text-lg leading-none">
                    &#9873;
                  </span>
                }
              />
            </div>
          </div>
        )}

        {/* ── RECOLHA ── */}
        {tipo === "RECOLHA" && (
          <div className="space-y-3">
            {/* Visual route A → B */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/60 via-emerald-500/20 to-emerald-500/60 relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-emerald-400/50 text-xs">
                  &rarr;
                </span>
              </div>
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500 flex-shrink-0" />
            </div>

            {/* Addresses */}
            <div className="divide-y divide-white/5">
              <AddressRow
                label="Pickup"
                address={viagem.origin}
                icon={
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-0.5" />
                }
              />
              <AddressRow
                label="Destino"
                address={viagem.destination}
                icon={
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 mt-0.5" />
                }
              />
            </div>
          </div>
        )}

        {/* ── TOUR ── */}
        {tipo === "TOUR" && (
          <div className="space-y-3">
            {/* Compass icon header */}
            <div className="flex items-center gap-2 text-purple-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v2m0 16v2m10-10h-2M4 12H2m15.07-5.07l-1.41 1.41M8.34 15.66l-1.41 1.41m0-10.14l1.41 1.41m7.32 7.32l1.41 1.41"
                />
              </svg>
              <span className="font-mono text-xs uppercase tracking-wider">
                Tour
              </span>
              {/* Region info could be derived from IATA if needed */}
            </div>

            {/* Meeting point */}
            <div className="divide-y divide-white/5">
              <AddressRow
                label="Ponto de encontro"
                address={viagem.origin}
                icon={
                  <span className="text-purple-400 text-lg leading-none">
                    &#128205;
                  </span>
                }
              />
              {viagem.destination && (
                <AddressRow
                  label="Destino"
                  address={viagem.destination}
                  icon={
                    <span className="text-purple-400/50 text-lg leading-none">
                      &#128204;
                    </span>
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM ROW: actions                                         */}
      {/* ============================================================ */}
      <div className="border-t border-white/5 bg-hub-black-elevated/50 px-4 py-3 space-y-3">
        {/* Driver selector + phone */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={viagem.driver ?? ""}
            onChange={(e) => onSetDriver(cardId, e.target.value)}
            className="flex-1 min-w-[140px] bg-hub-black-elevated border border-hub-gold/10 rounded-lg px-3 py-2 font-mono text-xs text-white/90 focus:outline-none focus:border-hub-gold/40 transition-colors"
          >
            <option value="">Escolher motorista...</option>
            {drivers.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}{d.viatura ? ` · ${d.viatura}` : ""}
              </option>
            ))}
          </select>

          {viagem.phone && (
            <button
              type="button"
              onClick={() => copyToClipboard(viagem.phone!)}
              className="font-mono text-sm text-white/70 hover:text-hub-gold cursor-pointer transition-colors px-2 py-1 rounded hover:bg-hub-gold/5"
              title="Copiar telefone"
            >
              {viagem.phone}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* WhatsApp Cliente */}
          {viagem.phone && (
            <button
              type="button"
              onClick={() =>
                onClientMsg(
                  cardId,
                  tipo,
                  viagem.client,
                  lang,
                  viagem.origin,
                  hora,
                  viagem.phone!,
                )
              }
              className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              WhatsApp
            </button>
          )}

          {/* SMS */}
          {viagem.phone && (
            <button
              type="button"
              onClick={() =>
                onSmsMsg(
                  cardId,
                  tipo,
                  viagem.client,
                  lang,
                  viagem.origin,
                  hora,
                  viagem.phone!,
                )
              }
              className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              SMS
            </button>
          )}

          {/* Dispatch motorista */}
          <button
            type="button"
            onClick={() =>
              onDispatch(
                cardId,
                tipo,
                viagem.client,
                lang,
                viagem.origin,
                hora,
              )
            }
            className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Motorista
          </button>

          {/* Dar Baixa */}
          <button
            type="button"
            onClick={() =>
              onDarBaixa(viagem.id, viagem.rowIndex ?? "", cardId)
            }
            className="font-mono text-xs font-bold rounded-lg px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors ml-auto"
          >
            Dar Baixa
          </button>
        </div>
      </div>
    </div>
  );
}
