/**
 * Flight utilities — delay calculation and status helpers.
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
  if (delayMin >= 30) return '#EF5350';  // red — critical
  if (delayMin >= 15) return '#FFA726';  // orange — attention
  return '#F0D030';                       // gold — minor
}

/** Status dot color */
export function statusDotColor(statusVoo: string): string {
  const s = (statusVoo || '').toUpperCase();
  if (s === 'ATERRISADO' || s === 'LANDED') return '#7EAA6E';
  if (s === 'EN_VOO' || s === 'IN_FLIGHT' || s === 'AIRBORNE') return '#F0D030';
  if (s === 'MONITORANDO' || s === 'MONITORING') return '#60A5FA';
  if (s === 'ATRASADO' || s === 'DELAYED') return '#EF5350';
  return '#666666'; // AGUARDANDO or unknown
}

/** Human-readable status label */
export function statusLabel(statusVoo: string): string {
  const s = (statusVoo || '').toUpperCase();
  if (s === 'ATERRISADO' || s === 'LANDED') return 'Aterrou';
  if (s === 'EN_VOO' || s === 'IN_FLIGHT' || s === 'AIRBORNE') return 'Em voo';
  if (s === 'MONITORANDO' || s === 'MONITORING') return 'Monitorando';
  if (s === 'ATRASADO' || s === 'DELAYED') return 'Atrasado';
  return 'Aguardando';
}

/** Is flight actively tracked (has meaningful status) */
export function isFlightTracked(statusVoo: string): boolean {
  const s = (statusVoo || '').toUpperCase();
  return s !== '' && s !== 'AGUARDANDO';
}
