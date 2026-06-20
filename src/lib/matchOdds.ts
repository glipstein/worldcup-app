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
// Last fetched: 2026-06-20T19:08:17.932Z
// Match markets: 38 / 99
// Strength calibrations: 46 teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * 38 markets fetched on 2026-06-20T19:08:17.932Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6219, pDraw: 0.2338, pAway: 0.1443 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.6784, pDraw: 0.2060, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.6716, pDraw: 0.1940, pAway: 0.1343 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CZE_RSA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ECU_GER: { pHome: 0.1841, pDraw: 0.2438, pAway: 0.5721 },
  ENG_GHA: { pHome: 0.7931, pDraw: 0.1429, pAway: 0.0640 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 0.8837, pDraw: 0.0849, pAway: 0.0315 },
  FRA_IRQ: { pHome: 0.8983, pDraw: 0.0744, pAway: 0.0273 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_CIV: { pHome: 0.6884, pDraw: 0.1859, pAway: 0.1256 },
  GHA_PAN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  IRQ_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  JPN_SWE: { pHome: 0.4527, pDraw: 0.2836, pAway: 0.2637 },
  KSA_URU: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  MAR_HAI: { pHome: 0.8109, pDraw: 0.1343, pAway: 0.0547 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 0.9990, pDraw: 0.0005, pAway: 0.0005 },
  NOR_FRA: { pHome: 0.2161, pDraw: 0.2362, pAway: 0.5477 },
  PAN_ENG: { pHome: 0.0754, pDraw: 0.1256, pAway: 0.7990 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  SCO_BRA: { pHome: 0.1156, pDraw: 0.1759, pAway: 0.7085 },
  SCO_MAR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  SEN_IRQ: { pHome: 0.7487, pDraw: 0.1658, pAway: 0.0854 },
  SUI_BIH: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  SUI_CAN: { pHome: 0.3930, pDraw: 0.3134, pAway: 0.2935 },
  TUN_JPN: { pHome: 0.1244, pDraw: 0.2338, pAway: 0.6418 },
  TUN_NED: { pHome: 0.0846, pDraw: 0.1542, pAway: 0.7612 },
  URU_CPV: { pHome: 0.6716, pDraw: 0.2239, pAway: 0.1045 },
  USA_AUS: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
};

/**
 * Market-calibrated team strengths (0-100) derived from Polymarket tournament
 * winner odds.  Used by simulation.ts as the fallback strength when no
 * match-specific market exists (e.g. hypothetical bracket paths).
 *
 * 46 teams covered. Teams at the floor (10) reflect market odds near zero.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
  FRA: 99,
  ESP: 91,
  ENG: 89,
  ARG: 88,
  POR: 77,
  GER: 74,
  BRA: 73,
  NED: 70,
  USA: 60,
  MAR: 54,
  NOR: 54,
  BEL: 44,
  COL: 44,
  JPN: 39,
  MEX: 39,
  CRO: 25,
  SUI: 25,
  SEN: 21,
  URU: 21,
  CIV: 17,
  AUS: 11,
  AUT: 11,
  CAN: 11,
  ECU: 11,
  KOR: 11,
  ALG: 10,
  BIH: 10,
  COD: 10,
  CPV: 10,
  CUW: 10,
  CZE: 10,
  EGY: 10,
  GHA: 10,
  IRN: 10,
  IRQ: 10,
  JOR: 10,
  KSA: 10,
  NZL: 10,
  PAN: 10,
  PAR: 10,
  QAT: 10,
  RSA: 10,
  SCO: 10,
  SWE: 10,
  TUN: 10,
  UZB: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-20T19:08:17.932Z';
