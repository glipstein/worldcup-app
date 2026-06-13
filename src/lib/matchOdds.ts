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
// Last fetched: 2026-06-13T02:09:14.124Z
// Match markets: 38 / 99
// Strength calibrations: 48 teams
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket 3-way match odds keyed by "HOMEABBR_AWAYABBR".
 * 38 markets fetched on 2026-06-13T02:09:14.124Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6059, pDraw: 0.2315, pAway: 0.1626 },
  AUS_TUR: { pHome: 0.1841, pDraw: 0.2537, pAway: 0.5622 },
  AUT_JOR: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  BEL_EGY: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  BEL_IRN: { pHome: 0.6884, pDraw: 0.1960, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.5850, pDraw: 0.2500, pAway: 0.1650 },
  BRA_MAR: { pHome: 0.5779, pDraw: 0.2462, pAway: 0.1759 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 0.7512, pDraw: 0.1642, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2637, pDraw: 0.3333, pAway: 0.4030 },
  CZE_RSA: { pHome: 0.5522, pDraw: 0.2438, pAway: 0.2040 },
  ECU_GER: { pHome: 0.1940, pDraw: 0.2537, pAway: 0.5522 },
  ENG_GHA: { pHome: 0.7340, pDraw: 0.1626, pAway: 0.1034 },
  ESP_CPV: { pHome: 0.8996, pDraw: 0.0671, pAway: 0.0333 },
  ESP_KSA: { pHome: 0.8879, pDraw: 0.0744, pAway: 0.0377 },
  FRA_IRQ: { pHome: 0.8685, pDraw: 0.0943, pAway: 0.0372 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6256, pDraw: 0.2020, pAway: 0.1724 },
  GHA_PAN: { pHome: 0.4372, pDraw: 0.2864, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0647, pDraw: 0.1244, pAway: 0.8109 },
  JPN_SWE: { pHome: 0.4627, pDraw: 0.2736, pAway: 0.2637 },
  KSA_URU: { pHome: 0.1156, pDraw: 0.2161, pAway: 0.6683 },
  MAR_HAI: { pHome: 0.7150, pDraw: 0.1800, pAway: 0.1050 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.4774, pDraw: 0.2663, pAway: 0.2563 },
  NED_SWE: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
  NOR_FRA: { pHome: 0.2217, pDraw: 0.2512, pAway: 0.5271 },
  PAN_ENG: { pHome: 0.1034, pDraw: 0.1429, pAway: 0.7537 },
  QAT_SUI: { pHome: 0.0591, pDraw: 0.1351, pAway: 0.8058 },
  SCO_BRA: { pHome: 0.1429, pDraw: 0.1921, pAway: 0.6650 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6814, pDraw: 0.2108, pAway: 0.1078 },
  SUI_BIH: { pHome: 0.6059, pDraw: 0.2315, pAway: 0.1626 },
  SUI_CAN: { pHome: 0.4505, pDraw: 0.2822, pAway: 0.2673 },
  TUN_JPN: { pHome: 0.1626, pDraw: 0.2611, pAway: 0.5764 },
  TUN_NED: { pHome: 0.1330, pDraw: 0.2118, pAway: 0.6552 },
  URU_CPV: { pHome: 0.6847, pDraw: 0.2020, pAway: 0.1133 },
  USA_AUS: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
};

/**
 * Market-calibrated team strengths (0-100) derived from Polymarket tournament
 * winner odds.  Used by simulation.ts as the fallback strength when no
 * match-specific market exists (e.g. hypothetical bracket paths).
 *
 * 48 teams covered. Teams at the floor (10) reflect market odds near zero.
 * Sorted strongest-first for readability.
 */
export const MARKET_STRENGTH: Record<string, number> = {
  ESP: 95,
  FRA: 94,
  POR: 85,
  ENG: 83,
  BRA: 80,
  ARG: 79,
  GER: 70,
  NED: 68,
  NOR: 54,
  BEL: 50,
  JPN: 50,
  COL: 46,
  USA: 44,
  MAR: 42,
  MEX: 42,
  SUI: 42,
  TUR: 39,
  URU: 33,
  CRO: 31,
  ECU: 31,
  SEN: 25,
  AUT: 17,
  KOR: 17,
  CIV: 11,
  SWE: 11,
  ALG: 10,
  AUS: 10,
  BIH: 10,
  CAN: 10,
  COD: 10,
  CPV: 10,
  CUW: 10,
  CZE: 10,
  EGY: 10,
  GHA: 10,
  HAI: 10,
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
  TUN: 10,
  UZB: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-13T02:09:14.124Z';
