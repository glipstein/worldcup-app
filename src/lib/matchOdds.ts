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
// Last fetched: 2026-06-29T19:41:18.854Z
// Match markets: 47 / 99
// Strength calibrations: 31 teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * 47 markets fetched on 2026-06-29T19:41:18.854Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  ARG_CPV: { pHome: 0.8421, pDraw: 0.1146, pAway: 0.0433 },
  AUS_EGY: { pHome: 0.2836, pDraw: 0.3333, pAway: 0.3831 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_SEN: { pHome: 0.4328, pDraw: 0.2935, pAway: 0.2736 },
  BIH_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BRA_JPN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_NOR: { pHome: 0.2663, pDraw: 0.2764, pAway: 0.4573 },
  CZE_RSA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ECU_GER: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  ENG_GHA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_AUT: { pHome: 0.7512, pDraw: 0.1741, pAway: 0.0746 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_IRQ: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  FRA_SWE: { pHome: 0.7711, pDraw: 0.1542, pAway: 0.0746 },
  GER_CIV: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_PAR: { pHome: 0.7313, pDraw: 0.1841, pAway: 0.0846 },
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
 * 31 teams covered. Teams at the floor (10) reflect market odds near zero.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
  FRA: 100,
  ARG: 99,
  ESP: 86,
  ENG: 85,
  BRA: 77,
  POR: 74,
  NED: 69,
  GER: 67,
  COL: 54,
  USA: 53,
  NOR: 51,
  BEL: 41,
  MAR: 39,
  MEX: 39,
  SUI: 31,
  ECU: 21,
  SEN: 17,
  CRO: 11,
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
  JPN: 10,
  PAR: 10,
  SWE: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-29T19:41:18.854Z';
