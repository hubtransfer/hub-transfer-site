/**
 * Flight origin cache — stores manually-set departure airports in localStorage.
 * Key format: flight_origin_{flightNumber}_{date}
 * When backend eventually provides departure_iata, this cache becomes unnecessary.
 */

const CACHE_KEY_PREFIX = "hub_flight_origin_";

/** Build cache key from flight + date */
function cacheKey(flight: string, date?: string): string {
  const f = flight.replace(/\s+/g, "").toUpperCase();
  const d = date || new Date().toISOString().slice(0, 10);
  return `${CACHE_KEY_PREFIX}${f}_${d}`;
}

/** Get cached departure IATA for a flight */
export function getCachedOrigin(flight: string, date?: string): string | null {
  if (!flight) return null;
  try {
    return localStorage.getItem(cacheKey(flight, date)) || null;
  } catch {
    return null;
  }
}

/** Set departure IATA for a flight */
export function setCachedOrigin(flight: string, iata: string, date?: string): void {
  if (!flight || !iata) return;
  try {
    localStorage.setItem(cacheKey(flight, date), iata.toUpperCase());
  } catch { /* quota exceeded */ }
}

/**
 * Top airports for flights arriving at LIS — ordered by frequency.
 * Each entry: [IATA, city name, country ISO-2]
 */
export const TOP_AIRPORTS: [string, string, string][] = [
  // UK & Ireland — biggest source markets
  ["LHR", "London Heathrow", "GB"],
  ["LGW", "London Gatwick", "GB"],
  ["STN", "London Stansted", "GB"],
  ["LTN", "London Luton", "GB"],
  ["MAN", "Manchester", "GB"],
  ["EDI", "Edinburgh", "GB"],
  ["BRS", "Bristol", "GB"],
  ["BHX", "Birmingham", "GB"],
  ["GLA", "Glasgow", "GB"],
  ["DUB", "Dublin", "IE"],
  ["SNN", "Shannon", "IE"],
  // France
  ["CDG", "Paris CDG", "FR"],
  ["ORY", "Paris Orly", "FR"],
  ["LYS", "Lyon", "FR"],
  ["MRS", "Marseille", "FR"],
  ["TLS", "Toulouse", "FR"],
  ["BOD", "Bordeaux", "FR"],
  ["NTE", "Nantes", "FR"],
  ["NCE", "Nice", "FR"],
  // Germany
  ["FRA", "Frankfurt", "DE"],
  ["MUC", "Munich", "DE"],
  ["BER", "Berlin", "DE"],
  ["DUS", "Düsseldorf", "DE"],
  ["HAM", "Hamburg", "DE"],
  ["CGN", "Cologne", "DE"],
  ["STR", "Stuttgart", "DE"],
  // Spain
  ["MAD", "Madrid", "ES"],
  ["BCN", "Barcelona", "ES"],
  ["AGP", "Málaga", "ES"],
  ["SVQ", "Seville", "ES"],
  ["PMI", "Palma", "ES"],
  // Italy
  ["FCO", "Rome", "IT"],
  ["MXP", "Milan Malpensa", "IT"],
  ["BGY", "Milan Bergamo", "IT"],
  ["NAP", "Naples", "IT"],
  ["VCE", "Venice", "IT"],
  ["BLQ", "Bologna", "IT"],
  // Benelux
  ["AMS", "Amsterdam", "NL"],
  ["EIN", "Eindhoven", "NL"],
  ["BRU", "Brussels", "BE"],
  ["CRL", "Brussels Charleroi", "BE"],
  // Switzerland / Austria
  ["ZRH", "Zürich", "CH"],
  ["GVA", "Geneva", "CH"],
  ["VIE", "Vienna", "AT"],
  // Scandinavia
  ["CPH", "Copenhagen", "DK"],
  ["ARN", "Stockholm", "SE"],
  ["OSL", "Oslo", "NO"],
  ["HEL", "Helsinki", "FI"],
  // Eastern Europe
  ["WAW", "Warsaw", "PL"],
  ["PRG", "Prague", "CZ"],
  ["BUD", "Budapest", "HU"],
  ["OTP", "Bucharest", "RO"],
  ["ATH", "Athens", "GR"],
  // Turkey / Middle East
  ["IST", "Istanbul", "TR"],
  ["DXB", "Dubai", "AE"],
  ["DOH", "Doha", "QA"],
  ["TLV", "Tel Aviv", "IL"],
  // Morocco
  ["CMN", "Casablanca", "MA"],
  ["RAK", "Marrakech", "MA"],
  // Americas
  ["JFK", "New York JFK", "US"],
  ["EWR", "Newark", "US"],
  ["BOS", "Boston", "US"],
  ["MIA", "Miami", "US"],
  ["IAD", "Washington", "US"],
  ["ORD", "Chicago", "US"],
  ["YYZ", "Toronto", "CA"],
  ["YUL", "Montreal", "CA"],
  ["GRU", "São Paulo", "BR"],
  ["GIG", "Rio de Janeiro", "BR"],
  // Portugal (internal)
  ["OPO", "Porto", "PT"],
  ["FAO", "Faro", "PT"],
  ["FNC", "Funchal", "PT"],
  ["PDL", "Ponta Delgada", "PT"],
];
