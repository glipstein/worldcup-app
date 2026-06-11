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
// Last fetched: 2026-06-11T20:09:21.333Z
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
 * 38 markets fetched on 2026-06-11T20:09:21.333Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  AUS_TUR: { pHome: 0.1741, pDraw: 0.2537, pAway: 0.5721 },
  AUT_JOR: { pHome: 0.7387, pDraw: 0.1658, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.5920, pDraw: 0.2438, pAway: 0.1642 },
  BEL_IRN: { pHome: 0.6884, pDraw: 0.1960, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.5842, pDraw: 0.2525, pAway: 0.1634 },
  BRA_MAR: { pHome: 0.5721, pDraw: 0.2537, pAway: 0.1741 },
  CAN_BIH: { pHome: 0.5276, pDraw: 0.2663, pAway: 0.2060 },
  CAN_QAT: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.5522, pDraw: 0.2637, pAway: 0.1841 },
  ECU_GER: { pHome: 0.2000, pDraw: 0.2488, pAway: 0.5512 },
  ENG_GHA: { pHome: 0.7413, pDraw: 0.1642, pAway: 0.0945 },
  ESP_CPV: { pHome: 0.8965, pDraw: 0.0693, pAway: 0.0342 },
  ESP_KSA: { pHome: 0.8733, pDraw: 0.0848, pAway: 0.0419 },
  FRA_IRQ: { pHome: 0.8586, pDraw: 0.1042, pAway: 0.0372 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6219, pDraw: 0.2040, pAway: 0.1741 },
  GHA_PAN: { pHome: 0.4472, pDraw: 0.2764, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0640, pDraw: 0.1330, pAway: 0.8030 },
  JPN_SWE: { pHome: 0.4634, pDraw: 0.2732, pAway: 0.2634 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7313, pDraw: 0.1741, pAway: 0.0945 },
  MEX_RSA: { pHome: 0.8628, pDraw: 0.1147, pAway: 0.0224 },
  NED_JPN: { pHome: 0.4726, pDraw: 0.2736, pAway: 0.2537 },
  NED_SWE: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
  NOR_FRA: { pHome: 0.2293, pDraw: 0.2585, pAway: 0.5122 },
  PAN_ENG: { pHome: 0.1034, pDraw: 0.1527, pAway: 0.7438 },
  QAT_SUI: { pHome: 0.0642, pDraw: 0.1344, pAway: 0.8014 },
  SCO_BRA: { pHome: 0.1527, pDraw: 0.1921, pAway: 0.6552 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6881, pDraw: 0.2079, pAway: 0.1040 },
  SUI_BIH: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  SUI_CAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  TUN_JPN: { pHome: 0.1642, pDraw: 0.2637, pAway: 0.5721 },
  TUN_NED: { pHome: 0.1317, pDraw: 0.2195, pAway: 0.6488 },
  URU_CPV: { pHome: 0.6832, pDraw: 0.2030, pAway: 0.1139 },
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
  POR: 86,
  ENG: 85,
  ARG: 81,
  BRA: 81,
  GER: 70,
  NED: 68,
  NOR: 53,
  BEL: 50,
  COL: 46,
  JPN: 46,
  MEX: 46,
  MAR: 44,
  SUI: 39,
  USA: 37,
  TUR: 35,
  URU: 33,
  CRO: 31,
  ECU: 31,
  SEN: 25,
  AUT: 17,
  CAN: 11,
  CIV: 11,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-11T20:09:21.333Z';
