/** IATA airport code → ISO country code (alpha-2) */
const AIRPORT_COUNTRY: Record<string, string> = {
  // Portugal
  LIS: 'PT', OPO: 'PT', FAO: 'PT', FNC: 'PT', PDL: 'PT', TER: 'PT', HOR: 'PT', PXO: 'PT',
  // UK
  LHR: 'GB', LGW: 'GB', STN: 'GB', LTN: 'GB', MAN: 'GB', BHX: 'GB', EDI: 'GB', GLA: 'GB',
  BRS: 'GB', EMA: 'GB', NCL: 'GB', LPL: 'GB', ABZ: 'GB', SOU: 'GB', LCY: 'GB', BFS: 'GB',
  LBA: 'GB',
  // Irlanda
  DUB: 'IE', ORK: 'IE', SNN: 'IE',
  // França
  CDG: 'FR', ORY: 'FR', LYS: 'FR', MRS: 'FR', NCE: 'FR', TLS: 'FR', BOD: 'FR', NTE: 'FR',
  SXB: 'FR', MPL: 'FR', BIQ: 'FR', BVA: 'FR', LIL: 'FR',
  // Espanha
  MAD: 'ES', BCN: 'ES', AGP: 'ES', ALC: 'ES', PMI: 'ES', IBZ: 'ES', TFS: 'ES', LPA: 'ES',
  ACE: 'ES', FUE: 'ES', VLC: 'ES', SVQ: 'ES', BIO: 'ES', SCQ: 'ES', VGO: 'ES', ZAZ: 'ES',
  MAH: 'ES', OVD: 'ES', GRX: 'ES', XRY: 'ES', SDR: 'ES', TFN: 'ES',
  // Alemanha
  FRA: 'DE', MUC: 'DE', BER: 'DE', DUS: 'DE', HAM: 'DE', CGN: 'DE', STR: 'DE',
  NUE: 'DE', HAJ: 'DE', LEJ: 'DE', DTM: 'DE', FMM: 'DE', HHN: 'DE',
  // Itália
  FCO: 'IT', MXP: 'IT', LIN: 'IT', BGY: 'IT', VCE: 'IT', NAP: 'IT', BLQ: 'IT', PSA: 'IT',
  CTA: 'IT', PMO: 'IT', FLR: 'IT', TRN: 'IT', BRI: 'IT', CAG: 'IT', CIA: 'IT',
  TSF: 'IT', GOA: 'IT',
  // Holanda
  AMS: 'NL', EIN: 'NL', RTM: 'NL',
  // Bélgica
  BRU: 'BE', CRL: 'BE', ANR: 'BE',
  // Luxemburgo
  LUX: 'LU',
  // Suíça
  ZRH: 'CH', GVA: 'CH', BSL: 'CH',
  // Áustria
  VIE: 'AT', SZG: 'AT', INN: 'AT',
  // Dinamarca
  CPH: 'DK', BLL: 'DK', AAL: 'DK',
  // Noruega
  OSL: 'NO', BGO: 'NO', TRF: 'NO',
  // Suécia
  ARN: 'SE', GOT: 'SE', NYO: 'SE', MMX: 'SE',
  // Finlândia
  HEL: 'FI', TMP: 'FI',
  // Polónia
  WAW: 'PL', WMI: 'PL', KRK: 'PL', WRO: 'PL', GDN: 'PL', POZ: 'PL', KTW: 'PL',
  // Eslováquia
  BTS: 'SK',
  // Bálticos
  TLL: 'EE', RIX: 'LV', VNO: 'LT',
  // República Checa
  PRG: 'CZ',
  // Hungria
  BUD: 'HU',
  // Roménia
  OTP: 'RO', CLJ: 'RO',
  // Bulgária
  SOF: 'BG',
  // Croácia
  ZAG: 'HR', SPU: 'HR', DBV: 'HR',
  // Eslovénia
  LJU: 'SI',
  // Sérvia
  BEG: 'RS', NIS: 'RS',
  // Macedónia do Norte
  SKP: 'MK',
  // Albânia
  TIA: 'AL',
  // Grécia
  ATH: 'GR', SKG: 'GR', HER: 'GR', RHO: 'GR', CFU: 'GR', JMK: 'GR', JTR: 'GR',
  // Turquia
  IST: 'TR', SAW: 'TR', AYT: 'TR', ADB: 'TR',
  // Chipre
  LCA: 'CY', PFO: 'CY', ERN: 'CY',
  // Malta
  MLA: 'MT',
  // Islândia
  KEF: 'IS',
  // Marrocos
  CMN: 'MA', RAK: 'MA', FEZ: 'MA', AGA: 'MA', TNG: 'MA', RBA: 'MA',
  // Tunísia
  TUN: 'TN',
  // Argélia
  ALG: 'DZ',
  // Egito
  CAI: 'EG',
  // Brasil
  GRU: 'BR', GIG: 'BR', BSB: 'BR', CNF: 'BR', SSA: 'BR', REC: 'BR', FOR: 'BR',
  CWB: 'BR', POA: 'BR', VCP: 'BR', MAO: 'BR', BEL: 'BR', NAT: 'BR', MCZ: 'BR',
  // EUA
  JFK: 'US', EWR: 'US', BOS: 'US', IAD: 'US', MIA: 'US', ATL: 'US', ORD: 'US',
  LAX: 'US', SFO: 'US', DFW: 'US', IAH: 'US', PHL: 'US', CLT: 'US',
  // Canadá
  YYZ: 'CA', YUL: 'CA', YVR: 'CA', YYC: 'CA',
  // Emirados
  DXB: 'AE', AUH: 'AE',
  // Qatar
  DOH: 'QA',
  // Arábia Saudita
  RUH: 'SA', JED: 'SA',
  // Israel
  TLV: 'IL',
  // Jordânia
  AMM: 'JO',
  // Kuwait
  KWI: 'KW',
  // Barém
  BAH: 'BH',
  // Omã
  MCT: 'OM',
  // China
  PEK: 'CN', PVG: 'CN',
  // Hong Kong
  HKG: 'HK',
  // Coreia do Sul
  ICN: 'KR',
  // Japão
  NRT: 'JP', KIX: 'JP', HND: 'JP',
  // Singapura
  SIN: 'SG',
  // Tailândia
  BKK: 'TH',
  // Malásia
  KUL: 'MY',
  // Índia
  DEL: 'IN', BOM: 'IN',
  // Filipinas
  MNL: 'PH',
  // África do Sul
  JNB: 'ZA', CPT: 'ZA',
  // Nigéria
  LOS: 'NG',
  // Gana
  ACC: 'GH',
  // Senegal
  DSS: 'SN', DKR: 'SN',
  // Guiné-Bissau
  OXB: 'GW',
  // São Tomé e Príncipe
  TMS: 'ST',
  // Angola
  LAD: 'AO',
  // Moçambique
  MPM: 'MZ',
  // Zâmbia
  LUN: 'ZM',
  // Quénia
  NBO: 'KE',
  // Cabo Verde
  SID: 'CV', RAI: 'CV', BVC: 'CV', VXE: 'CV',
  // Argentina
  EZE: 'AR', AEP: 'AR',
  // Chile
  SCL: 'CL',
  // Peru
  LIM: 'PE',
  // Colômbia
  BOG: 'CO',
  // Venezuela
  CCS: 'VE',
  // Uruguai
  MVD: 'UY',
  // Panamá
  PTY: 'PA',
  // México
  MEX: 'MX', CUN: 'MX',
  // Rússia
  SVO: 'RU', DME: 'RU', LED: 'RU',
  // Ucrânia
  KBP: 'UA', IEV: 'UA',
  // Moldávia
  KIV: 'MD', RMO: 'MD',
  // Geórgia
  TBS: 'GE',
  // Austrália
  SYD: 'AU', MEL: 'AU',
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

/** Get origin flag emoji from IATA code. Returns '' if IATA unknown or missing — the UI then shows only the code, never a placeholder. */
export function getOriginFlag(depIata: string): string {
  if (!depIata) return '';
  const country = AIRPORT_COUNTRY[depIata.toUpperCase().trim()];
  return country ? countryToFlag(country) : '';
}

/** Get country code from IATA code */
export function getOriginCountryCode(depIata: string): string {
  if (!depIata) return '';
  return AIRPORT_COUNTRY[depIata.toUpperCase().trim()] || '';
}
