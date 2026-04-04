// ─────────────────────────────────────────────────────────────
//  trips.ts — Types, constants & business logic for the
//  HUB Transfer operations panel (viagens-ops)
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export interface TripService {
  id: number;
  type: 'CHEGADA' | 'RECOLHA' | 'TOUR';
  client: string;
  clientPhone: string;
  platform: string;
  origin: string;
  destination: string;
  pickupTime: string;
  flightNumber: string;
  flightDate: string;
  depAirport: string;
  depCity: string;
  depTime: string;
  depTerminal: string;
  arrAirport: string;
  arrCity: string;
  arrTime: string;
  arrTerminal: string;
  duration: string;
  status: string;
  delayMinutes: number;
  progressPct: number;
  language: string;
  pax: string;
  notes: string;
  assignedDriver: string;
  doneAt?: string;
}

export interface HubViagem {
  id: string;
  rowIndex?: string;
  type?: string;
  date?: string;          // DD/MM/YYYY — trip date
  client: string;
  phone: string;
  origin: string;
  destination: string;
  pickupTime: string;
  flight: string;
  flightDate?: string;
  depAirport?: string;
  depCity?: string;
  depTime?: string;
  depTerminal?: string;
  arrAirport?: string;
  arrCity?: string;
  arrTime?: string;
  arrTerminal?: string;
  depIata?: string;
  arrIata?: string;
  statusVoo?: string;      // "AGUARDANDO" | "MONITORANDO" | "EN_VOO" | "ATERRISADO"
  atrasoMin?: string;      // delay minutes ("25", "0")
  depTimeProg?: string;    // programmed departure time
  etaChegada?: string;     // estimated arrival time
  etaChegadaFull?: string;  // full ETA string from backend
  depTimeFull?: string;     // full departure time string from backend
  depActual?: string;       // HH:MM — actual departure time
  depActualFull?: string;   // YYYY-MM-DD HH:MM
  depDelay?: string;        // departure delay minutes
  arrOriginal?: string;     // HH:MM — original scheduled arrival
  arrOriginalFull?: string; // YYYY-MM-DD HH:MM
  language: string;
  pax: string;
  bags?: string;
  notes?: string;
  driver: string;
  platform: string;
  concluida: boolean;
  status?: string;
  statusMotorista?: string;  // BD(56): AGUARDANDO/NO_LOCAL/EM_VIAGEM/FINALIZADO
}

export interface Driver {
  name: string;
  phone: string;
  viatura: string;
}

export type TabType = 'current' | 'chegadas' | 'recolhas' | 'past' | 'cancelled' | 'dia' | 'restaurantes';

export interface ServicesState {
  current: TripService[];
  past: TripService[];
  cancelled: TripService[];
}

// ── Constants ────────────────────────────────────────────────

export const HUB_CENTRAL_URL =
  'https://script.google.com/macros/s/AKfycbwwr4_wjibbZgVEDD7JC0VSYce7C8iIvSmJFSbDHO_IX1L5KHSagOxkJZOL0ya746Uicw/exec';

export const PLATFORMS = ['Talixo', 'Empire Lisbon', 'Empire Marques', 'WT Driver'] as const;

export const DRIVERS_FALLBACK: Driver[] = [
  { name: 'Marco',  phone: '351912000001', viatura: '' },
  { name: 'João',   phone: '351912000002', viatura: '' },
  { name: 'Paulo',  phone: '351912000003', viatura: '' },
  { name: 'Carlos', phone: '351912000004', viatura: '' },
  { name: 'Rui',    phone: '351912000005', viatura: '' },
];

export const STATUS_MAP: Record<string, { label: string; className: string }> = {
  scheduled:  { label: 'Agendado',     className: 'scheduled' },
  'on-time':  { label: 'No Horário',   className: 'on-time' },
  delayed:    { label: 'Atrasado',     className: 'delayed' },
  boarding:   { label: 'Embarcando',   className: 'boarding' },
  landed:     { label: 'Aterrou ✓',    className: 'landed' },
};

export const TAB_INFO: Record<TabType, { title: string; sub: string; showPaste: boolean; showFilter: boolean }> = {
  current:   { title: 'Current',   sub: 'Viagens activas de hoje',     showPaste: true,  showFilter: true },
  chegadas:  { title: 'Chegadas',  sub: 'Aeroporto → Hotel',           showPaste: true,  showFilter: false },
  recolhas:  { title: 'Recolhas',  sub: 'Hotel → Aeroporto',           showPaste: true,  showFilter: false },
  past:      { title: 'Past',      sub: 'Viagens concluídas',          showPaste: false, showFilter: false },
  cancelled: { title: 'Cancelled', sub: 'Viagens canceladas',          showPaste: false, showFilter: false },
  dia:       { title: 'Hoje',      sub: 'Plano do Dia — HUB Central',  showPaste: false, showFilter: false },
  restaurantes: { title: 'Restaurantes', sub: 'Reservas em restaurantes parceiros', showPaste: false, showFilter: false },
};

// ── DDI → Language map ───────────────────────────────────────

export const DDI_LANG: Record<string, string> = {
  // Portuguese-speaking
  '351': 'PT', '55': 'PT', '244': 'PT', '258': 'PT', '238': 'PT',
  // Spanish-speaking
  '34': 'ES', '54': 'ES', '56': 'ES', '57': 'ES', '58': 'ES',
  '51': 'ES', '52': 'ES', '53': 'ES', '591': 'ES', '593': 'ES',
  '595': 'ES', '598': 'ES', '506': 'ES', '507': 'ES', '502': 'ES',
  '503': 'ES', '504': 'ES', '505': 'ES', '509': 'ES',
  // French-speaking
  '33': 'FR', '32': 'FR', '352': 'FR', '212': 'FR', '225': 'FR',
  '221': 'FR', '237': 'FR', '243': 'FR', '261': 'FR',
  // Italian-speaking
  '39': 'IT', '378': 'IT',
  // German-speaking
  '49': 'DE', '43': 'DE', '41': 'DE', '423': 'DE',
  // English-speaking
  '44': 'EN', '1': 'EN', '61': 'EN', '64': 'EN', '27': 'EN',
  '353': 'EN', '91': 'EN', '92': 'EN', '63': 'EN', '234': 'EN',
  '254': 'EN', '233': 'EN', '256': 'EN', '255': 'EN',
  // Dutch
  '31': 'EN',
  // Scandinavian (fallback EN)
  '45': 'EN', '46': 'EN', '47': 'EN', '358': 'EN',
  // Eastern Europe (fallback EN)
  '48': 'EN', '420': 'EN', '421': 'EN', '36': 'EN',
  '40': 'EN', '359': 'EN', '380': 'EN', '375': 'EN',
  // Asian (fallback EN)
  '86': 'EN', '81': 'EN', '82': 'EN', '66': 'EN',
  '84': 'EN', '60': 'EN', '65': 'EN', '62': 'EN',
  // Middle East (fallback EN)
  '90': 'EN', '966': 'EN', '971': 'EN', '972': 'EN',
  '974': 'EN', '973': 'EN', '968': 'EN', '962': 'EN',
  // Russian-speaking (fallback EN)
  '7': 'EN',
  // Greek
  '30': 'EN',
  // Romanian
  '373': 'EN',
};

// ── IATA airport data ────────────────────────────────────────

export interface IataInfo {
  /** Country ISO-2 */
  c: string;
  /** Region classification */
  r: 'sch' | 'uk' | 'eu' | 'inter';
}

export const IATA_DB: Record<string, IataInfo> = {
  // Portugal
  LIS: { c: 'PT', r: 'sch' }, OPO: { c: 'PT', r: 'sch' }, FAO: { c: 'PT', r: 'sch' },
  FNC: { c: 'PT', r: 'sch' }, PDL: { c: 'PT', r: 'sch' }, TER: { c: 'PT', r: 'sch' },
  // Spain
  MAD: { c: 'ES', r: 'sch' }, BCN: { c: 'ES', r: 'sch' }, AGP: { c: 'ES', r: 'sch' },
  PMI: { c: 'ES', r: 'sch' }, SVQ: { c: 'ES', r: 'sch' }, VLC: { c: 'ES', r: 'sch' },
  BIO: { c: 'ES', r: 'sch' }, ACE: { c: 'ES', r: 'sch' }, TFS: { c: 'ES', r: 'sch' },
  // France
  CDG: { c: 'FR', r: 'sch' }, ORY: { c: 'FR', r: 'sch' }, NCE: { c: 'FR', r: 'sch' },
  LYS: { c: 'FR', r: 'sch' }, MRS: { c: 'FR', r: 'sch' }, TLS: { c: 'FR', r: 'sch' },
  BOD: { c: 'FR', r: 'sch' }, NTE: { c: 'FR', r: 'sch' },
  // Germany
  FRA: { c: 'DE', r: 'sch' }, MUC: { c: 'DE', r: 'sch' }, BER: { c: 'DE', r: 'sch' },
  DUS: { c: 'DE', r: 'sch' }, HAM: { c: 'DE', r: 'sch' }, CGN: { c: 'DE', r: 'sch' },
  STR: { c: 'DE', r: 'sch' },
  // UK
  LHR: { c: 'GB', r: 'uk' }, LGW: { c: 'GB', r: 'uk' }, STN: { c: 'GB', r: 'uk' },
  LTN: { c: 'GB', r: 'uk' }, MAN: { c: 'GB', r: 'uk' }, EDI: { c: 'GB', r: 'uk' },
  BHX: { c: 'GB', r: 'uk' }, BRS: { c: 'GB', r: 'uk' }, GLA: { c: 'GB', r: 'uk' },
  LCY: { c: 'GB', r: 'uk' },
  // Italy
  FCO: { c: 'IT', r: 'sch' }, MXP: { c: 'IT', r: 'sch' }, LIN: { c: 'IT', r: 'sch' },
  NAP: { c: 'IT', r: 'sch' }, VCE: { c: 'IT', r: 'sch' }, BGY: { c: 'IT', r: 'sch' },
  BLQ: { c: 'IT', r: 'sch' }, PSA: { c: 'IT', r: 'sch' },
  // Netherlands
  AMS: { c: 'NL', r: 'sch' }, EIN: { c: 'NL', r: 'sch' },
  // Belgium
  BRU: { c: 'BE', r: 'sch' }, CRL: { c: 'BE', r: 'sch' },
  // Switzerland
  ZRH: { c: 'CH', r: 'sch' }, GVA: { c: 'CH', r: 'sch' }, BSL: { c: 'CH', r: 'sch' },
  // Austria
  VIE: { c: 'AT', r: 'sch' },
  // Ireland
  DUB: { c: 'IE', r: 'sch' }, SNN: { c: 'IE', r: 'sch' },
  // Scandinavia
  CPH: { c: 'DK', r: 'sch' }, ARN: { c: 'SE', r: 'sch' }, OSL: { c: 'NO', r: 'sch' },
  HEL: { c: 'FI', r: 'sch' }, GOT: { c: 'SE', r: 'sch' },
  // Eastern Europe (Schengen)
  WAW: { c: 'PL', r: 'sch' }, PRG: { c: 'CZ', r: 'sch' }, BUD: { c: 'HU', r: 'sch' },
  ATH: { c: 'GR', r: 'sch' },
  // Eastern Europe (EU non-Schengen)
  OTP: { c: 'RO', r: 'eu' }, SOF: { c: 'BG', r: 'eu' },
  // Turkey
  IST: { c: 'TR', r: 'inter' }, SAW: { c: 'TR', r: 'inter' },
  // North Africa / Middle East
  CMN: { c: 'MA', r: 'inter' }, RAK: { c: 'MA', r: 'inter' },
  CAI: { c: 'EG', r: 'inter' }, DXB: { c: 'AE', r: 'inter' }, DOH: { c: 'QA', r: 'inter' },
  TLV: { c: 'IL', r: 'inter' },
  // Americas
  JFK: { c: 'US', r: 'inter' }, EWR: { c: 'US', r: 'inter' }, MIA: { c: 'US', r: 'inter' },
  LAX: { c: 'US', r: 'inter' }, ORD: { c: 'US', r: 'inter' }, BOS: { c: 'US', r: 'inter' },
  IAD: { c: 'US', r: 'inter' }, SFO: { c: 'US', r: 'inter' }, ATL: { c: 'US', r: 'inter' },
  YYZ: { c: 'CA', r: 'inter' }, YUL: { c: 'CA', r: 'inter' },
  GRU: { c: 'BR', r: 'inter' }, GIG: { c: 'BR', r: 'inter' },
  EZE: { c: 'AR', r: 'inter' }, BOG: { c: 'CO', r: 'inter' }, MEX: { c: 'MX', r: 'inter' },
  // Asia
  NRT: { c: 'JP', r: 'inter' }, HND: { c: 'JP', r: 'inter' },
  PEK: { c: 'CN', r: 'inter' }, PVG: { c: 'CN', r: 'inter' },
  ICN: { c: 'KR', r: 'inter' }, SIN: { c: 'SG', r: 'inter' },
  BKK: { c: 'TH', r: 'inter' }, DEL: { c: 'IN', r: 'inter' }, BOM: { c: 'IN', r: 'inter' },
  // Africa
  JNB: { c: 'ZA', r: 'inter' }, CPT: { c: 'ZA', r: 'inter' },
  LOS: { c: 'NG', r: 'inter' }, NBO: { c: 'KE', r: 'inter' },
  // Oceania
  SYD: { c: 'AU', r: 'inter' }, MEL: { c: 'AU', r: 'inter' },
  AKL: { c: 'NZ', r: 'inter' },
  // Eastern Europe / Moldova
  KIV: { c: 'MD', r: 'eu' }, RMO: { c: 'MD', r: 'eu' },
  TBS: { c: 'GE', r: 'eu' }, EVN: { c: 'AM', r: 'eu' },
  KBP: { c: 'UA', r: 'eu' }, IEV: { c: 'UA', r: 'eu' },
  BEG: { c: 'RS', r: 'eu' }, TIA: { c: 'AL', r: 'eu' },
  SKP: { c: 'MK', r: 'eu' }, SJJ: { c: 'BA', r: 'eu' },
  // Additional missing
  LCA: { c: 'CY', r: 'eu' }, MLA: { c: 'MT', r: 'sch' },
  HER: { c: 'GR', r: 'sch' }, SKG: { c: 'GR', r: 'sch' },
};

export function getIataInfo(code: string): IataInfo | null {
  return IATA_DB[code.toUpperCase().trim()] ?? null;
}

export function regionLabel(region: string): { text: string; cls: string } | null {
  switch (region) {
    case 'sch':   return { text: 'Schengen',          cls: 'region-schengen' };
    case 'uk':    return { text: 'Reino Unido',       cls: 'region-uk' };
    case 'eu':    return { text: 'EU (não-Schengen)',  cls: 'region-eu' };
    case 'inter': return { text: 'Internacional',     cls: 'region-inter' };
    default:      return null;
  }
}

// ── Airline IATA prefix → base airport ───────────────────────

const AIRLINE_BASE: Record<string, string> = {
  TP: 'LIS', NI: 'LIS',           // TAP, Portugália
  LH: 'FRA', LX: 'ZRH', OS: 'VIE', SN: 'BRU', // Lufthansa Group
  BA: 'LHR', AA: 'JFK',           // BA, American
  AF: 'CDG', TO: 'ORY',           // Air France, Transavia FR
  KL: 'AMS', HV: 'AMS',           // KLM, Transavia NL
  IB: 'MAD', VY: 'BCN', UX: 'MAD', // Iberia, Vueling, Air Europa
  AZ: 'FCO', FR: 'STN',           // ITA, Ryanair
  U2: 'LGW', EZY: 'LGW',         // easyJet
  EI: 'DUB',                      // Aer Lingus
  SK: 'CPH', DY: 'OSL', AY: 'HEL', // SAS, Norwegian, Finnair
  LO: 'WAW', OK: 'PRG', W6: 'BUD', // LOT, Czech, Wizz
  TK: 'IST', PC: 'SAW',           // Turkish, Pegasus
  EK: 'DXB', QR: 'DOH', EY: 'AUH', // Emirates, Qatar, Etihad
  DL: 'JFK', UA: 'EWR',           // Delta, United
  AC: 'YYZ',                      // Air Canada
  LA: 'GRU', G3: 'GRU', AD: 'GRU', // LATAM, Gol, Azul
  QF: 'SYD', NZ: 'AKL',           // Qantas, Air NZ
  SQ: 'SIN', CX: 'HKG',           // Singapore, Cathay
  AT: 'CMN',                      // Royal Air Maroc
  S4: 'PDL',                      // SATA
  // 3-letter ICAO codes (no duplicates)
  TAP: 'LIS', RYR: 'STN',
  BAW: 'LHR', DLH: 'FRA', AFR: 'CDG',
  IBE: 'MAD', SWR: 'ZRH',
  THY: 'IST', UAE: 'DXB', QTR: 'DOH',
  ETD: 'AUH', FIA: 'HEL', SAS: 'CPH',
  WZZ: 'BUD', DAL: 'JFK', AAL: 'JFK',
  UAL: 'EWR', ACA: 'YYZ', RAM: 'CMN',
};

export function guessDepAirport(flight: string): string | null {
  if (!flight) return null;
  const clean = flight.replace(/\s+/g, '').toUpperCase();
  // Try 3-char prefix first (EZY), then 2-char
  const prefix3 = clean.slice(0, 3);
  const prefix2 = clean.slice(0, 2);
  return AIRLINE_BASE[prefix3] ?? AIRLINE_BASE[prefix2] ?? null;
}

// ── Airport / hotel keyword lists (for location splitting) ───

const AIRPORT_KEYWORDS = [
  'aeroporto', 'airport', 'aéroport', 'flughafen', 'aeropuerto', 'aeroporti',
  'terminal', 'arrivals', 'departures', 'chegadas', 'partidas',
];

const HOTEL_KEYWORDS = [
  'hotel', 'hostel', 'guest house', 'guesthouse', 'aparthotel', 'apart-hotel',
  'pousada', 'pensão', 'residencial', 'airbnb', 'alojamento', 'villa',
  'resort', 'quinta', 'motel', 'inn', 'b&b', 'bed and breakfast',
  'residence', 'suites', 'lodge',
];

const PLACE_KEYWORDS = [
  'restaurante', 'restaurant', 'estação', 'station', 'gare', 'terminal',
  'porto de', 'marina', 'cais', 'museu', 'museum', 'castelo', 'castle',
  'palácio', 'palace', 'praça', 'square', 'centro comercial', 'shopping',
];

// ── Business logic functions ─────────────────────────────────

/**
 * Detect trip type: CHEGADA (arrival), RECOLHA (pick-up) or TOUR
 * based on whether the origin mentions an airport and a flight exists.
 */
export function detectTipo(origin: string, flight: string, backendType?: string): string {
  // 1. If backend explicitly says TOUR, respect it
  const bt = (backendType || '').toUpperCase().trim();
  if (bt === 'TOUR') return 'TOUR';

  // 2. If origin is the airport → CHEGADA (arrival)
  const o = (origin || '').toLowerCase();
  const hasAirport = AIRPORT_KEYWORDS.some((kw) => o.includes(kw)) ||
    /\b(lis|opo|fao|fnc|pdl)\b/i.test(o) ||
    /lisbon\s*airport|lisboa\s*aeroporto|humberto\s*delgado/i.test(o);

  if (hasAirport) return 'CHEGADA';

  // 3. Everything else → RECOLHA
  return 'RECOLHA';
}

/**
 * Split a raw location string into an establishment name and an address.
 */
export function splitLocation(raw: string): { name: string; addr: string; full: string } {
  if (!raw) return { name: '', addr: '', full: '' };
  const full = raw.trim();

  // Try splitting on common separators: " - ", " — ", " , " (after a keyword)
  const allKeywords = [...HOTEL_KEYWORDS, ...AIRPORT_KEYWORDS, ...PLACE_KEYWORDS];
  const lower = full.toLowerCase();

  let name = full;
  let addr = '';

  // If a keyword is found, try to isolate the establishment name
  for (const kw of allKeywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      // Look for a separator after the keyword
      const afterKw = full.substring(idx);
      const sepMatch = afterKw.match(/^[^,\-—]+[,\-—]\s*(.+)/);
      if (sepMatch) {
        name = full.substring(0, idx + afterKw.indexOf(sepMatch[1][0] === ' ' ? sepMatch[1] : sepMatch[1])).replace(/[,\-—]\s*$/, '').trim();
        addr = sepMatch[1].trim();
      } else {
        name = full;
        addr = '';
      }
      break;
    }
  }

  // Fallback: split on first comma or dash if no keyword matched
  if (!addr) {
    const sepIdx = full.search(/\s*[,\-—]\s*/);
    if (sepIdx > 3) {
      name = full.substring(0, sepIdx).trim();
      addr = full.substring(sepIdx).replace(/^[,\-—]\s*/, '').trim();
    }
  }

  return { name, addr, full };
}

/**
 * Extract HH:MM from any time format.
 */
export function cleanHora(h: string): string {
  if (!h) return '';
  const m = h.match(/(\d{1,2})[:\-hH.](\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  // Attempt pure digits e.g. "0930"
  const d = h.replace(/\D/g, '');
  if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  if (d.length === 3) return `0${d[0]}:${d.slice(1)}`;
  return h.trim();
}

/**
 * Calculate flight progress percentage based on dep/arr times and current time.
 * Returns 0–100.
 */
export function calcFlightProgress(depTime: string, arrTime: string): number {
  const now = new Date();
  const todayBase = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));

  const parse = (t: string): Date | null => {
    const clean = cleanHora(t);
    const parts = clean.split(':');
    if (parts.length !== 2) return null;
    const d = new Date(todayBase);
    d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return d;
  };

  const dep = parse(depTime);
  const arr = parse(arrTime);
  if (!dep || !arr) return 0;

  // Handle overnight flights
  if (arr.getTime() <= dep.getTime()) {
    arr.setDate(arr.getDate() + 1);
  }

  const total = arr.getTime() - dep.getTime();
  if (total <= 0) return 0;

  const nowLisbon = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
  const elapsed = nowLisbon.getTime() - dep.getTime();

  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  return Math.round((elapsed / total) * 100);
}

/**
 * Calculate driver price based on platform.
 */
export function calcDriverPrice(platform: string): number {
  if (!platform) return 10;
  return platform.toLowerCase().includes('talixo') ? 9 : 10;
}

/**
 * Get source label (TLX / WT / HUB) from trip data.
 */
export function getSourceLabel(trip: { platform?: string; id?: string }): string {
  const platform = (trip.platform || '').toLowerCase();
  const id = (trip.id || '').toLowerCase();
  const all = platform + ' ' + id;

  if (all.includes('talixo') || all.includes('tlx')) return 'TLX';

  if (platform.includes('world transfer') || platform === 'wt' ||
      platform.startsWith('wt ') || platform.startsWith('wt-') ||
      id.startsWith('wt-') || id.startsWith('wt ')) return 'WT';

  return 'HUB';
}

/**
 * Detect language from phone DDI.
 */
export function detectLangFromPhone(phone: string): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-().+]/g, '');

  // Try 3-digit DDIs first, then 2, then 1
  for (const len of [3, 2, 1]) {
    const prefix = clean.slice(0, len);
    if (DDI_LANG[prefix]) return DDI_LANG[prefix];
  }
  return null;
}

/**
 * Resolve language: use explicit lang field first, then DDI, then fallback to EN.
 */
export function resolveLanguage(lang: string, phone?: string): string {
  if (lang && lang.trim().length >= 2) {
    const l = lang.trim().toUpperCase().slice(0, 2);
    if (['PT', 'EN', 'ES', 'FR', 'IT', 'DE'].includes(l)) return l;
  }
  if (phone) {
    const detected = detectLangFromPhone(phone);
    if (detected) return detected;
  }
  return 'EN';
}

/**
 * Returns today's date in DD/MM/YYYY format (Europe/Lisbon timezone).
 */
export function todayStr(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now);

  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  return `${day}/${month}/${year}`;
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD.
 */
export function dateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

/**
 * Google Maps directions URL (from current location to address).
 */
export function getMapUrl(addr: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}

/**
 * Waze navigation URL.
 */
export function getWazeUrl(addr: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`;
}

/**
 * WhatsApp URL.
 */
export function getWhatsAppUrl(phone: string, text?: string): string {
  const clean = phone.replace(/[\s\-().+]/g, '');
  const base = `https://wa.me/${clean}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * SMS URL.
 */
export function getSmsUrl(phone: string, text?: string): string {
  const clean = phone.replace(/[\s\-().+]/g, '');
  const base = `sms:${clean}`;
  return text ? `${base}?body=${encodeURIComponent(text)}` : base;
}

// ── Message Templates ────────────────────────────────────────

type TemplateFn = (driver: string, client: string, origin?: string, hora?: string) => string;

export const TEMPLATES: Record<'CHEGADA' | 'RECOLHA', Record<string, TemplateFn>> = {
  CHEGADA: {
    PT: (driver, client) =>
      `Olá ${client}! 😊\nO seu motorista ${driver} da HUB Transfer estará à sua espera na zona de chegadas do Aeroporto de Lisboa.\nBem-vindo(a) a Portugal! 🇵🇹`,

    EN: (driver, client) =>
      `Hello ${client}! 😊\nYour driver ${driver} from HUB Transfer will be waiting for you at the arrivals area of Lisbon Airport.\nWelcome to Portugal! 🇵🇹`,

    ES: (driver, client) =>
      `¡Hola ${client}! 😊\nSu conductor ${driver} de HUB Transfer le estará esperando en la zona de llegadas del Aeropuerto de Lisboa.\n¡Bienvenido(a) a Portugal! 🇵🇹`,

    FR: (driver, client) =>
      `Bonjour ${client} ! 😊\nVotre chauffeur ${driver} de HUB Transfer vous attendra dans la zone des arrivées de l'Aéroport de Lisbonne.\nBienvenue au Portugal ! 🇵🇹`,

    IT: (driver, client) =>
      `Ciao ${client}! 😊\nIl tuo autista ${driver} di HUB Transfer ti aspetterà nell'area arrivi dell'Aeroporto di Lisbona.\nBenvenuto/a in Portogallo! 🇵🇹`,

    DE: (driver, client) =>
      `Hallo ${client}! 😊\nIhr Fahrer ${driver} von HUB Transfer wird Sie im Ankunftsbereich des Flughafens Lissabon erwarten.\nWillkommen in Portugal! 🇵🇹`,
  },

  RECOLHA: {
    PT: (driver, client, origin, hora) =>
      `Olá ${client}! 😊\nO seu motorista ${driver} da HUB Transfer irá buscá-lo(a) às ${hora || 'hora agendada'}.\n📍 Recolha: ${origin || 'o seu local'}\nPor favor esteja pronto(a) 5 minutos antes. Boa viagem! ✈️`,

    EN: (driver, client, origin, hora) =>
      `Hello ${client}! 😊\nYour driver ${driver} from HUB Transfer will pick you up at ${hora || 'the scheduled time'}.\n📍 Pick-up: ${origin || 'your location'}\nPlease be ready 5 minutes before. Have a safe trip! ✈️`,

    ES: (driver, client, origin, hora) =>
      `¡Hola ${client}! 😊\nSu conductor ${driver} de HUB Transfer le recogerá a las ${hora || 'hora programada'}.\n📍 Recogida: ${origin || 'su ubicación'}\nPor favor esté listo(a) 5 minutos antes. ¡Buen viaje! ✈️`,

    FR: (driver, client, origin, hora) =>
      `Bonjour ${client} ! 😊\nVotre chauffeur ${driver} de HUB Transfer viendra vous chercher à ${hora || "l'heure prévue"}.\n📍 Prise en charge : ${origin || 'votre adresse'}\nMerci d'être prêt(e) 5 minutes avant. Bon voyage ! ✈️`,

    IT: (driver, client, origin, hora) =>
      `Ciao ${client}! 😊\nIl tuo autista ${driver} di HUB Transfer verrà a prenderti alle ${hora || "l'orario previsto"}.\n📍 Ritiro: ${origin || 'la tua posizione'}\nPer favore sii pronto/a 5 minuti prima. Buon viaggio! ✈️`,

    DE: (driver, client, origin, hora) =>
      `Hallo ${client}! 😊\nIhr Fahrer ${driver} von HUB Transfer holt Sie um ${hora || 'zur geplanten Zeit'} ab.\n📍 Abholort: ${origin || 'Ihr Standort'}\nBitte seien Sie 5 Minuten vorher bereit. Gute Reise! ✈️`,
  },
};
