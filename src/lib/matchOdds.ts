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
// Last fetched: 2026-06-14T02:32:44.416Z
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
 * 38 markets fetched on 2026-06-14T02:32:44.416Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.6188, pDraw: 0.2228, pAway: 0.1584 },
  AUS_TUR: { pHome: 0.1741, pDraw: 0.2537, pAway: 0.5721 },
  AUT_JOR: { pHome: 0.7214, pDraw: 0.1741, pAway: 0.1045 },
  BEL_EGY: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  BEL_IRN: { pHome: 0.6915, pDraw: 0.1940, pAway: 0.1144 },
  BIH_QAT: { pHome: 0.6318, pDraw: 0.2239, pAway: 0.1443 },
  BRA_MAR: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_BIH: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  CAN_QAT: { pHome: 0.7612, pDraw: 0.1642, pAway: 0.0746 },
  CIV_ECU: { pHome: 0.2764, pDraw: 0.3367, pAway: 0.3869 },
  CZE_RSA: { pHome: 0.5477, pDraw: 0.2462, pAway: 0.2060 },
  ECU_GER: { pHome: 0.2020, pDraw: 0.2414, pAway: 0.5567 },
  ENG_GHA: { pHome: 0.7438, pDraw: 0.1626, pAway: 0.0936 },
  ESP_CPV: { pHome: 0.8987, pDraw: 0.0680, pAway: 0.0333 },
  ESP_KSA: { pHome: 0.8883, pDraw: 0.0744, pAway: 0.0372 },
  FRA_IRQ: { pHome: 0.8784, pDraw: 0.0844, pAway: 0.0372 },
  FRA_SEN: { pHome: 0.6617, pDraw: 0.2139, pAway: 0.1244 },
  GER_CIV: { pHome: 0.6287, pDraw: 0.1980, pAway: 0.1733 },
  GHA_PAN: { pHome: 0.4372, pDraw: 0.2864, pAway: 0.2764 },
  IRQ_NOR: { pHome: 0.0547, pDraw: 0.1244, pAway: 0.8209 },
  JPN_SWE: { pHome: 0.4627, pDraw: 0.2736, pAway: 0.2637 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7413, pDraw: 0.1642, pAway: 0.0945 },
  MEX_RSA: { pHome: 1.0000, pDraw: 0.0000, pAway: 0.0000 },
  NED_JPN: { pHome: 0.4774, pDraw: 0.2663, pAway: 0.2563 },
  NED_SWE: { pHome: 0.5920, pDraw: 0.2338, pAway: 0.1741 },
  NOR_FRA: { pHome: 0.2178, pDraw: 0.2525, pAway: 0.5297 },
  PAN_ENG: { pHome: 0.0995, pDraw: 0.1443, pAway: 0.7562 },
  QAT_SUI: { pHome: 0.0000, pDraw: 1.0000, pAway: 0.0000 },
  SCO_BRA: { pHome: 0.1429, pDraw: 0.1724, pAway: 0.6847 },
  SCO_MAR: { pHome: 0.1921, pDraw: 0.2611, pAway: 0.5468 },
  SEN_IRQ: { pHome: 0.6850, pDraw: 0.2050, pAway: 0.1100 },
  SUI_BIH: { pHome: 0.6119, pDraw: 0.2338, pAway: 0.1542 },
  SUI_CAN: { pHome: 0.4428, pDraw: 0.2836, pAway: 0.2736 },
  TUN_JPN: { pHome: 0.1542, pDraw: 0.2637, pAway: 0.5821 },
  TUN_NED: { pHome: 0.1330, pDraw: 0.2118, pAway: 0.6552 },
  URU_CPV: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
  USA_AUS: { pHome: 0.6324, pDraw: 0.2059, pAway: 0.1618 },
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
  POR: 87,
  ENG: 83,
  ARG: 79,
  BRA: 78,
  GER: 70,
  NED: 68,
  NOR: 54,
  MAR: 53,
  BEL: 50,
  USA: 50,
  COL: 45,
  JPN: 45,
  TUR: 42,
  MEX: 41,
  SUI: 33,
  CRO: 31,
  URU: 31,
  ECU: 28,
  SEN: 25,
  AUT: 11,
  CIV: 11,
  KOR: 11,
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
  SWE: 10,
  TUN: 10,
  UZB: 10,
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-14T02:32:44.416Z';
