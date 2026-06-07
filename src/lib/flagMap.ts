/**
 * Maps ESPN 3-letter abbreviations → ISO 3166-1 alpha-2 codes (lowercase)
 * used by flagcdn.com for flag images.
 *
 * Regional flags: gb-eng (England), gb-sct (Scotland)
 * flagcdn.com URL pattern: https://flagcdn.com/{W}x{H}/{code}.png
 */
export const ESPN_TO_ISO2: Record<string, string> = {
  // Drafted teams
  ARG: 'ar', BEL: 'be', BRA: 'br', COL: 'co', CRO: 'hr',
  ECU: 'ec', ENG: 'gb-eng', ESP: 'es', FRA: 'fr', GER: 'de',
  JPN: 'jp', MAR: 'ma', MEX: 'mx', NED: 'nl', NOR: 'no',
  POR: 'pt', SEN: 'sn', SUI: 'ch', URU: 'uy', USA: 'us',

  // Other WC 2026 teams
  ALB: 'al', ALG: 'dz', ANG: 'ao', AUS: 'au', AUT: 'at', BIH: 'ba',
  BOL: 'bo', CMR: 'cm', CAN: 'ca', CHI: 'cl', CIV: 'ci',
  COD: 'cd', CPV: 'cv', CRC: 'cr', CUB: 'cu', CUW: 'cw',
  CZE: 'cz', DEN: 'dk', DOM: 'do', EGY: 'eg', GHA: 'gh',
  GRE: 'gr', GTM: 'gt', GUI: 'gn', GUY: 'gy', HAI: 'ht',
  HON: 'hn', HUN: 'hu', IDN: 'id', IRN: 'ir', IRQ: 'iq',
  ISR: 'il', ITA: 'it', JAM: 'jm', JOR: 'jo', KEN: 'ke',
  KOR: 'kr', KUW: 'kw', MLI: 'ml', MLT: 'mt', MNG: 'mn',
  MOZ: 'mz', NGA: 'ng', NZL: 'nz', OMA: 'om', PAN: 'pa',
  PAR: 'py', PER: 'pe', PHI: 'ph', POL: 'pl', QAT: 'qa',
  KSA: 'sa',
  ROU: 'ro', RSA: 'za', SAU: 'sa', SCO: 'gb-sct', SLV: 'sv',
  SRB: 'rs', SUR: 'sr', SVK: 'sk', SVN: 'si', SWE: 'se',
  SYR: 'sy', TAN: 'tz', THA: 'th', TRI: 'tt', TUN: 'tn',
  TUR: 'tr', UAE: 'ae', UKR: 'ua', UZB: 'uz', VEN: 've',
  VIE: 'vn', WAL: 'gb-wls', ZAM: 'zm', ZIM: 'zw',
};

export function getIso2(espnAbbr: string): string {
  return ESPN_TO_ISO2[espnAbbr] ?? '';
}
