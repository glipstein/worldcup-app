// ─────────────────────────────────────────────────────────────────────────────
// Team strength ratings (0–100 scale)
// Used by the simulation to compute win/draw/loss probabilities.
// Derived from pre-tournament betting odds / FIFA ranking estimates.
// Update these mid-tournament as form changes if desired.
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_STRENGTH: Record<string, number> = {
  // ── Picks 1–5 ────────────────────────────────────────────────────────────────
  ARG: 92,  // Argentina — defending champions
  FRA: 90,  // France
  ENG: 87,  // England
  BRA: 86,  // Brazil
  ESP: 84,  // Spain
  GER: 83,  // Germany
  POR: 81,  // Portugal
  NED: 79,  // Netherlands
  MAR: 73,  // Morocco
  BEL: 70,  // Belgium
  URU: 68,  // Uruguay
  USA: 65,  // USA (host nation boost included)
  COL: 63,  // Colombia
  JPN: 62,  // Japan
  CRO: 60,  // Croatia
  SUI: 58,  // Switzerland
  SEN: 55,  // Senegal
  MEX: 54,  // Mexico (host nation boost included)
  ECU: 50,  // Ecuador
  NOR: 48,  // Norway

  // ── Picks 21–48 ──────────────────────────────────────────────────────────────
  CIV: 56,  // Ivory Coast
  TUR: 59,  // Turkey
  AUT: 60,  // Austria
  CAN: 53,  // Canada (host nation boost included)
  KOR: 56,  // South Korea
  SWE: 57,  // Sweden
  CZE: 57,  // Czechia
  EGY: 51,  // Egypt
  SCO: 55,  // Scotland
  PAR: 47,  // Paraguay
  AUS: 52,  // Australia
  ALG: 50,  // Algeria
  GHA: 48,  // Ghana
  BIH: 44,  // Bosnia & Herzegovina
  IRN: 48,  // Iran
  TUN: 47,  // Tunisia
  COD: 44,  // DR Congo
  KSA: 47,  // Saudi Arabia (ESPN abbr KSA; SAU alias kept below)
  UZB: 43,  // Uzbekistan
  RSA: 42,  // South Africa
  PAN: 43,  // Panama
  CPV: 43,  // Cape Verde
  JOR: 40,  // Jordan
  IRQ: 44,  // Iraq
  NZL: 40,  // New Zealand
  HAI: 35,  // Haiti
  CUW: 32,  // Curaçao
  QAT: 40,  // Qatar

  // ── Undrafted — still needed for full bracket simulation ─────────────────────
  SAU: 47,  // Saudi Arabia alias (ESPN sometimes uses SAU)
  ITA: 75,  // Italy
  DEN: 65,  // Denmark
  GEO: 48,  // Georgia
  POL: 57, UKR: 56, ROU: 55, SVK: 52, HUN: 48,
  SRB: 58, ALB: 48, SVN: 52, GRE: 50,
  IDN: 38,
  NGA: 52, CMR: 49, MLI: 46, ANG: 40, TAN: 36,
  HON: 39, JAM: 41, SLV: 38,
  VEN: 48, CHI: 50, BOL: 40, PER: 49,
};

export function getStrength(abbr: string): number {
  return TEAM_STRENGTH[abbr] ?? 45; // fallback for unknown teams
}
