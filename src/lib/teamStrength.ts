// ─────────────────────────────────────────────────────────────────────────────
// Team strength ratings (0–100 scale)
// Used by the simulation to compute win/draw/loss probabilities.
// Derived from Elo ratings computed over ~49k international matches
// (martj42/international_results dataset, updated June 2026).
// Auto-updated after each knockout round by scripts/update-strengths.mjs.
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_STRENGTH: Record<string, number> = {
  // ── Picks 1–5 ────────────────────────────────────────────────────────────────
  ARG: 100,  // Argentina — defending champions
  FRA: 100,  // France
  ENG: 88,  // England
  BRA: 78,  // Brazil
  ESP: 100,  // Spain
  GER: 68,  // Germany
  POR: 79,  // Portugal
  NED: 74,  // Netherlands
  MAR: 73,  // Morocco
  BEL: 67,  // Belgium
  URU: 58,  // Uruguay
  USA: 44,  // USA (host nation boost included; Elo base 44 + ~14 home-tournament adjustment)
  COL: 79,  // Colombia
  JPN: 64,  // Japan
  CRO: 63,  // Croatia
  SUI: 69,  // Switzerland
  SEN: 50,  // Senegal
  MEX: 71,  // Mexico (host nation boost included)
  ECU: 65,  // Ecuador
  NOR: 75,  // Norway

  // ── Picks 21–48 ──────────────────────────────────────────────────────────────
  CIV: 45,  // Ivory Coast
  TUR: 62,  // Turkey
  AUT: 52,  // Austria
  CAN: 46,  // Canada (host nation boost included)
  KOR: 47,  // South Korea
  SWE: 40,  // Sweden
  CZE: 34,  // Czechia
  EGY: 47,  // Egypt
  SCO: 44,  // Scotland
  PAR: 58,  // Paraguay
  AUS: 56,  // Australia
  ALG: 52,  // Algeria
  GHA: 24,  // Ghana
  BIH: 22,  // Bosnia & Herzegovina
  IRN: 53,  // Iran
  TUN: 25,  // Tunisia
  COD: 39,  // DR Congo
  KSA: 30,  // Saudi Arabia (ESPN abbr KSA; SAU alias kept below)
  UZB: 35,  // Uzbekistan
  RSA: 25,  // South Africa
  PAN: 38,  // Panama
  CPV: 28,  // Cape Verde
  JOR: 30,  // Jordan
  IRQ: 29,  // Iraq
  NZL: 24,  // New Zealand
  HAI: 22,  // Haiti
  CUW: 11,  // Curaçao
  QAT: 9,  // Qatar

  // ── Undrafted — still needed for full bracket simulation ─────────────────────
  SAU: 30,  // Saudi Arabia alias (ESPN sometimes uses SAU)
  ITA: 64,  // Italy
  DEN: 58,  // Denmark
  GEO: 24,  // Georgia
  POL: 36, UKR: 50, ROU: 27, SVK: 28, HUN: 39,
  SRB: 42, ALB: 20, SVN: 36, GRE: 42,
  IDN: 0,
  NGA: 48, CMR: 30, MLI: 28, ANG: 9, TAN: 0,
  HON: 31, JAM: 24, SLV: 0,
  VEN: 45, CHI: 40, BOL: 29, PER: 37,
};

export function getStrength(abbr: string): number {
  return TEAM_STRENGTH[abbr] ?? 45; // fallback for unknown teams
}
