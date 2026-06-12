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
// Last fetched: 2026-06-12T14:31:50.469Z
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
 * 38 markets fetched on 2026-06-12T14:31:50.469Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6059, pDraw: 0.2315, pAway: 0.1626 },
  AUS_TUR: { pHome: 0.1841, pDraw: 0.2537, pAway: 0.5622 },
  AUT_JOR: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  BEL_EGY: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  BEL_IRN: { pHome: 0.6884, pDraw: 0.1960, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.5829, pDraw: 0.2563, pAway: 0.1608 },
  BRA_MAR: { pHome: 0.5920, pDraw: 0.2438, pAway: 0.1642 },
  CAN_BIH: { pHome: 0.5323, pDraw: 0.2736, pAway: 0.1940 },
  CAN_QAT: { pHome: 0.7512, pDraw: 0.1642, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.5678, pDraw: 0.2462, pAway: 0.1859 },
  ECU_GER: { pHome: 0.1940, pDraw: 0.2537, pAway: 0.5522 },
  ENG_GHA: { pHome: 0.7340, pDraw: 0.1626, pAway: 0.1034 },
  ESP_CPV: { pHome: 0.9018, pDraw: 0.0663, pAway: 0.0319 },
  ESP_KSA: { pHome: 0.8767, pDraw: 0.0842, pAway: 0.0391 },
  FRA_IRQ: { pHome: 0.8737, pDraw: 0.0949, pAway: 0.0315 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6256, pDraw: 0.2020, pAway: 0.1724 },
  GHA_PAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  IRQ_NOR: { pHome: 0.0647, pDraw: 0.1244, pAway: 0.8109 },
  JPN_SWE: { pHome: 0.4680, pDraw: 0.2709, pAway: 0.2611 },
  KSA_URU: { pHome: 0.1156, pDraw: 0.2161, pAway: 0.6683 },
  MAR_HAI: { pHome: 0.7313, pDraw: 0.1741, pAway: 0.0945 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.4826, pDraw: 0.2637, pAway: 0.2537 },
  NED_SWE: { pHome: 0.5862, pDraw: 0.2315, pAway: 0.1823 },
  NOR_FRA: { pHome: 0.2239, pDraw: 0.2537, pAway: 0.5224 },
  PAN_ENG: { pHome: 0.1034, pDraw: 0.1527, pAway: 0.7438 },
  QAT_SUI: { pHome: 0.0576, pDraw: 0.1353, pAway: 0.8070 },
  SCO_BRA: { pHome: 0.1429, pDraw: 0.1921, pAway: 0.6650 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6784, pDraw: 0.2161, pAway: 0.1055 },
  SUI_BIH: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  SUI_CAN: { pHome: 0.4400, pDraw: 0.2850, pAway: 0.2750 },
  TUN_JPN: { pHome: 0.1542, pDraw: 0.2637, pAway: 0.5821 },
  TUN_NED: { pHome: 0.1324, pDraw: 0.2255, pAway: 0.6422 },
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
  ESP: 96,
  FRA: 94,
  POR: 86,
  ENG: 85,
  ARG: 81,
  BRA: 80,
  GER: 70,
  NED: 66,
  NOR: 54,
  JPN: 51,
  BEL: 50,
  COL: 46,
  MAR: 44,
  MEX: 42,
  SUI: 41,
  USA: 37,
  TUR: 35,
  URU: 33,
  CRO: 31,
  ECU: 31,
  SEN: 25,
  AUT: 17,
  KOR: 17,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-12T14:31:50.469Z';
