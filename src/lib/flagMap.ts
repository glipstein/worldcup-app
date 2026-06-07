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
  ALB: 'al', ANG: 'ao', AUS: 'au', AUT: 'at', BIH: 'ba',
  BOL: 'bo', CMR: 'cm', CAN: 'ca', CHI: 'cl', CIV: 'ci',
  CRC: 'cr', CUW: 'cw', CZE: 'cz', EGY: 'eg', GHA: 'gh',
  GRE: 'gr', GTM: 'gt', HAI: 'ht', HON: 'hn', HUN: 'hu',
  IDN: 'id', IRN: 'ir', JAM: 'jm', KEN: 'ke', KOR: 'kr',
  MLI: 'ml', NGA: 'ng', NZL: 'nz', PAN: 'pa', PAR: 'py',
  PER: 'pe', POL: 'pl', QAT: 'qa', ROU: 'ro', RSA: 'za',
  SAU: 'sa', SCO: 'gb-sct', SLV: 'sv', SRB: 'rs', SVK: 'sk',
  SVN: 'si', TAN: 'tz', TUR: 'tr', UKR: 'ua', VEN: 've',
};

export function getIso2(espnAbbr: string): string {
  return ESPN_TO_ISO2[espnAbbr] ?? '';
}
