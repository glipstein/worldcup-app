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
// Last fetched: 2026-06-10T09:38:49.928Z
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
 * 38 markets fetched on 2026-06-10T09:38:49.928Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.5950, pDraw: 0.2400, pAway: 0.1650 },
  AUS_TUR: { pHome: 0.1759, pDraw: 0.2563, pAway: 0.5678 },
  AUT_JOR: { pHome: 0.7387, pDraw: 0.1658, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  BEL_IRN: { pHome: 0.7000, pDraw: 0.1950, pAway: 0.1050 },
  BIH_QAT: { pHome: 0.6150, pDraw: 0.2350, pAway: 0.1500 },
  BRA_MAR: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  CAN_BIH: { pHome: 0.5276, pDraw: 0.2663, pAway: 0.2060 },
  CAN_QAT: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.4925, pDraw: 0.2836, pAway: 0.2239 },
  ECU_GER: { pHome: 0.1931, pDraw: 0.2475, pAway: 0.5594 },
  ENG_GHA: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  ESP_CPV: { pHome: 0.9009, pDraw: 0.0667, pAway: 0.0324 },
  ESP_KSA: { pHome: 0.8711, pDraw: 0.0846, pAway: 0.0443 },
  FRA_IRQ: { pHome: 0.8650, pDraw: 0.0950, pAway: 0.0400 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6219, pDraw: 0.2040, pAway: 0.1741 },
  GHA_PAN: { pHome: 0.4627, pDraw: 0.2736, pAway: 0.2637 },
  IRQ_NOR: { pHome: 0.0600, pDraw: 0.1350, pAway: 0.8050 },
  JPN_SWE: { pHome: 0.4559, pDraw: 0.2794, pAway: 0.2647 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7340, pDraw: 0.1724, pAway: 0.0936 },
  MEX_RSA: { pHome: 0.6915, pDraw: 0.2040, pAway: 0.1045 },
  NED_JPN: { pHome: 0.4673, pDraw: 0.2663, pAway: 0.2663 },
  NED_SWE: { pHome: 0.5891, pDraw: 0.2327, pAway: 0.1782 },
  NOR_FRA: { pHome: 0.2139, pDraw: 0.2537, pAway: 0.5323 },
  PAN_ENG: { pHome: 0.0945, pDraw: 0.1542, pAway: 0.7512 },
  QAT_SUI: { pHome: 0.0647, pDraw: 0.1343, pAway: 0.8010 },
  SCO_BRA: { pHome: 0.1357, pDraw: 0.1960, pAway: 0.6683 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6814, pDraw: 0.2059, pAway: 0.1127 },
  SUI_BIH: { pHome: 0.6020, pDraw: 0.2338, pAway: 0.1642 },
  SUI_CAN: { pHome: 0.4483, pDraw: 0.2857, pAway: 0.2660 },
  TUN_JPN: { pHome: 0.1658, pDraw: 0.2663, pAway: 0.5678 },
  TUN_NED: { pHome: 0.1317, pDraw: 0.2195, pAway: 0.6488 },
  URU_CPV: { pHome: 0.6847, pDraw: 0.2020, pAway: 0.1133 },
  USA_AUS: { pHome: 0.5495, pDraw: 0.2426, pAway: 0.2079 },
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
  ARG: 81,
  BRA: 80,
  GER: 70,
  NED: 64,
  NOR: 54,
  BEL: 51,
  COL: 49,
  JPN: 46,
  MAR: 46,
  MEX: 41,
  SUI: 37,
  TUR: 37,
  USA: 37,
  URU: 35,
  CRO: 33,
  ECU: 31,
  SEN: 25,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-10T09:38:49.928Z';
