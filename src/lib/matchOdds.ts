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
// Last fetched: 2026-06-26T08:48:23.847Z
// Match markets: 39 / 99
// Strength calibrations: 40 teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * 39 markets fetched on 2026-06-26T08:48:23.847Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BIH_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CZE_RSA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ECU_GER: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  ENG_GHA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_IRQ: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_CIV: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GHA_PAN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  IRQ_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  JPN_SWE: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  KSA_URU: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  MAR_HAI: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NOR_FRA: { pHome: 0.2040, pDraw: 0.1940, pAway: 0.6020 },
  PAN_ENG: { pHome: 0.0452, pDraw: 0.1055, pAway: 0.8492 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  RSA_CAN: { pHome: 0.1658, pDraw: 0.2663, pAway: 0.5678 },
  SCO_BRA: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SCO_MAR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SEN_IRQ: { pHome: 0.7910, pDraw: 0.1343, pAway: 0.0746 },
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
 * 40 teams covered. Teams at the floor (10) reflect market odds near zero.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
  FRA: 98,
  ARG: 93,
  ESP: 91,
  ENG: 84,
  POR: 80,
  NED: 72,
  BRA: 71,
  GER: 66,
  NOR: 61,
  USA: 58,
  COL: 42,
  MAR: 42,
  JPN: 39,
  MEX: 39,
  BEL: 35,
  SUI: 31,
  ECU: 21,
  CRO: 17,
  ALG: 10,
  AUS: 10,
  AUT: 10,
  BIH: 10,
  CAN: 10,
  CIV: 10,
  COD: 10,
  CPV: 10,
  EGY: 10,
  GHA: 10,
  IRN: 10,
  IRQ: 10,
  KOR: 10,
  KSA: 10,
  NZL: 10,
  PAR: 10,
  RSA: 10,
  SCO: 10,
  SEN: 10,
  SWE: 10,
  URU: 10,
  UZB: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-26T08:48:23.847Z';
