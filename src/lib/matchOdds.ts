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
// Last fetched: 2026-06-11T15:32:31.283Z
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
 * 38 markets fetched on 2026-06-11T15:32:31.283Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  AUS_TUR: { pHome: 0.1759, pDraw: 0.2563, pAway: 0.5678 },
  AUT_JOR: { pHome: 0.7387, pDraw: 0.1658, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.5920, pDraw: 0.2438, pAway: 0.1642 },
  BEL_IRN: { pHome: 0.6946, pDraw: 0.1921, pAway: 0.1133 },
  BIH_QAT: { pHome: 0.5862, pDraw: 0.2512, pAway: 0.1626 },
  BRA_MAR: { pHome: 0.5721, pDraw: 0.2537, pAway: 0.1741 },
  CAN_BIH: { pHome: 0.5276, pDraw: 0.2663, pAway: 0.2060 },
  CAN_QAT: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.4925, pDraw: 0.2836, pAway: 0.2239 },
  ECU_GER: { pHome: 0.2010, pDraw: 0.2451, pAway: 0.5539 },
  ENG_GHA: { pHome: 0.7413, pDraw: 0.1642, pAway: 0.0945 },
  ESP_CPV: { pHome: 0.9005, pDraw: 0.0672, pAway: 0.0323 },
  ESP_KSA: { pHome: 0.8748, pDraw: 0.0845, pAway: 0.0408 },
  FRA_IRQ: { pHome: 0.8611, pDraw: 0.1045, pAway: 0.0343 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6219, pDraw: 0.2040, pAway: 0.1741 },
  GHA_PAN: { pHome: 0.4472, pDraw: 0.2764, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0547, pDraw: 0.1343, pAway: 0.8109 },
  JPN_SWE: { pHome: 0.4634, pDraw: 0.2732, pAway: 0.2634 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7313, pDraw: 0.1741, pAway: 0.0945 },
  MEX_RSA: { pHome: 0.6915, pDraw: 0.2040, pAway: 0.1045 },
  NED_JPN: { pHome: 0.4673, pDraw: 0.2764, pAway: 0.2563 },
  NED_SWE: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
  NOR_FRA: { pHome: 0.2293, pDraw: 0.2585, pAway: 0.5122 },
  PAN_ENG: { pHome: 0.1034, pDraw: 0.1527, pAway: 0.7438 },
  QAT_SUI: { pHome: 0.0633, pDraw: 0.1345, pAway: 0.8022 },
  SCO_BRA: { pHome: 0.1443, pDraw: 0.1940, pAway: 0.6617 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6915, pDraw: 0.2040, pAway: 0.1045 },
  SUI_BIH: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  SUI_CAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  TUN_JPN: { pHome: 0.1642, pDraw: 0.2637, pAway: 0.5721 },
  TUN_NED: { pHome: 0.1317, pDraw: 0.2195, pAway: 0.6488 },
  URU_CPV: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
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
  ESP: 96,
  FRA: 94,
  ENG: 86,
  POR: 86,
  ARG: 82,
  BRA: 81,
  GER: 70,
  NED: 66,
  NOR: 53,
  BEL: 50,
  COL: 46,
  JPN: 46,
  MAR: 44,
  MEX: 41,
  SUI: 39,
  TUR: 37,
  USA: 37,
  URU: 33,
  CRO: 31,
  ECU: 31,
  SEN: 28,
  AUT: 17,
  CIV: 17,
  CAN: 11,
  SWE: 11,
  ALG: 10,
  AUS: 10,
  BIH: 10,
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
  KOR: 10,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-11T15:32:31.283Z';
