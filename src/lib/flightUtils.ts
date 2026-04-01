/**
 * Flight utilities — delay calculation and status helpers.
 * Status values from backend: AGENDADO, EM VOO, APROXIMACAO, ATERRISADO, CANCELADO
 */

/** Add delay minutes to a HH:MM time string */
export function getDelayedTime(pickupTime: string, delayMin: number): string {
  if (!pickupTime || !delayMin || delayMin <= 0) return '';
  const parts = pickupTime.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '';
  const totalMin = parts[0] * 60 + parts[1] + delayMin;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Delay severity color */
export function delayColor(delayMin: number): string {
  if (delayMin >= 30) return '#EF5350';
  if (delayMin >= 15) return '#FFA726';
  return '#F0D030';
}

/** Normalize statusVoo to uppercase key */
function norm(statusVoo: string): string {
  return (statusVoo || '').toUpperCase().replace(/[_\s]+/g, ' ').trim();
}

/** Status dot color */
export function statusDotColor(statusVoo: string): string {
  const s = norm(statusVoo);
  if (s === 'ATERRISADO' || s === 'LANDED') return '#7EAA6E';
  if (s === 'EM VOO' || s === 'EN VOO' || s === 'IN FLIGHT' || s === 'AIRBORNE') return '#F0D030';
  if (s === 'APROXIMACAO' || s === 'APPROACH') return '#60A5FA';
  if (s === 'CANCELADO' || s === 'CANCELLED' || s === 'CANCELED') return '#EF5350';
  if (s === 'ATRASADO' || s === 'DELAYED') return '#FFA726';
  if (s === 'AGENDADO' || s === 'SCHEDULED' || s === 'MONITORANDO' || s === 'MONITORING') return '#666666';
  return '#666666';
}

/** Human-readable status label */
export function statusLabel(statusVoo: string): string {
  const s = norm(statusVoo);
  if (s === 'ATERRISADO' || s === 'LANDED') return 'Aterrou';
  if (s === 'EM VOO' || s === 'EN VOO' || s === 'IN FLIGHT' || s === 'AIRBORNE') return 'Em voo';
  if (s === 'APROXIMACAO' || s === 'APPROACH') return 'Aproximação';
  if (s === 'CANCELADO' || s === 'CANCELLED' || s === 'CANCELED') return 'Cancelado';
  if (s === 'ATRASADO' || s === 'DELAYED') return 'Atrasado';
  if (s === 'AGENDADO' || s === 'SCHEDULED') return 'Agendado';
  if (s === 'MONITORANDO' || s === 'MONITORING') return 'Monitorando';
  return 'Aguardando';
}

/** Is flight actively tracked (has meaningful status beyond waiting) */
export function isFlightTracked(statusVoo: string): boolean {
  const s = norm(statusVoo);
  return s !== '' && s !== 'AGUARDANDO';
}

/** Get progress percentage from statusVoo (0-100) */
export function statusToProgress(statusVoo: string): number | null {
  const s = norm(statusVoo);
  if (s === 'AGENDADO' || s === 'SCHEDULED') return 0;
  if (s === 'EM VOO' || s === 'EN VOO' || s === 'IN FLIGHT' || s === 'AIRBORNE') return 50;
  if (s === 'APROXIMACAO' || s === 'APPROACH') return 80;
  if (s === 'ATERRISADO' || s === 'LANDED') return 100;
  if (s === 'CANCELADO' || s === 'CANCELLED' || s === 'CANCELED') return -1; // special: cancelled
  return null; // unknown — use time-based calc
}

/** Get bar color from statusVoo */
export function statusBarColor(statusVoo: string): string {
  const s = norm(statusVoo);
  if (s === 'ATERRISADO' || s === 'LANDED') return '#7EAA6E';
  if (s === 'CANCELADO' || s === 'CANCELLED' || s === 'CANCELED') return '#EF5350';
  if (s === 'APROXIMACAO' || s === 'APPROACH') return '#60A5FA';
  if (s === 'EM VOO' || s === 'EN VOO' || s === 'IN FLIGHT') return '#D4A847';
  return '#374151';
}
