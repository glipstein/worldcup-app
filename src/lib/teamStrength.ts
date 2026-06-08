// ─────────────────────────────────────────────────────────────────────────────
// Team strength ratings (0–100 scale)
// Used by the simulation to compute win/draw/loss probabilities.
// Derived from Elo ratings computed over ~49k international matches
// (martj42/international_results dataset, updated June 2026).
// Auto-updated after each knockout round by scripts/update-strengths.mjs.
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_STRENGTH: Record<string, number> = {
  // ── Picks 1–5 ────────────────────────────────────────────────────────────────
  ARG: 95,  // Argentina — defending champions
  FRA: 86,  // France
  ENG: 77,  // England
  BRA: 77,  // Brazil
  ESP: 100,  // Spain
  GER: 70,  // Germany
  POR: 79,  // Portugal
  NED: 68,  // Netherlands
  MAR: 68,  // Morocco
  BEL: 59,  // Belgium
  URU: 66,  // Uruguay
  USA: 44,  // USA (host nation boost included)
  COL: 75,  // Colombia
  JPN: 68,  // Japan
  CRO: 66,  // Croatia
  SUI: 59,  // Switzerland
  SEN: 59,  // Senegal
  MEX: 69,  // Mexico (host nation boost included)
  ECU: 74,  // Ecuador
  NOR: 60,  // Norway

  // ── Picks 21–48 ──────────────────────────────────────────────────────────────
  CIV: 42,  // Ivory Coast
  TUR: 67,  // Turkey
  AUT: 52,  // Austria
  CAN: 54,  // Canada (host nation boost included)
  KOR: 54,  // South Korea
  SWE: 37,  // Sweden
  CZE: 40,  // Czechia
  EGY: 42,  // Egypt
  SCO: 47,  // Scotland
  PAR: 59,  // Paraguay
  AUS: 56,  // Australia
  ALG: 54,  // Algeria
  GHA: 15,  // Ghana
  BIH: 19,  // Bosnia & Herzegovina
  IRN: 55,  // Iran
  TUN: 33,  // Tunisia
  COD: 36,  // DR Congo
  KSA: 27,  // Saudi Arabia (ESPN abbr KSA; SAU alias kept below)
  UZB: 46,  // Uzbekistan
  RSA: 21,  // South Africa
  PAN: 51,  // Panama
  CPV: 22,  // Cape Verde
  JOR: 38,  // Jordan
  IRQ: 38,  // Iraq
  NZL: 28,  // New Zealand
  HAI: 29,  // Haiti
  CUW: 11,  // Curaçao
  QAT: 11,  // Qatar

  // ── Undrafted — still needed for full bracket simulation ─────────────────────
  SAU: 27,  // Saudi Arabia alias (ESPN sometimes uses SAU)
  ITA: 64,  // Italy
  DEN: 58,  // Denmark
  GEO: 24,  // Georgia
  POL: 36, UKR: 50, ROU: 27, SVK: 28, HUN: 39,
  SRB: 42, ALB: 20, SVN: 36, GRE: 42,
  IDN: 0,
  NGA: 49, CMR: 30, MLI: 28, ANG: 8, TAN: 0,
  HON: 31, JAM: 24, SLV: 0,
  VEN: 43, CHI: 38, BOL: 30, PER: 37,
};

export function getStrength(abbr: string): number {
  return TEAM_STRENGTH[abbr] ?? 45; // fallback for unknown teams
}
