import { describe, it, expect } from 'vitest';
import { getIso2, ESPN_TO_ISO2 } from './flagMap';

/**
 * All ESPN abbreviations we expect to appear in WC 2026 data.
 * Add new entries here whenever the API reveals a new team abbr.
 * The test below will fail until a mapping is added to flagMap.ts.
 */
const WC2026_EXPECTED: string[] = [
  // ── Drafted teams ────────────────────────────────────────────
  'ARG', 'BEL', 'BRA', 'COL', 'CRO',
  'ECU', 'ENG', 'ESP', 'FRA', 'GER',
  'JPN', 'MAR', 'MEX', 'NED', 'NOR',
  'POR', 'SEN', 'SUI', 'URU', 'USA',

  // ── UEFA ─────────────────────────────────────────────────────
  'AUT', 'CZE', 'DEN', 'GRE', 'HUN',
  'POL', 'ROU', 'SCO', 'SRB', 'SVK',
  'SVN', 'SWE', 'TUR', 'UKR', 'WAL',

  // ── CONMEBOL ──────────────────────────────────────────────────
  'BOL', 'CHI', 'PAR', 'PER', 'VEN',

  // ── CONCACAF ──────────────────────────────────────────────────
  'CAN', 'CRC', 'CUB', 'CUW', 'DOM',
  'GTM', 'HAI', 'HON', 'JAM', 'PAN', 'SLV', 'TRI',

  // ── CAF ───────────────────────────────────────────────────────
  'ALG', 'ANG', 'CMR', 'COD', 'CPV',
  'EGY', 'GHA', 'GUI', 'KEN', 'MLI',
  'MOZ', 'NGA', 'RSA', 'TAN', 'TUN', 'ZAM', 'ZIM',

  // ── AFC ───────────────────────────────────────────────────────
  'AUS', 'IDN', 'IRN', 'IRQ', 'JOR',
  'KOR', 'KSA', 'KUW', 'OMA', 'QAT',
  'SYR', 'THA', 'UAE', 'UZB', 'VIE',

  // ── OFC ───────────────────────────────────────────────────────
  'NZL',

  // ── Others in ESPN data ───────────────────────────────────────
  'ALB', 'BIH', 'GUY', 'ISR', 'MNG', 'PHI', 'SUR',
];

describe('flagMap', () => {
  it('every expected WC 2026 ESPN abbreviation has a non-empty ISO2 mapping', () => {
    const missing: string[] = [];
    for (const abbr of WC2026_EXPECTED) {
      if (!getIso2(abbr)) missing.push(abbr);
    }
    expect(
      missing,
      `Missing flag mappings — add these to flagMap.ts:\n  ${missing.join(', ')}`
    ).toHaveLength(0);
  });

  it('all ISO2 values are valid-looking codes (lowercase letters, optional hyphen suffix)', () => {
    const invalid: Array<[string, string]> = [];
    for (const [abbr, iso2] of Object.entries(ESPN_TO_ISO2)) {
      // Valid: "gb-eng", "gb-sct", "gb-wls", or any 2-letter code
      if (!/^[a-z]{2}(-[a-z]+)?$/.test(iso2)) {
        invalid.push([abbr, iso2]);
      }
    }
    const msg = invalid.map(([a, v]) => `${a}→"${v}"`).join(', ');
    expect(invalid, `Invalid ISO2 codes in flagMap.ts: ${msg}`).toHaveLength(0);
  });

  it('KSA resolves to Saudi Arabia flag (sa)', () => {
    expect(getIso2('KSA')).toBe('sa');
  });

  it('ALG resolves to Algeria flag (dz)', () => {
    expect(getIso2('ALG')).toBe('dz');
  });

  it('ENG resolves to England regional flag (gb-eng)', () => {
    expect(getIso2('ENG')).toBe('gb-eng');
  });

  it('unknown abbreviation returns empty string', () => {
    expect(getIso2('XYZ')).toBe('');
  });
});
