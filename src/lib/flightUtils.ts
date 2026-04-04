/**
 * Flight utilities — real-time progress, delay, status helpers.
 * All data from backend only — NEVER call flight API from frontend.
 */

/** Parse HH:MM to minutes since midnight */
function toMin(t: string): number | null {
  if (!t) return null;
  // Handle "YYYY-MM-DD HH:MM" format → extract HH:MM
  const timePart = t.includes(' ') ? t.split(' ').pop()! : t;
  const [h, m] = timePart.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/** Parse full datetime "YYYY-MM-DD HH:MM" to epoch ms. Returns null if invalid. */
function toEpoch(full: string): number | null {
  if (!full || !full.includes(' ')) return null;
  const d = new Date(full.replace(' ', 'T') + ':00');
  return isNaN(d.getTime()) ? null : d.getTime();
}

/** Minutes since midnight for Lisbon NOW */
function nowMin(): number {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
  return now.getHours() * 60 + now.getMinutes();
}

/** Format minutes to HH:MM */
function minToStr(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Add delay minutes to a HH:MM time string */
export function getDelayedTime(pickupTime: string, delayMin: number): string {
  if (!pickupTime || !delayMin || delayMin <= 0) return '';
  const m = toMin(pickupTime);
  if (m === null) return '';
  return minToStr(m + delayMin);
}

/** Delay severity color */
export function delayColor(delayMin: number): string {
  if (delayMin >= 30) return '#EF5350';
  if (delayMin >= 15) return '#FFA726';
  return '#F5C518';
}

// ─── Operational flight state ───

export interface FlightState {
  progress: number;    // 0-100
  color: string;       // bar + plane color
  pulse: boolean;      // animate pulse
  cancelled: boolean;
  noData: boolean;     // no dep/arr times at all
  statusText: string;  // operational message for driver
}

const CLR_GREY    = '#6B7280';
const CLR_BLUE    = '#3B82F6';
const CLR_GOLD    = '#F5C518';
const CLR_ORANGE  = '#F97316';
const CLR_GREEN   = '#22C55E';
const CLR_RED     = '#EF4444';

/** Normalize status string */
function norm(s: string): string {
  return (s || '').toUpperCase().replace(/[_\s]+/g, ' ').trim();
}

/** Compute real-time flight state from backend data */
export function computeFlightState(
  depTime: string,
  arrTime: string,
  pickupTime: string,
  statusVoo: string,
  atrasoMin: number,
  etaChegada?: string,
  depActualFull?: string,
  etaChegadaFull?: string,
): FlightState {
  const st = norm(statusVoo);
  if (st === 'CANCELADO' || st === 'CANCELLED' || st === 'CANCELED') {
    return { progress: 0, color: CLR_RED, pulse: false, cancelled: true, noData: false, statusText: '❌ Voo cancelado' };
  }
  if (st === 'ATERRISADO' || st === 'LANDED') {
    const arr = arrTime || etaChegada || pickupTime;
    return { progress: 100, color: CLR_GREEN, pulse: false, cancelled: false, noData: false, statusText: `✅ Aterrisou às ${arr}` };
  }
  const bestArrTime = arrTime || etaChegada || '';
  const hasRealDep = !!depTime && depTime.trim() !== '';
  const hasArrEstimate = !!bestArrTime && bestArrTime.trim() !== '';
  if (!hasRealDep && !hasArrEstimate) {
    return { progress: 0, color: CLR_GREY, pulse: false, cancelled: false, noData: true, statusText: 'Monitoramento em breve' };
  }
  const depM = toMin(depTime);
  const arrM = toMin(bestArrTime) ?? toMin(pickupTime);
  if (depM === null && arrM === null) {
    return { progress: 0, color: CLR_GREY, pulse: false, cancelled: false, noData: true, statusText: 'Monitoramento em breve' };
  }
  const now = nowMin();
  if (depM === null && arrM !== null) {
    const remaining = arrM - now;
    if (remaining <= 0) return { progress: 98, color: CLR_ORANGE, pulse: true, cancelled: false, noData: false, statusText: 'A aterrar agora!' };
    if (remaining <= 15) return { progress: 90, color: CLR_ORANGE, pulse: true, cancelled: false, noData: false, statusText: `A aterrar em ${remaining}min!` };
    if (remaining <= 45) return { progress: 70, color: CLR_GOLD, pulse: false, cancelled: false, noData: false, statusText: `A caminho · Chega em ${remaining}min` };
    const hh = Math.floor(remaining / 60);
    const mm = remaining % 60;
    return { progress: 40, color: CLR_BLUE, pulse: false, cancelled: false, noData: false, statusText: hh > 0 ? `Em voo · Chega em ${hh}h ${String(mm).padStart(2, '0')}min` : `Em voo · Chega em ${mm}min` };
  }
  // Precision calculation: use full datetime strings when available (epoch-based)
  const depFull = depActualFull || '';
  const arrFull = etaChegadaFull || '';
  const depEpoch = toEpoch(depFull) ?? (depTime.length > 10 ? toEpoch(depTime) : null);
  const arrEpoch = toEpoch(arrFull) ?? ((etaChegada || '').length > 10 ? toEpoch(etaChegada || '') : null);
  let pct: number;
  let remaining: number;
  if (depEpoch && arrEpoch) {
    // Precise epoch-based progress
    const nowMs = Date.now();
    const totalMs = Math.max(arrEpoch - depEpoch, 60000);
    pct = Math.max(0, Math.min(100, ((nowMs - depEpoch) / totalMs) * 100));
    remaining = Math.max(0, Math.round((arrEpoch - nowMs) / 60000));
  } else {
    // Fallback: minute-based
    const duration = Math.max((arrM ?? depM! + 120) - depM!, 1);
    const elapsed = now - depM!;
    remaining = (arrM ?? depM! + 120) - now;
    pct = Math.max(0, Math.min(100, (elapsed / duration) * 100));
  }
  if (st === 'AGUARDANDO' || st === 'PENDENTE FT' || st === 'AGENDADO' || st === 'SCHEDULED' || now < depM!) {
    const untilDep = depM! - now;
    if (untilDep <= 0) {
      if (atrasoMin > 0) {
        return { progress: 0, color: CLR_ORANGE, pulse: true, cancelled: false, noData: false, statusText: `Partida atrasada +${atrasoMin}min` };
      }
      return { progress: 0, color: CLR_GREY, pulse: false, cancelled: false, noData: false, statusText: 'Aguardando descolagem' };
    }
    const hh = Math.floor(untilDep / 60);
    const mm = untilDep % 60;
    let txt: string;
    if (atrasoMin > 0) {
      txt = hh > 0 ? `Decola em ${hh}h ${mm}min (atraso +${atrasoMin}min)` : `Decola em ${mm}min (atraso +${atrasoMin}min)`;
    } else {
      txt = hh > 0 ? `Decola em ${hh}h ${mm}min` : `Decola em ${mm}min`;
    }
    return { progress: 0, color: CLR_GREY, pulse: false, cancelled: false, noData: false, statusText: txt };
  }
  if (remaining <= 0) {
    return { progress: 98, color: CLR_ORANGE, pulse: true, cancelled: false, noData: false, statusText: 'A aterrar agora!' };
  }
  if (remaining <= 15) {
    return { progress: pct, color: CLR_ORANGE, pulse: true, cancelled: false, noData: false, statusText: `A aterrar em ${remaining}min!` };
  }
  if (remaining <= 45) {
    return { progress: pct, color: CLR_GOLD, pulse: false, cancelled: false, noData: false, statusText: `A caminho · Chega em ${remaining}min` };
  }
  const hh = Math.floor(remaining / 60);
  const mm = remaining % 60;
  const txt = hh > 0 ? `Em voo · Chega em ${hh}h ${String(mm).padStart(2, '0')}min` : `Em voo · Chega em ${mm}min`;
  return { progress: pct, color: CLR_BLUE, pulse: false, cancelled: false, noData: false, statusText: txt };
}

// ─── Legacy exports (used elsewhere) ───

export function statusDotColor(statusVoo: string): string {
  const s = norm(statusVoo);
  if (s === 'ATERRISADO' || s === 'LANDED') return CLR_GREEN;
  if (s.includes('VOO') || s.includes('FLIGHT') || s === 'AIRBORNE') return CLR_BLUE;
  if (s === 'APROXIMACAO' || s === 'APPROACH') return CLR_GOLD;
  if (s === 'CANCELADO' || s.includes('CANCEL')) return CLR_RED;
  return CLR_GREY;
}

export function statusLabel(statusVoo: string): string {
  const s = norm(statusVoo);
  if (s === 'ATERRISADO' || s === 'LANDED') return 'Aterrou';
  if (s.includes('VOO') || s.includes('FLIGHT')) return 'Em voo';
  if (s === 'APROXIMACAO' || s === 'APPROACH') return 'Aproximação';
  if (s === 'CANCELADO' || s.includes('CANCEL')) return 'Cancelado';
  if (s === 'AGENDADO' || s === 'SCHEDULED') return 'Agendado';
  return 'Aguardando';
}

export function isFlightTracked(statusVoo: string): boolean {
  const s = norm(statusVoo);
  return s !== '' && s !== 'AGUARDANDO';
}

export function statusToProgress(statusVoo: string): number | null {
  return null; // deprecated — use computeFlightState instead
}

export function statusBarColor(statusVoo: string): string {
  return statusDotColor(statusVoo);
}
