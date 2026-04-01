/** IATA airport code → ISO country code */
const AIRPORT_COUNTRY: Record<string, string> = {
  // Sérvia
  BEG: 'RS', NIS: 'RS',
  // Portugal
  LIS: 'PT', OPO: 'PT', FAO: 'PT', FNC: 'PT', PDL: 'PT', TER: 'PT',
  // UK
  LHR: 'GB', LGW: 'GB', STN: 'GB', LTN: 'GB', MAN: 'GB', EDI: 'GB',
  BRS: 'GB', BHX: 'GB', GLA: 'GB', LCY: 'GB',
  // França
  CDG: 'FR', ORY: 'FR', NCE: 'FR', LYS: 'FR', MRS: 'FR', TLS: 'FR',
  BOD: 'FR', NTE: 'FR',
  // Espanha
  MAD: 'ES', BCN: 'ES', AGP: 'ES', PMI: 'ES', ALC: 'ES', SVQ: 'ES',
  IBZ: 'ES', VLC: 'ES', BIO: 'ES', ACE: 'ES', TFS: 'ES',
  // Alemanha
  FRA: 'DE', MUC: 'DE', BER: 'DE', DUS: 'DE', HAM: 'DE', CGN: 'DE', STR: 'DE',
  // Itália
  FCO: 'IT', MXP: 'IT', CIA: 'IT', BGY: 'IT', NAP: 'IT', VCE: 'IT',
  BLQ: 'IT', PSA: 'IT', LIN: 'IT',
  // Holanda
  AMS: 'NL', EIN: 'NL', RTM: 'NL',
  // Bélgica
  BRU: 'BE', CRL: 'BE',
  // Suíça
  ZRH: 'CH', GVA: 'CH', BSL: 'CH',
  // Áustria
  VIE: 'AT',
  // Turquia
  IST: 'TR', SAW: 'TR', AYT: 'TR',
  // Grécia
  ATH: 'GR', SKG: 'GR', HER: 'GR',
  // Polónia
  WAW: 'PL', KRK: 'PL', WRO: 'PL',
  // Roménia
  OTP: 'RO', CLJ: 'RO',
  // Hungria
  BUD: 'HU',
  // República Checa
  PRG: 'CZ',
  // Dinamarca
  CPH: 'DK',
  // Suécia
  ARN: 'SE', GOT: 'SE',
  // Noruega
  OSL: 'NO', BGO: 'NO',
  // Finlândia
  HEL: 'FI',
  // Irlanda
  DUB: 'IE', SNN: 'IE', ORK: 'IE',
  // Luxemburgo
  LUX: 'LU',
  // Croácia
  ZAG: 'HR', SPU: 'HR', DBV: 'HR',
  // Bulgária
  SOF: 'BG',
  // Brasil
  GRU: 'BR', GIG: 'BR', BSB: 'BR', FOR: 'BR', REC: 'BR', SSA: 'BR',
  CNF: 'BR', CWB: 'BR', POA: 'BR',
  // EUA
  JFK: 'US', EWR: 'US', MIA: 'US', ORD: 'US', LAX: 'US', ATL: 'US',
  BOS: 'US', SFO: 'US', IAD: 'US',
  // Canadá
  YYZ: 'CA', YUL: 'CA', YVR: 'CA',
  // Marrocos
  CMN: 'MA', RAK: 'MA',
  // Emirados
  DXB: 'AE', AUH: 'AE',
  // Qatar
  DOH: 'QA',
  // Israel
  TLV: 'IL',
  // Rússia
  SVO: 'RU', DME: 'RU', LED: 'RU',
  // China
  PEK: 'CN', PVG: 'CN',
  // Japão
  NRT: 'JP', HND: 'JP',
  // Coreia do Sul
  ICN: 'KR',
  // Angola
  LAD: 'AO',
  // Moçambique
  MPM: 'MZ',
  // Cabo Verde
  SID: 'CV', RAI: 'CV',
  // Argentina
  EZE: 'AR',
  // Colômbia
  BOG: 'CO',
  // México
  MEX: 'MX',
  // Moldávia
  KIV: 'MD', RMO: 'MD',
  // Ucrânia
  KBP: 'UA', IEV: 'UA',
  // Geórgia
  TBS: 'GE',
  // Singapura
  SIN: 'SG',
  // Tailândia
  BKK: 'TH',
  // Índia
  DEL: 'IN', BOM: 'IN',
  // África do Sul
  JNB: 'ZA', CPT: 'ZA',
  // Austrália
  SYD: 'AU', MEL: 'AU',
  // Chipre
  LCA: 'CY',
  // Malta
  MLA: 'MT',
  // Egito
  CAI: 'EG',
  // Nigéria
  LOS: 'NG',
  // Islândia
  KEF: 'IS',
  // Eslovénia
  LJU: 'SI',
  // Quénia
  NBO: 'KE',
  // Nova Zelândia
  AKL: 'NZ',
};

/** Country ISO-2 → emoji flag */
function countryToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const u = code.toUpperCase();
  return String.fromCodePoint(
    u.charCodeAt(0) + 127397,
    u.charCodeAt(1) + 127397,
  );
}

/** Get origin flag emoji from IATA code. Returns '🌍' if IATA unknown, '' if no IATA. */
export function getOriginFlag(depIata: string): string {
  if (!depIata) return '';
  const country = AIRPORT_COUNTRY[depIata.toUpperCase().trim()];
  return country ? countryToFlag(country) : '🌍';
}

/** Get country code from IATA code */
export function getOriginCountryCode(depIata: string): string {
  if (!depIata) return '';
  return AIRPORT_COUNTRY[depIata.toUpperCase().trim()] || '';
}
