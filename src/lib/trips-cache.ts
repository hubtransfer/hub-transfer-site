// Trip data cache with timestamp for instant loading

const CACHE_KEY = "hub_trips_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  date: string; // which date this cache is for
}

export function getCachedTrips<T>(date: string): { data: T; age: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.date !== date) return null;
    const ageMs = Date.now() - entry.timestamp;
    if (ageMs > CACHE_TTL) return null;
    const ageSec = Math.round(ageMs / 1000);
    const age = ageSec < 60 ? `${ageSec}s` : `${Math.round(ageSec / 60)}min`;
    return { data: entry.data, age };
  } catch {
    return null;
  }
}

export function setCachedTrips<T>(data: T, date: string): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), date };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full — silently ignore
  }
}

export function getCacheTimestamp(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return new Date(entry.timestamp).toLocaleTimeString("pt-PT", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}
