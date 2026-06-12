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
// Last fetched: 2026-06-12T19:51:04.314Z
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
 * 38 markets fetched on 2026-06-12T19:51:04.314Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6059, pDraw: 0.2315, pAway: 0.1626 },
  AUS_TUR: { pHome: 0.1841, pDraw: 0.2537, pAway: 0.5622 },
  AUT_JOR: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  BEL_EGY: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  BEL_IRN: { pHome: 0.6884, pDraw: 0.1960, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.5800, pDraw: 0.2550, pAway: 0.1650 },
  BRA_MAR: { pHome: 0.5879, pDraw: 0.2462, pAway: 0.1658 },
  CAN_BIH: { pHome: 0.3134, pDraw: 0.3035, pAway: 0.3831 },
  CAN_QAT: { pHome: 0.7512, pDraw: 0.1642, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2637, pDraw: 0.3333, pAway: 0.4030 },
  CZE_RSA: { pHome: 0.5550, pDraw: 0.2450, pAway: 0.2000 },
  ECU_GER: { pHome: 0.1940, pDraw: 0.2537, pAway: 0.5522 },
  ENG_GHA: { pHome: 0.7340, pDraw: 0.1626, pAway: 0.1034 },
  ESP_CPV: { pHome: 0.9005, pDraw: 0.0672, pAway: 0.0323 },
  ESP_KSA: { pHome: 0.8872, pDraw: 0.0752, pAway: 0.0376 },
  FRA_IRQ: { pHome: 0.8676, pDraw: 0.0942, pAway: 0.0382 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6256, pDraw: 0.2020, pAway: 0.1724 },
  GHA_PAN: { pHome: 0.4372, pDraw: 0.2864, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0647, pDraw: 0.1244, pAway: 0.8109 },
  JPN_SWE: { pHome: 0.4680, pDraw: 0.2709, pAway: 0.2611 },
  KSA_URU: { pHome: 0.1156, pDraw: 0.2161, pAway: 0.6683 },
  MAR_HAI: { pHome: 0.7273, pDraw: 0.1768, pAway: 0.0960 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.4774, pDraw: 0.2663, pAway: 0.2563 },
  NED_SWE: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
  NOR_FRA: { pHome: 0.2217, pDraw: 0.2512, pAway: 0.5271 },
  PAN_ENG: { pHome: 0.1034, pDraw: 0.1429, pAway: 0.7537 },
  QAT_SUI: { pHome: 0.0576, pDraw: 0.1353, pAway: 0.8070 },
  SCO_BRA: { pHome: 0.1429, pDraw: 0.1921, pAway: 0.6650 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6847, pDraw: 0.2118, pAway: 0.1034 },
  SUI_BIH: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  SUI_CAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  TUN_JPN: { pHome: 0.1542, pDraw: 0.2637, pAway: 0.5821 },
  TUN_NED: { pHome: 0.1343, pDraw: 0.2040, pAway: 0.6617 },
  URU_CPV: { pHome: 0.6847, pDraw: 0.2020, pAway: 0.1133 },
  USA_AUS: { pHome: 0.5567, pDraw: 0.2414, pAway: 0.2020 },
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
  POR: 86,
  ENG: 83,
  BRA: 80,
  ARG: 79,
  GER: 70,
  NED: 67,
  NOR: 54,
  JPN: 51,
  BEL: 50,
  COL: 46,
  MAR: 44,
  MEX: 41,
  SUI: 41,
  TUR: 37,
  USA: 37,
  URU: 33,
  CRO: 31,
  ECU: 31,
  SEN: 25,
  AUT: 17,
  KOR: 17,
  CIV: 11,
  PAR: 11,
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
  QAT: 10,
  RSA: 10,
  SCO: 10,
  TUN: 10,
  UZB: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-12T19:51:04.314Z';
