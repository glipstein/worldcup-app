// ─────────────────────────────────────────────────────────────────────────────
// Team strength ratings (0–100 scale)
// Used by the simulation to compute win/draw/loss probabilities.
// Derived from pre-tournament betting odds / FIFA ranking estimates.
// Update these mid-tournament as form changes if desired.
// ─────────────────────────────────────────────────────────────────────────────

export const TEAM_STRENGTH: Record<string, number> = {
  // Drafted teams
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

  // Other WC 2026 teams (undrafted — needed for full bracket simulation)
  POL: 57, TUR: 59, AUT: 60, UKR: 56, ROU: 55, SVK: 52, HUN: 48,
  SRB: 58, ALB: 48, SVN: 52, GRE: 50, CZE: 57, SCO: 55,
  KOR: 56, AUS: 52, IRN: 48, SAU: 47, QAT: 40, IDN: 38,
  EGY: 51, NGA: 52, CMR: 49, GHA: 48, MLI: 46,
  RSA: 42, ANG: 40, TAN: 36, CIV: 56,
  CAN: 53, HON: 39, JAM: 41, PAN: 43, SLV: 38, HAI: 35, CUW: 32,
  VEN: 48, CHI: 50, BOL: 40, PAR: 47, PER: 49,
  NZL: 40, BIH: 44,
};

export function getStrength(abbr: string): number {
  return TEAM_STRENGTH[abbr] ?? 45; // fallback for unknown teams
}
