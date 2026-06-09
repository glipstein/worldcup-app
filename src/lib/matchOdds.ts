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
// Last fetched: 2026-06-09T02:01:46.269Z
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
 * 38 markets fetched on 2026-06-09T02:01:46.269Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  AUS_TUR: { pHome: 0.1823, pDraw: 0.2611, pAway: 0.5567 },
  AUT_JOR: { pHome: 0.7387, pDraw: 0.1658, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  BEL_IRN: { pHome: 0.6985, pDraw: 0.1960, pAway: 0.1055 },
  BIH_QAT: { pHome: 0.6150, pDraw: 0.2350, pAway: 0.1500 },
  BRA_MAR: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  CAN_BIH: { pHome: 0.5423, pDraw: 0.2637, pAway: 0.1940 },
  CAN_QAT: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.4925, pDraw: 0.2836, pAway: 0.2239 },
  ECU_GER: { pHome: 0.1961, pDraw: 0.2402, pAway: 0.5637 },
  ENG_GHA: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  ESP_CPV: { pHome: 0.8969, pDraw: 0.0709, pAway: 0.0322 },
  ESP_KSA: { pHome: 0.8810, pDraw: 0.0846, pAway: 0.0343 },
  FRA_IRQ: { pHome: 0.8667, pDraw: 0.0952, pAway: 0.0381 },
  FRA_SEN: { pHome: 0.6683, pDraw: 0.2060, pAway: 0.1256 },
  GER_CIV: { pHome: 0.6219, pDraw: 0.2040, pAway: 0.1741 },
  GHA_PAN: { pHome: 0.4627, pDraw: 0.2736, pAway: 0.2637 },
  IRQ_NOR: { pHome: 0.0647, pDraw: 0.1343, pAway: 0.8010 },
  JPN_SWE: { pHome: 0.4585, pDraw: 0.2780, pAway: 0.2634 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7313, pDraw: 0.1791, pAway: 0.0896 },
  MEX_RSA: { pHome: 0.6884, pDraw: 0.2060, pAway: 0.1055 },
  NED_JPN: { pHome: 0.4721, pDraw: 0.2690, pAway: 0.2589 },
  NED_SWE: { pHome: 0.5920, pDraw: 0.2338, pAway: 0.1741 },
  NOR_FRA: { pHome: 0.2189, pDraw: 0.2587, pAway: 0.5224 },
  PAN_ENG: { pHome: 0.0900, pDraw: 0.1550, pAway: 0.7550 },
  QAT_SUI: { pHome: 0.0644, pDraw: 0.1358, pAway: 0.7998 },
  SCO_BRA: { pHome: 0.1330, pDraw: 0.2020, pAway: 0.6650 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6733, pDraw: 0.2030, pAway: 0.1238 },
  SUI_BIH: { pHome: 0.5980, pDraw: 0.2362, pAway: 0.1658 },
  SUI_CAN: { pHome: 0.4412, pDraw: 0.2892, pAway: 0.2696 },
  TUN_JPN: { pHome: 0.1741, pDraw: 0.2637, pAway: 0.5622 },
  TUN_NED: { pHome: 0.1324, pDraw: 0.2157, pAway: 0.6520 },
  URU_CPV: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
  USA_AUS: { pHome: 0.5522, pDraw: 0.2438, pAway: 0.2040 },
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
  ESP: 94,
  FRA: 94,
  ENG: 86,
  POR: 84,
  ARG: 80,
  BRA: 80,
  GER: 70,
  NED: 64,
  NOR: 54,
  BEL: 52,
  JPN: 51,
  COL: 49,
  MAR: 49,
  MEX: 42,
  TUR: 39,
  USA: 37,
  SUI: 35,
  URU: 35,
  CRO: 33,
  ECU: 31,
  SEN: 25,
  AUT: 17,
  CIV: 17,
  SWE: 17,
  CAN: 11,
  KOR: 11,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-09T02:01:46.269Z';
