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
// Last fetched: 2026-06-15T16:53:56.942Z
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
 * 38 markets fetched on 2026-06-15T16:53:56.942Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6219, pDraw: 0.2239, pAway: 0.1542 },
  AUS_TUR: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  AUT_JOR: { pHome: 0.7286, pDraw: 0.1759, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.6119, pDraw: 0.2338, pAway: 0.1542 },
  BEL_IRN: { pHome: 0.6915, pDraw: 0.1940, pAway: 0.1144 },
  BIH_QAT: { pHome: 0.6219, pDraw: 0.2239, pAway: 0.1542 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 0.7612, pDraw: 0.1642, pAway: 0.0746 },
  CIV_ECU: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  CZE_RSA: { pHome: 0.5423, pDraw: 0.2537, pAway: 0.2040 },
  ECU_GER: { pHome: 0.1960, pDraw: 0.2362, pAway: 0.5678 },
  ENG_GHA: { pHome: 0.7438, pDraw: 0.1626, pAway: 0.0936 },
  ESP_CPV: { pHome: 0.8042, pDraw: 0.1489, pAway: 0.0470 },
  ESP_KSA: { pHome: 0.8892, pDraw: 0.0745, pAway: 0.0363 },
  FRA_IRQ: { pHome: 0.8846, pDraw: 0.0850, pAway: 0.0305 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6281, pDraw: 0.2060, pAway: 0.1658 },
  GHA_PAN: { pHome: 0.4372, pDraw: 0.2864, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0547, pDraw: 0.1244, pAway: 0.8209 },
  JPN_SWE: { pHome: 0.4455, pDraw: 0.2822, pAway: 0.2723 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7475, pDraw: 0.1634, pAway: 0.0891 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  NED_SWE: { pHome: 0.5779, pDraw: 0.2362, pAway: 0.1859 },
  NOR_FRA: { pHome: 0.2217, pDraw: 0.2512, pAway: 0.5271 },
  PAN_ENG: { pHome: 0.0990, pDraw: 0.1436, pAway: 0.7574 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  SCO_BRA: { pHome: 0.1429, pDraw: 0.1724, pAway: 0.6847 },
  SCO_MAR: { pHome: 0.1741, pDraw: 0.2637, pAway: 0.5622 },
  SEN_IRQ: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
  SUI_BIH: { pHome: 0.6158, pDraw: 0.2315, pAway: 0.1527 },
  SUI_CAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  TUN_JPN: { pHome: 0.1343, pDraw: 0.2239, pAway: 0.6418 },
  TUN_NED: { pHome: 0.0964, pDraw: 0.1675, pAway: 0.7360 },
  URU_CPV: { pHome: 0.6784, pDraw: 0.2060, pAway: 0.1156 },
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
  ESP: 95,
  FRA: 95,
  POR: 86,
  ENG: 84,
  ARG: 79,
  BRA: 75,
  GER: 74,
  NED: 70,
  NOR: 54,
  MAR: 53,
  USA: 50,
  BEL: 49,
  JPN: 47,
  COL: 44,
  MEX: 41,
  CRO: 31,
  SUI: 31,
  URU: 31,
  SEN: 25,
  CIV: 21,
  SWE: 21,
  AUT: 17,
  ECU: 17,
  KOR: 17,
  TUR: 17,
  AUS: 11,
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
export const MATCH_ODDS_FETCHED_AT = '2026-06-15T16:53:56.942Z';
