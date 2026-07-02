// ─────────────────────────────────────────────────────────────────────────────
// Match-specific win probabilities + market-calibrated team strengths.
// Auto-updated every 6 hours by scripts/fetch-match-odds.mjs via GitHub Actions.
// Source: gamma-api.polymarket.com
//
// MATCH_ODDS key format: "HOMEABBR_AWAYABBR"  (ESPN API home/away designation)
//   pHome + pDraw + pAway = 1.0 (normalized from Polymarket 3-way market prices)
//
// MARKET_STRENGTH: derived from the "world-cup-winner" outright market.
//   Formula:  s = clamp( 50 + 50 × log₁₀(p / (1/48)) , 10, 100 )
//   Applied to all 48 WC teams. Teams below ~0.26% hit the floor of 10.
//
// Last fetched: 2026-07-02T19:07:18.038Z
// Match markets: 50 / 99
// Strength calibrations: 22 teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * 50 markets fetched on 2026-07-02T19:07:18.038Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  ARG_CPV: { pHome: 0.8444, pDraw: 0.1136, pAway: 0.0420 },
  AUS_EGY: { pHome: 0.2836, pDraw: 0.3333, pAway: 0.3831 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_SEN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BIH_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BRA_JPN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BRA_NOR: { pHome: 0.5176, pDraw: 0.2663, pAway: 0.2161 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_MAR: { pHome: 0.1841, pDraw: 0.2736, pAway: 0.5423 },
  CAN_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  CZE_RSA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ECU_GER: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  ENG_GHA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_AUT: { pHome: 0.7195, pDraw: 0.1870, pAway: 0.0935 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_IRQ: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_SWE: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_CIV: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_PAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  GHA_PAN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  IRQ_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  JPN_SWE: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  KSA_URU: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  MAR_HAI: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NOR_FRA: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  PAN_ENG: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  PAR_FRA: { pHome: 0.0448, pDraw: 0.1244, pAway: 0.8308 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  RSA_CAN: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SCO_BRA: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SCO_MAR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SEN_IRQ: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  SUI_BIH: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  SUI_CAN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  TUN_JPN: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  TUN_NED: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  URU_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  USA_AUS: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
};

/**
 * Market-calibrated team strengths (0-100) derived from Polymarket tournament
 * winner odds.  Used by simulation.ts as the fallback strength when no
 * match-specific market exists (e.g. hypothetical bracket paths).
 *
 * 22 teams covered. Teams at the floor (10) reflect market odds near zero.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
  FRA: 100,
  ARG: 97,
  ESP: 86,
  ENG: 79,
  BRA: 75,
  POR: 73,
  MEX: 62,
  MAR: 54,
  USA: 54,
  COL: 53,
  NOR: 47,
  BEL: 44,
  SUI: 28,
  CRO: 11,
  ALG: 10,
  AUS: 10,
  AUT: 10,
  CAN: 10,
  CPV: 10,
  EGY: 10,
  GHA: 10,
  PAR: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-07-02T19:07:18.038Z';
