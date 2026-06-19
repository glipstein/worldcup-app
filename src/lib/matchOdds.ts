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
// Last fetched: 2026-06-19T14:39:58.795Z
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
 * 38 markets fetched on 2026-06-19T14:39:58.795Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6119, pDraw: 0.2338, pAway: 0.1542 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  BEL_EGY: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  BEL_IRN: { pHome: 0.6784, pDraw: 0.2060, pAway: 0.1156 },
  BIH_QAT: { pHome: 0.6784, pDraw: 0.1960, pAway: 0.1256 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CZE_RSA: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ECU_GER: { pHome: 0.1859, pDraw: 0.2362, pAway: 0.5779 },
  ENG_GHA: { pHome: 0.7931, pDraw: 0.1429, pAway: 0.0640 },
  ESP_CPV: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  ESP_KSA: { pHome: 0.8784, pDraw: 0.0844, pAway: 0.0372 },
  FRA_IRQ: { pHome: 0.8981, pDraw: 0.0753, pAway: 0.0266 },
  FRA_SEN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  GER_CIV: { pHome: 0.6318, pDraw: 0.2040, pAway: 0.1642 },
  GHA_PAN: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  IRQ_NOR: { pHome: 0.0000, pDraw: 0.0000, pAway: 1.0000 },
  JPN_SWE: { pHome: 0.4428, pDraw: 0.2736, pAway: 0.2836 },
  KSA_URU: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  MAR_HAI: { pHome: 0.7512, pDraw: 0.1642, pAway: 0.0846 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 0.5522, pDraw: 0.2438, pAway: 0.2040 },
  NOR_FRA: { pHome: 0.2217, pDraw: 0.2315, pAway: 0.5468 },
  PAN_ENG: { pHome: 0.0846, pDraw: 0.1343, pAway: 0.7811 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  SCO_BRA: { pHome: 0.1244, pDraw: 0.1841, pAway: 0.6915 },
  SCO_MAR: { pHome: 0.1626, pDraw: 0.2611, pAway: 0.5764 },
  SEN_IRQ: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  SUI_BIH: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  SUI_CAN: { pHome: 0.3930, pDraw: 0.3134, pAway: 0.2935 },
  TUN_JPN: { pHome: 0.1330, pDraw: 0.2315, pAway: 0.6355 },
  TUN_NED: { pHome: 0.0945, pDraw: 0.1642, pAway: 0.7413 },
  URU_CPV: { pHome: 0.6650, pDraw: 0.2217, pAway: 0.1133 },
  USA_AUS: { pHome: 0.6080, pDraw: 0.2161, pAway: 0.1759 },
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
  ESP: 91,
  ENG: 90,
  ARG: 88,
  POR: 77,
  BRA: 75,
  GER: 72,
  NED: 64,
  MAR: 55,
  NOR: 54,
  USA: 54,
  COL: 45,
  BEL: 44,
  JPN: 44,
  MEX: 44,
  SUI: 31,
  CRO: 25,
  SEN: 21,
  SWE: 21,
  URU: 21,
  AUS: 17,
  AUT: 17,
  CIV: 17,
  ECU: 17,
  TUR: 17,
  CAN: 11,
  KOR: 11,
  ALG: 10,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-19T14:39:58.795Z';
