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
// Last fetched: 2026-06-17T10:24:26.101Z
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
 * 38 markets fetched on 2026-06-17T10:24:26.101Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6256, pDraw: 0.2315, pAway: 0.1429 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
  BIH_QAT: { pHome: 0.6181, pDraw: 0.2261, pAway: 0.1558 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 0.7512, pDraw: 0.1642, pAway: 0.0846 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CZE_RSA: { pHome: 0.5477, pDraw: 0.2563, pAway: 0.1960 },
  ECU_GER: { pHome: 0.1940, pDraw: 0.2338, pAway: 0.5721 },
  ENG_GHA: { pHome: 0.7413, pDraw: 0.1642, pAway: 0.0945 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 0.8754, pDraw: 0.0850, pAway: 0.0395 },
  FRA_IRQ: { pHome: 0.8741, pDraw: 0.0938, pAway: 0.0321 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_CIV: { pHome: 0.6318, pDraw: 0.2040, pAway: 0.1642 },
  GHA_PAN: { pHome: 0.4129, pDraw: 0.2935, pAway: 0.2935 },
  IRQ_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  JPN_SWE: { pHome: 0.4527, pDraw: 0.2736, pAway: 0.2736 },
  KSA_URU: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  MAR_HAI: { pHome: 0.7487, pDraw: 0.1658, pAway: 0.0854 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 0.5721, pDraw: 0.2438, pAway: 0.1841 },
  NOR_FRA: { pHome: 0.2217, pDraw: 0.2414, pAway: 0.5369 },
  PAN_ENG: { pHome: 0.0955, pDraw: 0.1357, pAway: 0.7688 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  SCO_BRA: { pHome: 0.1343, pDraw: 0.1741, pAway: 0.6915 },
  SCO_MAR: { pHome: 0.1741, pDraw: 0.2637, pAway: 0.5622 },
  SEN_IRQ: { pHome: 0.7114, pDraw: 0.1841, pAway: 0.1045 },
  SUI_BIH: { pHome: 0.6219, pDraw: 0.2338, pAway: 0.1443 },
  SUI_CAN: { pHome: 0.4483, pDraw: 0.2808, pAway: 0.2709 },
  TUN_JPN: { pHome: 0.1244, pDraw: 0.2338, pAway: 0.6418 },
  TUN_NED: { pHome: 0.1045, pDraw: 0.1542, pAway: 0.7413 },
  URU_CPV: { pHome: 0.6617, pDraw: 0.2239, pAway: 0.1144 },
  USA_AUS: { pHome: 0.6059, pDraw: 0.2118, pAway: 0.1823 },
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
  FRA: 97,
  ESP: 90,
  ARG: 86,
  ENG: 85,
  POR: 85,
  BRA: 75,
  GER: 72,
  NED: 66,
  NOR: 55,
  MAR: 53,
  USA: 52,
  BEL: 45,
  JPN: 45,
  COL: 42,
  MEX: 42,
  SUI: 31,
  CRO: 28,
  SEN: 25,
  URU: 25,
  CIV: 21,
  SWE: 21,
  AUS: 17,
  AUT: 17,
  ECU: 17,
  TUR: 17,
  KOR: 11,
  ALG: 10,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-17T10:24:26.101Z';
